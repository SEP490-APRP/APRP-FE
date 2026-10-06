import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/stores'
import { chatService } from '@/services/chat.service'
import { Conversation, ChatMessage } from '@/types/chat'
import { Send, Search, MessageSquare, Loader2 } from 'lucide-react'

const AdminMessages: React.FC = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    chatService.subscribeToConversation(userId, selectedConversation.otherUserId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
      // Mark as read
      chatService.markAsRead(selectedConversation.otherUserId)
    })

    return () => {
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

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !user) return

    setSending(true)
    chatService.sendMessage({
      receiverId: selectedConversation.otherUserId,
      content: messageInput.trim(),
    })

    setMessageInput('')
    setSending(false)
  }

  const filteredConversations = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tin nhắn</h1>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              Quản lý tin nhắn hỗ trợ khách hàng
            </p>
          </div>
          {totalUnread > 0 && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
              {totalUnread} tin nhắn mới
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div
          id="tour-messages-list"
          className="w-96 bg-white border-r border-gray-200 flex flex-col"
        >
          {/* Search */}
          <div id="tour-messages-search" className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                <MessageSquare className="size-12 mb-3" />
                <p className="text-sm font-semibold">Chưa có tin nhắn nào</p>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => (
                <button
                  key={conv.id}
                  id={idx === 0 ? 'tour-messages-first-conv' : undefined}
                  onClick={() => loadChatHistory(conv)}
                  className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                    selectedConversation?.id === conv.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-12 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-bold shrink-0">
                      {conv.otherUserName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{conv.otherUserName}</h3>
                        {(conv.unreadCount ?? 0) > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">
                        {conv.otherUserRole}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conv.lastMessageAt || conv.lastMessageTime || ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white font-bold">
                    {selectedConversation.otherUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">
                      {selectedConversation.otherUserName}
                    </h2>
                    <p className="text-xs text-gray-500 font-semibold">
                      {selectedConversation.otherUserRole}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.senderId === parseInt(user?.id || '0')
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl ${
                          isMe ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                          {msg.sentAt || msg.createdAt || ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center gap-2"
                  >
                    <Send className="size-4" />
                    Gửi
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="size-16 mx-auto mb-4" />
                <p className="font-semibold">Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessages
