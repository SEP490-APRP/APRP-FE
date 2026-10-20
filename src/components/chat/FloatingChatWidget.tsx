import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  X,
  Send,
  ArrowLeft,
  Search,
  CheckCheck,
  Check,
  Store,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useAuth, useChatStore, useUiStore } from '@/stores'
import type { Conversation } from '@/types/chat'

export const FloatingChatWidget: React.FC = () => {
  const { user, token } = useAuth()
  const cartOpen = useUiStore((s) => s.cartOpen)
  const cartMinimized = useUiStore((s) => s.cartMinimized)
  const isCartDrawerActive = cartOpen && !cartMinimized
  const {
    isOpen,
    setOpen,
    conversations,
    activeConversation,
    messages,
    unreadTotal,
    typingUsers,
    isWsConnected,
    isLoadingConversations,
    isLoadingMessages,
    initRealtime,
    selectConversation,
    startChatWithUser,
    sendMessage,
    sendTyping,
    markAsRead,
  } = useChatStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Khởi tạo kết nối WebSocket khi đã đăng nhập
  useEffect(() => {
    if (user && token) {
      initRealtime(token)
    }
  }, [user, token, initRealtime])

  // Lắng nghe sự kiện "open-chat-with-user" từ các trang sản phẩm / gian hàng / shipper
  useEffect(() => {
    const handleOpenChat = async (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: number; userName?: string }>
      if (!customEvent.detail || !customEvent.detail.userId) return

      const targetUserId = customEvent.detail.userId

      // Nếu chưa đăng nhập, mở modal thông báo hoặc điều hướng
      if (!user) {
        window.location.hash = '/dang-nhap'
        return
      }

      try {
        setOpen(true)
        await startChatWithUser(targetUserId)
      } catch (err) {
        console.error('[FloatingChatWidget] Failed to start chat with user:', err)
      }
    }

    window.addEventListener('open-chat-with-user', handleOpenChat)
    return () => window.removeEventListener('open-chat-with-user', handleOpenChat)
  }, [user, setOpen, startChatWithUser])

  // Tự động cuộn xuống cuối khi có tin nhắn mới trong hội thoại active
  useEffect(() => {
    if (activeConversation && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeConversation, isOpen])

  // Xử lý gửi tin nhắn
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || isSending || !activeConversation) return

    const content = inputText.trim()
    setInputText('')
    setIsSending(true)

    // Tắt typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTyping(false)

    try {
      await sendMessage(content)
    } catch (err) {
      console.error('[FloatingChatWidget] Send message error:', err)
    } finally {
      setIsSending(false)
    }
  }

  // Xử lý gõ phím & typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)

    if (!activeConversation) return

    sendTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 2000)
  }

  // Lọc hội thoại theo từ khóa tìm kiếm
  const filteredConversations = conversations.filter((c) =>
    (c.otherUserName || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
    <aside
      aria-label="Khung chat trực tuyến"
      className={`fixed bottom-6 z-50 flex flex-col items-end select-none pointer-events-auto transition-all duration-300 ease-in-out ${
        isCartDrawerActive ? 'hidden md:flex right-6 md:right-[436px]' : 'right-6'
      }`}
    >
      {/* 1. KHUNG CHAT WINDOW (KHI MỞ) */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[390px] h-[520px] max-h-[calc(100vh-7rem)] bg-white rounded-3xl shadow-2xl border border-[#e8ece3] flex flex-col overflow-hidden animate-fadeIn transition-all">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#244c11] to-[#326318] text-white p-4 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {activeConversation ? (
                <>
                  <button
                    type="button"
                    onClick={() => selectConversation(null as unknown as Conversation)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
                    title="Quay lại danh sách hội thoại"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="relative shrink-0">
                    {activeConversation.otherUserAvatar ? (
                      <img
                        src={activeConversation.otherUserAvatar}
                        alt={activeConversation.otherUserName}
                        className="size-9 rounded-full object-cover border border-white/30"
                      />
                    ) : (
                      <div className="size-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                        {activeConversation.otherUserName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 border-2 border-[#244c11]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-white truncate leading-tight">
                      {activeConversation.otherUserName}
                    </h2>
                    <p className="text-[10px] text-white/80 font-medium">
                      {isOtherUserTyping ? (
                        <span className="text-emerald-200 animate-pulse font-semibold">
                          Đang soạn tin nhắn...
                        </span>
                      ) : activeConversation.otherUserRole === 'SHOP' ? (
                        'Nhà vườn / Nông trại'
                      ) : activeConversation.otherUserRole === 'ADMIN' ? (
                        'Hỗ trợ CapNong'
                      ) : (
                        'Đang trực tuyến'
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <MessageSquare size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white leading-tight">Tin nhắn CapNong</h2>
                    <p className="text-[10px] text-white/80 flex items-center gap-1 font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      {isWsConnected ? 'Thời gian thực sẵn sàng' : 'Đang kết nối lại...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              title="Đóng chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* BODY: DANH SÁCH HỘI THOẠI HOẶC KHUNG CHAT ACTIVE */}
          {!activeConversation ? (
            /* VIEW 1: DANH SÁCH HỘI THOẠI */
            <div className="flex-1 flex flex-col min-h-0 bg-[#fafcf9]">
              {/* Thanh tìm kiếm */}
              <div className="p-3 border-b border-[#edf1e8] bg-white">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85907f]"
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Danh sách */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoadingConversations ? (
                  <div className="flex flex-col items-center justify-center h-48 text-[#85907f] gap-2">
                    <Loader2 size={24} className="animate-spin text-[#326318]" />
                    <span className="text-xs font-semibold">Đang tải cuộc trò chuyện...</span>
                  </div>
                ) : !user ? (
                  <div className="flex flex-col items-center justify-center h-56 text-[#85907f] px-4 text-center">
                    <div className="size-12 rounded-full bg-[#edf2e8] flex items-center justify-center mb-2.5 text-[#326318]">
                      <MessageSquare size={22} />
                    </div>
                    <p className="text-xs font-bold text-[#1c2216]">Đăng nhập để trò chuyện</p>
                    <p className="text-[11px] text-[#717c6b] mt-1 max-w-[220px]">
                      Đăng nhập tài khoản để xem lịch sử tin nhắn và liên hệ với các nhà vườn.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        window.location.hash = '/dang-nhap'
                      }}
                      className="mt-3 px-4 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-56 text-[#85907f] px-4 text-center">
                    <div className="size-12 rounded-full bg-[#edf2e8] flex items-center justify-center mb-2.5 text-[#326318]">
                      <MessageSquare size={22} />
                    </div>
                    <p className="text-xs font-bold text-[#1c2216]">Chưa có cuộc trò chuyện nào</p>
                    <p className="text-[11px] text-[#717c6b] mt-1 max-w-[220px]">
                      Bấm vào nút &quot;Chat shop&quot; trên trang nông sản để trò chuyện với nhà vườn.
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => selectConversation(conv)}
                      className="w-full p-2.5 rounded-2xl hover:bg-white border border-transparent hover:border-[#edf1e8] flex items-center gap-3 transition-all text-left group cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        {conv.otherUserAvatar ? (
                          <img
                            src={conv.otherUserAvatar}
                            alt={conv.otherUserName}
                            className="size-11 rounded-full object-cover border border-[#e5e9e0]"
                          />
                        ) : (
                          <div className="size-11 rounded-full bg-[#edf2e8] text-[#326318] flex items-center justify-center font-bold text-sm">
                            {conv.otherUserName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {conv.otherUserRole === 'SHOP' && (
                          <span
                            className="absolute -bottom-1 -right-1 size-4 rounded-full bg-[#326318] text-white flex items-center justify-center text-[9px]"
                            title="Nhà vườn"
                          >
                            <Store size={9} />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-xs font-bold text-[#1c2216] truncate group-hover:text-[#326318] transition-colors">
                            {conv.otherUserName}
                          </h3>
                          <span className="text-[10px] text-[#8e9888] shrink-0 font-medium">
                            {formatTime(conv.lastMessageTime || conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#616b5a] truncate font-normal">
                          {conv.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                        </p>
                      </div>

                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="size-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* VIEW 2: KHUNG CHAT ACTIVE */
            <div className="flex-1 flex flex-col min-h-0 bg-[#fafcf9]">
              {/* VÙNG HIỂN THỊ TIN NHẮN */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 size={20} className="animate-spin text-[#326318]" />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-44 text-center text-[#85907f] px-4">
                    <Sparkles size={24} className="text-amber-500 mb-1.5" />
                    <p className="text-xs font-bold text-[#1c2216]">Gửi lời chào đầu tiên!</p>
                    <p className="text-[11px] text-[#717c6b] mt-0.5">
                      Hỏi về độ tươi ngon, nguồn gốc hoặc thời gian giao hàng.
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg, idx) => {
                    const isMe = user && msg.senderId === Number(user.id)
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                            isMe
                              ? 'bg-[#326318] text-white rounded-br-xs'
                              : 'bg-white text-[#1c2216] border border-[#e8ece3] rounded-bl-xs'
                          }`}
                        >
                          {msg.content}
                          {msg.attachmentUrl && (
                            <div className="mt-1.5 rounded-lg overflow-hidden border border-black/10">
                              <img
                                src={msg.attachmentUrl}
                                alt="Tệp đính kèm"
                                className="max-h-40 w-auto object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-[#8e9888] font-medium">
                          <span>{formatTime(msg.sentAt || msg.createdAt)}</span>
                          {isMe && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck size={11} className="text-emerald-600" />
                              ) : (
                                <Check size={11} className="text-gray-400" />
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
                  <div className="flex items-center gap-1.5 bg-white border border-[#e8ece3] px-3 py-1.5 rounded-full w-fit shadow-2xs animate-fadeIn">
                    <span className="text-[10px] text-[#616b5a] font-semibold">Đang soạn tin</span>
                    <span className="size-1 rounded-full bg-[#326318] animate-bounce" />
                    <span className="size-1 rounded-full bg-[#326318] animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1 rounded-full bg-[#326318] animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Ô NHẬP TIN NHẮN */}
              <form
                onSubmit={handleSend}
                className="p-2.5 bg-white border-t border-[#edf1e8] flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  aria-label="Nhập tin nhắn"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#f4f7f1] border border-transparent focus:border-[#326318] focus:bg-white outline-none transition-all placeholder:text-[#8e9888]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="size-8 rounded-xl bg-[#326318] hover:bg-[#254d12] text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
                  title="Gửi tin nhắn"
                >
                  {isSending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} className="translate-x-[-0.5px]" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. NÚT BONG BÓNG CHAT NỔI (TRIGGER BUTTON) */}
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="group relative size-14 rounded-full bg-gradient-to-br from-[#326318] to-[#1c3a0e] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border-2 border-white/80"
        title="Trò chuyện với nhà vườn và hỗ trợ CapNong"
      >
        {isOpen ? (
          <X size={26} className="transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <MessageSquare size={24} className="transition-transform group-hover:scale-110" />
        )}

        {/* Badge số tin nhắn chưa đọc */}
        {!isOpen && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-md animate-bounce">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>
    </aside>
  )
}
export default FloatingChatWidget
