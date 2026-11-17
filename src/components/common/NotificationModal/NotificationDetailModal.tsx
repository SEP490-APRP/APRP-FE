import React, { useEffect } from 'react'
import { Bell, Calendar, User, ExternalLink, Trash2, X, CheckCheck } from 'lucide-react'
import { useNotificationStore } from '@/stores'

export function formatNotificationDate(dateValue?: any): string {
  if (!dateValue) return 'Vừa xong'
  try {
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour = 0, minute = 0] = dateValue
      const d = new Date(year, month - 1, day, hour, minute)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    const str = String(dateValue).trim()

    // Match 12+ digit strings like 2026102810578109109000
    if (/^\d{12,}/.test(str)) {
      const y = parseInt(str.substring(0, 4), 10)
      const m = parseInt(str.substring(4, 6), 10) - 1
      const d = parseInt(str.substring(6, 8), 10)
      const h = parseInt(str.substring(8, 10), 10)
      const min = parseInt(str.substring(10, 12), 10)
      const dt = new Date(y, m, d, h, min)
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      }
    }

    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    return str
  } catch {
    return String(dateValue)
  }
}

export function getSafeLink(rawUrl?: string): { isSafe: boolean; href: string } {
  if (!rawUrl) return { isSafe: false, href: '' }
  const trimmed = rawUrl.trim()
  if (!trimmed) return { isSafe: false, href: '' }
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return { isSafe: false, href: '' }
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return { isSafe: true, href: trimmed }
  }
  return { isSafe: true, href: `https://${trimmed}` }
}

export const NotificationDetailModal: React.FC = () => {
  const {
    selectedNotification,
    isDetailOpen,
    isReadOnly,
    closeDetail,
    deleteNotification,
    markAsRead,
  } = useNotificationStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDetailOpen) {
        closeDetail()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailOpen, closeDetail])

  if (!isDetailOpen || !selectedNotification) return null

  const noti = selectedNotification

  const handleDelete = () => {
    deleteNotification(noti.id)
    closeDetail()
  }

  const handleMarkAsRead = () => {
    if (!noti.isRead) {
      markAsRead(noti.id)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
      onClick={closeDetail}
      role="dialog"
      aria-modal="true"
      aria-labelledby="noti-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#ece7dc] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ebd9] bg-[#faf7ef]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#326318]/10 text-[#326318] flex items-center justify-center shrink-0">
              <Bell size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#326318] bg-[#326318]/10 px-2 py-0.5 rounded-md">
                  {noti.receiverType ? noti.receiverType : 'Hệ thống'}
                </span>
                <span className="text-[11px] text-[#828c7b] flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{formatNotificationDate(noti.createAt || noti.createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDetail}
            className="p-1 rounded-lg hover:bg-[#eae3d2] text-[#717b6a] hover:text-[#1c2216] transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3.5">
          <div>
            <h3 id="noti-modal-title" className="text-base font-bold text-[#1c2216] leading-snug">
              {noti.title}
            </h3>
            {noti.adminName ? (
              <div className="flex items-center gap-1.5 text-xs text-[#6a7563] mt-1 font-medium">
                <User size={12} className="text-[#326318]" />
                <span>Người gửi: <strong>{noti.adminName}</strong> (Ban Quản Trị)</span>
              </div>
            ) : isReadOnly ? (
              <div className="flex items-center gap-1.5 text-xs text-[#6a7563] mt-1 font-medium">
                <User size={12} className="text-[#326318]" />
                <span>Người gửi: <strong>Ban Quản Trị</strong> (Hệ thống)</span>
              </div>
            ) : null}
          </div>

          <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#f0ece1] text-xs text-[#3b4435] leading-relaxed whitespace-pre-wrap select-text max-h-[45vh] overflow-y-auto">
            {noti.message}
          </div>

          {/* Evidence / Attach Link */}
          {noti.evidence && (() => {
            const safe = getSafeLink(noti.evidence)
            return (
              <div className="p-3 rounded-xl bg-[#f2f8ed] border border-[#dcebd3] flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#2a5015] uppercase tracking-wide">Liên kết đính kèm</p>
                  <p className="text-xs text-[#4c5c44] truncate mt-0.5">{noti.evidence}</p>
                </div>
                {safe.isSafe ? (
                  <a
                    href={safe.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#326318] text-white text-xs font-bold hover:bg-[#254a11] transition-colors shadow-xs"
                  >
                    <span>Mở link</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="shrink-0 px-2.5 py-1 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                    Liên kết không an toàn
                  </span>
                )}
              </div>
            )
          })()}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#f0ebd9] bg-[#faf7ef] flex items-center justify-between gap-3">
          {!isReadOnly ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Xoá thông báo</span>
              </button>

              <div className="flex items-center gap-2">
                {!noti.isRead && (
                  <button
                    type="button"
                    onClick={handleMarkAsRead}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#326318] bg-white border border-[#326318]/30 hover:bg-[#f2f8ed] transition-colors cursor-pointer"
                  >
                    <CheckCheck size={13} />
                    <span>Đánh dấu đã đọc</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDetail}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#47523f] bg-white border border-[#e5dfd2] hover:bg-[#f2ede1] transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={closeDetail}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors cursor-pointer shadow-xs"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationDetailModal
