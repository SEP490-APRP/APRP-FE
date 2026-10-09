import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Navigation, Phone, Store, Home, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosInstance from '@/services/api/axiosInstance';
import { API_BASE_URL, TOKEN_KEY } from '@/services/api.config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ShipperLocationPayload {
  orderId?: number;
  shipperId?: number;
  shipperName?: string;
  shipperPhone?: string;
  vehicleNumber?: string;
  latitude?: number;
  longitude?: number;
  updatedAt?: any;
  shopLatitude?: number;
  shopLongitude?: number;
  shopAddress?: string;
  shopName?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  orderStatus?: string;
  isFake?: boolean;
  gpsOff?: boolean;
}

interface GoogleMapTrackingModalProps {
  orderId: number;
  orderCode?: string;
  role?: 'SHIPPER' | 'SHOP' | 'BUYER';
  onClose: () => void;
  initialShopLat?: number;
  initialShopLng?: number;
  initialDestLat?: number;
  initialDestLng?: number;
}

declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
  }
}

// Format timestamp safely without 'Invalid Date'
function formatTimestamp(val: any): string {
  if (!val) return 'vừa xong';
  try {
    if (Array.isArray(val) && val.length >= 3) {
      const d = new Date(val[0], val[1] - 1, val[2], val[3] || 0, val[4] || 0, val[5] || 0);
      return d.toLocaleTimeString('vi-VN');
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'vừa xong';
    return d.toLocaleTimeString('vi-VN');
  } catch {
    return 'vừa xong';
  }
}

// Calculate bearing (angle in degrees) between two coordinates
function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(startLat);
  const lat2 = toRad(destLat);
  const dLng = toRad(destLng - startLng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Create custom motorbike SVG string
function getShipperSvgString(heading: number): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="20" fill="#16a34a" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>
      <g transform="rotate(${heading}, 24, 24)">
        <polygon points="24,6 29,14 19,14" fill="#ffffff" opacity="0.95"/>
        <g transform="translate(13, 14) scale(0.9)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="4" cy="11" r="3"/>
          <circle cx="18" cy="11" r="3"/>
          <path d="M4 11l4-6h5l2 3h3"/>
          <path d="M12 5l-2 6h5"/>
        </g>
      </g>
    </svg>
  `;
}

// Helper load Google Maps JS SDK once with safety timeout
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }
  if (!apiKey) {
    return Promise.reject(new Error('No Google Maps API key provided'));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Google Maps script load timed out'));
    }, 3500);

    const existing = document.getElementById('google-maps-sdk-script');
    if (existing) {
      if (window.google && window.google.maps) {
        clearTimeout(timeout);
        return resolve();
      }
      setTimeout(() => {
        clearTimeout(timeout);
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps not initialized'));
        }
      }, 1000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    script.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

export const GoogleMapTrackingModal: React.FC<GoogleMapTrackingModalProps> = ({
  orderId,
  orderCode,
  role = 'BUYER',
  onClose,
  initialShopLat,
  initialShopLng,
  initialDestLat,
  initialDestLng,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const shipperMarkerRef = useRef<any>(null);
  const shopMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const leafletRouteLayerRef = useRef<L.Polyline | null>(null);

  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const stompClientRef = useRef<Client | null>(null);

  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [locationData, setLocationData] = useState<ShipperLocationPayload | null>(null);
  const [shipperPos, setShipperPos] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isGpsPaused, setIsGpsPaused] = useState(false);
  const [followShipper, setFollowShipper] = useState(true);

  // Animation refs for 60fps smooth movement
  const animFrameIdRef = useRef<number | null>(null);
  const currentRenderedPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const currentHeadingRef = useRef<number>(0);
  const initialFitDoneRef = useRef<boolean>(false);
  const userInteractingRef = useRef<boolean>(false);
  const locationDataRef = useRef<ShipperLocationPayload | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Google Maps icon creator
  const createGoogleShipperIcon = (heading: number) => {
    const svg = getShipperSvgString(heading);
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(48, 48),
      anchor: new window.google.maps.Point(24, 24),
    };
  };

  // Leaflet icon creator
  const createLeafletShipperIcon = (heading: number) => {
    const svg = getShipperSvgString(heading);
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  };

  // 60FPS Lerp Animation
  const startMarkerAnimation = useCallback((targetLat: number, targetLng: number) => {
    const startPos = currentRenderedPosRef.current || { lat: targetLat, lng: targetLng };
    const distLat = Math.abs(targetLat - startPos.lat);
    const distLng = Math.abs(targetLng - startPos.lng);

    if (distLat < 0.00001 && distLng < 0.00001) return;

    const newHeading = calculateBearing(startPos.lat, startPos.lng, targetLat, targetLng);
    if (!isNaN(newHeading) && (distLat > 0.00005 || distLng > 0.00005)) {
      currentHeadingRef.current = newHeading;
    }

    const duration = 1500;
    const startTime = performance.now();

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

      const curLat = startPos.lat + (targetLat - startPos.lat) * easeProgress;
      const curLng = startPos.lng + (targetLng - startPos.lng) * easeProgress;
      currentRenderedPosRef.current = { lat: curLat, lng: curLng };

      // Update in Google Maps mode
      if (!isFallbackMode && shipperMarkerRef.current && window.google?.maps) {
        const gLatLng = new window.google.maps.LatLng(curLat, curLng);
        shipperMarkerRef.current.setPosition(gLatLng);
        shipperMarkerRef.current.setIcon(createGoogleShipperIcon(currentHeadingRef.current));
        if (followShipper && !userInteractingRef.current && googleMapRef.current) {
          googleMapRef.current.panTo(gLatLng);
        }
      }

      // Update in Leaflet Fallback mode
      if (isFallbackMode && shipperMarkerRef.current && leafletMapRef.current) {
        shipperMarkerRef.current.setLatLng([curLat, curLng]);
        shipperMarkerRef.current.setIcon(createLeafletShipperIcon(currentHeadingRef.current));
        if (followShipper && !userInteractingRef.current && leafletMapRef.current) {
          leafletMapRef.current.panTo([curLat, curLng], { animate: true, duration: 0.5 });
        }
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(step);
      } else {
        animFrameIdRef.current = null;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  }, [followShipper, isFallbackMode]);

  // Fetch initial location from REST
  const fetchInitialLocation = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/shippers/location/order/${orderId}`);
      if (res.data?.result) {
        const data = res.data.result as ShipperLocationPayload;
        setLocationData(data);
        locationDataRef.current = data;
        if (data.latitude && data.longitude) {
          const pos = { lat: data.latitude, lng: data.longitude };
          setShipperPos(pos);
          currentRenderedPosRef.current = pos;
        }
        if (data.updatedAt) {
          setLastUpdated(formatTimestamp(data.updatedAt));
        }
        return data;
      }
    } catch (err) {
      console.warn('Cannot fetch initial location via REST:', err);
    }
    return null;
  }, [orderId]);

  // Leaflet Initialization Engine (Direct npm, rock-solid fallback)
  const initLeafletMap = useCallback((overrideData?: ShipperLocationPayload | null) => {
    try {
      if (!mapRef.current) return;

      // Clean container if Google Maps put elements
      mapRef.current.innerHTML = '';
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const activeData = overrideData || locationDataRef.current || locationData;
      const shLat = activeData?.shopLatitude || initialShopLat || 10.7769;
      const shLng = activeData?.shopLongitude || initialShopLng || 106.7009;
      const dLat = activeData?.destinationLatitude || initialDestLat;
      const dLng = activeData?.destinationLongitude || initialDestLng;
      const sLat = activeData?.latitude || shipperPos?.lat || shLat;
      const sLng = activeData?.longitude || shipperPos?.lng || shLng;

      const map = L.map(mapRef.current, {
        center: [sLat, sLng],
        zoom: 15,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setIsFallbackMode(true);

      map.on('dragstart', () => { userInteractingRef.current = true; });
      map.on('dragend', () => { setTimeout(() => { userInteractingRef.current = false; }, 4000); });

      const bounds: [number, number][] = [];

      // Shop Marker
      if (shLat && shLng) {
        bounds.push([shLat, shLng]);
        const shopIcon = L.divIcon({
          html: `<div style="background:#7c3aed;color:white;width:36px;height:36px;border-radius:12px;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:16px;">🏪</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        shopMarkerRef.current = L.marker([shLat, shLng], { icon: shopIcon })
          .addTo(map)
          .bindPopup(`<b>🏪 Kho hàng / Cửa hàng</b><br/>${activeData?.shopName || 'Cửa hàng nông sản'}`);
      }

      // Dest Marker
      if (dLat && dLng) {
        bounds.push([dLat, dLng]);
        const destIcon = L.divIcon({
          html: `<div style="background:#e11d48;color:white;width:36px;height:36px;border-radius:12px;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:16px;">🏠</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        destMarkerRef.current = L.marker([dLat, dLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>🏠 Điểm nhận hàng của khách</b><br/>${activeData?.destinationAddress || ''}`);
      }

      // Shipper Marker
      bounds.push([sLat, sLng]);
      currentRenderedPosRef.current = { lat: sLat, lng: sLng };
      const shipIcon = createLeafletShipperIcon(currentHeadingRef.current);
      shipperMarkerRef.current = L.marker([sLat, sLng], { icon: shipIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>🛵 Shipper: ${activeData?.shipperName || 'Tài xế'}</b>`);

      // Fetch road geometry polyline via OSRM
      if (shLat && shLng && dLat && dLng) {
        const originLat = sLat;
        const originLng = sLng;
        fetch(`https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${dLng},${dLat}?overview=full&geometries=geojson`)
          .then((res) => res.json())
          .then((routeJson) => {
            if (routeJson.routes?.[0]?.geometry?.coordinates) {
              const points = routeJson.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
              if (leafletRouteLayerRef.current) map.removeLayer(leafletRouteLayerRef.current);
              leafletRouteLayerRef.current = L.polyline(points, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(map);
            }
          })
          .catch(() => {});
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      // Invalidate size once DOM layout completes
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      setLoading(false);
      setMapError(null);
    } catch (err) {
      console.error('Failed to init Leaflet fallback:', err);
      setMapError('Không thể khởi tạo bản đồ. Vui lòng kiểm tra lại kết nối mạng.');
      setLoading(false);
    }
  }, [initialShopLat, initialShopLng, initialDestLat, initialDestLng, shipperPos, locationData]);

  // Main Map Init Effect (Runs Once on mount)
  useEffect(() => {
    let isCancelled = false;

    // Intercept Google Maps Auth Failure globally
    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failed: switching to Leaflet fallback.');
      setIsFallbackMode(true);
      initLeafletMap();
    };

    (async () => {
      setLoading(true);
      const fetchedData = await fetchInitialLocation();
      if (isCancelled) return;

      try {
        await loadGoogleMapsScript(apiKey);
        if (isCancelled) return;

        if (!mapRef.current || !window.google?.maps) {
          throw new Error('Google Maps SDK not available in window');
        }

        const activeData = fetchedData || locationDataRef.current;
        const defaultCenter = { lat: 10.7769, lng: 106.7009 };
        const center =
          activeData?.latitude && activeData?.longitude
            ? { lat: activeData.latitude, lng: activeData.longitude }
            : initialShopLat && initialShopLng
            ? { lat: initialShopLat, lng: initialShopLng }
            : defaultCenter;

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        googleMapRef.current = map;

        map.addListener('dragstart', () => { userInteractingRef.current = true; });
        map.addListener('dragend', () => { setTimeout(() => { userInteractingRef.current = false; }, 4000); });

        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 5,
            strokeOpacity: 0.85,
          },
        });

        // Add Markers
        const bounds = new window.google.maps.LatLngBounds();
        const shLat = activeData?.shopLatitude || initialShopLat;
        const shLng = activeData?.shopLongitude || initialShopLng;
        const dLat = activeData?.destinationLatitude || initialDestLat;
        const dLng = activeData?.destinationLongitude || initialDestLng;
        const sLat = activeData?.latitude || shipperPos?.lat;
        const sLng = activeData?.longitude || shipperPos?.lng;

        if (shLat && shLng) {
          const shopPos = { lat: shLat, lng: shLng };
          bounds.extend(shopPos);
          shopMarkerRef.current = new window.google.maps.Marker({
            position: shopPos,
            map,
            title: activeData?.shopName || 'Cửa hàng',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
              scaledSize: new window.google.maps.Size(42, 42),
            },
          });
        }

        if (dLat && dLng) {
          const destPos = { lat: dLat, lng: dLng };
          bounds.extend(destPos);
          destMarkerRef.current = new window.google.maps.Marker({
            position: destPos,
            map,
            title: 'Điểm giao hàng',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(42, 42),
            },
          });
        }

        if (sLat && sLng) {
          const sPos = { lat: sLat, lng: sLng };
          bounds.extend(sPos);
          currentRenderedPosRef.current = sPos;
          shipperMarkerRef.current = new window.google.maps.Marker({
            position: sPos,
            map,
            title: activeData?.shipperName || 'Shipper',
            icon: createGoogleShipperIcon(currentHeadingRef.current),
            zIndex: 999,
          });
        }

        if (shLat && shLng && dLat && dLng && directionsServiceRef.current) {
          const origin = sLat && sLng ? { lat: sLat, lng: sLng } : { lat: shLat, lng: shLng };
          directionsServiceRef.current.route(
            {
              origin,
              destination: { lat: dLat, lng: dLng },
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result: any, status: any) => {
              if (status === window.google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(result);
              }
            }
          );
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        }

        setLoading(false);
      } catch (err) {
        console.warn('Google Maps unavailable, initializing Leaflet fallback:', err);
        if (!isCancelled) {
          initLeafletMap(fetchedData);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [orderId, apiKey]);

  // Connect WebSocket STOMP
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const baseUrl = API_BASE_URL.endsWith('/api/v1')
      ? API_BASE_URL.slice(0, -7)
      : API_BASE_URL.endsWith('/api')
      ? API_BASE_URL.slice(0, -4)
      : API_BASE_URL;

    const wsUrl = `${baseUrl}/ws`;
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(wsUrl),
      reconnectDelay: 4000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        setWsConnected(true);
        client.subscribe(`/topic/order/${orderId}/location`, (msg) => {
          try {
            const body = JSON.parse(msg.body) as ShipperLocationPayload;

            if (body.gpsOff) {
              setIsGpsPaused(true);
              return;
            } else {
              setIsGpsPaused(false);
            }

            if (body.latitude && body.longitude) {
              const newPos = { lat: body.latitude, lng: body.longitude };
              setShipperPos(newPos);
              setLastUpdated(formatTimestamp(body.updatedAt || new Date()));
              startMarkerAnimation(newPos.lat, newPos.lng);
            }

            setLocationData((prev) => ({
              ...prev,
              ...body,
            }));
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      client.deactivate();
    };
  }, [orderId, startMarkerAnimation]);

  // Center on shipper
  const handleCenterOnShipper = () => {
    if (!isFallbackMode && googleMapRef.current && currentRenderedPosRef.current) {
      googleMapRef.current.panTo(currentRenderedPosRef.current);
      googleMapRef.current.setZoom(16);
      setFollowShipper(true);
    }
    if (isFallbackMode && leafletMapRef.current && currentRenderedPosRef.current) {
      leafletMapRef.current.setView([currentRenderedPosRef.current.lat, currentRenderedPosRef.current.lng], 16);
      setFollowShipper(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
              <Navigation className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-base">
                  Bản Đồ Theo Dõi Đơn Hàng {orderCode || `#ORD-${orderId}`}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isGpsPaused
                      ? 'bg-rose-100 text-rose-700'
                      : wsConnected
                      ? 'bg-green-100 text-green-700 animate-pulse'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isGpsPaused ? 'bg-rose-500' : wsConnected ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  />
                  {isGpsPaused ? 'GPS Tạm Dừng' : wsConnected ? 'Live Tracking 60fps' : 'Kết nối...'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Vị trí shipper cập nhật trực tiếp theo thời gian thực với chuyển động mượt mà
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInitialLocation}
              title="Làm mới vị trí"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner: If Maps JS API is not activated */}
        {isFallbackMode && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                Google Cloud Key của bạn chưa bật <strong>Maps JavaScript API</strong>. Đang tự động chuyển sang chế độ bản đồ dự phòng 60fps để không gián đoạn tracking.
              </span>
            </div>
            <a
              href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] whitespace-nowrap inline-flex items-center gap-1 shadow-xs"
            >
              <span>Bật Maps JS API trên Console</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Info Banner */}
        <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Shipper info */}
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              🛵
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-800 truncate">
                {locationData?.shipperName || 'Đang phân công shipper'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                {locationData?.shipperPhone && (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <Phone className="size-2.5" /> {locationData.shipperPhone}
                  </span>
                )}
                {locationData?.vehicleNumber && <span>• {locationData.vehicleNumber}</span>}
              </p>
            </div>
          </div>

          {/* Shop info */}
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Store className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-800 truncate">
                {locationData?.shopName || 'Cửa hàng nông sản'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {locationData?.shopAddress || 'Địa chỉ kho'}
              </p>
            </div>
          </div>

          {/* Destination info */}
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="size-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
              <Home className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-800 truncate">
                {locationData?.recipientName || 'Người nhận'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {locationData?.destinationAddress || 'Địa chỉ giao hàng'}
              </p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3">
              <div className="size-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">Đang khởi tạo bản đồ...</p>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white p-6 text-center gap-3">
              <AlertCircle className="size-12 text-rose-500" />
              <p className="text-sm font-bold text-gray-800 max-w-md">{mapError}</p>
              <button
                onClick={() => initLeafletMap()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Mở Bản Đồ Dự Phòng
              </button>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '350px' }} />

          {/* Floating Top Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button
              onClick={() => setFollowShipper(!followShipper)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg border text-xs font-black backdrop-blur-md transition-all cursor-pointer ${
                followShipper
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20'
                  : 'bg-white/95 text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{followShipper ? '🎯 Đang bám theo tài xế' : '🖐️ Chế độ xem tự do'}</span>
            </button>

            <button
              onClick={handleCenterOnShipper}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg border border-gray-200 bg-white/95 hover:bg-gray-50 text-gray-800 text-xs font-black backdrop-blur-md transition-all cursor-pointer"
            >
              <Navigation className="size-3.5 text-emerald-600" />
              <span>Về vị trí Shipper</span>
            </button>
          </div>

          {/* GPS Paused Warning */}
          {isGpsPaused && (
            <div className="absolute top-4 left-4 z-10 bg-rose-500/90 text-white px-4 py-2 rounded-2xl shadow-lg backdrop-blur-sm flex items-center gap-2 text-xs font-bold animate-pulse">
              <AlertCircle className="size-4" />
              <span>Tài xế đang tạm dừng cập nhật GPS</span>
            </div>
          )}

          {/* Bottom Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-gray-200 text-xs flex flex-col gap-1">
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span>🛵 Shipper ({lastUpdated ? `Cập nhật lúc ${lastUpdated}` : 'Đang cập nhật...'})</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <span className="size-2.5 rounded-full bg-purple-500" />
              <span>🏪 Kho hàng / Cửa hàng</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <span className="size-2.5 rounded-full bg-rose-500" />
              <span>🏠 Điểm nhận hàng của Buyer</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span className="text-emerald-600 font-bold">
              {isFallbackMode ? '🗺️ OpenStreetMap & OSRM Routing' : '🛡️ Google Maps JavaScript API'}
            </span>
            <span>•</span>
            <span>Lộ trình và vị trí được đồng bộ realtime WebSocket</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gray-900 text-white hover:bg-gray-800 transition-all cursor-pointer"
          >
            Đóng bản đồ
          </button>
        </div>
      </div>
    </div>
  );
};
export default GoogleMapTrackingModal;
