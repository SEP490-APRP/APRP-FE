import React, { useState, useMemo } from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Inbox,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Truck,
  Wallet,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { useNotificationStore } from '@/stores'
import { ShopPageHeader } from '@/features/shop'
import type { NotificationItem } from '@/services/notification.types'

interface NotificationsProps {
  onOpenOrderPrep?: (orderId: string) => void
  onNavigateTab?: (tabId: string) => void
  onNavigateToProducts?: (keyword?: string) => void
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

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Vừa xong'
  }
}

/** Trích xuất mã đơn, mã sản phẩm hoặc gợi ý hành động từ nội dung thông báo */
function parseNotificationAction(nt: NotificationItem) {
  const text = `${nt.title || ''} ${nt.message || ''}`.toLowerCase()
  const orderMatch = text.match(/#(\d+)/) || text.match(/đơn\s*(?:hàng)?\s*(?:#)?(\d+)/i)
  const orderId = nt.referenceId ? String(nt.referenceId) : orderMatch ? orderMatch[1] : null

  if (text.includes('đổi trả') || text.includes('khiếu nại') || text.includes('hoàn tiền')) {
    return {
      type: 'DISPUTE',
      label: orderId ? `Xử lý khiếu nại #${orderId}` : 'Kiểm tra khiếu nại',
      targetTab: 'disputes',
      orderId,
    }
  }

  if (text.includes('quyết toán') || text.includes('ví') || text.includes('doanh thu')) {
    return {
      type: 'WALLET',
      label: 'Xem biến động ví',
      targetTab: 'wallet',
      orderId: null,
    }
  }

  if (text.includes('đơn hàng') || text.includes('chờ xử lý') || text.includes('giao hàng') || text.includes('tài xế') || text.includes('trả hàng') || text.includes('hoàn về')) {
    if (orderId) {
      const isReturnDone = text.includes('đã trả hàng') || text.includes('xác nhận đã nhận lại')
      const isTrackOrInfo =
        text.includes('đang hoàn về') ||
        text.includes('đã lấy hàng') ||
        text.includes('giao thất bại') ||
        text.includes('giao không thành công') ||
        text.includes('đã nhận đơn') ||
        text.includes('đã giao')
      return {
        type: 'ORDER' as const,
        label: isReturnDone
          ? `Kiểm tra & Xác nhận hoàn #${orderId}`
          : isTrackOrInfo
            ? `Xem đơn hàng #${orderId}`
            : `Đóng gói đơn #${orderId}`,
        targetTab: 'orders',
        orderId,
        openPrep: !isReturnDone && !isTrackOrInfo,
      }
    }
    return {
      type: 'ORDER',
      label: 'Quản lý đơn hàng',
      targetTab: 'orders',
      orderId: null,
    }
  }

  if (text.includes('sản phẩm') || text.includes('phê duyệt') || text.includes('từ chối')) {
    // Trích xuất tên sản phẩm nếu nằm trong dấu ngoặc kép hoặc đơn
    const nameMatch = text.match(/["'“]([^"'“”]+)["'”]/)
    const prodName = nameMatch ? nameMatch[1] : undefined
    return {
      type: 'PRODUCT',
      label: prodName ? `Xem nông sản "${prodName}"` : 'Xem kho nông sản',
      targetTab: 'products',
      productName: prodName,
    }
  }

  return null
}

export default function Notifications({
  onOpenOrderPrep,
  onNavigateTab,
  onNavigateToProducts,
}: NotificationsProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore()

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'ORDERS' | 'WALLET_SYSTEM'>('ALL')

  // Phân loại danh sách theo tab lọc
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((nt) => nt && (nt.title || nt.message))
      .filter((nt) => {
        if (activeFilter === 'UNREAD') return !nt.isRead
        const text = `${nt.title || ''} ${nt.message || ''}`.toLowerCase()
        if (activeFilter === 'ORDERS') {
          return text.includes('đơn hàng') || text.includes('tài xế') || text.includes('giao hàng')
        }
        if (activeFilter === 'WALLET_SYSTEM') {
          return (
            text.includes('quyết toán') ||
            text.includes('ví') ||
            text.includes('phê duyệt') ||
            text.includes('khiếu nại')
          )
        }
        return true
      })
  }, [notifications, activeFilter])

  const handleActionClick = (
    e: React.MouseEvent,
    action: ReturnType<typeof parseNotificationAction>,
    ntId: number,
  ) => {
    e.stopPropagation()
    markAsRead(ntId)

    if (!action) return

    if (action.type === 'ORDER' && action.orderId && action.openPrep && onOpenOrderPrep) {
      onOpenOrderPrep(action.orderId)
    } else if (action.type === 'PRODUCT' && onNavigateToProducts) {
      onNavigateToProducts(action.productName)
    } else if (action.targetTab && onNavigateTab) {
      onNavigateTab(action.targetTab)
    }
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <ShopPageHeader
        title="Thông Báo Hệ Thống"
        badge={
          unreadCount > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
              {unreadCount} chưa đọc
            </span>
          ) : undefined
        }
        subtitle="Cập nhật tức thời về đơn hàng cần xử lý, quy trình vận chuyển và thông điệp vận hành"
        actions={
          <>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-bold text-[#2b5619] hover:text-[#1e3d12] flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2b5619]/10 hover:bg-[#2b5619]/15 transition-colors cursor-pointer border border-[#2b5619]/20"
              >
                <CheckCheck size={15} />
                <span>Đánh dấu đã đọc tất cả</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchNotifications}
              disabled={isLoading}
              className="p-2 rounded-lg border border-[#d6dcce] bg-white hover:bg-[#f4f7f1] text-[#424a3c] transition-colors cursor-pointer shadow-2xs"
              title="Làm mới thông báo"
              aria-label="Làm mới thông báo"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-[#2b5619]' : ''} />
            </button>
          </>
        }
      />

      {/* Filter Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            activeFilter === 'ALL'
              ? 'bg-[#2b5619] text-white shadow-xs'
              : 'bg-white text-[#555d4e] border border-[#e8ece3] hover:bg-[#f4f7f1]'
          }`}
        >
          Tất cả ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('UNREAD')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            activeFilter === 'UNREAD'
              ? 'bg-[#2b5619] text-white shadow-xs'
              : 'bg-white text-[#555d4e] border border-[#e8ece3] hover:bg-[#f4f7f1]'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('ORDERS')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            activeFilter === 'ORDERS'
              ? 'bg-[#2b5619] text-white shadow-xs'
              : 'bg-white text-[#555d4e] border border-[#e8ece3] hover:bg-[#f4f7f1]'
          }`}
        >
          Đơn hàng &amp; Vận chuyển
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('WALLET_SYSTEM')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
            activeFilter === 'WALLET_SYSTEM'
              ? 'bg-[#2b5619] text-white shadow-xs'
              : 'bg-white text-[#555d4e] border border-[#e8ece3] hover:bg-[#f4f7f1]'
          }`}
        >
          Ví tiền &amp; Phê duyệt
        </button>
      </div>

      {/* Main Notification Card List */}
      <div className="bg-white rounded-2xl border border-[#e8ece3] shadow-xs overflow-hidden">
        {isLoading && notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#555d4e] space-y-2">
            <div className="inline-block size-6 border-2 border-[#2b5619] border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold">Đang cập nhật thông báo từ hệ thống...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f4f7f1] text-[#2b5619] flex items-center justify-center border border-[#e2ebd9]">
              <Inbox size={26} />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#1c2216]">
                {activeFilter === 'UNREAD' ? 'Tuyệt vời! Không còn thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </h4>
              <p className="text-xs text-[#555d4e] mt-1 max-w-sm mx-auto">
                {activeFilter === 'UNREAD'
                  ? 'Bạn đã hoàn tất xử lý tất cả các thông báo vận hành mới nhất.'
                  : 'Các thông báo quan trọng về đơn hàng, shipper và doanh thu sẽ hiển thị tại đây.'}
              </p>
            </div>
            {activeFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className="text-xs font-bold text-[#2b5619] bg-[#2b5619]/10 px-3 py-1.5 rounded-lg hover:bg-[#2b5619]/20 transition-colors cursor-pointer"
              >
                Xem tất cả thông báo
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#f1f4ed]">
            {filteredNotifications.map((nt) => {
              const textLower = `${nt.title || ''} ${nt.message || ''}`.toLowerCase()
              const isOrder = textLower.includes('đơn hàng') || textLower.includes('giao hàng')
              const isDispute = textLower.includes('đổi trả') || textLower.includes('khiếu nại')
              const isApproved = textLower.includes('phê duyệt') || nt.type === 'PRODUCT_APPROVED'
              const isRejected = textLower.includes('từ chối') || nt.type === 'PRODUCT_REJECTED'
              const isWallet = textLower.includes('quyết toán') || textLower.includes('tiền')

              const action = parseNotificationAction(nt)

              return (
                <div
                  key={nt.id}
                  onClick={() => {
                    if (!nt.isRead) markAsRead(nt.id)
                  }}
                  className={`p-4 sm:p-5 flex items-start gap-3.5 transition-all cursor-pointer group ${
                    nt.isRead
                      ? 'bg-white hover:bg-[#fafcf9]'
                      : 'bg-[#f7faf4] hover:bg-[#edf5e7] border-l-4 border-l-[#2b5619]'
                  }`}
                >
                  {/* Category Icon Badge */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isDispute
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : isWallet
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : isOrder
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 size={18} />
                    ) : isRejected ? (
                      <XCircle size={18} />
                    ) : isDispute ? (
                      <AlertCircle size={18} />
                    ) : isWallet ? (
                      <Wallet size={18} />
                    ) : isOrder ? (
                      <ShoppingBag size={18} />
                    ) : (
                      <Bell size={18} />
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {!nt.isRead && (
                          <span
                            className="size-2 rounded-full bg-[#2b5619] shrink-0"
                            title="Chưa đọc"
                          />
                        )}
                        <h5
                          className={`text-sm truncate ${
                            nt.isRead ? 'font-bold text-[#1c2216]' : 'font-black text-[#1c2216]'
                          }`}
                        >
                          {nt.title}
                        </h5>
                      </div>

                      <span className="text-[11px] text-[#555d4e] font-semibold shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
                        <Clock size={12} className="text-[#848d7e]" />
                        <span>{formatRelativeTime(nt.createAt || nt.createdAt)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#414b3d] mt-1.5 leading-relaxed font-normal">
                      {nt.message}
                    </p>

                    {/* Action Row & Deep Link */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {action && (
                        <button
                          type="button"
                          onClick={(e) => handleActionClick(e, action, nt.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b5619] hover:bg-[#1e3d12] text-white text-[11px] font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <span>{action.label}</span>
                          <ArrowRight size={12} />
                        </button>
                      )}

                      {nt.evidence && (
                        <a
                          href={nt.evidence}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2b5619] hover:underline px-2.5 py-1.5 rounded-lg bg-[#2b5619]/10"
                        >
                          <span>Xem ảnh chứng từ</span>
                          <ArrowRight size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(nt.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all shrink-0 cursor-pointer self-start"
                    title="Xóa thông báo này"
                    aria-label="Xóa thông báo này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
