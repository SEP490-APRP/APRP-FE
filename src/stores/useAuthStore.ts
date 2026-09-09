import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import type { User } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

/* ===== Auth Store Types ===== */
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: User) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

type AuthStore = AuthState & AuthActions

/* ===== Auth Store ===== */
const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // State
        user: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        setUser: (user) =>
          set(
            { user, isAuthenticated: true, isLoading: false },
            false,
            'auth/setUser',
          ),

        setLoading: (isLoading) =>
          set({ isLoading }, false, 'auth/setLoading'),

        logout: () => {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
          set(
            { user: null, isAuthenticated: false, isLoading: false },
            false,
            'auth/logout',
          )
        },
      }),
      {
        name: STORAGE_KEYS.USER,
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
)

export default useAuthStore
