import React, { useState } from 'react'
import { createPortal } from 'react-dom'
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
  RotateCcw,
  Tag,
} from 'lucide-react'
import {
  useShopOrders,
  useConfirmOrder,
  useReadyOrder,
  useCancelOrder,
} from '@/features/shop/hooks/useShopOrders'
import { ShopPageHeader } from '@/features/shop'
import { exportService } from '@/services/export.service'
import { CustomSelect } from '@/components/common/CustomSelect'

const CANCEL_REASON_OPTIONS = [
  { value: 'Hết hàng thu hoạch đột xuất', label: 'Hết hàng thu hoạch đột xuất' },
  { value: 'Nông sản không đạt chuẩn chất lượng tươi', label: 'Nông sản không đạt chuẩn chất lượng tươi' },
  { value: 'Thời tiết bất khả kháng ảnh hưởng vận chuyển', label: 'Thời tiết bất khả kháng ảnh hưởng vận chuyển' },
  { value: 'Khách yêu cầu hủy qua tin nhắn', label: 'Khách yêu cầu hủy qua tin nhắn' },
]
import type { OrderResponse, OrderStatus } from '@/types/order.types'
import { GoogleMapTrackingModal } from '@/components/map/GoogleMapTrackingModal'
import { OrderSettlementCard } from '@/features/wallet'
import { DeliveryProofSection } from '@/features/order/components/DeliveryProofSection'
import { CapNongLoading } from '@/components/ui/Loading'
import { needsPickupCode, pickupCode } from '@/utils/orderCode'

interface OrdersProps {
  onOpenOrderPrep?: (orderId: string) => void
  onInfo?: (msg: string) => void
}

/** Danh sách toàn bộ trạng thái hợp lệ của Shop (Loại bỏ hoàn toàn AWAITING_PAYMENT) */
const SHOP_ALL_STATUSES: OrderStatus[] = [
  'PENDING', 'PAID', 'CONFIRMED', 'READY', 'SHIPPING', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUND_REQUESTED', 'REFUNDED'
]

/** Định nghĩa tabs theo tiêu chuẩn sàn TMĐT lớn (Shopee / TikTok Shop Seller Center) */
const ORDER_TABS: { label: string; statuses: OrderStatus[]; badgeColor: string }[] = [
  { label: 'Tất cả', statuses: SHOP_ALL_STATUSES, badgeColor: 'bg-gray-100 text-gray-700' },
  { label: 'Chờ xác nhận', statuses: ['PENDING', 'PAID'], badgeColor: 'bg-amber-100 text-amber-800' },
  { label: 'Đang chuẩn bị', statuses: ['CONFIRMED'], badgeColor: 'bg-emerald-100 text-emerald-800' },
  { label: 'Sẵn sàng giao', statuses: ['READY'], badgeColor: 'bg-purple-100 text-purple-800' },
  { label: 'Đang giao', statuses: ['SHIPPING', 'PICKED_UP'], badgeColor: 'bg-sky-100 text-sky-800' },
  { label: 'Đã giao', statuses: ['DELIVERED', 'COMPLETED'], badgeColor: 'bg-green-100 text-green-800' },
  { label: 'Đã hủy', statuses: ['CANCELLED', 'FAILED'], badgeColor: 'bg-rose-100 text-rose-800' },
]

export default function Orders({ onOpenOrderPrep, onInfo }: OrdersProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [isExporting, setIsExporting] = useState(false)

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

  // 1. Xác nhận đơn: PENDING/PAID -> CONFIRMED (1-Click duyệt đơn)
  const handleConfirmOrder = async (order: OrderResponse) => {
    const orderId = order.orderId ?? order.id
    if (!orderId) return

    try {
      await confirmMutation.mutateAsync(orderId)
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
      case 'REFUND_REQUESTED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <RotateCcw size={12} /> Yêu cầu hoàn trả
          </span>
        )
      case 'REFUNDED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <RotateCcw size={12} /> Đã hoàn tiền
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
      <ShopPageHeader
        title="Quản Lý Đơn Hàng Của Nhà Vườn"
        subtitle="Quy trình chuẩn: Xác nhận đơn ➔ Chuẩn bị đóng thùng ➔ Sẵn sàng để Shipper nhận đơn giao khách"
        actions={
          <>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg border border-[#d6dcce] hover:bg-white text-[#424a3c] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Làm mới danh sách đơn hàng"
            >
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-lg border border-[#d6dcce] bg-white hover:bg-[#f4f7f1] text-xs font-bold text-[#326318] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Xuất Báo Cáo Excel</span>
            </button>
          </>
        }
      />

      {/* 2. Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929a8c]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn (#ORD-...), tên khách, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#dce3d5] rounded-lg text-xs text-[#1e2319] placeholder-[#8e9688] outline-none focus:ring-2 focus:ring-[#326318]/20 focus:border-[#326318] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Status Filter Tabs (Shopee / TikTok Shop Style) */}
      <div
        id="tour-orders-tabs"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-[#e8ece3]"
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
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${isActive
                  ? 'bg-[#326318] text-white border-[#326318] shadow-2xs'
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
        <CapNongLoading
          className="!min-h-[360px]"
          message="Đang tải dữ liệu đơn hàng..."
          subMessage="Kênh quản lý đơn hàng nhà vườn CapNong"
          size="md"
        />
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="size-8 text-red-500 mx-auto" />
          <h4 className="text-sm font-black text-red-800">Không thể tải danh sách đơn hàng</h4>
          <p className="text-xs text-red-600">
            Vui lòng kiểm tra lại kết nối mạng hoặc thử làm mới dữ liệu.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-[#e8ece3] shadow-2xs space-y-3">
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

            return (
              <div
                key={orderId}
                id={idx === 0 ? 'tour-orders-first-card' : undefined}
                className="bg-white rounded-lg border border-[#e8ece3] shadow-2xs hover:shadow-xs transition-shadow duration-200 overflow-hidden"
              >
                {/* 4.1 Card Header: Tinh gọn và tích hợp mã dán túi hàng */}
                <div className="px-4.5 py-2.5 sm:px-5 sm:py-3 bg-[#fbfdf9] border-b border-[#f1f4ed] flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-black text-sm text-ink tracking-tight">
                      Đơn {pickupCode(orderId)}
                    </span>
                    {renderStatusBadge(ord.status)}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${ord.paymentMethod === 'PAYOS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                    >
                      {ord.paymentMethod === 'PAYOS' ? '💳 VietQR PayOS' : '💵 Thu COD'}
                    </span>
                    {needsPickupCode(ord.status) && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-extrabold text-[11px] shadow-2xs"
                        title="Mã dán lên túi hàng cho tài xế kiểm tra"
                      >
                        🏷️ Dán túi: <strong className="font-black text-xs text-[#1c2216]">{pickupCode(orderId)}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-[#808a7b]">
                    <span className="text-[11px]">
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

                {/* 4.2 Card Body: Compact 2-column layout */}
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
                  {/* Left (4 cols): Customer & Shipping Information */}
                  <div className="lg:col-span-4 space-y-2 text-xs border-b lg:border-b-0 lg:border-r border-[#f1f4ed] pb-3 lg:pb-0 lg:pr-4">
                    <div className="flex items-start gap-2">
                      <User size={14} className="text-[#326318] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[#848e7f] block text-[10px] uppercase font-bold tracking-wider">Người nhận:</span>
                        <strong className="text-[#1c2216] text-xs sm:text-sm font-black truncate block">
                          {ord.recipientName || 'Khách hàng CapNong'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone size={14} className="text-[#326318] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#848e7f] block text-[10px] uppercase font-bold tracking-wider">SĐT:</span>
                        <span className="text-[#1c2216] font-bold">
                          {ord.recipientPhone || 'Chưa cung cấp'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-[#326318] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[#848e7f] block text-[10px] uppercase font-bold tracking-wider">Địa chỉ:</span>
                        <span className="text-[#1c2216] leading-snug font-medium line-clamp-2 block">
                          {ord.shippingAddress || 'Địa chỉ tiêu chuẩn'}
                        </span>
                      </div>
                    </div>

                    {ord.note && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-[#8a5b11] leading-relaxed">
                        <strong>💬 Ghi chú:</strong> {ord.note}
                      </div>
                    )}
                  </div>

                  {/* Right (8 cols): Order Items & Actions */}
                  <div className="lg:col-span-8 space-y-3">
                    {/* Items List */}
                    <div className="space-y-1.5">
                      {(ord.items || []).map((item, itemIdx) => {
                        const name =
                          item.itemName || item.productName || item.mysteryBoxType || 'Nông sản sạch'
                        const isMystery =
                          item.itemType === 'MYSTERY_BOX' || item.mysteryBoxType != null
                        return (
                          <div
                            key={item.orderDetailId || itemIdx}
                            className="flex items-center justify-between gap-3 p-2 rounded-lg bg-[#fafcf9] border border-[#edf3e8]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={name}
                                  className="size-9 rounded-lg object-cover border border-[#dbe6d4] shrink-0"
                                />
                              ) : (
                                <div className="size-9 rounded-lg bg-[#eef5ea] flex items-center justify-center text-[#326318] shrink-0">
                                  {isMystery ? <Gift size={15} /> : <Package size={15} />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-[#1c2216] truncate">{name}</p>
                                  {item.isRequestedReturn && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                      <RotateCcw size={9} /> Trả hàng
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#717b6d] whitespace-nowrap">
                                  <strong className="text-[#1c2216]">{item.quantity}</strong>{' '}
                                  × {(item.unitPrice || 0).toLocaleString('vi-VN')}&nbsp;đ
                                </p>
                              </div>
                            </div>
                            <strong className="text-xs text-[#1c2216] whitespace-nowrap shrink-0">
                              {(
                                item.subtotal || (item.unitPrice || 0) * (item.quantity || 1)
                              ).toLocaleString('vi-VN')}&nbsp;đ
                            </strong>
                          </div>
                        )
                      })}
                    </div>

                    {/* Financial Summary: Inline Compact */}
                    {(() => {
                      const itemsSubtotal = (ord.items || []).reduce(
                        (sum, it) => sum + Number(it.subtotal || (it.unitPrice || 0) * (it.quantity || 1)),
                        0,
                      )
                      const displayItemsTotal = itemsSubtotal > 0 ? itemsSubtotal : Number(ord.totalAmount || 0)
                      const shippingFee = Number(ord.shippingFee || 0)
                      const grandTotal = Number(ord.totalAmount || (displayItemsTotal + shippingFee))
                      const isFreeShipping = grandTotal <= displayItemsTotal || shippingFee === 0

                      return (
                        <div className="pt-2 border-t border-[#f1f4ed] text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[11px] text-[#737c6e] flex items-center gap-1.5 flex-wrap">
                              <span>
                                Tiền hàng: <strong className="text-[#1c2216]">{displayItemsTotal.toLocaleString('vi-VN')}&nbsp;đ</strong>
                              </span>

                              {isFreeShipping ? (
                                <span>
                                  · Ship:{' '}
                                  {shippingFee > 0 && (
                                    <span className="line-through text-gray-400 mr-1">
                                      {shippingFee.toLocaleString('vi-VN')}&nbsp;đ
                                    </span>
                                  )}
                                  <strong className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    0đ (Freeship)
                                  </strong>
                                </span>
                              ) : (
                                <span>
                                  · Ship:{' '}
                                  <strong className="text-[#1c2216]">
                                    +{shippingFee.toLocaleString('vi-VN')}&nbsp;đ
                                  </strong>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-right ml-auto">
                              <span className="text-[11px] font-extrabold text-[#1c2216]">Tổng thanh toán:</span>
                              <strong className="text-sm sm:text-base font-black text-[#2b5619]">
                                {grandTotal.toLocaleString('vi-VN')}&nbsp;đ
                              </strong>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* 4.3 Action Flow Based on Status */}
                    <div className="pt-2 border-t border-[#f1f4ed] space-y-2.5">
                      {/* FLOW A: PENDING / PAID (Chờ xác nhận) */}
                      {isPending && (
                        <div className="space-y-2.5">
                          {isPaid && (
                            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                              <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                              <span>
                                <strong>Khách đã thanh toán qua VietQR!</strong> Shop chỉ cần bấm
                                xác nhận và chuẩn bị hàng.
                              </span>
                            </div>
                          )}

                          <div
                            id={idx === 0 ? 'tour-orders-contact-btns' : undefined}
                            className="flex flex-wrap items-center justify-end gap-2 pt-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => setCancelModalOrder(ord)}
                              disabled={isProcessing}
                              className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Hủy đơn
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(ord)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-black shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {confirmMutation.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={14} />
                              )}
                              <span>Xác Nhận Đơn Hàng</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mã đối soát: thanh ngang mỏng, thanh thoát */}
                      {needsPickupCode(ord.status) && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/70 text-xs">
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-900">
                            <Tag size={13} className="text-emerald-700 shrink-0" />
                            <span>Ghi mã <strong>{pickupCode(orderId)}</strong> lên túi hàng để tài xế đối soát trước khi lấy</span>
                          </div>
                          <span className="text-sm font-black tracking-wider text-emerald-800 shrink-0">{pickupCode(orderId)}</span>
                        </div>
                      )}

                      {/* FLOW B: CONFIRMED (Đang chuẩn bị hàng) */}
                      {isConfirmed && (
                        <div className="space-y-2.5">
                          <div className="py-2 px-3 rounded-lg bg-[#f4f8f0] border border-[#d7e5ce] text-xs text-[#2b5415] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Package size={15} className="text-[#326318] shrink-0" />
                              <span>
                                Đơn đã xác nhận! Khi đóng thùng xong, hãy bấm{' '}
                                <strong>"Sẵn sàng giao"</strong> để Shipper thấy và tới lấy.
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setCancelModalOrder(ord)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Hủy đơn
                            </button>

                            {onOpenOrderPrep && (
                              <button
                                type="button"
                                onClick={() => onOpenOrderPrep(String(orderId))}
                                className="px-3 py-1.5 rounded-lg bg-[#f4f7f1] hover:bg-[#eaf0e6] text-[#326318] font-bold text-xs cursor-pointer border border-[#d6dcce] transition-colors"
                              >
                                Quy Cách Đóng Gói
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleReadyOrder(ord)}
                              disabled={isProcessing}
                              className="px-3.5 py-1.5 rounded-lg bg-[#2b5619] hover:bg-[#1e3d12] text-white text-xs font-black shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {readyMutation.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Boxes size={14} />
                              )}
                              <span>📦 Đã Chuẩn Bị Xong (Sẵn Sàng Giao)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* FLOW C: READY (Chờ shipper nhận) */}
                      {isReady && (
                        <div className="py-2 px-3 rounded-lg bg-[#f0f7ec] border border-[#cfe2c7] text-xs text-[#2b5619] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Boxes size={15} className="text-[#2b5619] shrink-0" />
                            <span>
                              <strong>Đã đóng thùng hoàn tất!</strong> Đơn đang hiển thị trên tab Đơn
                              hàng sẵn sàng của Shipper để tài xế nhận giao.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* FLOW D: SHIPPING (Shipper đang đến lấy) */}
                      {ord.status === 'SHIPPING' && (
                        <div className="py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-amber-600 shrink-0" />
                            <span>
                              <strong>Shipper đang đến lấy:</strong> Tài xế đã nhận đơn và đang di chuyển tới shop.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTrackingModalOrder(ord)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Navigation size={13} />
                            <span>🗺️ Xem lộ trình Shipper</span>
                          </button>
                        </div>
                      )}

                      {/* FLOW D2: PICKED_UP (Đã lấy hàng, đang giao khách) */}
                      {ord.status === 'PICKED_UP' && (
                        <div className="py-2 px-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-sky-600 shrink-0" />
                            <span>
                              <strong>Đang giao khách:</strong> Tài xế đã lấy hàng tại shop và đang giao tới người nhận.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTrackingModalOrder(ord)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Navigation size={13} />
                            <span>🗺️ Xem lộ trình Shipper</span>
                          </button>
                        </div>
                      )}

                      {/* FLOW E: DELIVERED */}
                      {(ord.status === 'DELIVERED' || ord.status === 'COMPLETED') && (
                        <div className="py-2 px-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                          <span>
                            <strong>Giao hàng thành công:</strong> Khách đã nhận nông sản nguyên vẹn.
                          </span>
                        </div>
                      )}

                      {/* FLOW G: REFUND_REQUESTED */}
                      {ord.status === 'REFUND_REQUESTED' && (
                        <div className="py-2 px-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <RotateCcw size={16} className="text-rose-600 shrink-0" />
                            <span>
                              <strong>Khách yêu cầu hoàn trả:</strong> Xem bằng chứng và phản hồi.
                            </span>
                          </div>
                          <a
                            href="/shop?tab=disputes"
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition-all shrink-0 cursor-pointer"
                          >
                            Xem khiếu nại
                          </a>
                        </div>
                      )}

                      {/* FLOW H: REFUNDED */}
                      {ord.status === 'REFUNDED' && (
                        <div className="py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
                            <span>
                              <strong>Đã hoàn tiền:</strong> Đã xử lý hoàn tiền cho người mua.
                            </span>
                          </div>
                          {ord.refundAmount && ord.refundAmount > 0 && (
                            <span className="font-bold text-rose-700 text-xs whitespace-nowrap">
                              Đã hoàn: -{Number(ord.refundAmount).toLocaleString('vi-VN')}&nbsp;đ
                            </span>
                          )}
                        </div>
                      )}

                      {/* FLOW F: CANCELLED */}
                      {ord.status === 'CANCELLED' && (
                        <div className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                          <XCircle size={15} className="text-rose-600 shrink-0" />
                          <span>
                            <strong>Đơn hàng đã hủy:</strong> Số lượng đã được tự động hoàn lại vào kho.
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
      {selectedOrder &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white rounded-lg max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl">
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
                  className="size-7 rounded-lg bg-[#f4f7f1] hover:bg-[#eaf0e6] flex items-center justify-center text-[#555d4e] cursor-pointer"
                >
                  ✕
                </button>
              </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-lg bg-[#fafcf9] border border-[#edf3e8] space-y-1.5">
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

              <div className="space-y-1.5">
                <div className="font-bold text-[#326318] uppercase text-[11px]">
                  Danh Sách Sản Phẩm
                </div>
                {(selectedOrder.items || []).map((it, idx) => (
                  <div
                    key={it.orderDetailId || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <span className="font-bold text-[#1c2216]">
                        {it.itemName || it.productName || it.mysteryBoxType}
                      </span>
                      <span className="text-[11px] text-[#747e70] block whitespace-nowrap">
                        Số lượng: {it.quantity} × {(it.unitPrice || 0).toLocaleString('vi-VN')}&nbsp;đ
                      </span>
                    </div>
                    <strong className="whitespace-nowrap shrink-0">
                      {(it.subtotal || (it.unitPrice || 0) * it.quantity).toLocaleString('vi-VN')}&nbsp;đ
                    </strong>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-lg bg-[#f4f8f0] border border-[#dce8d6] flex justify-between items-center text-sm gap-2">
                <span className="font-bold text-[#1c2216] whitespace-nowrap">Tổng thanh toán:</span>
                <strong className="text-lg font-black text-[#326318] whitespace-nowrap shrink-0">
                  {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}&nbsp;đ
                </strong>
              </div>
              <DeliveryProofSection
                status={selectedOrder.status}
                shipperName={selectedOrder.shipperName}
                deliveredAt={selectedOrder.deliveredAt}
                deliveryProofUrls={selectedOrder.deliveryProofUrls}
                failedAt={selectedOrder.failedAt}
                failReason={selectedOrder.failReason}
                failNote={selectedOrder.failNote}
                failCallAttempts={selectedOrder.failCallAttempts}
                failProofUrls={selectedOrder.failProofUrls}
              />
              {(selectedOrder.orderId ?? selectedOrder.id) &&
                !['CANCELLED', 'FAILED', 'AWAITING_PAYMENT'].includes(selectedOrder.status) && (
                  <div className="p-3.5 rounded-lg bg-white border border-[#e8ece3]">
                    <OrderSettlementCard orderId={(selectedOrder.orderId ?? selectedOrder.id) as number} viewer="SHOP" />
                  </div>
                )}
              {selectedOrder.status === 'SHIPPING' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTrackingModalOrder(selectedOrder)
                    }}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className="px-5 py-2 rounded-lg bg-[#326318] text-white text-xs font-bold hover:bg-[#254b12] transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 7. Modal Xác Nhận Hủy Đơn */}
      {cancelModalOrder &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-3.5 shadow-2xl text-center">
              <AlertTriangle className="size-9 text-rose-500 mx-auto" />
              <h4 className="text-base font-black text-[#1c2216]">
                Xác Nhận Hủy Đơn #ORD-{cancelModalOrder.orderId ?? cancelModalOrder.id}?
              </h4>
              <p className="text-xs text-[#7e8779]">
                Khi hủy, số lượng nông sản sẽ được tự động hoàn trả về kho hàng của bạn.
              </p>

              <div className="text-left text-xs space-y-1">
                <label className="text-[11px] font-bold text-[#454c3e]">Lý do hủy đơn:</label>
                <CustomSelect
                  value={cancelReason}
                  onChange={(val) => setCancelReason(String(val))}
                  options={CANCEL_REASON_OPTIONS}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-2 px-3.5 rounded-lg border border-gray-200 text-xs font-bold text-[#424a3c] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-2 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {cancelMutation.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Xác Nhận Hủy'}
                </button>
              </div>
            </div>
          </div>,
          document.body
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
