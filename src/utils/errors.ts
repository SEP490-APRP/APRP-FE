/**
 * Thay cho mẫu `catch (err: any) { err?.data?.message }` lặp lại ở các trang admin.
 * Nhận `unknown` và tự thu hẹp kiểu, nên không cần `any`.
 * Tự động ánh xạ ErrorCode Backend (chuẩn tiếng Anh) sang thông điệp tiếng Việt thân thiện với người dùng.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Bảng ánh xạ mã lỗi nghiệp vụ Backend (ErrorCode) sang thông điệp tiếng Việt thân thiện
 */
const BACKEND_ERROR_CODE_MAP: Record<number, string> = {
  // Sản phẩm (Series 3000)
  3001: 'Không tìm thấy thông tin sản phẩm',
  3002: 'Vui lòng nhập tên nông sản',
  3003: 'Tên nông sản không được vượt quá 255 ký tự',
  3004: 'Vui lòng nhập giá bán',
  3005: 'Giá bán phải lớn hơn hoặc bằng 0',
  3006: 'Vui lòng nhập số lượng tồn kho',
  3007: 'Số lượng tồn kho phải lớn hơn hoặc bằng 0',
  3008: 'Vui lòng chọn hạn sử dụng',
  3009: 'Hạn sử dụng không được ở trong quá khứ',
  3010: 'Vui lòng chọn danh mục nông sản',
  3011: 'Vui lòng chọn đơn vị tính',
  3012: 'Bạn không có quyền chỉnh sửa sản phẩm này',
  3013: 'Tài khoản chưa đăng ký quyền gian hàng',
  3014: 'Phần trăm giảm giá phải từ 0 đến 100',
  3015: 'Không tìm thấy hình ảnh sản phẩm',
  3016: 'Đường dẫn ảnh là bắt buộc',
  3017: 'Đường dẫn ảnh quá dài',
  3018: 'Ảnh không thuộc về sản phẩm này',
  3019: 'Sản phẩm không ở trạng thái chờ duyệt',
  3020: 'Vui lòng cung cấp lý do từ chối',
  3021: 'Gian hàng không thể tự kích hoạt sản phẩm; yêu cầu Admin phê duyệt',
  3022: 'Ảnh không phải nông sản thực tế hoặc không phù hợp quy định kiểm duyệt AI',
  3023: 'Lỗi trong quá trình thẩm định hình ảnh bằng AI',
  3024: 'Mỗi sản phẩm chỉ được tải lên tối đa 8 hình ảnh',
  3025: 'Nội dung hoặc tên sản phẩm chứa từ khóa không phù hợp',
  3026: 'Hệ thống AI đang bận. Vui lòng thử lại sau giây lát',
  3027: 'Trạng thái sản phẩm không hợp lệ',

  // Tải tệp & hình ảnh (Series 4000)
  4001: 'Tệp hình ảnh không hợp lệ',
  4002: 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB)',
  4003: 'Tải tệp lên máy chủ lưu trữ thất bại',
}

/**
 * Bản dịch các câu thông báo tiếng Anh từ Backend sang tiếng Việt
 */
const ENGLISH_MESSAGE_TRANSLATIONS: Record<string, string> = {
  'product image is not agricultural produce or is inappropriate':
    'Ảnh không phải nông sản thực tế hoặc không phù hợp quy định kiểm duyệt AI',
  'each product can have a maximum of 8 images':
    'Mỗi sản phẩm chỉ được tải lên tối đa 8 hình ảnh',
  'file size exceeds limit':
    'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB)',
  'an error occurred during image moderation':
    'Lỗi trong quá trình thẩm định hình ảnh bằng AI',
  'user is not registered as a shop/farmer':
    'Tài khoản của bạn chưa đăng ký quyền gian hàng',
  'shop cannot activate product directly; requires admin approval':
    'Gian hàng không thể tự kích hoạt sản phẩm; yêu cầu Admin phê duyệt',
  'product not found':
    'Không tìm thấy sản phẩm',
  'expiry date must not be in the past':
    'Hạn sử dụng không được ở trong quá khứ',
  'rejection reason is required':
    'Vui lòng nhập lý do từ chối',
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.',
): string {
  if (isRecord(error)) {
    // 1. Ưu tiên mã lỗi nghiệp vụ code
    const code =
      (isRecord(error.data) && typeof error.data.code === 'number' ? error.data.code : undefined) ??
      (isRecord(error.response) &&
      isRecord(error.response.data) &&
      typeof error.response.data.code === 'number'
        ? (error.response.data.code as number)
        : undefined)

    if (code && BACKEND_ERROR_CODE_MAP[code]) {
      return BACKEND_ERROR_CODE_MAP[code]
    }

    // 2. Kiểm tra message từ API response
    let rawMsg: string | undefined
    if (isRecord(error.data) && typeof error.data.message === 'string' && error.data.message.trim()) {
      rawMsg = error.data.message.trim()
    } else if (
      isRecord(error.response) &&
      isRecord(error.response.data) &&
      typeof error.response.data.message === 'string' &&
      error.response.data.message.trim()
    ) {
      rawMsg = error.response.data.message.trim()
    } else if (typeof error.message === 'string' && error.message.trim()) {
      rawMsg = error.message.trim()
    }

    if (rawMsg) {
      const lower = rawMsg.toLowerCase()
      for (const [enKey, viVal] of Object.entries(ENGLISH_MESSAGE_TRANSLATIONS)) {
        if (lower.includes(enKey)) {
          return viVal
        }
      }

      if (rawMsg.includes('Failed to fetch') || rawMsg.includes('Network Error')) {
        return fallback
      }
      return rawMsg
    }
  }
  return fallback
}
