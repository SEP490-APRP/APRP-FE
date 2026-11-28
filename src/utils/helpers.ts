/** Ghép className có điều kiện, bỏ qua giá trị falsy. Không cần thêm thư viện. */
export type ClassValue = string | false | null | undefined

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * URL tuyệt đối tới một route của app (dùng để chia sẻ/sao chép link).
 * Dùng browser router với đường dẫn sạch (clean URLs): /cua-hang/101 -> https://capnong.vn/cua-hang/101
 */
export function absoluteUrl(route: string): string {
  const cleanRoute = route.startsWith('/') ? route : `/${route}`
  return `${window.location.origin}${cleanRoute}`
}

/** Định dạng số tiền sang chuẩn tiền tệ Việt Nam (VD: 35.000đ) */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}
