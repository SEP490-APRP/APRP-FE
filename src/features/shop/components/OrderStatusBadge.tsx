/**
 * OrderStatusBadge
 * Hiển thị label + màu tương ứng với từng trạng thái đơn hàng.
 * Tách riêng để dùng lại ở nhiều nơi.
 */

import type { OrderStatus } from '../../../types/order.types'
import { getOrderStatusConfig } from '../utils/orderStatus'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = getOrderStatusConfig(status)

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-lg border text-[11px] font-black uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  )
}
