import React from 'react'
import type { Conversation } from '@/types/chat'
import { formatTimeShort, getRoleBadgeInfo } from './chatUtils'

export interface ChatConversationItemProps {
  conv: Conversation
  isSelected: boolean
  isTyping: boolean
  onSelect: (conv: Conversation) => void
}

export const ChatConversationItem: React.FC<ChatConversationItemProps> = ({
  conv,
  isSelected,
  isTyping,
  onSelect,
}) => {
  const badgeInfo = getRoleBadgeInfo(conv.otherUserRole, conv.otherUserId)
  const hasUnread = (conv.unreadCount ?? 0) > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(conv)}
      className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition cursor-pointer border-l-4 ${
        isSelected
          ? 'bg-[#f2f7ee] border-l-[#326318]'
          : hasUnread
          ? 'bg-[#f7faf4] border-l-emerald-400 hover:bg-[#f2f7ee]'
          : 'border-l-transparent hover:bg-gray-50'
      }`}
    >
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        {conv.otherUserAvatar ? (
          <img
            src={conv.otherUserAvatar}
            alt={conv.otherUserName}
            className="size-10 rounded-full object-cover border border-[#e0e6da]"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <div
            className={`size-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${badgeInfo.avatarClass}`}
          >
            {(conv.otherUserName || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3
              className={`text-xs truncate ${
                isSelected || hasUnread ? 'font-bold text-[#1c2216]' : 'font-semibold text-gray-800'
              }`}
            >
              {conv.otherUserName}
            </h3>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-semibold shrink-0 border ${badgeInfo.badgeClass}`}
            >
              {conv.otherUserRole?.toUpperCase() === 'ADMIN' || Number(conv.otherUserId) === 1
                ? 'BQT'
                : conv.otherUserRole?.toUpperCase() === 'SHOP'
                ? 'Vườn'
                : 'Khách'}
            </span>
          </div>

          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
            {formatTimeShort(conv.lastMessageTime || conv.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs truncate leading-tight text-[#616b5a] flex-1">
            {isTyping ? (
              <span className="text-emerald-600 font-semibold italic flex items-center gap-1">
                <span className="inline-block size-1 rounded-full bg-emerald-500 animate-bounce" />
                Đang soạn tin...
              </span>
            ) : (
              conv.lastMessage || 'Bắt đầu cuộc trò chuyện...'
            )}
          </p>

          {hasUnread && (
            <span className="size-4.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 animate-pulse">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
