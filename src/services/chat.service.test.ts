import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chatService } from './chat.service'
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
    getIsConnected: vi.fn(),
    onMessage: vi.fn(),
    onNotification: vi.fn(),
    onTyping: vi.fn(),
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    sendRead: vi.fn(),
  },
}))

describe('chatService - Realtime STOMP & REST API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gọi chatSocketService.connect khi kết nối', () => {
    const onConnect = vi.fn()
    const onError = vi.fn()
    chatService.connect(onConnect, onError)
    expect(chatSocketService.connect).toHaveBeenCalledWith(undefined, onConnect, onError)
  })

  it('gọi chatSocketService.disconnect khi ngắt kết nối', () => {
    chatService.disconnect()
    expect(chatSocketService.disconnect).toHaveBeenCalled()
  })

  it('lấy danh sách hội thoại từ chatApi.getConversations', async () => {
    const mockList = [
      {
        id: 1,
        otherUserId: 10,
        otherUserName: 'Nhà Vườn Ba Vì',
        lastMessage: 'Chào bạn',
        unreadCount: 2,
      },
    ]
    vi.mocked(chatApi.getConversations).mockResolvedValueOnce(mockList)

    const result = await chatService.getConversations()
    expect(chatApi.getConversations).toHaveBeenCalled()
    expect(result).toEqual(mockList)
  })

  it('gửi tin nhắn qua STOMP WebSocket nếu đã kết nối', async () => {
    vi.mocked(chatSocketService.getIsConnected).mockReturnValue(true)
    vi.mocked(chatSocketService.sendMessage).mockReturnValue(true)

    await chatService.sendMessage({
      receiverId: 20,
      content: 'Xin chào shop',
    })

    expect(chatSocketService.sendMessage).toHaveBeenCalledWith({
      receiverId: 20,
      content: 'Xin chào shop',
      type: 'TEXT',
      attachmentUrl: undefined,
      referenceId: undefined,
    })
    expect(chatApi.sendMessage).not.toHaveBeenCalled()
  })

  it('fallback qua REST API khi WebSocket chưa kết nối', async () => {
    vi.mocked(chatSocketService.getIsConnected).mockReturnValue(false)
    const mockSent = {
      id: 99,
      conversationId: 5,
      senderId: 1,
      receiverId: 20,
      content: 'Tin nhắn gửi qua REST',
      type: 'TEXT',
    }
    vi.mocked(chatApi.sendMessage).mockResolvedValueOnce(mockSent)

    const result = await chatService.sendMessage({
      receiverId: 20,
      content: 'Tin nhắn gửi qua REST',
    })

    expect(chatSocketService.sendMessage).not.toHaveBeenCalled()
    expect(chatApi.sendMessage).toHaveBeenCalledWith({
      receiverId: 20,
      content: 'Tin nhắn gửi qua REST',
      type: 'TEXT',
      attachmentUrl: undefined,
      referenceId: undefined,
    })
    expect(result).toEqual(mockSent)
  })

  it('gửi typing indicator chính xác qua chatSocketService', () => {
    chatService.sendTyping(15, true)
    expect(chatSocketService.sendTyping).toHaveBeenCalledWith(15, true)

    chatService.sendTyping(15, false)
    expect(chatSocketService.sendTyping).toHaveBeenCalledWith(15, false)
  })

  it('lấy tổng số tin nhắn chưa đọc từ chatApi.getUnreadCount', async () => {
    vi.mocked(chatApi.getUnreadCount).mockResolvedValueOnce(5)
    const count = await chatService.getUnreadCount()
    expect(chatApi.getUnreadCount).toHaveBeenCalled()
    expect(count).toBe(5)
  })
})
