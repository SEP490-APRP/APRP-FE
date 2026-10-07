/**
 * Thay cho mẫu `catch (err: any) { err?.data?.message }` lặp lại ở các trang admin.
 * Nhận `unknown` và tự thu hẹp kiểu, nên không cần `any`.
 * Chỉ lấy message từ body API (err.data.message), giống hành vi cũ; lỗi kỹ thuật
 * như "Failed to fetch" không hiện cho người dùng mà dùng câu fallback tiếng Việt.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.',
): string {
  if (isRecord(error) && isRecord(error.data)) {
    const { message } = error.data
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}
