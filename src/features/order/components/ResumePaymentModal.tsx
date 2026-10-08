import React, { useState } from 'react'
import { X, CreditCard, Loader2 } from 'lucide-react'
import type { ResumePaymentOptionsResponse, PaymentResponse } from '@/types/payment.types'
import { paymentService } from '@/services'

interface ResumePaymentModalProps {
  isOpen: boolean
  options: ResumePaymentOptionsResponse | null
  onClose: () => void
  onSelectPayment: (paymentRes: PaymentResponse) => void
}

export const ResumePaymentModal: React.FC<ResumePaymentModalProps> = ({
  isOpen,
  options,
  onClose,
  onSelectPayment,
}) => {
  const [loadingAll, setLoadingAll] = useState(false)
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen || !options) return null

  const unpaidOrders = options.unpaidOrders || []
  const unpaidCount = unpaidOrders.length
  const shopCount = unpaidCount
  const payAllAmount = options.payAllOption?.amount ?? options.totalAmount ?? 0
  const isBusy = loadingAll || loadingOrderId !== null

  // Thanh toán toàn bộ các đơn còn lại trong batch
  const handlePayAll = async () => {
    if (!options.batchId) return
    setLoadingAll(true)
    setErrorMessage(null)
    try {
      const res = await paymentService.createPayosPayment({
        batchId: options.batchId,
        returnUrl: `${window.location.origin}/payment/result`,
        cancelUrl: `${window.location.origin}/payment/result`,
      })
      if (res && (res.checkoutUrl || res.qrCodeUrl)) {
        onSelectPayment(res)
      } else {
        setErrorMessage('Không thể tạo cổng thanh toán. Vui lòng thử lại.')
      }
    } catch (err: any) {
      console.error('Lỗi thanh toán toàn bộ batch:', err)
      setErrorMessage(err?.message || 'Có lỗi khi tạo cổng thanh toán PayOS.')
    } finally {
      setLoadingAll(false)
    }
  }

  // Thanh toán cho 1 đơn cụ thể
  const handlePaySingle = async (orderId: number) => {
    setLoadingOrderId(orderId)
    setErrorMessage(null)
    try {
      const res = await paymentService.createPayosPayment({
        orderId: orderId,
        returnUrl: `${window.location.origin}/payment/result`,
        cancelUrl: `${window.location.origin}/payment/result`,
      })
      if (res && (res.checkoutUrl || res.qrCodeUrl)) {
        onSelectPayment(res)
      } else {
        setErrorMessage('Không thể tạo mã thanh toán cho đơn hàng. Vui lòng thử lại.')
      }
    } catch (err: any) {
      console.error('Lỗi thanh toán đơn lẻ:', err)
      setErrorMessage(err?.message || 'Có lỗi khi tạo mã thanh toán PayOS.')
    } finally {
      setLoadingOrderId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Thanh toán checkout</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Checkout #{options.batchId} · {shopCount} shop · {unpaidCount} đơn chờ thanh toán
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs text-gray-600 font-medium">
            Bạn có thể thanh toán từng đơn hoặc thanh toán tất cả cùng lúc.
          </div>

          {/* Danh sách từng đơn shop */}
          <div className="space-y-3">
            {unpaidOrders.map((order) => (
              <div
                key={order.orderId}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    Đơn #{order.orderId}
                    {order.shopName ? ` — ${order.shopName}` : ''}
                  </p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">
                    {order.amount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePaySingle(order.orderId)}
                  disabled={isBusy}
                  className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {loadingOrderId === order.orderId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CreditCard size={14} />
                  )}
                  <span>Trả đơn này</span>
                </button>
              </div>
            ))}
          </div>

          {/* Option Thanh toán tất cả (Card vàng nổi bật) */}
          {unpaidCount > 1 && (
            <button
              type="button"
              onClick={handlePayAll}
              disabled={isBusy}
              className="w-full p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/80 hover:bg-amber-100/90 transition-all text-left flex items-center gap-4 cursor-pointer disabled:opacity-60 shadow-xs"
            >
              <div className="size-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white">
                {loadingAll ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <CreditCard size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900">
                  Thanh toán tất cả ({unpaidCount} đơn)
                </p>
                <p className="text-lg font-bold text-amber-700 mt-0.5">
                  {payAllAmount.toLocaleString('vi-VN')}đ
                </p>
              </div>
            </button>
          )}

          {errorMessage && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
