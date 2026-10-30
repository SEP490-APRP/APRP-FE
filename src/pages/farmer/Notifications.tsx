import React from 'react'
import { Bell, CheckCheck, Trash2, Clock, Inbox, RefreshCw } from 'lucide-react'
import { useNotificationStore } from '@/stores'

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

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'Vừa xong'
  }
}

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore()

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4 animate-fadeIn max-w-3xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Thông Báo Hệ Thống</h3>
          <p className="text-xs text-[#879080] mt-0.5">
            Cập nhật từ quản trị viên, thông tin đơn hàng và thông báo vận hành nhà vườn
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-bold text-[#326318] hover:text-[#234710] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#326318]/10 transition-colors"
            >
              <CheckCheck size={14} />
              <span>Đọc tất cả ({unreadCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            title="Làm mới"
            aria-label="Làm mới"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-[#326318]' : ''} />
          </button>
        </div>
      </div>

      <div id="tour-notifications-list" className="divide-y divide-[#f1f4ed]">
        {isLoading && notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#879080]">
            <div className="inline-block size-6 border-2 border-[#326318] border-t-transparent rounded-full animate-spin mb-2" />
            <p>Đang tải thông báo từ hệ thống...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f4f7f1] text-[#879080] flex items-center justify-center mb-3">
              <Inbox size={26} />
            </div>
            <h4 className="text-sm font-bold text-[#1c2216]">Chưa có thông báo nào</h4>
            <p className="text-xs text-[#879080] mt-1">
              Bạn sẽ nhận được các thông báo đơn hàng và thông điệp từ ban quản trị tại đây.
            </p>
          </div>
        ) : (
          notifications
            .filter((nt) => nt && (nt.title || nt.message))
            .map((nt) => (
            <div
              key={nt.id}
              onClick={() => {
                if (!nt.isRead) markAsRead(nt.id)
              }}
              className={`py-4 px-3 flex items-start gap-4 rounded-2xl transition-all cursor-pointer group ${
                nt.isRead
                  ? 'hover:bg-[#fafcf9] opacity-80'
                  : 'bg-[#f6faf2]/60 hover:bg-[#edf5e7]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                  nt.isRead
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-[#326318]/15 text-[#326318] shadow-sm'
                }`}
              >
                <Bell size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!nt.isRead && (
                      <span className="size-2 rounded-full bg-[#326318] shrink-0" />
                    )}
                    <h5
                      className={`text-sm truncate ${
                        nt.isRead ? 'font-bold text-[#32392c]' : 'font-extrabold text-[#1c2216]'
                      }`}
                    >
                      {nt.title}
                    </h5>
                  </div>
                  <span className="text-[11px] text-[#879080] shrink-0 flex items-center gap-1">
                    <Clock size={11} />
                    {formatRelativeTime(nt.createAt || nt.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-[#636c5f] mt-1 leading-relaxed">
                  {nt.message}
                </p>

                {nt.evidence && (
                  <a
                    href={nt.evidence}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block text-xs font-bold text-[#326318] hover:underline mt-2"
                  >
                    Đính kèm / Chi tiết →
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNotification(nt.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shrink-0 cursor-pointer"
                title="Xóa thông báo"
                aria-label="Xóa thông báo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
