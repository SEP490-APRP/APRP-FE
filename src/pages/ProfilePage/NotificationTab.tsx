import React, { useState, useMemo } from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Inbox,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react'
import { useNotificationStore } from '@/stores'
import type { NotificationItem } from '@/services/notification.types'
import { formatNotificationDate } from '@/components/common/NotificationModal/NotificationDetailModal'

const ITEMS_PER_PAGE = 7

export default function NotificationTab() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    deleteNotification,
    openDetail,
  } = useNotificationStore()

  const [filterType, setFilterType] = useState<'all' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter & Search
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((item) => item && (item.title || item.message))
      .filter((item) => {
        if (filterType === 'unread' && item.isRead) return false
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          const titleMatch = item.title?.toLowerCase().includes(query)
          const msgMatch = item.message?.toLowerCase().includes(query)
          return titleMatch || msgMatch
        }
        return true
      })
  }, [notifications, filterType, searchQuery])

  // Pagination calculation
  const totalItems = filteredNotifications.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedList = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * ITEMS_PER_PAGE
    return filteredNotifications.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  }, [filteredNotifications, safeCurrentPage])

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    deleteNotification(id)
  }

  const handleCardClick = (item: NotificationItem) => {
    openDetail(item)
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#eee8db]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1b2216]">
              Thông báo của tôi
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-red-500 text-white font-bold text-[11px] shadow-xs">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="text-xs text-[#6e7768] mt-0.5">
            Xem lại thông báo hệ thống, cập nhật đơn hàng và tin tức điều hành.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#326318] text-white text-xs font-semibold hover:bg-[#254b12] transition-colors shadow-xs cursor-pointer"
            >
              <CheckCheck size={13} />
              <span>Đọc tất cả ({unreadCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white border border-[#e2dcce] text-xs font-semibold text-[#444d3e] hover:bg-[#f6f3eb] transition-colors cursor-pointer"
            title="Làm mới thông báo"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin text-[#326318]' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#f0ebd9]/60 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setFilterType('all')
              setCurrentPage(1)
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-[#1b2216] shadow-xs'
                : 'text-[#616c59] hover:text-[#1b2216]'
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('unread')
              setCurrentPage(1)
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'unread'
                ? 'bg-white text-[#1b2216] shadow-xs'
                : 'text-[#616c59] hover:text-[#1b2216]'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b9484]" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#e2dcce] rounded-lg focus:outline-none focus:border-[#326318] focus:ring-1 focus:ring-[#326318] transition-all"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {isLoading && notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-block size-6 border-2 border-[#326318] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-[#717b6a]">Đang tải danh sách thông báo...</p>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="py-12 px-4 text-center bg-[#faf8f4] rounded-xl border border-dashed border-[#e6e0d3]">
            <div className="w-11 h-11 mx-auto rounded-xl bg-[#eee8db] text-[#86907f] flex items-center justify-center mb-2">
              <Inbox size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1b2216]">Không tìm thấy thông báo nào</h4>
            <p className="text-xs text-[#717b6a] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Không có thông báo phù hợp với từ khóa tìm kiếm của bạn.'
                : filterType === 'unread'
                ? 'Tuyệt vời! Bạn đã đọc hết toàn bộ thông báo.'
                : 'Bạn sẽ nhận được các thông báo cập nhật về đơn hàng và tin tức tại đây.'}
            </p>
          </div>
        ) : (
          paginatedList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-xs relative ${
                item.isRead
                  ? 'bg-white border-[#ebe6dc] hover:border-[#d0c9b8]'
                  : 'bg-[#f7fbf4] border-[#d4e4cc] hover:border-[#326318]/50 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {/* Subtle Bell Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      item.isRead
                        ? 'bg-[#f0ece1] text-[#788271]'
                        : 'bg-[#326318]/12 text-[#326318]'
                    }`}
                  >
                    <Bell size={14} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      {!item.isRead && (
                        <span className="size-1.5 rounded-full bg-[#326318] shrink-0" />
                      )}
                      <h4
                        className={`text-xs sm:text-sm leading-snug break-words ${
                          item.isRead ? 'font-semibold text-[#2d3527]' : 'font-bold text-[#151c11]'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.receiverType && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#326318] bg-[#326318]/10 px-1.5 py-0.2 rounded-md">
                          {item.receiverType}
                        </span>
                      )}
                    </div>

                    {/* Metadata: Date & Sender */}
                    <div className="flex items-center gap-2 text-[11px] text-[#7d8776] mb-1">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{formatNotificationDate(item.createAt || item.createdAt)}</span>
                      </span>
                      {item.adminName && (
                        <span>• Người gửi: <strong>{item.adminName}</strong></span>
                      )}
                    </div>

                    {/* Excerpt Message: Compact line-clamp */}
                    <p className="text-xs text-[#525d4b] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Action Link: "Xem thêm >" triggers detail modal */}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetail(item)
                        }}
                        className="text-[11px] font-bold text-[#326318] hover:text-[#204410] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem thêm</span>
                        <ChevronRight size={11} />
                      </button>

                      {item.evidence && (
                        <span className="text-[11px] text-[#86907f] flex items-center gap-1">
                          • Có liên kết đính kèm
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDetail(item)
                    }}
                    className="p-1 rounded-md hover:bg-[#ede7da] text-[#788271] hover:text-[#1b2216] transition-colors cursor-pointer"
                    title="Mở xem chi tiết"
                  >
                    <Maximize2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1 rounded-md hover:bg-red-50 text-[#8c9684] hover:text-red-600 transition-colors cursor-pointer"
                    title="Xóa thông báo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-[#eee8db] text-xs text-[#636e5b]">
          <div>
            Hiển thị <strong>{paginatedList.length}</strong> / <strong>{totalItems}</strong> thông báo
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#e2dcce] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f6f3eb] transition-colors cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft size={13} />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    safeCurrentPage === pageNum
                      ? 'bg-[#326318] text-white shadow-xs'
                      : 'border border-[#e2dcce] bg-white text-[#444d3e] hover:bg-[#f6f3eb]'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#e2dcce] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f6f3eb] transition-colors cursor-pointer"
              title="Trang kế tiếp"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
