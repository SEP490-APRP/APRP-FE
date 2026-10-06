import { create, type AxiosError } from 'axios'
import type { ApiError, ApiResponse } from '@/types'
import { ENV, STORAGE_KEYS } from '@/utils'

/** Phát ra khi API trả 401; AuthProvider nghe event này để đăng xuất. */
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'

function readToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  } catch {
    return null
  }
}

// Không đặt Content-Type mặc định: axios tự chọn JSON cho object và multipart cho FormData.
export const axiosInstance = create({
  baseURL: ENV.API_URL,
  timeout: 15_000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status ?? 0
    const data = error.response?.data

    if (status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }

    const apiError: ApiError = { status, data, message: data?.message || error.message }
    return Promise.reject(apiError)
  },
)
