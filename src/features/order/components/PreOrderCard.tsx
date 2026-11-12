import React from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Flame, ChevronRight, XCircle, Clock, CheckCircle2, Truck, PackageCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import logoIcon from '@/assets/logo-icon.png'
import type { PreOrderResponse } from '@/services'

type PreStatus = PreOrderResponse['status']

/** Đơn đặt trước rơi vào tab nào của trang Đơn hàng */
export const PRE_ORDER_TAB_STATUSES: Record<string, PreStatus[] | undefined> = {
  ALL: undefined,
  AWAITING_PAYMENT: ['PENDING'],
  PENDING: ['DEPOSIT_PAID'],
  SHIPPING: ['PROCESSING', 'READY'],
  COMPLETED: ['DELIVERED'],
  REFUND: [],
  CANCELLED: ['CANCELLED', 'FAILED'],
}

const STATUS: Record<PreStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Chờ thanh toán cọc', cls: 'bg-amber-50 text-amber-700 border-amber-300', icon: <Clock size={13} className="animate-pulse" /> },
  DEPOSIT_PAID: { label: 'Đã cọc · chờ thu hoạch', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={13} /> },
  PROCESSING: { label: 'Đã đóng thùng', cls: 'bg-sky-50 text-sky-700 border-sky-200', icon: <PackageCheck size={13} /> },
  READY: { label: 'Đang giao', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Truck size={13} /> },
  DELIVERED: { label: 'Đã giao', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={13} /> },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200', icon: <XCircle size={13} /> },
  FAILED: { label: 'Giao không thành công', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: <AlertCircle size={13} /> },
}

const vnd = (n?: number | null) => `${Number(n ?? 0).toLocaleString('vi-VN')} đ`

/** Tiến trình ngắn để người mua biết đơn đặt trước đang ở bước nào */
const STEPS: { key: PreStatus[]; label: string }[] = [
  { key: ['DEPOSIT_PAID'], label: 'Đã cọc' },
  { key: ['PROCESSING'], label: 'Đóng thùng' },
  { key: ['READY'], label: 'Đang giao' },
  { key: ['DELIVERED'], label: 'Đã giao' },
]

export const PreOrderCard: React.FC<{
  p: PreOrderResponse
  onCancel: (p: PreOrderResponse) => void
  cancelling: boolean
}> = ({ p, onCancel, cancelling }) => {
  const st = STATUS[p.status] ?? STATUS.PENDING
  const unpaid = p.status === 'PENDING'
  const stepIndex = STEPS.findIndex((s) => s.key.includes(p.status))
  const reduced = p.originalCrateQuantity != null && p.originalCrateQuantity > p.crateQuantity
  const refund = Number(p.shortfallRefundAmount ?? 0)
  const remainingDue = p.status === 'DEPOSIT_PAID' || p.status === 'PROCESSING' || p.status === 'READY'

  return (
    <div
      className={`bg-white rounded-3xl border transition-all overflow-hidden ${
        unpaid ? 'border-amber-300 shadow-md ring-1 ring-amber-200' : 'border-line hover:border-neutral-300 shadow-sm'
      }`}
    >
      {/* Header: chiến dịch & trạng thái */}
      <div className="px-6 py-4 bg-orange-50/50 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <Flame size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-500 text-white">
                Chiến dịch
              </span>
              <Link
                to={`/chien-dich/${p.campaignId}`}
                className="font-bold text-ink text-sm hover:text-emerald-700 hover:underline flex items-center gap-1 min-w-0"
              >
                <span className="truncate max-w-[260px] sm:max-w-[420px]">{p.campaignTitle}</span>
                <ChevronRight size={14} className="text-ink-muted shrink-0" />
              </Link>
            </div>
            <span className="text-xs text-ink-muted">
              Mã đặt trước: <span className="font-mono font-semibold text-ink">{p.code}</span>
              {p.createdAt && ` · ${new Date(p.createdAt).toLocaleString('vi-VN')}`}
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${st.cls}`}>
          {st.icon}
          {st.label}
        </span>
      </div>

      {/* Nội dung thùng */}
      <div className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl border border-line bg-[#f7faf4] flex items-center justify-center shrink-0">
          <img src={logoIcon} alt="" className="w-10 h-10 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-ink">
            {p.crateQuantity} thùng × {p.crateKg} kg
            <span className="text-ink-muted font-normal"> · tổng {p.totalKg} kg</span>
          </h4>
          <p className="text-xs text-ink-muted mt-0.5">Đơn giá {vnd(p.unitPrice)}/kg · giao về {p.shippingAddress || 'địa chỉ của bạn'}</p>
          {reduced && (
            <p className="mt-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              Giảm từ {p.originalCrateQuantity} thùng do nhà vườn thiếu hàng
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-emerald-700">{vnd(p.totalAmount)}</p>
        </div>
      </div>

      {/* Tiến trình */}
      {stepIndex >= 0 && (
        <div className="px-6 pb-4">
          <ol className="grid grid-cols-4 gap-1">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex flex-col gap-1">
                <span className={`h-1.5 rounded-full ${i <= stepIndex ? 'bg-emerald-600' : 'bg-neutral-200'}`} />
                <span className={`text-[11px] font-semibold ${i <= stepIndex ? 'text-emerald-800' : 'text-ink-muted'}`}>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {(p.cancelReason || p.failReason) && (
        <p className="mx-6 mb-4 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-ink-muted">Lý do: {p.cancelReason || p.failReason}</p>
      )}

      {/* Footer: tiền & hành động */}
      <div className="px-6 py-4 border-t border-line bg-neutral-50/40 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-ink-muted space-y-0.5">
          <p>
            {unpaid ? 'Cần cọc' : 'Đã cọc'}: <span className="font-bold text-ink">{vnd(p.depositAmount)}</span>
            {remainingDue && (
              <>
                {' · '}Trả khi nhận: <span className="font-bold text-ink">{vnd(p.remainingAmount)}</span>
              </>
            )}
          </p>
          {refund > 0 && <p className="font-semibold text-rose-600">Đã hoàn {vnd(refund)} vào ví</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unpaid && p.checkoutUrl && (
            <Button
              variant="primary"
              onClick={() => (window.location.href = p.checkoutUrl!)}
              className="gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
            >
              <CreditCard size={14} />
              Thanh toán cọc
            </Button>
          )}
          {unpaid && (
            <Button
              variant="secondary"
              onClick={() => onCancel(p)}
              disabled={cancelling}
              className="gap-1 px-3 py-2 text-xs rounded-xl text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
            >
              <XCircle size={14} />
              {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
            </Button>
          )}
          <Link
            to={`/chien-dich/${p.campaignId}`}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-ink-muted hover:text-ink hover:bg-neutral-100 transition-colors"
          >
            Xem chiến dịch
          </Link>
        </div>
      </div>
    </div>
  )
}
