/** Nơi DUY NHẤT đọc import.meta.env. Code khác import ENV thay vì đọc env trực tiếp. */
const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080/api'

export const ENV = {
  API_URL,
  /** Gốc server (không có /api), dùng cho file tĩnh như ảnh KYC. */
  API_ORIGIN: new URL(API_URL).origin,
  /** Mặc định dùng API thật; chỉ bật mock khi đặt rõ VITE_USE_MOCK=true. */
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
} as const
