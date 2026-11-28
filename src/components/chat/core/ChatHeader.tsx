import React from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Conversation } from '@/types/chat'
import { getRoleBadgeInfo } from './chatUtils'

export interface ChatHeaderProps {
  activeConversation: Conversation
  isOtherTyping: boolean
  extraActions?: React.ReactNode
  onBack?: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConversation,
  isOtherTyping,
  extraActions,
  onBack,
}) => {
  const badgeInfo = getRoleBadgeInfo(
    activeConversation.otherUserRole,
    activeConversation.otherUserId,
  )

  return (
    <div className="p-3.5 lg:px-5 border-b border-[#e8ece3] bg-white flex items-center justify-between shrink-0 shadow-2xs z-10">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition shrink-0 cursor-pointer"
            title="Quay lại danh sách hội thoại"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div className="relative shrink-0">
          {activeConversation.otherUserAvatar ? (
            <img
              src={activeConversation.otherUserAvatar}
              alt={activeConversation.otherUserName}
              className="size-10 rounded-full object-cover border border-[#dce3d5]"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div
              className={`size-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${badgeInfo.avatarClass}`}
            >
              {(activeConversation.otherUserName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400/40" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-sm text-[#1c2216] truncate">
              {activeConversation.otherUserName}
            </h2>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badgeInfo.badgeClass}`}
            >
              {badgeInfo.label}
            </span>
          </div>
          <p className="text-[11px] text-[#6e7868] font-normal mt-0.5 flex items-center gap-1.5">
            {isOtherTyping ? (
              <span className="text-emerald-600 font-semibold italic flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-bounce" />
                Đang soạn tin nhắn...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                Đang trực tuyến
              </span>
            )}
          </p>
        </div>
      </div>

      {extraActions && <div className="shrink-0 ml-3">{extraActions}</div>}
    </div>
  )
}
