/** Nơi DUY NHẤT đọc import.meta.env. Code khác import ENV thay vì đọc env trực tiếp. */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const ENV = {
  API_URL,
  /** Gốc server (không có /api), dùng cho file tĩnh như ảnh KYC. */
  API_ORIGIN: new URL(API_URL).origin,
  /** Mặc định bật mock; chỉ tắt khi đặt rõ VITE_USE_MOCK=false. */
  USE_MOCK: import.meta.env.VITE_USE_MOCK !== 'false',
} as const
