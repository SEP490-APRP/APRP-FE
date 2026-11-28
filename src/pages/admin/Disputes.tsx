import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  VideoOff,
  ZoomIn,
  Download,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Film,
  User,
  Store,
  ShieldCheck,
  X,
} from 'lucide-react'
import { returnService, ReturnRequestResponse } from '@/services/return.service'
import { useCheckDisputePayout, useDisputeAction, useDisputes } from '@/features/order'
import { globalShowAlert } from '@/components/common/Popup'
import { QRCodeSVG } from 'qrcode.react'

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes} - ${day}/${month}/${year}`
}

const Disputes: React.FC = () => {
  const [selectedDispute, setSelectedDispute] = useState<ReturnRequestResponse | null>(null)
  const [adminRemark, setAdminRemark] = useState('')
  const [payOSQR, setPayOSQR] = useState<{ qrCodeUrl: string; checkoutUrl: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeEvidence, setActiveEvidence] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  const disputesQuery = useDisputes()
  const disputeAction = useDisputeAction()
  const checkPayout = useCheckDisputePayout()

  const disputes = disputesQuery.data ?? []
  const loading = disputesQuery.isFetching
  const submitting = disputeAction.isPending

  const fetchDisputes = () => void disputesQuery.refetch()

  // Lọc theo từ khóa và trạng thái
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !term ||
        (d.productName?.toLowerCase() || '').includes(term) ||
        d.id.toString().includes(term) ||
        (d.orderId?.toString() || '').includes(term) ||
        (d.buyerName?.toLowerCase() || '').includes(term) ||
        (d.shopName?.toLowerCase() || '').includes(term)

      if (!matchesSearch) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'PENDING') {
        return (
          d.status === 'DISPUTED' ||
          d.status === 'ADMIN_APPROVED' ||
          d.status === 'REFUND_PENDING' ||
          d.status === 'RETURN_SHIPPING' ||
          d.status === 'RETURN_PICKED_UP' ||
          d.status === 'RETURN_DELIVERED'
        )
      }
      if (statusFilter === 'COMPLETED') {
        return d.status === 'COMPLETED' || d.status === 'APPROVED'
      }
      if (statusFilter === 'REJECTED') {
        return d.status === 'REJECTED' || d.status === 'CANCELLED' || d.status === 'RETURN_FAILED'
      }
      return true
    })
  }, [disputes, searchTerm, statusFilter])

  // Tự động chọn item đầu tiên khi danh sách tải xong hoặc khi đổi bộ lọc
  useEffect(() => {
    if (filteredDisputes.length > 0) {
      if (!selectedDispute || !filteredDisputes.some((d) => d.id === selectedDispute.id)) {
        setSelectedDispute(filteredDisputes[0])
        setActiveEvidence(0)
      }
    } else {
      setSelectedDispute(null)
    }
  }, [filteredDisputes, selectedDispute])

  // Xử lý callback PayOS nếu có
  useEffect(() => {
    const checkReturnUrl = async () => {
      const params = new URLSearchParams(window.location.search)
      const orderCode = params.get('orderCode')
      const status = params.get('status')

      if (orderCode && status === 'PAID') {
        try {
          await returnService.autoCheckPayout(Number(orderCode))
          globalShowAlert(
            'Thanh toán hoàn tiền thành công và đã được ghi nhận!',
            'Thông báo',
            'success',
          )
        } catch (err) {
          console.error('Auto-check failed:', err)
        }
        window.history.replaceState({}, '', window.location.pathname)
        fetchDisputes()
      }
    }

    checkReturnUrl()
  }, [])

  const handleAdminAction = async (accept: boolean, refundPct: number = 100) => {
    if (!selectedDispute) return
    const finalRemark =
      adminRemark.trim() ||
      (accept
        ? `Admin đã phê duyệt hoàn tiền ${refundPct}% cho người mua.`
        : 'Admin đã từ chối yêu cầu khiếu nại.')

    try {
      const amount = (selectedDispute.refundAmount || 0) * (refundPct / 100)
      const res = await disputeAction.mutateAsync({
        id: selectedDispute.id,
        accept,
        response: finalRemark,
        refundAmount: amount,
      })

      if (res.result?.request) {
        if (accept && res.result.checkoutUrl) {
          window.location.href = res.result.checkoutUrl
          return
        }

        globalShowAlert(
          accept
            ? `Đã duyệt chấp thuận khiếu nại! Yêu cầu đã được chuyển cho Shop để lựa chọn thu hồi hàng hoặc hoàn tiền ngay.`
            : 'Đã từ chối khiếu nại thành công.',
          'Thành công',
          'success',
        )
        setAdminRemark('')
        setSelectedDispute(res.result.request)
        fetchDisputes()
      }
    } catch (err: unknown) {
      console.error('Action failed:', err)
      const errObj = err as { data?: { message?: string }; message?: string }
      const msg = errObj?.data?.message || errObj?.message || 'Thao tác thất bại. Vui lòng thử lại!'
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  const evidenceList = useMemo(() => {
    if (!selectedDispute) return []
    if (selectedDispute.evidenceUrls && selectedDispute.evidenceUrls.length > 0) {
      return selectedDispute.evidenceUrls.filter(Boolean)
    }
    if (selectedDispute.evidence) {
      return selectedDispute.evidence
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return []
  }, [selectedDispute])

  const currentEvidenceUrl = evidenceList[activeEvidence] || null
  const isVideo = (url?: string | null) => {
    if (!url) return false
    const lower = url.toLowerCase()
    return (
      lower.includes('.mp4') ||
      lower.includes('.mov') ||
      lower.includes('.webm') ||
      lower.includes('video')
    )
  }

  const handleZoom = () => {
    if (!currentEvidenceUrl) {
      globalShowAlert('Người mua không đính kèm hình ảnh hoặc video để phóng to', 'Thông báo', 'info')
      return
    }
    setIsZoomOpen(true)
  }

  const handleDownload = () => {
    if (!currentEvidenceUrl) {
      globalShowAlert('Người mua không đính kèm hình ảnh hoặc video để tải xuống', 'Thông báo', 'info')
      return
    }
    window.open(currentEvidenceUrl, '_blank')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] p-6 bg-[#f8faf8] overflow-hidden">
      {/* 3 Cột chính đồng bộ giao diện */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0 overflow-hidden">
        {/* ===================== CỘT 1: DANH SÁCH KHIẾU NẠI ===================== */}
        <div className="w-full lg:w-[320px] xl:w-[340px] bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col h-full shrink-0 overflow-hidden">
          {/* Header & Số lượng */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              Trung tâm khiếu nại
            </h2>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-black rounded-full">
              {filteredDisputes.length} ĐƠN
            </span>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo ID, tên sp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:bg-white focus:border-primary transition-all outline-none"
            />
          </div>

          {/* Bộ lọc 4 trạng thái (Tất cả, Mới/Đang xử lý, Đã hoàn tiền, Đã từ chối) */}
          <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              TẤT CẢ
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              MỚI/ĐANG XỬ LÝ
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                statusFilter === 'COMPLETED'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ĐÃ HOÀN TIỀN
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                statusFilter === 'REJECTED'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ĐÃ TỪ CHỐI
            </button>
          </div>

          {/* Danh sách thẻ cuộn */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {loading && disputes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs font-bold text-gray-400">Đang tải khiếu nại...</span>
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShieldCheck className="size-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">Không có đơn khiếu nại nào</p>
              </div>
            ) : (
              filteredDisputes.map((item) => {
                const isSelected = selectedDispute?.id === item.id
                const isCompleted = item.status === 'COMPLETED' || item.status === 'APPROVED'
                const isRejected =
                  item.status === 'REJECTED' ||
                  item.status === 'CANCELLED' ||
                  item.status === 'RETURN_FAILED'

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedDispute(item)
                      setAdminRemark('')
                      setActiveEvidence(0)
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                        : 'border-gray-200/90 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-gray-800">#{item.id}</span>
                      <span className="text-[11px] font-semibold text-gray-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-xs line-clamp-1 mb-2">
                      {item.productName || `Đơn hàng #${item.orderId}`}
                    </h4>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs font-black text-gray-700">
                        {(item.refundAmount || 0).toLocaleString()}đ
                      </span>

                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        {isCompleted ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> ĐÃ HOÀN TIỀN
                          </span>
                        ) : isRejected ? (
                          <span className="text-rose-500 flex items-center gap-1">
                            <XCircle className="size-3.5" /> ĐÃ TỪ CHỐI
                          </span>
                        ) : item.status === 'REFUND_PENDING' ? (
                          <span className="text-primary flex items-center gap-1">
                            <RefreshCw className="size-3.5 animate-spin" /> ĐANG HOÀN TIỀN
                          </span>
                        ) : item.status === 'SHOP_APPROVED' ? (
                          <span className="text-blue-600 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> SHOP ĐÃ DUYỆT
                          </span>
                        ) : item.status === 'ADMIN_APPROVED' ? (
                          <span className="text-indigo-600 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> ADMIN ĐÃ DUYỆT
                          </span>
                        ) : item.status === 'DISPUTED' ? (
                          <span className="text-amber-500 flex items-center gap-1">
                            <AlertTriangle className="size-3.5" /> TRANH CHẤP
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Clock className="size-3.5" /> CHỜ XỬ LÝ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ===================== CỘT 2: BẰNG CHỨNG HÌNH ẢNH / VIDEO ===================== */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col h-full min-w-0 overflow-hidden">
          {selectedDispute ? (
            <div className="flex flex-col h-full justify-between overflow-hidden">
              {/* Nút tác vụ phóng to & tải xuống ở góc trên */}
              <div className="flex justify-end gap-2 mb-3 shrink-0">
                <button
                  type="button"
                  onClick={handleZoom}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <ZoomIn className="size-3.5" />
                  Phóng to
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="size-3.5" />
                  Tải xuống
                </button>
              </div>

              {/* Vùng hiển thị bằng chứng */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
                {currentEvidenceUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200/80 p-2 overflow-hidden">
                    {isVideo(currentEvidenceUrl) ? (
                      <video
                        key={currentEvidenceUrl}
                        src={currentEvidenceUrl}
                        controls
                        className="max-h-full max-w-full rounded-xl object-contain"
                      />
                    ) : (
                      <img
                        src={currentEvidenceUrl}
                        alt="Bằng chứng khiếu nại"
                        className="max-h-full max-w-full rounded-xl object-contain cursor-pointer hover:opacity-95"
                        onClick={handleZoom}
                      />
                    )}
                  </div>
                ) : (
                  /* Khung rỗng nét đứt chuẩn như ảnh mẫu */
                  <div className="w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50/50">
                    <VideoOff className="size-16 text-gray-400 stroke-1 mb-4" />
                    <p className="text-xs font-medium text-gray-500 text-center max-w-[220px]">
                      Người mua không đính kèm hình ảnh hoặc video
                    </p>
                  </div>
                )}

                {/* Dải thumbnail nếu có nhiều ảnh/video */}
                {evidenceList.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto w-full py-1 shrink-0">
                    {evidenceList.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveEvidence(i)}
                        className={`size-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${
                          activeEvidence === i
                            ? 'border-emerald-500 scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        {isVideo(url) ? (
                          <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-amber-400">
                            <Film className="size-4" />
                            <span className="text-[8px] text-white">Video</span>
                          </div>
                        ) : (
                          <img src={url} className="w-full h-full object-cover" alt="Thumb" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mục lý do chỉ hiển thị KHI ĐƠN BỊ TỪ CHỐI */}
              {(selectedDispute.status === 'REJECTED' ||
                selectedDispute.status === 'CANCELLED' ||
                selectedDispute.status === 'RETURN_FAILED') && (
                <div className="bg-[#fee2e2]/80 border border-red-200 rounded-2xl p-4 mt-3 shrink-0 animate-in fade-in">
                  <p className="text-xs font-medium text-rose-950 leading-relaxed">
                    <span className="font-bold">Lý do từ chối:</span>{' '}
                    {selectedDispute.adminRemark?.trim() ||
                      selectedDispute.shopResponse?.trim() ||
                      selectedDispute.reason?.trim() ||
                      'Không có'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
              Chọn một khiếu nại để xem bằng chứng
            </div>
          )}
        </div>

        {/* ===================== CỘT 3: CHI TIẾT & QUYẾT ĐỊNH ADMIN ===================== */}
        <div className="w-full lg:w-[360px] xl:w-[400px] bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col h-full shrink-0 justify-between overflow-hidden">
          {selectedDispute ? (
            <div className="flex flex-col h-full justify-between overflow-hidden">
              {/* Header thông tin đơn & các bên liên quan */}
              <div className="text-xs font-bold text-gray-800 pb-3 border-b border-gray-100 shrink-0">
                Mã đơn: <span className="font-black text-gray-900">#ORD-{selectedDispute.orderId}</span>{' '}
                | Người mua:{' '}
                <span className="font-semibold text-gray-700">
                  {selectedDispute.buyerName || (selectedDispute.buyerId ? `#${selectedDispute.buyerId}` : '---')}
                </span>{' '}
                | Chủ vườn:{' '}
                <span className="font-semibold text-gray-700">
                  {selectedDispute.shopName || (selectedDispute.shopId ? `#${selectedDispute.shopId}` : '---')}
                </span>
              </div>

              {/* Đoạn hội thoại / luồng xử lý: Lý do hoàn tiền người mua -> Lý do từ chối của shop -> Lựa chọn admin */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 custom-scrollbar">
                {/* 1. Lý do hoàn tiền của người mua */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <User className="size-3.5" />
                    </div>
                    <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                      LÝ DO HOÀN TIỀN CỦA NGƯỜI MUA
                    </span>
                  </div>
                  <div className="ml-8 p-3.5 bg-[#ffedd5]/80 rounded-2xl text-xs font-medium text-gray-800 leading-relaxed border border-orange-100/60">
                    {selectedDispute.reason && selectedDispute.reason.trim()
                      ? selectedDispute.reason.trim()
                      : 'Không có'}
                  </div>
                </div>

                {/* 2. Lý do từ chối / phản hồi của shop */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Store className="size-3.5" />
                    </div>
                    <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                      LÝ DO TỪ CHỐI / PHẢN HỒI CỦA SHOP
                    </span>
                  </div>
                  <div className="ml-8 p-3.5 bg-[#dbeafe]/80 rounded-2xl text-xs font-medium text-gray-800 leading-relaxed border border-blue-100/60">
                    {selectedDispute.shopResponse && selectedDispute.shopResponse.trim()
                      ? selectedDispute.shopResponse.trim()
                      : 'Không có'}
                  </div>
                </div>
              </div>

              {/* 3. Lựa chọn & Quyết định Admin ở phía dưới */}
              <div className="pt-3 border-t border-gray-100 shrink-0 space-y-2.5">
                <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  LỰA CHỌN & QUYẾT ĐỊNH ADMIN
                </h5>

                {/* Trạng thái Admin đã duyệt, chờ Shop chọn phương án thu hồi hay hoàn tiền */}
                {selectedDispute.status === 'ADMIN_APPROVED' ? (
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-gray-800 space-y-1.5 animate-in fade-in">
                    <p className="text-xs font-black text-sky-950">
                      KẾT QUẢ XỬ LÝ: Admin đã duyệt hoàn tiền {(() => {
                        const itemTotal = selectedDispute.itemTotal || ((selectedDispute.unitPrice || 0) * (selectedDispute.quantity || 1))
                        if (itemTotal > 0 && selectedDispute.refundAmount) {
                          const pct = Math.round((selectedDispute.refundAmount / itemTotal) * 100)
                          return `${pct}%`
                        }
                        return ''
                      })()} (
                      {(selectedDispute.refundAmount || 0).toLocaleString()}đ)
                    </p>
                    <p className="text-xs text-sky-900 font-medium leading-relaxed">
                      Đã chuyển thông báo cho Shop. Shop có 24h để lựa chọn: Thu hồi hàng về vườn (tạo đơn cho Shipper lấy) hoặc Hoàn tiền ngay cho khách.
                    </p>
                    {selectedDispute.adminRemark && (
                      <p className="text-xs text-sky-950 font-medium bg-white/70 p-2 rounded-lg border border-sky-100">
                        Ghi chú Admin: {selectedDispute.adminRemark}
                      </p>
                    )}
                    <p className="text-[10px] text-sky-800/80 font-medium pt-0.5">
                      Thời gian: {formatDateTime(selectedDispute.updatedAt || selectedDispute.createdAt)}
                    </p>
                  </div>
                ) : selectedDispute.status === 'RETURN_SHIPPING' || selectedDispute.status === 'RETURN_DELIVERED' ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-gray-800 space-y-1.5 animate-in fade-in">
                    <p className="text-xs font-black text-amber-950">
                      TIẾN TRÌNH: Đang thu hồi & chuyển hoàn hàng về cho Shop
                    </p>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      Shop đã chọn thu hồi hàng. Đơn hàng hoàn đã được tạo để Shipper tiếp nhận vận chuyển về địa chỉ nhà vườn.
                    </p>
                    <p className="text-[10px] text-amber-800/80 font-medium pt-0.5">
                      Thời gian: {formatDateTime(selectedDispute.updatedAt || selectedDispute.createdAt)}
                    </p>
                  </div>
                ) : selectedDispute.status === 'COMPLETED' || selectedDispute.status === 'APPROVED' ? (
                  <div className="p-4 bg-[#dcfce7] border border-emerald-200 rounded-2xl text-gray-800 space-y-1.5 animate-in fade-in">
                    <p className="text-xs font-black text-emerald-950">
                      KẾT QUẢ XỬ LÝ: Đã phê duyệt hoàn tiền {(() => {
                        const itemTotal = selectedDispute.itemTotal || ((selectedDispute.unitPrice || 0) * (selectedDispute.quantity || 1))
                        if (itemTotal > 0 && selectedDispute.refundAmount) {
                          const pct = Math.round((selectedDispute.refundAmount / itemTotal) * 100)
                          return `${pct}%`
                        }
                        return '100%'
                      })()} (
                      {(selectedDispute.refundAmount || 0).toLocaleString()}đ)
                    </p>
                    <p className="text-xs text-emerald-900 font-medium">
                      {selectedDispute.adminRemark && selectedDispute.adminRemark.trim()
                        ? selectedDispute.adminRemark.trim()
                        : 'Không có ghi chú'}
                    </p>
                    <p className="text-[10px] text-emerald-800/80 font-medium pt-0.5">
                      Thời gian: {formatDateTime(selectedDispute.updatedAt || selectedDispute.createdAt)}
                    </p>
                  </div>
                ) : selectedDispute.status === 'REJECTED' ||
                  selectedDispute.status === 'CANCELLED' ||
                  selectedDispute.status === 'RETURN_FAILED' ? (
                  /* Nếu đơn đã bị từ chối */
                  <div className="p-4 bg-[#fee2e2] border border-red-200 rounded-2xl text-gray-800 space-y-1.5 animate-in fade-in">
                    <p className="text-xs font-black text-rose-950">
                      KẾT QUẢ XỬ LÝ: Đã từ chối khiếu nại
                    </p>
                    <p className="text-xs text-rose-900 font-medium">
                      {selectedDispute.adminRemark && selectedDispute.adminRemark.trim()
                        ? selectedDispute.adminRemark.trim()
                        : 'Không có ghi chú'}
                    </p>
                    <p className="text-[10px] text-rose-800/80 font-medium pt-0.5">
                      Thời gian: {formatDateTime(selectedDispute.updatedAt || selectedDispute.createdAt)}
                    </p>
                  </div>
                ) : selectedDispute.status === 'DISPUTED' ? (
                  /* Nếu đơn là DISPUTED (Shop đã từ chối): Hiển thị form phân xử của Admin */
                  <div className="space-y-2.5">
                    <textarea
                      value={adminRemark}
                      onChange={(e) => setAdminRemark(e.target.value)}
                      placeholder="Nhập lý do cho quyết định của bạn (không bắt buộc)..."
                      className="w-full h-20 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:border-primary transition-all resize-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleAdminAction(true, 100)}
                      disabled={submitting}
                      className="w-full py-3 bg-primary text-white font-black text-xs rounded-xl shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin mx-auto" />
                      ) : (
                        'PHÊ DUYỆT HOÀN TIỀN 100%'
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdminAction(true, 50)}
                        disabled={submitting}
                        className="py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        HOÀN 50%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminAction(false)}
                        disabled={submitting}
                        className="py-2.5 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        TỪ CHỐI
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Nếu đơn chưa được Shop xử lý hoặc đang chờ bước khác */
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-gray-800 space-y-1.5 animate-in fade-in">
                    <p className="text-xs font-black text-amber-950">
                      ĐANG CHỜ NHÀ VƯỜN PHẢN HỒI
                    </p>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      Yêu cầu hoàn trả này đang ở trạng thái chờ Nhà vườn phản hồi. Admin chỉ có quyền can thiệp phân xử khi Nhà vườn từ chối yêu cầu của người mua.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
              Chọn khiếu nại để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Modal phóng to ảnh */}
      {isZoomOpen && currentEvidenceUrl && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-3xl overflow-hidden flex items-center justify-center"
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 z-10 size-9 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
            {isVideo(currentEvidenceUrl) ? (
              <video src={currentEvidenceUrl} controls autoPlay className="max-h-[85vh] max-w-full" />
            ) : (
              <img
                src={currentEvidenceUrl}
                alt="Bằng chứng phóng to"
                className="max-h-[85vh] max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* PayOS QR Modal */}
      {payOSQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-primary text-white text-center relative">
              <button
                onClick={() => setPayOSQR(null)}
                className="absolute top-6 right-6 size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <XCircle className="size-6" />
              </button>
              <div className="size-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="size-10" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Xác nhận chuyển khoản</h3>
              <p className="text-sm font-medium opacity-80 mt-2">
                Vui lòng quét mã QR bên dưới để hoàn tất giao dịch hoàn tiền cho khách hàng.
              </p>
            </div>
            <div className="p-10 flex flex-col items-center">
              <div className="p-4 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 mb-8 w-full flex justify-center">
                {payOSQR.qrCodeUrl?.startsWith('http') ? (
                  <img
                    src={payOSQR.qrCodeUrl}
                    alt="PayOS QR"
                    className="size-64 object-contain shadow-sm"
                  />
                ) : (
                  <QRCodeSVG
                    value={payOSQR.qrCodeUrl || payOSQR.checkoutUrl}
                    size={240}
                    level="M"
                    includeMargin={true}
                  />
                )}
              </div>
              <a
                href={payOSQR.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl text-center hover:bg-black transition-all shadow-xl shadow-gray-200 mb-4"
              >
                MỞ TRONG TRÌNH DUYỆT
              </a>
              <button
                onClick={() => {
                  setPayOSQR(null)
                  fetchDisputes()
                }}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                ĐÃ HOÀN TẤT / ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Disputes
