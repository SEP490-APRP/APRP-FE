import React from 'react'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { OrderStatus } from '@/types/order.types'

interface OrderStatusBadgeProps {
  status: OrderStatus
  paymentMethod?: string
  className?: string
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  paymentMethod,
  className = '',
}) => {
  const isCod = (paymentMethod || '').toUpperCase() === 'COD'

  if (status === 'PAID') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-emerald-600" />
        Đã thanh toán
      </span>
    )
  }

  if (status === 'PENDING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
      >
        <Clock size={13} className="text-amber-600" />
        {isCod ? 'Chờ xác nhận (COD)' : 'Chờ thanh toán'}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 ${className}`}
    >
      <AlertCircle size={13} />
      {status}
    </span>
  )
}
