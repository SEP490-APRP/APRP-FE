/**
 * OrderStatusBadge
 * Hiển thị label + màu tương ứng với từng trạng thái đơn hàng.
 * Tách riêng để dùng lại ở nhiều nơi.
 */

import type { OrderStatus } from '../../../types/order.types'

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  AWAITING_PAYMENT: { label: 'Chờ thanh toán',    className: 'bg-amber-50 text-amber-700 border-amber-300' },
  PENDING:   { label: 'Chờ xác nhận',       className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  PAID:      { label: 'Đã thanh toán QR',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONFIRMED: { label: 'Đang chuẩn bị',       className: 'bg-purple-50 text-purple-700 border-purple-200' },
  READY:     { label: 'Chờ shipper lấy hàng', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  SHIPPING:  { label: 'Shipper đang đến lấy', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PICKED_UP: { label: 'Đang giao đến khách',  className: 'bg-sky-50 text-sky-700 border-sky-200' },
  DELIVERED: { label: 'Đã giao',              className: 'bg-green-50 text-green-700 border-green-200' },
  COMPLETED: { label: 'Hoàn thành',          className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy',               className: 'bg-red-50 text-red-600 border-red-200' },
  FAILED:    { label: 'Giao thất bại',        className: 'bg-red-100 text-red-700 border-red-300' },
}

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-lg border text-[11px] font-black uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  )
}
