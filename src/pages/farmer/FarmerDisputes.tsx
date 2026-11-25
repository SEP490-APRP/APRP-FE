import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
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
  Flag,
  ShieldCheck,
} from 'lucide-react'
import { useShopDisputes, useShopRespondDispute } from '@/features/order'
import { ShopPageHeader } from '@/features/shop'
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
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch)
  const [selectedDispute, setSelectedDispute] = useState<ReturnRequestResponse | null>(null)
  const [shopResponseText, setShopResponseText] = useState<string>('')
  const [shippingPaymentMethod, setShippingPaymentMethod] = useState<'WALLET' | 'COD'>('WALLET')
  const [resolveReturnGoods, setResolveReturnGoods] = useState<boolean>(false)
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null)

  const { data: disputes = [], isLoading, refetch } = useShopDisputes()
  const respondMutation = useShopRespondDispute()

  // Tự động mở modal chi tiết khiếu nại nếu có param search khớp đơn / ID khiếu nại
  useEffect(() => {
    if (initialSearch && disputes.length > 0) {
      const match = disputes.find(
        (item) =>
          String(item.id) === initialSearch ||
          String(item.orderId) === initialSearch ||
          item.id?.toString() === initialSearch
      )
      if (match) {
        setSelectedDispute(match)
      }
    }
  }, [initialSearch, disputes])

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
  const countRiskFlags = disputes.filter(
    (d) => (d.status === 'COMPLETED' || d.status === 'ADMIN_APPROVED') && !!d.adminRemark
  ).length

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
      <ShopPageHeader
        title="Trung Tâm Trợ Giúp & Khiếu Nại"
        subtitle="Xử lý các yêu cầu trả hàng, hoàn tiền và hòa giải tranh chấp với khách hàng"
        actions={
          <>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
              className={`px-3.5 py-1.5 rounded-lg min-w-[76px] text-center transition-all cursor-pointer border ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-100/90 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-900'
              }`}
            >
              <span className="block text-base sm:text-lg font-black text-amber-900">{countPending}</span>
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Cần xử lý</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'DISPUTED' ? 'ALL' : 'DISPUTED')}
              className={`px-3.5 py-1.5 rounded-lg min-w-[76px] text-center transition-all cursor-pointer border ${
                statusFilter === 'DISPUTED'
                  ? 'bg-rose-100/90 border-rose-300 ring-2 ring-rose-400/50 shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100/70 border-rose-200 text-rose-900'
              }`}
            >
              <span className="block text-base sm:text-lg font-black text-rose-900">{countDisputed}</span>
              <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Tranh chấp</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
              className={`px-3.5 py-1.5 rounded-lg min-w-[76px] text-center transition-all cursor-pointer border ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-100/90 border-emerald-300 ring-2 ring-emerald-400/50 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="block text-base sm:text-lg font-black text-emerald-900">{countCompleted}</span>
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Hoàn tất</span>
            </button>

            <div className="px-3.5 py-1.5 rounded-lg min-w-[76px] bg-red-50 border border-red-200 text-red-900 text-center">
              <span className="block text-base sm:text-lg font-black flex items-center justify-center gap-1">
                <Flag size={14} className="text-red-600 fill-red-600" />
                {countRiskFlags}
              </span>
              <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider">Cờ vi phạm</span>
            </div>
          </>
        }
      />

      {/* Bộ lọc và Tìm kiếm */}
      <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#e8ece3] shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách, tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/20 transition-all outline-none"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${statusFilter === tab.key
                    ? 'bg-[#326318] text-white shadow-2xs'
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
          <div className="py-16 px-4 text-center rounded-lg bg-[#fafcf9] border border-[#e2e8dc] space-y-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 className="text-base font-black text-[#1c2216]">
                {statusFilter === 'ALL'
                  ? 'Gian Hàng Hoạt Động Rất Uy Tín'
                  : 'Không Có Yêu Cầu Hoàn Trả Nào'}
              </h4>
              <p className="text-xs text-[#6e7868] max-w-md mx-auto mt-1 leading-relaxed">
                {statusFilter === 'ALL'
                  ? 'Tuyệt vời! Hiện tại bạn không có đơn khiếu nại hay tranh chấp nào từ người mua. Hãy tiếp tục duy trì chất lượng đóng gói và bảo quản nông sản nhé.'
                  : `Hiện không có khiếu nại nào ở trạng thái này. Bạn có thể bấm "Tất cả" để xem toàn bộ danh sách.`}
              </p>
            </div>
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
                    setShippingPaymentMethod('WALLET')
                    setResolveReturnGoods(Boolean(item.isReturnGoods))
                  }}
                  className="p-3.5 sm:p-4 rounded-lg border border-stone-200/80 hover:border-[#326318]/50 bg-white hover:bg-[#fafcf9] transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Trái: Thông tin sản phẩm & đơn hàng */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <img
                      src={item.productImage || '/images/default-produce.png'}
                      alt={item.productName || 'Nông sản'}
                      className="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0 bg-white"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-600">
                          Đơn #{item.orderId}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badgeClass}`}
                        >
                          <StatusIcon size={12} />
                          <span>{statusCfg.label}</span>
                        </span>
                        {item.adminRemark && (item.status === 'COMPLETED' || item.status === 'ADMIN_APPROVED') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            <Flag size={10} className="fill-red-600 text-red-600" />
                            Cờ chất lượng
                          </span>
                        )}
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
                            alt="Bằng chứng khiếu nại"
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

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-stone-400 block uppercase whitespace-nowrap">Hoàn trả</span>
                      <span className="text-base font-black text-rose-600 whitespace-nowrap shrink-0">
                        {Number(item.refundAmount || 0).toLocaleString('vi-VN')}&nbsp;đ
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
      {selectedDispute &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget && !respondMutation.isPending) {
                setSelectedDispute(null)
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp relative">
              {/* Nút đóng */}
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                disabled={respondMutation.isPending}
                aria-label="Đóng"
                className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              {/* Header Modal */}
              <div className="p-5 sm:p-6 border-b border-stone-100 flex items-start gap-3.5 shrink-0 bg-white">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div className="pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-[#1c2216]">
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
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-left min-h-0">
              {/* Thẻ sản phẩm & Số tiền */}
              <div className="p-3.5 rounded-lg bg-[#fafcf9] border border-[#e3ebdc] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDispute.productImage || '/images/default-produce.png'}
                    alt={selectedDispute.productName || 'Sản phẩm'}
                    className="w-12 h-12 rounded-lg object-cover border border-[#d6e0cc] bg-white shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#1c2216]">
                      {selectedDispute.productName || 'Sản phẩm hoàn trả'}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Số lượng: <strong className="text-stone-700">{selectedDispute.quantity || 1}</strong>
                    </p>
                    <p className="text-xs font-bold text-[#326318] mt-0.5 whitespace-nowrap">
                      Đơn giá: {Number(selectedDispute.unitPrice || 0).toLocaleString('vi-VN')}&nbsp;đ
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-stone-400 block uppercase whitespace-nowrap">Số tiền hoàn</span>
                  <span className="text-base sm:text-lg font-black text-rose-600 whitespace-nowrap shrink-0">
                    {Number(selectedDispute.refundAmount || 0).toLocaleString('vi-VN')}&nbsp;đ
                  </span>
                </div>
              </div>

              {/* Thông tin khách hàng & Lý do khiếu nại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5">
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

                <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5">
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
                            className="relative group rounded-lg overflow-hidden border border-stone-200 aspect-square bg-stone-100 cursor-pointer"
                          >
                            {isVideo ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white p-2">
                                <Film size={24} className="text-amber-400 mb-1" />
                                <span className="text-[10px] font-bold">Xem Video</span>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt="Bằng chứng khiếu nại"
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
                <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900">Phán quyết từ Quản trị viên (Admin):</span>
                    {(selectedDispute.status === 'COMPLETED' || selectedDispute.status === 'ADMIN_APPROVED') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        <Flag size={10} className="fill-red-600 text-red-600" />
                        Đã ghi nhận 1 cờ rủi ro chất lượng
                      </span>
                    )}
                  </div>
                  <p className="text-indigo-800 leading-relaxed">{selectedDispute.adminRemark}</p>
                </div>
              )}

              {/* Lựa chọn phương thức xử lý & thanh toán cước phí */}
              {(selectedDispute.status === 'PENDING' || selectedDispute.status === 'ADMIN_APPROVED') && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#f7faf4] border border-[#dce7d4] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1c2216] uppercase tracking-wide">
                      Phương án xử lý từ Shop
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Khách đề xuất:{' '}
                      <strong className="text-stone-800">
                        {selectedDispute.isReturnGoods ? 'Đổi trả hàng vật lý' : 'Hoàn tiền không lấy hàng'}
                      </strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Hoàn tiền ngay, không thu hồi hàng */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setResolveReturnGoods(false)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        !resolveReturnGoods
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-2xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="resolveReturnGoods"
                          checked={!resolveReturnGoods}
                          onChange={() => setResolveReturnGoods(false)}
                          className="text-amber-600 focus:ring-amber-500 accent-amber-600 pointer-events-none"
                        />
                        <span className="text-xs font-bold text-stone-900">Hoàn tiền ngay</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1 pl-5 leading-relaxed">
                        Không thu hồi hàng (hàng dập hỏng), hoàn tiền cho khách ngay, <strong>Shop không mất phí ship</strong>.
                      </p>
                    </div>

                    {/* Option 2: Thu hồi hàng về vườn, shipper lấy */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setResolveReturnGoods(true)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        resolveReturnGoods
                          ? 'bg-[#2b5619]/10 border-[#2b5619] ring-2 ring-[#2b5619]/30 shadow-2xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="resolveReturnGoods"
                          checked={resolveReturnGoods}
                          onChange={() => setResolveReturnGoods(true)}
                          className="text-[#2b5619] focus:ring-[#2b5619] accent-[#2b5619] pointer-events-none"
                        />
                        <span className="text-xs font-bold text-stone-900">Thu hồi hàng về vườn</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1 pl-5 leading-relaxed">
                        Shipper đến lấy hàng mang về cho Shop (Shop chịu phí vận chuyển hoàn ~20.000 đ).
                      </p>
                    </div>
                  </div>

                  {/* Chi trả cước phí - chỉ hiện khi chọn Thu hồi hàng */}
                  {resolveReturnGoods && (
                    <div className="pt-2.5 border-t border-[#dce7d4] space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-950">
                          Hình thức thanh toán cước hoàn (~20.000 đ):
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setShippingPaymentMethod('WALLET')}
                          className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer ${
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
                          className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer ${
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
                </div>
              )}

              {/* Hướng dẫn khi Admin đã phê duyệt */}
              {selectedDispute.status === 'ADMIN_APPROVED' && (
                <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Gavel size={16} className="text-indigo-600 shrink-0" />
                    <span>Admin đã phê duyệt yêu cầu từ khách hàng</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Vui lòng chọn 1 trong 2 phương án xử lý ở trên để hoàn tất thủ tục khiếu nại.
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
                    rows={2}
                    value={shopResponseText}
                    onChange={(e) => setShopResponseText(e.target.value)}
                    placeholder="Nhập ghi chú phản hồi cho khách hàng hoặc lý do nếu từ chối..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#326318] focus:ring-2 focus:ring-[#326318]/20 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Chân Modal: Nút hành động chuẩn mực */}
            <div className="p-3.5 sm:p-4 border-t border-stone-100 bg-[#fafcf9] flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                disabled={respondMutation.isPending}
                className="py-2 px-3.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-white text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {(selectedDispute.status === 'PENDING' || selectedDispute.status === 'ADMIN_APPROVED') && (
                  <>
                    {/* Từ chối -> Chuyển DISPUTED lên Admin (chỉ khi PENDING) */}
                    {selectedDispute.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleRespond(false)}
                        disabled={respondMutation.isPending}
                        className="py-2 px-3.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <XCircle size={15} />
                        <span>Từ chối yêu cầu</span>
                      </button>
                    )}

                    {/* Nút Đồng ý giải quyết theo phương án đã chọn */}
                    <button
                      type="button"
                      onClick={() => handleRespond(true, resolveReturnGoods)}
                      disabled={respondMutation.isPending}
                      className={`py-2 px-4 rounded-lg text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                        !resolveReturnGoods
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#2b5619] hover:bg-[#1e3d12]'
                      }`}
                    >
                      {respondMutation.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}
                      <span>
                        {!resolveReturnGoods
                          ? 'Đồng ý hoàn tiền ngay'
                          : 'Đồng ý thu hồi hàng (Shipper)'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal phóng to ảnh / video */}
      {activeMediaUrl &&
        createPortal(
          <div
            role="dialog"
            className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setActiveMediaUrl(null)}
          >
            <button
              type="button"
              onClick={() => setActiveMediaUrl(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
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
          </div>,
          document.body
        )}
    </div>
  )
}
