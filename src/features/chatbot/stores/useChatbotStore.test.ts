import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/chatbot.service', () => ({
  chatbotService: {
    sendMessage: vi.fn(),
    getChatHistory: vi.fn(),
    clearChatHistory: vi.fn(),
  },
}))

import { queryClient } from '@/app/providers/queryClient'
import { chatbotService, type AiItemOption, type ChatbotMessageResponse } from '@/services/chatbot.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatbotStore } from './useChatbotStore'

const mockService = vi.mocked(chatbotService)

const item = (itemId: number, name: string, extra: Partial<AiItemOption> = {}): AiItemOption => ({
  itemType: 'PRODUCT',
  itemId,
  name,
  ...extra,
})

const res = (type: ChatbotMessageResponse['type'], extra: Partial<ChatbotMessageResponse> = {}) =>
  ({ type, message: '', ...extra }) as ChatbotMessageResponse

const lastMessage = () => useChatbotStore.getState().messages.at(-1)!

const loginAs = (id: string) =>
  useAuthStore.setState({ user: { id, name: 'A', email: 'a@x.vn', role: 'buyer' }, token: 't' })

describe('useChatbotStore', () => {
  let invalidate: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, token: null })
    useChatbotStore.getState().reset()
    invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
  })

  describe('addMultipleToCart', () => {
    it('báo thành công khi tất cả các món vào giỏ', async () => {
      mockService.sendMessage.mockResolvedValue(res('CART_UPDATED'))

      const added = await useChatbotStore.getState().addMultipleToCart([item(1, 'Cà chua'), item(2, 'Rau muống')])

      expect(added).toBe(2)
      expect(lastMessage().content).toContain('Đã thêm 2 món')
      expect(lastMessage().navigation?.url).toBe('/cart')
      expect(invalidate).toHaveBeenCalledTimes(1)
    })

    it('liệt kê món lỗi khi chỉ thêm được một phần, kể cả lỗi trả về với HTTP 200', async () => {
      mockService.sendMessage
        .mockResolvedValueOnce(res('CART_UPDATED'))
        .mockResolvedValueOnce(res('ERROR', { message: 'Hết hàng' }))
        .mockRejectedValueOnce(new Error('mạng lỗi'))

      const added = await useChatbotStore
        .getState()
        .addMultipleToCart([item(1, 'Cà chua'), item(2, 'Rau muống'), item(3, 'Gừng')])

      expect(added).toBe(1)
      expect(lastMessage().content).toContain('1/3')
      expect(lastMessage().content).toContain('Rau muống, Gừng')
    })

    it('không báo thành công và không tải lại giỏ khi không món nào vào giỏ', async () => {
      mockService.sendMessage.mockResolvedValue(res('ERROR', { message: 'Không thể thêm vào giỏ hàng' }))

      const added = await useChatbotStore.getState().addMultipleToCart([item(1, 'Cà chua')])

      expect(added).toBe(0)
      expect(lastMessage().status).toBe('error')
      expect(lastMessage().content).toBe('Không thể thêm vào giỏ hàng')
      expect(invalidate).not.toHaveBeenCalled()
    })

    it('giữ nút đăng nhập khi khách chưa đăng nhập bấm thêm giỏ', async () => {
      const navigation = { url: '/login', label: 'Đăng nhập' }
      mockService.sendMessage.mockResolvedValue(res('NAVIGATION', { message: 'Vui lòng đăng nhập', navigation }))

      await useChatbotStore.getState().addMultipleToCart([item(1, 'Cà chua')])

      expect(lastMessage().status).toBe('sent')
      expect(lastMessage().navigation).toEqual(navigation)
    })

    it('bỏ qua món hết hàng và mở khóa isLoading sau khi xong', async () => {
      mockService.sendMessage.mockResolvedValue(res('CART_UPDATED'))

      await useChatbotStore.getState().addMultipleToCart([item(1, 'Cà chua'), item(2, 'Gừng', { isOutOfStock: true })])

      expect(mockService.sendMessage).toHaveBeenCalledTimes(1)
      expect(useChatbotStore.getState().isLoading).toBe(false)
    })
  })

  describe('clearHistory', () => {
    it('giữ nguyên hội thoại và ném lỗi khi API thất bại', async () => {
      loginAs('1')
      mockService.sendMessage.mockResolvedValue(res('TEXT', { message: 'Chào' }))
      await useChatbotStore.getState().sendMessage('Xin chào')
      const before = useChatbotStore.getState().messages
      mockService.clearChatHistory.mockRejectedValue(new Error('lỗi'))

      await expect(useChatbotStore.getState().clearHistory()).rejects.toThrow('lỗi')

      expect(useChatbotStore.getState().messages).toEqual(before)
    })

    it('xóa hội thoại khi API thành công', async () => {
      loginAs('1')
      mockService.sendMessage.mockResolvedValue(res('TEXT', { message: 'Chào' }))
      await useChatbotStore.getState().sendMessage('Xin chào')
      mockService.clearChatHistory.mockResolvedValue()

      await useChatbotStore.getState().clearHistory()

      expect(useChatbotStore.getState().messages).toHaveLength(1)
      expect(lastMessage().id).toBe('welcome-msg')
    })

    it('khách chưa đăng nhập chỉ xóa tại máy, không gọi API', async () => {
      await useChatbotStore.getState().clearHistory()

      expect(mockService.clearChatHistory).not.toHaveBeenCalled()
    })
  })

  describe('reset khi đổi tài khoản', () => {
    it('xóa tin nhắn của tài khoản trước', async () => {
      mockService.sendMessage.mockResolvedValue(res('TEXT', { message: 'Đơn #1 của bạn' }))
      await useChatbotStore.getState().sendMessage('Đơn của tôi')

      useChatbotStore.getState().reset()

      expect(useChatbotStore.getState().messages).toHaveLength(1)
      expect(lastMessage().id).toBe('welcome-msg')
    })

    it('bỏ phản hồi về muộn của tài khoản trước', async () => {
      let resolve!: (value: ChatbotMessageResponse) => void
      mockService.sendMessage.mockReturnValue(new Promise((r) => (resolve = r)))
      const pending = useChatbotStore.getState().sendMessage('Đơn của tôi')

      useChatbotStore.getState().reset()
      resolve(res('TEXT', { message: 'Đơn #1 của bạn' }))
      await pending

      expect(useChatbotStore.getState().messages).toHaveLength(1)
      expect(useChatbotStore.getState().isLoading).toBe(false)
    })

    it('bỏ lịch sử về muộn của tài khoản trước', async () => {
      let resolve!: (value: never[]) => void
      mockService.getChatHistory.mockReturnValue(new Promise((r) => (resolve = r)))
      const pending = useChatbotStore.getState().loadHistory()

      useChatbotStore.getState().reset()
      resolve([{ id: 1, role: 'user', content: 'cũ', createdAt: '2026-01-01T00:00:00' }] as never[])
      await pending

      expect(lastMessage().id).toBe('welcome-msg')
    })
  })
})
