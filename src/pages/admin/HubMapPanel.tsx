import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, ChevronDown, Crosshair, Loader2, MapPin, Plus, Sparkles, Warehouse, X } from 'lucide-react'
import { adminHubService, type CampaignResponse, type DeliveryHub, type PreOrderResponse } from '@/services'
import {
  coverageAround,
  haversineKm,
  MAX_LAST_MILE_KM,
  outsideHubs,
  suggestHubSpots,
  type FarOrder,
  type HubSpot,
  type LatLng,
} from '@/features/campaign/deliveryPlan'
import { formatKg } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'

/** Màu theo hub để nhìn ngay đơn nào về hub nào */
const PALETTE = ['#2563eb', '#db2777', '#7c3aed', '#ea580c', '#0d9488', '#ca8a04', '#dc2626', '#4f46e5']
const NO_HUB = '#9ca3af'
const HCM: LatLng = [10.7769, 106.7009]

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string)

/** Địa chỉ từ toạ độ (OpenStreetMap Nominatim); lỗi thì để admin tự nhập */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi&zoom=18`, {
      referrerPolicy: 'origin',
    })
    if (!r.ok) return ''
    const j = (await r.json()) as { display_name?: string }
    return (j.display_name ?? '').replace(/,\s*Việt Nam$/i, '').replace(/,\s*\d{5,6}$/, '')
  } catch {
    return ''
  }
}

const pinIcon = (color: string, text: string, opts: { big?: boolean; dashed?: boolean; label?: string } = {}) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
      ${opts.label ? `<span style="margin-bottom:2px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#fff;border:1px solid ${color};color:#111827;font:700 11px/1.2 system-ui;padding:2px 6px;border-radius:9px;box-shadow:0 1px 3px rgba(0,0,0,.25)">${esc(opts.label)}</span>` : ''}
      <span style="display:flex;align-items:center;justify-content:center;width:${opts.big ? 34 : 28}px;height:${opts.big ? 34 : 28}px;border-radius:50% 50% 50% 8%;transform:rotate(-45deg);background:${opts.dashed ? '#fff' : color};border:3px ${opts.dashed ? 'dashed' : 'solid'} ${color};box-shadow:0 2px 6px rgba(0,0,0,.35)">
        <span style="transform:rotate(45deg);font:800 ${opts.big ? 13 : 11}px system-ui;color:${opts.dashed ? color : '#fff'}">${esc(text)}</span>
      </span></div>`,
  })

interface Draft {
  lat: number
  lng: number
  name: string
  address: string
  phone: string
  openHours: string
  geocoding: boolean
}

/**
 * Bản đồ đặt hub: hiện điểm tập kết, vị trí từng đơn (màu theo hub đang gán), các hub hiện có kèm đơn từng hub phục vụ,
 * và điểm gợi ý đặt thêm hub cho những đơn còn nằm ngoài bán kính mọi hub. Admin bấm vào điểm gợi ý hoặc bấm tự do trên
 * bản đồ để tạo hub, kéo ghim để chỉnh vị trí, thấy ngay hub đó phục vụ được bao nhiêu đơn / kg trong bán kính.
 */
export default function HubMapPanel({
  c,
  orders,
  hubs,
  hubOfOrder,
  farOrders,
  onMove,
  onNotice,
}: {
  c: CampaignResponse
  orders: PreOrderResponse[]
  hubs: DeliveryHub[]
  /** Mã đơn -> hub đang được gán trong kế hoạch */
  hubOfOrder: Map<number, number>
  /** Đơn xa mọi hub quá mức shipper giao được: chưa được xếp xe */
  farOrders: FarOrder[]
  /** Admin đổi hub của một đơn */
  onMove: (orderId: number, hubId: number) => void
  onNotice: (n: { ok: boolean; text: string }) => void
}) {
  const qc = useQueryClient()
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layers = useRef<{ orders: L.LayerGroup; hubs: L.LayerGroup; spots: L.LayerGroup; draft: L.LayerGroup; focus: L.LayerGroup } | null>(null)
  const placingRef = useRef(false)
  const fittedRef = useRef(false)
  const [placing, setPlacing] = useState(false)
  const [radiusKm, setRadiusKm] = useState(4)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [focusSpot, setFocusSpot] = useState<string | null>(null)
  const [openHub, setOpenHub] = useState<number | null>(null)
  /** Hub vừa tạo được đưa lên đầu danh sách */
  const [newHubId, setNewHubId] = useState<number | null>(null)
  /** Đơn admin vừa bấm: ghim vị trí người mua trên bản đồ */
  const [focusId, setFocusId] = useState<number | null>(null)

  const site: LatLng | null =
    c.collectionSiteLatitude != null && c.collectionSiteLongitude != null ? [Number(c.collectionSiteLatitude), Number(c.collectionSiteLongitude)] : null
  const withCoords = useMemo(() => orders.filter((o) => o.shippingLatitude != null && o.shippingLongitude != null), [orders])
  // Trừ các đơn đã có hub trong bán kính, chỉ gợi ý cho phần còn lại
  const uncovered = useMemo(() => outsideHubs(withCoords, hubs, radiusKm), [withCoords, hubs, radiusKm])
  const spots = useMemo(() => suggestHubSpots(uncovered, [], radiusKm), [uncovered, radiusKm])
  const hubColor = useMemo(() => new Map(hubs.map((h, i) => [h.hubId, PALETTE[i % PALETTE.length]])), [hubs])
  const hubKg = useMemo(() => {
    const m = new Map<number, { kg: number; n: number }>()
    for (const o of orders) {
      const id = hubOfOrder.get(o.preOrderId)
      if (id == null) continue
      const cur = m.get(id) ?? { kg: 0, n: 0 }
      cur.kg += Number(o.totalKg ?? 0)
      cur.n++
      m.set(id, cur)
    }
    return m
  }, [orders, hubOfOrder])
  const sortedHubs = [...hubs].sort(
    (a, b) => Number(b.hubId === newHubId) - Number(a.hubId === newHubId) || (hubKg.get(b.hubId)?.kg ?? 0) - (hubKg.get(a.hubId)?.kg ?? 0),
  )

  const create = useMutation({
    mutationFn: (d: Draft) =>
      adminHubService.create({
        name: d.name.trim(),
        address: d.address.trim(),
        latitude: d.lat,
        longitude: d.lng,
        phone: d.phone.trim() || undefined,
        openHours: d.openHours.trim() || undefined,
      }),
    onSuccess: (h) => {
      setDraft(null)
      setPlacing(false)
      setNewHubId(h.hubId)
      setOpenHub(h.hubId)
      onNotice({ ok: true, text: `Đã tạo hub ${h.name}. Đơn nào gần hub này nhất sẽ tự chuyển về đây.` })
      qc.invalidateQueries({ queryKey: ['admin-hubs'] })
    },
    onError: (e) => onNotice({ ok: false, text: getErrorMessage(e, 'Không tạo được hub.') }),
  })

  const openDraft = (lat: number, lng: number, name = '') => {
    setDraft({ lat, lng, name, address: '', phone: '', openHours: '6:00 – 20:00', geocoding: true })
    void reverseGeocode(lat, lng).then((address) => setDraft((d) => (d && d.lat === lat && d.lng === lng ? { ...d, address: d.address || address, geocoding: false } : d)))
  }

  // Khởi tạo bản đồ một lần
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: true }).setView(site ?? HCM, 11)
    // index.html đặt referrer no-referrer, OpenStreetMap chặn ô bản đồ không có Referer ("Access blocked"):
    // riêng ô bản đồ gửi origin của trang để đúng chính sách dùng tile
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      referrerPolicy: 'origin',
    }).addTo(map)
    layers.current = { orders: L.layerGroup().addTo(map), hubs: L.layerGroup().addTo(map), spots: L.layerGroup().addTo(map), draft: L.layerGroup().addTo(map), focus: L.layerGroup().addTo(map) }
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (placingRef.current) openDraft(e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map
    // Popup vừa mở: bản đồ cần tính lại kích thước
    const t = window.setTimeout(() => map.invalidateSize(), 150)
    return () => {
      window.clearTimeout(t)
      map.remove()
      mapRef.current = null
      layers.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    placingRef.current = placing
    if (elRef.current) elRef.current.style.cursor = placing ? 'crosshair' : ''
  }, [placing])

  // Vẽ lại đơn, hub, điểm gợi ý khi dữ liệu đổi
  useEffect(() => {
    const map = mapRef.current
    const g = layers.current
    if (!map || !g) return
    g.orders.clearLayers()
    g.hubs.clearLayers()
    g.spots.clearLayers()
    const bounds: L.LatLngTuple[] = []

    if (site) {
      L.marker(site, { icon: pinIcon('#b45309', '★', { big: true, label: c.collectionSiteName || 'Điểm tập kết' }), zIndexOffset: 800 }).addTo(g.hubs)
      bounds.push(site)
    }
    for (const o of withCoords) {
      const at: LatLng = [Number(o.shippingLatitude), Number(o.shippingLongitude)]
      const hid = hubOfOrder.get(o.preOrderId)
      const color = hid != null ? (hubColor.get(hid) ?? NO_HUB) : NO_HUB
      L.circleMarker(at, { radius: Math.min(11, 5 + Number(o.totalKg ?? 0) / 8), color: '#fff', weight: 1.5, fillColor: color, fillOpacity: 0.9 })
        .bindPopup(
          `<b>${esc(o.code)}</b> · ${esc(o.recipientName ?? '')}<br/>${formatKg(o.totalKg)}<br/><small>${esc(o.shippingAddress ?? '')}</small>${hid != null ? `<br/><small>Về hub: <b>${esc(hubs.find((h) => h.hubId === hid)?.name ?? '')}</b></small>` : '<br/><small>Chưa có hub</small>'}`,
        )
        .addTo(g.orders)
      bounds.push(at)
    }
    for (const h of hubs) {
      const color = hubColor.get(h.hubId) ?? NO_HUB
      const load = hubKg.get(h.hubId)
      L.circle([h.latitude, h.longitude], { radius: radiusKm * 1000, color, weight: 1, dashArray: '4 6', fillColor: color, fillOpacity: 0.05 }).addTo(g.hubs)
      L.marker([h.latitude, h.longitude], {
        icon: pinIcon(color, 'H', { big: true, label: `${h.name}${load ? ` · ${Math.round(load.kg)} kg` : ''}` }),
        zIndexOffset: 700,
      })
        .bindPopup(`<b>Hub ${esc(h.name)}</b><br/><small>${esc(h.address)}</small><br/>${load ? `${load.n} đơn · ${formatKg(load.kg)}` : 'Chưa có đơn'}`)
        .addTo(g.hubs)
      bounds.push([h.latitude, h.longitude])
    }
    spots.forEach((s, i) => {
      const focused = focusSpot === s.key
      L.circle(s.center, { radius: radiusKm * 1000, color: '#16a34a', weight: focused ? 2.5 : 1, dashArray: '6 6', fillColor: '#16a34a', fillOpacity: focused ? 0.14 : 0.06 }).addTo(g.spots)
      L.marker(s.center, { icon: pinIcon('#16a34a', String(i + 1), { dashed: true, label: `Gợi ý: ${Math.round(s.totalKg)} kg` }), zIndexOffset: focused ? 900 : 500 })
        .on('click', () => {
          setPlacing(false)
          openDraft(s.center[0], s.center[1], s.name)
        })
        .addTo(g.spots)
    })

    if (!fittedRef.current && bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 13 })
      fittedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withCoords, hubs, hubOfOrder, spots, radiusKm, focusSpot, hubKg, hubColor])

  // Ghim đang đặt: kéo để chỉnh, vòng bán kính phục vụ
  useEffect(() => {
    const g = layers.current
    if (!g) return
    g.draft.clearLayers()
    if (!draft) return
    L.circle([draft.lat, draft.lng], { radius: radiusKm * 1000, color: '#0f766e', weight: 2, fillColor: '#14b8a6', fillOpacity: 0.12 }).addTo(g.draft)
    L.marker([draft.lat, draft.lng], { icon: pinIcon('#0f766e', '+', { big: true, label: draft.name || 'Hub mới' }), draggable: true, zIndexOffset: 1000 })
      .on('dragend', (e) => {
        const p = (e.target as L.Marker).getLatLng()
        openDraft(p.lat, p.lng, draft.name)
      })
      .addTo(g.draft)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.lat, draft?.lng, draft?.name, radiusKm])

  const flyTo = (at: LatLng) => mapRef.current?.flyTo(at, 13, { duration: 0.6 })

  const showOrder = (o: PreOrderResponse) => {
    if (o.shippingLatitude == null || o.shippingLongitude == null) {
      onNotice({ ok: false, text: `Đơn ${o.code} chưa có toạ độ nên không ghim được trên bản đồ.` })
      return
    }
    setPlacing(false)
    setFocusId(o.preOrderId)
    mapRef.current?.flyTo([Number(o.shippingLatitude), Number(o.shippingLongitude)], 15, { duration: 0.8 })
    elRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }

  // Ghim đỏ tại nhà người mua của đơn đang xem
  useEffect(() => {
    const g = layers.current
    if (!g) return
    g.focus.clearLayers()
    const o = withCoords.find((x) => x.preOrderId === focusId)
    if (!o) return
    const at: LatLng = [Number(o.shippingLatitude), Number(o.shippingLongitude)]
    L.circle(at, { radius: 180, color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.12 }).addTo(g.focus)
    L.marker(at, { icon: pinIcon('#dc2626', '●', { big: true, label: `${o.recipientName ?? o.code} · ${formatKg(o.totalKg)}` }), zIndexOffset: 1200 })
      .bindPopup(
        `<b>${esc(o.recipientName ?? '')}</b>${o.recipientPhone ? ` · ${esc(o.recipientPhone)}` : ''}<br/><small>${esc(o.shippingAddress ?? '')}</small><br/><small>${esc(o.code)} · ${formatKg(o.totalKg)}</small>`,
        { offset: [0, -34], autoPan: false },
      )
      .addTo(g.focus)
      .openPopup()
  }, [focusId, withCoords])
  const coverage = draft ? coverageAround(withCoords, [draft.lat, draft.lng], radiusKm) : null
  const nearHub = draft ? hubs.map((h) => ({ h, km: haversineKm([draft.lat, draft.lng], [h.latitude, h.longitude]) })).sort((a, b) => a.km - b.km)[0] : null
  const draftErr = draft && (!draft.name.trim() ? 'Nhập tên hub' : !draft.address.trim() ? 'Nhập địa chỉ hub' : null)

  return (
    <div className="flex flex-col gap-4">
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3">
        <button
          type="button"
          onClick={() => { setPlacing((v) => !v); setDraft(null) }}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${placing ? 'bg-teal-600 text-white shadow' : 'border border-gray-200 text-gray-800 hover:border-teal-600 hover:text-teal-700'}`}
        >
          <Crosshair size={16} /> {placing ? 'Bấm lên bản đồ để đặt hub…' : 'Đặt hub trên bản đồ'}
        </button>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
          Bán kính phục vụ của hub
          <input type="range" min={1} max={12} step={1} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-28 accent-[#326318]" />
          <span className="w-10 text-sm font-black text-gray-900">{radiusKm} km</span>
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] font-semibold text-gray-600">
          <Legend color="#b45309" label="Điểm tập kết" />
          <Legend color="#2563eb" label="Đơn (màu = hub được gán)" round />
          <Legend color={NO_HUB} label="Đơn chưa có hub" round />
          <Legend color="#16a34a" label="Gợi ý đặt hub" dashed />
        </div>
      </div>

      {farOrders.length > 0 && (
        <section aria-label="Đơn chưa có hub gần" className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-amber-900">
            <AlertTriangle size={18} className="shrink-0 text-amber-600" />
            {farOrders.length} đơn cách mọi hub hơn {MAX_LAST_MILE_KM} km nên chưa được xếp xe
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {farOrders.map(({ order: o, hub, km }) => (
              <li key={o.preOrderId} className={`flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs ${focusId === o.preOrderId ? 'ring-2 ring-red-500' : ''}`}>
                <button type="button" onClick={() => showOrder(o)} aria-pressed={focusId === o.preOrderId} title="Xem vị trí người mua trên bản đồ" className="min-w-0 flex-1 cursor-pointer text-left">
                  <span className="block truncate">
                    <MapPin size={12} className="mr-1 inline text-red-600" />
                    <b className="text-gray-900">{o.recipientName}</b> · {formatKg(o.totalKg)} · cách {hub.name} {Math.round(km)} km
                  </span>
                  <span className="block truncate text-gray-500">{o.shippingAddress}</span>
                </button>
                {o.shippingLatitude != null && o.shippingLongitude != null && (
                  <button
                    type="button"
                    onClick={() => {
                      const at: LatLng = [Number(o.shippingLatitude), Number(o.shippingLongitude)]
                      showOrder(o)
                      openDraft(at[0], at[1], o.deliveryWard ? `Hub ${o.deliveryWard.replace(/^(Phường|Xã|Thị trấn)\s+/i, '')}` : '')
                    }}
                    className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white"
                  >
                    Đặt hub
                  </button>
                )}
                <select
                  value=""
                  onChange={(e) => e.target.value && onMove(o.preOrderId, Number(e.target.value))}
                  className="shrink-0 rounded-lg border border-gray-200 bg-white px-1.5 py-1 text-[11px]"
                  aria-label={`Vẫn gán hub cho đơn ${o.code}`}
                >
                  <option value="">Vẫn gán…</option>
                  {hubs.map((h) => <option key={h.hubId} value={h.hubId}>{h.name}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* Bản đồ */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div ref={elRef} className="h-[540px] w-full" aria-label="Bản đồ đơn và hub" />
          {withCoords.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-gray-600 shadow">Chưa có đơn nào có toạ độ giao hàng</div>
          )}
        </div>

        {/* Bảng bên phải */}
        <div className="flex h-[540px] flex-col gap-3 overflow-y-auto pr-1">
          {draft ? (
            <section className="flex flex-col gap-3 rounded-2xl border-2 border-teal-600 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-black text-teal-800"><Plus size={16} /> Hub mới</h4>
                <button type="button" aria-label="Bỏ" onClick={() => setDraft(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
              </div>
              <p className="text-xs text-gray-500">Kéo ghim trên bản đồ để chỉnh vị trí. {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</p>
              {coverage && (
                <div className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">
                  Trong <b>{radiusKm} km</b> quanh điểm này có <b>{coverage.count} đơn · {formatKg(coverage.kg)}</b>.
                  {nearHub && nearHub.km <= radiusKm && (
                    <span className="mt-1 block text-xs text-amber-800">Đã có hub {nearHub.h.name} cách ~{nearHub.km.toFixed(1)} km, có thể không cần thêm hub.</span>
                  )}
                </div>
              )}
              <Field label="Tên hub" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Vd: Hub Thủ Đức" />
              <label className="text-xs font-bold text-gray-700">
                Địa chỉ {draft.geocoding && <Loader2 size={11} className="ml-1 inline animate-spin" />}
                <textarea
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  rows={2}
                  placeholder="Tự điền theo vị trí ghim, sửa lại nếu cần"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Field label="SĐT người trực" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
                <Field label="Giờ nhận hàng" value={draft.openHours} onChange={(v) => setDraft({ ...draft, openHours: v })} />
              </div>
              {draftErr && <p className="text-xs font-semibold text-red-600">{draftErr}</p>}
              <button
                type="button"
                disabled={!!draftErr || create.isPending}
                onClick={() => create.mutate(draft)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
              >
                {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Warehouse size={16} />} Tạo hub tại đây
              </button>
            </section>
          ) : (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="flex items-center gap-2 text-sm font-black text-gray-900"><Warehouse size={15} className="text-[#326318]" /> Hub đang có ({hubs.length})</h4>
                <ul className="mt-3 flex flex-col gap-2">
                  {sortedHubs.map((h) => {
                    const load = hubKg.get(h.hubId)
                    const own = orders.filter((o) => hubOfOrder.get(o.preOrderId) === h.hubId)
                    const open = openHub === h.hubId
                    return (
                      <li key={h.hubId} className={`rounded-xl bg-gray-50 ${h.hubId === newHubId ? 'ring-2 ring-[#326318]' : ''}`}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => { flyTo([h.latitude, h.longitude]); setOpenHub(open ? null : h.hubId) }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-gray-100"
                        >
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: hubColor.get(h.hubId) }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-gray-900">{h.name}{h.hubId === newHubId ? ' · mới' : ''}</span>
                            <span className="block truncate text-[11px] text-gray-500">{h.address}</span>
                          </span>
                          <span className="shrink-0 text-right text-xs font-bold text-gray-700">{load ? `${load.n} đơn · ${formatKg(load.kg)}` : 'Chưa có đơn'}</span>
                          <ChevronDown size={14} className={`shrink-0 text-gray-400 ${open ? 'rotate-180' : ''}`} />
                        </button>
                        {open && (
                          <ul className="flex flex-col gap-1 px-3 pb-3">
                            {own.map((o) => (
                              <li key={o.preOrderId} className={`flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-[11px] ${focusId === o.preOrderId ? 'ring-2 ring-red-500' : ''}`}>
                                <button type="button" onClick={() => showOrder(o)} aria-pressed={focusId === o.preOrderId} title="Xem vị trí người mua trên bản đồ" className="min-w-0 flex-1 cursor-pointer text-left">
                                  <span className="block truncate"><b className="text-gray-900">{o.recipientName}</b> · {formatKg(o.totalKg)}</span>
                                  <span className="block truncate text-gray-500">{o.shippingAddress}</span>
                                </button>
                                <select
                                  value={h.hubId}
                                  onChange={(e) => onMove(o.preOrderId, Number(e.target.value))}
                                  className="max-w-[110px] shrink-0 rounded-md border border-gray-200 bg-white px-1 py-0.5"
                                  aria-label={`Đổi hub đơn ${o.code}`}
                                >
                                  {hubs.map((x) => <option key={x.hubId} value={x.hubId}>{x.name}</option>)}
                                </select>
                              </li>
                            ))}
                            {own.length === 0 && <li className="text-[11px] text-gray-500">Chưa có đơn nào gần hub này nhất.</li>}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                  {hubs.length === 0 && <li className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Chưa có hub nào. Chọn một điểm gợi ý hoặc bấm "Đặt hub trên bản đồ".</li>}
                </ul>
              </section>
              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="flex items-center gap-2 text-sm font-black text-gray-900"><Sparkles size={15} className="text-[#16a34a]" /> Gợi ý đặt thêm hub</h4>
                <p className="mt-1 text-xs text-gray-500">
                  {uncovered.length > 0
                    ? `Còn ${uncovered.length} đơn nằm ngoài ${radiusKm} km quanh các hub đang có, gom thành ${spots.length} điểm. Bấm để đặt hub.`
                    : `Mọi đơn đã có hub trong ${radiusKm} km, không cần thêm hub.`}
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {spots.map((s, i) => (
                    <SpotRow
                      key={s.key}
                      s={s}
                      index={i + 1}
                      onFocus={(v) => setFocusSpot(v ? s.key : null)}
                      onPick={() => { flyTo(s.center); setPlacing(false); openDraft(s.center[0], s.center[1], s.name) }}
                    />
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SpotRow({ s, index, onPick, onFocus }: { s: HubSpot; index: number; onPick: () => void; onFocus: (v: boolean) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        onMouseEnter={() => onFocus(true)}
        onMouseLeave={() => onFocus(false)}
        className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-left transition hover:border-emerald-500 hover:bg-emerald-50"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-emerald-600 text-xs font-black text-emerald-700">{index}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">{s.name}</span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-black text-gray-900">{formatKg(s.totalKg)}</span>
          <span className="block text-[11px] text-gray-500">{s.orders.length} đơn</span>
        </span>
        <MapPin size={15} className="shrink-0 text-emerald-600" />
      </button>
    </li>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="text-xs font-bold text-gray-700">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal" />
    </label>
  )
}

function Legend({ color, label, round, dashed }: { color: string; label: string; round?: boolean; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 ${round ? 'rounded-full' : 'rounded-[3px]'}`} style={{ background: dashed ? '#fff' : color, border: `2px ${dashed ? 'dashed' : 'solid'} ${color}` }} />
      {label}
    </span>
  )
}
