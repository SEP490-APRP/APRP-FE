import type { DeliveryHub, HubFeeConfig, HubTrip, PreOrderResponse } from '@/services'

/**
 * Kế hoạch xe chở hàng từ điểm tập kết ra các hub (chặng giữa, không giao tới nhà người mua):
 * 1. Mỗi đơn giao tận nơi được gán vào hub gần địa chỉ người mua nhất (admin đổi được).
 * 2. Gộp kg theo hub, mặc định mỗi hub xe riêng (hub nhiều hàng thì nhiều xe); các hub ít hàng có thể gộp chung xe.
 * 3. Shipper tại hub nhận đơn và giao chặng cuối như luồng hub hiện có.
 */

export type LatLng = [number, number]

export interface PlanParams {
  /** Sức chở mỗi xe chở hàng ra hub (kg) */
  vehicleKg: number
  /** Các nhóm hub (mã hub) đi chung xe; hub không nằm trong nhóm nào thì xe riêng */
  groups?: number[][]
}

export const DEFAULT_PLAN_PARAMS: PlanParams = { vehicleKg: 1000 }

/** Hệ số đổi đường chim bay sang đường đi thực tế */
const ROAD_FACTOR = 1.25

/** Shipper chặng cuối chỉ giao quanh hub: đơn xa mọi hub hơn mức này (km) không tự gán, admin cần đặt thêm hub */
export const MAX_LAST_MILE_KM = 20

export interface FarOrder {
  order: PreOrderResponse
  /** Hub gần nhất và khoảng cách tới đó (km) */
  hub: DeliveryHub
  km: number
}

export interface HubLoad {
  hub: DeliveryHub
  orders: PreOrderResponse[]
  totalKg: number
  /** Khoảng cách điểm tập kết -> hub (km, ước tính) */
  distanceKm: number | null
}

export interface VehicleStop {
  hub: DeliveryHub
  orders: PreOrderResponse[]
  kg: number
}

/** Một hub đi xe riêng, hoặc vài hub gộp chung xe (loads theo thứ tự xe ghé) */
export interface PlanUnit {
  key: string
  loads: HubLoad[]
  totalKg: number
}

export interface PlanVehicle {
  key: string
  /** Khoá của PlanUnit mà xe thuộc về */
  unit: string
  stops: VehicleStop[]
  totalKg: number
  /** Quãng đường ước tính điểm tập kết -> các hub theo thứ tự ghé (km) */
  routeKm: number | null
}

export interface DeliveryPlan {
  hubLoads: HubLoad[]
  units: PlanUnit[]
  vehicles: PlanVehicle[]
  totalKg: number
  orderCount: number
  /** Đơn không có toạ độ: tạm gán hub gần điểm tập kết nhất, admin nên kiểm tra */
  missingCoords: number
  /** Đơn chưa có hub nào đủ gần: không xếp xe, không tính vào dự toán */
  farOrders: FarOrder[]
}

const toRad = (d: number) => (d * Math.PI) / 180

export function haversineKm(a: LatLng, b: LatLng) {
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(x))
}

const coordOf = (o: PreOrderResponse): LatLng | null =>
  o.shippingLatitude != null && o.shippingLongitude != null ? [Number(o.shippingLatitude), Number(o.shippingLongitude)] : null

const hubPoint = (h: DeliveryHub): LatLng => [h.latitude, h.longitude]

/** Đơn đưa vào kế hoạch: giao tận nơi, đã cọc / đã đóng gói / đã ra hub mà chưa có shipper lấy */
export const plannable = (o: PreOrderResponse) =>
  o.fulfillmentMethod !== 'PICKUP' &&
  (o.status === 'DEPOSIT_PAID' || o.status === 'PROCESSING' || (o.status === 'READY' && !o.shipperId && !o.pickedUpAt))

function nearestHub(at: LatLng | null, hubs: DeliveryHub[]): DeliveryHub | null {
  if (!at || !hubs.length) return null
  return hubs.reduce((best, h) => (haversineKm(hubPoint(h), at) < haversineKm(hubPoint(best), at) ? h : best))
}

/** Hub gợi ý cho đơn: gần người mua nhất; thiếu toạ độ thì hub gần điểm tập kết */
export function suggestHub(o: PreOrderResponse, hubs: DeliveryHub[], site: LatLng | null): DeliveryHub | null {
  return nearestHub(coordOf(o), hubs) ?? nearestHub(site, hubs) ?? hubs[0] ?? null
}

/** Quãng đường điểm tập kết -> các hub theo thứ tự ghé (km), cùng cách tính với BE */
export function routeKmOf(site: LatLng | null, hubs: DeliveryHub[]): number | null {
  if (!site || !hubs.length) return null
  let km = 0
  let at = site
  for (const h of hubs) {
    km += haversineKm(at, hubPoint(h)) * ROAD_FACTOR
    at = hubPoint(h)
  }
  return Math.round(km * 10) / 10
}

/** Thứ tự ghé các hub sao cho tổng quãng đường ngắn nhất (nhóm nhỏ nên thử hết các thứ tự) */
function bestRoute(loads: HubLoad[], site: LatLng | null): HubLoad[] {
  if (!site || loads.length < 2) return loads
  if (loads.length > 6) {
    // Nhóm lớn: lần lượt đi tới hub gần nhất
    const left = [...loads]
    const route: HubLoad[] = []
    let at = site
    while (left.length) {
      left.sort((a, b) => haversineKm(at, hubPoint(a.hub)) - haversineKm(at, hubPoint(b.hub)))
      const next = left.shift()!
      route.push(next)
      at = hubPoint(next.hub)
    }
    return route
  }
  const permute = (xs: HubLoad[]): HubLoad[][] =>
    xs.length < 2 ? [xs] : xs.flatMap((x, i) => permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest]))
  const length = (xs: HubLoad[]) => routeKmOf(site, xs.map((l) => l.hub)) ?? 0
  return permute(loads).reduce((best, r) => (length(r) < length(best) ? r : best))
}

/** Chia các hub thành từng đơn vị xếp xe: nhóm gộp trước, hub còn lại đứng riêng; thứ tự theo mã hub nhỏ nhất */
export function planUnits(loads: HubLoad[], site: LatLng | null, groups: number[][] = []): PlanUnit[] {
  const byId = new Map(loads.map((l) => [l.hub.hubId, l]))
  const used = new Set<number>()
  const members: HubLoad[][] = []
  for (const g of groups) {
    const inGroup: HubLoad[] = []
    for (const id of g) {
      const l = byId.get(id)
      if (l && !used.has(id)) {
        used.add(id)
        inGroup.push(l)
      }
    }
    if (inGroup.length) members.push(inGroup)
  }
  for (const l of loads) if (!used.has(l.hub.hubId)) members.push([l])
  const first = (xs: HubLoad[]) => Math.min(...xs.map((l) => l.hub.hubId))
  return members
    .sort((a, b) => first(a) - first(b))
    .map((xs) => ({
      key: xs.map((l) => l.hub.hubId).sort((a, b) => a - b).join('-'),
      loads: bestRoute(xs, site),
      totalKg: xs.reduce((s, l) => s + l.totalKg, 0),
    }))
}

/**
 * Xếp xe cho từng đơn vị: lần lượt từng hub theo thứ tự ghé, đơn nặng xếp trước, nhét vào xe còn chỗ đầu tiên,
 * hết chỗ thì mở xe mới. Thứ tự xe theo mã hub để số xe không đổi khi lượng hàng giữa các hub thay đổi.
 */
export function packVehicles(loads: HubLoad[], site: LatLng | null, capacityKg: number, groups: number[][] = []): PlanVehicle[] {
  const cap = Math.max(1, capacityKg)
  const vehicles: PlanVehicle[] = []
  for (const unit of planUnits(loads, site, groups)) {
    const bins: { stops: VehicleStop[]; kg: number }[] = []
    for (const load of unit.loads) {
      for (const o of [...load.orders].sort((a, b) => Number(b.totalKg ?? 0) - Number(a.totalKg ?? 0))) {
        const w = Number(o.totalKg ?? 0)
        let bin = bins.find((x) => x.kg + w <= cap)
        if (!bin) {
          bin = { stops: [], kg: 0 }
          bins.push(bin)
        }
        let stop = bin.stops.find((s) => s.hub.hubId === load.hub.hubId)
        if (!stop) {
          stop = { hub: load.hub, orders: [], kg: 0 }
          bin.stops.push(stop)
        }
        stop.orders.push(o)
        stop.kg += w
        bin.kg += w
      }
    }
    for (const bin of bins) {
      vehicles.push({
        key: `xe-${vehicles.length + 1}`,
        unit: unit.key,
        stops: bin.stops,
        totalKg: bin.kg,
        routeKm: routeKmOf(site, bin.stops.map((s) => s.hub)),
      })
    }
  }
  return vehicles
}

/** Lập kế hoạch: overrides ghi đè hub theo mã đơn (admin đổi tay) */
export function buildDeliveryPlan(
  orders: PreOrderResponse[],
  hubs: DeliveryHub[],
  site: LatLng | null,
  params: PlanParams,
  overrides: Record<number, number> = {},
): DeliveryPlan {
  const byHub = new Map<number, HubLoad>()
  let missingCoords = 0
  let orderCount = 0
  const farOrders: FarOrder[] = []
  for (const o of orders.filter(plannable)) {
    const at = coordOf(o)
    if (!at) missingCoords++
    // Hub admin đổi tay, hoặc hub đơn đã được chở tới, thì giữ nguyên dù xa
    const chosen = overrides[o.preOrderId] ?? (o.status === 'READY' ? o.hubId : undefined)
    const forced = chosen != null ? hubs.find((h) => h.hubId === chosen) : undefined
    const hub = forced ?? suggestHub(o, hubs, site)
    if (!hub) continue
    if (!forced && at) {
      const km = haversineKm(hubPoint(hub), at) * ROAD_FACTOR
      if (km > MAX_LAST_MILE_KM) {
        farOrders.push({ order: o, hub, km })
        continue
      }
    }
    orderCount++
    if (!byHub.has(hub.hubId)) {
      byHub.set(hub.hubId, {
        hub,
        orders: [],
        totalKg: 0,
        distanceKm: site ? Math.round(haversineKm(site, hubPoint(hub)) * ROAD_FACTOR * 10) / 10 : null,
      })
    }
    const load = byHub.get(hub.hubId)!
    load.orders.push(o)
    load.totalKg += Number(o.totalKg ?? 0)
  }
  const hubLoads = [...byHub.values()].sort((a, b) => b.totalKg - a.totalKg)
  return {
    hubLoads,
    units: planUnits(hubLoads, site, params.groups),
    vehicles: packVehicles(hubLoads, site, params.vehicleKg, params.groups),
    totalKg: hubLoads.reduce((s, l) => s + l.totalKg, 0),
    orderCount,
    missingCoords,
    farOrders,
  }
}

/* ───────────── Đội xe: chuyến đã gọi + phần hàng còn lại ───────────── */

export interface FleetVehicle extends PlanVehicle {
  /** Số thứ tự xe, khớp chuyến đã lưu */
  tripNo: number
  /** Chuyến đã lưu; không có = xe mới xếp, chưa gọi */
  trip?: HubTrip
}

export interface Fleet extends DeliveryPlan {
  vehicles: FleetVehicle[]
  /** Chuyến đã lưu nhưng hết hàng (đơn trên xe đều bị huỷ), sẽ huỷ khi cập nhật */
  emptied: HubTrip[]
}

/**
 * Chuyến đã gọi được giữ nguyên như lúc lưu; hàng chưa nằm trong chuyến nào thì xếp xe mới theo cỡ xe đang chọn.
 * replan = admin chọn lại cỡ xe: chỉ giữ các chuyến đã có tài xế, hàng của chuyến chưa ai nhận được xếp lại.
 */
export function composeFleet(
  orders: PreOrderResponse[],
  hubs: DeliveryHub[],
  site: LatLng | null,
  trips: HubTrip[],
  opts: { vehicleKg: number; replan?: boolean; overrides?: Record<number, number>; group: (loads: HubLoad[]) => number[][] },
): Fleet {
  const kept = trips.filter((t) => t.status !== 'CANCELLED' && (!opts.replan || t.driverId != null))
  const assigned: Record<number, number> = {}
  for (const t of kept) for (const s of t.stops) for (const id of s.orderIds ?? []) if (s.hubId != null) assigned[id] = s.hubId
  const base = buildDeliveryPlan(orders, hubs, site, { vehicleKg: opts.vehicleKg }, { ...opts.overrides, ...assigned })
  const byId = new Map(orders.map((o) => [o.preOrderId, o]))
  const emptied: HubTrip[] = []
  const saved: FleetVehicle[] = []
  for (const t of kept) {
    // Xe chưa lấy hàng thì tính theo đơn hiện tại (đơn bị bớt thùng / huỷ do thiếu hàng); đã lấy hàng thì giữ như lúc lưu
    const moved = t.status === 'IN_TRANSIT' || t.status === 'DELIVERED'
    const stops: VehicleStop[] = []
    for (const s of t.stops) {
      const own = (s.orderIds ?? []).map((id) => byId.get(id)).filter((o): o is PreOrderResponse => !!o)
      const live = moved ? own : own.filter((o) => o.status !== 'CANCELLED')
      if (own.length > 0 && live.length === 0) continue
      stops.push({
        hub:
          hubs.find((h) => h.hubId === s.hubId) ??
          ({ hubId: s.hubId ?? 0, name: s.hubName ?? 'Hub', address: s.hubAddress ?? '', latitude: s.hubLatitude ?? 0, longitude: s.hubLongitude ?? 0 } as DeliveryHub),
        orders: live,
        kg: moved || own.length === 0 ? Number(s.kg ?? 0) : live.reduce((sum, o) => sum + Number(o.totalKg ?? 0), 0),
      })
    }
    if (stops.length === 0) {
      emptied.push(t)
      continue
    }
    const sameStops = stops.length === t.stops.length
    saved.push({
      key: `xe-${t.tripNo}`,
      tripNo: t.tripNo,
      trip: t,
      unit: stops.map((s) => s.hub.hubId).sort((a, b) => a - b).join('-'),
      stops,
      totalKg: moved ? Number(t.totalKg) : stops.reduce((sum, s) => sum + s.kg, 0),
      routeKm: sameStops && t.routeKm != null ? t.routeKm : routeKmOf(site, stops.map((s) => s.hub)),
    })
  }
  const rest = base.hubLoads
    .map((l) => {
      const left = l.orders.filter((o) => assigned[o.preOrderId] == null)
      return { ...l, orders: left, totalKg: left.reduce((s, o) => s + Number(o.totalKg ?? 0), 0) }
    })
    .filter((l) => l.orders.length > 0)
  const used = new Set([...saved.map((v) => v.tripNo), ...emptied.map((t) => t.tripNo)])
  let next = 1
  const fresh: FleetVehicle[] = packVehicles(rest, site, opts.vehicleKg, opts.group(rest)).map((v) => {
    while (used.has(next)) next++
    used.add(next)
    return { ...v, key: `xe-${next}`, tripNo: next }
  })
  return { ...base, vehicles: [...saved, ...fresh].sort((a, b) => a.tripNo - b.tripNo), emptied }
}

/* ───────────── Hàng hụt sau khi cân: đơn bị bớt và xe phải cập nhật ───────────── */

export interface ShortOrder {
  order: PreOrderResponse
  oldKg: number
  newKg: number
  refund: number
  cancelled: boolean
}

/** Đơn bị bớt thùng hoặc huỷ khi chốt phần thiếu */
export function shortfallOrders(orders: PreOrderResponse[]): ShortOrder[] {
  const rows: ShortOrder[] = []
  for (const o of orders) {
    const cancelled = o.status === 'CANCELLED' && !!o.cancelReason?.startsWith('Thiếu hàng tại điểm tập kết')
    const original = o.originalCrateQuantity ?? o.crateQuantity
    if (!cancelled && (o.status === 'CANCELLED' || original <= o.crateQuantity)) continue
    rows.push({ order: o, oldKg: original * o.crateKg, newKg: cancelled ? 0 : Number(o.totalKg), refund: Number(o.shortfallRefundAmount ?? 0), cancelled })
  }
  return rows
}

export interface TripChange {
  tripNo: number
  driverName?: string | null
  oldKg: number
  newKg: number
  oldFee: number
  newFee: number
}

/** Chuyến đã lưu có số kg / điểm dừng khác với hàng hiện tại (kể cả chuyến hết hàng) */
export function tripChanges(fleet: Fleet, cfg: HubFeeConfig): TripChange[] {
  const changed = fleet.vehicles
    .filter((v) => v.trip && (Math.abs(Number(v.trip.totalKg) - v.totalKg) > 0.001 || v.trip.stops.length !== v.stops.length))
    .map((v) => ({ tripNo: v.tripNo, driverName: v.trip!.driverName, oldKg: Number(v.trip!.totalKg), newKg: v.totalKg, oldFee: Number(v.trip!.feeAmount), newFee: tripFee(cfg, v.routeKm, v.totalKg) }))
  const gone = fleet.emptied.map((t) => ({ tripNo: t.tripNo, driverName: t.driverName, oldKg: Number(t.totalKg), newKg: 0, oldFee: Number(t.feeAmount), newFee: 0 }))
  return [...changed, ...gone].sort((a, b) => a.tripNo - b.tripNo)
}

/** Sàn được / mất bao nhiêu vì phần hụt: mất hoa hồng và phí giao đơn huỷ, bớt tiền shipper và tiền xe */
export function shortfallImpact(short: ShortOrder[], changes: TripChange[], cfg: HubFeeConfig) {
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const cancelled = short.filter((s) => s.cancelled && s.order.fulfillmentMethod !== 'PICKUP')
  const commissionLost = Math.round(sum(short.map((s) => (s.oldKg - s.newKg) * Number(s.order.unitPrice))) * cfg.farmerFeeRate)
  const shipLost = sum(cancelled.map((s) => Math.max(0, Number(s.order.shippingFee ?? 0) - Number(s.order.shippingDiscountAmount ?? 0))))
  const shipperSaved = sum(cancelled.map((s) => Number(s.order.shipperEarnEstimate ?? netOf(Number(s.order.shippingBaseFee ?? 0), cfg.serviceFeeRate))))
  const truckSaved = sum(changes.map((c) => netOf(c.oldFee, cfg.hubServiceFeeRate) - netOf(c.newFee, cfg.hubServiceFeeRate)))
  return {
    cutKg: sum(short.map((s) => s.oldKg - s.newKg)),
    refund: sum(short.map((s) => s.refund)),
    commissionLost,
    shipLost,
    shipperSaved,
    truckSaved,
    profitChange: truckSaved + shipperSaved - commissionLost - shipLost,
  }
}

/** Lý do chưa chốt xe ra hub được; null = chốt được */
export function dispatchBlockedReason(status: string, pendingIntake: number, shortfallKg = 0): string | null {
  if (status !== 'FULFILLING') return 'Chưa bắt đầu gom hàng nên chưa chốt xe ra hub được.'
  if (pendingIntake > 0) return `Còn ${pendingIntake} lô nhà vườn chưa cân nhận, cân xong mới chốt xe ra hub được.`
  return shortfallKg > 0 ? `Còn thiếu ${shortfallKg.toLocaleString('vi-VN')} kg: bổ sung hàng hoặc chốt phần thiếu rồi mới chốt xe ra hub.` : null
}

/* ───────────── Gợi ý điểm đặt hub từ vị trí các đơn ───────────── */

export interface HubSpot {
  key: string
  /** Tâm cụm đơn (trung bình có trọng số theo kg) */
  center: LatLng
  orders: PreOrderResponse[]
  totalKg: number
  /** Tên gợi ý, lấy theo phường của đơn gần tâm nhất */
  name: string
  /** Hub đang có gần điểm này (trong bán kính), nếu có thì không cần thêm hub mới */
  coveredBy: { hub: DeliveryHub; km: number } | null
}

/**
 * Gom đơn thành các cụm trong bán kính radiusKm để gợi ý điểm đặt hub:
 * lần lượt chọn điểm bao được nhiều kg nhất trong bán kính, lấy cụm đó ra, lặp lại tới khi hết đơn.
 */
export function suggestHubSpots(orders: PreOrderResponse[], hubs: DeliveryHub[], radiusKm: number): HubSpot[] {
  let left = orders.map((o) => ({ o, at: coordOf(o) })).filter((x): x is { o: PreOrderResponse; at: LatLng } => !!x.at)
  const spots: HubSpot[] = []
  const kgOf = (o: PreOrderResponse) => Number(o.totalKg ?? 0)
  while (left.length) {
    let members = [left[0]]
    let bestKg = -1
    for (const p of left) {
      const inside = left.filter((q) => haversineKm(p.at, q.at) <= radiusKm)
      const kg = inside.reduce((s, q) => s + kgOf(q.o), 0)
      if (kg > bestKg) {
        bestKg = kg
        members = inside
      }
    }
    const totalKg = members.reduce((s, q) => s + kgOf(q.o), 0)
    const w = totalKg || members.length
    const center: LatLng = [
      members.reduce((s, q) => s + q.at[0] * (kgOf(q.o) || 1), 0) / w,
      members.reduce((s, q) => s + q.at[1] * (kgOf(q.o) || 1), 0) / w,
    ]
    // Đặt tên theo phường của đơn gần tâm nhất để tên khớp với chỗ ghim
    const topWard = [...members].sort((a, b) => haversineKm(center, a.at) - haversineKm(center, b.at)).find((q) => q.o.deliveryWard)?.o.deliveryWard
    const near = hubs
      .map((h) => ({ hub: h, km: haversineKm(center, hubPoint(h)) }))
      .filter((x) => x.km <= radiusKm)
      .sort((a, b) => a.km - b.km)[0]
    spots.push({
      key: `spot-${spots.length + 1}`,
      center,
      orders: members.map((q) => q.o),
      totalKg,
      name: topWard ? `Hub ${topWard.replace(/^(Phường|Xã|Thị trấn)\s+/i, '')}` : `Hub ${spots.length + 1}`,
      coveredBy: near ? { hub: near.hub, km: near.km } : null,
    })
    left = left.filter((p) => !members.includes(p))
  }
  return spots.sort((a, b) => b.totalKg - a.totalKg)
}

/** Đơn chưa nằm trong bán kính phục vụ của hub nào: chỉ những đơn này cần gợi ý đặt thêm hub */
export function outsideHubs(orders: PreOrderResponse[], hubs: DeliveryHub[], radiusKm: number) {
  return orders.filter((o) => {
    const at = coordOf(o)
    return !!at && !hubs.some((h) => haversineKm(hubPoint(h), at) <= radiusKm)
  })
}

/** Số đơn và kg nằm trong bán kính quanh một điểm (để admin biết hub đặt ở đây phục vụ được bao nhiêu) */
export function coverageAround(orders: PreOrderResponse[], at: LatLng, radiusKm: number) {
  let count = 0
  let kg = 0
  for (const o of orders) {
    const p = coordOf(o)
    if (p && haversineKm(at, p) <= radiusKm) {
      count++
      kg += Number(o.totalKg ?? 0)
    }
  }
  return { count, kg }
}

/* ───────────── Ước tính cước (khớp HubTripFeeCalculator ở BE) và dự toán tiền thu về ───────────── */

/** Hạng xe tính cước theo số kg trên xe; nặng hơn mọi hạng thì tính xe lớn nhất */
export const truckTier = (cfg: HubFeeConfig, totalKg: number) => cfg.tiers.find((t) => totalKg <= t.maxKg) ?? cfg.tiers[cfg.tiers.length - 1]

/** Cước gộp một chuyến xe ra hub: giá mở cửa + km thứ 5-20 + km trên 20, làm tròn 1.000đ */
export function tripFee(cfg: HubFeeConfig, routeKm: number | null, totalKg: number): number {
  const t = truckTier(cfg, totalKg)
  const km = routeKm ?? 0
  const raw = t.openFee + Math.max(0, Math.min(km, 20) - cfg.openKm) * t.perKm + Math.max(0, km - 20) * t.perKmOver20
  return Math.round(raw / 1000) * 1000
}

/** Số tài xế nhận sau phí dịch vụ */
export const netOf = (gross: number, rate: number) => gross - Math.round(gross * rate)

/** Cước giao chặng cuối theo khoảng cách hub -> người mua */
export function lastMileFee(cfg: HubFeeConfig, km: number): number {
  const t = cfg.lastMile
  if (km < 5) return t.under5
  if (km <= 10) return t.from5to10
  if (km <= 20) return t.from10to20
  return t.from10to20 + Math.ceil(km - 20) * t.perKmOver20
}

const MAX_STOPS = 4

/**
 * Gợi ý gộp hub chung xe: mặc định mỗi hub một xe, chỉ ghép khi có xe chở chưa tới nửa tải, tổng hàng vẫn vừa một xe
 * và cước giảm. Mỗi vòng ghép cặp tiết kiệm nhiều nhất, tới khi không còn cặp nào đáng ghép.
 */
export function suggestGroups(loads: HubLoad[], site: LatLng | null, cfg: HubFeeConfig, capacityKg: number): number[][] {
  if (!site) return []
  const cost = (xs: HubLoad[]) =>
    tripFee(cfg, routeKmOf(site, bestRoute(xs, site).map((l) => l.hub)), xs.reduce((s, l) => s + l.totalKg, 0))
  const kg = (xs: HubLoad[]) => xs.reduce((s, l) => s + l.totalKg, 0)
  // Hub cần từ 2 xe trở lên không ghép
  const sets = loads.filter((l) => l.totalKg <= capacityKg).map((l) => [l])
  for (;;) {
    let best: { i: number; j: number; saving: number } | null = null
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const [a, b] = [sets[i], sets[j]]
        if (a.length + b.length > MAX_STOPS || kg(a) + kg(b) > capacityKg) continue
        if (kg(a) >= capacityKg / 2 && kg(b) >= capacityKg / 2) continue
        const saving = cost(a) + cost(b) - cost([...a, ...b])
        if (saving > 0 && (!best || saving > best.saving)) best = { i, j, saving }
      }
    }
    if (!best) break
    sets[best.i] = [...sets[best.i], ...sets[best.j]]
    sets.splice(best.j, 1)
  }
  return sets.filter((s) => s.length > 1).map((s) => s.map((l) => l.hub.hubId).sort((a, b) => a - b))
}

/** Nhóm hub đang đi chung xe theo các chuyến đã lưu */
export function groupsFromTrips(trips: { status?: string; stops?: { hubId?: number | null }[] | null }[]): number[][] {
  let groups: Set<number>[] = []
  for (const t of trips) {
    if (t.status === 'CANCELLED') continue
    const ids = (t.stops ?? []).map((s) => s.hubId).filter((id): id is number => id != null)
    if (ids.length < 2) continue
    const overlap = groups.filter((g) => ids.some((id) => g.has(id)))
    const merged = new Set([...ids, ...overlap.flatMap((g) => [...g])])
    groups = [...groups.filter((g) => !overlap.includes(g)), merged]
  }
  return groups.map((g) => [...g].sort((a, b) => a - b))
}

/** Đơn đã bán (đã cọc trở đi): tính vào tiền thu về */
const SOLD: PreOrderResponse['status'][] = ['DEPOSIT_PAID', 'PROCESSING', 'READY', 'SHIPPING', 'DELIVERED']

export interface Forecast {
  /** Tiền hàng người mua trả */
  goods: number
  /** Hoa hồng sàn giữ trên tiền hàng */
  commission: number
  /** Phí giao người mua trả */
  shipCollected: number
  /** Cước gộp từng xe ra hub, theo thứ tự plan.vehicles */
  vehicleGross: number[]
  /** Sàn trả tài xế xe ra hub (đủ cước theo bảng giá) */
  tripCost: number
  /** Sàn trả shipper giao tới nhà (sau phí dịch vụ) */
  lastMileCost: number
  deliveryCount: number
  /** Số đơn chưa có hub gần nên chưa tính vào dự toán */
  skippedCount: number
  /** Sàn còn lại = hoa hồng + phí giao - tiền xe - tiền shipper */
  profit: number
}

export function forecast(orders: PreOrderResponse[], plan: DeliveryPlan, cfg: HubFeeConfig): Forecast {
  // Đơn chưa có hub gần: chưa biết tiền vận chuyển nên bỏ cả tiền hàng, tránh dự toán lệch
  const far = new Set(plan.farOrders.map((f) => f.order.preOrderId))
  const sold = orders.filter((o) => SOLD.includes(o.status) && !far.has(o.preOrderId))
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const goods = sum(sold.map((o) => Number(o.totalAmount ?? 0)))
  const commission = Math.round(goods * cfg.farmerFeeRate)
  const shipCollected = sum(sold.map((o) => Math.max(0, Number(o.shippingFee ?? 0) - Number(o.shippingDiscountAmount ?? 0))))
  const hubOf = new Map<number, DeliveryHub>()
  for (const l of plan.hubLoads) for (const o of l.orders) hubOf.set(o.preOrderId, l.hub)
  const lastMile = sold
    .filter((o) => o.fulfillmentMethod !== 'PICKUP')
    .map((o) => {
      const hub = hubOf.get(o.preOrderId)
      const at = coordOf(o)
      return hub && at ? lastMileFee(cfg, haversineKm(hubPoint(hub), at) * ROAD_FACTOR) : Number(o.shippingBaseFee ?? 0)
    })
  const vehicleGross = plan.vehicles.map((v) => tripFee(cfg, v.routeKm, v.totalKg))
  const tripCost = sum(vehicleGross.map((g) => netOf(g, cfg.hubServiceFeeRate)))
  const lastMileCost = sum(lastMile.map((g) => netOf(g, cfg.serviceFeeRate)))
  return {
    goods,
    commission,
    shipCollected,
    vehicleGross,
    tripCost,
    lastMileCost,
    deliveryCount: lastMile.length,
    skippedCount: far.size,
    profit: commission + shipCollected - tripCost - lastMileCost,
  }
}

/* ───────────── Đơn xa mọi hub: gợi ý cách gắn ít tốn tiền vận chuyển nhất ───────────── */

export interface FarOption {
  /** Hub đang có hàng để gộp đơn vào; null = đặt hub mới ngay tại nhà người mua */
  hub: DeliveryHub | null
  /** Quãng đường hub -> người mua (km) */
  km: number
  /** Số đơn hub đang phục vụ trong kế hoạch */
  hubOrders: number
  /** Tiền vận chuyển sàn trả thêm so với kế hoạch hiện tại = tiền xe + tiền shipper */
  addedCost: number
  tripDelta: number
  lastMileDelta: number
  extraVehicles: number
  /** Số đơn đang chờ chia hub được giải quyết luôn bằng cách này */
  served: number
  /** Rẻ nhất tính trên mỗi đơn được giải quyết */
  best: boolean
}

/** Số hub có hàng gần người mua nhất được đem ra so */
const FAR_CANDIDATES = 6

/**
 * Thử gộp đơn xa vào từng hub đang có hàng (không phải mở thêm điểm dừng) và thử đặt hub mới tại chỗ,
 * dùng đúng cách xếp xe và dự toán của kế hoạch. Trả về tối đa 2 hub rẻ nhất, kèm phương án hub mới.
 */
export function farOrderOptions(
  far: FarOrder,
  current: Fleet,
  input: { orders: PreOrderResponse[]; hubs: DeliveryHub[]; site: LatLng | null; trips: HubTrip[]; opts: Parameters<typeof composeFleet>[4]; cfg: HubFeeConfig },
): FarOption[] {
  const { orders, hubs, site, trips, opts, cfg } = input
  const at = coordOf(far.order)
  if (!at) return []
  const base = forecast(orders, current, cfg)
  const kmTo = (h: DeliveryHub) => haversineKm(hubPoint(h), at) * ROAD_FACTOR
  const evaluate = (hub: DeliveryHub | null, hubOrders: number, hubList: DeliveryHub[], overrides: Record<number, number>): FarOption => {
    const fleet = composeFleet(orders, hubList, site, trips, { ...opts, overrides })
    const f = forecast(orders, fleet, cfg)
    const tripDelta = f.tripCost - base.tripCost
    const lastMileDelta = f.lastMileCost - base.lastMileCost
    return {
      hub,
      km: hub ? kmTo(hub) : 0,
      hubOrders,
      addedCost: tripDelta + lastMileDelta,
      tripDelta,
      lastMileDelta,
      extraVehicles: fleet.vehicles.length - current.vehicles.length,
      served: Math.max(1, current.farOrders.length - fleet.farOrders.length),
      best: false,
    }
  }
  // Chưa hub nào có hàng thì so hub gần nhất
  const loaded = current.hubLoads.length ? current.hubLoads.map((l) => ({ hub: l.hub, n: l.orders.length })) : [{ hub: far.hub, n: 0 }]
  const existing = loaded
    .sort((a, b) => kmTo(a.hub) - kmTo(b.hub))
    .slice(0, FAR_CANDIDATES)
    .map(({ hub, n }) => evaluate(hub, n, hubs, { ...opts.overrides, [far.order.preOrderId]: hub.hubId }))
    .sort((a, b) => a.addedCost - b.addedCost || a.km - b.km)
    .slice(0, 2)
  const spot = { hubId: -far.order.preOrderId, name: 'Hub mới', address: far.order.shippingAddress ?? '', latitude: at[0], longitude: at[1], active: true } as DeliveryHub
  const list = [...existing, evaluate(null, 0, [...hubs, spot], opts.overrides ?? {})]
  const perOrder = (o: FarOption) => o.addedCost / o.served
  const cheapest = list.reduce((a, b) => (perOrder(b) < perOrder(a) ? b : a))
  return list.map((o) => ({ ...o, best: o === cheapest }))
}

/* ───────────── So các cỡ xe để gợi ý cỡ tối ưu ───────────── */

export interface SizeOption {
  kg: number
  vehicles: number
  tripCost: number
  /** Sàn còn lại theo dự toán nếu chọn cỡ này */
  profit: number
  /** Số xe chưa có đủ tài xế (mỗi xe một tài xế riêng, đủ tải) */
  noDriver: number
  /** Đủ tài xế nhất, rồi sàn còn lại nhiều nhất, rồi ít xe, rồi xe nhỏ */
  best: boolean
}

/** Số xe không ghép được tài xế: xe nặng chọn trước, lấy tài xế có tải nhỏ nhất vẫn chở được */
export function vehiclesWithoutDriver(vehicleKgs: number[], driverCaps: number[]) {
  const free = [...driverCaps].sort((a, b) => a - b)
  let missing = 0
  for (const kg of [...vehicleKgs].sort((a, b) => b - a)) {
    const i = free.findIndex((cap) => cap >= kg)
    if (i < 0) missing++
    else free.splice(i, 1)
  }
  return missing
}

export function compareVehicleSizes(
  sizes: number[],
  input: {
    orders: PreOrderResponse[]
    hubs: DeliveryHub[]
    site: LatLng | null
    trips: HubTrip[]
    cfg: HubFeeConfig
    overrides?: Record<number, number>
    replan?: boolean
    /** Sức chở của từng tài xế đang gọi được (đúng bán kính, chưa nhận xe nào) */
    driverCaps: number[]
  },
): SizeOption[] {
  const { orders, hubs, site, trips, cfg, overrides, replan, driverCaps } = input
  const list = sizes.map((kg) => {
    const fleet = composeFleet(orders, hubs, site, trips, { vehicleKg: kg, replan, overrides, group: (loads) => suggestGroups(loads, site, cfg, kg) })
    const f = forecast(orders, fleet, cfg)
    const open = fleet.vehicles.filter((v) => v.trip?.driverId == null)
    return { kg, vehicles: fleet.vehicles.length, tripCost: f.tripCost, profit: f.profit, noDriver: vehiclesWithoutDriver(open.map((v) => v.totalKg), driverCaps), best: false }
  })
  const top = [...list].sort((a, b) => a.noDriver - b.noDriver || b.profit - a.profit || a.vehicles - b.vehicles || a.kg - b.kg)[0]
  return list.map((o) => ({ ...o, best: o === top && o.vehicles > 0 }))
}
