import React, { useState } from 'react'
import {
  Download,
  Search,
  Loader2,
  AlertCircle,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Gift,
  Boxes,
  Navigation,
} from 'lucide-react'
import {
  useShopOrders,
  useConfirmOrder,
  useReadyOrder,
  useCancelOrder,
} from '@/features/shop/hooks/useShopOrders'
import { exportService } from '@/services/export.service'
import type { OrderResponse, OrderStatus } from '@/types/order.types'
import { GoogleMapTrackingModal } from '@/components/map/GoogleMapTrackingModal'

interface OrdersProps {
  onOpenOrderPrep?: (orderId: string) => void
  onInfo?: (msg: string) => void
}

/** Danh sách toàn bộ trạng thái hợp lệ của Shop (Loại bỏ hoàn toàn AWAITING_PAYMENT) */
const SHOP_ALL_STATUSES: OrderStatus[] = [
  'PENDING', 'PAID', 'CONFIRMED', 'READY', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'
]

/** Định nghĩa tabs theo tiêu chuẩn sàn TMĐT lớn (Shopee / TikTok Shop Seller Center) */
const ORDER_TABS: { label: string; statuses: OrderStatus[]; badgeColor: string }[] = [
  { label: 'Tất cả', statuses: SHOP_ALL_STATUSES, badgeColor: 'bg-gray-100 text-gray-700' },
  { label: 'Chờ xác nhận', statuses: ['PENDING', 'PAID'], badgeColor: 'bg-amber-100 text-amber-800' },
  { label: 'Đang chuẩn bị', statuses: ['CONFIRMED'], badgeColor: 'bg-emerald-100 text-emerald-800' },
  { label: 'Sẵn sàng giao', statuses: ['READY'], badgeColor: 'bg-purple-100 text-purple-800' },
  { label: 'Đang giao', statuses: ['SHIPPING'], badgeColor: 'bg-sky-100 text-sky-800' },
  { label: 'Đã giao', statuses: ['DELIVERED', 'COMPLETED'], badgeColor: 'bg-green-100 text-green-800' },
  { label: 'Đã hủy', statuses: ['CANCELLED', 'FAILED'], badgeColor: 'bg-rose-100 text-rose-800' },
]

export default function Orders({ onOpenOrderPrep, onInfo }: OrdersProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Cam kết cân nặng & phẩm chất nông sản (lưu danh sách orderId đã tích)
  const [agreedWeightOrders, setAgreedWeightOrders] = useState<Set<number>>(new Set())

  // Modal xem chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)

  // Modal theo dõi Shipper Google Maps
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderResponse | null>(null)

  // Modal xác nhận hủy đơn
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderResponse | null>(null)
  const [cancelReason, setCancelReason] = useState('Hết hàng thu hoạch đột xuất')

  const activeTabDef = ORDER_TABS[activeTabIdx]

  // Hook lấy danh sách đơn hàng thực tế từ Backend API
  const { data, isLoading, isError, refetch, isFetching } = useShopOrders({
    page,
    size: 15,
    statuses: activeTabDef.statuses,
  })

  // State Machine Mutations
  const confirmMutation = useConfirmOrder()
  const readyMutation = useReadyOrder()
  const cancelMutation = useCancelOrder()

  const isProcessing =
    confirmMutation.isPending || readyMutation.isPending || cancelMutation.isPending

  // Tuyệt đối không hiển thị đơn AWAITING_PAYMENT bên phía Shop
  const orders = (data?.content ?? []).filter((o) => o.status !== 'AWAITING_PAYMENT')

  // Lọc tìm kiếm theo mã đơn, người nhận, số điện thoại
  const filteredOrders = search.trim()
    ? orders.filter((o) => {
        const id = String(o.orderId ?? o.id ?? '')
        const name = o.recipientName?.toLowerCase() || ''
        const phone = o.recipientPhone || ''
        const q = search.toLowerCase().trim()
        return id.includes(q) || name.includes(q) || phone.includes(q)
      })
    : orders

  const toggleWeightAgreement = (orderId: number) => {
    setAgreedWeightOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  // 1. Xác nhận đơn: PENDING/PAID -> CONFIRMED
  const handleConfirmOrder = async (order: OrderResponse) => {
    const orderId = order.orderId ?? order.id
    if (!orderId) return

    if (!agreedWeightOrders.has(orderId)) {
      onInfo?.('Vui lòng tích chọn cam kết đảm bảo cân nặng nông sản trước khi xác nhận đơn.')
      return
    }

    try {
      await confirmMutation.mutateAsync(orderId)
      setAgreedWeightOrders((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
      onInfo?.(`Đã xác nhận đơn hàng #${orderId}! Khách hàng đã được thông báo.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi xác nhận đơn hàng.'
      onInfo?.(msg)
    }
  }

  // 2. Chuẩn bị xong & Sẵn sàng giao: CONFIRMED -> READY
  const handleReadyOrder = async (order: OrderResponse) => {
    const orderId = order.orderId ?? order.id
    if (!orderId) return

    try {
      await readyMutation.mutateAsync(orderId)
      onInfo?.(`Đơn hàng #${orderId} đã chuyển sang SẴN SÀNG! Shipper đã có thể thấy để nhận đơn.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi cập nhật trạng thái sẵn sàng.'
      onInfo?.(msg)
    }
  }

  // 3. Hủy đơn
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return
    const orderId = cancelModalOrder.orderId ?? cancelModalOrder.id
    if (!orderId) return

    try {
      await cancelMutation.mutateAsync(orderId)
      onInfo?.(`Đã hủy đơn hàng #${orderId}. Số lượng nông sản đã được hoàn lại kho.`)
      setCancelModalOrder(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hủy đơn hàng.'
      onInfo?.(msg)
    }
  }

  // 4. Xuất file Excel
  const handleExportExcel = async () => {
    if (filteredOrders.length === 0) {
      onInfo?.('Không có đơn hàng nào trong danh sách để xuất.')
      return
    }
    setIsExporting(true)
    try {
      await exportService.exportShopOrdersExcel(filteredOrders)
      onInfo?.('Đã xuất file báo cáo Excel đơn hàng thành công!')
    } catch {
      onInfo?.('Xuất báo cáo thất bại, vui lòng thử lại sau.')
    } finally {
      setIsExporting(false)
    }
  }

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <Clock size={12} /> Chờ xác nhận (COD)
          </span>
        )
      case 'PAID':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> Đã thanh toán QR (Cần duyệt)
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <Package size={12} /> Đang chuẩn bị hàng
          </span>
        )
      case 'READY':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
            <Boxes size={12} /> Sẵn sàng giao (Chờ shipper)
          </span>
        )
      case 'SHIPPING':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1.5">
            <Truck size={12} /> Đang giao hàng
          </span>
        )
      case 'DELIVERED':
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-green-50 text-green-700 border border-green-200 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> Giao thành công
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <XCircle size={12} /> Đã hủy
          </span>
        )
      case 'FAILED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
            <AlertCircle size={12} /> Giao thất bại
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216] tracking-tight">
            Quản Lý Đơn Hàng Của Nhà Vườn
          </h3>
          <p className="text-xs text-[#7e8779] mt-0.5">
            Quy trình chuẩn: Xác nhận đơn ➔ Chuẩn bị đóng thùng ➔ Sẵn sàng để Shipper nhận đơn giao
            khách
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-full border border-[#d6dcce] hover:bg-white text-[#424a3c] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Làm mới danh sách đơn hàng"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-full border border-[#d6dcce] bg-white hover:bg-[#f4f7f1] text-xs font-bold text-[#326318] flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929a8c]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn (#ORD-...), tên khách, số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dce3d5] rounded-full text-xs text-[#1e2319] placeholder-[#8e9688] outline-none focus:ring-2 focus:ring-[#326318]/20 focus:border-[#326318] transition-all shadow-xs"
          />
        </div>
      </div>

      {/* 3. Status Filter Tabs (Shopee / TikTok Shop Style) */}
      <div
        id="tour-orders-tabs"
        className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar border-b border-[#e8ece3]"
      >
        {ORDER_TABS.map((tab, idx) => {
          const isActive = activeTabIdx === idx
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setActiveTabIdx(idx)
                setPage(0)
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#326318] text-white border-[#326318] shadow-sm'
                  : 'bg-white border-[#e4ece0] text-[#646e5f] hover:bg-[#f3f7ef] hover:text-[#1c2216]'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && data?.totalElements != null && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-black">
                  {data.totalElements}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 4. Orders List Body */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-[#e8ece3]">
          <Loader2 className="size-8 text-[#326318] animate-spin" />
          <p className="text-xs text-[#7e8779] font-bold uppercase tracking-widest">
            Đang tải dữ liệu đơn hàng từ hệ thống...
          </p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="size-8 text-red-500 mx-auto" />
          <h4 className="text-sm font-black text-red-800">Không thể tải danh sách đơn hàng</h4>
          <p className="text-xs text-red-600">
            Vui lòng kiểm tra lại kết nối mạng hoặc thử làm mới dữ liệu.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-[#e8ece3] shadow-xs space-y-3">
          <Package className="size-12 text-[#9fa898] mx-auto opacity-50" />
          <h4 className="text-base font-black text-[#1c2216]">Chưa có đơn hàng nào</h4>
          <p className="text-xs text-[#7e8779] max-w-sm mx-auto">
            {search.trim()
              ? `Không tìm thấy đơn hàng nào khớp với từ khóa "${search}".`
              : `Hiện tại chưa có đơn hàng nào ở trạng thái "${activeTabDef.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord, idx) => {
            const orderId = ord.orderId ?? ord.id ?? 0
            const isPending = ord.status === 'PENDING' || ord.status === 'PAID'
            const isConfirmed = ord.status === 'CONFIRMED'
            const isReady = ord.status === 'READY'
            const isPaid = ord.status === 'PAID' || ord.paymentMethod === 'PAYOS'
            const hasAgreed = agreedWeightOrders.has(orderId)

            return (
              <div
                key={orderId}
                id={idx === 0 ? 'tour-orders-first-card' : undefined}
                className="bg-white rounded-3xl border border-[#e8ece3] shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* 4.1 Card Header */}
                <div className="px-6 py-4 bg-[#fbfdf9] border-b border-[#f1f4ed] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-sm text-[#1c2216] tracking-tight">
                      #ORD-{orderId}
                    </span>
                    {renderStatusBadge(ord.status)}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        ord.paymentMethod === 'PAYOS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {ord.paymentMethod === 'PAYOS' ? '💳 VietQR PayOS' : '💵 Thu COD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#808a7b]">
                    <span>
                      {ord.createdAt
                        ? new Date(ord.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : 'Vừa xong'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="text-[#326318] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Chi tiết</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* 4.2 Card Body: Customer & Items */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left (5 cols): Customer & Shipping Information */}
                  <div className="lg:col-span-5 space-y-3 text-xs border-b lg:border-b-0 lg:border-r border-[#f1f4ed] pb-4 lg:pb-0 lg:pr-6">
                    <div className="flex items-start gap-2.5">
                      <User size={15} className="text-[#326318] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#848e7f] block text-[11px]">Người nhận hàng:</span>
                        <strong className="text-[#1c2216] text-sm font-black">
                          {ord.recipientName || 'Khách hàng CapNong'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Phone size={15} className="text-[#326318] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#848e7f] block text-[11px]">Số điện thoại:</span>
                        <span className="text-[#1c2216] font-bold">
                          {ord.recipientPhone || 'Chưa cung cấp'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="text-[#326318] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#848e7f] block text-[11px]">Địa chỉ giao:</span>
                        <span className="text-[#1c2216] leading-relaxed font-medium">
                          {ord.shippingAddress || 'Địa chỉ tiêu chuẩn'}
                        </span>
                      </div>
                    </div>

                    {ord.note && (
                      <div className="p-3 rounded-2xl bg-[#fef9ee] border border-[#fae8c6] text-[11px] text-[#8a5b11]">
                        <strong>Ghi chú của khách:</strong> {ord.note}
                      </div>
                    )}
                  </div>

                  {/* Right (7 cols): Order Items & Actions */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Items List */}
                    <div className="space-y-2.5">
                      {(ord.items || []).map((item, itemIdx) => {
                        const name =
                          item.itemName || item.productName || item.mysteryBoxType || 'Nông sản sạch'
                        const isMystery =
                          item.itemType === 'MYSTERY_BOX' || item.mysteryBoxType != null
                        return (
                          <div
                            key={item.orderDetailId || itemIdx}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#fafcf9] border border-[#edf3e8]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={name}
                                  className="size-11 rounded-xl object-cover border border-[#dbe6d4] shrink-0"
                                />
                              ) : (
                                <div className="size-11 rounded-xl bg-[#eef5ea] flex items-center justify-center text-[#326318] shrink-0">
                                  {isMystery ? <Gift size={18} /> : <Package size={18} />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1c2216] truncate">{name}</p>
                                <p className="text-[11px] text-[#717b6d]">
                                  Số lượng: <strong className="text-[#1c2216]">{item.quantity}</strong>{' '}
                                  × {(item.unitPrice || 0).toLocaleString('vi-VN')} đ
                                </p>
                              </div>
                            </div>
                            <strong className="text-xs text-[#1c2216] whitespace-nowrap shrink-0">
                              {(
                                item.subtotal || (item.unitPrice || 0) * (item.quantity || 1)
                              ).toLocaleString('vi-VN')}{' '}
                              đ
                            </strong>
                          </div>
                        )
                      })}
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#f1f4ed] text-xs">
                      <div className="text-[#737c6e]">
                        {ord.shippingFee != null && (
                          <span>
                            Phí vận chuyển: <strong>{ord.shippingFee.toLocaleString('vi-VN')} đ</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[#737c6e] block text-[11px]">Tổng tiền đơn:</span>
                        <strong className="text-lg font-black text-[#326318]">
                          {(ord.totalAmount || 0).toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                    </div>

                    {/* 4.3 Action Flow Based on Status */}
                    <div className="pt-3 border-t border-[#f1f4ed] space-y-3">
                      {/* FLOW A: PENDING / PAID (Chờ xác nhận) */}
                      {isPending && (
                        <div className="space-y-3">
                          {isPaid && (
                            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                              <span>
                                <strong>Khách đã thanh toán qua VietQR!</strong> Shop chỉ cần bấm
                                xác nhận và chuẩn bị hàng.
                              </span>
                            </div>
                          )}

                          {/* Cam kết cân nặng nông sản */}
                          <label className="flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer select-none transition-all bg-[#fbfdf9] hover:bg-white border-[#dce5d5]">
                            <input
                              type="checkbox"
                              checked={hasAgreed}
                              onChange={() => toggleWeightAgreement(orderId)}
                              className="mt-0.5 size-4 accent-[#326318] rounded cursor-pointer"
                            />
                            <span className="text-[11px] text-[#485142] leading-relaxed">
                              <strong>Tôi cam kết:</strong> Do đặc tính nông sản tươi dễ hao hụt, tôi
                              cam kết thu hoạch cân đủ trọng lượng và đóng gói tươi sạch đúng tiêu
                              chuẩn.
                            </span>
                          </label>

                          <div
                            id={idx === 0 ? 'tour-orders-contact-btns' : undefined}
                            className="flex flex-wrap items-center justify-end gap-2.5 pt-1"
                          >
                            <button
                              type="button"
                              onClick={() => setCancelModalOrder(ord)}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Hủy đơn
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(ord)}
                              disabled={isProcessing || !hasAgreed}
                              className="px-5 py-2.5 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {confirmMutation.isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={15} />
                              )}
                              <span>Xác Nhận Đơn Hàng</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* FLOW B: CONFIRMED (Đang chuẩn bị hàng) */}
                      {isConfirmed && (
                        <div className="space-y-3">
                          <div className="p-3 rounded-2xl bg-[#f4f8f0] border border-[#d7e5ce] text-xs text-[#2b5415] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-[#326318] shrink-0" />
                              <span>
                                Đơn đã xác nhận! Khi đóng thùng xong, hãy bấm{' '}
                                <strong>"Sẵn sàng giao"</strong> để Shipper thấy và tới lấy.
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => setCancelModalOrder(ord)}
                              disabled={isProcessing}
                              className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Hủy đơn
                            </button>

                            {onOpenOrderPrep && (
                              <button
                                type="button"
                                onClick={() => onOpenOrderPrep(String(orderId))}
                                className="px-4 py-2.5 rounded-xl bg-[#f4f7f1] hover:bg-[#eaf0e6] text-[#326318] font-bold text-xs cursor-pointer border border-[#d6dcce] transition-colors"
                              >
                                Quy Cách Đóng Gói
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleReadyOrder(ord)}
                              disabled={isProcessing}
                              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {readyMutation.isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Boxes size={15} />
                              )}
                              <span>📦 Đã Chuẩn Bị Xong (Sẵn Sàng Giao)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* FLOW C: READY (Chờ shipper nhận) */}
                      {isReady && (
                        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Boxes size={16} className="text-purple-600 shrink-0" />
                            <span>
                              <strong>Đã đóng thùng hoàn tất!</strong> Đơn đang hiển thị trên tab Đơn
                              hàng sẵn sàng của Shipper để tài xế nhận giao.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* FLOW D: SHIPPING */}
                      {ord.status === 'SHIPPING' && (
                        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Truck size={18} className="text-sky-600 shrink-0" />
                            <span>
                              <strong>Shipper đang giao hàng:</strong> Tài xế đang trên đường vận
                              chuyển tới người nhận.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTrackingModalOrder(ord)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                          >
                            <Navigation size={14} />
                            <span>🗺️ Xem lộ trình Shipper (Google Maps)</span>
                          </button>
                        </div>
                      )}

                      {/* FLOW E: DELIVERED */}
                      {(ord.status === 'DELIVERED' || ord.status === 'COMPLETED') && (
                        <div className="p-3 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                          <span>
                            <strong>Giao hàng thành công:</strong> Khách đã nhận nông sản nguyên vẹn.
                          </span>
                        </div>
                      )}

                      {/* FLOW F: CANCELLED */}
                      {ord.status === 'CANCELLED' && (
                        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                          <XCircle size={16} className="text-rose-600 shrink-0" />
                          <span>
                            <strong>Đơn hàng đã hủy:</strong> Toàn bộ số lượng đã được tự động hoàn
                            lại vào kho hàng.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={data.first}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-xl border border-[#d6dcce] text-xs font-bold disabled:opacity-40 hover:bg-white transition-all cursor-pointer"
          >
            ← Trang trước
          </button>
          <span className="px-4 py-2 text-xs font-bold text-[#636c5d]">
            Trang {page + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border border-[#d6dcce] text-xs font-bold disabled:opacity-40 hover:bg-white transition-all cursor-pointer"
          >
            Trang tiếp →
          </button>
        </div>
      )}

      {/* 6. Modal Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
              <div className="flex items-center gap-2.5">
                <FileText className="text-[#326318]" size={20} />
                <h4 className="text-base font-black text-[#1c2216]">
                  Chi Tiết Đơn Hàng #ORD-{selectedOrder.orderId ?? selectedOrder.id}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="size-8 rounded-full bg-[#f4f7f1] hover:bg-[#eaf0e6] flex items-center justify-center text-[#555d4e] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#edf3e8] space-y-2">
                <div className="font-bold text-[#326318] uppercase text-[11px]">
                  Thông Tin Người Nhận
                </div>
                <p>
                  <strong>Khách hàng:</strong> {selectedOrder.recipientName}
                </p>
                <p>
                  <strong>Số điện thoại:</strong> {selectedOrder.recipientPhone}
                </p>
                <p>
                  <strong>Địa chỉ nhận:</strong> {selectedOrder.shippingAddress}
                </p>
                {selectedOrder.note && (
                  <p className="text-amber-700">
                    <strong>Ghi chú:</strong> {selectedOrder.note}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#326318] uppercase text-[11px]">
                  Danh Sách Sản Phẩm
                </div>
                {(selectedOrder.items || []).map((it, idx) => (
                  <div
                    key={it.orderDetailId || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <span className="font-bold text-[#1c2216]">
                        {it.itemName || it.productName || it.mysteryBoxType}
                      </span>
                      <span className="text-[11px] text-[#747e70] block">
                        Số lượng: {it.quantity} × {(it.unitPrice || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <strong>
                      {(it.subtotal || (it.unitPrice || 0) * it.quantity).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#f4f8f0] border border-[#dce8d6] flex justify-between items-center text-sm">
                <span className="font-bold text-[#1c2216]">Tổng thanh toán:</span>
                <strong className="text-lg font-black text-[#326318]">
                  {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              {selectedOrder.status === 'SHIPPING' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTrackingModalOrder(selectedOrder)
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Navigation size={16} />
                    <span>🗺️ Xem Lộ Trình Shipper (Google Maps)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-[#326318] text-white text-xs font-bold hover:bg-[#254b12] transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Xác Nhận Hủy Đơn */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <AlertTriangle className="size-10 text-rose-500 mx-auto" />
            <h4 className="text-base font-black text-[#1c2216]">
              Xác Nhận Hủy Đơn #ORD-{cancelModalOrder.orderId ?? cancelModalOrder.id}?
            </h4>
            <p className="text-xs text-[#7e8779]">
              Khi hủy, số lượng nông sản sẽ được tự động hoàn trả về kho hàng của bạn.
            </p>

            <div className="text-left text-xs space-y-1">
              <label className="text-[11px] font-bold text-[#454c3e]">Lý do hủy đơn:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
              >
                <option value="Hết hàng thu hoạch đột xuất">Hết hàng thu hoạch đột xuất</option>
                <option value="Nông sản không đạt chuẩn chất lượng tươi">
                  Nông sản không đạt chuẩn chất lượng tươi
                </option>
                <option value="Thời tiết bất khả kháng ảnh hưởng vận chuyển">
                  Thời tiết bất khả kháng ảnh hưởng vận chuyển
                </option>
                <option value="Khách yêu cầu hủy qua tin nhắn">Khách yêu cầu hủy qua tin nhắn</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#424a3c] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelMutation.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Xác Nhận Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Bản Đồ Google Maps Tracking */}
      {trackingModalOrder && (
        <GoogleMapTrackingModal
          orderId={trackingModalOrder.orderId ?? trackingModalOrder.id ?? 0}
          orderCode={`#ORD-${trackingModalOrder.orderId ?? trackingModalOrder.id ?? 0}`}
          role="SHOP"
          onClose={() => setTrackingModalOrder(null)}
        />
      )}
    </div>
  )
}
