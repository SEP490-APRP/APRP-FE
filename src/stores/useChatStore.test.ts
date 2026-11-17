import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStore } from './useChatStore'
import { chatApi } from '@/services/api/chat.api'
import { chatSocketService } from '@/services/websocket/chatSocket.service'

vi.mock('@/services/api/chat.api', () => ({
  chatApi: {
    getConversations: vi.fn(),
    initConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
  },
}))

vi.mock('@/services/websocket/chatSocket.service', () => ({
  chatSocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onConnectionChange: vi.fn(),
    onMessage: vi.fn(),
    onNotification: vi.fn(),
    onTyping: vi.fn(),
    onReadReceipt: vi.fn(),
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    sendRead: vi.fn(),
  },
}))

describe('useChatStore - Global Realtime Chat Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChatStore.setState({
      conversations: [],
      activeConversation: null,
      messages: {},
      unreadTotal: 0,
      typingUsers: {},
      isWsConnected: false,
      isOpen: false,
      isLoadingConversations: false,
      isLoadingMessages: false,
    })
  })

  it('tải danh sách cuộc trò chuyện và tính toán tổng unreadTotal', async () => {
    const mockConvs = [
      { id: 1, otherUserId: 10, otherUserName: 'Shop Rau Củ', unreadCount: 3 },
      { id: 2, otherUserId: 20, otherUserName: 'Bác Nông Dân', unreadCount: 1 },
    ]
    vi.mocked(chatApi.getConversations).mockResolvedValueOnce(mockConvs)

    await useChatStore.getState().loadConversations()

    const state = useChatStore.getState()
    expect(state.conversations).toHaveLength(2)
    expect(state.unreadTotal).toBe(4)
  })

  it('chọn conversation và tải lịch sử tin nhắn', async () => {
    const targetConv = { id: 1, otherUserId: 10, otherUserName: 'Shop Rau Củ', unreadCount: 2 }
    const mockMessages = [
      { id: 101, conversationId: 1, senderId: 10, receiverId: 1, content: 'Chào bạn!' },
    ]

    vi.mocked(chatApi.getMessages).mockResolvedValueOnce({
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      content: mockMessages,
    })
    vi.mocked(chatApi.markAsRead).mockResolvedValueOnce()

    await useChatStore.getState().selectConversation(targetConv)

    const state = useChatStore.getState()
    expect(state.activeConversation).toEqual(targetConv)
    expect(state.messages[1]).toHaveLength(1)
    expect(state.messages[1][0].content).toBe('Chào bạn!')
    expect(chatApi.markAsRead).toHaveBeenCalledWith(1)
  })

  it('gửi tin nhắn qua STOMP WebSocket khi đang kết nối', async () => {
    useChatStore.setState({
      isWsConnected: true,
      activeConversation: { id: 1, otherUserId: 10, otherUserName: 'Shop' },
    })
    vi.mocked(chatSocketService.sendMessage).mockReturnValueOnce(true)

    await useChatStore.getState().sendMessage('Xin chào!')

    expect(chatSocketService.sendMessage).toHaveBeenCalledWith({
      receiverId: 10,
      content: 'Xin chào!',
      type: 'TEXT',
      attachmentUrl: undefined,
      referenceId: undefined,
    })
  })

  it('fallback qua REST API khi WebSocket chưa kết nối', async () => {
    useChatStore.setState({
      isWsConnected: false,
      activeConversation: { id: 1, otherUserId: 10, otherUserName: 'Shop' },
    })

    const sentMsg = {
      id: 999,
      conversationId: 1,
      senderId: 1,
      receiverId: 10,
      content: 'Gửi qua REST',
      type: 'TEXT',
    }
    vi.mocked(chatApi.sendMessage).mockResolvedValueOnce(sentMsg)

    await useChatStore.getState().sendMessage('Gửi qua REST')

    expect(chatApi.sendMessage).toHaveBeenCalledWith({
      receiverId: 10,
      content: 'Gửi qua REST',
      type: 'TEXT',
      attachmentUrl: undefined,
      referenceId: undefined,
    })
    expect(useChatStore.getState().messages[1]).toContainEqual(sentMsg)
  })

  it('đánh dấu đã đọc cập nhật unreadCount trong state', async () => {
    useChatStore.setState({
      conversations: [
        { id: 1, otherUserId: 10, otherUserName: 'Shop 1', unreadCount: 3 },
        { id: 2, otherUserId: 20, otherUserName: 'Shop 2', unreadCount: 2 },
      ],
      unreadTotal: 5,
    })
    vi.mocked(chatApi.markAsRead).mockResolvedValueOnce()

    await useChatStore.getState().markAsRead(1)

    const state = useChatStore.getState()
    expect(state.conversations.find((c) => c.id === 1)?.unreadCount).toBe(0)
    expect(state.unreadTotal).toBe(2)
    expect(chatSocketService.sendRead).toHaveBeenCalledWith(1)
    expect(chatApi.markAsRead).toHaveBeenCalledWith(1)
  })

  it('bật tắt modal chat qua setOpen', () => {
    useChatStore.getState().setOpen(true)
    expect(useChatStore.getState().isOpen).toBe(true)

    useChatStore.getState().setOpen(false)
    expect(useChatStore.getState().isOpen).toBe(false)
  })

  it('xóa sạch state và ngắt kết nối WebSocket khi gọi reset()', () => {
    useChatStore.setState({
      conversations: [
        {
          id: 1,
          roomKey: '1_2',
          otherUserId: 2,
          otherUserName: 'Bác Nông Dân',
          lastMessage: 'Cà chua tươi',
          lastMessageTime: '2026-10-19T10:00:00Z',
          unreadCount: 3,
        },
      ],
      messages: {
        1: [{ id: 101, content: 'Test', isRead: false, createdAt: '2026-10-19T10:00:00Z' }],
      },
      unreadTotal: 3,
      isWsConnected: true,
      isOpen: true,
    })

    useChatStore.getState().reset()

    const state = useChatStore.getState()
    expect(state.conversations).toEqual([])
    expect(state.messages).toEqual({})
    expect(state.unreadTotal).toBe(0)
    expect(state.isWsConnected).toBe(false)
    expect(state.isOpen).toBe(false)
    expect(chatSocketService.disconnect).toHaveBeenCalled()
  })
})
