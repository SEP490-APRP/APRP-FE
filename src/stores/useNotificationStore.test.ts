import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotificationStore } from './useNotificationStore'
import { notificationService } from '@/services/notification.service'
import { notificationSocketService } from '@/services/websocket/notificationSocket.service'

vi.mock('@/services/notification.service', () => ({
  notificationService: {
    getMyNotifications: vi.fn(),
    getMyUnreadCount: vi.fn(),
    getAllNotifications: vi.fn(),
    adminSendToGroups: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}))

vi.mock('@/services/websocket/notificationSocket.service', () => ({
  notificationSocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onNotification: vi.fn().mockReturnValue(vi.fn()),
  },
}))

vi.mock('@/components/common/Popup', () => ({
  globalShowAlert: vi.fn(),
}))

describe('useNotificationStore - Global Realtime Notification Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isOpen: false,
      hasFetched: false,
    })
  })

  it('fetchNotifications tải danh sách và tính đúng unreadCount', async () => {
    vi.mocked(notificationService.getMyNotifications).mockResolvedValueOnce({
      code: 1000,
      result: [
        { id: 1, title: 'Thông báo 1', message: 'Nội dung 1', isRead: false },
        { id: 2, title: 'Thông báo 2', message: 'Nội dung 2', isRead: true },
      ],
    })

    await useNotificationStore.getState().fetchNotifications()

    expect(useNotificationStore.getState().notifications).toHaveLength(2)
    expect(useNotificationStore.getState().unreadCount).toBe(1)
    expect(useNotificationStore.getState().hasFetched).toBe(true)
  })

  it('markAsRead đánh dấu đã đọc và giảm unreadCount', async () => {
    useNotificationStore.setState({
      notifications: [
        { id: 1, title: 'Thông báo 1', message: 'Nội dung 1', isRead: false },
        { id: 2, title: 'Thông báo 2', message: 'Nội dung 2', isRead: true },
      ],
      unreadCount: 1,
    })

    vi.mocked(notificationService.markAsRead).mockResolvedValueOnce({
      code: 1000,
      result: undefined,
    })

    await useNotificationStore.getState().markAsRead(1)

    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
    expect(notificationService.markAsRead).toHaveBeenCalledWith(1)
  })

  it('markAllAsRead đánh dấu toàn bộ đã đọc và reset unreadCount về 0', async () => {
    useNotificationStore.setState({
      notifications: [
        { id: 1, title: 'Thông báo 1', message: 'Nội dung 1', isRead: false },
        { id: 2, title: 'Thông báo 2', message: 'Nội dung 2', isRead: false },
      ],
      unreadCount: 2,
    })

    vi.mocked(notificationService.markAllAsRead).mockResolvedValueOnce({
      code: 1000,
      result: undefined,
    })

    await useNotificationStore.getState().markAllAsRead()

    expect(useNotificationStore.getState().notifications.every((n) => n.isRead)).toBe(true)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
    expect(notificationService.markAllAsRead).toHaveBeenCalled()
  })

  it('deleteNotification xoá bản ghi và cập nhật unreadCount nếu chưa đọc', async () => {
    useNotificationStore.setState({
      notifications: [
        { id: 1, title: 'Thông báo 1', message: 'Nội dung 1', isRead: false },
        { id: 2, title: 'Thông báo 2', message: 'Nội dung 2', isRead: true },
      ],
      unreadCount: 1,
    })

    vi.mocked(notificationService.deleteNotification).mockResolvedValueOnce({
      code: 1000,
      result: undefined,
    })

    await useNotificationStore.getState().deleteNotification(1)

    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    expect(useNotificationStore.getState().notifications[0].id).toBe(2)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
    expect(notificationService.deleteNotification).toHaveBeenCalledWith(1)
  })

  it('addIncomingNotification thêm thông báo mới vào đầu danh sách và tăng unreadCount', () => {
    useNotificationStore.setState({
      notifications: [{ id: 2, title: 'Thông báo 2', message: 'Nội dung 2', isRead: true }],
      unreadCount: 0,
    })

    useNotificationStore.getState().addIncomingNotification({
      id: 1,
      title: 'Đơn hàng mới',
      message: 'Có đơn hàng mới #101',
      isRead: false,
    })

    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(2)
    expect(state.notifications[0].id).toBe(1)
    expect(state.unreadCount).toBe(1)
  })

  it('connectRealtime và disconnectRealtime tương tác đúng với notificationSocketService', () => {
    useNotificationStore.getState().connectRealtime('15', 'jwt-token')

    expect(notificationSocketService.connect).toHaveBeenCalledWith('15', 'jwt-token')
    expect(notificationSocketService.onNotification).toHaveBeenCalled()

    useNotificationStore.getState().disconnectRealtime()
    expect(notificationSocketService.disconnect).toHaveBeenCalled()
  })
})
