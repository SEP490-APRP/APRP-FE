import React from 'react'
import { Clock, CheckCircle2, AlertCircle, RotateCcw, XCircle, Truck, ShieldCheck } from 'lucide-react'
import type { OrderStatus } from '@/types/order.types'

interface OrderStatusBadgeProps {
  status: OrderStatus | string
  paymentMethod?: string
  className?: string
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  paymentMethod,
  className = '',
}) => {
  const isCod = (paymentMethod || '').toUpperCase() === 'COD'
  const isWallet = (paymentMethod || '').toUpperCase() === 'WALLET'
  const normalizedStatus = (status || '').toUpperCase()

  if (normalizedStatus === 'AWAITING_PAYMENT') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 ${className}`}
      >
        <Clock size={13} className="text-amber-600 animate-pulse" />
        Chờ thanh toán
      </span>
    )
  }

  if (normalizedStatus === 'PAID') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-emerald-600" />
        {isWallet ? 'Đã thanh toán bằng ví' : 'Đã thanh toán'}
      </span>
    )
  }

  if (normalizedStatus === 'PENDING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
      >
        <Clock size={13} className="text-amber-600" />
        {isCod ? 'Chờ xác nhận (COD)' : 'Chờ thanh toán'}
      </span>
    )
  }

  if (normalizedStatus === 'CONFIRMED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-blue-600" />
        Đã xác nhận
      </span>
    )
  }

  if (normalizedStatus === 'READY') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-indigo-600" />
        Sẵn sàng giao
      </span>
    )
  }

  if (normalizedStatus === 'SHIPPING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 ${className}`}
      >
        <Clock size={13} className="text-amber-600 animate-pulse" />
        Tài xế đang đến lấy
      </span>
    )
  }

  if (normalizedStatus === 'PICKED_UP') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
      >
        <Clock size={13} className="text-sky-600 animate-pulse" />
        Đang giao hàng
      </span>
    )
  }

  if (normalizedStatus === 'DELIVERED' || normalizedStatus === 'COMPLETED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-emerald-600" />
        {normalizedStatus === 'COMPLETED' ? 'Hoàn thành' : 'Đã giao hàng'}
      </span>
    )
  }

  if (normalizedStatus === 'CANCELLED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        <AlertCircle size={13} className="text-rose-600" />
        Đã hủy
      </span>
    )
  }

  if (normalizedStatus === 'FAILED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        <AlertCircle size={13} className="text-rose-600" />
        Giao thất bại
      </span>
    )
  }

  if (normalizedStatus === 'RETURNING_TO_SHOP') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 ${className}`}
      >
        <RotateCcw size={13} className="text-orange-600" />
        Đang hoàn về Shop
      </span>
    )
  }

  if (normalizedStatus === 'RETURNED_TO_SHOP') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
      >
        <Clock size={13} className="text-purple-600" />
        Chờ Shop xác nhận hoàn
      </span>
    )
  }

  if (normalizedStatus === 'REFUND_REQUESTED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 ${className}`}
      >
        <RotateCcw size={13} className="text-amber-600 animate-spin" />
        Đang yêu cầu trả hàng
      </span>
    )
  }

  if (normalizedStatus === 'REFUNDED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 ${className}`}
      >
        <CheckCircle2 size={13} className="text-emerald-600" />
        Đã hoàn tiền
      </span>
    )
  }

  if (normalizedStatus === 'SHOP_APPROVED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-blue-600" />
        Shop đã duyệt trả hàng
      </span>
    )
  }

  if (normalizedStatus === 'ADMIN_APPROVED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
      >
        <ShieldCheck size={13} className="text-indigo-600" />
        Admin đã duyệt trả hàng
      </span>
    )
  }

  if (normalizedStatus === 'APPROVED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-emerald-600" />
        Đã chấp thuận
      </span>
    )
  }

  if (normalizedStatus === 'DISPUTED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        <AlertCircle size={13} className="text-rose-600" />
        Đang khiếu nại
      </span>
    )
  }

  if (normalizedStatus === 'RETURN_SHIPPING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
      >
        <Truck size={13} className="text-sky-600" />
        Chờ lấy hàng trả
      </span>
    )
  }

  if (normalizedStatus === 'RETURN_PICKED_UP') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
      >
        <Truck size={13} className="text-purple-600" />
        Đang chuyển về shop
      </span>
    )
  }

  if (normalizedStatus === 'RETURN_DELIVERED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 ${className}`}
      >
        <CheckCircle2 size={13} className="text-teal-600" />
        Đã trả về shop
      </span>
    )
  }

  if (normalizedStatus === 'RETURN_FAILED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
      >
        <XCircle size={13} className="text-rose-600" />
        Trả hàng thất bại
      </span>
    )
  }

  if (normalizedStatus === 'REJECTED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 ${className}`}
      >
        <XCircle size={13} className="text-gray-500" />
        Từ chối trả hàng
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 ${className}`}
    >
      <AlertCircle size={13} />
      {status || 'Không xác định'}
    </span>
  )
}
