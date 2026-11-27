import { describe, expect, it } from 'vitest'
import type { DeliveryHub, PreOrderResponse } from '@/services'
import { buildDeliveryPlan, packVehicles, type LatLng } from './deliveryPlan'

const site: LatLng = [10.985, 106.518] // điểm tập kết Củ Chi
const hub = (hubId: number, name: string, latitude: number, longitude: number) =>
  ({ hubId, name, address: name, latitude, longitude, active: true, waitingOrders: 0 }) as DeliveryHub
const q1 = hub(1, 'Quận 1', 10.786, 106.699)
const td = hub(2, 'Thủ Đức', 10.8506, 106.7719)

const order = (id: number, lat: number, lng: number, kg: number, extra: Partial<PreOrderResponse> = {}) =>
  ({ preOrderId: id, code: `P${id}`, totalKg: kg, status: 'DEPOSIT_PAID', fulfillmentMethod: 'DELIVERY', shippingLatitude: lat, shippingLongitude: lng, ...extra }) as PreOrderResponse

describe('buildDeliveryPlan', () => {
  it('gán đơn vào hub gần người mua nhất và gộp kg theo hub', () => {
    const plan = buildDeliveryPlan(
      [order(1, 10.777, 106.701, 30), order(2, 10.87, 106.79, 45), order(3, 10.78, 106.69, 20)],
      [q1, td], site, { vehicleKg: 500 },
    )
    expect(plan.hubLoads.map((l) => [l.hub.hubId, l.totalKg])).toEqual([[1, 50], [2, 45]])
    // Mỗi hub một xe riêng dù cộng lại vẫn vừa một xe
    expect(plan.vehicles.map((v) => [v.stops.length, v.stops[0].hub.hubId, v.totalKg])).toEqual([[1, 1, 50], [1, 2, 45]])
  })

  it('bỏ đơn tự đến lấy, đơn đã có shipper; admin đổi hub được', () => {
    const plan = buildDeliveryPlan(
      [order(1, 10.777, 106.701, 30), order(2, 10.777, 106.701, 10, { fulfillmentMethod: 'PICKUP' }), order(3, 10.777, 106.701, 10, { status: 'SHIPPING' })],
      [q1, td], site, { vehicleKg: 500 }, { 1: 2 },
    )
    expect(plan.orderCount).toBe(1)
    expect(plan.hubLoads[0].hub.hubId).toBe(2)
  })
})

describe('đơn ở xa mọi hub', () => {
  it('không tự gán vào hub, admin gán tay thì vẫn xếp xe', () => {
    const orders = [order(1, 10.777, 106.701, 30), order(2, 11.9465, 108.4419, 40)] // đơn 2 ở Đà Lạt
    const plan = buildDeliveryPlan(orders, [q1], site, { vehicleKg: 1000 })
    expect([plan.orderCount, plan.totalKg]).toEqual([1, 30])
    expect(plan.farOrders.map((f) => [f.order.preOrderId, f.km > 200])).toEqual([[2, true]])
    const forced = buildDeliveryPlan(orders, [q1], site, { vehicleKg: 1000 }, { 2: 1 })
    expect([forced.orderCount, forced.farOrders.length]).toEqual([2, 0])
  })
})

describe('packVehicles', () => {
  it('mở xe mới khi đầy, không vượt sức chở', () => {
    const loads = [{ hub: q1, orders: [1, 2, 3, 4, 5].map((i) => order(i, 10.78, 106.7, 30)), totalKg: 150, distanceKm: 30 }]
    const vehicles = packVehicles(loads, site, 60)
    expect(vehicles.map((v) => v.totalKg)).toEqual([60, 60, 30])
  })
})

import { coverageAround, outsideHubs, suggestHubSpots } from './deliveryPlan'

describe('suggestHubSpots', () => {
  const orders = [
    order(1, 10.777, 106.701, 30, { deliveryWard: 'Phường Bến Nghé' }),
    order(2, 10.78, 106.699, 20, { deliveryWard: 'Phường Bến Nghé' }),
    order(3, 10.87, 106.79, 45, { deliveryWard: 'Phường Linh Trung' }),
  ]

  it('gom đơn gần nhau thành một cụm và đặt tên theo phường', () => {
    const spots = suggestHubSpots(orders, [], 4)
    expect(spots).toHaveLength(2)
    expect(spots[0].orders).toHaveLength(2)
    expect(spots[0].name).toBe('Hub Bến Nghé')
    expect(spots.every((s) => s.coveredBy === null)).toBe(true)
  })

  it('đánh dấu cụm đã có hub gần', () => {
    const spots = suggestHubSpots(orders, [q1], 4)
    expect(spots.find((s) => s.orders.length === 2)?.coveredBy?.hub.hubId).toBe(1)
    expect(spots.find((s) => s.orders.length === 1)?.coveredBy).toBeNull()
  })

  it('trừ các đơn đã có hub trong bán kính', () => {
    expect(outsideHubs(orders, [q1], 4).map((o) => o.preOrderId)).toEqual([3])
    expect(outsideHubs(orders, [q1, td], 4)).toEqual([])
  })

  it('tính số đơn và kg trong bán kính quanh một điểm', () => {
    expect(coverageAround(orders, [10.778, 106.7], 2)).toEqual({ count: 2, kg: 50 })
  })
})

import { lastMileFee, netOf, tripFee } from './deliveryPlan'
import type { HubFeeConfig } from '@/services'

const cfg: HubFeeConfig = {
  openKm: 4,
  minVehicleKg: 300,
  roadFactor: 1.25,
  tiers: [
    { label: 'Xe tải nhỏ', maxKg: 1000, openFee: 250_000, perKm: 13_000, perKmOver20: 11_000 },
    { label: 'Xe tải trung', maxKg: 2500, openFee: 350_000, perKm: 15_000, perKmOver20: 13_000 },
    { label: 'Xe tải lớn', maxKg: 5000, openFee: 500_000, perKm: 20_000, perKmOver20: 17_000 },
  ],
  lastMile: { under5: 15_000, from5to10: 20_000, from10to20: 30_000, perKmOver20: 3_000 },
  serviceFeeRate: 0.03,
  hubServiceFeeRate: 0,
  farmerFeeRate: 0.3,
}

describe('cước xe ra hub (khớp HubTripFeeCalculatorTest ở BE)', () => {
  it('giá mở cửa 4 km đầu rồi tính theo km, hạng xe theo số kg', () => {
    expect(tripFee(cfg, 4, 500)).toBe(250_000)
    expect(tripFee(cfg, 15, 1000)).toBe(393_000)
    expect(tripFee(cfg, 30, 800)).toBe(568_000)
    expect(tripFee(cfg, 15, 1001)).toBe(515_000)
    expect(tripFee(cfg, 15, 4000)).toBe(720_000)
    expect(tripFee(cfg, null, 100)).toBe(250_000)
  })

  it('tiền tài xế nhận sau phí dịch vụ 3%', () => {
    expect(netOf(360_000, 0.03)).toBe(349_200)
  })

  it('cước giao chặng cuối theo bậc khoảng cách', () => {
    expect(lastMileFee(cfg, 3)).toBe(15_000)
    expect(lastMileFee(cfg, 8)).toBe(20_000)
    expect(lastMileFee(cfg, 15)).toBe(30_000)
    expect(lastMileFee(cfg, 21.5)).toBe(36_000)
  })
})

import { composeFleet, forecast, groupsFromTrips, shortfallImpact, shortfallOrders, suggestGroups, tripChanges } from './deliveryPlan'
import type { HubTrip } from '@/services'

describe('gộp hub chung xe', () => {
  const near = hub(3, 'Bình Thạnh', 10.794, 106.719)

  it('ghép hub ít hàng cùng hướng khi còn vừa một xe, một xe ghé cả hai', () => {
    const orders = [order(1, 10.786, 106.699, 120), order(2, 10.794, 106.719, 200)]
    const base = buildDeliveryPlan(orders, [q1, near], site, { vehicleKg: 1000 })
    const groups = suggestGroups(base.hubLoads, site, cfg, 1000)
    expect(groups).toEqual([[1, 3]])
    const merged = buildDeliveryPlan(orders, [q1, near], site, { vehicleKg: 1000, groups })
    expect(merged.vehicles).toHaveLength(1)
    expect(merged.vehicles[0].stops).toHaveLength(2)
    expect(forecast(orders, merged, cfg).tripCost).toBeLessThan(forecast(orders, base, cfg).tripCost)
  })

  it('không ghép khi xe nào cũng từ nửa tải hoặc vượt sức chở', () => {
    const full = buildDeliveryPlan([order(1, 10.786, 106.699, 600), order(2, 10.794, 106.719, 600)], [q1, near], site, { vehicleKg: 1000 })
    expect(suggestGroups(full.hubLoads, site, cfg, 1000)).toEqual([])
    const halves = buildDeliveryPlan([order(1, 10.786, 106.699, 500), order(2, 10.794, 106.719, 500)], [q1, near], site, { vehicleKg: 1000 })
    expect(suggestGroups(halves.hubLoads, site, cfg, 1000)).toEqual([])
  })

  it('lấy lại nhóm hub từ các chuyến đã lưu', () => {
    expect(groupsFromTrips([{ stops: [{ hubId: 3 }, { hubId: 1 }] }, { stops: [{ hubId: 2 }] }, { stops: [{ hubId: 1 }, { hubId: 4 }] }])).toEqual([[1, 3, 4]])
  })
})

describe('composeFleet', () => {
  const orders = [order(1, 10.786, 106.699, 600), order(2, 10.8506, 106.7719, 700), order(3, 10.8506, 106.7719, 200)]
  const trip = (tripNo: number, hubId: number, ids: number[], kg: number, driverId: number | null) =>
    ({ tripNo, tripId: tripNo, status: driverId ? 'ACCEPTED' : 'OPEN', driverId, totalKg: kg, stops: [{ hubId, kg, orderIds: ids }] }) as unknown as HubTrip
  const saved = [trip(1, 1, [1], 600, 9), trip(2, 2, [2], 700, null)]
  const opts = { group: () => [] as number[][] }

  it('giữ chuyến đã gọi, đơn chưa có chuyến thì xếp xe mới với số xe còn trống', () => {
    const fleet = composeFleet(orders, [q1, td], site, saved, { ...opts, vehicleKg: 1000 })
    expect(fleet.vehicles.map((v) => [v.tripNo, v.totalKg, !!v.trip])).toEqual([[1, 600, true], [2, 700, true], [3, 200, false]])
  })

  it('chọn lại cỡ xe: giữ xe đã nhận, chỉ xếp lại hàng chưa có tài xế', () => {
    const fleet = composeFleet(orders, [q1, td], site, saved, { ...opts, vehicleKg: 2500, replan: true })
    expect(fleet.vehicles.map((v) => [v.tripNo, v.totalKg, v.trip?.driverId ?? null])).toEqual([[1, 600, 9], [2, 900, null]])
  })
})

describe('hàng hụt sau khi cân', () => {
  const cut = (id: number, kg: number, extra: Partial<PreOrderResponse>) =>
    order(id, 10.786, 106.699, kg, { crateKg: 20, crateQuantity: kg / 20, unitPrice: 10_000, ...extra })
  const orders = [
    cut(1, 100, { originalCrateQuantity: 12, shortfallRefundAmount: 420_000 }),
    cut(2, 40, { status: 'CANCELLED', cancelReason: 'Thiếu hàng tại điểm tập kết: nhà vườn giao không đủ', shippingFee: 50_000, shipperEarnEstimate: 14_550 }),
  ]
  const saved = [
    { tripNo: 1, tripId: 1, status: 'ACCEPTED', driverId: 9, totalKg: 240, feeAmount: 393_000, routeKm: 15, stops: [{ hubId: 1, kg: 240, orderIds: [1] }] },
    { tripNo: 2, tripId: 2, status: 'OPEN', driverId: null, totalKg: 40, feeAmount: 250_000, routeKm: 4, stops: [{ hubId: 1, kg: 40, orderIds: [2] }] },
  ] as unknown as HubTrip[]

  it('xe tính theo đơn còn lại, xe hết hàng được tách ra và tiền được tính lại', () => {
    const fleet = composeFleet(orders, [q1], site, saved, { vehicleKg: 1000, group: () => [] })
    expect(fleet.vehicles.map((v) => [v.tripNo, v.totalKg])).toEqual([[1, 100]])
    expect(fleet.emptied.map((t) => t.tripNo)).toEqual([2])
    const short = shortfallOrders(orders)
    expect(short.map((s) => [s.order.preOrderId, s.oldKg, s.newKg])).toEqual([[1, 240, 100], [2, 40, 0]])
    const changes = tripChanges(fleet, cfg)
    expect(changes.map((x) => [x.tripNo, x.newKg, x.newFee])).toEqual([[1, 100, 393_000], [2, 0, 0]])
    const impact = shortfallImpact(short, changes, cfg)
    expect(impact.cutKg).toBe(180)
    expect(impact.commissionLost).toBe(540_000)
    expect(impact.shipLost).toBe(50_000)
    expect(impact.truckSaved).toBe(250_000) // xe ra hub trả đủ cước
    expect(impact.profitChange).toBe(250_000 + 14_550 - 540_000 - 50_000)
  })
})

describe('forecast', () => {
  it('sàn còn lại = hoa hồng + phí giao - tiền xe - tiền shipper (sau phí dịch vụ)', () => {
    const orders = [
      order(1, 10.786, 106.699, 100, { totalAmount: 1_400_000, shippingFee: 0 }),
      order(2, 10.786, 106.699, 20, { totalAmount: 280_000, shippingFee: 70_000, fulfillmentMethod: 'DELIVERY' }),
      order(3, 10.786, 106.699, 20, { totalAmount: 280_000, status: 'CANCELLED' }),
    ]
    const plan = buildDeliveryPlan(orders, [q1], site, { vehicleKg: 1000 })
    const f = forecast(orders, plan, cfg)
    expect(f.goods).toBe(1_680_000)
    expect(f.commission).toBe(504_000)
    expect(f.shipCollected).toBe(70_000)
    expect(f.deliveryCount).toBe(2)
    expect(f.lastMileCost).toBe(29_100)
    expect(f.profit).toBe(504_000 + 70_000 - f.tripCost - 29_100)
  })
})

import { compareVehicleSizes, farOrderOptions, vehiclesWithoutDriver } from './deliveryPlan'

describe('farOrderOptions', () => {
  const cfg = {
    openKm: 4,
    tiers: [{ label: 'Xe tải nhỏ', maxKg: 1000, openFee: 250000, perKm: 13000, perKmOver20: 11000 }],
    lastMile: { under5: 20000, from5to10: 30000, from10to20: 40000, perKmOver20: 4000 },
    serviceFeeRate: 0,
    hubServiceFeeRate: 0,
    farmerFeeRate: 0.3,
  } as unknown as HubFeeConfig
  // q1 và td có hàng; đơn 3 ở Long Thành xa mọi hub, gần Thủ Đức hơn
  const orders = [order(1, 10.777, 106.701, 30), order(2, 10.87, 106.79, 45), order(3, 10.78, 106.96, 60)]
  const opts = { vehicleKg: 1000, group: () => [] }
  const current = composeFleet(orders, [q1, td], site, [], opts)
  const options = farOrderOptions(current.farOrders[0], current, { orders, hubs: [q1, td], site, trips: [], opts, cfg })

  it('gợi ý hub đang có hàng rẻ nhất trước, không phải thêm xe', () => {
    expect(current.farOrders.map((f) => f.order.preOrderId)).toEqual([3])
    expect(options.map((o) => o.hub?.hubId ?? 'new')).toEqual([2, 1, 'new'])
    expect([options[0].extraVehicles, options[0].tripDelta, options[0].best]).toEqual([0, 0, true])
    expect(options[0].addedCost).toBe(options[0].lastMileDelta)
  })

  it('đặt hub mới thì tính thêm tiền xe tới hub đó', () => {
    const spot = options[2]
    expect([spot.extraVehicles, spot.served, spot.best]).toEqual([1, 1, false])
    expect(spot.tripDelta).toBeGreaterThan(spot.lastMileDelta)
    expect(spot.addedCost).toBeGreaterThan(options[0].addedCost)
  })
})

describe('compareVehicleSizes', () => {
  const cfg = {
    openKm: 4,
    tiers: [
      { label: 'Xe tải nhỏ', maxKg: 1000, openFee: 250000, perKm: 13000, perKmOver20: 11000 },
      { label: 'Xe tải lớn', maxKg: 5000, openFee: 500000, perKm: 20000, perKmOver20: 17000 },
    ],
    lastMile: { under5: 20000, from5to10: 30000, from10to20: 40000, perKmOver20: 4000 },
    serviceFeeRate: 0,
    hubServiceFeeRate: 0,
    farmerFeeRate: 0.3,
  } as unknown as HubFeeConfig
  // 1.800 kg về một hub: xe 1 tấn cần 2 chuyến, xe 5 tấn 1 chuyến
  const orders = [order(1, 10.777, 106.701, 900), order(2, 10.778, 106.702, 900)]
  const compare = (driverCaps: number[]) => compareVehicleSizes([1000, 5000], { orders, hubs: [q1], site, trips: [], cfg, driverCaps })

  it('đủ tài xế cho cả hai cỡ thì chọn cỡ còn lại nhiều tiền hơn', () => {
    const [small, big] = compare([1000, 1000, 5000])
    expect([small.vehicles, big.vehicles]).toEqual([2, 1])
    expect(big.profit).toBeGreaterThan(small.profit)
    expect([small.best, big.best]).toEqual([false, true])
  })

  it('cỡ rẻ hơn mà không có tài xế chở nổi thì không được chọn', () => {
    const [small, big] = compare([1000, 1000])
    expect([small.noDriver, big.noDriver]).toEqual([0, 1])
    expect(small.best).toBe(true)
  })

  it('mỗi tài xế chỉ nhận một xe', () => {
    expect(vehiclesWithoutDriver([900, 900, 2000], [5000, 1000])).toBe(1)
    expect(vehiclesWithoutDriver([900, 2000], [1000, 2000])).toBe(0)
  })
})
