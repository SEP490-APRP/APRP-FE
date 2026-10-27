import { create } from 'zustand'
import type { ChatMessage, Conversation, ChatNotification } from '@/types/chat'
import { chatApi } from '@/services/api/chat.api'
import { chatSocketService } from '@/services/websocket/chatSocket.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { playNotificationChime } from '@/utils/audio'

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<number, ChatMessage[]>
  unreadTotal: number
  typingUsers: Record<number, boolean>
  isWsConnected: boolean
  isOpen: boolean
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isChatViewActive: boolean

  // Actions
  initRealtime: (token?: string) => void
  disconnectRealtime: () => void
  loadConversations: () => Promise<void>
  loadUnreadCount: () => Promise<void>
  selectConversation: (conversation: Conversation | null) => Promise<void>
  startChatWithUser: (receiverId: number) => Promise<Conversation>
  sendMessage: (
    content: string,
    type?: string,
    attachmentUrl?: string,
    referenceId?: number,
  ) => Promise<void>
  sendTyping: (isTyping: boolean) => void
  markAsRead: (conversationId: number) => Promise<void>
  deleteMessage: (messageId: number, conversationId?: number) => Promise<void>
  setOpen: (open: boolean) => void
  setChatViewActive: (active: boolean) => void
  reset: () => void
}

let unbindMessage: (() => void) | null = null
let unbindNotification: (() => void) | null = null
let unbindTyping: (() => void) | null = null
let unbindConnection: (() => void) | null = null
let unbindReadReceipt: (() => void) | null = null

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  unreadTotal: 0,
  typingUsers: {},
  isWsConnected: false,
  isOpen: false,
  isChatViewActive: false,
  isLoadingConversations: false,
  isLoadingMessages: false,

  initRealtime: (token?: string) => {
    // Tránh đăng ký nhiều lần
    if (unbindMessage) unbindMessage()
    if (unbindNotification) unbindNotification()
    if (unbindTyping) unbindTyping()
    if (unbindConnection) unbindConnection()
    if (unbindReadReceipt) unbindReadReceipt()

    unbindConnection = chatSocketService.onConnectionChange((connected) => {
      set({ isWsConnected: connected })
    })

    // Lắng nghe tin nhắn mới
    // Lắng nghe tin nhắn mới
    unbindMessage = chatSocketService.onMessage((msg: ChatMessage) => {
      const convId = Number(msg.conversationId)
      if (!convId) return

      const currentUser = useAuthStore.getState().user
      const isFromMe = Number(msg.senderId) === Number(currentUser?.id)

      // Phát âm thanh chime thông báo nếu tin nhắn đến từ người khác
      if (!isFromMe) {
        playNotificationChime()
      }

      set((state) => {
        const currentMsgs = state.messages[convId] || []
        // Tránh trùng tin nhắn theo ID và thay thế tin nhắn lạc quan (optimistic)
        const filtered = currentMsgs.filter(
          (m) =>
            Number(m.id) !== Number(msg.id) &&
            !(
              Number(m.id) > 10000000000 &&
              m.content === msg.content &&
              (m.attachmentUrl || '') === (msg.attachmentUrl || '')
            )
        )
        const updatedMsgs = [...filtered, msg]

        // Chỉ coi là đang active nếu người dùng THỰC SỰ đang ở view chat và cửa sổ trình duyệt đang focus
        const isTabFocused =
          typeof document !== 'undefined' &&
          !document.hidden &&
          (typeof document.hasFocus !== 'function' || document.hasFocus())

        const isCurrentlyActive =
          state.isChatViewActive &&
          isTabFocused &&
          (Number(state.activeConversation?.id) === convId ||
            (state.activeConversation &&
              (Number(state.activeConversation.otherUserId) === Number(msg.senderId) ||
                Number(state.activeConversation.otherUserId) === Number(msg.receiverId))))

        let found = false
        let updatedActiveConv = state.activeConversation
        if (isCurrentlyActive && updatedActiveConv && Number(updatedActiveConv.id) !== convId) {
          updatedActiveConv = {
            ...updatedActiveConv,
            id: convId,
          }
        }

        const isAudio =
          msg.type?.toUpperCase() === 'AUDIO' ||
          msg.type?.toUpperCase() === 'VOICE' ||
          /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(msg.attachmentUrl || '')
        const isVideo =
          !isAudio &&
          (msg.type?.toUpperCase() === 'VIDEO' ||
            /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(msg.attachmentUrl || ''))
        const mediaPlaceholder = isAudio ? '[Tin nhắn thoại]' : isVideo ? '[Video]' : '[Hình ảnh]'

        const updatedConversations = state.conversations.map((c) => {
          if (
            Number(c.id) === convId ||
            Number(c.otherUserId) === Number(msg.senderId) ||
            Number(c.otherUserId) === Number(msg.receiverId)
          ) {
            found = true
            return {
              ...c,
              id: convId,
              lastMessage: msg.content || (msg.attachmentUrl ? mediaPlaceholder : ''),
              lastMessageTime: msg.createdAt || msg.sentAt || new Date().toISOString(),
              unreadCount: isFromMe || isCurrentlyActive ? 0 : (c.unreadCount || 0) + 1,
            }
          }
          return c
        })

        // Sắp xếp cuộc trò chuyện có tin nhắn mới nhất lên đầu
        updatedConversations.sort((a, b) => {
          const tA = new Date(a.lastMessageTime || a.lastMessageAt || 0).getTime()
          const tB = new Date(b.lastMessageTime || b.lastMessageAt || 0).getTime()
          return tB - tA
        })

        const calculatedUnread = updatedConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
        const newUnreadTotal = !found && !isCurrentlyActive && !isFromMe ? state.unreadTotal + 1 : calculatedUnread

        return {
          messages: {
            ...state.messages,
            [convId]: updatedMsgs,
          },
          conversations: updatedConversations,
          activeConversation: updatedActiveConv,
          unreadTotal: newUnreadTotal,
        }
      })

      // Nếu hội thoại chưa có trong state danh sách, gọi load lại hội thoại
      if (!get().conversations.some((c) => Number(c.id) === convId)) {
        get().loadConversations()
      }

      // CHỈ đánh dấu đã đọc khi THỰC SỰ đang mở xem và focus vào tab chat
      const isTabFocused =
        typeof document !== 'undefined' &&
        !document.hidden &&
        (typeof document.hasFocus !== 'function' || document.hasFocus())

      const isViewingNow =
        get().isChatViewActive &&
        isTabFocused &&
        get().activeConversation &&
        (Number(get().activeConversation?.id) === convId ||
          Number(get().activeConversation?.otherUserId) === Number(msg.senderId))

      if (isViewingNow) {
        get().markAsRead(convId)
      }
    })

    // Lắng nghe notification
    unbindNotification = chatSocketService.onNotification((notif: ChatNotification) => {
      if (typeof notif.unreadCount === 'number') {
        set({ unreadTotal: notif.unreadCount })
      }
      // Tải lại danh sách hội thoại nếu nhận tin nhắn mới từ người lạ
      if (notif.type === 'NEW_MESSAGE') {
        get().loadConversations()
      }

      // Cập nhật lại unread count khi có tin nhắn chưa đọc bị thu hồi / xóa
      if (notif.type === 'UNREAD_COUNT') {
        const convId = Number((notif as any).conversationId)
        const convUnread = Number((notif as any).conversationUnread ?? 0)
        const unreadTotal = Number((notif as any).unreadCount ?? 0)

        set((state) => ({
          unreadTotal,
          conversations: state.conversations.map((c) =>
            Number(c.id) === convId ? { ...c, unreadCount: convUnread } : c
          ),
        }))
      }

      // Xóa tin nhắn real-time khi đối phương hoặc người gửi xóa tin
      if (notif.type === 'DELETE_MESSAGE' && (notif as any).messageId) {
        const deletedId = Number((notif as any).messageId)
        const convId = Number((notif as any).conversationId)
        const newLastMsg = (notif as any).newLastMessage ?? ''
        const newLastTime = (notif as any).newLastMessageTime

        set((state) => {
          const currentMsgs = state.messages[convId] || []
          const filtered = currentMsgs.filter((m) => m.id !== deletedId)

          // Cập nhật lại lastMessage và lastMessageTime của hội thoại trong danh sách
          const updatedConversations = state.conversations.map((c) => {
            if (Number(c.id) === convId) {
              return {
                ...c,
                lastMessage: newLastMsg,
                lastMessageTime: newLastTime || c.lastMessageTime,
              }
            }
            return c
          })

          return {
            messages: {
              ...state.messages,
              [convId]: filtered,
            },
            conversations: updatedConversations,
          }
        })
      }
    })

    // Lắng nghe typing indicator
    unbindTyping = chatSocketService.onTyping(({ senderId, isTyping }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [senderId]: isTyping,
        },
      }))
    })

    // Lắng nghe read receipt cập nhật trạng thái "Đã xem" real-time
    unbindReadReceipt = chatSocketService.onReadReceipt(({ conversationId }) => {
      set((state) => {
        const msgs = state.messages[conversationId]
        if (!msgs || msgs.length === 0) return state

        const updated = msgs.map((m) => (m.isRead ? m : { ...m, isRead: true }))
        return {
          messages: {
            ...state.messages,
            [conversationId]: updated,
          },
        }
      })
    })

    // Kích hoạt kết nối
    chatSocketService.connect(token, () => {
      get().loadConversations()
      get().loadUnreadCount()
    })
  },

  disconnectRealtime: () => {
    if (unbindMessage) {
      unbindMessage()
      unbindMessage = null
    }
    if (unbindNotification) {
      unbindNotification()
      unbindNotification = null
    }
    if (unbindTyping) {
      unbindTyping()
      unbindTyping = null
    }
    if (unbindConnection) {
      unbindConnection()
      unbindConnection = null
    }
    if (unbindReadReceipt) {
      unbindReadReceipt()
      unbindReadReceipt = null
    }
    chatSocketService.disconnect()
    set({ isWsConnected: false })
  },

  reset: () => {
    get().disconnectRealtime()
    set({
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
  },

  loadConversations: async () => {
    try {
      set({ isLoadingConversations: true })
      const list = await chatApi.getConversations()

      // Deduplicate theo otherUserId để loại bỏ triệt để các hội thoại trùng lặp
      const uniqueMap = new Map<number, Conversation>()
      list.forEach((c) => {
        const otherId = Number(c.otherUserId)
        if (!uniqueMap.has(otherId)) {
          uniqueMap.set(otherId, c)
        } else {
          const existing = uniqueMap.get(otherId)!
          const existingTime = new Date(existing.lastMessageTime || existing.lastMessageAt || 0).getTime()
          const currTime = new Date(c.lastMessageTime || c.lastMessageAt || 0).getTime()
          if (currTime > existingTime) {
            uniqueMap.set(otherId, {
              ...c,
              unreadCount: (c.unreadCount || 0) + (existing.unreadCount || 0),
            })
          } else {
            uniqueMap.set(otherId, {
              ...existing,
              unreadCount: (existing.unreadCount || 0) + (c.unreadCount || 0),
            })
          }
        }
      })
      const uniqueList = Array.from(uniqueMap.values())

      // Luôn đảm bảo tài khoản Shop và Người mua (Buyer) có sẵn liên hệ Ban Quản Trị (Admin)
      const hasAdmin = uniqueList.some(
        (c) => c.otherUserRole?.toUpperCase() === 'ADMIN' || Number(c.otherUserId) === 1,
      )
      const currentUser = useAuthStore.getState().user
      const isCurrentAdmin = currentUser?.role?.toLowerCase() === 'admin'

      if (!hasAdmin && !isCurrentAdmin && currentUser) {
        const adminFallback: Conversation = {
          id: -1,
          otherUserId: 1,
          otherUserName: 'Ban Quản Trị CapNong',
          otherUserAvatar:
            'https://res.cloudinary.com/dfp44sbsj/image/upload/v1774252968/brands/vxm3b2gvixlqzf7xocoy.jpg',
          otherUserRole: 'ADMIN',
          lastMessage: 'Kênh hỗ trợ chính thức sàn CapNong 24/7',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        }
        uniqueList.unshift(adminFallback)
      }

      // Sắp xếp hội thoại có tin nhắn mới nhất lên đầu
      uniqueList.sort((a, b) => {
        const tA = new Date(a.lastMessageTime || a.lastMessageAt || 0).getTime()
        const tB = new Date(b.lastMessageTime || b.lastMessageAt || 0).getTime()
        return tB - tA
      })

      const totalUnread = uniqueList.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

      // Đồng bộ lại activeConversation nếu đang mở
      const currentActive = get().activeConversation
      let updatedActive = currentActive
      if (currentActive) {
        const found = uniqueList.find(
          (c) =>
            Number(c.id) === Number(currentActive.id) ||
            Number(c.otherUserId) === Number(currentActive.otherUserId),
        )
        if (found) {
          updatedActive = found
        }
      }

      set({ conversations: uniqueList, unreadTotal: totalUnread, activeConversation: updatedActive })
    } catch (err) {
      console.warn('[useChatStore] Failed to load conversations:', err)
    } finally {
      set({ isLoadingConversations: false })
    }
  },

  loadUnreadCount: async () => {
    try {
      const count = await chatApi.getUnreadCount()
      set({ unreadTotal: count })
    } catch (err) {
      console.warn('[useChatStore] Failed to load unread count:', err)
    }
  },

  selectConversation: async (conversation: Conversation | null) => {
    if (!conversation) {
      set({ activeConversation: null, isLoadingMessages: false })
      return
    }

    let conv = conversation

    // Nếu là liên hệ Admin khởi tạo phía client chưa có ID thực trên server
    if (Number(conv.id) <= 0 && conv.otherUserId) {
      try {
        const realConv = await chatApi.initConversation(conv.otherUserId)
        if (realConv && realConv.id) {
          conv = realConv
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.otherUserId === conv.otherUserId ? realConv : c,
            ),
          }))
        }
      } catch (e) {
        console.warn('[useChatStore] Init real conversation for admin error:', e)
      }
    }

    const convId = Number(conv.id)
    set({ activeConversation: conv })

    if (convId > 0) {
      try {
        set({ isLoadingMessages: true })
        const res = await chatApi.getMessages(convId, 0, 50)
        const sorted = (res.content || []).slice().reverse()
        set((state) => ({
          messages: {
            ...state.messages,
            [convId]: sorted,
          },
        }))
        await get().markAsRead(convId)
      } catch (err) {
        console.error('[useChatStore] Failed to load conversation messages:', err)
      } finally {
        set({ isLoadingMessages: false })
      }
    } else {
      set((state) => ({
        messages: {
          ...state.messages,
          [convId]: [],
        },
        isLoadingMessages: false,
      }))
    }
  },

  startChatWithUser: async (receiverId: number) => {
    try {
      const conv = await chatApi.initConversation(receiverId)
      // Thêm hoặc cập nhật trong state.conversations, bảo đảm không bị trùng otherUserId lẫn id
      set((state) => {
        const remaining = state.conversations.filter(
          (c) =>
            Number(c.id) !== Number(conv.id) &&
            Number(c.otherUserId) !== Number(conv.otherUserId),
        )
        return {
          conversations: [conv, ...remaining],
          isOpen: true,
        }
      })
      await get().selectConversation(conv)
      return conv
    } catch (err) {
      console.error('[useChatStore] Failed to start chat with user:', err)
      throw err
    }
  },

  sendMessage: async (
    content: string,
    type: string = 'TEXT',
    attachmentUrl?: string,
    referenceId?: number,
  ) => {
    const active = get().activeConversation
    const trimmed = content.trim()
    if (!active || (!trimmed && !attachmentUrl)) return

    const receiverId = Number(active.otherUserId)

    let currentConv = active
    if (Number(currentConv.id) <= 0 && receiverId) {
      try {
        const realConv = await chatApi.initConversation(receiverId)
        if (realConv && realConv.id) {
          currentConv = realConv
          set((state) => ({
            conversations: state.conversations.map((c) =>
              Number(c.otherUserId) === receiverId ? realConv : c,
            ),
            activeConversation: realConv,
          }))
        }
      } catch (e) {
        console.warn('[useChatStore] Init real conversation error in sendMessage:', e)
      }
    }

    const isAudio =
      type?.toUpperCase() === 'AUDIO' ||
      type?.toUpperCase() === 'VOICE' ||
      (attachmentUrl ? /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(attachmentUrl) : false)
    const isVideo =
      !isAudio &&
      (type?.toUpperCase() === 'VIDEO' ||
        (attachmentUrl ? /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(attachmentUrl) : false))
    const msgType = attachmentUrl
      ? isAudio
        ? 'AUDIO'
        : isVideo
          ? 'VIDEO'
          : type === 'TEXT'
            ? 'IMAGE'
            : type
      : type
    const mediaPlaceholder = isAudio ? '[Tin nhắn thoại]' : isVideo ? '[Video]' : '[Hình ảnh]'

    const payload = {
      receiverId,
      content: trimmed || (attachmentUrl ? mediaPlaceholder : ''),
      type: msgType,
      attachmentUrl,
      referenceId,
    }

    const convId = Number(currentConv.id)
    const optimisticId = Date.now()
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      conversationId: convId,
      senderId: Number(useAuthStore.getState().user?.id || 0),
      receiverId,
      content: trimmed || (attachmentUrl ? mediaPlaceholder : ''),
      type: msgType,
      attachmentUrl,
      referenceId,
      sentAt: new Date().toISOString(),
      isRead: false,
    }

    // Hiển thị lạc quan ngay tức thì (0ms) trên UI để người dùng thấy tin nhắn ngay lập tức
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: [...(state.messages[convId] || []), optimisticMsg],
      },
      conversations: state.conversations.map((c) =>
        Number(c.id) === convId
          ? {
            ...c,
            lastMessage: optimisticMsg.content,
            lastMessageTime: optimisticMsg.sentAt,
          }
          : c
      ),
    }))

    // Gửi qua WebSocket trước
    if (get().isWsConnected) {
      const sent = chatSocketService.sendMessage(payload)
      if (sent) return
    }

    // Fallback qua REST
    try {
      const sentMsg = await chatApi.sendMessage(payload)
      set((state) => {
        const current = state.messages[convId] || []
        const replaced = current.map((m) => (m.id === optimisticId ? sentMsg : m))
        return {
          messages: {
            ...state.messages,
            [convId]: replaced,
          },
        }
      })
    } catch (err) {
      console.error('[useChatStore] Failed to send message:', err)
    }
  },

  sendTyping: (isTyping: boolean) => {
    const active = get().activeConversation
    if (!active) return
    chatSocketService.sendTyping(active.otherUserId, isTyping)
  },

  markAsRead: async (conversationId: number) => {
    try {
      chatSocketService.sendRead(conversationId)
      await chatApi.markAsRead(conversationId)

      set((state) => {
        const updatedConversations = state.conversations.map((c) =>
          Number(c.id) === conversationId ? { ...c, unreadCount: 0 } : c,
        )
        const newTotal = updatedConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
        return {
          conversations: updatedConversations,
          unreadTotal: newTotal,
        }
      })
    } catch (err) {
      console.warn('[useChatStore] Failed to mark as read:', err)
    }
  },

  deleteMessage: async (messageId: number, conversationId?: number) => {
    const activeConv = get().activeConversation
    const convId = conversationId || (activeConv ? Number(activeConv.id) : null)

    // Xóa ngay lập tức khỏi state để UI phản hồi tức thì (Optimistic UI)
    if (convId) {
      set((state) => {
        const currentMsgs = state.messages[convId] || []
        const filtered = currentMsgs.filter((m) => m.id !== messageId)
        const lastMsg = filtered[filtered.length - 1]
        const isVideo =
          lastMsg?.type?.toUpperCase() === 'VIDEO' ||
          /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(lastMsg?.attachmentUrl || '')
        const mediaPlaceholder = isVideo ? '[Video]' : '[Hình ảnh]'
        const newLastContent = lastMsg
          ? lastMsg.content || (lastMsg.attachmentUrl ? mediaPlaceholder : '')
          : ''

        const updatedConversations = state.conversations.map((c) =>
          Number(c.id) === convId
            ? {
              ...c,
              lastMessage: newLastContent,
              lastMessageTime: lastMsg?.createdAt || lastMsg?.sentAt || c.lastMessageTime,
            }
            : c
        )

        return {
          messages: {
            ...state.messages,
            [convId]: filtered,
          },
          conversations: updatedConversations,
        }
      })
    }

    try {
      await chatApi.deleteMessage(messageId)
    } catch (err) {
      console.error('[useChatStore] Failed to delete message:', err)
      if (activeConv) {
        get().selectConversation(activeConv)
      }
      throw err
    }
  },

  setOpen: (open: boolean) => {
    set({ isOpen: open })
  },

  setChatViewActive: (active: boolean) => {
    set({ isChatViewActive: active })
    // Nếu vừa kích hoạt lại view chat và đang có activeConversation, đánh dấu đã đọc
    if (active) {
      const conv = get().activeConversation
      if (conv && Number(conv.id) > 0) {
        get().markAsRead(Number(conv.id))
      }
    }
  },

  reset: () => {
    get().disconnectRealtime()
    set({
      conversations: [],
      activeConversation: null,
      messages: {},
      unreadTotal: 0,
      typingUsers: {},
      isWsConnected: false,
      isOpen: false,
      isChatViewActive: false,
      isLoadingConversations: false,
      isLoadingMessages: false,
    })
  },
}))
