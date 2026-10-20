import { create } from 'zustand'
import { devtools, persist, type PersistStorage } from 'zustand/middleware'
import type { AuthUser, SessionUser, UserRole } from '@/types'
import { AUTH_UNAUTHORIZED_EVENT } from '@/services/api'
import { STORAGE_KEYS } from '@/utils'
import { isTokenValid } from '@/utils/jwt'
import { readJson, readRaw, writeRaw } from './storage'
import { useChatStore } from './useChatStore'

const ROLES: readonly UserRole[] = ['buyer', 'shop', 'shipper', 'admin']

type LoginUser = AuthUser & { id?: string | number }

type AuthState = {
  user: SessionUser | null
  token: string | null
  /** token tùy chọn: các luồng đăng nhập demo hiện chưa có token thật từ backend. */
  login: (user: LoginUser, token?: string) => void
  setUser: (user: SessionUser | null) => void
  logout: () => void
}

type PersistedAuth = Pick<AuthState, 'user' | 'token'>

function isLoginUser(value: unknown): value is LoginUser {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    (v.id === undefined || typeof v.id === 'string' || typeof v.id === 'number') &&
    typeof v.name === 'string' &&
    typeof v.email === 'string' &&
    typeof v.role === 'string' &&
    (ROLES as readonly string[]).includes(v.role)
  )
}

/** Xóa sạch toàn bộ storage auth khi hết phiên hoặc đăng xuất */
export function clearAuthStorage(): void {
  writeRaw(STORAGE_KEYS.USER, null)
  writeRaw(STORAGE_KEYS.TOKEN, null)
  writeRaw(STORAGE_KEYS.ACCESS_TOKEN, null)
  writeRaw(STORAGE_KEYS.REFRESH_TOKEN, null)
}

/**
 * Đọc user đã lưu; chỉ trả về khi CẢ token hợp lệ (chưa hết hạn) lẫn user tồn tại.
 * Tránh lỗi hiển thị thông tin người dùng khi chưa đăng nhập hoặc phiên đã kết thúc.
 */
export function readStoredUser(): SessionUser | null {
  const token = readRaw(STORAGE_KEYS.TOKEN) || readRaw(STORAGE_KEYS.ACCESS_TOKEN)
  if (!isTokenValid(token)) {
    clearAuthStorage()
    return null
  }
  const saved = readJson(STORAGE_KEYS.USER)
  if (!isLoginUser(saved)) {
    clearAuthStorage()
    return null
  }
  return { ...saved, id: String(saved.id ?? 'local') }
}

/**
 * Đồng bộ lưu trữ phiên: chỉ lưu khi cả user và token đều hợp lệ.
 */
const legacyAuthStorage: PersistStorage<PersistedAuth> = {
  getItem: () => {
    const token = readRaw(STORAGE_KEYS.TOKEN) || readRaw(STORAGE_KEYS.ACCESS_TOKEN)
    if (!isTokenValid(token)) {
      clearAuthStorage()
      return {
        state: { user: null, token: null },
        version: 0,
      }
    }
    const user = readStoredUser()
    if (!user) {
      clearAuthStorage()
      return {
        state: { user: null, token: null },
        version: 0,
      }
    }
    return {
      state: { user, token },
      version: 0,
    }
  },
  setItem: (_name, { state }) => {
    if (!state.user || !state.token || !isTokenValid(state.token)) {
      clearAuthStorage()
    } else {
      writeRaw(STORAGE_KEYS.USER, JSON.stringify(state.user))
      writeRaw(STORAGE_KEYS.TOKEN, state.token)
      writeRaw(STORAGE_KEYS.ACCESS_TOKEN, state.token)
    }
  },
  removeItem: () => {
    clearAuthStorage()
  },
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        login: (next, nextToken) => {
          const token = nextToken ?? null
          const user = { ...next, id: next.id != null ? String(next.id) : crypto.randomUUID() }
          set({ user, token }, false, 'auth/login')
        },
        logout: () => {
          try {
            useChatStore.getState().reset()
          } catch {
            // bỏ qua nếu store chưa sẵn sàng
          }
          clearAuthStorage()
          set({ user: null, token: null }, false, 'auth/logout')
        },
        setUser: (user) => set({ user }, false, 'auth/setUser'),
      }),
      {
        name: 'capnong-auth',
        storage: legacyAuthStorage,
        partialize: ({ user, token }) => ({ user, token }),
      },
    ),
    { name: 'auth', enabled: import.meta.env.DEV },
  ),
)

// axiosInstance phát event này khi API trả 401: hết phiên thì đăng xuất và về trang đăng nhập.
if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => {
    useAuthStore.getState().logout()
    location.hash = '/dang-nhap'
  })
}

/** API giống useAuth() của AuthContext cũ, để các component không phải sửa logic. */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const setUser = useAuthStore((s) => s.setUser)
  return {
    user,
    token,
    isAuthenticated: user !== null && isTokenValid(token),
    hasRole: (...roles: UserRole[]) => user !== null && isTokenValid(token) && roles.includes(user.role),
    login,
    logout,
    setUser,
  }
}
