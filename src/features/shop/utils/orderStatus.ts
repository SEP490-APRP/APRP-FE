import type { OrderStatus } from '@/types/order.types'

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-300' },
  PENDING: { label: 'Chờ xác nhận', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  PAID: { label: 'Đã thanh toán', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONFIRMED: { label: 'Đang chuẩn bị', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  READY: { label: 'Chờ shipper lấy hàng', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  SHIPPING: { label: 'Shipper đang đến lấy', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PICKED_UP: { label: 'Đang giao đến khách', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  DELIVERED: { label: 'Đã giao', className: 'bg-green-50 text-green-700 border-green-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-600 border-red-200' },
  FAILED: { label: 'Giao thất bại', className: 'bg-red-100 text-red-700 border-red-300' },
  REFUND_REQUESTED: { label: 'Đang yêu cầu trả hàng', className: 'bg-amber-50 text-amber-700 border-amber-300' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  // Return lifecycle statuses
  SHOP_APPROVED: { label: 'Shop đã duyệt trả hàng', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ADMIN_APPROVED: { label: 'Admin đã duyệt trả hàng', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  APPROVED: { label: 'Đã chấp thuận', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DISPUTED: { label: 'Đang khiếu nại', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  RETURN_SHIPPING: { label: 'Chờ shipper lấy hàng trả', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  RETURN_PICKED_UP: { label: 'Đang chuyển hàng trả', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  RETURN_DELIVERED: { label: 'Đã trả về shop', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  RETURN_FAILED: { label: 'Trả hàng thất bại', className: 'bg-rose-100 text-rose-700 border-rose-300' },
  REJECTED: { label: 'Từ chối trả hàng', className: 'bg-gray-100 text-gray-700 border-gray-200' },
}

export function getOrderStatusConfig(status?: string): { label: string; className: string } {
  const key = status?.toUpperCase() as OrderStatus | undefined
  if (key && key in ORDER_STATUS_CONFIG) {
    return ORDER_STATUS_CONFIG[key]
  }
  return {
    label: status || 'Không xác định',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  }
}
