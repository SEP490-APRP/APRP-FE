import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getWebSocketUrl, TOKEN_KEY } from '../../services/api.config';
import {
  Navigation, Play, Square, MapPin, ChevronRight,
  Loader2, Route, Zap
} from 'lucide-react';
import { globalShowAlert } from '@/components/common/Popup';

interface FakeGPSProps {
  orderId: number;           // orderId đang giao
  shopLat: number;           // tọa độ shop (điểm lấy hàng)
  shopLng: number;
  destLat: number;           // tọa độ nhà buyer (điểm giao)
  destLng: number;
  currentLat?: number;       // vị trí shipper hiện tại (optional, mặc định dùng vị trí gần shop)
  currentLng?: number;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

// Nội suy đường đi trực tiếp nếu OSRM bị timeout hoặc lỗi mạng
function createDirectRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, steps = 20): RoutePoint[] {
  const points: RoutePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    points.push({
      lat: fromLat + (toLat - fromLat) * fraction,
      lng: fromLng + (toLng - fromLng) * fraction,
    });
  }
  return points;
}

// Lấy đường đi thực tế từ OSRM (free, không cần API key) kèm fallback tự động
async function fetchRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<RoutePoint[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.routes?.length) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({ lat, lng }));
    }
  } catch (err) {
    console.warn('OSRM router fetch failed, fallback to direct route interpolation:', err);
  }
  return createDirectRoute(fromLat, fromLng, toLat, toLng);
}

// Tạo điểm xuất phát gần shop (offset nhỏ để simulate shipper đang ở gần đó)
function nearbyPoint(lat: number, lng: number, offsetKm = 0.5): RoutePoint {
  const offset = offsetKm / 111;
  return { lat: lat + offset, lng: lng + offset };
}

type Phase = 'idle' | 'loading' | 'to_shop' | 'at_shop' | 'to_buyer' | 'done';

const FakeGPS: React.FC<FakeGPSProps> = ({
  orderId, shopLat, shopLng, destLat, destLng,
  currentLat, currentLng,
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [currentPos, setCurrentPos] = useState<RoutePoint | null>(null);
  const [progress, setProgress] = useState(0);
  const [stepInfo, setStepInfo] = useState('');
  const [speed, setSpeed] = useState(3);
  // ✅ GPS thật của shipper tại thời điểm bấm "Bắt đầu"
  const [realStartPos, setRealStartPos] = useState<RoutePoint | null>(
    currentLat && currentLng ? { lat: currentLat, lng: currentLng } : null
  );
  const [gpsLoading, setGpsLoading] = useState(false);

  const stompClientRef = useRef<Client | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeRef = useRef<RoutePoint[]>([]);
  const stepIndexRef = useRef(0);

  // ✅ Lấy GPS thật của shipper khi mount
  useEffect(() => {
    if (currentLat && currentLng) return; // đã có từ props
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRealStartPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        // GPS thất bại → dùng điểm gần shop làm fallback
        setRealStartPos(nearbyPoint(shopLat, shopLng));
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ---- Kết nối WebSocket ----
  const connectWS = useCallback((): Promise<Client> => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem(TOKEN_KEY);
      const wsUrl = getWebSocketUrl();

      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('WebSocket connection timeout'));
        }
      }, 7000);

      const client = new Client({
        webSocketFactory: () => new (SockJS as any)(wsUrl),
        reconnectDelay: 0,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        onConnect: () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            setWsStatus('connected');
            resolve(client);
          }
        },
        onStompError: (frame) => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(new Error(frame.headers['message'] || 'STOMP error'));
          }
        },
        onWebSocketError: (err) => {
          console.warn('FakeGPS WS error:', err);
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(err);
          }
        },
        onWebSocketClose: () => {
          setWsStatus('disconnected');
        },
      });

      setWsStatus('connecting');
      client.activate();
      stompClientRef.current = client;
    });
  }, []);

  // ---- Gửi vị trí qua WebSocket ----
  const sendLocation = useCallback((lat: number, lng: number, deliveryPhase: string = 'TO_SHOP') => {
    const client = stompClientRef.current;
    if (!client?.connected) return;
    client.publish({
      destination: '/app/shipper/location',
      body: JSON.stringify({
        orderId,
        latitude: lat,
        longitude: lng,
        isFake: true, // ✅ Tracking dùng flag này để biết cắt đường hay không
        deliveryPhase,
      }),
    });
  }, [orderId]);

  // ---- Chạy route theo từng bước ----
  const runRoute = useCallback((route: RoutePoint[], phaseLabel: string, deliveryPhase: string, onDone: () => void) => {
    routeRef.current = route;
    stepIndexRef.current = 0;
    const total = route.length;

    intervalRef.current = setInterval(() => {
      const idx = stepIndexRef.current;
      if (idx >= total) {
        clearInterval(intervalRef.current!);
        onDone();
        return;
      }

      const point = route[idx];
      setCurrentPos(point);
      sendLocation(point.lat, point.lng, deliveryPhase);
      setProgress(Math.round((idx / (total - 1)) * 100));
      setStepInfo(`${phaseLabel} • Bước ${idx + 1}/${total}`);
      stepIndexRef.current++;
    }, speed * 1000);
  }, [sendLocation, speed]);

  // ---- Bắt đầu giả lập ----
  const startFakeGPS = async () => {
    const startPoint = realStartPos || nearbyPoint(shopLat, shopLng);
    setPhase('loading');
    setProgress(0);

    try {
      // 1. Fetch 2 đoạn đường
      const [route1, route2] = await Promise.all([
        fetchRoute(startPoint.lat, startPoint.lng, shopLat, shopLng),
        fetchRoute(shopLat, shopLng, destLat, destLng),
      ]);

      if (!route1.length || !route2.length) {
        globalShowAlert('Không lấy được đường đi từ OSRM. Thử lại!', 'Lỗi', 'error');
        setPhase('idle');
        return;
      }

      // 2. Kết nối WebSocket
      await connectWS();

      // ✅ Gửi vị trí xuất phát TRƯỚC để Tracking vẽ route từ đúng điểm này
      // Đợi 1.5 giây để Tracking có thời gian fetch và vẽ route xong
      sendLocation(startPoint.lat, startPoint.lng, 'TO_SHOP');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Phase 1: Shipper → Shop
      setPhase('to_shop');
      setCurrentPos(startPoint);
      sendLocation(startPoint.lat, startPoint.lng, 'TO_SHOP');

      runRoute(route1, '🏪 Đến shop lấy hàng', 'TO_SHOP', () => {
        // Dừng 2 giây tại shop
        setPhase('at_shop');
        setStepInfo('🏪 Đang lấy hàng tại shop...');
        setProgress(0);
        sendLocation(shopLat, shopLng, 'AT_SHOP');

        setTimeout(() => {
          // 4. Phase 2: Shop → Nhà buyer
          setPhase('to_buyer');
          runRoute(route2, '🏠 Giao hàng đến nhà', 'TO_BUYER', () => {
            setPhase('done');
            setStepInfo('✅ Đã giao hàng thành công!');
            setProgress(100);
            sendLocation(destLat, destLng, 'DELIVERED');
          });
        }, 2000);
      });

    } catch (err: any) {
      console.error('FakeGPS error:', err);
      globalShowAlert('Lỗi khởi động Fake GPS: ' + (err?.message || 'Không thể kết nối WebSocket.'), 'Lỗi', 'error');
      setPhase('idle');
      setWsStatus('disconnected');
    }
  };

  // ---- Dừng giả lập ----
  const stopFakeGPS = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stompClientRef.current?.deactivate();
    stompClientRef.current = null;
    setPhase('idle');
    setWsStatus('disconnected');
    setCurrentPos(null);
    setProgress(0);
    setStepInfo('');
    stepIndexRef.current = 0;
  };

  useEffect(() => () => stopFakeGPS(), []);

  const isRunning = phase !== 'idle' && phase !== 'done' && phase !== 'loading';
  const isDone = phase === 'done';

  const phaseColor = {
    idle: 'bg-gray-50 border-gray-200',
    loading: 'bg-yellow-50 border-yellow-200',
    to_shop: 'bg-orange-50 border-orange-200',
    at_shop: 'bg-purple-50 border-purple-200',
    to_buyer: 'bg-blue-50 border-blue-200',
    done: 'bg-green-50 border-green-200',
  }[phase];

  const phaseText = {
    idle: 'Chưa chạy',
    loading: 'Đang tải đường đi...',
    to_shop: 'Shipper đang đến shop lấy hàng',
    at_shop: 'Đang lấy hàng tại shop',
    to_buyer: 'Đang giao đến nhà khách',
    done: 'Đã giao hàng thành công!',
  }[phase];

  return (
    <div className={`rounded-3xl border-2 p-6 flex flex-col gap-4 transition-all ${phaseColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-yellow-400 rounded-xl flex items-center justify-center">
            <Zap className="size-4 text-yellow-900 fill-yellow-900" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Fake GPS Demo</p>
            <p className="text-[10px] text-gray-400 font-bold">Cho giảng viên xem thử</p>
          </div>
        </div>

        {/* WS Status */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${
          wsStatus === 'connected' ? 'bg-green-100 text-green-700' :
          wsStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          <div className={`size-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-green-500 animate-pulse' : wsStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
          {wsStatus === 'connected' ? 'WS Live' : wsStatus === 'connecting' ? 'Đang kết nối' : 'Offline'}
        </div>
      </div>

      {/* Hiển thị GPS thật của shipper */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold ${
        realStartPos ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
      }`}>
        <Navigation className="size-3 shrink-0" />
        {gpsLoading ? (
          <span className="flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Đang lấy GPS thật...</span>
        ) : realStartPos ? (
          <span>📍 Xuất phát: {realStartPos.lat.toFixed(5)}, {realStartPos.lng.toFixed(5)}</span>
        ) : (
          <span>Chưa có GPS thật — sẽ dùng vị trí gần shop</span>
        )}
      </div>

      {/* Route info */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={`p-2 rounded-xl text-[10px] font-black ${phase === 'to_shop' ? 'bg-orange-200 text-orange-800' : 'bg-white/60 text-gray-400'}`}>
          <div className="text-base">🏍️</div>
          Đến Shop
        </div>
        <div className={`p-2 rounded-xl text-[10px] font-black ${phase === 'at_shop' ? 'bg-purple-200 text-purple-800' : 'bg-white/60 text-gray-400'}`}>
          <div className="text-base">🏪</div>
          Lấy Hàng
        </div>
        <div className={`p-2 rounded-xl text-[10px] font-black ${phase === 'to_buyer' ? 'bg-blue-200 text-blue-800' : isDone ? 'bg-green-200 text-green-800' : 'bg-white/60 text-gray-400'}`}>
          <div className="text-base">{isDone ? '✅' : '🏠'}</div>
          Giao Hàng
        </div>
      </div>

      {/* Progress bar */}
      {(isRunning || isDone) && (
        <div>
          <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
            <span>{stepInfo}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current coords */}
      {currentPos && (
        <div className="bg-white/60 rounded-2xl px-4 py-2 flex items-center gap-2">
          <Navigation className="size-3 text-primary" />
          <span className="text-[10px] font-mono text-gray-600">
            {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
          </span>
        </div>
      )}

      {/* Speed control */}
      {phase === 'idle' && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-500 uppercase">Tốc độ:</span>
          <div className="flex gap-1">
            {[{ label: '🐇 Nhanh', val: 1 }, { label: '🚗 Vừa', val: 3 }, { label: '🐢 Chậm', val: 5 }].map(s => (
              <button key={s.val} onClick={() => setSpeed(s.val)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${speed === s.val ? 'bg-primary text-white' : 'bg-white/60 text-gray-500 hover:bg-white'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {phase === 'idle' || phase === 'done' ? (
          <button
            onClick={startFakeGPS}
            className="flex-1 py-3 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
          >
            <Play className="size-4 fill-white" />
            {isDone ? 'Chạy lại' : 'Bắt đầu giả lập GPS'}
          </button>
        ) : phase === 'loading' ? (
          <button disabled className="flex-1 py-3 bg-yellow-400 text-yellow-900 font-black rounded-2xl flex items-center justify-center gap-2 opacity-80">
            <Loader2 className="size-4 animate-spin" />
            Đang tải đường đi...
          </button>
        ) : (
          <button
            onClick={stopFakeGPS}
            className="flex-1 py-3 bg-red-100 text-red-600 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all border border-red-200"
          >
            <Square className="size-4 fill-current" />
            Dừng giả lập
          </button>
        )}
      </div>

      <p className="text-[9px] text-gray-400 text-center font-medium italic">
        ⚠️ Chỉ dùng để demo — không thay thế GPS thật khi giao hàng thực tế
      </p>
    </div>
  );
};

export default FakeGPS;