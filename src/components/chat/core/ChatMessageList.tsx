import React, { useRef, useEffect, useCallback } from 'react'
import { Loader2, MessageSquare, Send, Sparkles } from 'lucide-react'
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
  onQuickReply?: (text: string) => void
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUserId,
  activeConversation,
  isLoading,
  isOtherTyping,
  canModerateAnyMessage = false,
  onDeleteMessage,
  onQuickReply,
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

  // Gợi ý tin nhắn mẫu theo ngữ cảnh đối tượng chat
  const isAdminChat =
    activeConversation.otherUserRole?.toUpperCase() === 'ADMIN' ||
    Number(activeConversation.otherUserId) === 1
  const quickPrompts = isAdminChat
    ? [
        'Chào Ban Quản Trị, nông trại cần hỗ trợ kỹ thuật và vận hành sàn.',
        'Nhờ Admin kiểm tra giúp tiến độ phê duyệt nông sản mới đăng ạ.',
        'Chào BQT, em cần hướng dẫn về quy trình đối soát & rút tiền về ví.',
      ]
    : [
        'Dạ em chào anh/chị, nông trại có thể hỗ trợ thông tin gì cho mình ạ?',
        'Đơn hàng của bạn đang được nông trại đóng gói cẩn thận chuẩn bị giao.',
        'Nông sản hôm nay mới thu hoạch tại vườn, tươi ngon đảm bảo VietGAP ạ.',
      ]

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
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center max-w-lg mx-auto my-auto animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-[#eef6ea] text-[#2b5619] flex items-center justify-center mb-3.5 shadow-xs border border-[#d5e7ce]">
            <MessageSquare size={26} />
          </div>
          <h4 className="text-sm font-extrabold text-[#1c2216]">
            Bắt đầu trò chuyện với {activeConversation.otherUserName}
          </h4>
          <p className="text-xs text-[#717c6e] mt-1 max-w-sm leading-relaxed">
            Kênh trao đổi trực tiếp trên CapNong. Bạn có thể gửi tin nhắn, đính kèm hình ảnh hoặc clip nông sản thực tế.
          </p>

          {/* Quick template suggestions */}
          <div className="mt-6 w-full space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#869282] uppercase tracking-wider">
              <Sparkles size={13} className="text-[#2b5619]" />
              <span>Gợi ý phản hồi nhanh</span>
            </div>
            <div className="flex flex-col gap-2 text-left">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onQuickReply?.(prompt)}
                  className="text-xs font-semibold text-[#2b5619] bg-white hover:bg-[#eef6ea] border border-[#dbe6d7] hover:border-[#2b5619]/40 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="leading-snug pr-2">{prompt}</span>
                  <Send
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2b5619] shrink-0 ml-1"
                  />
                </button>
              ))}
            </div>
          </div>
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
