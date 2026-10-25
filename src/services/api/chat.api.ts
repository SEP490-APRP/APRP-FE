import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type { ChatMessage, ChatMessageRequest, Conversation } from '@/types/chat'

export const chatApi = {
  /**
   * Lấy danh sách cuộc trò chuyện của người dùng hiện tại
   */
  async getConversations(): Promise<Conversation[]> {
    const res = await axiosInstance.get<ApiResponse<Conversation[]>>('/chat/conversations')
    return res.data?.result || []
  },

  /**
   * Khởi tạo hoặc lấy cuộc trò chuyện sẵn có với một user cụ thể
   */
  async initConversation(receiverId: number): Promise<Conversation> {
    const res = await axiosInstance.post<ApiResponse<Conversation>>('/chat/conversations/init', {
      receiverId,
    })
    if (!res.data.result) {
      throw new Error(res.data.message || 'Failed to initiate conversation')
    }
    return res.data.result
  },

  /**
   * Lấy lịch sử tin nhắn trong một cuộc trò chuyện (phân trang)
   */
  async getMessages(
    conversationId: number,
    page: number = 0,
    size: number = 30,
  ): Promise<PageResponse<ChatMessage>> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ChatMessage>>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: { page, size },
      },
    )
    return (
      res.data.result || {
        page: 0,
        size,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        content: [],
      }
    )
  },

  /**
   * Gửi tin nhắn mới qua REST API (fallback khi WS chưa sẵn sàng hoặc gửi file)
   */
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessage> {
    const res = await axiosInstance.post<ApiResponse<ChatMessage>>('/chat/messages', request)
    if (!res.data.result) {
      throw new Error(res.data.message || 'Failed to send message')
    }
    return res.data.result
  },

  /**
   * Đánh dấu toàn bộ tin nhắn trong hội thoại là đã đọc
   */
  async markAsRead(conversationId: number): Promise<void> {
    await axiosInstance.patch<ApiResponse<void>>(`/chat/conversations/${conversationId}/read`)
  },

  /**
   * Lấy tổng số lượng tin nhắn chưa đọc của người dùng
   */
  async getUnreadCount(): Promise<number> {
    const res = await axiosInstance.get<ApiResponse<{ unreadCount: number }>>('/chat/unread-count')
    return res.data?.result?.unreadCount ?? 0
  },

  /**
   * Xóa tin nhắn do chính mình gửi đi
   */
  async deleteMessage(messageId: number): Promise<void> {
    await axiosInstance.delete<ApiResponse<void>>(`/chat/messages/${messageId}`)
  },
}
