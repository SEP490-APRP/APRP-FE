import axios from 'axios'

import { API_BASE_URL, STORAGE_KEYS } from '@/utils/constants'
import { clearAuthData } from '@/utils/helpers'

/**
 * Axios instance with base configuration.
 * - Base URL from environment variable
 * - Auto-attach Authorization header
 * - Handle 401 responses (token expired)
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/* ===== Request Interceptor ===== */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/* ===== Response Interceptor ===== */
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
