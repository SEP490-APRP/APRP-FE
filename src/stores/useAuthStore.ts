import { create } from 'zustand'
import { devtools, persist, type PersistStorage } from 'zustand/middleware'
import type { AuthUser, SessionUser, UserRole } from '@/types'
import { AUTH_UNAUTHORIZED_EVENT } from '@/services/api'
import { STORAGE_KEYS } from '@/utils'
import { readJson, readRaw, writeRaw } from './storage'

const ROLES: readonly UserRole[] = ['buyer', 'shop', 'shipper', 'admin', 'staff']

type LoginUser = AuthUser & { id?: string | number }

type AuthState = {
  user: SessionUser | null
  token: string | null
  /** token tùy chọn: các luồng đăng nhập demo hiện chưa có token thật từ backend. */
  login: (user: LoginUser, token?: string) => void
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

/** Đọc user đã lưu; kiểm tra kiểu thay vì tin JSON.parse. Bản cũ lưu user không có id. */
export function readStoredUser(): SessionUser | null {
  const saved = readJson(STORAGE_KEYS.USER)
  return isLoginUser(saved) ? { ...saved, id: String(saved.id ?? 'local') } : null
}

/**
 * Giữ nguyên 2 key cũ (capnong-user là JSON, capnong-token là chuỗi thô)
 * để người đang đăng nhập không bị đăng xuất khi chuyển sang Zustand.
 */
const legacyAuthStorage: PersistStorage<PersistedAuth> = {
  getItem: () => ({
    state: { user: readStoredUser(), token: readRaw(STORAGE_KEYS.TOKEN) },
    version: 0,
  }),
  setItem: (_name, { state }) => {
    writeRaw(STORAGE_KEYS.USER, state.user ? JSON.stringify(state.user) : null)
    writeRaw(STORAGE_KEYS.TOKEN, state.token)
  },
  removeItem: () => {
    writeRaw(STORAGE_KEYS.USER, null)
    writeRaw(STORAGE_KEYS.TOKEN, null)
  },
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        login: (next, nextToken) =>
          set(
            {
              user: { ...next, id: next.id != null ? String(next.id) : crypto.randomUUID() },
              token: nextToken ?? null,
            },
            false,
            'auth/login',
          ),
        logout: () => set({ user: null, token: null }, false, 'auth/logout'),
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
  return {
    user,
    token,
    isAuthenticated: user !== null,
    hasRole: (...roles: UserRole[]) => user !== null && roles.includes(user.role),
    login,
    logout,
  }
}
