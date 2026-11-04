import React, { useState } from 'react'
import {
  Gavel,
  Search,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertTriangle,
  ChevronRight,
  Eye,
  Film,
  Store,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  X,
  Package,
} from 'lucide-react'
import { useShopDisputes, useShopRespondDispute } from '@/features/order'
import type { ReturnRequestResponse, ReturnStatus } from '@/services/return.types'
import { globalShowAlert } from '@/components/common/Popup'

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  PENDING: {
    label: 'Chờ phản hồi',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  SHOP_APPROVED: {
    label: 'Shop đã duyệt',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: CheckCircle2,
  },
  DISPUTED: {
    label: 'Khiếu nại Admin',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: AlertTriangle,
  },
  ADMIN_APPROVED: {
    label: 'Admin duyệt - Chờ Shop chọn thu hồi',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Gavel,
  },
  RETURN_SHIPPING: {
    label: 'Chờ shipper lấy',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: Truck,
  },
  RETURN_PICKED_UP: {
    label: 'Đang chuyển về shop',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Truck,
  },
  RETURN_DELIVERED: {
    label: 'Đã giao về shop',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: CheckCircle2,
  },
  RETURN_FAILED: {
    label: 'Giao/nhận thất bại',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: XCircle,
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Đã từ chối',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Khách đã hủy',
    badgeClass: 'bg-stone-100 text-stone-500 border-stone-200',
    icon: XCircle,
  },
}

export default function FarmerDisputes() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedDispute, setSelectedDispute] = useState<ReturnRequestResponse | null>(null)
  const [shopResponseText, setShopResponseText] = useState<string>('')
  const [shippingPaymentMethod, setShippingPaymentMethod] = useState<'WALLET' | 'COD'>('WALLET')
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null)

  const { data: disputes = [], isLoading, refetch } = useShopDisputes()
  const respondMutation = useShopRespondDispute()

  // Filter & Search
  const filteredDisputes = disputes.filter((item) => {
    const matchesSearch =
      (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.buyerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderId?.toString().includes(searchTerm) ||
      item.id?.toString().includes(searchTerm)

    if (statusFilter === 'ALL') return matchesSearch
    if (statusFilter === 'PENDING') return matchesSearch && (item.status === 'PENDING' || item.status === 'ADMIN_APPROVED')
    if (statusFilter === 'DISPUTED') return matchesSearch && item.status === 'DISPUTED'
    if (statusFilter === 'SHIPPING')
      return (
        matchesSearch &&
        (item.status === 'RETURN_SHIPPING' ||
          item.status === 'RETURN_PICKED_UP' ||
          item.status === 'RETURN_DELIVERED')
      )
    if (statusFilter === 'COMPLETED') return matchesSearch && item.status === 'COMPLETED'
    return matchesSearch && item.status === statusFilter
  })

  // Thống kê nhanh
  const countPending = disputes.filter((d) => d.status === 'PENDING' || d.status === 'ADMIN_APPROVED').length
  const countDisputed = disputes.filter((d) => d.status === 'DISPUTED').length
  const countCompleted = disputes.filter((d) => d.status === 'COMPLETED').length

  const handleRespond = async (accept: boolean, isReturnGoods: boolean = true) => {
    if (!selectedDispute) return

    try {
      await respondMutation.mutateAsync({
        id: selectedDispute.id || selectedDispute.returnId || 0,
        accept,
        shopResponse: shopResponseText.trim() || (accept ? 'Shop đã đồng ý yêu cầu.' : 'Shop từ chối yêu cầu hoàn trả.'),
        isReturnGoods,
        shippingPaymentMethod: isReturnGoods ? shippingPaymentMethod : undefined,
      })

      globalShowAlert(
        accept
          ? isReturnGoods
            ? 'Đã đồng ý nhận hàng hoàn. Shipper sẽ được điều phối!'
            : 'Đã hoàn tất hoàn tiền không cần trả hàng!'
          : 'Đã gửi từ chối. Yêu cầu được chuyển lên Admin hòa giải tranh chấp.',
        'Thành công',
        'success'
      )
      setSelectedDispute(null)
      setShopResponseText('')
      void refetch()
    } catch (err: any) {
      console.error('Shop respond failed:', err)
      globalShowAlert(err?.message || 'Thao tác phản hồi thất bại!', 'Lỗi', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#8a4e1d]/10 text-[#8a4e1d] flex items-center justify-center shrink-0">
            <Gavel size={28} />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#1c2216]">Trung Tâm Trợ Giúp &amp; Khiếu Nại</h3>
            <p className="text-xs sm:text-sm text-[#7e8779] mt-0.5">
              Xử lý các yêu cầu trả hàng, hoàn tiền và hòa giải tranh chấp với khách hàng
            </p>
          </div>
        </div>

        {/* Thẻ đếm nhanh */}
        <div className="flex items-center gap-2">
          <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center">
            <span className="block text-base font-black">{countPending}</span>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Cần xử lý</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-center">
            <span className="block text-base font-black">{countDisputed}</span>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Tranh chấp</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
            <span className="block text-base font-black">{countCompleted}</span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách, tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold focus:bg-white focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/20 transition-all outline-none"
            />
          </div>

          {/* Tab trạng thái */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PENDING', label: 'Cần xử lý' },
              { key: 'SHIPPING', label: 'Đang vận chuyển' },
              { key: 'DISPUTED', label: 'Tranh chấp' },
              { key: 'COMPLETED', label: 'Đã hoàn tất' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#326318] text-white shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách yêu cầu */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-stone-400">
            <Loader2 size={32} className="animate-spin text-[#326318]" />
            <span className="text-xs font-medium">Đang tải danh sách khiếu nại...</span>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="py-14 text-center rounded-2xl bg-[#fafcf9] border border-[#e5edd9] space-y-2">
            <RotateCcw size={32} className="text-[#326318]/50 mx-auto" />
            <div className="text-sm font-bold text-[#1c2216]">Không tìm thấy yêu cầu hoàn trả nào</div>
            <p className="text-xs text-[#717b6b]">
              Gian hàng của bạn hiện không có đơn khiếu nại nào theo bộ lọc đang chọn.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDisputes.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING
              const StatusIcon = statusCfg.icon
              const evidenceList = item.evidenceUrls || (item.evidence ? item.evidence.split(';') : [])

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedDispute(item)
                    setShopResponseText(item.shopResponse || '')
                  }}
                  className="p-4 sm:p-5 rounded-2xl border border-stone-200/80 hover:border-[#326318]/50 bg-white hover:bg-[#fafcf9] transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Trái: Thông tin sản phẩm & đơn hàng */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={item.productImage || '/images/default-produce.png'}
                      alt={item.productName || 'Nông sản'}
                      className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-stone-500">
                          Đơn #{item.orderId}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badgeClass}`}
                        >
                          <StatusIcon size={12} />
                          <span>{statusCfg.label}</span>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#1c2216] truncate group-hover:text-[#326318] transition-colors">
                        {item.productName || 'Sản phẩm hoàn trả'}
                      </h4>

                      <p className="text-xs text-stone-500 line-clamp-1">
                        Lý do: <span className="font-medium text-stone-700">{item.reason}</span>
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-0.5">
                        <span>Khách: <strong className="text-stone-700 font-semibold">{item.buyerName || 'Khách hàng'}</strong></span>
                        {item.createdAt && (
                          <span>• Ngày gửi: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phải: Số tiền & Bằng chứng */}
                  <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
                    {/* Bằng chứng xem trước */}
                    {evidenceList.length > 0 && (
                      <div className="flex items-center -space-x-2">
                        {evidenceList.slice(0, 3).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Evidence"
                            className="w-8 h-8 rounded-lg object-cover border-2 border-white shadow-xs"
                          />
                        ))}
                        {evidenceList.length > 3 && (
                          <div className="w-8 h-8 rounded-lg bg-stone-100 border-2 border-white text-[10px] font-bold text-stone-600 flex items-center justify-center">
                            +{evidenceList.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-stone-400 block uppercase">Hoàn trả</span>
                      <span className="text-base font-black text-rose-600">
                        {Number(item.refundAmount || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-[#326318] group-hover:text-white text-stone-400 flex items-center justify-center transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Chi Tiết & Phản Hồi Khiếu Nại */}
      {selectedDispute && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !respondMutation.isPending) {
              setSelectedDispute(null)
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp relative">
            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setSelectedDispute(null)}
              disabled={respondMutation.isPending}
              aria-label="Đóng"
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>

            {/* Header Modal */}
            <div className="p-6 border-b border-stone-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw size={24} />
              </div>
              <div className="pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-[#1c2216]">
                    Chi tiết yêu cầu hoàn hàng #{selectedDispute.id}
                  </h3>
                  {(() => {
                    const st = STATUS_CONFIG[selectedDispute.status] || STATUS_CONFIG.PENDING
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.badgeClass}`}>
                        {st.label}
                      </span>
                    )
                  })()}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Đơn hàng gốc #{selectedDispute.orderId} • Người mua: {selectedDispute.buyerName || 'Khách'}
                </p>
              </div>
            </div>

            {/* Nội dung scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
              {/* Thẻ sản phẩm & Số tiền */}
              <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e3ebdc] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDispute.productImage || '/images/default-produce.png'}
                    alt={selectedDispute.productName || 'Sản phẩm'}
                    className="w-14 h-14 rounded-xl object-cover border border-[#d6e0cc] bg-white shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#1c2216]">
                      {selectedDispute.productName || 'Sản phẩm hoàn trả'}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Số lượng: <strong className="text-stone-700">{selectedDispute.quantity || 1}</strong>
                    </p>
                    <p className="text-xs font-bold text-[#326318] mt-0.5">
                      Đơn giá: {Number(selectedDispute.unitPrice || 0).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-400 block uppercase">Số tiền hoàn</span>
                  <span className="text-lg font-black text-rose-600">
                    {Number(selectedDispute.refundAmount || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Thông tin khách hàng & Lý do khiếu nại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Thông tin người mua
                  </span>
                  <p className="font-bold text-stone-800">{selectedDispute.buyerName || 'Chưa cập nhật'}</p>
                  {selectedDispute.buyerPhone && (
                    <p className="text-stone-600 flex items-center gap-1.5">
                      <Phone size={13} className="text-stone-400" />
                      <span>{selectedDispute.buyerPhone}</span>
                    </p>
                  )}
                  {selectedDispute.buyerAddress && (
                    <p className="text-stone-600 flex items-start gap-1.5">
                      <MapPin size={13} className="text-stone-400 shrink-0 mt-0.5" />
                      <span>{selectedDispute.buyerAddress}</span>
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Lý do khách gửi yêu cầu
                  </span>
                  <p className="font-semibold text-rose-700 leading-relaxed">
                    {selectedDispute.reason || 'Không có lý do cụ thể'}
                  </p>
                  <p className="text-[11px] text-stone-500 pt-1">
                    Hình thức mong muốn:{' '}
                    <strong>
                      {selectedDispute.isReturnGoods ? 'Đổi trả hàng vật lý' : 'Hoàn tiền không cần trả hàng'}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Bằng chứng ảnh / video */}
              {(() => {
                const evidenceList =
                  selectedDispute.evidenceUrls ||
                  (selectedDispute.evidence ? selectedDispute.evidence.split(';') : [])

                if (evidenceList.length === 0) return null

                return (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-stone-700 block">
                      Hình ảnh / Video bằng chứng từ người mua:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {evidenceList.map((url, idx) => {
                        const isVideo =
                          url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('video')
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveMediaUrl(url)}
                            className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square bg-stone-100 cursor-pointer"
                          >
                            {isVideo ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white p-2">
                                <Film size={24} className="text-amber-400 mb-1" />
                                <span className="text-[10px] font-bold">Xem Video</span>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt="Evidence"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye size={18} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Phản hồi từ Admin nếu có */}
              {selectedDispute.adminRemark && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
                  <span className="font-bold text-indigo-900">Phán quyết từ Quản trị viên (Admin):</span>
                  <p className="text-indigo-800 leading-relaxed">{selectedDispute.adminRemark}</p>
                </div>
              )}

              {/* Lựa chọn phương thức thanh toán cước hoàn (Shop chịu 100%) */}
              {(selectedDispute.status === 'PENDING' || selectedDispute.status === 'ADMIN_APPROVED') && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950">
                      Phí ship hoàn trả hàng: <span className="text-emerald-700">Shop chịu 100% (~20.000 đ)</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Nếu Shop đồng ý lấy lại hàng, vui lòng chọn phương thức chi trả cước phí:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShippingPaymentMethod('WALLET')}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shippingPaymentMethod === 'WALLET'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-[11px]">Trừ Ví sàn</div>
                      <div className="text-[10px] font-normal opacity-90">Trừ từ số dư ví ngay</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingPaymentMethod('COD')}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shippingPaymentMethod === 'COD'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-[11px]">Tiền mặt COD</div>
                      <div className="text-[10px] font-normal opacity-90">Đưa shipper khi nhận hàng</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Hướng dẫn khi Admin đã phê duyệt */}
              {selectedDispute.status === 'ADMIN_APPROVED' && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Gavel size={16} className="text-indigo-600 shrink-0" />
                    <span>Admin đã phê duyệt khiếu nại của khách hàng</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Gian hàng có <strong>24 giờ</strong> để đưa ra phương án xử lý hàng hoàn trả ở phía dưới:
                    <br />• <strong>Không lấy lại hàng:</strong> Hoàn tiền ngay cho người mua (không tốn phí ship hoàn).
                    <br />• <strong>Lấy lại hàng &amp; Chịu phí ship:</strong> Shipper sẽ lấy hàng hoàn trả về cho gian hàng (Shop chịu phí vận chuyển hoàn).
                  </p>
                </div>
              )}

              {selectedDispute.status === 'PENDING' && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                    <span>Lời nhắn / Lý do phản hồi từ Shop đến khách hàng:</span>
                    <span className="text-[10px] text-stone-400">Không bắt buộc</span>
                  </label>
                  <textarea
                    rows={3}
                    value={shopResponseText}
                    onChange={(e) => setShopResponseText(e.target.value)}
                    placeholder="Nhập ghi chú phản hồi cho khách hàng hoặc lý do nếu từ chối..."
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/20 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Chân Modal: Nút hành động */}
            <div className="p-4 sm:p-5 border-t border-stone-100 bg-[#fafcf9] flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                disabled={respondMutation.isPending}
                className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-white text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>

              {selectedDispute.status === 'PENDING' && (
                <>
                  {/* Từ chối -> Chuyển DISPUTED lên Admin */}
                  <button
                    type="button"
                    onClick={() => handleRespond(false)}
                    disabled={respondMutation.isPending}
                    className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <XCircle size={15} />
                    <span>Từ chối (Khiếu nại Admin)</span>
                  </button>

                  {/* Đồng ý hoàn tiền không cần trả hàng */}
                  <button
                    type="button"
                    onClick={() => handleRespond(true, false)}
                    disabled={respondMutation.isPending}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <DollarSign size={15} />
                    <span>Hoàn tiền (Không lấy lại hàng)</span>
                  </button>

                  {/* Đồng ý nhận hàng hoàn vật lý */}
                  <button
                    type="button"
                    onClick={() => handleRespond(true, true)}
                    disabled={respondMutation.isPending}
                    className="py-2.5 px-4 rounded-xl bg-[#326318] hover:bg-[#274f13] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {respondMutation.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    <span>Đồng ý trả hàng (Giao shipper)</span>
                  </button>
                </>
              )}

              {selectedDispute.status === 'ADMIN_APPROVED' && (
                <>
                  {/* Không lấy lại hàng -> Hoàn tiền ngay */}
                  <button
                    type="button"
                    onClick={() => handleRespond(true, false)}
                    disabled={respondMutation.isPending}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <DollarSign size={15} />
                    <span>Hoàn tiền ngay (Không lấy hàng)</span>
                  </button>

                  {/* Lấy lại hàng -> Shop chịu phí ship */}
                  <button
                    type="button"
                    onClick={() => handleRespond(true, true)}
                    disabled={respondMutation.isPending}
                    className="py-2.5 px-4 rounded-xl bg-[#326318] hover:bg-[#274f13] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {respondMutation.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    <span>Lấy lại hàng &amp; Chịu phí ship</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal phóng to ảnh / video */}
      {activeMediaUrl && (
        <div
          role="dialog"
          className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveMediaUrl(null)}
        >
          <button
            type="button"
            onClick={() => setActiveMediaUrl(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {activeMediaUrl.toLowerCase().includes('.mp4') || activeMediaUrl.toLowerCase().includes('video') ? (
              <video src={activeMediaUrl} controls autoPlay className="max-h-[85vh] max-w-full rounded-2xl" />
            ) : (
              <img src={activeMediaUrl} alt="Phóng to" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
