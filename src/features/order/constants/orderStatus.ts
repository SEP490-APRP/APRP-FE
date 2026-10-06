export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  AWAITING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  PACK: 'Đang đóng gói',
  READY: 'Sẵn sàng giao',
  SHIPPING_TO_WAREHOUSE: 'Đang giao tới kho',
  ARRIVED_AT_WAREHOUSE: 'Đã tới kho',
  QUALITY_CHECKING: 'Đang kiểm định',
  QUALITY_APPROVED: 'Đạt chất lượng',
  QUALITY_CHECKED: 'Đã kiểm tra',
  QUALITY_REJECTED: 'Không đạt chất lượng',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn thành',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
}

export function getOrderStatusLabel(status?: string | null): string {
  if (!status) return 'Không xác định'
  return ORDER_STATUS_LABELS[status] || status.replace(/_/g, ' ')
}

export function getOrderStatusBadgeClass(status?: string | null): string {
  switch (status) {
    case 'COMPLETED':
    case 'PAID':
    case 'DELIVERED':
    case 'QUALITY_APPROVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'SHIPPING':
    case 'SHIPPING_TO_WAREHOUSE':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'PENDING':
    case 'AWAITING_CONFIRMATION':
    case 'PREPARING':
    case 'QUALITY_CHECKING':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'CANCELLED':
    case 'FAILED':
    case 'QUALITY_REJECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}
