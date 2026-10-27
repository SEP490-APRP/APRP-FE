import React from 'react'
import { Trash2, Check, CheckCheck } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'
import { isAudioUrl, isVideoUrl, formatTimeFull } from './chatUtils'
import { globalShowConfirm } from '@/components/common/Popup'

export interface ChatMessageItemProps {
  msg: ChatMessage
  isMe: boolean
  canDelete: boolean
  isModerateAdmin?: boolean
  onDelete: (msgId: string | number) => void
  onMediaLoaded?: () => void
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  isMe,
  canDelete,
  isModerateAdmin = false,
  onDelete,
  onMediaLoaded,
}) => {
  const isAudio = isAudioUrl(msg.attachmentUrl, msg.type)
  const isVideo = !isAudio && isVideoUrl(msg.attachmentUrl, msg.type)

  const handleDeleteClick = async () => {
    if (!msg.id) return

    const isConfirmed = await globalShowConfirm(
      isModerateAdmin
        ? 'Admin: Bạn có chắc chắn muốn xóa tin nhắn vi phạm này của người dùng không? Thao tác này sẽ xóa tin nhắn vĩnh viễn trên hệ thống.'
        : 'Bạn có chắc chắn muốn thu hồi tin nhắn này không? Tin nhắn sẽ biến mất đối với cả hai bên.',
      isModerateAdmin ? 'Kiểm duyệt & Xóa tin nhắn' : 'Thu hồi tin nhắn',
      isModerateAdmin ? 'Xóa vi phạm' : 'Thu hồi',
      'Hủy bỏ',
      true,
    )

    if (isConfirmed) {
      onDelete(msg.id)
    }
  }

  return (
    <div className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`w-fit max-w-full px-3.5 py-2 rounded-xl shadow-2xs break-words text-xs leading-relaxed ${
            isMe
              ? 'bg-[#326318] text-white rounded-br-xs'
              : 'bg-white text-[#1c2216] border border-[#e8ece3] rounded-bl-xs'
          }`}
        >
          {msg.content ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : !msg.attachmentUrl ? (
            <p className="italic text-gray-400 text-[11px]">[Tin nhắn trống]</p>
          ) : null}

          {msg.attachmentUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border border-black/10 max-w-sm">
              {isAudio ? (
                <audio
                  controls
                  playsInline
                  preload="metadata"
                  src={msg.attachmentUrl}
                  className="w-64 max-w-full my-1 rounded-md"
                  onLoadedMetadata={onMediaLoaded}
                />
              ) : isVideo ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={msg.attachmentUrl}
                  className="max-h-72 w-full rounded-lg bg-black"
                  onLoadedData={onMediaLoaded}
                />
              ) : (
                <img
                  src={msg.attachmentUrl}
                  alt="Ảnh đính kèm"
                  className="max-h-60 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(msg.attachmentUrl, '_blank')}
                  onLoad={onMediaLoaded}
                />
              )}
            </div>
          )}
        </div>

        {/* Nút xóa/thu hồi tin nhắn */}
        {canDelete && msg.id && Number(msg.id) < 10000000000 && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-full hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all cursor-pointer shrink-0"
            title={isModerateAdmin ? 'Admin: Xóa tin nhắn vi phạm' : 'Thu hồi tin nhắn'}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Thời gian gửi & Trạng thái đã xem */}
      <div
        className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-[#8e9888] font-medium ${
          isMe ? 'justify-end pr-1' : 'justify-start pl-1'
        }`}
      >
        <span>{formatTimeFull(msg.sentAt || msg.createdAt)}</span>
        {isMe && (
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
}
