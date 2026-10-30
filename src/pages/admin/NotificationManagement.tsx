import React, { useState, useMemo, useEffect } from 'react'
import {
  Send,
  Users,
  User,
  Sprout,
  Truck,
  History,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertCircle,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'
import { useNotificationsPaged, useSendNotification } from '@/features/notification'
import Pagination, { PageInfo } from '@/components/ui/Pagination'
import { useNotificationStore } from '@/stores'
import { formatNotificationDate } from '@/components/common/NotificationModal/NotificationDetailModal'
import type { NotificationItem } from '@/services/notification.types'

type TargetOption = 'all' | 'buyer' | 'farmer' | 'shipper'

const TARGET_MAPPING: Record<TargetOption, string[]> = {
  all: ['BUYER', 'SHOP', 'SHIPPER'],
  buyer: ['BUYER'],
  farmer: ['SHOP'],
  shipper: ['SHIPPER'],
}

const PAGE_SIZE = 5

function getReceiverBadge(item: NotificationItem) {
  const raw =
    item.receiverType ||
    (item.receiverTypes && item.receiverTypes.join(', ')) ||
    item.targetRole ||
    'TẤT CẢ'
  const upper = raw.toUpperCase()

  if (upper.includes('BUYER') && !upper.includes('SHOP') && !upper.includes('SHIPPER')) {
    return { label: 'Người mua', color: 'bg-blue-50 text-blue-700 border-blue-200/70' }
  }
  if (upper.includes('SHOP') && !upper.includes('BUYER') && !upper.includes('SHIPPER')) {
    return { label: 'Nông dân', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' }
  }
  if (upper.includes('SHIPPER') && !upper.includes('BUYER') && !upper.includes('SHOP')) {
    return { label: 'Shipper', color: 'bg-amber-50 text-amber-700 border-amber-200/70' }
  }
  return { label: 'Tất cả đối tượng', color: 'bg-purple-50 text-purple-700 border-purple-200/70' }
}

const NotificationManagement: React.FC = () => {
  const [target, setTarget] = useState<TargetOption>('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [evidence, setEvidence] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  // Bộ lọc lịch sử gửi
  const [filterRole, setFilterRole] = useState<'all' | 'BUYER' | 'SHOP' | 'SHIPPER'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)

  // Tái sử dụng modal xem chi tiết thông báo
  const { openDetail } = useNotificationStore()

  // Debounce từ khóa tìm kiếm 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchKeyword])

  const handleRoleChange = (role: 'all' | 'BUYER' | 'SHOP' | 'SHIPPER') => {
    setFilterRole(role)
    setPage(0)
  }

  // Gọi API phân trang & bộ lọc từ Backend
  const notificationsQuery = useNotificationsPaged(page, PAGE_SIZE, filterRole, debouncedKeyword)
  const send = useSendNotification()

  const pageData = notificationsQuery.data
  const paginatedHistory = pageData?.content ?? []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = Math.max(1, pageData?.totalPages ?? 1)

  const loadingHistory = notificationsQuery.isPending
  const sending = send.isPending
  const error = notificationsQuery.isError
    ? 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.'
    : sendError

  // Đảm bảo trang hợp lệ khi danh sách thay đổi
  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1))
    }
  }, [page, totalPages])

  const pageInfo: PageInfo = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    }),
    [page, totalElements, totalPages],
  )

  const handleSend = async () => {
    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()
    if (!trimmedTitle || !trimmedMessage) return
    setSendError(null)
    try {
      await send.mutateAsync({
        title: trimmedTitle,
        message: trimmedMessage,
        evidence: evidence.trim() || undefined,
        receiverTypes: TARGET_MAPPING[target],
      })
      setTitle('')
      setMessage('')
      setEvidence('')
      setFilterRole('all')
      setSearchKeyword('')
      setPage(0) // Đưa về trang đầu để thấy thông báo mới
      setSuccessNotice('Thông báo đã được gửi thành công đến các đối tượng!')
      setTimeout(() => setSuccessNotice(null), 5000)
    } catch (err) {
      console.error('Failed to send notification', err)
      setSendError('Gửi thông báo thất bại. Vui lòng kiểm tra lại quyền Admin hoặc thử lại sau.')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-5 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 uppercase tracking-tight">
          Quản lý thông báo
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
          Gửi thông báo đẩy đến toàn bộ người dùng hoặc các nhóm đối tượng cụ thể.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Composer Section (Left - 2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Send className="size-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm sm:text-base uppercase tracking-tight">
                Soạn thông báo mới
              </h4>
              <p className="text-[11px] text-gray-400">Chọn nhóm nhận và soạn nội dung cần gửi</p>
            </div>
          </div>

          {successNotice && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-1 duration-200 text-xs sm:text-sm">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span className="font-semibold">{successNotice}</span>
            </div>
          )}

          {sendError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-in fade-in slide-in-from-top-1 duration-200 text-xs sm:text-sm">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span className="font-semibold">{sendError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Target Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Đối tượng nhận <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'all', name: 'Tất cả', icon: Users },
                  { id: 'buyer', name: 'Người mua', icon: User },
                  { id: 'farmer', name: 'Nông dân', icon: Sprout },
                  { id: 'shipper', name: 'Shipper', icon: Truck },
                ].map((t) => {
                  const active = target === t.id
                  return (
                    <button
                      key={t.id as TargetOption}
                      type="button"
                      onClick={() => setTarget(t.id as TargetOption)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50/70'
                      }`}
                    >
                      <t.icon className="size-4 shrink-0" />
                      <span>{t.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Tiêu đề thông báo <span className="text-red-500">*</span>
                </label>
                <span className={`text-[11px] font-medium ${title.length >= 50 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                  {title.length}/50 ký tự
                </span>
              </div>
              <input
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề ngắn gọn (tối đa 50 ký tự)..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Message Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Nội dung chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Nội dung thông báo mà người dùng sẽ nhận được..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-normal text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-gray-400 leading-relaxed"
              />
            </div>

            {/* Evidence / Link Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Link liên kết / Bằng chứng <span className="text-gray-400 font-normal">(Tùy chọn)</span>
                </label>
                {evidence.length > 0 && (
                  <span className={`text-[11px] font-medium ${evidence.length >= 500 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                    {evidence.length}/500 ký tự
                  </span>
                )}
              </div>
              <input
                value={evidence}
                maxLength={500}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="https://... hoặc đường dẫn bài viết, chính sách liên quan"
                className="w-full px-3.5 py-2.5 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-normal text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70 flex items-start gap-2.5">
              <ShieldAlert className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Hành động này sẽ gửi thông báo đẩy đến ngay lập tức. Hãy kiểm tra kỹ nội dung trước khi
                gửi để tránh gây phiền hà cho người dùng.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] ${
                sending || !title.trim() || !message.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
              }`}
            >
              {sending ? (
                'Đang gửi thông báo...'
              ) : (
                <>
                  <Send className="size-4" /> Gửi thông báo ngay
                </>
              )}
            </button>
          </div>
        </div>

        {/* History Section (Right - 1 Col) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="size-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 shrink-0">
                <History className="size-3.5" />
              </div>
              <h4 className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-tight">
                Lịch sử gửi
              </h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {totalElements} mục
            </span>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2 pb-2.5 border-b border-gray-100">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200/80 rounded-lg text-xs font-normal text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-gray-400"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {[
                { id: 'all', name: 'Tất cả' },
                { id: 'BUYER', name: 'Người mua' },
                { id: 'SHOP', name: 'Nông dân' },
                { id: 'SHIPPER', name: 'Shipper' },
              ].map((r) => {
                const active = filterRole === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleChange(r.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                    }`}
                  >
                    {r.name}
                  </button>
                )
              })}
            </div>
          </div>

          {loadingHistory && (
            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
              <Clock className="size-4 text-primary animate-spin" />
              <p className="text-xs font-medium text-gray-600">Đang tải lịch sử thông báo...</p>
            </div>
          )}

          {error && !loadingHistory && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2.5">
              <AlertCircle className="size-4 text-red-500 shrink-0" />
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          {!loadingHistory && !error && (
            <>
              {paginatedHistory.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs text-gray-500 font-medium">
                    {searchKeyword || filterRole !== 'all'
                      ? 'Không tìm thấy thông báo nào phù hợp với bộ lọc'
                      : 'Chưa có thông báo nào được gửi'}
                  </p>
                  {(searchKeyword || filterRole !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchKeyword('')
                        setFilterRole('all')
                        setPage(0)
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedHistory.map((h) => {
                    const badge = getReceiverBadge(h)
                    const dateStr = h.createAt || h.createdAt

                    return (
                      <div
                        key={h.id ?? h.notiId ?? Math.random()}
                        onClick={() =>
                          openDetail(
                            {
                              ...h,
                              receiverType: badge.label,
                              isRead: true,
                            },
                            { readOnly: true },
                          )
                        }
                        className="p-3 bg-gray-50/60 hover:bg-emerald-50/30 rounded-xl border border-gray-200/70 hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer group space-y-1.5"
                        title="Bấm để xem chi tiết thông báo"
                      >
                        {/* Row 1: Badge + Time */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium shrink-0">
                            {formatNotificationDate(dateStr)}
                          </span>
                        </div>

                        {/* Row 2: Title */}
                        <h5 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                          {h.title}
                        </h5>

                        {/* Row 3: Preview Message (1 line) */}
                        <p className="text-[11px] text-gray-500 line-clamp-1 leading-normal">
                          {h.message}
                        </p>

                        {/* Row 4: Status + View Detail Hint */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                            <CheckCircle2 className="size-2.5" /> Đã gửi
                          </span>
                          <span className="inline-flex items-center text-[10px] font-semibold text-gray-400 group-hover:text-primary transition-colors">
                            Chi tiết <ChevronRight className="size-3 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Phân trang Pagination từ BE */}
              {totalPages > 1 && (
                <div className="pt-2 border-t border-gray-100">
                  <Pagination pageInfo={pageInfo} onPageChange={setPage} className="px-0 py-1" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationManagement
