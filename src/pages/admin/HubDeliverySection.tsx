import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, ChevronDown, Loader2, Phone, RotateCcw, UserCheck, Warehouse } from 'lucide-react'
import { adminCampaignService, adminHubTripService, type CampaignResponse, type DispatchShipper, type PreOrderResponse } from '@/services'
import { haversineKm, type LatLng } from '@/features/campaign/deliveryPlan'
import { formatKg, vehicleCapacity, vehicleLabel } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'
import CampaignSection from './CampaignSection'
import { globalShowConfirm } from '@/components/common/Popup'

/** Shipper trong bán kính này quanh hub được nhắc trước (km) */
const NEAR_KM = 10

type State = 'onTheWay' | 'unconfirmed' | 'waiting' | 'delivering' | 'delivered' | 'failed'

const STATE: Record<State, { label: string; cls: string }> = {
  failed: { label: 'Thất bại', cls: 'bg-red-100 text-red-700' },
  unconfirmed: { label: 'Chờ hub xác nhận', cls: 'bg-red-100 text-red-700' },
  waiting: { label: 'Chờ shipper lấy', cls: 'bg-amber-100 text-amber-800' },
  delivering: { label: 'Đang giao', cls: 'bg-blue-100 text-blue-800' },
  onTheWay: { label: 'Chờ xe tới hub', cls: 'bg-gray-100 text-gray-600' },
  delivered: { label: 'Đã giao', cls: 'bg-emerald-100 text-emerald-800' },
}

/**
 * Mục thu gọn "Giao tại hub": shipper tự chọn đơn, admin chỉ theo dõi từng hub và xử lý đơn tồn:
 * giao lại đơn thất bại, nhắc shipper gần hub, hoặc gọi điện xác nhận rồi gắn đơn cho shipper.
 */
export default function HubDeliverySection({
  c,
  orders,
  onNotice,
}: {
  c: CampaignResponse
  orders: PreOrderResponse[]
  onNotice: (n: { ok: boolean; text: string }) => void
}) {
  const qc = useQueryClient()
  const board = useQuery({ queryKey: ['admin-campaigns', 'dispatch', c.campaignId], queryFn: () => adminCampaignService.dispatchBoard(c.campaignId), refetchInterval: 30_000 })
  const trips = useQuery({ queryKey: ['admin-campaigns', 'hub-trips', c.campaignId], queryFn: () => adminHubTripService.list(c.campaignId), refetchInterval: 30_000 })
  const [openHub, setOpenHub] = useState<number | null>(null)
  const [contactOf, setContactOf] = useState<number | null>(null)

  // Đơn nằm trên chuyến xe chưa tới hub của nó thì shipper chưa thấy (khớp HubTripService.orderIdsOnTheWay)
  const idsOf = (delivered: boolean) =>
    new Set(
      (trips.data ?? [])
        .filter((t) => t.status !== 'CANCELLED')
        .flatMap((t) => t.stops.filter((s) => (t.status === 'DELIVERED' || !!s.arrivedAt) === delivered).flatMap((s) => s.orderIds ?? [])),
    )
  const arrived = idsOf(true)
  const pending = idsOf(false)
  const stateOf = (o: PreOrderResponse): State | null => {
    if (o.status === 'FAILED') return 'failed'
    if (o.status === 'DELIVERED') return 'delivered'
    if (o.status === 'SHIPPING') return 'delivering'
    if (o.status === 'READY') {
      if (pending.has(o.preOrderId) && !arrived.has(o.preOrderId)) return 'onTheWay'
      return o.hubReceivedAt ? 'waiting' : 'unconfirmed'
    }
    return null
  }

  const rows = orders
    .filter((o) => o.fulfillmentMethod !== 'PICKUP' && o.hubId != null)
    .map((o) => ({ o, state: stateOf(o) }))
    .filter((x): x is { o: PreOrderResponse; state: State } => x.state != null)
  const hubs = [...new Set(rows.map((x) => x.o.hubId as number))]
    .map((id) => {
      const own = rows.filter((x) => x.o.hubId === id)
      const first = own[0].o
      const point: LatLng | null = first.hubLatitude != null && first.hubLongitude != null ? [Number(first.hubLatitude), Number(first.hubLongitude)] : null
      return { id, name: first.hubName ?? `Hub #${id}`, point, own, count: (s: State) => own.filter((x) => x.state === s).length }
    })
    .sort((a, b) => b.count('failed') - a.count('failed') || b.count('waiting') - a.count('waiting') || a.name.localeCompare(b.name, 'vi'))
  const total = (s: State) => rows.filter((x) => x.state === s).length

  const shippers = board.data?.shippers ?? []
  const kmTo = (point: LatLng | null, d: DispatchShipper) =>
    point && d.latitude != null && d.longitude != null ? haversineKm(point, [Number(d.latitude), Number(d.longitude)]) : null
  /** Shipper chở nổi số kg này, gần hub và đang online xếp trước */
  const shippersFor = (point: LatLng | null, kg: number) =>
    shippers
      .filter((d) => (d.vehicleCapacityKg ?? vehicleCapacity(d.vehicleType)) >= kg)
      .map((d) => ({ d, km: kmTo(point, d) }))
      .sort((a, b) => Number(b.d.online) - Number(a.d.online) || (a.km ?? 999) - (b.km ?? 999))

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
  const fail = (e: unknown, text: string) => {
    refresh()
    onNotice({ ok: false, text: getErrorMessage(e, text) })
  }
  // Đưa đơn thất bại về lại hub, chờ shipper nhận
  const retry = useMutation({
    mutationFn: async (o: PreOrderResponse) => {
      await adminCampaignService.retry(o.preOrderId)
      await adminCampaignService.dispatch(c.campaignId, [o.preOrderId], undefined, o.hubId ?? undefined)
    },
    onSuccess: (_r, o) => {
      refresh()
      onNotice({ ok: true, text: `Đơn ${o.code} đã về hub chờ shipper giao lại.` })
    },
    onError: (e) => fail(e, 'Không giao lại được đơn.'),
  })
  const notify = useMutation({
    mutationFn: (a: { hubId: number; name: string; ids: number[] }) => adminCampaignService.notifyHubShippers(c.campaignId, a.hubId, a.ids),
    onSuccess: (sent, a) => onNotice({ ok: sent > 0, text: sent > 0 ? `Đã nhắc ${sent} shipper tới ${a.name}.` : `${a.name} không còn đơn nào đang chờ.` }),
    onError: (e) => fail(e, 'Không gửi được thông báo.'),
  })
  const assign = useMutation({
    mutationFn: (a: { o: PreOrderResponse; shipperId: number; name: string }) =>
      adminCampaignService.dispatch(c.campaignId, [a.o.preOrderId], a.shipperId, a.o.hubId ?? undefined),
    onSuccess: (_r, a) => {
      setContactOf(null)
      refresh()
      onNotice({ ok: true, text: `Đã gắn đơn ${a.o.code} cho ${a.name}.` })
    },
    onError: (e) => fail(e, 'Không gắn được shipper.'),
  })

  const badge = !rows.length
    ? 'Chưa có đơn ở hub'
    : total('failed')
      ? `${total('failed')} đơn thất bại`
      : total('waiting')
        ? `${total('waiting')} đơn chờ shipper`
        : `${total('delivered')}/${rows.length} đã giao`

  return (
    <CampaignSection
      icon={<Warehouse size={20} />}
      title="Giao tại hub"
      badge={badge}
      badgeTone={!rows.length ? 'gray' : total('failed') ? 'red' : total('waiting') ? 'amber' : 'green'}
    >
      <div className="flex flex-col gap-3 pt-4">
        {!rows.length && <p className="text-sm text-gray-500">Đơn xuất hiện ở đây sau khi chốt xe ra hub.</p>}
        {hubs.map((h) => {
          const open = openHub === h.id
          const waiting = h.own.filter((x) => x.state === 'waiting' && !x.o.shipperId)
          const lightest = Math.min(...waiting.map((x) => Number(x.o.totalKg ?? 0)))
          const eligible = waiting.length ? shippersFor(h.point, lightest) : []
          const nearby = eligible.filter((x) => x.km != null && x.km <= NEAR_KM)
          const targets = (nearby.length ? nearby : eligible).map((x) => x.d.id)
          return (
            <section key={h.id} aria-label={h.name} className="rounded-2xl border border-gray-200">
              <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <button type="button" aria-expanded={open} onClick={() => setOpenHub(open ? null : h.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <ChevronDown size={16} className={`shrink-0 text-gray-400 ${open ? 'rotate-180' : ''}`} />
                  <span className="truncate text-sm font-black text-gray-900">{h.name}</span>
                </button>
                {(Object.keys(STATE) as State[]).filter((s) => h.count(s) > 0).map((s) => (
                  <span key={s} className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATE[s].cls}`}>{STATE[s].label} {h.count(s)}</span>
                ))}
                {waiting.length > 0 && (
                  <button type="button" disabled={notify.isPending || targets.length === 0} onClick={() => notify.mutate({ hubId: h.id, name: h.name, ids: targets })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-600 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-40">
                    <BellRing size={14} /> Nhắc {targets.length} shipper
                  </button>
                )}
              </div>
              {open && (
                <ul className="divide-y divide-gray-100 border-t border-gray-100">
                  {[...h.own].sort((a, b) => Object.keys(STATE).indexOf(a.state) - Object.keys(STATE).indexOf(b.state)).map(({ o, state }) => {
                    const holder = o.shipperId ? shippers.find((d) => d.id === o.shipperId) : undefined
                    const contact = contactOf === o.preOrderId
                    const options = contact ? shippersFor(h.point, Number(o.totalKg ?? 0)) : []
                    return (
                      <li key={o.preOrderId} className="flex flex-col gap-2 px-3 py-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATE[state].cls}`}>{STATE[state].label}</span>
                          <span className="min-w-0 flex-1">
                            <b className="text-gray-900">{o.recipientName}</b> · {formatKg(o.totalKg)} · {o.code}
                            <span className="block truncate text-gray-500" title={o.shippingAddress ?? undefined}>
                              {o.shipperId ? `Shipper: ${holder?.name ?? `#${o.shipperId}`}${holder?.phone ? ` (${holder.phone})` : ''} · ` : ''}
                              {state === 'failed' && o.failReason ? `${o.failReason} · ` : ''}
                              {state === 'unconfirmed' ? (o.hubIssueNote ? `Thiếu / hư: ${o.hubIssueNote} · ` : 'Xác nhận ở Điểm trung chuyển · ') : ''}{o.shippingAddress}
                            </span>
                          </span>
                          {state === 'failed' && (
                            <button type="button" disabled={retry.isPending || c.status !== 'FULFILLING'} onClick={() => retry.mutate(o)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1 font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-40">
                              {retry.isPending && retry.variables?.preOrderId === o.preOrderId ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Giao lại
                            </button>
                          )}
                          {state === 'waiting' && (
                            <button type="button" aria-expanded={contact} onClick={() => setContactOf(contact ? null : o.preOrderId)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 font-bold text-gray-700 hover:border-[#326318]">
                              <Phone size={13} /> {o.shipperId ? 'Đổi shipper' : 'Gọi & gắn shipper'}
                            </button>
                          )}
                        </div>
                        {contact && (
                          <ul className="grid max-h-56 gap-1.5 overflow-y-auto sm:grid-cols-2">
                            {options.map(({ d, km }) => (
                              <li key={d.id} className="flex flex-col gap-1 rounded-xl bg-gray-50 px-3 py-2">
                                <b className="truncate text-gray-900">{d.online ? '● ' : '○ '}{d.name}</b>
                                <span className="text-gray-500">{vehicleLabel(d.vehicleType)}{km != null ? ` · cách hub ${km.toFixed(1)} km` : ''}</span>
                                <span className="flex items-center justify-between gap-2">
                                  {d.phone ? <a href={`tel:${d.phone}`} className="text-sm font-black text-[#326318]">{d.phone}</a> : <span className="text-gray-400">Chưa có số</span>}
                                  <button type="button" disabled={assign.isPending || c.status !== 'FULFILLING'}
                                    onClick={async () => {
                                      const agreed = await globalShowConfirm(`Gắn đơn ${o.code} cho shipper?`, 'Chỉ gắn khi shipper đã đồng ý qua điện thoại. Shipper sẽ nhận thông báo trong app.', {
                                        confirmText: 'Đã đồng ý, gắn đơn',
                                        details: [
                                          `Shipper: ${d.name} · ${vehicleLabel(d.vehicleType)}${d.phone ? ` · ${d.phone}` : ''}`,
                                          `Đơn: ${o.recipientName} · ${formatKg(o.totalKg)} tại ${h.name}`,
                                        ],
                                      })
                                      if (agreed) assign.mutate({ o, shipperId: d.id, name: d.name })
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#326318] px-2.5 py-1.5 font-bold text-white disabled:opacity-40">
                                    <UserCheck size={13} /> Đã xác nhận, gắn
                                  </button>
                                </span>
                              </li>
                            ))}
                            {options.length === 0 && <li className="rounded-xl bg-amber-50 px-3 py-2 font-semibold text-amber-800">Không có shipper nào chở nổi đơn này.</li>}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </CampaignSection>
  )
}
