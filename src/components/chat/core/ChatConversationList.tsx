import React, { useState, useMemo } from 'react'
import { Search, Loader2 } from 'lucide-react'
import type { Conversation } from '@/types/chat'
import { ChatConversationItem } from './ChatConversationItem'

export interface ChatConversationListProps {
  conversations: Conversation[]
  activeConversation: Conversation | null
  typingUsers: Record<number, boolean>
  isLoading: boolean
  onSelectConversation: (conv: Conversation) => void
  sidebarTitle?: string
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({
  conversations,
  activeConversation,
  typingUsers,
  isLoading,
  onSelectConversation,
  sidebarTitle = 'HỘI THOẠI GẦN ĐÂY',
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Lọc hội thoại theo từ khóa và khử trùng lặp
  const filteredConversations = useMemo(() => {
    const seen = new Set<number>()
    return conversations.filter((c) => {
      const otherId = Number(c.otherUserId)
      if (seen.has(otherId)) return false
      seen.add(otherId)

      return (c.otherUserName || '').toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [conversations, searchQuery])

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Header Sidebar */}
      <div className="p-3.5 border-b border-[#e8ece3] bg-[#fafcf9] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black tracking-wider text-[#485341] uppercase">
            {sidebarTitle}
          </span>
          <span className="text-[10px] bg-[#eaf4e5] text-[#326318] px-2 py-0.5 rounded-full font-extrabold">
            {filteredConversations.length}
          </span>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà vườn, khách mua..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#dce3d5] rounded-lg outline-none focus:border-[#326318] transition text-[#1c2216] placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Danh sách hội thoại */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="size-5 animate-spin text-[#326318]" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs font-medium">
            {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có cuộc trò chuyện nào'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = Boolean(
              activeConversation &&
              (String(activeConversation.id) === String(conv.id) ||
                Number(activeConversation.otherUserId) === Number(conv.otherUserId)),
            )

            const isTyping = Boolean(
              typingUsers[conv.otherUserId] ||
              typingUsers[Number(conv.otherUserId)] ||
              typingUsers[String(conv.otherUserId)],
            )

            return (
              <ChatConversationItem
                key={conv.id || conv.otherUserId}
                conv={conv}
                isSelected={isSelected}
                isTyping={isTyping}
                onSelect={onSelectConversation}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
