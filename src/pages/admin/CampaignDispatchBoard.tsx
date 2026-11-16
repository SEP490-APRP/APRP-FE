import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Clock, Flame, Loader2, MapPin, PackageCheck, RotateCcw, Send, Truck, User } from 'lucide-react'
import {
  adminCampaignService,
  type CampaignResponse,
  type DispatchBoard,
  type PreOrderResponse,
  type PriorityLevel,
} from '@/services'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'

export const PRIORITY: Record<PriorityLevel, { label: string; chip: string; dot: string; ring: string }> = {
  URGENT: { label: 'Gấp', chip: 'bg-red-100 text-red-700', dot: 'bg-red-500', ring: 'border-red-200' },
  HIGH: { label: 'Ưu tiên', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', ring: 'border-amber-200' },
  NORMAL: { label: 'Thường', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', ring: 'border-gray-200' },
}

const SHELF_LABEL: Record<string, string> = { DAYS_2_3: 'Mức 1 · 2–3 ngày sau chốt', DAYS_3_4: 'Mức 2 · 3–4 ngày sau chốt', DAYS_5_6: 'Mức 3 · 5–6 ngày sau chốt' }

const fmtTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'

/** Đơn còn chia được: đã đóng gói chờ chia, hoặc đã ra hub nhưng shipper chưa lấy hàng */
const canDispatch = (o: PreOrderResponse) => o.status === 'PROCESSING' || (o.status === 'READY' && !o.pickedUpAt)

/** Tab "Chia đơn giao": gom theo phường, xếp theo độ gấp, giao cho shipper */
export default function CampaignDispatchBoard({
  c,
  allOrders,
  onNotice,
}: {
  c: CampaignResponse
  allOrders: PreOrderResponse[]
  onNotice: (n: { ok: boolean; text: string }) => void
}) {
  const qc = useQueryClient()
  const key = ['admin-campaigns', 'dispatch', c.campaignId]
  const board = useQuery({ queryKey: key, queryFn: () => adminCampaignService.dispatchBoard(c.campaignId) })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [shipperId, setShipperId] = useState<string>('')
  const fulfilling = c.status === 'FULFILLING'

  const refresh = (data?: DispatchBoard) => {
    if (data) qc.setQueryData(key, data)
    else qc.invalidateQueries({ queryKey: key })
    qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
  }

  // Đơn giao tận nơi đã cọc nhưng chưa đóng gói: đóng gói hàng loạt rồi mới chia được
  const unpacked = useMemo(
    () => allOrders.filter((o) => o.status === 'DEPOSIT_PAID' && o.fulfillmentMethod !== 'PICKUP'),
    [allOrders],
  )
  const packAll = useMutation({
    mutationFn: async () => {
      for (const o of unpacked) await adminCampaignService.pack(o.preOrderId)
      return unpacked.length
    },
    onSuccess: (n) => {
      onNotice({ ok: true, text: `Đã đóng gói ${n} đơn, sẵn sàng chia.` })
      refresh()
    },
    onError: (e) => onNotice({ ok: false, text: getErrorMessage(e, 'Không đóng gói được đơn.') }),
  })

  const dispatch = useMutation({
    mutationFn: (toShipper: boolean) =>
      adminCampaignService.dispatch(c.campaignId, [...selected], toShipper && shipperId ? Number(shipperId) : undefined),
    onSuccess: (data, toShipper) => {
      const s = data.shippers.find((x) => String(x.id) === shipperId)
      onNotice({
        ok: true,
        text: toShipper && s ? `Đã giao ${selected.size} đơn cho ${s.name}.` : `Đã đưa ${selected.size} đơn ra hub, shipper tự nhận.`,
      })
      setSelected(new Set())
      refresh(data)
    },
    onError: (e) => onNotice({ ok: false, text: getErrorMessage(e, 'Không chia được đơn.') }),
  })

  const retry = useMutation({
    mutationFn: (id: number) => adminCampaignService.retry(id),
    onSuccess: () => {
      onNotice({ ok: true, text: 'Đã đưa đơn về chờ chia lại, đơn được đẩy lên nhóm ưu tiên.' })
      refresh()
    },
    onError: (e) => onNotice({ ok: false, text: getErrorMessage(e, 'Không giao lại được.') }),
  })

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleZone = (orders: PreOrderResponse[]) => {
    const ids = orders.filter(canDispatch).map((o) => o.preOrderId)
    const all = ids.every((id) => selected.has(id))
    setSelected((s) => {
      const n = new Set(s)
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)))
      return n
    })
  }
  const selectUrgent = () => {
    const ids = (board.data?.zones ?? []).flatMap((z) => z.orders).filter((o) => canDispatch(o) && o.priorityLevel === 'URGENT')
    setSelected(new Set(ids.map((o) => o.preOrderId)))
  }

  if (board.isPending) return <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
  if (board.isError || !board.data)
    return <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{getErrorMessage(board.error, 'Không tải được bảng chia đơn.')}</div>
  const b = board.data
  const selectedShipper = b.shippers.find((s) => String(s.id) === shipperId)

  return (
    <div className="flex flex-col gap-4">
      {/* Tổng quan độ gấp */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat tone="red" icon={<Flame size={16} />} label="Gấp" value={b.urgentCount} hint="giao trước tiên" />
        <Stat tone="amber" icon={<Clock size={16} />} label="Ưu tiên" value={b.highCount} hint="< 48h hoặc giao lại" />
        <Stat tone="green" icon={<Truck size={16} />} label="Thường" value={b.normalCount} hint="còn nhiều ngày" />
        <div className="rounded-2xl border border-gray-200 bg-white p-3.5 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Tiến độ chia</p>
          <p className="mt-1 font-black text-gray-900">{b.waitingCount} chờ chia · {b.dispatchedCount} đã ra hub</p>
          <p className="text-xs text-gray-500">Độ bền lô hàng: {b.shelfLifeTier ? SHELF_LABEL[b.shelfLifeTier] : 'chưa khai'}</p>
        </div>
      </div>
      <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs leading-relaxed text-gray-600">
        <b>Cách xếp độ gấp:</b> lô nhà vườn khai mức 1 (giữ tươi 2–3 ngày sau ngày chốt) → <b className="text-red-700">Gấp</b>; còn dưới 24h tới hạn tươi
        (tính từ ngày chốt chiến dịch) → <b className="text-red-700">Gấp</b>; dưới 48h hoặc đơn giao lại sau thất bại → <b className="text-amber-700">Ưu tiên</b>;
        còn lại → <b className="text-emerald-700">Thường</b>. Khu và đơn gấp luôn nằm trên cùng.
      </p>

      {unpacked.length > 0 && fulfilling && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-900">
          <span>
            <b>{unpacked.length} đơn giao tận nơi</b> đã cọc nhưng chưa đóng gói, chưa chia được.
          </span>
          <button
            type="button"
            disabled={packAll.isPending}
            onClick={() => packAll.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {packAll.isPending ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />} Đóng gói tất cả
          </button>
        </div>
      )}

      {/* Thanh chia đơn */}
      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <span className="text-sm font-bold text-gray-800">Đã chọn {selected.size} đơn</span>
        <button type="button" onClick={selectUrgent} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">
          Chọn tất cả đơn Gấp
        </button>
        {selected.size > 0 && (
          <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold text-gray-500 underline">
            Bỏ chọn
          </button>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={shipperId}
            onChange={(e) => setShipperId(e.target.value)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
            aria-label="Chọn shipper"
          >
            <option value="">— Chọn shipper —</option>
            {b.shippers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.online ? '● ' : '○ '}
                {s.name} · đang cầm {s.activePreOrders} đơn{s.vehicleNumber ? ` · ${s.vehicleNumber}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!fulfilling || selected.size === 0 || !shipperId || dispatch.isPending}
            onClick={() => dispatch.mutate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#326318] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
          >
            <Send size={14} /> Giao cho {selectedShipper ? selectedShipper.name : 'shipper'}
          </button>
          <button
            type="button"
            disabled={!fulfilling || selected.size === 0 || dispatch.isPending}
            onClick={() => dispatch.mutate(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-800 disabled:opacity-40"
          >
            <Truck size={14} /> Ra hub, shipper tự nhận
          </button>
        </div>
      </div>

      {b.zones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Chưa có đơn giao tận nơi đã đóng gói. Đóng gói đơn ở trên hoặc ở tab Đơn đặt trước.
        </div>
      ) : (
        b.zones.map((z) => {
          const pr = PRIORITY[z.topPriority]
          const dispatchable = z.orders.filter(canDispatch)
          const allChecked = dispatchable.length > 0 && dispatchable.every((o) => selected.has(o.preOrderId))
          return (
            <section key={z.zone} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${pr.ring}`}>
              <header className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  disabled={dispatchable.length === 0}
                  onChange={() => toggleZone(z.orders)}
                  className="h-4 w-4 accent-[#326318]"
                  aria-label={`Chọn cả khu ${z.zone}`}
                />
                <MapPin size={16} className="text-[#326318]" />
                <h4 className="font-black text-gray-900">{z.zone}</h4>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${pr.chip}`}>{pr.label}</span>
                <span className="ml-auto text-xs text-gray-600">
                  {z.orderCount} đơn · {formatKg(z.totalKg)} · thu {formatVnd(z.codTotal)}
                </span>
              </header>
              <ul className="divide-y divide-gray-100">
                {z.orders.map((o) => {
                  const p = PRIORITY[(o.priorityLevel ?? 'NORMAL') as PriorityLevel]
                  const can = canDispatch(o)
                  return (
                    <li key={o.preOrderId} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.has(o.preOrderId)}
                        disabled={!can}
                        onChange={() => toggle(o.preOrderId)}
                        className="h-4 w-4 accent-[#326318] disabled:opacity-30"
                        aria-label={`Chọn đơn ${o.code}`}
                      />
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} /> {p.label}
                      </span>
                      <div className="min-w-[180px] flex-1">
                        <p className="font-bold text-gray-900">
                          {o.code} · {o.recipientName}
                          <span className="ml-1.5 font-normal text-gray-500">{o.recipientPhone}</span>
                        </p>
                        <p className="truncate text-xs text-gray-500">{o.shippingAddress}</p>
                        <p className="text-[11px] font-semibold text-gray-600">
                          {o.priorityReason}
                          {o.shelfLifeTier && <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 font-bold text-gray-700">Bảo quản {SHELF_LABEL[o.shelfLifeTier]}</span>}
                        </p>
                        {o.sourceShopName && (
                          <p className="text-[11px] text-gray-500">
                            Lô: {o.sourceShopName} · {o.sourceProductName}
                            {o.sourceHarvestDate ? ` · thu hoạch ${new Date(o.sourceHarvestDate).toLocaleDateString('vi-VN')}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="w-28 text-right text-xs">
                        <p className="font-bold text-gray-900">{formatKg(o.totalKg)}</p>
                        <p className="text-gray-500">thu {formatVnd(o.remainingAmount)}</p>
                      </div>
                      <div className="w-32 text-xs">
                        <p className="text-gray-500">Giao trước</p>
                        <p className={`font-bold ${o.priorityLevel === 'URGENT' ? 'text-red-700' : 'text-gray-900'}`}>{fmtTime(o.deliverBy)}</p>
                      </div>
                      <div className="w-40 text-xs">
                        {o.status === 'PROCESSING' && <span className="font-semibold text-sky-700">Đã đóng gói · chờ chia</span>}
                        {o.status === 'READY' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                            <User size={12} />
                            {o.shipperName ? `${o.shipperName}${o.pickedUpAt ? ' · đang giao' : ' · chờ lấy'}` : 'Tại hub · chờ nhận'}
                          </span>
                        )}
                        {o.status === 'SHIPPING' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                            <Truck size={12} />
                            Đang giao{o.shipperName ? ` · ${o.shipperName}` : ''}
                          </span>
                        )}
                        {o.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                            <AlertTriangle size={12} /> Giao thất bại{o.failReason ? `: ${o.failReason}` : ''}
                          </span>
                        )}
                      </div>
                      {o.status === 'FAILED' && fulfilling && (
                        <button
                          type="button"
                          disabled={retry.isPending}
                          onClick={() => retry.mutate(o.preOrderId)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-50"
                        >
                          <RotateCcw size={13} /> Giao lại
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}

function Stat({ tone, icon, label, value, hint }: { tone: 'red' | 'amber' | 'green'; icon: React.ReactNode; label: string; value: number; hint: string }) {
  const t = {
    red: 'border-red-200 bg-red-50 text-red-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[tone]
  return (
    <div className={`rounded-2xl border p-3.5 ${t}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">{icon} {label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-xs opacity-80">{hint}</p>
    </div>
  )
}
