import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notificationService } from './notification.service'

vi.mock('@/services/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import axiosInstance from '@/services/api/axiosInstance'

const mockAxios = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('notificationService - REST API client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyNotifications gọi đúng endpoint GET /notifications/my', async () => {
    const mockData = [
      { id: 1, title: 'Đơn hàng mới', message: 'Bạn có đơn hàng #123' },
    ]
    mockAxios.get.mockResolvedValueOnce({
      data: { code: 1000, result: mockData },
    })

    const res = await notificationService.getMyNotifications()

    expect(mockAxios.get).toHaveBeenCalledWith('/notifications/my')
    expect(res.result).toEqual(mockData)
  })

  it('getMyUnreadCount gọi đúng endpoint GET /notifications/unread-count', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: { code: 1000, result: 5 },
    })

    const res = await notificationService.getMyUnreadCount()

    expect(mockAxios.get).toHaveBeenCalledWith('/notifications/unread-count')
    expect(res.result).toBe(5)
  })

  it('getAllNotifications gọi đúng endpoint GET /notifications/all', async () => {
    const mockData = [
      { id: 10, title: 'Bảo trì hệ thống', message: 'Hệ thống bảo trì tối nay' },
    ]
    mockAxios.get.mockResolvedValueOnce({
      data: { code: 1000, result: mockData },
    })

    const res = await notificationService.getAllNotifications()

    expect(mockAxios.get).toHaveBeenCalledWith('/notifications/all')
    expect(res.result).toEqual(mockData)
  })

  it('adminSendToGroups gọi đúng endpoint POST /notifications/admin/send-to-groups', async () => {
    const payload = {
      title: 'Chào mừng mùa vụ mới',
      message: 'Ưu đãi giải cứu nông sản',
      evidence: 'https://example.com/promo.png',
      receiverTypes: ['BUYER', 'SHOP'],
    }
    mockAxios.post.mockResolvedValueOnce({
      data: { code: 1000, message: 'Gửi thông báo thành công' },
    })

    const res = await notificationService.adminSendToGroups(payload)

    expect(mockAxios.post).toHaveBeenCalledWith('/notifications/admin/send-to-groups', payload)
    expect(res.code).toBe(1000)
  })

  it('markAsRead gọi đúng endpoint PUT /notifications/{id}/read', async () => {
    mockAxios.put.mockResolvedValueOnce({
      data: { code: 1000, message: 'Đã đánh dấu đọc' },
    })

    const res = await notificationService.markAsRead(42)

    expect(mockAxios.put).toHaveBeenCalledWith('/notifications/42/read')
    expect(res.code).toBe(1000)
  })

  it('markAllAsRead gọi đúng endpoint PUT /notifications/read-all', async () => {
    mockAxios.put.mockResolvedValueOnce({
      data: { code: 1000, message: 'Đã đánh dấu tất cả đã đọc' },
    })

    const res = await notificationService.markAllAsRead()

    expect(mockAxios.put).toHaveBeenCalledWith('/notifications/read-all')
    expect(res.code).toBe(1000)
  })

  it('deleteNotification gọi đúng endpoint DELETE /notifications/{id}', async () => {
    mockAxios.delete.mockResolvedValueOnce({
      data: { code: 1000, message: 'Đã xóa thông báo' },
    })

    const res = await notificationService.deleteNotification(42)

    expect(mockAxios.delete).toHaveBeenCalledWith('/notifications/42')
    expect(res.code).toBe(1000)
  })
})
