/** Đọc/ghi localStorage an toàn: trình duyệt chặn storage thì phiên vẫn chạy trong bộ nhớ. */
export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeRaw(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* bỏ qua */
  }
}

export function readJson(key: string): unknown {
  const raw = readRaw(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
