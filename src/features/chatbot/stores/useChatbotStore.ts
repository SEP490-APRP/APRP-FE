import { create } from 'zustand'
import {
  chatbotService,
  type AiCartPreview,
  type AiCheckoutDraft,
  type AiItemOption,
  type AiNavigationAction,
  type AiResponseType,
  type BudgetComboDto,
  type ChatbotMessageResponse,
  type HumanHandoverDto,
  type MysteryBoxQaDto,
  type OrderCancelDto,
  type OrderTrackingDto,
  type PreservationTipDto,
  type RecipeSuggestionDto,
  type ReturnGuidanceDto,
  type RoleGuidanceDto,
  type ShippingTipDto,
  type VoucherItemDto,
  type ReorderDto,
  type FlashRescueDto,
  type MealPlanBridgeDto,
  type SeasonalCalendarDto,
  type GreenImpactDto,
  type PaymentAssistanceDto,
  type WalletInfoDto,
  type UpdateShippingInfoDto,
} from '@/services/chatbot.service'
import { queryClient } from '@/app/providers/queryClient'
import { cartKeys } from '@/features/cart/hooks/useCartQueries'
import { useAuthStore } from '@/stores/useAuthStore'

export interface ChatbotMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: Date
  status: 'sent' | 'sending' | 'error'
  responseType?: AiResponseType
  itemOptions?: AiItemOption[]
  selectedProduct?: AiItemOption
  cart?: AiCartPreview
  checkout?: AiCheckoutDraft
  navigation?: AiNavigationAction

  // 12 Enhanced fields
  orderTracking?: OrderTrackingDto
  returnGuidance?: ReturnGuidanceDto
  orderCancel?: OrderCancelDto
  budgetCombo?: BudgetComboDto
  recipe?: RecipeSuggestionDto
  mysteryBoxQa?: MysteryBoxQaDto
  vouchers?: VoucherItemDto[]
  shippingTips?: ShippingTipDto
  preservationTips?: PreservationTipDto[]
  humanHandover?: HumanHandoverDto
  roleGuidance?: RoleGuidanceDto

  // 8 Extended fields
  reorder?: ReorderDto
  flashRescue?: FlashRescueDto
  mealPlanBridge?: MealPlanBridgeDto
  seasonalCalendar?: SeasonalCalendarDto
  greenImpact?: GreenImpactDto
  paymentAssistance?: PaymentAssistanceDto
  walletInfo?: WalletInfoDto
  updateShippingInfo?: UpdateShippingInfoDto
}

interface ChatbotState {
  isOpen: boolean
  isLoading: boolean
  unreadCount: number
  messages: ChatbotMessage[]
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  clearUnread: () => void
  sendMessage: (text: string) => Promise<void>
  selectOption: (item: AiItemOption, quantity?: number) => Promise<void>
  /** Trả về số món thực sự vào giỏ để thẻ gọi không báo thành công sai. */
  addMultipleToCart: (items: AiItemOption[]) => Promise<number>
  loadHistory: () => Promise<void>
  /** Ném lỗi khi API thất bại và giữ nguyên hội thoại để nơi gọi báo cho người dùng. */
  clearHistory: () => Promise<void>
  /** Đưa về hội thoại mới khi đổi tài khoản, không gọi API. */
  reset: () => void
}

const INITIAL_WELCOME: ChatbotMessage = {
  id: 'welcome-msg',
  sender: 'assistant',
  content:
    'Chào bạn! Mình là **CapNong Copilot** 🌱\n\nMình có thể hỗ trợ bạn:\n- 🚚 **Tra cứu đơn hàng** & vị trí shipper thời gian thực\n- 🛡️ **Hướng dẫn đổi trả 24h** khi nông sản bị dập úng\n- 💰 **Gợi ý combo rau củ theo ngân sách** (100k, 150k)\n- 🍲 **Tư vấn công thức nấu ăn** từ nguyên liệu sẵn có\n- 🎟️ **Tìm mã giảm giá & freeship** hôm nay\n- 👩‍💼 **Kết nối hỗ trợ CSKH** và trò chuyện trực tiếp với nhà vườn!',
  timestamp: new Date(),
  status: 'sent',
  responseType: 'TEXT',
}

/** Tăng mỗi khi hội thoại bị thay thế để bỏ các phản hồi về muộn của hội thoại cũ. */
let conversationVersion = 0

export const useChatbotStore = create<ChatbotState>((set, get) => ({
  isOpen: false,
  isLoading: false,
  unreadCount: 0,
  messages: [INITIAL_WELCOME],

  toggleOpen: () => {
    const next = !get().isOpen
    set({ isOpen: next })
    if (next) {
      set({ unreadCount: 0 })
    }
  },

  setOpen: (open: boolean) => {
    set({ isOpen: open })
    if (open) {
      set({ unreadCount: 0 })
    }
  },

  clearUnread: () => set({ unreadCount: 0 }),

  reset: () => {
    conversationVersion += 1
    set({ isOpen: false, isLoading: false, unreadCount: 0, messages: [INITIAL_WELCOME] })
  },

  loadHistory: async () => {
    const version = conversationVersion
    try {
      const history = await chatbotService.getChatHistory()
      if (version !== conversationVersion) return
      if (history && history.length > 0) {
        const mapped: ChatbotMessage[] = history.map((item) => ({
          id: `hist-${item.id}`,
          sender: item.role === 'user' ? 'user' : 'assistant',
          content: item.content,
          timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
          status: 'sent',
          responseType: 'TEXT',
        }))
        set({ messages: mapped })
      }
    } catch {
      // Ignored if unauthenticated or error
    }
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || get().isLoading) return

    const version = conversationVersion
    const userMsgId = `usr-${Date.now()}`
    const userMsg: ChatbotMessage = {
      id: userMsgId,
      sender: 'user',
      content: trimmed,
      timestamp: new Date(),
      status: 'sent',
    }

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
    }))

    try {
      const res = await chatbotService.sendMessage({ message: trimmed })
      if (version !== conversationVersion) return

      const botMsgId = `bot-${Date.now()}`
      const botMsg: ChatbotMessage = {
        id: botMsgId,
        sender: 'assistant',
        content: res.message || '',
        timestamp: res.timestamp ? new Date(res.timestamp) : new Date(),
        status: 'sent',
        responseType: res.type,
        itemOptions: res.itemOptions,
        selectedProduct: res.selectedProduct,
        cart: res.cart,
        checkout: res.checkout,
        navigation: res.navigation,
        orderTracking: res.orderTracking,
        returnGuidance: res.returnGuidance,
        orderCancel: res.orderCancel,
        budgetCombo: res.budgetCombo,
        recipe: res.recipe,
        mysteryBoxQa: res.mysteryBoxQa,
        vouchers: res.vouchers,
        shippingTips: res.shippingTips,
        preservationTips: res.preservationTips,
        humanHandover: res.humanHandover,
        roleGuidance: res.roleGuidance,
        reorder: res.reorder,
        flashRescue: res.flashRescue,
        mealPlanBridge: res.mealPlanBridge,
        seasonalCalendar: res.seasonalCalendar,
        greenImpact: res.greenImpact,
        paymentAssistance: res.paymentAssistance,
        walletInfo: res.walletInfo,
        updateShippingInfo: res.updateShippingInfo,
      }

      if (res.type === 'CART_UPDATED' || res.cart) {
        queryClient.invalidateQueries({ queryKey: cartKeys.all })
      }

      set((state) => ({
        messages: [...state.messages, botMsg],
        isLoading: false,
        unreadCount: state.isOpen ? 0 : state.unreadCount + 1,
      }))
    } catch (err: unknown) {
      if (version !== conversationVersion) return
      const errorMsg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại!'
      const botErrorMsg: ChatbotMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
        status: 'error',
        responseType: 'ERROR',
      }

      set((state) => ({
        messages: [...state.messages, botErrorMsg],
        isLoading: false,
      }))
    }
  },

  selectOption: async (item: AiItemOption, quantity: number = 1) => {
    if (get().isLoading) return

    const version = conversationVersion
    const userChoiceMsg: ChatbotMessage = {
      id: `usr-choice-${Date.now()}`,
      sender: 'user',
      content: `Chọn mua: ${item.name} (${quantity} ${item.unit || 'phần'})`,
      timestamp: new Date(),
      status: 'sent',
    }

    set((state) => ({
      messages: [...state.messages, userChoiceMsg],
      isLoading: true,
    }))

    try {
      const res = await chatbotService.sendMessage({
        selectedOptionId: item.itemId,
        selectedOptionType: item.itemType,
        selectedQuantity: quantity,
      })
      if (version !== conversationVersion) return

      const botMsg: ChatbotMessage = {
        id: `bot-opt-${Date.now()}`,
        sender: 'assistant',
        content: res.message || '',
        timestamp: res.timestamp ? new Date(res.timestamp) : new Date(),
        status: 'sent',
        responseType: res.type,
        itemOptions: res.itemOptions,
        selectedProduct: res.selectedProduct,
        cart: res.cart,
        checkout: res.checkout,
        navigation: res.navigation,
        orderTracking: res.orderTracking,
        returnGuidance: res.returnGuidance,
        orderCancel: res.orderCancel,
        budgetCombo: res.budgetCombo,
        recipe: res.recipe,
        mysteryBoxQa: res.mysteryBoxQa,
        vouchers: res.vouchers,
        shippingTips: res.shippingTips,
        preservationTips: res.preservationTips,
        humanHandover: res.humanHandover,
        roleGuidance: res.roleGuidance,
        reorder: res.reorder,
        flashRescue: res.flashRescue,
        mealPlanBridge: res.mealPlanBridge,
        seasonalCalendar: res.seasonalCalendar,
        greenImpact: res.greenImpact,
        paymentAssistance: res.paymentAssistance,
        walletInfo: res.walletInfo,
        updateShippingInfo: res.updateShippingInfo,
      }

      if (res.type === 'CART_UPDATED' || res.cart) {
        queryClient.invalidateQueries({ queryKey: cartKeys.all })
      }

      set((state) => ({
        messages: [...state.messages, botMsg],
        isLoading: false,
      }))
    } catch (err: unknown) {
      if (version !== conversationVersion) return
      const errorMsg = err instanceof Error ? err.message : 'Không thể chọn sản phẩm này.'
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `err-opt-${Date.now()}`,
            sender: 'assistant',
            content: errorMsg,
            timestamp: new Date(),
            status: 'error',
            responseType: 'ERROR',
          },
        ],
        isLoading: false,
      }))
    }
  },

  addMultipleToCart: async (items: AiItemOption[]) => {
    const validItems = (items || []).filter((i) => !i.isOutOfStock)
    if (validItems.length === 0 || get().isLoading) return 0

    const version = conversationVersion
    set({ isLoading: true })

    const failedNames: string[] = []
    // BE báo thêm giỏ thất bại bằng type ERROR/NAVIGATION với HTTP 200, nên không chỉ dựa vào exception.
    let rejection: ChatbotMessageResponse | undefined
    for (const item of validItems) {
      try {
        const res = await chatbotService.sendMessage({
          selectedOptionId: item.itemId,
          selectedOptionType: item.itemType,
          selectedQuantity: item.orderQuantity || 1,
        })
        if (res.type !== 'CART_UPDATED') {
          failedNames.push(item.name)
          rejection ??= res
        }
      } catch {
        failedNames.push(item.name)
      }
      if (version !== conversationVersion) return 0
    }

    const addedCount = validItems.length - failedNames.length
    if (addedCount > 0) {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    }

    const summaryMsg: ChatbotMessage =
      addedCount > 0
        ? {
            id: `bot-bulk-${Date.now()}`,
            sender: 'assistant',
            content:
              failedNames.length === 0
                ? `🎉 Đã thêm ${addedCount} món nông sản vào giỏ hàng của bạn thành công!`
                : `Đã thêm ${addedCount}/${validItems.length} món vào giỏ hàng. Chưa thêm được: ${failedNames.join(', ')}.`,
            timestamp: new Date(),
            status: 'sent',
            responseType: 'NAVIGATION',
            navigation: {
              url: '/cart',
              label: 'Mở giỏ hàng ngay',
            },
          }
        : {
            id: `bot-bulk-${Date.now()}`,
            sender: 'assistant',
            content: rejection?.message || 'Chưa thêm được món nào vào giỏ hàng. Vui lòng thử lại!',
            timestamp: new Date(),
            status: rejection?.navigation ? 'sent' : 'error',
            responseType: rejection?.type ?? 'ERROR',
            navigation: rejection?.navigation,
          }

    set((state) => ({
      messages: [...state.messages, summaryMsg],
      isLoading: false,
    }))
    return addedCount
  },

  clearHistory: async () => {
    // Khách chưa đăng nhập không có lịch sử trên server; gọi API sẽ nhận 401 và phát event đăng xuất.
    if (useAuthStore.getState().user) {
      await chatbotService.clearChatHistory()
    }
    conversationVersion += 1
    set({ isLoading: false, messages: [INITIAL_WELCOME] })
  },
}))
