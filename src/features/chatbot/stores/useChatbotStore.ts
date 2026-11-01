import { create } from 'zustand'
import {
  chatbotService,
  type AiCartPreview,
  type AiCheckoutDraft,
  type AiItemOption,
  type AiNavigationAction,
  type AiResponseType,
  type BudgetComboDto,
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
  addMultipleToCart: (items: AiItemOption[]) => Promise<void>
  loadHistory: () => Promise<void>
  clearHistory: () => Promise<void>
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

  loadHistory: async () => {
    try {
      const history = await chatbotService.getChatHistory()
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
    if (validItems.length === 0 || get().isLoading) return

    for (const item of validItems) {
      try {
        await chatbotService.sendMessage({
          selectedOptionId: item.itemId,
          selectedOptionType: item.itemType,
          selectedQuantity: item.orderQuantity || 1,
        })
      } catch (err) {
        console.error('Failed to add item', item.name, err)
      }
    }

    queryClient.invalidateQueries({ queryKey: cartKeys.all })

    const successMsg: ChatbotMessage = {
      id: `bot-bulk-${Date.now()}`,
      sender: 'assistant',
      content: `🎉 Đã thêm ${validItems.length} món nông sản vào giỏ hàng của bạn thành công!`,
      timestamp: new Date(),
      status: 'sent',
      responseType: 'NAVIGATION',
      navigation: {
        url: '/cart',
        label: 'Mở giỏ hàng ngay',
      },
    }

    set((state) => ({
      messages: [...state.messages, successMsg],
      isLoading: false,
    }))
  },

  clearHistory: async () => {
    try {
      await chatbotService.clearChatHistory()
    } catch {
      // Ignored
    }
    set({ messages: [INITIAL_WELCOME] })
  },
}))
