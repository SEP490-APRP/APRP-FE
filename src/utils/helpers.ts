/** Ghép className có điều kiện, bỏ qua giá trị falsy. Không cần thêm thư viện. */
export type ClassValue = string | false | null | undefined

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * URL tuyệt đối tới một route của app (dùng để chia sẻ/sao chép link).
 * App dùng hash router nên route nằm sau `#`: /cua-hang/101 -> https://site/#/cua-hang/101
 */
export function absoluteUrl(route: string): string {
  return `${window.location.origin}${window.location.pathname}#${route}`
}
