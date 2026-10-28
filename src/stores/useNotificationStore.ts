import { create } from 'zustand'
import { notificationService, type NotificationItem } from '@/services/notification.service'
import { notificationSocketService } from '@/services/websocket/notificationSocket.service'
import { globalShowAlert } from '@/components/common/Popup'

interface NotificationStore {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  isOpen: boolean
  hasFetched: boolean

  setIsOpen: (open: boolean) => void
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
  addIncomingNotification: (item: NotificationItem) => void
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

  setIsOpen: (open) => set({ isOpen: open }),

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const res = await notificationService.getMyNotifications()
      const list = res.result ?? []
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
    set({ notifications: updated, unreadCount: newUnread })

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
    set({ notifications: updated, unreadCount: 0 })

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
    set({ notifications: updated, unreadCount: newUnread })

    try {
      await notificationService.deleteNotification(id)
    } catch (err) {
      console.error('[NotificationStore] Failed to delete notification:', err)
      set({ notifications: prev, unreadCount: get().unreadCount })
    }
  },

  addIncomingNotification: (item: NotificationItem) => {
    const prev = get().notifications
    if (prev.some((n) => n.id === item.id)) return

    const updated = [item, ...prev]
    set({
      notifications: updated,
      unreadCount: get().unreadCount + 1,
    })

    // Display instant alert / toast notification to user
    globalShowAlert(
      item.message,
      item.title || 'Thông báo mới',
      'info'
    )
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
    })
  },
}))
