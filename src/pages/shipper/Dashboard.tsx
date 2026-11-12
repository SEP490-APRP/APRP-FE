import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { notificationService, NotificationItem } from '../../services';
import {
  shipperService,
  shipperErrorMessage,
  SHIPPER_HEARTBEAT_MS,
  AvailableOrderResponse,
  ShipperOrderResponse,
} from '../../services/shipper.service';
import { notificationSocketService } from '@/services/websocket/notificationSocket.service';
import { CodAcceptDialog, DeliveryResultModal, type DeliveryResult } from '@/features/shipper';
import { PageResponse } from '../../types';
import { getWebSocketUrl, TOKEN_KEY } from '../../services/api.config';
import {
  Bell, MapPin, RotateCcw, Wallet, Navigation, Zap, Clock, Bike, Package,
  ArrowRight, User, LogOut, Truck, CheckCircle2, X, Info,
  RefreshCw, Loader2, Radio, StopCircle, WifiOff, Store, MessageSquare, Home,
  Route
} from 'lucide-react';
import FakeGPS from './Fakegps';
import { GoogleMapTrackingModal } from '@/components/map/GoogleMapTrackingModal';
import { authService } from '../../services/auth.service';
import type { UserResponse } from '../../services/auth.service';
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup';
import { pickupCode } from '@/utils/orderCode';
import logoIcon from '@/assets/logo-icon.png';
import { CapNongLoading } from '@/components/ui/Loading';
import { ShipperReturnOrders } from './ShipperReturnOrders';
import { ShipperWalletPanel } from '@/features/wallet';

interface ShipperDashboardProps {
  onLogout?: () => void;
  onNavigateStore?: () => void;
}

type GpsStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';
type TrackingStatus = 'off' | 'starting' | 'active' | 'error';

const ShipperDashboard: React.FC<ShipperDashboardProps> = ({ onLogout, onNavigateStore }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const handleGoHome = () => {
    if (onNavigateStore) onNavigateStore();
    else navigate('/');
  };

  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'delivering' || tabParam === 'dang-giao'
      ? 'Đơn đang giao'
      : tabParam === 'profile' || tabParam === 'ho-so' || tabParam === 'cod' || tabParam === 'wallet'
        ? 'Hồ sơ cá nhân'
        : 'Đơn hàng mới';

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const param = searchParams.get('tab');
    if (param === 'delivering' || param === 'dang-giao') {
      setActiveTab('Đơn đang giao');
    } else if (param === 'profile' || param === 'ho-so' || param === 'cod' || param === 'wallet') {
      setActiveTab('Hồ sơ cá nhân');
    } else if (param === 'new' || param === 'don-moi') {
      setActiveTab('Đơn hàng mới');
    }
  }, [searchParams]);
  const [radius, setRadius] = useState('5km');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [shipperLat, setShipperLat] = useState<number | null>(null);
  const [shipperLng, setShipperLng] = useState<number | null>(null);
  const [availableOrders, setAvailableOrders] = useState<AvailableOrderResponse[]>([]);
  const [ordersPage, setOrdersPage] = useState<PageResponse<AvailableOrderResponse> | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [myOrders, setMyOrders] = useState<ShipperOrderResponse[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState<number | null>(null);
  const [codAcceptOrder, setCodAcceptOrder] = useState<AvailableOrderResponse | null>(null);
  const [completeModal, setCompleteModal] = useState<{
    order: ShipperOrderResponse;
    status: DeliveryResult;
  } | null>(null);
  const [pickingUpOrderId, setPickingUpOrderId] = useState<number | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('off');
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);
  // ✅ Fake GPS: orderId đang mở panel fake GPS
  const [fakeGpsOrderId, setFakeGpsOrderId] = useState<number | null>(null);
  // ✅ Modal Google Maps theo dõi lộ trình
  const [mapModalOrder, setMapModalOrder] = useState<ShipperOrderResponse | null>(null);
  // ✅ Thông tin shipper đang login
  const [myProfile, setMyProfile] = useState<UserResponse | null>(() => authService.getUserInfo());

  // ✅ Trạng thái trực tuyến / ngoại tuyến chuẩn sàn Grab / ShopeeFood
  // Trạng thái thật lấy từ BE khi mở trang (checkOnlineStatus)
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [togglingOnline, setTogglingOnline] = useState<boolean>(false);

  const stompClientRef = useRef<Client | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ✅ Fetch thông tin shipper đang login & trạng thái online
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getMyInfo();
        if (res.result) setMyProfile(res.result);
      } catch { console.warn('Cannot fetch shipper profile'); }
    };

    const checkOnlineStatus = async () => {
      try {
        const res = await shipperService.getOnlineStatus();
        if (res.result) {
          setIsOnline(res.result.isOnline);
          if (res.result.latitude) setShipperLat(res.result.latitude);
          if (res.result.longitude) setShipperLng(res.result.longitude);
        }
      } catch { console.warn('Cannot check online status'); }
    };

    fetchProfile();
    fetchMyOrders();
    checkOnlineStatus();

    // Tự động định vị GPS trình duyệt nếu chưa có tọa độ shipper
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setShipperLat(pos.coords.latitude);
          setShipperLng(pos.coords.longitude);
        },
        (err) => {
          console.warn('Browser GPS auto-fetch:', err);
          setShipperLat(prev => prev ?? 10.8505);
          setShipperLng(prev => prev ?? 106.7725);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  const handleToggleOnline = async () => {
    if (togglingOnline) return;
    setTogglingOnline(true);
    try {
      if (isOnline) {
        // Chuyển sang Ngoại tuyến (Offline)
        await shipperService.goOffline();
        setIsOnline(false);
        globalShowAlert('Đã chuyển sang Ngoại tuyến. Bạn đang tạm dừng nhận đơn mới.', 'Ngoại tuyến', 'info');
      } else {
        // Chuyển sang Trực tuyến (Online) - lấy GPS hiện tại
        let lat = shipperLat ?? 10.845;
        let lng = shipperLng ?? 106.775;

        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 60000,
              });
            });
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            setShipperLat(lat);
            setShipperLng(lng);
          } catch (geoErr) {
            console.warn('GPS browser unavailable, using fallback coordinates:', geoErr);
          }
        }

        await shipperService.goOnline({ latitude: lat, longitude: lng });
        setIsOnline(true);
        globalShowAlert('Đã bật Trực tuyến! Đang quét các đơn hàng mới sẵn sàng quanh bạn.', 'Trực tuyến', 'success');
        fetchAvailableOrders(pageIndex, pageSize);
      }
    } catch (err) {
      globalShowAlert(shipperErrorMessage(err, 'Không thể cập nhật trạng thái hoạt động.'), 'Lỗi', 'error');
    } finally {
      setTogglingOnline(false);
    }
  };

  // Heartbeat: khi đang trực tuyến, gửi vị trí mỗi 60s để BE biết shipper còn hoạt động (quá 5 phút sẽ tự offline)
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (shipperLat != null && shipperLng != null) coordsRef.current = { lat: shipperLat, lng: shipperLng };
  }, [shipperLat, shipperLng]);
  useEffect(() => {
    if (!isOnline) return;
    const beat = () => {
      const send = (lat: number, lng: number) =>
        shipperService.goOnline({ latitude: lat, longitude: lng }).catch(() => undefined);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setShipperLat(pos.coords.latitude);
            setShipperLng(pos.coords.longitude);
            void send(pos.coords.latitude, pos.coords.longitude);
          },
          () => coordsRef.current && void send(coordsRef.current.lat, coordsRef.current.lng),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 },
        );
      } else if (coordsRef.current) {
        void send(coordsRef.current.lat, coordsRef.current.lng);
      }
    };
    const id = setInterval(beat, SHIPPER_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [isOnline]);

  // Điều phối realtime: đơn mới gần bạn → tải lại danh sách; đơn đã có người nhận → gỡ khỏi danh sách
  const refreshOrdersRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    return notificationSocketService.onShipperOffer((offer) => {
      if (offer.type === 'ORDER_TAKEN') {
        setAvailableOrders((prev) => prev.filter((o) => o.orderId !== offer.orderId));
        setOrdersPage((prev) =>
          prev ? { ...prev, content: (prev.content || []).filter((o) => o.orderId !== offer.orderId) } : prev,
        );
        setCodAcceptOrder((prev) => (prev?.orderId === offer.orderId ? null : prev));
      } else {
        refreshOrdersRef.current();
      }
    });
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoadingNotifications(true);
      try {
        const res = await notificationService.getMyNotifications();
        if (res.result) setNotifications(res.result);
      } catch { } finally { setLoadingNotifications(false); }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyOrders = async () => {
    setLoadingMyOrders(true);
    try {
      const res = await shipperService.getMyOrders();
      setMyOrders(
        (res.result ?? []).filter((o: ShipperOrderResponse) => o.status === 'SHIPPING' || o.status === 'PICKED_UP'),
      );
    } catch (err) {
      console.warn('Không tải được đơn đang giao:', err);
    } finally { setLoadingMyOrders(false); }
  };

  useEffect(() => {
    if (activeTab === 'Đơn đang giao') fetchMyOrders();
  }, [activeTab]);

  const requestGpsAndFetchOrders = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus('error'); return; }
    setGpsStatus('loading');
    setOrdersError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShipperLat(pos.coords.latitude);
        setShipperLng(pos.coords.longitude);
        setGpsStatus('granted');
        fetchNearbyOrders(pos.coords.latitude, pos.coords.longitude);
      },
      () => { setGpsStatus('denied'); setOrdersError('Không lấy được GPS.'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (activeTab === 'Đơn hàng mới') {
      // Load paged orders for shipper (no nearby-only logic)
      fetchAvailableOrders(pageIndex, pageSize);
    }
  }, [activeTab, pageIndex, pageSize, isOnline]);

  const fetchNearbyOrders = async (lat: number, lng: number) => {
    setLoadingOrders(true);
    try {
      const res = await shipperService.getNearbyOrders(lat, lng);
      setAvailableOrders(res.result ?? []);
    } catch { setOrdersError('Không tải được danh sách đơn.'); }
    finally { setLoadingOrders(false); }
  };

  const fetchAvailableOrders = async (p = 0, s = 10) => {
    // Đơn mới chỉ hiện khi đang trực tuyến (BE trả 7006 nếu chưa)
    if (!isOnline) {
      setAvailableOrders([]);
      setOrdersPage(null);
      return;
    }
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const coords = shipperLat != null && shipperLng != null ? { lat: shipperLat, lng: shipperLng } : null;
      const res = await shipperService.getAvailableOrders(p, s, coords);
      if (res.result) {
        setOrdersPage(res.result);
        setAvailableOrders(res.result.content ?? []);
      } else {
        setAvailableOrders([]);
      }
    } catch (err) {
      setOrdersError(shipperErrorMessage(err, 'Không tải được danh sách đơn.'));
      setAvailableOrders([]);
    } finally { setLoadingOrders(false); }
  };
  refreshOrdersRef.current = () => {
    if (activeTab === 'Đơn hàng mới') void fetchAvailableOrders(pageIndex, pageSize);
  };

  const handleAcceptOrder = async (order: AvailableOrderResponse, confirmedCod = false) => {
    // ✅ Quy tắc 1 đơn tại 1 thời điểm
    if (myOrders.length > 0) {
      globalShowAlert(
        'Bạn đang có đơn hàng đang giao dở. Vui lòng hoàn tất đơn hiện tại trước khi nhận thêm đơn mới!',
        'Không thể nhận thêm',
        'warning'
      );
      return;
    }

    // Đơn COD: xem số tiền ký quỹ và số dư khả dụng trước khi nhận
    if ((order.paymentMethod ?? '').toUpperCase() === 'COD' && !confirmedCod) {
      setCodAcceptOrder(order);
      return;
    }
    const orderId = order.orderId;
    setAcceptingOrderId(orderId);
    try {
      const accepted = await shipperService.acceptOrder(orderId);
      setCodAcceptOrder(null);

      // ✅ 1. BIẾN MẤT LIỀN KHỎI DANH SÁCH ĐƠN HÀNG MỚI
      setAvailableOrders(prev => prev.filter(o => o.orderId !== orderId));
      setOrdersPage(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalElements: Math.max(0, prev.totalElements - 1),
          content: (prev.content || []).filter(o => o.orderId !== orderId),
        };
      });

      // ✅ 2. ĐƯA NGAY VÀO DANH SÁCH ĐƠN ĐANG GIAO CỦA SHIPPER
      const newShippingOrder: ShipperOrderResponse = { ...order, ...accepted, status: 'SHIPPING' };
      setMyOrders(prev => [newShippingOrder, ...prev.filter(o => o.orderId !== orderId)]);

      // ✅ 3. THÔNG BÁO THÀNH CÔNG VÀ CHUYỂN TAB SANG ĐƠN ĐANG GIAO
      globalShowAlert(
        `Đã nhận đơn #${orderId} thành công! Đang chuyển đến bảng "Đơn đang giao"...`,
        'Nhận đơn thành công',
        'success',
      );

      setTimeout(() => {
        setActiveTab('Đơn đang giao');
        fetchMyOrders();
      }, 700);
    } catch (err) {
      globalShowAlert(shipperErrorMessage(err, 'Không thể nhận đơn. Vui lòng thử lại sau.'), 'Không nhận được đơn', 'error');
      const code = (err as { data?: { code?: number } })?.data?.code;
      // Đơn đã có người nhận / đổi trạng thái: gỡ khỏi danh sách và tải lại
      if (code === 7005 || code === 7002) {
        setCodAcceptOrder(null);
        void fetchAvailableOrders(pageIndex, pageSize);
      }
    } finally { setAcceptingOrderId(null); }
  };

  const startTracking = useCallback((orderId: number) => {
    if (!navigator.geolocation) { globalShowAlert('Trình duyệt không hỗ trợ GPS', 'Lỗi', 'error'); return; }
    setTrackingStatus('starting');
    setTrackingOrderId(orderId);
    const token = localStorage.getItem(TOKEN_KEY);
    const wsUrl = getWebSocketUrl();
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(wsUrl),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        setTrackingStatus('active');
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            currentPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setShipperLat(pos.coords.latitude);
            setShipperLng(pos.coords.longitude);
          },
          (err) => console.error('GPS watch:', err),
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
        trackingIntervalRef.current = setInterval(() => {
          const pos = currentPosRef.current;
          if (!pos || !client.connected) return;
          client.publish({
            destination: '/app/shipper/location',
            body: JSON.stringify({ orderId, latitude: pos.lat, longitude: pos.lng }),
          });
        }, 3000);
      },
      onDisconnect: () => setTrackingStatus(prev => prev === 'active' ? 'error' : prev),
      onStompError: () => setTrackingStatus('error'),
    });
    client.activate();
    stompClientRef.current = client;
  }, []);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) { clearInterval(trackingIntervalRef.current); trackingIntervalRef.current = null; }
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (stompClientRef.current) { stompClientRef.current.deactivate(); stompClientRef.current = null; }
    setTrackingStatus('off');
    setTrackingOrderId(null);
    currentPosRef.current = null;
  }, []);

  useEffect(() => () => stopTracking(), []);

  const openCompleteModal = (order: ShipperOrderResponse, status: DeliveryResult) => {
    setCompleteModal({ order, status });
  };

  const handleCompleteDone = (orderId: number, status: DeliveryResult) => {
    if (trackingOrderId === orderId) stopTracking();
    setCompleteModal(null);
    fetchMyOrders();
    globalShowAlert(
      status === 'DELIVERED'
        ? 'Giao hàng thành công! Cước giao vào ví khi khách xác nhận đã nhận hàng.'
        : 'Đã báo giao thất bại. Hàng được hoàn kho, tiền ký quỹ COD (nếu có) đã trả lại ví.',
      'Cập nhật',
      status === 'DELIVERED' ? 'success' : 'warning',
    );
  };

  const handlePickupOrder = async (orderId: number) => {
    const ok = await globalShowConfirm(
      `Đối soát mã đơn ${pickupCode(orderId)}`,
      `Kiểm tra mã trên túi hàng trùng ${pickupCode(orderId)} rồi mới xác nhận đã lấy hàng.`,
    );
    if (!ok) return;
    try {
      setPickingUpOrderId(orderId);
      await shipperService.pickupOrder(orderId);
      globalShowAlert('Đã xác nhận lấy hàng tại shop thành công! Bắt đầu chặng giao đến người mua.', 'Lấy hàng thành công', 'success');
      fetchMyOrders();
    } catch (err) {
      globalShowAlert(shipperErrorMessage(err, 'Không thể xác nhận lấy hàng'), 'Lỗi', 'error');
    } finally {
      setPickingUpOrderId(null);
    }
  };

  // ===================== HELPERS =====================
  const fmtCur = (n?: number | null) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

  // ✅ Format hiển thị khoảng cách chuẩn sàn Grab / ShopeeFood (ví dụ: 1.2 km, 850 m)
  const fmtDist = (km: number | null | undefined) => {
    if (km == null || isNaN(km)) return '1.2 km';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  // ✅ Tính khoảng cách đường thực tế giữa 2 tọa độ (áp dụng hệ số uốn cong đường bộ đô thị)
  const calcRoadDistance = (
    lat1?: number | null,
    lon1?: number | null,
    lat2?: number | null,
    lon2?: number | null
  ): number => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 1.5;
    if (lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) return 1.5;

    const R = 6371; // Bán kính trái đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;

    // Hệ số uốn lượn đường phố TP.HCM/Thủ Đức: ~1.25x - 1.35x đường chim bay
    const roadFactor = straightKm < 1 ? 1.35 : straightKm < 5 ? 1.28 : 1.22;
    const roadDist = Math.max(0.4, straightKm * roadFactor);
    return Math.round(roadDist * 10) / 10;
  };

  const fmtTime = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    return diff < 1 ? 'Vừa xong' : diff < 60 ? `${diff} phút trước` : new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const isCodOrder = (order: { paymentMethod?: string }) => (order.paymentMethod ?? '').toUpperCase() === 'COD';
  const getCodCollectAmount = (order: AvailableOrderResponse) => order.codAmount ?? order.totalAmount ?? 0;

  const renderCodCollectLine = (order: ShipperOrderResponse) => {
    if (!isCodOrder(order)) return null;

    const collectAmount = getCodCollectAmount(order);
    const reservedAmount = order.codReservedAmount ?? 0;
    const refundAmount = order.refundAmount ?? 0;

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase shrink-0">
              COD
            </span>
            <span className="text-xs font-black text-amber-800 truncate">
              Cần thu từ khách: {fmtCur(collectAmount)}
            </span>
          </div>
          {order.totalAmount != null && order.totalAmount !== collectAmount && (
            <span className="text-[10px] font-bold text-amber-700 shrink-0">
              Tổng đơn: {fmtCur(order.totalAmount)}
            </span>
          )}
        </div>
        {refundAmount > 0 && (
          <p className="text-[11px] font-bold text-orange-700">
            Đã trừ hoàn tiền: {fmtCur(refundAmount)}
          </p>
        )}
        {reservedAmount > 0 && (
          <p className="text-[11px] font-black text-amber-800">
            Đang ký quỹ trong ví: {fmtCur(reservedAmount)}
          </p>
        )}
        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
          Thu đủ tiền mặt của khách. Giao xong, tiền ký quỹ được trừ đúng số này; giao thất bại thì trả lại ví.
        </p>
      </div>
    );
  };

  // ===================== RENDER: ĐƠN ĐANG GIAO =====================
  const renderMyOrders = () => {
    if (loadingMyOrders) return (
      <CapNongLoading
        className="!min-h-[300px]"
        message="Đang tải danh sách đơn đang giao..."
        subMessage="Cổng vận chuyển CapNong Shipper"
        size="md"
      />
    );
    if (myOrders.length === 0) return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="size-24 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 border border-gray-100"><Truck className="size-12" /></div>
        <p className="text-lg font-black text-gray-400 uppercase">Chưa có đơn đang giao</p>
      </div>
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {myOrders.map((order) => {
          const isTracking = trackingOrderId === order.orderId;
          const codOrder = isCodOrder(order);
          const codCollectAmount = codOrder ? getCodCollectAmount(order) : 0;
          return (
            <div key={order.orderId} className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-2xl font-extrabold text-leaf-800 tracking-wider">{pickupCode(order.orderId)}</p>
                  <p className="text-caption text-ink-muted">Mã trên túi hàng phải trùng mã này</p>
                  <h3 className="text-lg font-black text-gray-900 mt-1">{order.recipientName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{order.shippingAddress}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tiền ship nhận</p>
                  <p className="text-xl font-black text-primary">{fmtCur(order.shippingFee)}</p>
                  {codOrder && (
                    <>
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-2">Cần thu COD</p>
                      <p className="text-lg font-black text-amber-600">{fmtCur(codCollectAmount)}</p>

                    </>
                  )}
                </div>
              </div>
              {renderCodCollectLine(order)}

              {/* Badge trạng thái 2 chặng chuẩn sàn Grab / ShopeeFood */}
              {order.status === 'SHIPPING' ? (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">Chặng 1: Đang đến Shop lấy hàng</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Chưa lấy hàng
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">Chặng 2: Đã lấy hàng · Đang giao khách</span>
                  </div>
                  {order.pickedUpAt ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      Lấy lúc {fmtTime(order.pickedUpAt)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      Đã nhận hàng
                    </span>
                  )}
                </div>
              )}

              {/* Trạng thái GPS ngầm */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/80">
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-black text-emerald-800">
                    {fakeGpsOrderId === order.orderId ? 'Đang bật Demo Fake GPS' : 'GPS ngầm tự động đồng bộ (Live)'}
                  </span>
                </div>
                {shipperLat && shipperLng && (
                  <span className="text-[10px] text-emerald-600 font-mono font-bold">
                    {shipperLat.toFixed(3)}, {shipperLng.toFixed(3)}
                  </span>
                )}
              </div>

              {/* Các nút hành động theo từng chặng */}
              {order.status === 'SHIPPING' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handlePickupOrder(order.orderId)}
                    disabled={pickingUpOrderId === order.orderId}
                    className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/25 cursor-pointer disabled:opacity-60"
                  >
                    {pickingUpOrderId === order.orderId ? (
                      <><Loader2 className="size-4 animate-spin" /> Đang xác nhận lấy hàng...</>
                    ) : (
                      <><Package className="size-4 shrink-0" /> 📦 Xác nhận đã lấy hàng tại Shop</>
                    )}
                  </button>
                  <button
                    onClick={() => openCompleteModal(order, 'FAILED')}
                    className="h-12 px-4 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 active:scale-95 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all border border-gray-200 cursor-pointer"
                    title="Không lấy được hàng hoặc shop hủy"
                  >
                    <X className="size-3.5 shrink-0" /> Không lấy được
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 items-stretch">
                  <button
                    onClick={() => openCompleteModal(order, 'DELIVERED')}
                    title={codOrder ? 'Xác nhận đã thu đúng tiền COD từ khách' : undefined}
                    className="h-12 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-green-600/20 cursor-pointer"
                  >
                    <CheckCircle2 className="size-4 shrink-0" /> Giao thành công
                  </button>
                  <button
                    onClick={() => openCompleteModal(order, 'FAILED')}
                    className="h-12 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 cursor-pointer"
                  >
                    <X className="size-4 shrink-0" /> Giao thất bại
                  </button>
                </div>
              )}

              {/* Nút Demo Fake GPS & Bản Đồ Google Map */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFakeGpsOrderId(prev => prev === order.orderId ? null : order.orderId)}
                  className="py-3 border border-dashed border-amber-300 bg-amber-50 text-amber-800 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  🎭 {fakeGpsOrderId === order.orderId ? 'Ẩn' : 'Mở'} Demo GPS
                </button>
                <button
                  onClick={() => setMapModalOrder(order)}
                  className="py-3 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  🗺️ Xem Bản Đồ Map
                </button>
              </div>

              {fakeGpsOrderId === order.orderId && (
                <FakeGPS
                  orderId={order.orderId}
                  // ✅ Tọa độ thật từ DB — đồng nhất với Tracking
                  shopLat={order.shopLatitude ?? 10.845}
                  shopLng={order.shopLongitude ?? 106.775}
                  destLat={order.shippingLatitude ?? 10.830}
                  destLng={order.shippingLongitude ?? 106.760}
                  currentLat={shipperLat ?? undefined}
                  currentLng={shipperLng ?? undefined}
                  onOrderUpdated={fetchMyOrders}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ===================== RENDER: ORDER CARDS (ĐƠN MỚI) =====================
  const renderOrderCards = () => {
    const ordersToShow = availableOrders;
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {ordersToShow.length === 0 ? (
            loadingOrders ? (
              <div className="col-span-3">
                <CapNongLoading
                  className="!min-h-[300px]"
                  message="Đang quét đơn hàng mới quanh bạn..."
                  subMessage="Hệ thống tự động tìm đơn đã sẵn sàng giao"
                  size="md"
                />
              </div>
            ) : (
              <div className="col-span-3 flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="size-24 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 border border-gray-100"><Package className="size-12" /></div>
                <p className="text-lg font-black text-gray-400 uppercase">
                  Không có đơn nào
                </p>
                <p className="text-xs text-gray-400">
                  {ordersError ?? 'Hệ thống sẽ báo ngay khi có đơn mới gần bạn.'}
                </p>
                <button onClick={() => fetchAvailableOrders(pageIndex, pageSize)}
                  className="px-8 py-3 bg-primary/10 text-primary rounded-2xl text-xs font-black uppercase flex items-center gap-2">
                  <RefreshCw className="size-4" /> Tải lại
                </button>
              </div>
            )
          ) : ordersToShow.map((order) => {
            const codOrder = (order.paymentMethod ?? '').toUpperCase() === 'COD';
            const codAmount = getCodCollectAmount(order);

            // 📍 Tọa độ hiện tại của shipper (lấy GPS hoặc mặc định khu vực Thủ Đức)
            const curShipLat = shipperLat ?? 10.8505;
            const curShipLng = shipperLng ?? 106.7725;

            // 🏪 Tọa độ shop / kho lấy hàng
            const shopLat = order.shopLatitude ?? 10.8456;
            const shopLng = order.shopLongitude ?? 106.7758;

            // 📍 Tọa độ khách nhận hàng
            const buyerLat = order.shippingLatitude ?? 10.8485;
            const buyerLng = order.shippingLongitude ?? 106.7725;

            // 🛵 Chặng 1: Shipper -> Shop (khoảng cách đến quán lấy hàng)
            const shipToShopKm = order.distanceToShopKm ?? calcRoadDistance(curShipLat, curShipLng, shopLat, shopLng);

            // 📦 Chặng 2: Shop -> Buyer (khoảng cách giao hàng đến khách)
            const shopToBuyerKm = order.distanceKm ?? calcRoadDistance(shopLat, shopLng, buyerLat, buyerLng);

            // 🗺️ Tổng lộ trình toàn chặng: Shipper -> Shop -> Buyer (chuẩn sàn Grab)
            const totalJourneyKm = Math.round((shipToShopKm + shopToBuyerKm) * 10) / 10;

            return (
            <div key={order.orderId} className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col group relative overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="px-3 py-1 rounded-lg flex items-center gap-1.5 bg-gray-50 text-gray-400">
                  <Clock className="size-3" />
                  <span className="text-[10px] font-black uppercase">{fmtTime(order.createdAt)}</span>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tiền ship nhận</p>
                  <span className="text-2xl font-black text-primary">{fmtCur(order.shippingFee)}</span>
                </div>
              </div>

              {/* Route: shipper → shop → buyer */}
              <div className="space-y-5 relative mb-6">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 border-l border-dashed border-gray-200" />

                {/* Điểm lấy hàng (SHOP) */}
                <div className="relative flex items-start gap-4">
                  <div className="size-5 bg-orange-100 border-2 border-white rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <div className="size-1.5 bg-orange-500 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">LẤY HÀNG TẠI KHO</p>
                      {/* ✅ Khoảng cách shipper → shop */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[10px] font-bold shrink-0">
                        <Navigation className="size-2.5 text-orange-500 fill-orange-500 shrink-0" />
                        Cách bạn ~{fmtDist(shipToShopKm)}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 truncate">{order.shopName}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5 line-clamp-2">{order.shopAddress}</p>
                  </div>
                </div>

                {/* Điểm giao hàng (BUYER) */}
                <div className="relative flex items-start gap-4">
                  <div className="size-5 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <div className="size-1.5 bg-blue-500 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">GIAO ĐẾN</p>
                      {/* ✅ Khoảng cách shop → buyer */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-bold shrink-0">
                        <Package className="size-2.5 text-blue-500 shrink-0" />
                        Giao hàng ~{fmtDist(shopToBuyerKm)}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 truncate">{order.recipientName}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5 line-clamp-2">{order.shippingAddress}</p>
                  </div>
                </div>
              </div>

              {/* ✅ Hộp lộ trình tổng chuẩn sàn Grab Driver (Shipper -> Shop -> Buyer) */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-gray-50 to-emerald-50/30 rounded-2xl p-3.5 mb-6 border border-emerald-100/90 shadow-2xs">
                {/* Hàng 1: Tổng quãng đường toàn chặng */}
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-200/70">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                      <Route className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider block leading-none">
                        Tổng quãng đường
                      </span>
                      <span className="text-[9px] text-gray-400 font-semibold block leading-tight mt-0.5">
                        Shipper ➔ Kho ➔ Khách mua
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-primary tracking-tight">
                      {fmtDist(totalJourneyKm)}
                    </span>
                  </div>
                </div>

                {/* Hàng 2: Chi tiết 2 chặng theo chuẩn Grab */}
                <div className="grid grid-cols-2 gap-2 pt-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5 bg-white rounded-xl px-2.5 py-1.5 border border-gray-100 shadow-2xs min-w-0">
                    <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-gray-500 text-[10px] truncate">1. Đến kho:</span>
                    <span className="font-extrabold text-gray-800 text-[11px] ml-auto shrink-0">{fmtDist(shipToShopKm)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-xl px-2.5 py-1.5 border border-gray-100 shadow-2xs min-w-0">
                    <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-gray-500 text-[10px] truncate">2. Giao khách:</span>
                    <span className="font-extrabold text-gray-800 text-[11px] ml-auto shrink-0">{fmtDist(shopToBuyerKm)}</span>
                  </div>
                </div>
              </div>
              {codOrder && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Đơn COD · cần ký quỹ</p>
                  <p className="text-lg font-black text-amber-800 mt-1">{fmtCur(codAmount)}</p>
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">Số dư khả dụng trong ví phải đủ số này mới nhận được đơn.</p>
                </div>
              )}

              {/* Cảnh báo khi shipper đã có đơn đang giao */}
              {myOrders.length > 0 && (
                <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-amber-800">
                  <Info className="size-4 shrink-0 text-amber-600" />
                  <span>Bạn đang có 1 đơn đang giao. Vui lòng hoàn thành đơn hiện tại trước khi nhận thêm đơn mới!</span>
                </div>
              )}

              {/* Nút nhận đơn */}
              <button
                onClick={() => handleAcceptOrder(order)}
                disabled={acceptingOrderId === order.orderId || myOrders.length > 0}
                className={`w-full py-4 font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all transform active:scale-95
              ${myOrders.length > 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none active:scale-100' :
                acceptSuccess === order.orderId ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'}
              ${acceptingOrderId === order.orderId ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {acceptingOrderId === order.orderId ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</> :
                  acceptSuccess === order.orderId ? <><CheckCircle2 className="size-4" /> Đã nhận!</> :
                  myOrders.length > 0 ? <>Đang bận giao 1 đơn khác</> :
                    <>Nhận đơn này <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>

              <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />
            </div>
            );
          })}
        </div>
        {/* Pagination controls when using paged API */}
        {ordersPage && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button disabled={pageIndex <= 0} onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
              className="px-4 py-2 bg-white border rounded-2xl disabled:opacity-50">Trước</button>
            <div className="text-sm font-black">{pageIndex + 1} / {ordersPage.totalPages || 1}</div>
            <button disabled={pageIndex + 1 >= (ordersPage.totalPages || 1)} onClick={() => setPageIndex(prev => prev + 1)}
              className="px-4 py-2 bg-white border rounded-2xl disabled:opacity-50">Tiếp</button>
          </div>
        )}
      </>
    );
  };

  // ===================== MAIN RENDER =====================
  return (
    <div className="flex-1 bg-background animate-in fade-in duration-500 min-h-screen">
      {/* Header */}
      <div className="bg-[#1a4d2e] text-white px-4 md:px-10 lg:px-40 py-4 flex items-center justify-between sticky top-0 z-[50] shadow-xl">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer group"
          title="Về Trang chủ CapNong"
        >
          <img src={logoIcon} alt="CapNong" className="size-10 object-contain group-hover:scale-105 transition-transform" />
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase leading-none">CapNong Shipper</h2>
            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mt-1">Hệ thống giao vận nông sản</p>
          </div>
        </button>
        <div className="flex items-center gap-4">
          {trackingStatus === 'active' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-xl border border-green-500/30">
              <div className="size-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-300 uppercase">GPS Live</span>
            </div>
          )}
          {/* Về trang chủ Store */}
          <button
            onClick={handleGoHome}
            className="size-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
            title="Về Trang chủ Mua hàng"
          >
            <Home className="size-5" />
          </button>
          {/* ✅ Nút chat — mở ChatWidget */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-chat-with-user', { detail: { userId: 1, userName: 'Admin Support' } }))}
            className="size-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
            title="Hỗ trợ"
          >
            <MessageSquare className="size-5" />
          </button>
          <button onClick={() => setIsNotificationsOpen(true)} className="size-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 relative" title="Thông báo">
            <Bell className="size-5" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full border-2 border-[#1a4d2e] text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
          </button>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            {myProfile?.logoUrl ? (
              <img src={myProfile.logoUrl} className="size-10 rounded-xl object-cover border-2 border-white/20" />
            ) : (
              <div className="size-10 rounded-xl bg-white/20 border-2 border-white/20 flex items-center justify-center text-white font-black text-sm">
                {(myProfile?.fullName ?? 'S')[0].toUpperCase()}
              </div>
            )}
          </div>
          <button onClick={onLogout} className="size-10 bg-red-500/20 text-red-200 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" title="Đăng xuất"><LogOut className="size-5" /></button>
        </div>
      </div>
      {/* Sub Nav */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-[72px] z-40 px-4 md:px-10 lg:px-40">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-10">
            {[
              { id: 'Đơn hàng mới', label: 'Đơn hàng mới', count: availableOrders.length },
              { id: 'Đơn đang giao', label: 'Đơn đang giao', count: myOrders.length },
              { id: 'Đơn hoàn hàng', label: 'Đơn hoàn hàng' },
              { id: 'Hồ sơ cá nhân', label: 'Hồ sơ cá nhân' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-5 text-sm font-black uppercase tracking-tight transition-all border-b-4 flex items-center gap-2 ${activeTab === tab.id ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                {tab.id === 'Đơn hàng mới' && <Zap className={`size-4 ${activeTab === tab.id ? 'fill-primary' : ''}`} />}
                {tab.id === 'Đơn đang giao' && <Truck className="size-4" />}
                {tab.id === 'Đơn hoàn hàng' && <RotateCcw className="size-4" />}
                {tab.id === 'Hồ sơ cá nhân' && <User className="size-4" />}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all ${
                    activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.id === 'Đơn đang giao' && trackingStatus === 'active' && <span className="size-2 bg-green-500 rounded-full animate-pulse" />}
              </button>
            ))}
          </div>
          {/* Grab-style Online/Offline Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOnline}
              disabled={togglingOnline}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                isOnline
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
              title={isOnline ? 'Bấm để tắt nhận đơn (Ngoại tuyến)' : 'Bấm để bật nhận đơn (Trực tuyến)'}
            >
              <span className="relative flex size-2.5">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full size-2.5 ${isOnline ? 'bg-white' : 'bg-gray-400'}`} />
              </span>
              <span>{isOnline ? '🟢 Đang Trực Tuyến' : '⚪ Ngoại Tuyến'}</span>
              {togglingOnline && <Loader2 className="size-3.5 animate-spin ml-1" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 lg:px-40 py-12 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">{activeTab}</h1>
            <p className="text-gray-400 font-bold mt-1 uppercase text-xs tracking-widest">
              {activeTab === 'Đơn hàng mới' && (loadingOrders ? 'Đang tải...' : `📍 ${ordersPage?.totalElements ?? availableOrders.length} đơn`)}
              {activeTab === 'Đơn đang giao' && `${myOrders.length} đơn đang giao`}
            </p>
          </div>
          {activeTab === 'Đơn hàng mới' && (
            <div className="flex items-center gap-3">
              <button onClick={() => fetchAvailableOrders(pageIndex, pageSize)}
                className="size-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                <RefreshCw className={`size-4 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
          {activeTab === 'Đơn đang giao' && (
            <button onClick={fetchMyOrders} className="size-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary transition-all">
              <RefreshCw className={`size-4 ${loadingMyOrders ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {activeTab === 'Đơn hàng mới' && (
          !isOnline ? (
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-12 mb-8 flex flex-col items-center justify-center text-center">
              <div className="size-24 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mb-6 shadow-inner">
                <WifiOff className="size-10 text-amber-500" />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-3">
                Chế độ nghỉ ca · Ngoại tuyến
              </span>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                Bạn đang ở trạng thái Ngoại tuyến
              </h3>
              <p className="text-sm text-gray-500 font-medium max-w-md mt-2 leading-relaxed">
                Hãy bật Trực tuyến để hệ thống định vị vị trí GPS và hiển thị các đơn hàng mới sẵn sàng quanh bạn!
              </p>
              <button
                onClick={handleToggleOnline}
                disabled={togglingOnline}
                className="mt-8 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-3 shadow-xl shadow-emerald-600/25 hover:bg-emerald-700 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {togglingOnline ? (
                  <><Loader2 className="size-5 animate-spin" /> Đang kết nối...</>
                ) : (
                  <><Zap className="size-5 fill-current" /> Bật Trực Tuyến Để Nhận Đơn Ngay</>
                )}
              </button>
            </div>
          ) : loadingOrders ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-[40px] border border-gray-100 p-8 animate-pulse h-72" />)}
            </div>
          ) : (
            <>
              {/* Radar status bar when online */}
              <div className="mb-6 px-6 py-4 bg-emerald-50/80 border border-emerald-200/60 rounded-3xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex size-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                      Đang trực tuyến · Sẵn sàng nhận đơn
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Hệ thống tự động quét các đơn hàng READY đã được chuẩn bị bởi nhà vườn.
                    </p>
                  </div>
                </div>
                {shipperLat && shipperLng && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-emerald-200 text-[10px] font-mono text-emerald-800">
                    <MapPin className="size-3 text-emerald-600" />
                    <span>{shipperLat.toFixed(4)}, {shipperLng.toFixed(4)}</span>
                  </div>
                )}
              </div>
              {renderOrderCards()}
            </>
          )
        )}

        {activeTab === 'Đơn đang giao' && renderMyOrders()}

        {activeTab === 'Đơn hoàn hàng' && <ShipperReturnOrders />}

        {activeTab === 'Hồ sơ cá nhân' && (
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm p-10 flex items-center gap-10">
            <div className="size-32 rounded-[40px] overflow-hidden border-4 border-white shadow-xl bg-blue-100">
              {myProfile?.logoUrl ? (
                <img src={myProfile.logoUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-500 font-black text-5xl">
                  {(myProfile?.fullName ?? 'S')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-black text-gray-900">{myProfile?.fullName ?? 'Shipper'}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                {myProfile?.status === 'ACTIVE' ? '🟢 Đang hoạt động' : myProfile?.status ?? 'Đang hoạt động'}
              </p>
              {myProfile?.phoneNumber && (
                <p className="text-sm text-gray-600 font-bold">📞 {myProfile.phoneNumber}</p>
              )}
              {myProfile?.vehicleNumber && (
                <p className="text-sm text-gray-600 font-bold">🏍️ {myProfile.vehicleNumber}</p>
              )}
              {myProfile?.ratingAverage != null && (
                <p className="text-sm text-gray-600 font-bold">⭐ {myProfile.ratingAverage.toFixed(1)} / 5.0</p>
              )}
              {myProfile?.address && (
                <p className="text-xs text-gray-400">{myProfile.address}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Hồ sơ cá nhân' && (
          <div className="mt-8">
            <ShipperWalletPanel />
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 uppercase">Thông báo</h3>
              <button onClick={() => setIsNotificationsOpen(false)} className="size-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100"><X className="size-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Bell className="size-10 text-gray-200" />
                  <p className="text-xs font-black text-gray-400 uppercase">Không có thông báo</p>
                </div>
              ) : notifications.map((n) => (
                <div key={n.id} className={`p-6 rounded-[32px] border flex gap-5 ${!n.isRead ? 'bg-primary/5 border-primary/10' : 'bg-white border-gray-100'}`}>
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}><Info className="size-6" /></div>
                  <div><h4 className="font-black text-gray-900">{n.title}</h4><p className="text-sm text-gray-500 mt-1">{n.message}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {completeModal && (
        <DeliveryResultModal
          orderId={completeModal.order.orderId}
          result={completeModal.status}
          recipientName={completeModal.order.recipientName}
          recipientPhone={completeModal.order.recipientPhone}
          codAmount={isCodOrder(completeModal.order) ? getCodCollectAmount(completeModal.order) : 0}
          onClose={() => setCompleteModal(null)}
          onDone={(status) => handleCompleteDone(completeModal.order.orderId, status)}
        />
      )}
      {codAcceptOrder && (
        <CodAcceptDialog
          orderId={codAcceptOrder.orderId}
          codAmount={getCodCollectAmount(codAcceptOrder)}
          shopName={codAcceptOrder.shopName}
          accepting={acceptingOrderId === codAcceptOrder.orderId}
          onConfirm={() => handleAcceptOrder(codAcceptOrder, true)}
          onClose={() => setCodAcceptOrder(null)}
        />
      )}
      {/* ✅ Modal xem bản đồ Google Maps thời gian thực */}
      {mapModalOrder && (
        <GoogleMapTrackingModal
          orderId={mapModalOrder.orderId}
          orderCode={`#${mapModalOrder.orderId}`}
          role="SHIPPER"
          initialShopLat={mapModalOrder.shopLatitude ?? undefined}
          initialShopLng={mapModalOrder.shopLongitude ?? undefined}
          initialDestLat={mapModalOrder.shippingLatitude ?? undefined}
          initialDestLng={mapModalOrder.shippingLongitude ?? undefined}
          onClose={() => setMapModalOrder(null)}
          onOrderUpdated={fetchMyOrders}
        />
      )}
    </div>
  );
};

export default ShipperDashboard;
