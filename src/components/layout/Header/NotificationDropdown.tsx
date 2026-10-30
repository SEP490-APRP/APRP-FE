import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, Clock, ChevronRight, Inbox, MessageSquare } from 'lucide-react'
import { useNotificationStore, useChatStore } from '@/stores'
import type { NotificationItem } from '@/services/notification.types'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  messagesHref?: string
  viewAllHref?: string
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Vừa xong'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    if (isNaN(diffMs)) return 'Vừa xong'

    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) return 'Vừa xong'
    if (diffMin < 60) return `${diffMin} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  } catch {
    return 'Vừa xong'
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  messagesHref = '/tin-nhan',
  viewAllHref = '/tai-khoan?tab=thong-bao',
}) => {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    openDetail,
  } = useNotificationStore()
  const unreadTotal = useChatStore((s) => s.unreadTotal)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id)
    }
    openDetail(item)
    onClose()
  }

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    deleteNotification(id)
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1.5 w-72 sm:w-[320px] bg-white rounded-xl shadow-xl border border-[#ede8df] overflow-hidden z-50 animate-fadeIn"
      role="dialog"
      aria-label="Hộp thông báo"
    >
      {/* Header */}
      <div className="flex items-center justify-between py-2.5 px-3 border-b border-[#f0ebd9] bg-[#faf7ef]">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-[#326318]/10 text-[#326318] flex items-center justify-center">
            <Bell size={13} />
          </div>
          <h4 className="font-extrabold text-xs text-[#20271c]">Thông Báo</h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold text-[9px]">
              {unreadCount} mới
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[10.5px] font-bold text-[#326318] hover:text-[#224410] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CheckCheck size={12} />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Quick Chat Alert Banner if there are unread messages */}
      {unreadTotal > 0 && (
        <div
          onClick={() => {
            onClose()
            navigate(messagesHref)
          }}
          className="mx-2.5 my-1.5 p-2 rounded-lg bg-amber-50 hover:bg-amber-100/90 border border-amber-200/90 cursor-pointer flex items-center justify-between transition-colors shadow-xs group"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-amber-950 flex items-center gap-1 truncate">
                <span>Tin nhắn mới</span>
                <span className="px-1 py-0.1 rounded-full bg-red-500 text-white text-[9px] font-extrabold shrink-0">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              </p>
              <p className="text-[10px] text-amber-800 truncate">
                {unreadTotal} tin nhắn chưa đọc
              </p>
            </div>
          </div>
          <span className="text-[10.5px] font-bold text-amber-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1.5">
            <span>Mở chat</span>
            <ChevronRight size={11} />
          </span>
        </div>
      )}

      {/* List */}
      <div className="max-h-[280px] overflow-y-auto divide-y divide-[#f5f2e9]">
        {isLoading && notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8a9184]">
            <div className="inline-block size-4 border-2 border-[#326318] border-t-transparent rounded-full animate-spin mb-1.5" />
            <p className="text-[11px]">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 px-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-[#f0ebd9] text-[#8a9184] flex items-center justify-center mb-1.5">
              <Inbox size={18} />
            </div>
            <p className="text-xs font-bold text-[#20271c]">Chưa có thông báo nào</p>
            <p className="text-[10.5px] text-[#8a9184] mt-0.5">
              Bạn sẽ nhận được thông báo về đơn hàng và cập nhật tại đây.
            </p>
          </div>
        ) : (
          notifications
            .filter((item) => item && (item.title || item.message))
            .map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`py-2 px-3 transition-colors flex items-start gap-2.5 cursor-pointer group ${
                item.isRead ? 'bg-white hover:bg-[#faf7ef]' : 'bg-[#f4faee]/70 hover:bg-[#ebf6e3]'
              }`}
            >
              {/* Unread indicator dot */}
              <div className="shrink-0 mt-1">
                <div
                  className={`size-2 rounded-full ${
                    item.isRead ? 'bg-transparent' : 'bg-[#326318]'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1 mb-0.5">
                  <p
                    className={`text-xs truncate ${
                      item.isRead ? 'font-medium text-[#464f3e]' : 'font-extrabold text-[#171f11]'
                    }`}
                  >
                    {item.title}
                  </p>
                  <span className="text-[9.5px] text-[#8a9184] shrink-0 font-medium flex items-center gap-0.5">
                    <Clock size={9} />
                    {formatRelativeTime(item.createAt || item.createdAt)}
                  </span>
                </div>

                <p
                  className={`text-[11px] line-clamp-2 leading-relaxed ${
                    item.isRead ? 'text-[#737d6e]' : 'text-[#313b2a]'
                  }`}
                >
                  {item.message}
                </p>

                {item.evidence && (
                  <span className="inline-block mt-1 text-[9.5px] text-[#326318] font-bold">
                    Có liên kết đính kèm →
                  </span>
                )}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => handleDelete(e, item.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-[#8a9184] hover:text-red-500 transition-all shrink-0 cursor-pointer"
                title="Xóa thông báo"
                aria-label="Xóa thông báo"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="py-2 px-3 border-t border-[#f0ebd9] bg-[#faf7ef] flex items-center justify-between text-[10.5px]">
        <span className="text-[9.5px] text-[#8a9184]">Tự động cập nhật thời gian thực</span>
        <button
          type="button"
          onClick={() => {
            onClose()
            navigate(viewAllHref)
          }}
          className="font-bold text-[#326318] hover:text-[#214310] flex items-center gap-1 cursor-pointer transition-colors text-[10.5px]"
        >
          <span>Xem tất cả</span>
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}

export default NotificationDropdown
