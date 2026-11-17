import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotificationDropdown } from './NotificationDropdown'
import { useNotificationStore, useChatStore } from '@/stores'

describe('NotificationDropdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChatStore.setState({ unreadTotal: 0 } as any)
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isOpen: false,
      hasFetched: true,
      selectedNotification: null,
      isDetailOpen: false,
    })
  })

  it('không render khi isOpen = false', () => {
    const { container } = render(
      <MemoryRouter>
        <NotificationDropdown isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('hiển thị trạng thái trống khi không có thông báo', () => {
    render(
      <MemoryRouter>
        <NotificationDropdown isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Chưa có thông báo nào')).toBeDefined()
  })

  it('hiển thị danh sách thông báo và tương tác markAsRead, markAllAsRead, deleteNotification', () => {
    const markAsReadMock = vi.fn()
    const markAllAsReadMock = vi.fn()
    const deleteMock = vi.fn()

    useNotificationStore.setState({
      notifications: [
        {
          id: 1,
          title: 'Đơn hàng đã được xác nhận',
          message: 'Nhà vườn đang đóng gói sản phẩm của bạn',
          createAt: new Date().toISOString(),
          isRead: false,
        },
      ],
      unreadCount: 1,
      markAsRead: markAsReadMock,
      markAllAsRead: markAllAsReadMock,
      deleteNotification: deleteMock,
    })

    render(
      <MemoryRouter>
        <NotificationDropdown isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Đơn hàng đã được xác nhận')).toBeDefined()
    expect(screen.getByText('1 mới')).toBeDefined()

    // Click on item to mark as read & navigate
    fireEvent.click(screen.getByText('Đơn hàng đã được xác nhận'))
    expect(markAsReadMock).toHaveBeenCalledWith(1)

    // Click "Đọc tất cả"
    fireEvent.click(screen.getByText('Đọc tất cả'))
    expect(markAllAsReadMock).toHaveBeenCalled()

    // Click delete
    const deleteBtn = screen.getByTitle('Xóa thông báo')
    fireEvent.click(deleteBtn)
    expect(deleteMock).toHaveBeenCalledWith(1)
  })

  it('hiển thị banner tin nhắn mới khi unreadTotal > 0 và bấm mở chat', () => {
    useChatStore.setState({ unreadTotal: 4 } as any)
    const onCloseMock = vi.fn()

    render(
      <MemoryRouter>
        <NotificationDropdown isOpen={true} onClose={onCloseMock} messagesHref="/tin-nhan" />
      </MemoryRouter>,
    )

    expect(screen.getByText('Tin nhắn mới')).toBeDefined()
    expect(screen.getByText(/4\s*tin nhắn chưa đọc/)).toBeDefined()

    fireEvent.click(screen.getByText('Mở chat'))
    expect(onCloseMock).toHaveBeenCalled()
  })
})
