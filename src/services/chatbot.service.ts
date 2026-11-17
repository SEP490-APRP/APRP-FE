import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse } from '@/types'
import type {
  ChatbotMessageRequest,
  ChatbotMessageResponse,
  ChatHistoryItem,
  BotKnowledgeItem,
} from './chatbot.types'

export * from './chatbot.types'

export const chatbotService = {
  /**
   * Gửi tin nhắn hoặc lựa chọn sản phẩm tới AI Chatbot Copilot
   */
  async sendMessage(req: ChatbotMessageRequest): Promise<ChatbotMessageResponse> {
    const res = await axiosInstance.post<ApiResponse<ChatbotMessageResponse>>('/chatbot/message', req)
    if (!res.data?.result) {
      throw new Error(res.data?.message || 'Không nhận được phản hồi từ AI Copilot')
    }
    return res.data.result
  },

  /**
   * Lấy lịch sử hội thoại của người dùng đã đăng nhập
   */
  async getChatHistory(): Promise<ChatHistoryItem[]> {
    try {
      const res = await axiosInstance.get<ApiResponse<ChatHistoryItem[]>>('/chatbot/history')
      return res.data?.result || []
    } catch {
      return []
    }
  },

  /**
   * Xóa lịch sử trò chuyện
   */
  async clearChatHistory(): Promise<void> {
    await axiosInstance.delete('/chatbot/history')
  },

  /**
   * Admin: Lấy danh sách kiến thức Bot
   */
  async getAdminKnowledge(type?: string): Promise<BotKnowledgeItem[]> {
    const res = await axiosInstance.get<ApiResponse<BotKnowledgeItem[]>>('/admin/bot-knowledge', {
      params: type ? { type } : undefined,
    })
    return res.data?.result || []
  },

  /**
   * Admin: Tạo mới kiến thức Bot
   */
  async createKnowledge(data: Partial<BotKnowledgeItem>): Promise<BotKnowledgeItem> {
    const res = await axiosInstance.post<ApiResponse<BotKnowledgeItem>>('/admin/bot-knowledge', data)
    return res.data.result!
  },

  /**
   * Admin: Cập nhật kiến thức Bot
   */
  async updateKnowledge(id: number, data: Partial<BotKnowledgeItem>): Promise<BotKnowledgeItem> {
    const res = await axiosInstance.put<ApiResponse<BotKnowledgeItem>>(`/admin/bot-knowledge/${id}`, data)
    return res.data.result!
  },

  /**
   * Admin: Xóa kiến thức Bot
   */
  async deleteKnowledge(id: number): Promise<void> {
    await axiosInstance.delete(`/admin/bot-knowledge/${id}`)
  },
}
