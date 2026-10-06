import React, { useState } from 'react'
import {
  Send,
  Users,
  User,
  Sprout,
  Truck,
  History,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react'
import { useNotifications, useSendNotification } from '@/features/notification'
import { globalShowAlert } from '@/components/common/Popup'

type TargetOption = 'all' | 'buyer' | 'farmer' | 'shipper'

const TARGET_MAPPING: Record<TargetOption, string[]> = {
  all: ['BUYER', 'SHOP_OWNER', 'SHIPPER'],
  buyer: ['BUYER'],
  farmer: ['SHOP_OWNER'],
  shipper: ['SHIPPER'],
}

const NotificationManagement: React.FC = () => {
  const [target, setTarget] = useState<TargetOption>('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)

  const notificationsQuery = useNotifications()
  const send = useSendNotification()

  const history = notificationsQuery.data ?? []
  const loadingHistory = notificationsQuery.isPending
  const sending = send.isPending
  const error = notificationsQuery.isError
    ? 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.'
    : sendError

  const handleSend = async () => {
    if (!title || !message) return
    setSendError(null)
    try {
      await send.mutateAsync({
        title,
        message,
        receiverTypes: TARGET_MAPPING[target],
      })
      setTitle('')
      setMessage('')
      globalShowAlert('Thông báo đã được gửi thành công!', 'Thành công', 'success')
    } catch (err) {
      console.error('Failed to send notification', err)
      setSendError('Gửi thông báo thất bại. Vui lòng kiểm tra lại quyền Admin hoặc thử lại sau.')
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black font-display text-gray-900 uppercase">
          Quản lý thông báo
        </h2>
        <p className="text-gray-400 font-medium text-sm mt-1">
          Gửi thông báo đẩy đến toàn bộ người dùng hoặc các nhóm đối tượng cụ thể.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Composer Section */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 flex flex-col gap-10">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Send className="size-5" />
            </div>
            <h4 className="font-black text-gray-800 uppercase tracking-tight">
              Soạn thông báo mới
            </h4>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Đối tượng nhận
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'all', name: 'Tất cả', icon: Users },
                  { id: 'buyer', name: 'Người mua', icon: User },
                  { id: 'farmer', name: 'Nông dân', icon: Sprout },
                  { id: 'shipper', name: 'Shipper', icon: Truck },
                ].map((t) => (
                  <button
                    key={t.id as TargetOption}
                    onClick={() => setTarget(t.id as TargetOption)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      target === t.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-50 text-gray-400 hover:border-gray-100'
                    }`}
                  >
                    <t.icon className="size-5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Tiêu đề thông báo
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề ngắn gọn..."
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[24px] text-sm font-black outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Nội dung chi tiết
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Nội dung thông báo mà người dùng sẽ thấy..."
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[24px] text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="bg-orange-50/50 p-6 rounded-[28px] border border-orange-100 flex items-start gap-4">
              <ShieldAlert className="size-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">
                Hành động này sẽ gửi thông báo đẩy đến ngay lập tức. Hãy kiểm tra kỹ nội dung trước
                khi gửi để tránh gây phiền hà cho người dùng.
              </p>
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !title || !message}
              className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl ${
                sending
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark'
              }`}
            >
              {sending ? (
                'ĐANG GỬI...'
              ) : (
                <>
                  <Send className="size-5" /> GỬI THÔNG BÁO NGAY
                </>
              )}
            </button>
          </div>
        </div>

        {/* History Section */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <History className="size-5 text-gray-400" />
              <h4 className="font-black text-gray-800 uppercase tracking-tight">Lịch sử gửi</h4>
            </div>

            {loadingHistory && (
              <div className="p-5 bg-gray-50/80 rounded-3xl border border-gray-100 flex items-center gap-3">
                <Clock className="size-4 text-primary" />
                <p className="text-xs font-medium text-gray-600">Đang tải lịch sử thông báo...</p>
              </div>
            )}

            {error && !loadingHistory && (
              <div className="p-5 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-3">
                <AlertCircle className="size-4 text-red-500" />
                <p className="text-xs font-medium text-red-700">{error}</p>
              </div>
            )}

            {!loadingHistory && !error && (
              <div className="space-y-4">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:border-primary/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                        {(h.receiverType || 'HỆ THỐNG').toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400">
                        {h.createAt ? new Date(h.createAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>
                    <h5 className="text-sm font-black text-gray-900 leading-snug">{h.title}</h5>
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">{h.message}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="size-3" /> ĐÃ GỬI
                      </span>
                      <button className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {!history.length && (
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] text-center">
                    Chưa có thông báo nào được gửi
                  </p>
                )}
              </div>
            )}

            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline mx-auto">
              Xem báo cáo chi tiết
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add fix: Export default
export default NotificationManagement
