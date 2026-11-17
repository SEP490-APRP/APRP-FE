import React, { useRef, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import type { ChatMessage, Conversation } from '@/types/chat'
import { ChatMessageItem } from './ChatMessageItem'

export interface ChatMessageListProps {
  messages: ChatMessage[]
  currentUserId: string | number
  activeConversation: Conversation
  isLoading: boolean
  isOtherTyping: boolean
  canModerateAnyMessage?: boolean
  onDeleteMessage: (msgId: string | number) => void
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUserId,
  activeConversation,
  isLoading,
  isOtherTyping,
  canModerateAnyMessage = false,
  onDeleteMessage,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120
  }, [])

  // Cuộn nội bộ trong container
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      const el = messagesContainerRef.current
      if (behavior === 'smooth') {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      } else {
        el.scrollTop = el.scrollHeight
      }
    }
  }, [])

  // 1. Tự động cuộn xuống khi đổi hội thoại
  useEffect(() => {
    if (!activeConversation?.id) return
    isNearBottomRef.current = true
    scrollToBottom('auto')
    const t1 = setTimeout(() => scrollToBottom('auto'), 50)
    const t2 = setTimeout(() => scrollToBottom('smooth'), 160)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [activeConversation?.id, scrollToBottom])

  // 2. Tự động cuộn khi có tin nhắn mới
  useEffect(() => {
    if (isLoading || messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    const isMe = Number(lastMsg?.senderId) === Number(currentUserId)

    if (isMe || isNearBottomRef.current) {
      scrollToBottom('smooth')
      const t = setTimeout(() => scrollToBottom('smooth'), 120)
      return () => clearTimeout(t)
    }
  }, [messages.length, isLoading, currentUserId, scrollToBottom])

  // 3. Cuộn nhẹ khi đối phương đang soạn tin nhắn
  useEffect(() => {
    if (isOtherTyping && isNearBottomRef.current) {
      scrollToBottom('smooth')
    }
  }, [isOtherTyping, scrollToBottom])

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-3 bg-[#fafcf9] min-h-0"
    >
      {isLoading && messages.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="size-6 animate-spin text-[#326318]" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center">
          <p className="text-xs font-semibold text-gray-700">Chưa có tin nhắn trong hội thoại</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Gửi tin nhắn phản hồi để bắt đầu trao đổi.
          </p>
        </div>
      ) : (
        messages.map((msg, idx) => {
          const isMe = Number(msg.senderId) === Number(currentUserId)
          const canDelete = isMe || canModerateAnyMessage
          const isModerateAdmin = !isMe && canModerateAnyMessage

          return (
            <ChatMessageItem
              key={msg.id || idx}
              msg={msg}
              isMe={isMe}
              canDelete={canDelete}
              isModerateAdmin={isModerateAdmin}
              onDelete={onDeleteMessage}
              onMediaLoaded={() => scrollToBottom('auto')}
            />
          )
        })
      )}

      {/* TYPING INDICATOR BUBBLE */}
      {isOtherTyping && (
        <div className="flex items-center gap-1.5 bg-white border border-[#e8ece3] px-3.5 py-1.5 rounded-full w-fit shadow-2xs animate-fadeIn">
          <span className="text-[11px] text-[#616b5a] font-semibold">
            {activeConversation.otherUserName} đang soạn tin
          </span>
          <span className="size-1 rounded-full bg-[#326318] animate-bounce" />
          <span className="size-1 rounded-full bg-[#326318] animate-bounce [animation-delay:0.2s]" />
          <span className="size-1 rounded-full bg-[#326318] animate-bounce [animation-delay:0.4s]" />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
