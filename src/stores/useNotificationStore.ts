import { create } from 'zustand'
import { notificationService, type NotificationItem } from '@/services/notification.service'
import { notificationSocketService } from '@/services/websocket/notificationSocket.service'
import { playNotificationChime } from '@/utils/audio'

export interface ActiveNotificationToast {
  id: number | string
  notification: NotificationItem
}

interface NotificationStore {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  isOpen: boolean
  hasFetched: boolean
  activeToasts: ActiveNotificationToast[]
  selectedNotification: NotificationItem | null
  isDetailOpen: boolean

  setIsOpen: (open: boolean) => void
  openDetail: (item: NotificationItem) => void
  closeDetail: () => void
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
  addIncomingNotification: (item: NotificationItem) => void
  dismissToast: (id: number | string) => void
  connectRealtime: (userId: string | number, token?: string) => void
  disconnectRealtime: () => void
  reset: () => void
}

let unbindSocketNotification: (() => void) | null = null

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isOpen: false,
  hasFetched: false,
  activeToasts: [],
  selectedNotification: null,
  isDetailOpen: false,

  setIsOpen: (open) => set({ isOpen: open }),

  openDetail: (item: NotificationItem) => {
    set({ selectedNotification: item, isDetailOpen: true })
    if (!item.isRead) {
      get().markAsRead(item.id)
    }
  },

  closeDetail: () => {
    set({ selectedNotification: null, isDetailOpen: false })
  },

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const res = await notificationService.getMyNotifications()
      const rawList = res.result ?? []
      const list = rawList.filter((n) => n && (n.title || n.message))
      const unread = list.filter((n) => !n.isRead).length
      set({ notifications: list, unreadCount: unread, hasFetched: true })
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch notifications:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getMyUnreadCount()
      if (typeof res.result === 'number') {
        set({ unreadCount: res.result })
      }
    } catch (err) {
      console.warn('[NotificationStore] Failed to fetch unread count:', err)
    }
  },

  markAsRead: async (id: number) => {
    // Optimistic update
    const prev = get().notifications
    const updated = prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    const prevUnread = get().unreadCount
    const newUnread = Math.max(0, prevUnread - 1)
    const curSelected = get().selectedNotification
    set({
      notifications: updated,
      unreadCount: newUnread,
      selectedNotification: curSelected && curSelected.id === id ? { ...curSelected, isRead: true } : curSelected,
    })

    try {
      await notificationService.markAsRead(id)
    } catch (err) {
      console.error('[NotificationStore] Failed to mark as read:', err)
      set({ notifications: prev, unreadCount: prevUnread })
    }
  },

  markAllAsRead: async () => {
    const prev = get().notifications
    const prevUnread = get().unreadCount
    const updated = prev.map((item) => ({ ...item, isRead: true }))
    const curSelected = get().selectedNotification
    set({
      notifications: updated,
      unreadCount: 0,
      selectedNotification: curSelected ? { ...curSelected, isRead: true } : curSelected,
    })

    try {
      await notificationService.markAllAsRead()
    } catch (err) {
      console.error('[NotificationStore] Failed to mark all as read:', err)
      set({ notifications: prev, unreadCount: prevUnread })
    }
  },

  deleteNotification: async (id: number) => {
    const prev = get().notifications
    const target = prev.find((item) => item.id === id)
    const updated = prev.filter((item) => item.id !== id)
    const newUnread = target && !target.isRead ? Math.max(0, get().unreadCount - 1) : get().unreadCount
    const curSelected = get().selectedNotification
    set({
      notifications: updated,
      unreadCount: newUnread,
      selectedNotification: curSelected && curSelected.id === id ? null : curSelected,
      isDetailOpen: curSelected && curSelected.id === id ? false : get().isDetailOpen,
    })

    try {
      await notificationService.deleteNotification(id)
    } catch (err) {
      console.error('[NotificationStore] Failed to delete notification:', err)
      set({ notifications: prev, unreadCount: get().unreadCount })
    }
  },

  addIncomingNotification: (item: NotificationItem) => {
    // Không nạp thông báo rỗng hoặc payload sự kiện chat
    if (!item || (!item.title && !item.message)) return

    const prev = get().notifications
    if (prev.some((n) => n.id === item.id)) return

    // Phát âm thanh chuông khi có thông báo mới
    playNotificationChime()

    const updated = [item, ...prev]
    set({
      notifications: updated,
      unreadCount: get().unreadCount + 1,
    })

    // Non-blocking toast notification: tự động hiển thị ở góc màn hình và tự tắt sau 5s
    const toastId = item.id || Date.now()
    const newToast: ActiveNotificationToast = { id: toastId, notification: item }
    set((state) => ({
      activeToasts: [newToast, ...state.activeToasts.slice(0, 2)],
    }))

    setTimeout(() => {
      get().dismissToast(toastId)
    }, 5000)
  },

  dismissToast: (id) => {
    set((state) => ({
      activeToasts: state.activeToasts.filter((t) => t.id !== id),
    }))
  },

  connectRealtime: (userId: string | number, token?: string) => {
    if (unbindSocketNotification) {
      unbindSocketNotification()
      unbindSocketNotification = null
    }

    unbindSocketNotification = notificationSocketService.onNotification((notif) => {
      get().addIncomingNotification(notif)
    })

    notificationSocketService.connect(userId, token)
  },

  disconnectRealtime: () => {
    if (unbindSocketNotification) {
      unbindSocketNotification()
      unbindSocketNotification = null
    }
    notificationSocketService.disconnect()
  },

  reset: () => {
    get().disconnectRealtime()
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isOpen: false,
      hasFetched: false,
      activeToasts: [],
      selectedNotification: null,
      isDetailOpen: false,
    })
  },
}))
