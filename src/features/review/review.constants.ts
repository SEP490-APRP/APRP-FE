export type FilterType = 'ALL' | 'UNREPLIED' | 'HAS_IMAGE' | 'NEEDS_CARE' | number
export type SortType = 'NEWEST' | 'OLDEST' | 'RATING_DESC' | 'RATING_ASC'

/** Mẫu câu phản hồi nhanh dành cho Nhà Vườn */
export const QUICK_REPLY_TEMPLATES = [
  {
    label: 'Cảm ơn khách hàng',
    text: 'Dạ Nhà Vườn xin chân thành cảm ơn quý khách đã tin dùng và ủng hộ nông sản quê hương. Chúc quý khách và gia đình luôn dồi dào sức khỏe và ngon miệng ạ!',
  },
  {
    label: 'Hỗ trợ vận chuyển / Đổi trả',
    text: 'Dạ Nhà Vườn rất tiếc vì sự bất tiện này do quá trình vận chuyển. Shop đã nhắn tin trực tiếp để gửi bù nông sản tươi mới ngay cho bạn ạ. Rất mong bạn thông cảm!',
  },
  {
    label: 'Cam kết chất lượng mùa vụ',
    text: 'Dạ cảm ơn góp ý quý báu của quý khách. Nhà Vườn sẽ kiểm tra và tuyển chọn kỹ hơn từng trái cây/nông sản ở các đợt thu hoạch tới để phục vụ bạn tốt nhất ạ!',
  },
]

/** Định dạng trạng thái đơn hàng sang tiếng Việt */
export function formatOrderStatus(status?: string): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ xác nhận'
    case 'PAID':
      return 'Đã thanh toán (Chờ xác nhận)'
    case 'CONFIRMED':
      return 'Đang chuẩn bị hàng'
    case 'READY':
      return 'Sẵn sàng giao'
    case 'SHIPPING':
      return 'Đang giao hàng'
    case 'PICKED_UP':
      return 'Shipper đang giao'
    case 'DELIVERED':
      return 'Giao thành công'
    case 'COMPLETED':
      return 'Hoàn thành'
    case 'CANCELLED':
      return 'Đã hủy'
    case 'FAILED':
      return 'Giao thất bại'
    default:
      return status || 'Hoàn tất'
  }
}
