/**
 * OrderCard
 * Hiển thị tóm tắt 1 đơn hàng trong danh sách.
 * Nhận prop onSelect để mở modal chi tiết.
 */

import { Package } from 'lucide-react'
import type { OrderResponse } from '../../../types/order.types'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrderCardProps {
  order: OrderResponse
  onSelect: (order: OrderResponse) => void
}

export function OrderCard({ order, onSelect }: OrderCardProps) {
  const needsAction = order.status === 'PENDING' || order.status === 'PAID' || order.status === 'CONFIRMED'

  return (
    <div
      onClick={() => onSelect(order)}
      className={`
        bg-white rounded-2xl border shadow-sm p-5 cursor-pointer
        transition-all hover:shadow-md hover:border-emerald-300
        ${needsAction ? 'border-emerald-200' : 'border-gray-100'}
      `}
    >
      {/* Header: mã đơn + status + thời gian */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-emerald-600">#{order.id}</span>
          <OrderStatusBadge status={order.status} />
          {order.paymentMethod && (
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">
              {order.paymentMethod}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(order.createdAt).toLocaleString('vi-VN')}
        </span>
      </div>

      {/* Khách hàng */}
      <p className="text-sm font-bold text-gray-800 mb-1">{order.recipientName}</p>
      <p className="text-xs text-gray-400 mb-3 truncate">{order.shippingAddress}</p>

      {/* Sản phẩm (tóm tắt) */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Package className="size-3.5 text-gray-400 shrink-0" />
        <span className="text-xs text-gray-500">
          {order.items
            .map((i) => i.productName || i.mysteryBoxType || 'Sản phẩm')
            .slice(0, 3)
            .join(' • ')}
          {order.items.length > 3 && ` +${order.items.length - 3}`}
        </span>
      </div>

      {/* Footer: tổng tiền + gợi ý action */}
      <div className="flex items-center justify-between">
        <span className="text-base font-black text-gray-900">
          {order.totalAmount.toLocaleString('vi-VN')}đ
        </span>
        {needsAction && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            Cần xử lý →
          </span>
        )}
      </div>
    </div>
  )
}
