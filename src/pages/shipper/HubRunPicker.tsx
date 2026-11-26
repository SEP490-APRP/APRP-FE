import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Loader2, Navigation, Package, Route, Warehouse } from 'lucide-react'
import { shipperPreOrderService, type PreOrderResponse } from '@/services'
import {
  blockedReason,
  codOf,
  feeOf,
  groupByHub,
  kgOf,
  limitsOf,
  mapsRoute,
  pointOf,
  roadKm,
  routeKm,
  routeOrder,
  runTotals,
  suggestRun,
  type SuggestMode,
} from '@/features/campaign/hubRun'
import { formatKg, formatVnd } from '@/features/campaign/utils'

const MODES: { id: SuggestMode; label: string }[] = [
  { id: 'near', label: 'Gần nhau' },
  { id: 'fee', label: 'Cước cao nhất' },
  { id: 'urgent', label: 'Đơn gấp trước' },
]

const PRIORITY: Record<string, { label: string; cls: string }> = {
  URGENT: { label: 'Gấp', cls: 'bg-red-100 text-red-700' },
  HIGH: { label: 'Ưu tiên', cls: 'bg-amber-100 text-amber-800' },
}

/** Đơn tại hub: shipper chọn hub, tick nhiều đơn hoặc bấm gợi ý, rồi nhận cả chuyến một lần */
export default function HubRunPicker({
  orders,
  loading,
  onAccepted,
  onError,
}: {
  orders: PreOrderResponse[]
  loading: boolean
  onAccepted: () => void
  onError: (e: unknown) => void
}) {
  const capacity = useQuery({ queryKey: ['shipper-preorders', 'capacity'], queryFn: shipperPreOrderService.capacity, refetchInterval: 30_000 })
  const [hubId, setHubId] = useState<number | null>(null)
  const [ids, setIds] = useState<number[]>([])
  const [mode, setMode] = useState<SuggestMode | null>(null)
  const accept = useMutation({
    mutationFn: (list: number[]) => shipperPreOrderService.acceptBatch(list),
    onSuccess: () => {
      setIds([])
      setMode(null)
      onAccepted()
    },
    onError: (e) => {
      onError(e)
      onAccepted()
    },
  })

  const groups = groupByHub(orders)
  const hub = groups.find((g) => g.hubId === hubId) ?? groups[0]
  const limits = capacity.data ? limitsOf(capacity.data) : null
  const picked = hub ? routeOrder(hub.point, hub.orders.filter((o) => ids.includes(o.preOrderId))) : []
  const rest = hub
    ? hub.orders.filter((o) => !ids.includes(o.preOrderId)).sort((a, b) => (roadKm(hub.point, pointOf(a)) || 0) - (roadKm(hub.point, pointOf(b)) || 0))
    : []
  const totals = runTotals(picked)
  const km = hub ? routeKm(hub.point, picked) : null
  const link = hub && picked.length ? mapsRoute(hub.point, picked) : null
  const overLimit = !!limits && (totals.kg > limits.kg || totals.cod > limits.cod)

  const chooseHub = (id: number) => {
    setHubId(id)
    setIds([])
    setMode(null)
  }
  const suggest = (m: SuggestMode) => {
    if (!hub || !limits) return
    setMode(m)
    setIds(suggestRun(hub.point, hub.orders, m, limits))
  }
  const toggle = (id: number) => {
    setMode(null)
    setIds((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]))
  }

  const row = (o: PreOrderResponse, index: number | null) => {
    const on = index != null
    const blocked = !on && limits ? blockedReason(o, picked, limits) : null
    const dist = hub ? roadKm(hub.point, pointOf(o)) : NaN
    const pr = PRIORITY[o.priorityLevel ?? '']
    return (
      <li key={o.preOrderId}>
        <label className={`flex cursor-pointer items-start gap-3 px-4 py-3 ${on ? 'bg-[#f3f8ee]' : ''} ${blocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}>
          <input type="checkbox" className="sr-only" checked={on} disabled={!!blocked} onChange={() => toggle(o.preOrderId)} />
          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${on ? 'bg-[#326318] text-white' : 'border-2 border-gray-300'}`}>{on ? index + 1 : ''}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5 text-sm font-black text-gray-900">
              {o.recipientName}
              {pr && <span className={`rounded-full px-2 py-0.5 text-[11px] ${pr.cls}`}>{pr.label}</span>}
            </span>
            <span className="block text-xs text-gray-600">{o.shippingAddress}</span>
            <span className="block text-xs text-gray-500">
              {formatKg(kgOf(o))}{Number.isFinite(dist) ? ` · cách hub ${dist.toFixed(1)} km` : ''} · thu hộ {formatVnd(codOf(o))}
              {blocked && <b className="text-red-600"> · {blocked}</b>}
            </span>
          </span>
          <span className="shrink-0 text-right text-sm font-black text-[#326318]">+{formatVnd(feeOf(o))}</span>
        </label>
      </li>
    )
  }

  return (
    <section aria-label="Tạo chuyến giao từ hub" className="flex flex-col gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-gray-900">
          <Route className="size-5 text-primary" /> Tạo chuyến giao từ hub
        </h3>
        <p className="text-sm text-gray-500">Chỉ hiện đơn hub đã xác nhận. Nhận đơn xong thì tới hub quét đủ thùng rồi mới giao.</p>
      </div>

      {capacity.data && limits && (
        <p className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700">
          {capacity.data.vehicleLabel}: còn chở được <b>{formatKg(limits.kg)}</b> / {formatKg(capacity.data.capacityKg)} · ví còn ký quỹ được <b>{formatVnd(limits.cod)}</b>
        </p>
      )}

      {loading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
      ) : !hub ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">Hub chưa có đơn chiến dịch nào chờ shipper.</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div role="tablist" aria-label="Chọn hub" className="flex gap-2 overflow-x-auto border-b border-gray-100 p-3">
            {groups.map((g) => (
              <button
                key={g.hubId}
                type="button"
                role="tab"
                aria-selected={g.hubId === hub.hubId}
                onClick={() => chooseHub(g.hubId)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-sm font-bold ${g.hubId === hub.hubId ? 'bg-[#326318] text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Warehouse size={14} /> {g.name} <span className="rounded-full bg-white/25 px-1.5 text-xs">{g.orders.length}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <span className="text-xs font-bold text-gray-500">Gợi ý chuyến</span>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!limits}
                aria-pressed={mode === m.id}
                onClick={() => suggest(m.id)}
                className={`rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40 ${mode === m.id ? 'border-[#326318] bg-[#ffea79] text-[#3d2a00]' : 'border-gray-300 text-gray-700 hover:border-[#326318]'}`}
              >
                {m.label}
              </button>
            ))}
            {ids.length > 0 && (
              <button type="button" onClick={() => { setIds([]); setMode(null) }} className="ml-auto text-xs font-bold text-gray-500 underline">Bỏ chọn</button>
            )}
          </div>
          {mode && picked.length === 0 && <p className="px-4 pb-3 text-xs font-semibold text-amber-700">Không có đơn nào vừa sức chở và số dư ví hiện tại.</p>}
          {hub.address && <p className="px-4 pb-2 text-xs text-gray-500">Lấy hàng tại: {hub.address}</p>}
          <ul className="max-h-[26rem] divide-y divide-gray-100 overflow-y-auto border-t border-gray-100">
            {picked.map((o, i) => row(o, i))}
            {rest.map((o) => row(o, null))}
          </ul>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-4">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Tile label="Tải" value={limits ? `${formatKg(totals.kg)} / ${formatKg(limits.kg)}` : formatKg(totals.kg)} />
              <Tile label="Bạn nhận" value={formatVnd(totals.fee)} cls="text-[#326318]" />
              <Tile label="Thu hộ cần giữ" value={formatVnd(totals.cod)} cls="text-amber-700" />
              <Tile label="Quãng đường" value={picked.length && km != null ? `~${km} km` : '—'} />
            </dl>
            <div className="flex flex-wrap gap-2">
              {link && (
                <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700">
                  <Navigation size={16} /> Xem lộ trình
                </a>
              )}
              <button
                type="button"
                disabled={!picked.length || overLimit || accept.isPending}
                onClick={() => accept.mutate(picked.map((o) => o.preOrderId))}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#326318] px-4 py-3 text-sm font-black text-white disabled:opacity-40"
              >
                {accept.isPending ? <Loader2 size={16} className="animate-spin" /> : picked.length ? <Check size={16} /> : <Package size={16} />}
                {picked.length ? `Nhận ${picked.length} đơn` : 'Chọn đơn để nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Tile({ label, value, cls = 'text-gray-900' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
      <dt className="text-[11px] text-gray-500">{label}</dt>
      <dd className={`text-base font-black tabular-nums ${cls}`}>{value}</dd>
    </div>
  )
}
