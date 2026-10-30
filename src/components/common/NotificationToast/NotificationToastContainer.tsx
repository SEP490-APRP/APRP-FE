import React from 'react'
import { Bell, X, ArrowRight } from 'lucide-react'
import { useNotificationStore, type ActiveNotificationToast } from '@/stores'

export const NotificationToastContainer: React.FC = () => {
  const activeToasts = useNotificationStore((s) => s.activeToasts)
  const dismissToast = useNotificationStore((s) => s.dismissToast)
  const openDetail = useNotificationStore((s) => s.openDetail)

  if (!activeToasts || activeToasts.length === 0) return null

  const handleToastClick = (toast: ActiveNotificationToast) => {
    dismissToast(toast.id)
    openDetail(toast.notification)
  }

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {activeToasts.map((toast) => {
        const item = toast.notification
        return (
          <div
            key={toast.id}
            onClick={() => handleToastClick(toast)}
            className="group pointer-events-auto relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 hover:border-emerald-300 transition-all duration-300 hover:scale-[1.01] cursor-pointer p-4 animate-in slide-in-from-right-8 fade-in duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 text-[#326318] flex items-center justify-center mt-0.5 group-hover:bg-emerald-100 transition-colors">
                <Bell size={20} className="animate-pulse" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded">
                    Thông báo mới
                  </span>
                  <span className="text-[11px] text-gray-400">Vừa xong</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {item.title || 'Thông báo hệ thống'}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                  {item.message}
                </p>

                {item.evidence && (
                  <div className="mt-2 text-xs font-medium text-[#326318] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Xem liên kết đính kèm</span>
                    <ArrowRight size={13} />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  dismissToast(toast.id)
                }}
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default NotificationToastContainer
