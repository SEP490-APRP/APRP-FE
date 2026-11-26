import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, BellRing, CheckCircle2, Loader2, Lock, Map as MapIcon, PackageCheck, Phone, RotateCcw, Truck, UserCheck, Warehouse } from 'lucide-react'
import {
  adminCampaignService,
  adminHubService,
  adminHubTripService,
  type CampaignResponse,
  type DispatchShipper,
  type HubTrip,
  type HubTripSyncRequest,
  type PreOrderResponse,
} from '@/services'
import {
  composeFleet,
  DEFAULT_PLAN_PARAMS,
  forecast,
  haversineKm,
  netOf,
  plannable,
  shortfallOrders,
  suggestGroups,
  tripChanges,
  truckTier,
  type FleetVehicle,
  type LatLng,
} from '@/features/campaign/deliveryPlan'
import { formatKg, formatVnd, vehicleCapacity, vehicleLabel } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'
import AfterWeighPanel from './AfterWeighPanel'
import DeliveryForecast from './CampaignDeliveryForecast'
import HubMapPanel from './HubMapPanel'
import { globalShowConfirm } from '@/components/common/Popup'

const isoDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const shortDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
// Theo 3 hạng trong bảng giá xe tải
const VEHICLE_PRESETS = [
  { kg: 1000, label: '1 tấn' },
  { kg: 2500, label: '2,5 tấn' },
  { kg: 5000, label: '5 tấn' },
]
/** Bán kính tìm tài xế quanh điểm tập kết, nơi xe nhận hàng (km); null = mọi tài xế */
const RADII: (number | null)[] = [3, 5, 10, 20, null]
const DEFAULT_RADIUS = 10

/**
 * Xe chở hàng từ điểm tập kết ra hub (không giao tới nhà người mua): cần bao nhiêu xe, xe nào chở tới hub nào.
 * Đã gọi xe thì cỡ xe được chốt; chỉ khi có xe bị từ chối mới chọn lại, và chỉ cho phần hàng chưa có tài xế nhận.
 * Tài xế chưa trả lời thì admin gửi lại thông báo, hoặc gọi điện xác nhận rồi gắn tài xế vào xe.
 * mode 'calls' = chỉ phần gọi xe (mục thu gọn trên trang chiến dịch); 'full' = thêm dự toán và bản đồ hub.
 */
export default function CampaignDeliveryPlanner({
  c,
  allOrders,
  onNotice,
  confirmBlockedReason,
  mode = 'full',
  onDone,
  onPack,
}: {
  c: CampaignResponse
  allOrders: PreOrderResponse[]
  onNotice: (n: { ok: boolean; text: string }) => void
  /** Lý do chưa chốt được (vd chưa gom hàng / chưa cân đủ lô); rỗng = chốt được */
  confirmBlockedReason?: string | null
  mode?: 'full' | 'calls'
  /** Đóng cửa sổ sau khi đã chốt xong */
  onDone?: () => void
  /** Mở tab đơn đặt trước để đóng gói */
  onPack?: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const hubsQ = useQuery({ queryKey: ['admin-hubs', 'active'], queryFn: () => adminHubService.list(true), staleTime: 60_000 })
  const boardQ = useQuery({ queryKey: ['admin-campaigns', 'dispatch', c.campaignId], queryFn: () => adminCampaignService.dispatchBoard(c.campaignId) })
  const hubs = useMemo(() => hubsQ.data ?? [], [hubsQ.data])
  const drivers = boardQ.data?.shippers ?? []
  // Chuyến xe đã lưu (tài xế nhận từ app / web tài xế)
  const tripsQ = useQuery({ queryKey: ['admin-campaigns', 'hub-trips', c.campaignId], queryFn: () => adminHubTripService.list(c.campaignId), refetchInterval: 30_000 })
  const cfgQ = useQuery({ queryKey: ['admin-campaigns', 'hub-fee-config'], queryFn: () => adminCampaignService.hubFeeConfig(), staleTime: 300_000 })
  const cfg = cfgQ.data
  const trips = useMemo(() => (tripsQ.data ?? []).filter((t) => t.status !== 'CANCELLED'), [tripsQ.data])
  const siteLat = c.collectionSiteLatitude
  const siteLng = c.collectionSiteLongitude
  const site = useMemo<LatLng | null>(() => (siteLat != null && siteLng != null ? [Number(siteLat), Number(siteLng)] : null), [siteLat, siteLng])

  // Chưa gọi xe thì chọn cỡ xe tự do; đã gọi thì chốt, trừ khi có xe bị từ chối (xếp lại phần chưa có tài xế)
  const [pickedKg, setPickedKg] = useState<number | null>(null)
  const [replanKg, setReplanKg] = useState<number | null>(null)
  const called = trips.length > 0
  const declinedTrips = trips.filter((t) => t.driverId == null && (t.declinedDriverIds?.length ?? 0) > 0)
  const savedKg = useMemo(() => {
    if (!trips.length) return null
    const chosen = (trips.find((t) => t.driverId == null) ?? trips[0]).vehicleKg
    if (chosen) return chosen
    const heaviest = Math.max(...trips.map((t) => Number(t.totalKg ?? 0)))
    return (VEHICLE_PRESETS.find((p) => p.kg >= heaviest) ?? VEHICLE_PRESETS[VEHICLE_PRESETS.length - 1]).kg
  }, [trips])
  /** Số tiền sàn còn lại trước lần thay đổi gần nhất, để hiện tăng / giảm */
  const [prevProfit, setPrevProfit] = useState<number | null>(null)
  const [overrides, setOverrides] = useState<Record<number, number>>({})
  /** Xe đang mở danh sách tài xế để gọi điện / gắn tay */
  const [contactOf, setContactOf] = useState<number | null>(null)
  const [radius, setRadius] = useState<number | null>(DEFAULT_RADIUS)
  // Ngày cần xe = ngày kết thúc mở điểm tập kết (cố định). Chiến dịch cũ chưa có ngày này thì cho chọn tay.
  const fixedCallDate = c.endDate ? c.endDate.slice(0, 10) : null
  const [pickedDate, setCallDate] = useState(() => (c.startDate ? c.startDate.slice(0, 10) : isoDay(new Date(Date.now() + 86400e3))))
  const callDate = fixedCallDate ?? pickedDate
  const [progress, setProgress] = useState<string | null>(null)
  // Chưa chọn thì tự mở bản đồ khi chưa có hub (để đặt hub ngay), có hub rồi thì mở kế hoạch xe
  const [pickedView, setPickedView] = useState<'map' | 'plan' | null>(null)

  const resizing = replanKg != null
  const sizeEditable = !called || resizing || declinedTrips.length > 0
  const vehicleKg = replanKg ?? savedKg ?? pickedKg ?? DEFAULT_PLAN_PARAMS.vehicleKg
  const plan = useMemo(
    () =>
      composeFleet(allOrders, hubs, site, trips, {
        vehicleKg,
        replan: resizing,
        overrides,
        // Hệ thống tự ghép hub ít hàng vào chung xe cho rẻ
        group: (loads) => (cfg ? suggestGroups(loads, site, cfg, vehicleKg) : []),
      }),
    [allOrders, hubs, site, trips, vehicleKg, resizing, overrides, cfg],
  )
  const view = pickedView ?? (hubs.length === 0 ? 'map' : 'plan')
  const mapOrders = useMemo(() => allOrders.filter(plannable), [allOrders])
  const hubOfOrder = useMemo(
    () => new Map<number, number>(plan.hubLoads.flatMap((l) => l.orders.map((o) => [o.preOrderId, l.hub.hubId] as [number, number]))),
    [plan],
  )
  const fore = cfg ? forecast(allOrders, plan, cfg) : null

  // Hàng hụt sau khi cân: đơn nào bị bớt, xe nào phải cập nhật, hàng còn lại cần mấy xe
  const short = shortfallOrders(allOrders)
  const changes = cfg ? tripChanges(plan, cfg) : []
  const needed =
    short.length || changes.length
      ? composeFleet(allOrders, hubs, site, [], { vehicleKg, overrides, group: (loads) => (cfg ? suggestGroups(loads, site, cfg, vehicleKg) : []) }).vehicles.length
      : 0

  // Chỉ báo khi phí giao đổi; chỉ đổi số kg thì thẻ xe tự hiện số mới và được lưu khi chốt
  const feeChanges = changes.filter((x) => x.newFee !== x.oldFee)
  const lostFees = changes.length ? short.filter((x) => x.cancelled && Number(x.order.shippingFee ?? 0) > 0) : []

  /** Đơn đã nằm ở đúng hub theo kế hoạch (đã chốt ra hub) */
  const inHub = (o: PreOrderResponse) => o.status === 'READY' && o.hubId === hubOfOrder.get(o.preOrderId)
  const planOrders = plan.hubLoads.flatMap((l) => l.orders)

  const vehicles = plan.vehicles
  const assigned = vehicles.filter((v) => v.trip?.driverId != null)
  const missing = vehicles.filter((v) => v.trip?.driverId == null)
  const missingKg = missing.reduce((s, v) => s + v.totalKg, 0)
  const allConfirmed = planOrders.every(inHub) && vehicles.length > 0 && vehicles.every((v) => v.trip?.confirmed)
  // Còn đơn chưa chia hub thì chưa gọi xe, chưa gắn tài xế và chưa chốt: tránh gọi thiếu xe, bỏ sót đơn
  const unassignedReason = plan.farOrders.length
    ? `Còn ${plan.farOrders.length} đơn (${formatKg(plan.farOrders.reduce((s, f) => s + Number(f.order.totalKg ?? 0), 0))}) chưa chia hub, chia hết mới gọi xe được.`
    : null
  const done = allConfirmed && !unassignedReason
  const showFeePanel = !done && (feeChanges.length > 0 || lostFees.length > 0 || (needed > 0 && needed < vehicles.length && missing.length > 0))
  // Đóng gói hết rồi mới chốt xe ra hub (đóng gói ở tab Đơn đặt trước)
  const unpacked = planOrders.filter((o) => o.status === 'DEPOSIT_PAID')
  const needPack = c.status === 'FULFILLING' && !confirmBlockedReason && unpacked.length > 0
  const canConfirm = c.status === 'FULFILLING' && !confirmBlockedReason && !unassignedReason && unpacked.length === 0 && planOrders.length > 0
  // Chưa gom hàng: nút chính là "Gom hàng", mở khi đã gửi thông báo gọi mọi xe và tới ngày bắt đầu chiến dịch
  const beforeGathering = c.status === 'THRESHOLD_MET'
  const startsOn = c.startDate?.slice(0, 10)
  const uncalled = vehicles.filter((v) => !v.trip).length
  const gatherBlockedReason = unassignedReason
    ?? (uncalled > 0 ? `Gửi thông báo gọi xe rồi mới gom hàng: còn ${uncalled} xe chưa gọi.`
      : startsOn && startsOn > isoDay(new Date()) ? `Gom hàng được từ ngày bắt đầu chiến dịch ${shortDay(startsOn)}.` : null)
  const footerReason = beforeGathering ? gatherBlockedReason
    : confirmBlockedReason ?? (needPack ? `Còn ${unpacked.length} đơn chưa đóng gói, đóng gói xong mới chốt xe ra hub.` : null)

  /** Đổi cỡ xe: nhớ số tiền cũ để hiện chênh lệch */
  const setCapacity = (kg: number) => {
    if (kg <= 0 || !sizeEditable) return
    setPrevProfit(fore?.profit ?? null)
    if (called) setReplanKg(kg)
    else setPickedKg(kg)
  }

  const moveOrder = (orderId: number, hubId: number) => {
    if (vehicles.some((v) => v.trip && v.stops.some((s) => s.orders.some((o) => o.preOrderId === orderId)))) {
      onNotice({ ok: false, text: 'Đơn này đã nằm trong xe đã gọi nên không đổi hub được.' })
      return
    }
    setPrevProfit(fore?.profit ?? null)
    setOverrides((o) => ({ ...o, [orderId]: hubId }))
  }

  /** Kế hoạch xe hiện tại dạng chuyến để lưu; assign = tài xế admin gắn tay cho một xe */
  const syncBody = (confirmed: boolean, assign?: { tripNo: number; driverId: number }): HubTripSyncRequest => ({
    pickupDate: callDate,
    confirmed,
    trips: vehicles.map((v) => ({
      tripNo: v.tripNo,
      totalKg: v.totalKg,
      vehicleKg: v.trip?.vehicleKg ?? vehicleKg,
      driverId: assign?.tripNo === v.tripNo ? assign.driverId : undefined,
      stops: v.stops.map((st) => ({
        hubId: st.hub.hubId,
        hubName: st.hub.name,
        hubAddress: st.hub.address,
        hubLatitude: st.hub.latitude,
        hubLongitude: st.hub.longitude,
        kg: st.kg,
        orderCount: st.orders.length,
        orderIds: st.orders.map((o) => o.preOrderId),
      })),
    })),
  })

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
    qc.invalidateQueries({ queryKey: ['admin-hubs'] })
  }

  /** Tài xế đang nhận một xe: mỗi xe cần tài xế riêng. Giá trị = số thứ tự xe */
  const busy = new Map<number, number>(assigned.map((v) => [v.trip!.driverId as number, v.tripNo]))

  /** Tài xế đủ tải và ở trong bán kính quanh điểm tập kết (nơi nhận hàng): đang online và gần xếp trước */
  const driversFor = (kg: number) =>
    drivers
      .filter((d) => (d.vehicleCapacityKg ?? vehicleCapacity(d.vehicleType)) >= Math.max(kg, cfg?.minVehicleKg ?? 0))
      .map((d) => ({ d, km: kmFrom(site, d) }))
      .filter((x) => radius == null || !site || (x.km != null && x.km <= radius))
      .sort((a, b) => Number(b.d.online) - Number(a.d.online) || (a.km ?? 999) - (b.km ?? 999))

  const declinedBy = (v: FleetVehicle, driverId: number) => !!v.trip?.declinedDriverIds?.includes(driverId)

  /** Tài xế sẽ nhận thông báo cho các xe này: đủ tải, trong bán kính, chưa nhận xe khác và chưa từ chối hết */
  const callable = (targets: FleetVehicle[]) => {
    if (targets.length === 0) return []
    return driversFor(Math.min(...targets.map((v) => v.totalKg)))
      .map((x) => x.d.id)
      .filter((id) => !busy.has(id) && targets.some((v) => !declinedBy(v, id)))
  }
  const hubNames = (targets: FleetVehicle[]) => [...new Set(targets.flatMap((v) => v.stops.map((s) => s.hub.name)))].join(', ')

  // Lưu các chuyến để tài xế thấy và nhận trong app, rồi gửi thông báo
  const call = useMutation({
    mutationFn: async ({ targets, ids }: { targets: FleetVehicle[]; ids: number[] }) => {
      await adminHubTripService.sync(c.campaignId, syncBody(false))
      if (ids.length === 0) return 0
      const list = targets.map((v) => `Xe ${v.tripNo} chở ${formatKg(v.totalKg)} tới ${v.stops.map((s) => s.hub.name).join(', ')}`).join('; ')
      const r = await adminCampaignService.callShippers(c.campaignId, {
        pickupDate: callDate,
        shipperIds: ids,
        hubName: hubNames(targets),
        totalVehicles: vehicles.length,
        minVehicleKg: Math.ceil(Math.min(...targets.map((v) => v.totalKg))),
        vehiclesNeeded: targets.length,
        totalKg: targets.reduce((s, v) => s + v.totalKg, 0),
        message: `${list}.${radius != null ? ` Ưu tiên tài xế trong ${radius} km quanh điểm tập kết.` : ''} Mở mục Chuyến chở hàng ra hub để nhận hoặc không nhận.`,
      })
      return r.sent
    },
    onSuccess: (sent) => {
      setReplanKg(null)
      refreshAll()
      onNotice({ ok: sent > 0, text: sent > 0 ? `Đã gửi thông báo tới ${sent} tài xế.` : 'Đã lưu xe nhưng chưa có tài xế phù hợp trong bán kính. Hãy tăng bán kính.' })
    },
    onError: (e) => {
      refreshAll()
      onNotice({ ok: false, text: getErrorMessage(e, 'Không gửi được thông báo kêu gọi xe.') })
    },
  })

  // Gọi điện xác nhận xong: gắn tài xế vào xe, tài xế được báo trong app
  const assign = useMutation({
    mutationFn: (a: { tripNo: number; driverId: number; name: string }) => adminHubTripService.sync(c.campaignId, syncBody(false, a)),
    onSuccess: (_r, a) => {
      setReplanKg(null)
      setContactOf(null)
      refreshAll()
      onNotice({ ok: true, text: `Đã gắn ${a.name} vào Xe ${a.tripNo}.` })
    },
    onError: (e) => {
      refreshAll()
      onNotice({ ok: false, text: getErrorMessage(e, 'Không gắn được tài xế.') })
    },
  })

  // Lưu số kg mới cho các xe (xe hết hàng bị huỷ), tài xế đã nhận được báo
  const update = useMutation({
    mutationFn: () => adminHubTripService.sync(c.campaignId, syncBody(false)),
    onSuccess: () => {
      setReplanKg(null)
      refreshAll()
      onNotice({ ok: true, text: 'Đã cập nhật xe theo hàng còn lại và báo cho tài xế.' })
    },
    onError: (e) => {
      refreshAll()
      onNotice({ ok: false, text: getErrorMessage(e, 'Không cập nhật được xe.') })
    },
  })

  const gather = useMutation({
    mutationFn: () => adminCampaignService.action(c.campaignId, 'start-fulfilling'),
    onSuccess: () => {
      refreshAll()
      for (const key of ['admin-campaign', 'admin-campaign-regs', 'admin-campaign-orders']) qc.invalidateQueries({ queryKey: [key] })
      onNotice({ ok: true, text: 'Đã bắt đầu gom hàng và báo nhà vườn mang hàng tới điểm tập kết.' })
      onDone?.()
    },
    onError: (e) => {
      refreshAll()
      onNotice({ ok: false, text: getErrorMessage(e, 'Chưa bắt đầu gom hàng được.') })
    },
  })

  // Chốt: đóng gói và đưa đơn chưa ở hub ra đúng hub, rồi chốt các chuyến xe (tài xế được báo tới lấy hàng)
  const confirm = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < plan.hubLoads.length; i++) {
        const l = plan.hubLoads[i]
        const ids = l.orders.filter((o) => !inHub(o)).map((o) => o.preOrderId)
        if (ids.length === 0) continue
        setProgress(`Chia hàng ra hub ${i + 1}/${plan.hubLoads.length}…`)
        await adminCampaignService.dispatch(c.campaignId, ids, undefined, l.hub.hubId)
      }
      setProgress('Chốt xe…')
      await adminHubTripService.sync(c.campaignId, syncBody(true))
    },
    onSuccess: () => {
      setReplanKg(null)
      setProgress(null)
      refreshAll()
      // Đưa admin lên đầu để thấy khung "Đã chốt" và việc tiếp theo
      rootRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      onNotice({ ok: true, text: `Đã chốt: ${planOrders.length} đơn ra ${plan.hubLoads.length} hub, ${plan.vehicles.length} xe.` })
    },
    onError: (e) => {
      setProgress(null)
      refreshAll()
      onNotice({ ok: false, text: getErrorMessage(e, 'Chốt chưa xong, một phần đơn có thể đã ra hub.') })
    },
  })

  if (hubsQ.isPending || boardQ.isPending) return <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />

  const vehicleCard = (v: FleetVehicle) => {
    const i = plan.vehicles.indexOf(v)
    const gross = fore?.vehicleGross[i]
    const trip = v.trip
    const has = trip?.driverId != null
    const declined = !has && (trip?.declinedDriverIds?.length ?? 0) > 0
    const eligible = has ? [] : driversFor(v.totalKg).filter(({ d }) => !busy.has(d.id))
    const resend = callable([v])
    const open = contactOf === v.tripNo
    return (
      <article key={v.key} aria-label={`Xe ${v.tripNo}`} className={`flex flex-col gap-3 rounded-2xl border-2 bg-white p-4 ${has ? 'border-[#cfe6c4]' : declined ? 'border-red-300' : 'border-dashed border-amber-300'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white ${has ? 'bg-[#326318]' : declined ? 'bg-red-500' : 'bg-amber-500'}`}>{v.tripNo}</span>
            <span className="text-lg font-black text-gray-900">{formatKg(v.totalKg)}</span>
          </span>
          {has ? (
            <TripChip trip={trip} />
          ) : declined ? (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">{trip!.declinedDriverIds!.length} tài xế từ chối</span>
          ) : trip ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Chờ tài xế trả lời</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">Chưa gọi</span>
          )}
        </div>
        {trip?.loadPhotoUrl && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
            <a href={trip.loadPhotoUrl} target="_blank" rel="noreferrer" title="Bấm để xem ảnh lớn">
              <img src={trip.loadPhotoUrl} alt={`Ảnh hàng lên xe ${v.tripNo}`} className="h-16 w-16 rounded-xl border border-gray-200 object-cover hover:opacity-80" />
            </a>
            <span className="text-xs font-bold text-amber-900">
              Đã lấy hàng{trip.startedAt ? ` ${new Date(trip.startedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}` : ''}
              <span className="block font-semibold text-gray-600">Ảnh tại điểm tập kết</span>
            </span>
          </div>
        )}
        <ol aria-label={`Hub xe ${v.tripNo} chở tới`} className="flex flex-col gap-1.5">
          {v.stops.map((s, n) => {
            // Tài xế đã giao tới hub này: giờ giao và ảnh minh chứng
            const sent = trip?.stops.find((x) => x.hubId === s.hub.hubId)
            return (
              <li key={s.hub.hubId} className="flex flex-col gap-1 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${sent?.arrivedAt ? 'bg-[#326318] text-white' : 'bg-[#eef6e7] text-[#326318]'}`}>{n + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-bold text-gray-900" title={s.hub.address}>{s.hub.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">{formatKg(s.kg)} · {s.orders.length} đơn</span>
                </span>
                {sent?.arrivedAt && (
                  <span className="flex items-center gap-2 pl-7">
                    {sent.photoUrl && (
                      <a href={sent.photoUrl} target="_blank" rel="noreferrer" title="Bấm để xem ảnh lớn">
                        <img src={sent.photoUrl} alt={`Ảnh giao hàng tại ${s.hub.name}`} className="h-16 w-16 rounded-xl border border-gray-200 object-cover hover:opacity-80" />
                      </a>
                    )}
                    <span className="text-xs font-bold text-[#326318]">
                      Đã giao {new Date(sent.arrivedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      {sent.photoUrl && <span className="block font-semibold text-gray-500">Ảnh minh chứng</span>}
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        {gross != null && cfg && (
          <div className="rounded-xl bg-[#f3f8ee] px-3 py-2">
            <p className="flex items-baseline justify-between gap-2 text-xs text-gray-600">
              Cước tới hub <b className="text-base tabular-nums text-[#326318]">{formatVnd(gross)}</b>
            </p>
            <p className="flex items-baseline justify-between gap-2 text-[11px] text-gray-500">
              <span>{truckTier(cfg, v.totalKg).label}{v.routeKm != null ? ` · ~${v.routeKm} km` : ''}</span>
              <span>Tài xế nhận {formatVnd(netOf(gross, cfg.hubServiceFeeRate))}</span>
            </p>
          </div>
        )}
        {has && trip!.status === 'ACCEPTED' && trip!.confirmed && (trip!.boxTotal ?? 0) > 0 && (
          <p className={`rounded-xl px-3 py-2 text-xs font-bold ${trip!.boxLoaded === trip!.boxTotal ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            Đã nhận {trip!.boxLoaded ?? 0}/{trip!.boxTotal} thùng lên xe
          </p>
        )}
        {has ? (
          <div className="mt-auto flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <span className="min-w-0 truncate font-bold text-gray-900">{trip!.driverName ?? `Tài xế #${trip!.driverId}`}{trip!.vehicleNumber ? ` · ${trip!.vehicleNumber}` : ''}</span>
            {trip!.driverPhone && (
              <a href={`tel:${trip!.driverPhone}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#326318]">
                <Phone size={13} /> {trip!.driverPhone}
              </a>
            )}
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex gap-2">
              {trip && !resizing && (
                <button type="button" disabled={!!unassignedReason || call.isPending || !callDate || resend.length === 0} onClick={() => call.mutate({ targets: [v], ids: resend })}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-600 px-2 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-40">
                  <BellRing size={14} /> Gửi lại thông báo
                </button>
              )}
              <button type="button" aria-expanded={open} disabled={!!unassignedReason} title={unassignedReason ?? undefined} onClick={() => setContactOf(open ? null : v.tripNo)}
                className={`disabled:cursor-not-allowed disabled:opacity-40 inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold ${open ? 'border-[#326318] bg-[#326318] text-white' : 'border-gray-300 text-gray-700 hover:border-[#326318]'}`}>
                <Phone size={14} /> Gọi & gắn tài xế ({eligible.length})
              </button>
            </div>
            {open && (
              <ul className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
                {eligible.map(({ d, km }) => (
                  <li key={d.id} className="flex flex-col gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs">
                    <span className="flex items-center justify-between gap-2">
                      <b className="min-w-0 truncate text-gray-900">{d.online ? '● ' : '○ '}{d.name}</b>
                      {declinedBy(v, d.id) && <span className="shrink-0 font-bold text-red-600">đã từ chối</span>}
                    </span>
                    <span className="text-gray-500">{vehicleLabel(d.vehicleType)}{km != null ? ` · cách điểm tập kết ${km.toFixed(1)} km` : ''}</span>
                    <span className="flex items-center justify-between gap-2">
                      {d.phone ? (
                        <a href={`tel:${d.phone}`} className="inline-flex items-center gap-1 text-sm font-black text-[#326318]"><Phone size={13} /> {d.phone}</a>
                      ) : (
                        <span className="text-gray-400">Chưa có số điện thoại</span>
                      )}
                      <button type="button" disabled={!!unassignedReason || assign.isPending || !callDate}
                        onClick={async () => {
                          const agreed = await globalShowConfirm(`Gắn tài xế vào Xe ${v.tripNo}?`, 'Chỉ gắn khi tài xế đã đồng ý qua điện thoại. Tài xế sẽ nhận thông báo trong app.', {
                            confirmText: 'Đã đồng ý, gắn xe',
                            details: [
                              `Tài xế: ${d.name} · ${vehicleLabel(d.vehicleType)}${d.phone ? ` · ${d.phone}` : ''}`,
                              `Xe ${v.tripNo}: ${formatKg(v.totalKg)} tới ${v.stops.map((s) => s.hub.name).join(', ')}`,
                            ],
                          })
                          if (agreed) assign.mutate({ tripNo: v.tripNo, driverId: d.id, name: d.name })
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#326318] px-2.5 py-1.5 font-bold text-white disabled:opacity-40">
                        <UserCheck size={13} /> Đã xác nhận, gắn xe
                      </button>
                    </span>
                  </li>
                ))}
                {eligible.length === 0 && <li className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Không có tài xế đủ tải trong bán kính, hãy tăng bán kính.</li>}
              </ul>
            )}
          </div>
        )}
      </article>
    )
  }

  const farKg = plan.farOrders.reduce((s, f) => s + Number(f.order.totalKg ?? 0), 0)

  const callBlock = (
    <>
      {done && (
        <section role="status" aria-label="Đã chốt xe ra hub" className="flex flex-col gap-3 rounded-3xl border-2 border-[#326318] bg-[#eef6e7] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#326318] text-white"><CheckCircle2 size={26} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black text-[#254d12]">Đã chốt xe ra hub</span>
              <span className="block text-sm text-[#3d5a2c]">
                {vehicles.length} xe chở {vehicles.reduce((s, v) => s + v.stops.reduce((n, st) => n + st.orders.length, 0), 0)} đơn. Tài xế đã được báo.
              </span>
            </span>
            {onDone && (
              <button type="button" onClick={onDone} className="rounded-xl bg-[#326318] px-5 py-2.5 text-sm font-black text-white">Xong, về chiến dịch</button>
            )}
          </div>
          <ol aria-label="Việc tiếp theo" className="grid gap-2 sm:grid-cols-3">
            {[
              { label: `Tài xế lấy hàng${callDate ? ` từ ${shortDay(callDate)}` : ''}`, count: vehicles.filter((v) => v.trip?.status === 'IN_TRANSIT' || v.trip?.status === 'DELIVERED').length },
              { label: 'Xe giao tới hub', count: vehicles.filter((v) => v.trip?.status === 'DELIVERED').length },
            ].map((step) => (
              <li key={step.label} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-gray-700">
                {step.label}
                <span className="mt-0.5 block text-base font-black text-[#326318]">{step.count}/{vehicles.length} xe</span>
              </li>
            ))}
            <li className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-gray-700">
              Shipper giao tận nhà
              <span className="mt-0.5 block text-gray-500">Theo dõi ở mục “Giao tại hub”</span>
            </li>
          </ol>
          {missing.length > 0 && <p className="text-sm font-bold text-amber-800">Còn {missing.length} xe chưa có tài xế, gọi thêm bên dưới.</p>}
        </section>
      )}

      {showFeePanel && (
        <AfterWeighPanel
          feeChanges={feeChanges}
          cancelled={lostFees}
          vehicleKg={vehicleKg}
          needed={needed}
          current={vehicles.length}
          canReplan={called && !resizing && missing.some((v) => v.trip)}
          onReplan={() => setReplanKg(vehicleKg)}
          onUpdate={() => update.mutate()}
          updating={update.isPending}
        />
      )}
      {unassignedReason && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
          <AlertTriangle size={20} className="shrink-0 text-amber-600" />
          <p className="min-w-0 flex-1 text-sm font-black text-amber-900">{unassignedReason}</p>
          {mode === 'full' ? (
            <button type="button" onClick={() => setPickedView('map')} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">
              <MapIcon size={16} /> Chia hub trên bản đồ
            </button>
          ) : (
            <span className="text-xs font-semibold text-amber-800">Mở “Dự toán & gọi xe”, tab Bản đồ hub để đặt hub hoặc gán đơn.</span>
          )}
        </div>
      )}
      {resizing ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3">
          <p className="min-w-0 flex-1 text-sm font-bold text-sky-900">
            Đang xếp lại {formatKg(missingKg)} chưa có tài xế thành {missing.length} xe. Bấm “Gọi {missing.length} xe” để lưu và gửi thông báo.
          </p>
          <button type="button" onClick={() => setReplanKg(null)} className="rounded-xl border border-sky-600 px-3 py-1.5 text-xs font-bold text-sky-800">Bỏ thay đổi</button>
        </div>
      ) : declinedTrips.length > 0 ? (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          Xe {declinedTrips.map((t) => t.tripNo).join(', ')} bị từ chối. Có thể chọn lại cỡ xe cho {formatKg(missingKg)} chưa có tài xế nhận, xe đã nhận giữ nguyên.
        </div>
      ) : null}

      {/* Cỡ xe */}
      {(!done || missing.length > 0) && (
      <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-black text-gray-900">{called && !resizing ? (declinedTrips.length ? 'Chọn lại cỡ xe' : 'Cỡ xe đã chốt') : 'Cỡ xe'}</span>
        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-gray-200">
          {VEHICLE_PRESETS.map((p) => (
            <button
              key={p.kg}
              type="button"
              disabled={!sizeEditable}
              aria-pressed={vehicleKg === p.kg}
              onClick={() => setCapacity(p.kg)}
              className={`rounded-lg px-3 py-1 text-xs font-bold disabled:cursor-not-allowed ${vehicleKg === p.kg ? 'bg-[#326318] text-white' : 'text-gray-600 hover:text-gray-900 disabled:opacity-40'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          disabled={!sizeEditable}
          value={vehicleKg}
          onChange={(e) => setCapacity(Number(e.target.value))}
          className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Sức chở mỗi xe (kg)"
        />
        {!called && (
          <button type="button" title="Xếp xe lại" aria-label="Xếp xe lại" onClick={() => { setOverrides({}); setCapacity(DEFAULT_PLAN_PARAMS.vehicleKg) }} className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-800">
            <RotateCcw size={15} />
          </button>
        )}
        {!sizeEditable && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Lock size={13} /> Chỉ đổi được khi có xe bị từ chối</span>
        )}
      </div>

      {/* Tài xế nhận hàng ở điểm tập kết nên tìm quanh điểm tập kết */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-black text-gray-900">Tìm tài xế quanh điểm tập kết</span>
        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-gray-200">
          {RADII.map((r) => (
            <button
              key={r ?? 'all'}
              type="button"
              aria-pressed={radius === r}
              onClick={() => setRadius(r)}
              className={`rounded-lg px-3 py-1 text-xs font-bold ${radius === r ? 'bg-[#326318] text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {r == null ? 'Tất cả' : `${r} km`}
            </button>
          ))}
        </div>
        <span className={`text-xs font-semibold ${driversFor(0).length ? 'text-gray-600' : 'text-red-600'}`}>
          {driversFor(0).length ? `${driversFor(0).length} tài xế đủ tải` : 'Chưa có tài xế, hãy tăng bán kính'}
        </span>
      </div>

      </>
      )}

      {/* Tiến độ nhận xe của cả kế hoạch */}
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-2 text-sm font-black text-gray-900">
          <Truck size={16} className="text-[#326318]" /> Xe đã nhận
          <span className="rounded-full bg-[#eef6e7] px-2 text-xs text-[#326318]">{assigned.length}/{vehicles.length}</span>
          {missing.length > 0 && <span className="text-xs text-amber-700">còn thiếu {missing.length} xe · {formatKg(missingKg)}</span>}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-amber-100">
          <div className="h-full rounded-full bg-[#326318] transition-[width]" style={{ width: `${(assigned.length / Math.max(1, vehicles.length)) * 100}%` }} />
        </div>
      </div>

      {/* Các xe và hub từng xe chở tới */}
      <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">{vehicles.map(vehicleCard)}</div>

      {/* Thanh thao tác */}
      <div className={`flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 ${mode === 'full' ? 'sticky bottom-0 -mx-1 shadow-lg' : ''}`}>
        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
          Cần xe
          {fixedCallDate ? (
            <span className="rounded-lg bg-gray-100 px-2 py-1 text-sm text-gray-900" title="Ngày kết thúc mở điểm tập kết">{shortDay(fixedCallDate)}</span>
          ) : (
            <input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-sm font-normal" />
          )}
        </label>
        <span className="min-w-0 flex-1 truncate text-xs text-gray-500" title={footerReason ?? undefined}>
          {progress ? <b className="text-[#326318]">{progress}</b>
            : footerReason ? footerReason
            : beforeGathering ? (
              <b className="text-[#326318]">
                {missing.length > 0 ? `Đã gọi xe, còn ${missing.length} xe chưa có tài xế. Vẫn gom hàng được.` : 'Đã gọi đủ xe, bắt đầu gom hàng được.'}
              </b>
            )
            : c.shipperCalledAt ? `Đã gọi xe lúc ${new Date(c.shipperCalledAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}` : ''}
        </span>
        {done && missing.length === 0 ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#eef6e7] px-4 py-2 text-sm font-black text-[#254d12]"><CheckCircle2 size={16} /> Đã chốt ra hub</span>
        ) : (
        <>
        <button
          type="button"
          disabled={!!unassignedReason || call.isPending || !callDate || missing.length === 0}
          title={unassignedReason ?? undefined}
          onClick={() => call.mutate({ targets: missing, ids: callable(missing) })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-600 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
        >
          {call.isPending ? <Loader2 size={15} className="animate-spin" /> : <BellRing size={15} />}
          {missing.length === 0 ? 'Đã đủ xe' : called && !resizing ? `Gửi lại ${missing.length} xe` : `Gọi ${missing.length} xe`}
        </button>
        {beforeGathering ? (
          <button
            type="button"
            disabled={!!gatherBlockedReason || gather.isPending}
            title={gatherBlockedReason ?? undefined}
            onClick={async () => {
              const agreed = await globalShowConfirm('Bắt đầu gom hàng?', 'Nhà vườn được báo mang hàng tới điểm tập kết.', {
                confirmText: 'Gom hàng',
                warning: missing.length > 0,
                details: [
                  `${vehicles.length} xe chở ${planOrders.length} đơn`,
                  ...(missing.length ? [`Còn ${missing.length} xe chưa có tài xế, gọi tiếp trong lúc gom hàng`] : []),
                ],
              })
              if (agreed) gather.mutate()
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-5 py-2 text-sm font-black text-white disabled:opacity-40"
          >
            {gather.isPending ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />} Gom hàng
          </button>
        ) : needPack && onPack ? (
          <button type="button" onClick={onPack} className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-5 py-2 text-sm font-black text-white">
            <PackageCheck size={16} /> Đi đóng gói ({unpacked.length} đơn)
          </button>
        ) : (
        <button
          type="button"
          disabled={!canConfirm || confirm.isPending}
          onClick={async () => {
            const agreed = await globalShowConfirm('Chốt xe ra hub?', 'Các đơn được chia về hub và tài xế được báo tới lấy hàng.', {
              confirmText: allConfirmed ? 'Chốt lại' : 'Chốt ra hub',
              warning: missing.length > 0,
              details: [
                `${vehicles.length} xe chở ${planOrders.length} đơn tới ${plan.hubLoads.length} hub`,
                ...(missing.length ? [`Còn ${missing.length} xe chưa có tài xế`] : []),
              ],
            })
            if (agreed) confirm.mutate()
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-5 py-2 text-sm font-black text-white disabled:opacity-40"
        >
          {confirm.isPending ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />} {allConfirmed ? 'Chốt lại' : 'Chốt ra hub'}
        </button>
        )}
        </>
        )}
      </div>
    </>
  )

  const planView = hubs.length === 0 ? (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-amber-300 bg-amber-50 px-6 py-12 text-center">
      <Warehouse size={36} className="text-amber-600" />
      <p className="font-black text-amber-900">Chưa có hub nào</p>
      {mode === 'full' && (
        <button type="button" onClick={() => setPickedView('map')} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">
          <MapIcon size={16} /> Đặt hub trên bản đồ
        </button>
      )}
    </div>
  ) : vehicles.length === 0 && plan.emptied.length === 0 ? (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">Không còn đơn nào cần chở ra hub.</div>
  ) : mode === 'calls' ? (
    callBlock
  ) : (
    <>
      {fore && cfg && (
        <DeliveryForecast fore={fore} prevProfit={prevProfit} vehicleCount={vehicles.length} cfg={cfg}
          note={short.length ? `Đã tính hàng hụt ${formatKg(short.reduce((s, x) => s + x.oldKg - x.newKg, 0))} sau khi cân, hoàn cọc ${formatVnd(short.reduce((s, x) => s + x.refund, 0))}.` : null} />
      )}

      {/* 4 số chính */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Tổng hàng" value={formatKg(plan.totalKg + farKg)} sub={`${planOrders.length + plan.farOrders.length} đơn`} />
        <Kpi
          label="Xe cần"
          value={String(vehicles.length)}
          sub={missing.length ? `thiếu ${missing.length} xe` : 'đã đủ tài xế'}
          tone={missing.length ? 'amber' : 'green'}
        />
        <Kpi label="Hub nhận hàng" value={String(plan.hubLoads.length)} sub={plan.hubLoads.map((l) => l.hub.name).join(', ')} />
        <Kpi
          label="Chưa chia hub"
          value={formatKg(farKg)}
          sub={plan.farOrders.length ? `${plan.farOrders.length} đơn chưa có hub gần` : 'đã chia hết'}
          tone={plan.farOrders.length ? 'amber' : 'green'}
        />
      </div>

      {(!site || plan.missingCoords > 0) && (
        <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <AlertTriangle size={14} />
          {!site ? 'Điểm tập kết chưa ghim toạ độ.' : `${plan.missingCoords} đơn thiếu toạ độ, cần kiểm tra địa chỉ.`}
        </p>
      )}

      {callBlock}
    </>
  )

  if (mode === 'calls') return <div ref={rootRef} className="flex flex-col gap-4 pt-4">{planView}</div>

  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      {/* Chuyển giữa kế hoạch xe và bản đồ đặt hub */}
      <div role="tablist" className="inline-flex w-fit rounded-2xl bg-white p-1 text-sm font-bold shadow-sm ring-1 ring-gray-200">
        {([
          ['plan', 'Xe ra hub', Truck],
          ['map', 'Bản đồ hub', MapIcon],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setPickedView(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition ${view === id ? 'bg-[#326318] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <HubMapPanel c={c} orders={mapOrders} hubs={hubs} hubOfOrder={hubOfOrder} farOrders={plan.farOrders} onMove={moveOrder} onNotice={onNotice} />
      ) : (
        planView
      )}
    </div>
  )
}

const kmFrom = (site: LatLng | null, d: DispatchShipper) =>
  site && d.latitude != null && d.longitude != null ? haversineKm(site, [Number(d.latitude), Number(d.longitude)]) : null

const TRIP_CHIP: Record<string, { text: string; cls: string }> = {
  ACCEPTED: { text: 'Đã nhận', cls: 'bg-emerald-100 text-emerald-800' },
  IN_TRANSIT: { text: 'Đang chở', cls: 'bg-blue-100 text-blue-800' },
  DELIVERED: { text: 'Đã tới hub', cls: 'bg-emerald-600 text-white' },
}

/** Trạng thái xe đã có tài xế */
function TripChip({ trip }: { trip?: HubTrip }) {
  const m = TRIP_CHIP[trip?.status ?? 'ACCEPTED'] ?? TRIP_CHIP.ACCEPTED
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.cls}`}>
      {m.text}{trip && trip.status === 'ACCEPTED' ? (trip.confirmed ? ' · đã chốt' : ' · dự kiến') : ''}
    </span>
  )
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'green' | 'amber' }) {
  const cls = tone === 'amber' ? 'border-amber-300 bg-amber-50' : tone === 'green' ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'
  const subCls = tone === 'amber' ? 'text-amber-800 font-bold' : tone === 'green' ? 'text-emerald-700 font-bold' : 'text-gray-500'
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums text-gray-900">{value}</p>
      <p className={`truncate text-xs ${subCls}`} title={sub}>{sub}</p>
    </div>
  )
}
