import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  CheckCheck,
  Check,
  User,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { useAuth, useChatStore } from '@/stores'
import type { Conversation } from '@/types/chat'

export const FarmerMessages: React.FC = () => {
  const { user, token } = useAuth()
  const {
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    typingUsers,
    loadConversations,
    selectConversation,
    sendMessage,
    sendTyping,
    initRealtime,
  } = useChatStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Khởi tạo kết nối WebSocket khi vào phân hệ Shop
  useEffect(() => {
    if (token) {
      initRealtime(token)
    }
  }, [token, initRealtime])

  // Tự động chọn hội thoại đầu tiên nếu chưa chọn hội thoại nào
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      selectConversation(conversations[0])
    }
  }, [conversations, activeConversation, selectConversation])

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (activeConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeConversation])

  // Xử lý gửi tin nhắn
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || isSending || !activeConversation) return

    const content = inputText.trim()
    setInputText('')
    setIsSending(true)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTyping(false)

    try {
      await sendMessage(content)
    } catch (err) {
      console.error('[FarmerMessages] Send message error:', err)
    } finally {
      setIsSending(false)
    }
  }

  // Xử lý typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)

    if (!activeConversation) return

    sendTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 2000)
  }

  // Lọc hội thoại theo từ khóa và loại bỏ triệt để trùng lặp otherUserId
  const filteredConversations = useMemo(() => {
    const seenOtherUserIds = new Set<number>()
    return conversations.filter((c) => {
      const otherId = Number(c.otherUserId)
      if (seenOtherUserIds.has(otherId)) return false
      seenOtherUserIds.add(otherId)

      return (c.otherUserName || '').toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [conversations, searchQuery])

  const activeMessages = activeConversation ? messages[Number(activeConversation.id)] || [] : []
  const isOtherUserTyping = activeConversation && typingUsers[activeConversation.otherUserId]

  // Định dạng thời gian hiển thị thân thiện (xử lý cả ISO string lẫn mảng LocalDateTime của Java)
  const formatTime = (timeStr?: any) => {
    if (!timeStr) return ''
    try {
      // Trường hợp Java LocalDateTime tuần tự hóa thành mảng [YYYY, MM, DD, HH, mm, ss, nnn]
      if (Array.isArray(timeStr) && timeStr.length >= 5) {
        const [year, month, day, hour, minute] = timeStr
        const d = new Date(year, month - 1, day, hour, minute)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      const d = new Date(timeStr)
      if (isNaN(d.getTime())) return ''
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn h-[600px] max-h-[75vh]">
      {/* CỘT TRÁI: DANH SÁCH HỘI THOẠI KHÁCH HÀNG */}
      <div
        id="tour-messages-search"
        className="bg-white rounded-xl p-5 border border-[#e8ece3] shadow-xs flex flex-col min-h-0 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-[#1c2216]">Hội thoại khách hàng</h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f0f4ec] text-[#326318] font-bold">
              {conversations.length}
            </span>
          </div>
        </div>

        {/* Ô tìm kiếm hội thoại */}
        <div className="relative mb-3 shrink-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f8a79]" />
          <input
            type="text"
            placeholder="Tìm tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg bg-[#fafcf9] border border-[#edf1e8] focus:border-[#326318] focus:bg-white outline-none transition-all placeholder:text-[#8e9888]"
          />
        </div>

        {/* Danh sách người chat */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#85907f] gap-2">
              <Loader2 size={22} className="animate-spin text-[#326318]" />
              <span className="text-xs font-semibold">Đang tải danh sách...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-[#85907f] px-3">
              <MessageSquare size={26} className="text-[#326318]/40 mb-2" />
              <p className="text-xs font-bold text-[#1c2216]">Chưa có tin nhắn</p>
              <p className="text-[11px] text-[#717c6b] mt-0.5">
                Khi khách hàng hỏi về nông sản, tin nhắn sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv, idx) => {
              const isSelected = activeConversation && Number(activeConversation.id) === Number(conv.id)
              return (
                <button
                  key={conv.id}
                  id={idx === 0 ? 'tour-messages-first-conv-item' : undefined}
                  type="button"
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-3 rounded-lg border transition-all text-left flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#f0f5ec] border-[#326318]/40 shadow-2xs'
                      : 'bg-[#fafcf9] border-[#edf1e8] hover:bg-white hover:border-[#d9e2d3]'
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    {conv.otherUserAvatar ? (
                      <img
                        src={conv.otherUserAvatar}
                        alt={conv.otherUserName}
                        className="size-10 rounded-full object-cover border border-[#e5e9e0]"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-[#edf2e8] text-[#326318] flex items-center justify-center font-bold text-xs">
                        {conv.otherUserName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-xs text-[#1c2216] truncate font-bold">
                        {conv.otherUserName}
                      </strong>
                      <span className="text-[10px] text-[#8e9888] shrink-0 font-medium">
                        {formatTime(conv.lastMessageTime || conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#616b5a] truncate font-normal leading-tight">
                      {conv.lastMessage || 'Bắt đầu trò chuyện...'}
                    </p>
                  </div>

                  {(conv.unreadCount ?? 0) > 0 && (
                    <span className="size-4.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs mt-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* CỘT PHẢI: KHUNG NỘI DUNG TRÒ CHUYỆN */}
      <div
        id="tour-messages-first-conv"
        className="md:col-span-2 bg-white rounded-xl p-5 border border-[#e8ece3] shadow-xs flex flex-col min-h-0 overflow-hidden"
      >
        {activeConversation ? (
          <>
            {/* HEADER CUỘC TRÒ CHUYỆN */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#f1f4ed] shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeConversation.otherUserAvatar ? (
                    <img
                      src={activeConversation.otherUserAvatar}
                      alt={activeConversation.otherUserName}
                      className="size-10 rounded-full object-cover border border-[#e8ece3]"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-[#326318]/10 text-[#326318] flex items-center justify-center font-bold text-sm">
                      {activeConversation.otherUserName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1c2216] leading-tight">
                    {activeConversation.otherUserName}
                  </h3>
                  <p className="text-[11px] text-[#326318] font-bold mt-0.5">
                    {isOtherUserTyping ? (
                      <span className="text-emerald-600 animate-pulse">Khách đang soạn tin nhắn...</span>
                    ) : (
                      '🟢 Đang trực tuyến'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* DANH SÁCH TIN NHẮN */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafcf9] my-3 rounded-lg border border-[#edf1e8]">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 size={24} className="animate-spin text-[#326318]" />
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-[#85907f]">
                  <Sparkles size={24} className="text-amber-500 mb-1" />
                  <p className="text-xs font-bold text-[#1c2216]">Chưa có tin nhắn trong hội thoại</p>
                  <p className="text-[11px] text-[#717c6b] mt-0.5">
                    Gửi tin nhắn chào mừng và tư vấn cho khách hàng ngay.
                  </p>
                </div>
              ) : (
                activeMessages.map((msg, idx) => {
                  const isShopSender = user && msg.senderId === Number(user.id)
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isShopSender ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-xl text-xs leading-relaxed shadow-2xs break-words ${
                          isShopSender
                            ? 'bg-[#326318] text-white rounded-br-xs'
                            : 'bg-white text-[#1c2216] border border-[#e8ece3] rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                        {msg.attachmentUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-black/10">
                            <img
                              src={msg.attachmentUrl}
                              alt="Tệp đính kèm"
                              className="max-h-48 w-auto object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-[#8e9888]">
                        <span>{formatTime(msg.sentAt || msg.createdAt)}</span>
                        {isShopSender && (
                          <span>
                            {msg.isRead ? (
                              <CheckCheck size={12} className="text-emerald-600" />
                            ) : (
                              <Check size={12} className="text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}

              {/* TYPING INDICATOR */}
              {isOtherUserTyping && (
                <div className="flex items-center gap-1.5 bg-white border border-[#e8ece3] px-3.5 py-1.5 rounded-full w-fit shadow-2xs animate-fadeIn">
                  <span className="text-[11px] text-[#616b5a] font-semibold">Khách đang soạn tin</span>
                  <span className="size-1 rounded-full bg-[#326318] animate-bounce" />
                  <span className="size-1 rounded-full bg-[#326318] animate-bounce [animation-delay:0.2s]" />
                  <span className="size-1 rounded-full bg-[#326318] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Ô SOẠN THẢO VÀ GỬI TIN NHẮN */}
            <form onSubmit={handleSend} className="flex items-center gap-2.5 pt-1 shrink-0">
              <input
                type="text"
                placeholder="Nhập câu trả lời tư vấn cho khách hàng..."
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 text-xs rounded-lg bg-[#fafcf9] border border-[#dce3d5] focus:border-[#326318] focus:bg-white outline-none transition-all placeholder:text-[#8e9888]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-5 py-2.5 rounded-lg bg-[#326318] hover:bg-[#254d12] text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
              >
                {isSending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>Gửi</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#85907f]">
            <div className="size-16 rounded-full bg-[#f0f5ec] text-[#326318] flex items-center justify-center mb-3">
              <MessageSquare size={28} />
            </div>
            <h4 className="text-sm font-black text-[#1c2216]">Chưa chọn cuộc trò chuyện</h4>
            <p className="text-xs text-[#717c6b] mt-1 max-w-sm">
              Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái để xem nội dung và phản hồi khách hàng.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
export default FarmerMessages
