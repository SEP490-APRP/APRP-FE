import { create } from 'zustand'

const TOAST_MS = 3500
let toastTimer: ReturnType<typeof setTimeout> | undefined

export type ToastType = 'success' | 'error' | 'warning' | 'info'

type UiState = {
  toast: string
  toastType: ToastType
  /** Tiêu đề modal "tính năng chưa kết nối"; rỗng là đóng. */
  info: string
  cartOpen: boolean
  cartMinimized: boolean
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
  /** Mở modal thông tin và đóng giỏ (giống showInfo cũ trong App). */
  showInfo: (title: string) => void
  hideInfo: () => void
  openCart: () => void
  closeCart: () => void
  setCartMinimized: (minimized: boolean) => void
}

/** State giao diện dùng chung giữa storefront và portal (portal gọi được, storefront hiển thị). */
export const useUiStore = create<UiState>()((set) => ({
  toast: '',
  toastType: 'success',
  info: '',
  cartOpen: false,
  cartMinimized: false,
  showToast: (message, type = 'success') => {
    clearTimeout(toastTimer)
    set({ toast: message, toastType: type })
    const timeout = type === 'error' ? 5000 : TOAST_MS
    toastTimer = setTimeout(() => set({ toast: '' }), timeout)
  },
  hideToast: () => {
    clearTimeout(toastTimer)
    set({ toast: '' })
  },
  showInfo: (title) => set({ info: title, cartOpen: false, cartMinimized: false }),
  hideInfo: () => set({ info: '' }),
  openCart: () => set({ cartOpen: true, cartMinimized: false }),
  closeCart: () => set({ cartOpen: false, cartMinimized: false }),
  setCartMinimized: (minimized) => set({ cartMinimized: minimized }),
}))
