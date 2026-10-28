import React, { useRef, useEffect } from 'react'
import { Bell, CheckCheck, Trash2, Clock, ChevronRight, Inbox } from 'lucide-react'
import { useNotificationStore } from '@/stores'
import type { NotificationItem } from '@/services/notification.types'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
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

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore()

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
  }

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    deleteNotification(id)
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#ede8df] overflow-hidden z-50 animate-fadeIn"
      role="dialog"
      aria-label="Hộp thông báo"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#f0ebd9] bg-[#faf7ef]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#326318]/10 text-[#326318] flex items-center justify-center">
            <Bell size={15} />
          </div>
          <h4 className="font-extrabold text-xs text-[#20271c]">Thông Báo</h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px]">
              {unreadCount} mới
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[11px] font-bold text-[#326318] hover:text-[#224410] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CheckCheck size={13} />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f5f2e9]">
        {isLoading && notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8a9184]">
            <div className="inline-block size-5 border-2 border-[#326318] border-t-transparent rounded-full animate-spin mb-2" />
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f0ebd9] text-[#8a9184] flex items-center justify-center mb-2">
              <Inbox size={22} />
            </div>
            <p className="text-xs font-bold text-[#20271c]">Chưa có thông báo nào</p>
            <p className="text-[11px] text-[#8a9184] mt-0.5">
              Bạn sẽ nhận được thông báo về đơn hàng và cập nhật tại đây.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-3 transition-colors flex items-start gap-3 cursor-pointer group ${
                item.isRead ? 'bg-white hover:bg-[#faf7ef]' : 'bg-[#f4faee]/70 hover:bg-[#ebf6e3]'
              }`}
            >
              {/* Unread indicator dot */}
              <div className="shrink-0 mt-1">
                {!item.isRead ? (
                  <span className="block size-2 rounded-full bg-[#326318]" />
                ) : (
                  <span className="block size-2 rounded-full bg-transparent" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5
                    className={`text-xs truncate ${
                      item.isRead ? 'font-semibold text-[#32392c]' : 'font-extrabold text-[#192014]'
                    }`}
                  >
                    {item.title}
                  </h5>
                  <span className="text-[10px] text-[#8a9184] shrink-0 flex items-center gap-0.5">
                    <Clock size={10} />
                    {formatRelativeTime(item.createAt || item.createdAt)}
                  </span>
                </div>

                <p className="text-[11px] text-[#555e4e] line-clamp-2 mt-0.5 leading-snug">
                  {item.message}
                </p>

                {item.evidence && (
                  <a
                    href={item.evidence}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#326318] hover:underline mt-1"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight size={10} />
                  </a>
                )}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => handleDelete(e, item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-[#8a9184] hover:text-red-500 transition-all shrink-0 cursor-pointer"
                title="Xóa thông báo"
                aria-label="Xóa thông báo"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 border-t border-[#f0ebd9] bg-[#faf7ef] text-center">
          <p className="text-[10px] text-[#8a9184] font-medium">
            Thông báo được cập nhật tự động trong thời gian thực
          </p>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
