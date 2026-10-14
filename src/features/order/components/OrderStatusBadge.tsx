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

  if (status === 'AWAITING_PAYMENT') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 ${className}`}
      >
        <Clock size={13} className="text-amber-600 animate-pulse" />
        Chờ thanh toán
      </span>
    )
  }

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

  if (status === 'CONFIRMED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-blue-600" />
        Đã xác nhận
      </span>
    )
  }

  if (status === 'READY') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-indigo-600" />
        Sẵn sàng giao
      </span>
    )
  }

  if (status === 'SHIPPING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 ${className}`}
      >
        <Clock size={13} className="text-amber-600 animate-pulse" />
        Tài xế đang đến lấy
      </span>
    )
  }

  if (status === 'PICKED_UP') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
      >
        <Clock size={13} className="text-sky-600 animate-pulse" />
        Đang giao hàng
      </span>
    )
  }

  if (status === 'DELIVERED' || status === 'COMPLETED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-emerald-600" />
        Đã giao hàng
      </span>
    )
  }

  if (status === 'CANCELLED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        <AlertCircle size={13} className="text-rose-600" />
        Đã hủy
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
