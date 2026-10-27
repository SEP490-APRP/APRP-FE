import React, { useEffect, useMemo, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '@/stores'
import { useChatStore } from '@/stores/useChatStore'
import { TOKEN_KEY } from '@/services/api.config'
import type { Conversation } from '@/types/chat'
import { ChatConversationList } from './ChatConversationList'
import { ChatHeader } from './ChatHeader'
import { ChatMessageList } from './ChatMessageList'
import { ChatInputBar } from './ChatInputBar'

export interface ChatWorkspaceProps {
  currentUserRole?: 'BUYER' | 'SHOP' | 'ADMIN'
  canModerateAnyMessage?: boolean
  targetChatId?: string | null
  storageKeyPrefix?: string
  sidebarTitle?: string
  renderHeaderActions?: (activeConversation: Conversation) => React.ReactNode
  className?: string
  sidebarWidthClass?: string
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  canModerateAnyMessage = false,
  targetChatId,
  storageKeyPrefix = 'chat',
  sidebarTitle = 'HỘI THOẠI GẦN ĐÂY',
  renderHeaderActions,
  className = 'h-full flex overflow-hidden rounded-lg bg-white border border-[#e8ece3] shadow-xs',
  sidebarWidthClass = 'w-72 sm:w-80',
}) => {
  const { user, token } = useAuth()
  const {
    conversations,
    activeConversation,
    messages: allMessages,
    isLoadingConversations,
    isLoadingMessages,
    typingUsers,
    loadConversations,
    selectConversation,
    sendMessage,
    sendTyping,
    deleteMessage,
    initRealtime,
    setChatViewActive,
  } = useChatStore()

  // Bật trạng thái đang xem chat toàn cục để tránh trùng thông báo
  useEffect(() => {
    setChatViewActive(true)
    return () => {
      setChatViewActive(false)
    }
  }, [setChatViewActive])

  // Khởi tạo kết nối STOMP toàn cục
  useEffect(() => {
    const activeToken =
      token ||
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token')

    if (activeToken) {
      initRealtime(activeToken)
    }
    loadConversations()
  }, [token, initRealtime, loadConversations])

  // Khôi phục hội thoại đã chọn trước đó hoặc chọn theo targetChatId / hội thoại đầu tiên
  useEffect(() => {
    if (conversations.length === 0) return

    // 1. Ưu tiên targetChatId nếu được truyền vào
    if (targetChatId) {
      const found = conversations.find(
        (c) => String(c.id) === targetChatId || String(c.otherUserId) === targetChatId,
      )
      if (found) {
        selectConversation(found)
        return
      }
    }

    // 2. Kiểm tra sessionStorage
    const savedConvId = sessionStorage.getItem(`${storageKeyPrefix}_selected_chat_id`)
    if (!activeConversation) {
      if (savedConvId) {
        const found = conversations.find(
          (c) => String(c.id) === savedConvId || String(c.otherUserId) === savedConvId,
        )
        if (found) {
          selectConversation(found)
          return
        }
      }
      // 3. Mặc định chọn hội thoại đầu tiên
      selectConversation(conversations[0])
    }
  }, [conversations, targetChatId, activeConversation, selectConversation, storageKeyPrefix])

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      sendTyping(false)
      sessionStorage.setItem(`${storageKeyPrefix}_selected_chat_id`, String(conv.id))
      selectConversation(conv)
    },
    [selectConversation, sendTyping, storageKeyPrefix],
  )

  // Danh sách tin nhắn của hội thoại hiện tại
  const activeConvId = activeConversation ? Number(activeConversation.id) : null
  const currentMessages = useMemo(() => {
    return activeConvId ? allMessages[activeConvId] || [] : []
  }, [activeConvId, allMessages])

  // Kiểm tra đối phương có đang soạn tin không
  const isOtherTyping = useMemo(() => {
    if (!activeConversation) return false
    return Boolean(
      typingUsers[activeConversation.otherUserId] ||
        typingUsers[Number(activeConversation.otherUserId)] ||
        typingUsers[String(activeConversation.otherUserId)],
    )
  }, [activeConversation, typingUsers])

  const handleSendMessage = useCallback(
    async (content: string, type: string, attachmentUrl?: string) => {
      await sendMessage(content, type, attachmentUrl)
    },
    [sendMessage],
  )

  const handleSendTyping = useCallback(
    (isTyping: boolean) => {
      sendTyping(isTyping)
    },
    [sendTyping],
  )

  const handleDeleteMessage = useCallback(
    async (msgId: string | number) => {
      await deleteMessage(Number(msgId))
    },
    [deleteMessage],
  )

  return (
    <div className={className}>
      {/* CỘT TRÁI: DANH SÁCH HỘI THOẠI */}
      <div
        className={`${sidebarWidthClass} border-r border-[#e8ece3] flex-col shrink-0 bg-white min-h-0 ${
          activeConversation ? 'hidden md:flex' : 'flex w-full md:w-80'
        }`}
      >
        <ChatConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          typingUsers={typingUsers}
          isLoading={isLoadingConversations}
          onSelectConversation={handleSelectConversation}
          sidebarTitle={sidebarTitle}
        />
      </div>

      {/* CỘT PHẢI: KHUNG NỘI DUNG TIN NHẮN */}
      <div
        className={`flex-1 flex-col min-w-0 bg-[#fafcf9] min-h-0 ${
          activeConversation ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Header hội thoại */}
            <ChatHeader
              activeConversation={activeConversation}
              isOtherTyping={isOtherTyping}
              extraActions={renderHeaderActions ? renderHeaderActions(activeConversation) : undefined}
              onBack={() => {
                sendTyping(false)
                selectConversation(null)
              }}
            />

            {/* Danh sách tin nhắn */}
            <ChatMessageList
              messages={currentMessages}
              currentUserId={user?.id || '0'}
              activeConversation={activeConversation}
              isLoading={isLoadingMessages}
              isOtherTyping={isOtherTyping}
              canModerateAnyMessage={canModerateAnyMessage}
              onDeleteMessage={handleDeleteMessage}
            />

            {/* Thanh nhập tin nhắn */}
            <ChatInputBar
              onSendMessage={handleSendMessage}
              onSendTyping={handleSendTyping}
              disabled={!activeConversation}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <div className="size-16 rounded-full bg-[#f2f7ee] flex items-center justify-center text-[#326318] mb-3">
              <MessageSquare size={32} />
            </div>
            <h3 className="font-bold text-gray-700 text-sm mb-1">Hộp thư trao đổi trực tuyến</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trao đổi tin nhắn, gửi hình ảnh, video hoặc ghi âm trực tiếp.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
