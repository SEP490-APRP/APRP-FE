import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Navigation, Phone, Store, Home, RefreshCw, AlertCircle,
  ExternalLink, Play, Square, FastForward, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosInstance from '@/services/api/axiosInstance';
import { getWebSocketUrl, TOKEN_KEY } from '@/services/api.config';
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

interface RoutePoint {
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
  }
}

// Format timestamp safely
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

// Calculate angle between 2 coordinates
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

// Motorbike SVG icon
function getShipperSvgString(heading: number): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 48 48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="21" fill="#00B14F" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>
      <g transform="rotate(${heading}, 24, 24)">
        <polygon points="24,5 29,13 19,13" fill="#ffffff" opacity="0.95"/>
        <g transform="translate(13, 14) scale(0.9)" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="4" cy="11" r="3"/>
          <circle cx="18" cy="11" r="3"/>
          <path d="M4 11l4-6h5l2 3h3"/>
          <path d="M12 5l-2 6h5"/>
        </g>
      </g>
    </svg>
  `;
}

// Direct interpolation fallback if OSRM is slow or offline
function createDirectRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, steps = 25): RoutePoint[] {
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

// Fetch geometry coordinates from OSRM with timeout
async function fetchRoutePoints(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<RoutePoint[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates?.length) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    }
  } catch {
    // Network or OSRM timeout -> Fallback to direct interpolated route
  }
  return createDirectRoute(fromLat, fromLng, toLat, toLng, 25);
}

// Google Maps script loader
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

  // Markers
  const shipperMarkerRef = useRef<any>(null);
  const shopMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);

  // Polylines Google Maps
  const googleShipperToShopPolylineRef = useRef<any>(null);
  const googleShopToBuyerPolylineRef = useRef<any>(null);

  // Polylines Leaflet
  const leafletShipperToShopPolylineRef = useRef<L.Polyline | null>(null);
  const leafletShopToBuyerPolylineRef = useRef<L.Polyline | null>(null);

  // Saved route geometries for dynamic trimming
  const fullShipperToShopRouteRef = useRef<RoutePoint[]>([]);
  const fullShopToBuyerRouteRef = useRef<RoutePoint[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const isFallbackModeRef = useRef<boolean>(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [locationData, setLocationData] = useState<ShipperLocationPayload | null>(null);
  const locationDataRef = useRef<ShipperLocationPayload | null>(null);

  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isGpsPaused, setIsGpsPaused] = useState(false);
  const [followShipper, setFollowShipper] = useState(true);
  const followShipperRef = useRef<boolean>(true);
  followShipperRef.current = followShipper;

  // Animation refs
  const animFrameIdRef = useRef<number | null>(null);
  const currentRenderedPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const currentHeadingRef = useRef<number>(0);
  const userInteractingRef = useRef<boolean>(false);
  const lastPanTimeRef = useRef<number>(0);

  // STOMP Client
  const stompClientRef = useRef<Client | null>(null);

  // Mini Fake GPS for Shipper
  const [showFakeGpsMini, setShowFakeGpsMini] = useState<boolean>(role === 'SHIPPER');
  const [fakeGpsRunning, setFakeGpsRunning] = useState<boolean>(false);
  const [fakeGpsProgress, setFakeGpsProgress] = useState<number>(0);
  const [fakeGpsSpeed, setFakeGpsSpeed] = useState<number>(1); // seconds per step
  const [fakeGpsPhaseText, setFakeGpsPhaseText] = useState<string>('Sẵn sàng');
  const fakeGpsIntervalRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Icon Creators
  const createGoogleShipperIcon = (heading: number) => {
    const svg = getShipperSvgString(heading);
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(46, 46),
      anchor: new window.google.maps.Point(23, 23),
    };
  };

  const createLeafletShipperIcon = (heading: number) => {
    const svg = getShipperSvgString(heading);
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });
  };

  // Helper: Pan map smoothly without flooding
  const safelyPanTo = (lat: number, lng: number) => {
    if (!followShipperRef.current || userInteractingRef.current) return;
    const now = performance.now();
    if (now - lastPanTimeRef.current < 800) return; // throttle 800ms
    lastPanTimeRef.current = now;

    if (googleMapRef.current && !isFallbackModeRef.current && window.google?.maps) {
      googleMapRef.current.panTo(new window.google.maps.LatLng(lat, lng));
    } else if (leafletMapRef.current && isFallbackModeRef.current) {
      leafletMapRef.current.panTo([lat, lng], { animate: false });
    }
  };

  // Dynamic Route Trim: Trims the shipper->shop route as shipper moves forward
  const updateShipperToShopPolyline = (curLat: number, curLng: number) => {
    if (role === 'BUYER') return; // Buyer doesn't care about shipper->shop route

    const activeShopLat = locationDataRef.current?.shopLatitude || initialShopLat;
    const activeShopLng = locationDataRef.current?.shopLongitude || initialShopLng;
    if (!activeShopLat || !activeShopLng) return;

    // Build route from current shipper position towards shop
    const directPoints = [
      { lat: curLat, lng: curLng },
      ...(fullShipperToShopRouteRef.current.length > 0
        ? fullShipperToShopRouteRef.current.filter((p) => {
            const distCurrent = Math.hypot(p.lat - curLat, p.lng - curLng);
            const distShop = Math.hypot(p.lat - activeShopLat, p.lng - activeShopLng);
            const totalDist = Math.hypot(curLat - activeShopLat, curLng - activeShopLng);
            return distShop <= totalDist && distCurrent > 0.0002;
          })
        : [{ lat: activeShopLat, lng: activeShopLng }]),
    ];

    if (!isFallbackModeRef.current && googleShipperToShopPolylineRef.current) {
      googleShipperToShopPolylineRef.current.setPath(
        directPoints.map((p) => new window.google.maps.LatLng(p.lat, p.lng))
      );
    } else if (isFallbackModeRef.current && leafletShipperToShopPolylineRef.current) {
      leafletShipperToShopPolylineRef.current.setLatLngs(directPoints.map((p) => [p.lat, p.lng]));
    }
  };

  // Dynamic Route Trim for Phase 2 (Shop -> Buyer): Trims as shipper travels towards buyer
  const updateShopToBuyerPolyline = (curLat: number, curLng: number) => {
    if (role === 'SHOP') return; // Shop view only cares about shipper -> shop

    const activeDestLat = locationDataRef.current?.destinationLatitude || initialDestLat;
    const activeDestLng = locationDataRef.current?.destinationLongitude || initialDestLng;
    const activeShopLat = locationDataRef.current?.shopLatitude || initialShopLat;
    const activeShopLng = locationDataRef.current?.shopLongitude || initialShopLng;
    if (!activeDestLat || !activeDestLng || !activeShopLat || !activeShopLng) return;

    // Check if shipper is departing from shop towards buyer
    const distToShop = Math.hypot(curLat - activeShopLat, curLng - activeShopLng);
    const distToDest = Math.hypot(curLat - activeDestLat, curLng - activeDestLng);
    const shopToDestDist = Math.hypot(activeShopLat - activeDestLat, activeShopLng - activeDestLng);

    if (distToShop > 0.001 && distToDest < shopToDestDist + 0.002) {
      const directPoints = [
        { lat: curLat, lng: curLng },
        ...(fullShopToBuyerRouteRef.current.length > 0
          ? fullShopToBuyerRouteRef.current.filter((p) => {
              const dDest = Math.hypot(p.lat - activeDestLat, p.lng - activeDestLng);
              return dDest <= distToDest && Math.hypot(p.lat - curLat, p.lng - curLng) > 0.0002;
            })
          : [{ lat: activeDestLat, lng: activeDestLng }]),
      ];

      if (!isFallbackModeRef.current && googleShopToBuyerPolylineRef.current) {
        googleShopToBuyerPolylineRef.current.setPath(
          directPoints.map((p) => new window.google.maps.LatLng(p.lat, p.lng))
        );
      } else if (isFallbackModeRef.current && leafletShopToBuyerPolylineRef.current) {
        leafletShopToBuyerPolylineRef.current.setLatLngs(directPoints.map((p) => [p.lat, p.lng]));
      }
    }
  };

  // Dynamic delivery journey text based on vehicle distance and role (Grab / Shopee style)
  const getJourneyStatus = () => {
    const curPos = currentRenderedPosRef.current;
    const shLat = locationDataRef.current?.shopLatitude || initialShopLat;
    const shLng = locationDataRef.current?.shopLongitude || initialShopLng;
    const dLat = locationDataRef.current?.destinationLatitude || initialDestLat;
    const dLng = locationDataRef.current?.destinationLongitude || initialDestLng;

    if (!curPos || !shLat || !shLng) return 'Đang đồng bộ lộ trình...';

    const distToShop = Math.hypot(curPos.lat - shLat, curPos.lng - shLng);
    const distToDest = dLat && dLng ? Math.hypot(curPos.lat - dLat, curPos.lng - dLng) : 999;

    // Approaching shop
    if (distToShop > 0.0015 && distToShop >= distToDest * 0.7) {
      if (role === 'SHOP') return '🛵 Shipper đang trên đường đến quán lấy hàng';
      if (role === 'BUYER') return '🛵 Shipper đang di chuyển đến quán lấy hàng';
      return '🛵 Bạn đang di chuyển đến quán lấy hàng';
    }

    // At shop
    if (distToShop <= 0.0015) {
      if (role === 'SHOP') return '🏪 Shipper đã tới quán! Đang nhận hàng';
      if (role === 'BUYER') return '🏪 Đang lấy hàng tại quán';
      return '🏪 Bạn đã tới quán! Đang lấy hàng';
    }

    // Delivering to buyer
    if (role === 'SHOP') return '✅ Shipper đã rời quán và đang đi giao cho khách';
    if (role === 'BUYER') return '🚀 Shipper đang trên đường giao hàng đến bạn';
    return '🏠 Bạn đang di chuyển giao hàng đến khách';
  };

  // Ensure Shipper Marker exists on map
  const ensureShipperMarker = (lat: number, lng: number, heading = 0) => {
    currentRenderedPosRef.current = { lat, lng };

    // Google Maps mode
    if (!isFallbackModeRef.current && googleMapRef.current && window.google?.maps) {
      if (!shipperMarkerRef.current) {
        shipperMarkerRef.current = new window.google.maps.Marker({
          position: new window.google.maps.LatLng(lat, lng),
          map: googleMapRef.current,
          title: locationDataRef.current?.shipperName || 'Shipper đang giao hàng',
          icon: createGoogleShipperIcon(heading),
          zIndex: 9999,
        });
      } else {
        shipperMarkerRef.current.setPosition(new window.google.maps.LatLng(lat, lng));
      }
    }

    // Leaflet mode
    if (isFallbackModeRef.current && leafletMapRef.current) {
      if (!shipperMarkerRef.current) {
        shipperMarkerRef.current = L.marker([lat, lng], {
          icon: createLeafletShipperIcon(heading),
          zIndexOffset: 1000,
        })
          .addTo(leafletMapRef.current)
          .bindPopup(`<b>🛵 Shipper: ${locationDataRef.current?.shipperName || 'Tài xế'}</b>`);
      } else {
        shipperMarkerRef.current.setLatLng([lat, lng]);
      }
    }
  };

  // Smooth Marker Animation (60FPS Lerp)
  const startMarkerAnimation = useCallback((targetLat: number, targetLng: number) => {
    const startPos = currentRenderedPosRef.current || { lat: targetLat, lng: targetLng };
    const distLat = Math.abs(targetLat - startPos.lat);
    const distLng = Math.abs(targetLng - startPos.lng);

    // If marker not on map yet, create immediately
    ensureShipperMarker(startPos.lat, startPos.lng, currentHeadingRef.current);

    if (distLat < 0.000005 && distLng < 0.000005) {
      ensureShipperMarker(targetLat, targetLng, currentHeadingRef.current);
      return;
    }

    const newHeading = calculateBearing(startPos.lat, startPos.lng, targetLat, targetLng);
    if (!isNaN(newHeading) && (distLat > 0.00003 || distLng > 0.00003)) {
      currentHeadingRef.current = newHeading;
    }

    const duration = 1200;
    const startTime = performance.now();

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    let lastIconUpdateHeading = currentHeadingRef.current;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth sinusoidal easing
      const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

      const curLat = startPos.lat + (targetLat - startPos.lat) * easeProgress;
      const curLng = startPos.lng + (targetLng - startPos.lng) * easeProgress;
      currentRenderedPosRef.current = { lat: curLat, lng: curLng };

      // 1. Update in Google Maps
      if (!isFallbackModeRef.current && googleMapRef.current && window.google?.maps) {
        if (!shipperMarkerRef.current) {
          ensureShipperMarker(curLat, curLng, currentHeadingRef.current);
        } else {
          const gLatLng = new window.google.maps.LatLng(curLat, curLng);
          shipperMarkerRef.current.setPosition(gLatLng);

          // Update icon rotation only when angle changed significantly
          if (Math.abs(currentHeadingRef.current - lastIconUpdateHeading) > 10) {
            shipperMarkerRef.current.setIcon(createGoogleShipperIcon(currentHeadingRef.current));
            lastIconUpdateHeading = currentHeadingRef.current;
          }
        }
      }

      // 2. Update in Leaflet
      if (isFallbackModeRef.current && leafletMapRef.current) {
        if (!shipperMarkerRef.current) {
          ensureShipperMarker(curLat, curLng, currentHeadingRef.current);
        } else {
          shipperMarkerRef.current.setLatLng([curLat, curLng]);

          if (Math.abs(currentHeadingRef.current - lastIconUpdateHeading) > 10) {
            shipperMarkerRef.current.setIcon(createLeafletShipperIcon(currentHeadingRef.current));
            lastIconUpdateHeading = currentHeadingRef.current;
          }
        }
      }

      // 3. Pan map throttled
      safelyPanTo(curLat, curLng);

      // 4. Update polyline tail
      updateShipperToShopPolyline(curLat, curLng);
      updateShopToBuyerPolyline(curLat, curLng);

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(step);
      } else {
        animFrameIdRef.current = null;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  }, [role]);

  // Ref bridge for callbacks inside WS
  const startMarkerAnimationRef = useRef(startMarkerAnimation);
  startMarkerAnimationRef.current = startMarkerAnimation;

  // Draw Polylines according to Role
  const renderRolePolylines = async (
    sLat?: number,
    sLng?: number,
    shLat?: number,
    shLng?: number,
    dLat?: number,
    dLng?: number
  ) => {
    // 🟠 CHẶNG 1: SHIPPER -> SHOP (ShopeeFood / Be style: #EA580C)
    // Visible for: SHIPPER and SHOP
    if ((role === 'SHIPPER' || role === 'SHOP') && shLat && shLng) {
      const fromLat = sLat || shLat;
      const fromLng = sLng || shLng;

      const points1 = await fetchRoutePoints(fromLat, fromLng, shLat, shLng);
      fullShipperToShopRouteRef.current = points1;

      // Google Maps
      if (!isFallbackModeRef.current && googleMapRef.current && window.google?.maps) {
        if (googleShipperToShopPolylineRef.current) {
          googleShipperToShopPolylineRef.current.setMap(null);
        }
        googleShipperToShopPolylineRef.current = new window.google.maps.Polyline({
          path: points1.map((p) => new window.google.maps.LatLng(p.lat, p.lng)),
          geodesic: true,
          strokeColor: '#EA580C', // Cam ShopeeFood
          strokeOpacity: 0.9,
          strokeWeight: 6,
          map: googleMapRef.current,
        });
      }

      // Leaflet
      if (isFallbackModeRef.current && leafletMapRef.current) {
        if (leafletShipperToShopPolylineRef.current) {
          leafletMapRef.current.removeLayer(leafletShipperToShopPolylineRef.current);
        }
        leafletShipperToShopPolylineRef.current = L.polyline(
          points1.map((p) => [p.lat, p.lng]),
          {
            color: '#EA580C',
            weight: 6,
            opacity: 0.9,
          }
        ).addTo(leafletMapRef.current);
      }
    }

    // 🟢 CHẶNG 2: SHOP -> BUYER (Grab / ShopeeFood style: #00B14F)
    // Visible for: SHIPPER and BUYER
    if ((role === 'SHIPPER' || role === 'BUYER') && shLat && shLng && dLat && dLng) {
      const points2 = await fetchRoutePoints(shLat, shLng, dLat, dLng);
      fullShopToBuyerRouteRef.current = points2;

      // Google Maps
      if (!isFallbackModeRef.current && googleMapRef.current && window.google?.maps) {
        if (googleShopToBuyerPolylineRef.current) {
          googleShopToBuyerPolylineRef.current.setMap(null);
        }
        googleShopToBuyerPolylineRef.current = new window.google.maps.Polyline({
          path: points2.map((p) => new window.google.maps.LatLng(p.lat, p.lng)),
          geodesic: true,
          strokeColor: '#00B14F', // Xanh Grab Delivery
          strokeOpacity: 0.95,
          strokeWeight: 6,
          map: googleMapRef.current,
        });
      }

      // Leaflet
      if (isFallbackModeRef.current && leafletMapRef.current) {
        if (leafletShopToBuyerPolylineRef.current) {
          leafletMapRef.current.removeLayer(leafletShopToBuyerPolylineRef.current);
        }
        leafletShopToBuyerPolylineRef.current = L.polyline(
          points2.map((p) => [p.lat, p.lng]),
          {
            color: '#00B14F',
            weight: 6,
            opacity: 0.95,
          }
        ).addTo(leafletMapRef.current);
      }
    }
  };

  // Fetch initial location from REST
  const fetchInitialLocation = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/shippers/location/order/${orderId}`);
      if (res.data?.result) {
        const data = res.data.result as ShipperLocationPayload;
        setLocationData(data);
        locationDataRef.current = data;
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

  // Leaflet Fallback Engine
  const initLeafletMap = useCallback(async (overrideData?: ShipperLocationPayload | null) => {
    try {
      if (!mapRef.current) return;

      mapRef.current.innerHTML = '';
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const activeData = overrideData || locationDataRef.current;
      const shLat = activeData?.shopLatitude || initialShopLat || 10.7769;
      const shLng = activeData?.shopLongitude || initialShopLng || 106.7009;
      const dLat = activeData?.destinationLatitude || initialDestLat;
      const dLng = activeData?.destinationLongitude || initialDestLng;
      const sLat = activeData?.latitude || shLat;
      const sLng = activeData?.longitude || shLng;

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
      isFallbackModeRef.current = true;

      map.on('dragstart', () => {
        userInteractingRef.current = true;
        setFollowShipper(false);
        followShipperRef.current = false;
      });

      const bounds: [number, number][] = [];

      // Shop Marker
      if (shLat && shLng) {
        bounds.push([shLat, shLng]);
        const shopIcon = L.divIcon({
          html: `<div style="background:#7c3aed;color:white;width:38px;height:38px;border-radius:12px;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:18px;">🏪</div>`,
          className: '',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
        shopMarkerRef.current = L.marker([shLat, shLng], { icon: shopIcon })
          .addTo(map)
          .bindPopup(`<b>🏪 Cửa hàng / Nông trại</b><br/>${activeData?.shopName || 'Cửa hàng'}`);
      }

      // Dest Marker (Only show if role allows)
      if (dLat && dLng && role !== 'SHOP') {
        bounds.push([dLat, dLng]);
        const destIcon = L.divIcon({
          html: `<div style="background:#e11d48;color:white;width:38px;height:38px;border-radius:12px;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:18px;">🏠</div>`,
          className: '',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
        destMarkerRef.current = L.marker([dLat, dLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>🏠 Điểm nhận hàng của khách</b><br/>${activeData?.destinationAddress || ''}`);
      }

      // Shipper Marker
      bounds.push([sLat, sLng]);
      currentRenderedPosRef.current = { lat: sLat, lng: sLng };
      ensureShipperMarker(sLat, sLng, currentHeadingRef.current);

      // Render Polylines
      await renderRolePolylines(sLat, sLng, shLat, shLng, dLat, dLng);

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      setLoading(false);
      setMapError(null);
    } catch (err) {
      console.error('Failed to init Leaflet fallback:', err);
      setMapError('Không thể khởi tạo bản đồ.');
      setLoading(false);
    }
  }, [initialShopLat, initialShopLng, initialDestLat, initialDestLng, role]);

  // Main Map Init Effect
  useEffect(() => {
    let isCancelled = false;

    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failed: switching to Leaflet fallback.');
      setIsFallbackMode(true);
      isFallbackModeRef.current = true;
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
        const shLat = activeData?.shopLatitude || initialShopLat;
        const shLng = activeData?.shopLongitude || initialShopLng;
        const dLat = activeData?.destinationLatitude || initialDestLat;
        const dLng = activeData?.destinationLongitude || initialDestLng;
        const sLat = activeData?.latitude || shLat || 10.7769;
        const sLng = activeData?.longitude || shLng || 106.7009;

        const defaultCenter = { lat: sLat, lng: sLng };

        const map = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        googleMapRef.current = map;
        setIsFallbackMode(false);
        isFallbackModeRef.current = false;

        map.addListener('dragstart', () => {
          userInteractingRef.current = true;
          setFollowShipper(false);
          followShipperRef.current = false;
        });

        const bounds = new window.google.maps.LatLngBounds();

        // Shop Marker
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

        // Dest Marker (Only show if role allows)
        if (dLat && dLng && role !== 'SHOP') {
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

        // Shipper Marker
        bounds.extend({ lat: sLat, lng: sLng });
        ensureShipperMarker(sLat, sLng, currentHeadingRef.current);

        // Render Polylines
        await renderRolePolylines(sLat, sLng, shLat, shLng, dLat, dLng);

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

  // Connect WebSocket STOMP (Never reconnects unnecessarily)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const wsUrl = getWebSocketUrl();

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(wsUrl),
      reconnectDelay: 3000,
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
              const newLat = body.latitude;
              const newLng = body.longitude;
              setLastUpdated(formatTimestamp(body.updatedAt || new Date()));

              // Trigger 60FPS marker movement
              startMarkerAnimationRef.current(newLat, newLng);
            }

            setLocationData((prev) => ({
              ...prev,
              ...body,
            }));
            locationDataRef.current = {
              ...locationDataRef.current,
              ...body,
            };
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false),
      onWebSocketError: () => setWsConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (fakeGpsIntervalRef.current) clearInterval(fakeGpsIntervalRef.current);
      client.deactivate();
    };
  }, [orderId]);

  // Mini Fake GPS Simulation Controls (Directly on Modal)
  const handleToggleFakeGps = async () => {
    if (fakeGpsRunning) {
      // STOP
      if (fakeGpsIntervalRef.current) clearInterval(fakeGpsIntervalRef.current);
      setFakeGpsRunning(false);
      setFakeGpsPhaseText('Đã dừng');
      return;
    }

    // START
    const client = stompClientRef.current;
    if (!client?.connected) {
      alert('Đang kết nối lại máy chủ WebSocket, vui lòng thử lại sau 2 giây.');
      return;
    }

    const shLat = locationDataRef.current?.shopLatitude || initialShopLat || 10.7769;
    const shLng = locationDataRef.current?.shopLongitude || initialShopLng || 106.7009;
    const dLat = locationDataRef.current?.destinationLatitude || initialDestLat || 10.8231;
    const dLng = locationDataRef.current?.destinationLongitude || initialDestLng || 106.6297;

    // Start point: slightly offset from shop
    const startLat = shLat - 0.007;
    const startLng = shLng - 0.007;

    setFakeGpsRunning(true);
    setFakeGpsPhaseText('Đang nạp đường đi...');
    setFakeGpsProgress(0);

    const [route1, route2] = await Promise.all([
      fetchRoutePoints(startLat, startLng, shLat, shLng),
      fetchRoutePoints(shLat, shLng, dLat, dLng),
    ]);

    const sendPoint = (pt: RoutePoint) => {
      client.publish({
        destination: '/app/shipper/location',
        body: JSON.stringify({
          orderId,
          latitude: pt.lat,
          longitude: pt.lng,
          isFake: true,
        }),
      });
    };

    // Phase 1: To Shop
    let stepIdx = 0;
    setFakeGpsPhaseText('🏪 Đang đến lấy hàng tại Shop');

    fakeGpsIntervalRef.current = setInterval(() => {
      if (stepIdx < route1.length) {
        const pt = route1[stepIdx];
        sendPoint(pt);
        setFakeGpsProgress(Math.round((stepIdx / (route1.length + route2.length)) * 100));
        stepIdx++;
      } else if (stepIdx === route1.length) {
        // At shop
        setFakeGpsPhaseText('🏪 Đã tới shop! Đang nhận hàng...');
        stepIdx++;
      } else {
        // Phase 2: To Buyer
        const p2Idx = stepIdx - route1.length - 1;
        if (p2Idx < route2.length) {
          setFakeGpsPhaseText('🏠 Đang giao hàng đến khách');
          const pt = route2[p2Idx];
          sendPoint(pt);
          setFakeGpsProgress(Math.round(((stepIdx) / (route1.length + route2.length)) * 100));
          stepIdx++;
        } else {
          // Done
          clearInterval(fakeGpsIntervalRef.current);
          setFakeGpsRunning(false);
          setFakeGpsProgress(100);
          setFakeGpsPhaseText('✅ Đã giao hàng thành công!');
        }
      }
    }, fakeGpsSpeed * 1000);
  };

  // Center on shipper & re-lock follow mode
  const handleCenterOnShipper = () => {
    userInteractingRef.current = false;
    followShipperRef.current = true;
    setFollowShipper(true);

    if (!isFallbackModeRef.current && googleMapRef.current && currentRenderedPosRef.current && window.google?.maps) {
      googleMapRef.current.panTo(new window.google.maps.LatLng(currentRenderedPosRef.current.lat, currentRenderedPosRef.current.lng));
      googleMapRef.current.setZoom(16);
    }
    if (isFallbackModeRef.current && leafletMapRef.current && currentRenderedPosRef.current) {
      leafletMapRef.current.setView([currentRenderedPosRef.current.lat, currentRenderedPosRef.current.lng], 16);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
              <Navigation className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-base">
                  Lộ Trình Đơn Hàng {orderCode || `#ORD-${orderId}`}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isGpsPaused
                      ? 'bg-rose-100 text-rose-700'
                      : wsConnected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isGpsPaused ? 'bg-rose-500' : wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isGpsPaused ? 'GPS Tạm Dừng' : wsConnected ? 'Live Tracking Realtime' : 'Đang kết nối...'}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                  Vai trò: {role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-emerald-800 font-bold">
                  {getJourneyStatus()}
                </p>
              </div>
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
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner: Fallback */}
        {isFallbackMode && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🗺️</span>
              <span>
                Đang sử dụng hệ thống bản đồ dự phòng <strong>OpenStreetMap & OSRM Routing</strong> ổn định cao.
              </span>
            </div>
            <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded font-bold">
              Leaflet Engine
            </span>
          </div>
        )}

        {/* Info Banner */}
        <div className="px-6 py-3 bg-gray-50/90 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Shipper info */}
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              🛵
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-800 truncate">
                {locationData?.shipperName || 'Tài xế giao hàng'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                {locationData?.shipperPhone && (
                  <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                    <Phone className="size-2.5" /> {locationData.shipperPhone}
                  </span>
                )}
                {locationData?.vehicleNumber && <span>• Biển số: {locationData.vehicleNumber}</span>}
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
                {locationData?.shopAddress || 'Địa chỉ kho cửa hàng'}
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
                {locationData?.recipientName || 'Người nhận hàng'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {locationData?.destinationAddress || 'Địa chỉ giao hàng'}
              </p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3">
              <div className="size-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">Đang khởi tạo bản đồ...</p>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-6 text-center gap-3">
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

          {/* Floating Top-Left Controls: Mini Fake GPS for Shipper */}
          {role === 'SHIPPER' && (
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-amber-200/80 p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                    <span className="text-base">⚡</span>
                    <span>Fake GPS Trực Tiếp</span>
                  </div>
                  <button
                    onClick={() => setShowFakeGpsMini(!showFakeGpsMini)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
                  >
                    {showFakeGpsMini ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>

                {showFakeGpsMini && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                      <span>{fakeGpsPhaseText}</span>
                      <span className="text-amber-600 font-black">{fakeGpsProgress}%</span>
                    </div>

                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${fakeGpsProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleToggleFakeGps}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer ${
                          fakeGpsRunning
                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {fakeGpsRunning ? (
                          <>
                            <Square className="size-3.5 fill-current" /> Dừng Giả Lập
                          </>
                        ) : (
                          <>
                            <Play className="size-3.5 fill-current" /> Bật Giả Lập Xe Chạy
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setFakeGpsSpeed(fakeGpsSpeed === 1 ? 2 : fakeGpsSpeed === 2 ? 0.5 : 1)}
                        title="Đổi tốc độ mô phỏng"
                        className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <FastForward className="size-3" />
                        <span>{fakeGpsSpeed === 0.5 ? '2x' : fakeGpsSpeed === 1 ? '1x' : '0.5x'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Top-Right Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button
              onClick={() => {
                if (!followShipper) {
                  handleCenterOnShipper();
                } else {
                  setFollowShipper(false);
                  followShipperRef.current = false;
                  userInteractingRef.current = true;
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-xl border text-xs font-black backdrop-blur-md transition-all cursor-pointer ${
                followShipper
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                  : 'bg-white/95 text-emerald-800 border-2 border-emerald-500 hover:bg-emerald-50 shadow-emerald-500/20'
              }`}
            >
              <span className={`size-2.5 rounded-full ${followShipper ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
              <span>{followShipper ? '🎯 Đang bám theo xe' : '🎯 Bấm để bám theo xe'}</span>
            </button>

            <button
              onClick={handleCenterOnShipper}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl shadow-md border border-gray-200 bg-white/95 hover:bg-gray-50 text-gray-800 text-xs font-black backdrop-blur-md transition-all cursor-pointer"
            >
              <Navigation className="size-3.5 text-emerald-600" />
              <span>Về vị trí xe</span>
            </button>
          </div>

          {/* GPS Paused Warning */}
          {isGpsPaused && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-rose-500/90 text-white px-4 py-2 rounded-2xl shadow-lg backdrop-blur-sm flex items-center gap-2 text-xs font-bold animate-pulse">
              <AlertCircle className="size-4" />
              <span>Tài xế đang tạm dừng cập nhật GPS</span>
            </div>
          )}

          {/* Dynamic Bottom Legend: Tailored to Role & Platform Standards */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-gray-200 text-xs flex flex-col gap-1.5 max-w-sm">
            <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
              Chú Thích Tuyến Đường ({role})
            </div>

            {/* 🟠 Chặng 1: Shipper -> Shop */}
            {(role === 'SHIPPER' || role === 'SHOP') && (
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <span className="w-5 h-1.5 rounded-full bg-[#EA580C] shadow-xs" />
                <span>🟠 Tuyến Shipper ➔ Shop (Lấy hàng)</span>
              </div>
            )}

            {/* 🟢 Chặng 2: Shop -> Buyer */}
            {(role === 'SHIPPER' || role === 'BUYER') && (
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <span className="w-5 h-1.5 rounded-full bg-[#00B14F] shadow-xs" />
                <span>🟢 Tuyến Shop ➔ Khách (Giao hàng)</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-600 pt-0.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>🛵 Vị trí xe {lastUpdated ? `(${lastUpdated})` : ''}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span className="text-emerald-600 font-bold">
              {isFallbackMode ? '🗺️ OpenStreetMap & OSRM Routing' : '🛡️ Google Maps JavaScript API'}
            </span>
            <span>•</span>
            <span>Đồng bộ 2 chiều WebSocket Realtime</span>
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
