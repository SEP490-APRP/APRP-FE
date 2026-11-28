import { Loader2, RefreshCw, Scale } from 'lucide-react'
import type { ShortOrder, TripChange } from '@/features/campaign/deliveryPlan'
import { formatKg, formatVnd } from '@/features/campaign/utils'

/** Chỉ hiện khi hàng hụt sau khi cân làm phí giao đổi: cước xe đổi, xe hết hàng, đơn huỷ mất phí, hoặc bớt được xe */
export default function AfterWeighPanel({
  feeChanges,
  cancelled,
  vehicleKg,
  needed,
  current,
  canReplan,
  onReplan,
  onUpdate,
  updating,
}: {
  feeChanges: TripChange[]
  /** Đơn bị huỷ do thiếu hàng có thu phí giao */
  cancelled: ShortOrder[]
  vehicleKg: number
  needed: number
  current: number
  canReplan: boolean
  onReplan: () => void
  onUpdate: () => void
  updating: boolean
}) {
  return (
    <section aria-label="Phí giao thay đổi sau khi cân" className="flex flex-col gap-3 rounded-3xl border-2 border-amber-300 bg-amber-50/60 p-4">
      <h4 className="flex items-center gap-2 text-base font-black text-amber-900">
        <Scale size={18} className="text-amber-700" /> Phí giao thay đổi sau khi cân
      </h4>
      {(feeChanges.length > 0 || cancelled.length > 0) && (
        <ul className="divide-y divide-amber-100 rounded-2xl bg-white text-xs">
          {feeChanges.map((c) => (
            <li key={`xe-${c.tripNo}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span>
                <b className="text-gray-900">Xe {c.tripNo}</b>{c.driverName ? ` · ${c.driverName}` : ''}
                <span className="text-gray-500"> · {c.newKg === 0 ? 'hết hàng, huỷ xe' : `${formatKg(c.oldKg)} còn ${formatKg(c.newKg)}`}</span>
              </span>
              <span className="font-bold text-gray-700">
                Cước <span className="text-gray-400 line-through">{formatVnd(c.oldFee)}</span> còn <b className="text-amber-800">{formatVnd(c.newFee)}</b>
              </span>
            </li>
          ))}
          {cancelled.map((s) => (
            <li key={s.order.preOrderId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span><b className="text-gray-900">{s.order.recipientName}</b> · {s.order.code} · huỷ đơn {formatKg(s.oldKg)}</span>
              <span className="font-bold text-gray-700">Không thu phí giao {formatVnd(Number(s.order.shippingFee ?? 0))}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {needed < current && (
          <p className="min-w-0 flex-1 text-sm font-black text-amber-900">Hàng còn lại chỉ cần {needed} xe cỡ {formatKg(vehicleKg)}, đang có {current} xe.</p>
        )}
        <span className="ml-auto flex flex-wrap gap-2">
          {needed < current && canReplan && (
            <button type="button" onClick={onReplan} className="rounded-xl border border-amber-600 bg-white px-3.5 py-2 text-xs font-bold text-amber-800">
              Xếp lại xe chưa có tài xế
            </button>
          )}
          {(feeChanges.length > 0 || cancelled.length > 0) && (
            <button type="button" disabled={updating} onClick={onUpdate} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50">
              {updating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Cập nhật cước và báo tài xế
            </button>
          )}
        </span>
      </div>
    </section>
  )
}
