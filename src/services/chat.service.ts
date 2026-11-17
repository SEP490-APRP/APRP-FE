import type { ChatMessage, ChatMessageRequest, Conversation, ChatNotification } from '@/types/chat'
import { chatApi } from '@/services/api/chat.api'
import { chatSocketService } from '@/services/websocket/chatSocket.service'

/**
 * Cache tạm thời conversationId theo otherUserId để tối ưu hóa truy vấn lịch sử
 */
const conversationCache = new Map<number, number>()

export const chatService = {
  /**
   * Kết nối STOMP WebSocket
   */
  connect(onConnect?: () => void, onError?: (err: unknown) => void): void {
    chatSocketService.connect(undefined, onConnect, onError)
  },

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    chatSocketService.disconnect()
  },

  /**
   * Đăng ký lắng nghe tin nhắn cho một cuộc trò chuyện cụ thể
   */
  subscribeToConversation(
    _userId: number,
    otherUserId: number,
    callback: (msg: ChatMessage) => void,
  ): () => void {
    const unsubscribe = chatSocketService.onMessage((msg) => {
      // Nhận tin nhắn nếu người gửi hoặc người nhận là otherUserId
      if (msg.senderId === otherUserId || msg.receiverId === otherUserId) {
        callback(msg)
      }
    })
    return unsubscribe
  },

  /**
   * Hủy đăng ký lắng nghe (đáp ứng tương thích ngược)
   */
  unsubscribeFromConversation(_userId: number, _otherUserId: number): void {
    // Unsubscribe được xử lý qua teardown hàm hoặc disconnect
  },

  /**
   * Đánh dấu cuộc trò chuyện đã đọc
   */
  async markAsRead(conversationOrOtherUserId: number): Promise<void> {
    try {
      let conversationId = conversationOrOtherUserId

      // Nếu số truyền vào là otherUserId, tìm conversationId tương ứng
      if (conversationCache.has(conversationOrOtherUserId)) {
        conversationId = conversationCache.get(conversationOrOtherUserId)!
      } else {
        const convs = await chatApi.getConversations()
        const found = convs.find(
          (c) => Number(c.id) === conversationOrOtherUserId || c.otherUserId === conversationOrOtherUserId,
        )
        if (found) {
          conversationId = Number(found.id)
          conversationCache.set(found.otherUserId, conversationId)
        }
      }

      // Gửi qua WebSocket nếu đã kết nối, đồng thời gọi REST
      if (chatSocketService.getIsConnected()) {
        chatSocketService.sendRead(conversationId)
      }
      await chatApi.markAsRead(conversationId)
    } catch (err) {
      console.warn('[ChatService] Failed to mark as read:', err)
    }
  },

  /**
   * Lấy danh sách hội thoại từ Backend
   */
  async getConversations(): Promise<Conversation[]> {
    const list = await chatApi.getConversations()
    list.forEach((c) => {
      conversationCache.set(c.otherUserId, Number(c.id))
    })
    return list
  },

  /**
   * Lấy lịch sử tin nhắn của một hội thoại (dựa vào otherUserId hoặc conversationId)
   */
  async getChatHistory(otherUserIdOrConversationId: number): Promise<ChatMessage[]> {
    let conversationId: number | null = null

    if (conversationCache.has(otherUserIdOrConversationId)) {
      conversationId = conversationCache.get(otherUserIdOrConversationId)!
    } else {
      // Thử tìm trong danh sách hội thoại hiện tại
      const convs = await this.getConversations()
      const found = convs.find(
        (c) =>
          Number(c.id) === otherUserIdOrConversationId ||
          c.otherUserId === otherUserIdOrConversationId,
      )

      if (found) {
        conversationId = Number(found.id)
      } else {
        // Nếu chưa có hội thoại với user này, khởi tạo hội thoại mới
        const initiated = await chatApi.initConversation(otherUserIdOrConversationId)
        conversationId = Number(initiated.id)
        conversationCache.set(initiated.otherUserId, conversationId)
      }
    }

    const res = await chatApi.getMessages(conversationId, 0, 50)
    // Sắp xếp theo thứ tự thời gian tăng dần để hiển thị từ cũ đến mới
    const messages = res.content ? [...res.content] : []
    messages.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.sentAt || 0).getTime()
      const timeB = new Date(b.createdAt || b.sentAt || 0).getTime()
      return timeA - timeB
    })
    return messages
  },

  /**
   * Gửi tin nhắn: ưu tiên WebSocket STOMP (/app/chat.send), fallback qua REST
   */
  async sendMessage(payload: {
    receiverId: number
    content?: string
    type?: string
    attachmentUrl?: string
    referenceId?: number
  }): Promise<ChatMessage | void> {
    const req: ChatMessageRequest = {
      receiverId: payload.receiverId,
      content: payload.content || '',
      type: payload.type || 'TEXT',
      attachmentUrl: payload.attachmentUrl,
      referenceId: payload.referenceId,
    }

    if (chatSocketService.getIsConnected()) {
      const sent = chatSocketService.sendMessage(req)
      if (sent) return
    }

    // Fallback qua REST API nếu WebSocket chưa kết nối
    return await chatApi.sendMessage(req)
  },

  /**
   * Gửi tín hiệu đang soạn tin nhắn (typing indicator)
   */
  sendTyping(receiverId: number, isTyping: boolean): void {
    chatSocketService.sendTyping(receiverId, isTyping)
  },

  /**
   * Lấy tổng số tin nhắn chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    return await chatApi.getUnreadCount()
  },

  /**
   * Đăng ký nhận thông báo đẩy thời gian thực
   */
  onNotification(callback: (notification: ChatNotification) => void): () => void {
    return chatSocketService.onNotification(callback)
  },

  /**
   * Đăng ký nhận sự kiện typing
   */
  onTyping(callback: (event: { senderId: number; isTyping: boolean }) => void): () => void {
    return chatSocketService.onTyping(callback)
  },
}
