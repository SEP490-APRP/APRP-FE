import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Store, CreditCard, XCircle, Loader2 } from 'lucide-react'
import type { OrderResponse } from '@/types/order.types'

interface BatchCheckoutGroupCardProps {
  batchId: number
  orders: OrderResponse[]
  onResumePayment: (batchId: number, triggerOrderId: number) => void
  onCancelBatch: (orders: OrderResponse[]) => void
  onCancelSingleOrder: (orderId: number) => void
  isResuming?: boolean
  isCancelling?: boolean
}

export const BatchCheckoutGroupCard: React.FC<BatchCheckoutGroupCardProps> = ({
  batchId,
  orders,
  onResumePayment,
  onCancelBatch,
  onCancelSingleOrder,
  isResuming,
  isCancelling,
}) => {
  const shopCount = new Set(orders.map((o) => o.shopId || o.shopName)).size || orders.length
  const checkoutTotal = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const triggerOrderId = orders[0]?.orderId || orders[0]?.id || 0

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      const hours = String(d.getHours()).padStart(2, '0')
      const mins = String(d.getMinutes()).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${hours}:${mins} ${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const createdAtFormatted = formatDateTime(orders[0]?.createdAt)

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-200/90 shadow-xs overflow-hidden hover:shadow-md transition-all">
      {/* Top Header Card (Amber) */}
      <div className="px-6 py-4.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-950">
              Checkout #{batchId} · {shopCount} shop
            </h3>
            <p className="text-xs text-amber-800/80 font-medium mt-0.5">
              Chờ thanh toán · {createdAtFormatted}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            TỔNG PAYOS
          </p>
          <p className="text-2xl font-extrabold text-amber-800">
            {checkoutTotal.toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-4">
        {/* Orders list */}
        <div className="space-y-3">
          {orders.map((order) => {
            const orderId = order.orderId || order.id || 0
            const itemCount = order.items?.length || 1
            const shopName = order.shopName || `Shop #${order.shopId || orderId}`

            return (
              <div
                key={orderId}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                    <Store size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      Đơn #{orderId} — {shopName}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {itemCount} sản phẩm
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-bold text-emerald-700">
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Phần PayOS</p>
                  <div className="flex items-center justify-end gap-2.5 pt-0.5">
                    <Link
                      to={`/my-orders/${orderId}`}
                      className="text-[11px] font-bold text-gray-400 hover:text-emerald-700 transition-colors uppercase tracking-wider"
                    >
                      CHI TIẾT
                    </Link>
                    <button
                      type="button"
                      onClick={() => onCancelSingleOrder(orderId)}
                      disabled={isCancelling}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider disabled:opacity-50"
                    >
                      HỦY ĐƠN
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Subtotal */}
        <div className="flex justify-between items-center text-xs font-semibold text-gray-600 px-1 pt-1">
          <span>Cộng {orders.length} đơn (phần payos)</span>
          <span className="text-gray-900 font-bold">
            {checkoutTotal.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onCancelBatch(orders)}
            disabled={isCancelling}
            className="px-5 py-2.5 bg-red-50 hover:bg-red-100/90 text-red-600 border border-red-100 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-60 cursor-pointer"
          >
            {isCancelling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            <span>HỦY TOÀN BỘ CHECKOUT</span>
          </button>

          <button
            type="button"
            onClick={() => onResumePayment(batchId, triggerOrderId)}
            disabled={isResuming}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isResuming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CreditCard size={14} />
            )}
            <span>TIẾP TỤC THANH TOÁN</span>
          </button>
        </div>
      </div>
    </div>
  )
}
