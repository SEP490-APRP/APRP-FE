import React from 'react'
import { AlertTriangle, XCircle, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { OrderCancelDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface OrderCancelCardProps {
  orderCancel: OrderCancelDto
}

export const OrderCancelCard: React.FC<OrderCancelCardProps> = ({ orderCancel }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const getTabForStatus = (status?: string): string => {
    switch (status?.toUpperCase()) {
      case 'AWAITING_PAYMENT':
        return 'AWAITING_PAYMENT'
      case 'PENDING':
      case 'PAID':
        return 'PENDING'
      case 'CONFIRMED':
      case 'READY':
      case 'SHIPPING':
      case 'PICKED_UP':
        return 'SHIPPING'
      case 'COMPLETED':
      case 'DELIVERED':
        return 'COMPLETED'
      case 'CANCELLED':
      case 'FAILED':
        return 'CANCELLED'
      default:
        return 'ALL'
    }
  }

  const handleOpenOrder = () => {
    toggleOpen()
    const targetTab = getTabForStatus(orderCancel.orderStatus)
    const actionQuery = orderCancel.canCancel ? '&action=cancel' : ''
    navigate(`/orders?tab=${targetTab}&orderId=${orderCancel.orderId}${actionQuery}`)
  }

  const formatPrice = (val?: number) => {
    if (!val) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
  }

  return (
    <div
      className={`mt-3 p-3.5 rounded-xl border shadow-sm space-y-2.5 ${
        orderCancel.canCancel
          ? 'bg-rose-50/80 border-rose-200 text-rose-950'
          : 'bg-[#fcf9f1] border-[#e5e2da] text-[#1c1c17]'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-bold">
        {orderCancel.canCancel ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-[#8a4e1d] flex-shrink-0" />
        )}
        <span className={orderCancel.canCancel ? 'text-rose-950 font-bold' : 'text-[#1c1c17] font-bold'}>
          Đơn hàng #{orderCancel.orderId} - Trạng thái: {orderCancel.orderStatus}
        </span>
      </div>

      <p className="text-xs leading-relaxed">
        {orderCancel.message}
      </p>

      {orderCancel.refundAmount && orderCancel.refundAmount > 0 && orderCancel.canCancel && (
        <div className="text-[11px] bg-white p-2.5 rounded-lg border border-rose-200 flex items-center justify-between shadow-2xs">
          <span className="text-[#5f6b57]">Số tiền sẽ hoàn vào ví:</span>
          <span className="font-bold text-rose-700">{formatPrice(orderCancel.refundAmount)}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpenOrder}
        className={`w-full py-2.5 px-3 rounded-xl active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
          orderCancel.canCancel
            ? 'bg-rose-600 hover:bg-rose-700'
            : 'bg-[#326318] hover:bg-[#254b12]'
        }`}
      >
        <span>
          {orderCancel.canCancel
            ? `Mở chi tiết đơn hàng #${orderCancel.orderId} để hủy`
            : `Mở chi tiết đơn hàng #${orderCancel.orderId}`}
        </span>
        <ExternalLink className="w-3.5 h-3.5 text-white/90" />
      </button>
    </div>
  )
}

export default OrderCancelCard

