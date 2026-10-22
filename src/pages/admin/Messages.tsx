import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/stores'
import { chatService } from '@/services/chat.service'
import { uploadService } from '@/services/upload.service'
import { Conversation, ChatMessage } from '@/types/chat'
import {
  Send,
  Search,
  MessageSquare,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  X,
  Store,
  User as UserIcon,
} from 'lucide-react'

// --- TIME FORMATTING HELPERS ---
const parseDateValue = (timeVal: any): Date | null => {
  if (!timeVal) return null
  try {
    // 1. Trường hợp Java LocalDateTime tuần tự hóa thành mảng: [YYYY, MM, DD, HH, mm, ss, nnn]
    if (Array.isArray(timeVal) && timeVal.length >= 3) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = timeVal
      const d = new Date(year, month - 1, day, hour, minute, second)
      return isNaN(d.getTime()) ? null : d
    }

    // 2. Trường hợp mảng số bị dính liền thành chuỗi số dài: e.g. "20261022233017536975000"
    if (typeof timeVal === 'string' && /^\d{14,}$/.test(timeVal)) {
      const y = parseInt(timeVal.substring(0, 4), 10)
      const m = parseInt(timeVal.substring(4, 6), 10) - 1
      const d = parseInt(timeVal.substring(6, 8), 10)
      const h = parseInt(timeVal.substring(8, 10), 10)
      const min = parseInt(timeVal.substring(10, 12), 10)
      const s = parseInt(timeVal.substring(12, 14), 10)
      const parsed = new Date(y, m, d, h, min, s)
      if (!isNaN(parsed.getTime())) return parsed
    }

    // 3. Chuỗi ISO hoặc timestamp
    const d = new Date(timeVal)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

const formatTimeShort = (timeVal: any): string => {
  const d = parseDateValue(timeVal)
  if (!d) return ''
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const formatMessageFullTime = (timeVal: any): string => {
  const d = parseDateValue(timeVal)
  if (!d) return ''
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${timeStr} · ${dateStr}`
}

const AdminMessages: React.FC = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  // Connect WebSocket
  useEffect(() => {
    if (!user) return

    chatService.connect(
      () => console.log('[Admin Messages] WebSocket connected'),
      (err) => console.error('[Admin Messages] WebSocket error:', err),
    )

    return () => {
      chatService.disconnect()
    }
  }, [user])

  // Subscribe to selected conversation
  useEffect(() => {
    if (!user || !selectedConversation) return

    const userId = parseInt(user.id)
    const unsub = chatService.subscribeToConversation(userId, selectedConversation.otherUserId, (newMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
      // Mark as read
      chatService.markAsRead(selectedConversation.otherUserId)
      // Cập nhật tin nhắn mới nhất trong danh sách bên trái
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUserId === selectedConversation.otherUserId
            ? {
                ...c,
                lastMessage: newMessage.content || (newMessage.attachmentUrl ? '[Hình ảnh]' : ''),
                lastMessageTime: newMessage.sentAt || newMessage.createdAt,
              }
            : c,
        ),
      )
    })

    return () => {
      if (typeof unsub === 'function') unsub()
      chatService.unsubscribeFromConversation(userId, selectedConversation.otherUserId)
    }
  }, [user, selectedConversation])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await chatService.getConversations()
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChatHistory = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation)
      const history = await chatService.getChatHistory(conversation.otherUserId)
      setMessages(history)
      // Mark as read
      await chatService.markAsRead(conversation.otherUserId)
      // Update unread count in list
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c)),
      )
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const res = await uploadService.uploadImage(file, 'chat')
      if (res.result?.url) {
        setPendingImageUrl(res.result.url)
      }
    } catch (err) {
      console.error('[AdminMessages] Upload image error:', err)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !pendingImageUrl) || !selectedConversation || !user) return

    const content = messageInput.trim()
    const attachmentUrl = pendingImageUrl || undefined
    const type = attachmentUrl ? (content ? 'TEXT' : 'IMAGE') : 'TEXT'

    setMessageInput('')
    setPendingImageUrl(null)
    setSending(true)

    try {
      const sentMsg = await chatService.sendMessage({
        receiverId: selectedConversation.otherUserId,
        content,
        attachmentUrl,
        type,
      })

      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev
          return [...prev, sentMsg]
        })
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.otherUserId === selectedConversation.otherUserId
            ? {
                ...c,
                lastMessage: content || '[Hình ảnh]',
                lastMessageTime: new Date().toISOString(),
              }
            : c,
        ),
      )
    } catch (err) {
      console.error('[AdminMessages] Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((c) =>
    (c.otherUserName || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  return (
    <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 lg:p-6 overflow-hidden">
      {/* Khung chat đồng bộ với thiết kế AdminPortal, không bị tràn màn hình */}
      <div className="flex-1 min-h-0 flex bg-white rounded-2xl border border-[#e8ece3] shadow-xs overflow-hidden">
        {/* Conversations List */}
        <div
          id="tour-messages-list"
          className="w-72 sm:w-80 bg-white border-r border-[#e8ece3] flex flex-col min-h-0 shrink-0"
        >
          {/* Header danh sách hội thoại */}
          <div className="p-3.5 border-b border-[#f1f4ed] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1c2216]">Hội thoại</h2>
              {totalUnread > 0 ? (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                  {totalUnread} mới
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f4ec] text-[#326318] font-bold">
                  {conversations.length}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#717c6b] font-medium">CSKH & Nhà Vườn</span>
          </div>

          {/* Search */}
          <div id="tour-messages-search" className="p-3 border-b border-[#f1f4ed] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8e9888]" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-[#fafcf9] border border-[#edf1e8] focus:border-[#326318] focus:bg-white rounded-xl focus:outline-none text-xs transition-all placeholder:text-[#8e9888]"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f5f8f2] min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="size-6 animate-spin text-[#326318]" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-[#85907f] px-4 text-center">
                <MessageSquare className="size-10 mb-2 text-[#326318]/40" />
                <p className="text-xs font-bold text-[#1c2216]">Chưa có tin nhắn nào</p>
                <p className="text-[11px] text-[#717c6b] mt-0.5">
                  Tin nhắn từ khách mua và nhà vườn sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => {
                const isSelected = selectedConversation?.id === conv.id
                const isShop = conv.otherUserRole === 'SHOP'
                return (
                  <button
                    key={conv.id}
                    id={idx === 0 ? 'tour-messages-first-conv' : undefined}
                    onClick={() => loadChatHistory(conv)}
                    className={`w-full p-3 hover:bg-[#f6f9f3] transition-colors text-left flex items-start gap-3 cursor-pointer ${
                      isSelected ? 'bg-[#f0f5ec] border-l-4 border-l-[#326318]' : ''
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      {conv.otherUserAvatar ? (
                        <img
                          src={conv.otherUserAvatar}
                          alt={conv.otherUserName}
                          className="size-10 rounded-full object-cover border border-[#e5e9e0]"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div
                          className={`size-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isShop
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {conv.otherUserName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white ${
                          isShop ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-bold text-xs text-[#1c2216] truncate">
                            {conv.otherUserName}
                          </h3>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-normal shrink-0 border border-gray-200 bg-gray-50 text-gray-600">
                          {isShop ? 'Nhà Vườn' : 'Khách Mua'}
                        </span>
                      </div>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#616b5a] truncate leading-tight">
                      {conv.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                    <p className="text-[10px] text-[#8e9888] font-medium mt-0.5">
                      {formatTimeShort(conv.lastMessageTime || conv.lastMessageAt)}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-h-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-[#e8ece3] bg-[#fafcf9] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {selectedConversation.otherUserAvatar ? (
                      <img
                        src={selectedConversation.otherUserAvatar}
                        alt={selectedConversation.otherUserName}
                        className="size-9 rounded-full object-cover border border-[#e5e9e0]"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div
                        className={`size-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          selectedConversation.otherUserRole === 'SHOP'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {selectedConversation.otherUserName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-xs text-[#1c2216]">
                        {selectedConversation.otherUserName}
                      </h2>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-normal border border-gray-200 bg-gray-50 text-gray-600">
                        {selectedConversation.otherUserRole === 'SHOP' ? 'Nhà Vườn' : 'Khách Mua Hàng'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                      Trực tuyến
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-3 bg-[#fafcf9] min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center">
                  <p className="text-xs font-semibold text-gray-700">Chưa có tin nhắn trong hội thoại</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Gửi tin nhắn phản hồi để hỗ trợ người dùng.
                  </p>
                </div>
              ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === parseInt(user?.id || '0')
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl shadow-2xs break-words text-xs leading-relaxed ${
                            isMe
                              ? 'bg-[#326318] text-white rounded-br-xs'
                              : 'bg-white text-[#1c2216] border border-[#e8ece3] rounded-bl-xs'
                          }`}
                        >
                          {msg.content && <p>{msg.content}</p>}
                          {msg.attachmentUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-black/10 max-w-xs">
                              <img
                                src={msg.attachmentUrl}
                                alt="Ảnh đính kèm"
                                className="max-h-60 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(msg.attachmentUrl, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-[10px] mt-1 font-medium ${
                            isMe ? 'text-[#8e9888] pr-1' : 'text-[#8e9888] pl-1'
                          }`}
                        >
                          {formatMessageFullTime(msg.sentAt || msg.createdAt)}
                        </p>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Preview Attached Image before Send */}
              {pendingImageUrl && (
                <div className="px-5 py-2 bg-white border-t border-[#edf1e8] flex items-center gap-3 shrink-0">
                  <div className="relative size-12 rounded-lg overflow-hidden border border-[#dce3d5]">
                    <img
                      src={pendingImageUrl}
                      alt="Ảnh đính kèm"
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingImageUrl(null)}
                      className="absolute top-0.5 right-0.5 size-4 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <span className="text-xs text-[#717c6b]">Ảnh đã tải lên sẵn sàng gửi</span>
                </div>
              )}

              {/* Input */}
              <div className="p-3 lg:p-3.5 border-t border-[#e8ece3] bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-2 rounded-xl border border-[#dce3d5] text-[#616b5a] hover:bg-[#f6f9f3] hover:text-[#326318] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Đính kèm hình ảnh"
                  >
                    {uploadingImage ? (
                      <Loader2 size={16} className="animate-spin text-[#326318]" />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                  </button>

                  <input
                    type="text"
                    placeholder="Nhập tin nhắn hỗ trợ..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3.5 py-2 bg-[#fafcf9] border border-[#dce3d5] focus:border-[#326318] focus:bg-white rounded-xl focus:outline-none text-xs transition-all placeholder:text-[#8e9888]"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && !pendingImageUrl) || sending}
                    className="px-4 py-2 bg-[#326318] hover:bg-[#254d12] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
                  >
                    {sending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        <span>Gửi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#85907f]">
              <div className="text-center p-8">
                <MessageSquare className="size-14 mx-auto mb-3 text-[#326318]/30" />
                <h4 className="text-sm font-black text-[#1c2216]">Chưa chọn cuộc trò chuyện</h4>
                <p className="text-xs text-[#717c6b] mt-1 max-w-sm">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để xem nội dung và phản hồi người dùng.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessages
