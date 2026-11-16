import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, CheckCircle2, Clock, Flame, Loader2, MapPin, Navigation, Package, Phone, Truck, XCircle } from 'lucide-react'
import { shipperPreOrderService, uploadService, type PreOrderResponse, type PriorityLevel } from '@/services'
import { getErrorMessage } from '@/utils'

const PRIORITY: Record<PriorityLevel, { label: string; cls: string }> = {
  URGENT: { label: 'Gấp', cls: 'bg-red-100 text-red-700' },
  HIGH: { label: 'Ưu tiên', cls: 'bg-amber-100 text-amber-800' },
  NORMAL: { label: 'Thường', cls: 'bg-emerald-100 text-emerald-800' },
}
const FAIL_REASONS = ['Không liên lạc được người nhận', 'Người nhận hẹn giao lại', 'Sai địa chỉ', 'Người nhận từ chối nhận hàng']
const vnd = (n?: number | null) => `${Number(n ?? 0).toLocaleString('vi-VN')}đ`
const fmtTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'

/** Tab "Đơn chiến dịch" của shipper: đơn được giao + đơn tại hub chờ nhận, xếp theo độ gấp */
export default function ShipperCampaignOrders() {
  const qc = useQueryClient()
  const ready = useQuery({ queryKey: ['shipper-preorders', 'ready'], queryFn: shipperPreOrderService.ready, refetchInterval: 30_000 })
  const mine = useQuery({ queryKey: ['shipper-preorders', 'mine'], queryFn: shipperPreOrderService.mine, refetchInterval: 30_000 })
  const [error, setError] = useState<string | null>(null)
  const refresh = () => qc.invalidateQueries({ queryKey: ['shipper-preorders'] })
  const onError = (e: unknown) => setError(getErrorMessage(e, 'Thao tác thất bại.'))

  const accept = useMutation({ mutationFn: (id: number) => shipperPreOrderService.accept(id), onSuccess: refresh, onError })

  // READY: admin giao cho mình, chưa lấy khỏi hub. SHIPPING (hoặc đơn cũ READY đã lấy): đang giao
  const assignedWaiting = (mine.data ?? []).filter((o) => o.status === 'READY' && !o.pickedUpAt)
  const delivering = (mine.data ?? []).filter((o) => o.status === 'SHIPPING' || (o.status === 'READY' && o.pickedUpAt))
  const done = (mine.data ?? []).filter((o) => o.status === 'DELIVERED' || o.status === 'FAILED').slice(0, 10)

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
          <button type="button" onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}

      <Section
        icon={<Truck className="size-5 text-primary" />}
        title="Đang giao"
        hint="Đã lấy hàng ở hub, giao tới khách và thu tiền còn lại"
        empty="Chưa có đơn chiến dịch nào đang giao."
        loading={mine.isPending}
        orders={delivering}
        render={(o) => <DeliveringActions o={o} onDone={refresh} onError={onError} />}
      />

      <Section
        icon={<Package className="size-5 text-sky-600" />}
        title="Admin đã giao cho bạn"
        hint="Tới điểm tập kết lấy hàng rồi bấm Đã lấy hàng"
        empty="Chưa có đơn nào được giao cho bạn."
        loading={mine.isPending}
        orders={assignedWaiting}
        render={(o) => (
          <button
            type="button"
            disabled={accept.isPending}
            onClick={() => accept.mutate(o.preOrderId)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
          >
            <Package size={16} /> Đã lấy hàng ở hub
          </button>
        )}
      />

      <Section
        icon={<Flame className="size-5 text-red-500" />}
        title="Tại hub chờ nhận"
        hint="Đơn gấp nằm trên cùng, nhận để giao"
        empty="Hub chưa có đơn chiến dịch nào chờ shipper."
        loading={ready.isPending}
        orders={ready.data ?? []}
        render={(o) => (
          <button
            type="button"
            disabled={accept.isPending}
            onClick={() => accept.mutate(o.preOrderId)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-black text-white disabled:opacity-50"
          >
            <CheckCircle2 size={16} /> Nhận đơn
          </button>
        )}
      />

      {done.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-tight text-gray-500">Đã xử lý gần đây</h3>
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
            {done.map((o) => (
              <li key={o.preOrderId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="font-bold text-gray-800">{o.code} · {o.recipientName}</span>
                {o.status === 'DELIVERED' ? (
                  <span className="text-xs font-bold text-emerald-700">
                    Đã giao · thu {vnd(o.remainingAmount)}
                    {Number(o.shipperIncomeAmount ?? 0) > 0 && ` · cước +${vnd(o.shipperIncomeAmount)}`}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-700">
                    Thất bại{o.failReason ? `: ${o.failReason}` : ''}
                    {Number(o.shipperIncomeAmount ?? 0) > 0 && ` · cước +${vnd(o.shipperIncomeAmount)}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Section({
  icon, title, hint, empty, loading, orders, render,
}: {
  icon: React.ReactNode
  title: string
  hint: string
  empty: string
  loading: boolean
  orders: PreOrderResponse[]
  render: (o: PreOrderResponse) => React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <h3 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-gray-900">{icon} {title}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-black text-gray-600">{orders.length}</span>
        <span className="text-xs text-gray-500">{hint}</span>
      </div>
      {loading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((o) => (
            <OrderCard key={o.preOrderId} o={o} action={render(o)} />
          ))}
        </div>
      )}
    </section>
  )
}

/** Phí dịch vụ shipper (khớp capnong.wallet.shipper-fee-rate) */
const SHIPPER_FEE_RATE = 0.03
const shipperEarn = (o: PreOrderResponse) => Math.round(Number(o.shippingBaseFee ?? o.shippingFee ?? 0) * (1 - SHIPPER_FEE_RATE))

function OrderCard({ o, action }: { o: PreOrderResponse; action: React.ReactNode }) {
  const p = PRIORITY[(o.priorityLevel ?? 'NORMAL') as PriorityLevel]
  const dest = o.shippingLatitude != null ? `${o.shippingLatitude},${o.shippingLongitude}` : o.shippingAddress ?? ''
  return (
    <article className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm ${o.priorityLevel === 'URGENT' ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${p.cls}`}>{p.label}</span>
            <span className="text-xs font-bold text-gray-400">{o.code}</span>
            {o.deliveryZone && <span className="text-xs font-semibold text-gray-500">· {o.deliveryZone}</span>}
          </div>
          <h4 className="mt-1 text-lg font-black text-gray-900">{o.recipientName}</h4>
          <p className="flex items-start gap-1 text-sm text-gray-600">
            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" /> {o.shippingAddress}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-bold uppercase text-gray-400">Thu khi giao</p>
          <p className="text-xl font-black text-primary">{vnd(o.remainingAmount)}</p>
          {shipperEarn(o) > 0 && <p className="text-xs font-bold text-emerald-700">Cước bạn nhận {vnd(shipperEarn(o))}</p>}
        </div>
      </div>
      {o.status === 'READY' && Number(o.remainingAmount ?? 0) > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Nhận đơn cần ký quỹ <b>{vnd(o.remainingAmount)}</b> trong ví (bằng số tiền sẽ thu). Giao xong ví trừ đúng số tiền mặt bạn đang cầm và cộng cước; giao thất bại thì trả lại ký quỹ và vẫn nhận 50% cước.
        </p>
      )}
      {o.codReservedAmount != null && Number(o.codReservedAmount) > 0 && (
        <p className="text-xs font-semibold text-sky-700">Đang ký quỹ {vnd(o.codReservedAmount)} trong ví cho đơn này</p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
        <span className="font-semibold">{o.crateQuantity} thùng × {o.crateKg} kg</span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> Giao trước <b className={o.priorityLevel === 'URGENT' ? 'text-red-700' : 'text-gray-800'}>{fmtTime(o.deliverBy)}</b>
        </span>
        {o.priorityReason && <span>{o.priorityReason}</span>}
        {o.sourceShopName && <span>Lô: {o.sourceShopName} · {o.sourceProductName}</span>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {o.recipientPhone && (
            <a href={`tel:${o.recipientPhone}`} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">
              <Phone size={13} /> Gọi
            </a>
          )}
          {dest && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700"
            >
              <Navigation size={13} /> Chỉ đường
            </a>
          )}
        </div>
        {action}
      </div>
    </article>
  )
}

function DeliveringActions({ o, onDone, onError }: { o: PreOrderResponse; onDone: () => void; onError: (e: unknown) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [failing, setFailing] = useState(false)
  const [reason, setReason] = useState(FAIL_REASONS[0])
  const deliver = useMutation({ mutationFn: () => shipperPreOrderService.deliver(o.preOrderId, photo ?? undefined), onSuccess: onDone, onError })
  const fail = useMutation({ mutationFn: () => shipperPreOrderService.fail(o.preOrderId, reason), onSuccess: onDone, onError })

  const upload = async (f?: File) => {
    if (!f) return
    setUploading(true)
    try {
      const res = await uploadService.uploadImage(f, 'pod')
      setPhoto(res.result?.url ?? null)
    } catch (e) {
      onError(e)
    } finally {
      setUploading(false)
    }
  }

  if (failing) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2">
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-2 py-2 text-xs">
          {FAIL_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button type="button" disabled={fail.isPending} onClick={() => fail.mutate()} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">
          Xác nhận thất bại
        </button>
        <button type="button" onClick={() => setFailing(false)} className="text-xs font-bold text-gray-500">Huỷ</button>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />} {photo ? 'Đã chụp' : 'Ảnh giao hàng'}
      </button>
      <button type="button" onClick={() => setFailing(true)} className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700">
        <XCircle size={13} /> Thất bại
      </button>
      {!photo && <span className="w-full text-[11px] font-semibold text-amber-700">Chụp ảnh giao hàng trước khi bấm Giao xong.</span>}
      <button type="button" disabled={deliver.isPending || uploading || !photo} onClick={() => deliver.mutate()} className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50">
        <CheckCircle2 size={14} /> Giao xong · đã thu {vnd(o.remainingAmount)}
      </button>
    </div>
  )
}
