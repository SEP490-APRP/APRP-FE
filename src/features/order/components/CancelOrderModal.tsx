import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  X,
  Store,
  Loader2,
  Package,
  ShieldCheck,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import type { OrderResponse } from '@/types/order.types'

interface CancelOrderModalProps {
  isOpen: boolean
  order: OrderResponse | null
  batchOrders?: OrderResponse[] | null
  isCancelling: boolean
  errorMessage?: string | null
  onClose: () => void
  onConfirm: (reason: string) => void
}

const CANCEL_REASONS = [
  'Tôi muốn thay đổi thông tin nhận hàng (địa chỉ, số điện thoại)',
  'Tôi muốn đổi sản phẩm hoặc thêm nông sản khác',
  'Thời gian giao hàng không phù hợp với tôi',
  'Tìm thấy giá ưu đãi hơn ở nguồn khác',
  'Tôi đổi ý, hiện chưa có nhu cầu mua nữa',
  'Lý do khác',
]

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  order,
  batchOrders,
  isCancelling,
  errorMessage,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0])
  const [customReason, setCustomReason] = useState<string>('')

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(CANCEL_REASONS[0])
      setCustomReason('')
    }
  }, [isOpen])

  // Thoát bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCancelling) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isCancelling, onClose])

  if (!isOpen || (!order && (!batchOrders || batchOrders.length === 0))) {
    return null
  }

  const isBatch = Boolean(batchOrders && batchOrders.length > 0)
  const orderId = order ? order.orderId || order.id : undefined
  const totalAmount = isBatch
    ? (batchOrders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    : order?.totalAmount || 0

  const isPaid = order
    ? order.status === 'PAID' || (order.paymentMethod && order.paymentMethod.toUpperCase() !== 'COD')
    : false

  const handleConfirmClick = () => {
    const reasonToSubmit =
      selectedReason === 'Lý do khác' && customReason.trim()
        ? `Lý do khác: ${customReason.trim()}`
        : selectedReason
    onConfirm(reasonToSubmit)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-modal-title"
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCancelling) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-stone-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp relative">
        {/* Nút đóng (X) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isCancelling}
          aria-label="Đóng hộp thoại"
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-50 z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-stone-100 flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle size={24} />
          </div>
          <div className="pr-6">
            <h3
              id="cancel-order-modal-title"
              className="text-base sm:text-lg font-black text-[#1c2216]"
            >
              {isBatch
                ? `Hủy toàn bộ ${batchOrders?.length} đơn hàng trong Checkout?`
                : `Xác nhận hủy đơn hàng #${orderId}?`}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {isBatch
                ? 'Đợt mua hàng này sẽ dừng xử lý cho tất cả các nhà vườn liên quan.'
                : `Đơn đặt tại ${order?.shopName || 'cửa hàng nông trại'} sẽ được hủy bỏ.`}
            </p>
          </div>
        </div>

        {/* Nội dung scrollable */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Chi tiết đơn hàng tóm tắt (Preview Card) */}
          {order && !isBatch && (
            <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e3ebdc] space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#e8f0e1]">
                <div className="flex items-center gap-1.5 font-bold text-[#2e3726]">
                  <Store size={15} className="text-[#326318]" />
                  <span>{order.shopName || 'Nhà vườn'}</span>
                </div>
                <span className="font-mono text-stone-500 font-semibold">
                  Mã #{orderId}
                </span>
              </div>

              {/* Danh sách nông sản preview (tối đa 3 items) */}
              <div className="space-y-2">
                {order.items && order.items.length > 0 ? (
                  order.items.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img
                        src={it.imageUrl || '/images/default-produce.png'}
                        alt={it.productName || 'Nông sản'}
                        className="w-11 h-11 rounded-lg object-cover border border-[#d6e0cc] shrink-0 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1c2216] truncate">
                          {it.productName || it.mysteryBoxType || 'Sản phẩm nông sản'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Số lượng: <strong className="text-stone-700">{it.quantity}</strong>
                        </p>
                      </div>
                      <div className="text-right text-xs font-bold text-[#326318]">
                        {Number(it.unitPrice || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-400 italic">
                    Chi tiết sản phẩm nông sản...
                  </div>
                )}

                {order.items && order.items.length > 3 && (
                  <p className="text-[11px] text-stone-500 italic pt-1">
                    + Thêm {order.items.length - 3} sản phẩm khác trong đơn...
                  </p>
                )}
              </div>

              {/* Footer tóm tắt tiền */}
              <div className="flex items-center justify-between pt-2 border-t border-[#e8f0e1] text-xs">
                <span className="text-stone-500 font-medium">
                  Phương thức: <strong className="text-stone-800">{order.paymentMethod || 'COD'}</strong>
                </span>
                <span className="text-sm font-black text-[#1c2216]">
                  Tổng tiền: <span className="text-rose-600">{totalAmount.toLocaleString('vi-VN')} đ</span>
                </span>
              </div>
            </div>
          )}

          {/* Trường hợp hủy Batch Checkout */}
          {isBatch && batchOrders && (
            <div className="p-3.5 rounded-2xl bg-violet-50/60 border border-violet-200/80 space-y-2 text-xs">
              <div className="font-bold text-violet-900">
                Bao gồm {batchOrders.length} đơn hàng từ các nhà vườn:
              </div>
              <ul className="space-y-1 text-stone-700 list-disc list-inside pl-1">
                {batchOrders.map((bo, idx) => (
                  <li key={idx} className="truncate">
                    <strong>#{bo.orderId || bo.id}</strong> — {bo.shopName || 'Cửa hàng'} (
                    {Number(bo.totalAmount || 0).toLocaleString('vi-VN')} đ)
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-violet-200 flex justify-between font-bold text-violet-950">
                <span>Tổng giá trị đợt checkout:</span>
                <span className="text-sm text-rose-600">{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          )}

          {/* Chọn lý do hủy đơn */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="cancel-reason-select"
              className="text-xs font-bold text-[#343b2e] flex items-center justify-between"
            >
              <span>Vui lòng chọn lý do hủy đơn:</span>
              <span className="text-[10px] text-stone-400 font-normal">Bắt buộc</span>
            </label>
            <select
              id="cancel-reason-select"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isCancelling}
              className="w-full p-2.5 bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
            >
              {CANCEL_REASONS.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {selectedReason === 'Lý do khác' && (
              <div className="pt-1.5 animate-fadeIn">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do hủy chi tiết của bạn..."
                  rows={2}
                  disabled={isCancelling}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            )}
          </div>

          {/* Lưu ý chính sách bảo đảm người mua */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-900">
              {isPaid
                ? 'Đơn hàng này đã thanh toán. Số tiền sẽ được hoàn trả đầy đủ theo quy định hoàn tiền của CapNong và ngân hàng liên kết.'
                : 'Đơn hàng chưa giao cho shipper. Bạn có thể yên tâm hủy đơn ngay mà không mất bất kỳ khoản phí nào.'}
            </p>
          </div>
        </div>

        {/* Nút hành động ở chân modal */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-[#fafcf9] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-white hover:border-stone-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Giữ lại đơn hàng
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isCancelling}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isCancelling ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Xác nhận hủy đơn</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
