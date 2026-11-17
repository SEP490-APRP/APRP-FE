import React, { useState } from 'react'
import {
  X,
  FileText,
  MapPin,
  Phone,
  User,
  Store,
  Truck,
  CreditCard,
  Navigation,
  CheckCircle2,
  Clock,
  Package,
  Boxes,
  RotateCcw,
  Star,
  Loader2,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react'
import { useOrderDetails } from '../hooks/useBuyerOrder'
import { OrderStatusBadge } from './OrderStatusBadge'
import { GoogleMapTrackingModal } from '@/components/map/GoogleMapTrackingModal'
import { Button } from '@/components/ui/Button'
import type { OrderItem, OrderStatus } from '@/types/order.types'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '@/services'

interface BuyerOrderDetailModalProps {
  orderId: number | null
  isOpen: boolean
  onClose: () => void
  onPayNow?: (order: any) => void
  onCancelOrder?: (order: any) => void
  onCompleteOrder?: (order: any) => void
  onReviewItem?: (item: OrderItem, orderId: number) => void
  onReturnItem?: (item: OrderItem, orderId: number) => void
}

export const BuyerOrderDetailModal: React.FC<BuyerOrderDetailModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onPayNow,
  onCancelOrder,
  onCompleteOrder,
  onReviewItem,
  onReturnItem,
}) => {
  const navigate = useNavigate()
  const [showMapTracking, setShowMapTracking] = useState(false)
  const { data: order, isLoading, error } = useOrderDetails(orderId ?? 0)

  const handleProductClick = async (it: OrderItem) => {
    if (it.productId) {
      onClose()
      navigate(`/san-pham/${it.productId}`)
      return
    }

    if (it.itemType === 'MYSTERY_BOX' || it.mysteryBoxId) {
      onClose()
      navigate('/combo-tui-mu')
      return
    }

    if (it.itemType === 'BUILD_COMBO' || it.buildComboId) {
      onClose()
      navigate('/combo-tui-mu')
      return
    }

    // Fallback: Tìm productId theo tên sản phẩm nếu Backend chưa kịp cập nhật productId
    const name = it.itemName || it.productName
    if (name) {
      try {
        const res = await productService.getAll({ keyword: name })
        const products = res.result || []
        const matched =
          products.find(
            (p) =>
              (p.productName || p.name || '').trim().toLowerCase() === name.trim().toLowerCase() ||
              (p.productName || p.name || '').toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes((p.productName || p.name || '').toLowerCase())
          ) || products[0]

        if (matched?.id || matched?.productId) {
          onClose()
          navigate(`/san-pham/${matched.id || matched.productId}`)
          return
        }
      } catch (err) {
        console.warn('Fallback tìm kiếm sản phẩm thất bại:', err)
      }
    }

    onClose()
    if (order?.shopId) {
      navigate(`/cua-hang/${order.shopId}`)
    } else {
      navigate(`/nong-san-tuoi${name ? `?search=${encodeURIComponent(name)}` : ''}`)
    }
  }

  if (!isOpen || !orderId) return null

  interface TimelineStep {
    key?: string
    label: string
    done: boolean
    current: boolean
    isError?: boolean
  }

  // Tiến trình trạng thái đơn hàng (Timeline Stepper)
  const getTimelineSteps = (status?: OrderStatus): TimelineStep[] => {
    const isCancelled = status === 'CANCELLED' || status === 'FAILED'
    if (isCancelled) {
      return [
        { label: 'Đặt hàng', done: true, current: false, isError: false },
        { label: status === 'FAILED' ? 'Giao thất bại' : 'Đã hủy đơn', done: true, current: true, isError: true },
      ]
    }

    const steps: TimelineStep[] = [
      { key: 'ORDERED', label: 'Đặt hàng', done: true, current: status === 'PENDING' || status === 'PAID' || status === 'AWAITING_PAYMENT', isError: false },
      { key: 'CONFIRMED', label: 'Shop xác nhận', done: ['CONFIRMED', 'READY', 'SHIPPING', 'PICKED_UP', 'DELIVERED', 'COMPLETED'].includes(status || ''), current: status === 'CONFIRMED', isError: false },
      { key: 'READY', label: 'Đóng gói xong', done: ['READY', 'SHIPPING', 'PICKED_UP', 'DELIVERED', 'COMPLETED'].includes(status || ''), current: status === 'READY', isError: false },
      { key: 'SHIPPING', label: 'Đang vận chuyển', done: ['SHIPPING', 'PICKED_UP', 'DELIVERED', 'COMPLETED'].includes(status || ''), current: status === 'SHIPPING' || status === 'PICKED_UP', isError: false },
      { key: 'DELIVERED', label: 'Đã nhận hàng', done: ['DELIVERED', 'COMPLETED'].includes(status || ''), current: status === 'DELIVERED' || status === 'COMPLETED', isError: false },
    ]
    return steps
  }

  const steps = getTimelineSteps(order?.status)
  const isPendingCancel = order?.status === 'AWAITING_PAYMENT' || order?.status === 'PENDING'
  const isDelivered = order?.status === 'DELIVERED'
  const canTrackShipper =
    order?.status === 'SHIPPING' || order?.status === 'PICKED_UP' || order?.status === 'READY'

  // Tính tổng tiền sản phẩm
  const itemsSubtotal = (order?.items || []).reduce(
    (sum, it) => sum + (it.subtotal || (it.unitPrice || 0) * (it.quantity || 1)),
    0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-[#fafcf9] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-[#1c2216]">
                  Chi Tiết Đơn Hàng #{orderId}
                </h3>
                {order && <OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} />}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {order?.createdAt
                  ? `Đặt lúc: ${new Date(order.createdAt).toLocaleString('vi-VN')}`
                  : 'Đang tải thông tin đơn hàng...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="size-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" />
              <p className="font-semibold text-stone-600">Đang tải chi tiết đơn hàng #{orderId}...</p>
            </div>
          ) : error || !order ? (
            <div className="py-12 text-center space-y-3">
              <AlertCircle size={40} className="text-rose-500 mx-auto" />
              <h4 className="font-bold text-stone-800 text-sm">Không thể tải thông tin đơn hàng</h4>
              <p className="text-stone-500 max-w-sm mx-auto">
                Đơn hàng này có thể đã bị xóa hoặc bạn không có quyền truy cập.
              </p>
              <Button variant="outline" onClick={onClose} className="rounded-xl text-xs py-2 px-4">
                Đóng
              </Button>
            </div>
          ) : (
            <>
              {/* 1. Timeline Tiến Trình Đơn Hàng */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-stone-200/70">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3">
                  Tiến trình đơn hàng
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  {steps.map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        s.isError
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : s.current
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-black shadow-xs ring-1 ring-emerald-400'
                          : s.done
                          ? 'bg-white border-stone-200 text-stone-800 font-bold'
                          : 'bg-stone-50/50 border-stone-100 text-stone-400'
                      }`}
                    >
                      {s.isError ? (
                        <AlertCircle size={16} className="text-rose-600" />
                      ) : s.done ? (
                        <CheckCircle2 size={16} className={s.current ? 'text-emerald-600' : 'text-stone-600'} />
                      ) : (
                        <Clock size={16} className="text-stone-300" />
                      )}
                      <span className="text-[11px] leading-tight">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Banner Thông Báo Quan Trọng Theo Trạng Thái */}
              {order.status === 'AWAITING_PAYMENT' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock size={20} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="font-black text-xs">Đơn hàng đang chờ thanh toán VietQR</p>
                      <p className="text-[11px] text-amber-700">Vui lòng thanh toán để nhà vườn chuẩn bị hàng sớm nhất.</p>
                    </div>
                  </div>
                  {onPayNow && (
                    <Button
                      variant="primary"
                      onClick={() => onPayNow(order)}
                      className="text-xs py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0"
                    >
                      Thanh toán ngay
                    </Button>
                  )}
                </div>
              )}

              {canTrackShipper && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Truck size={20} className="text-blue-600 shrink-0" />
                    <div>
                      <p className="font-black text-xs">
                        {order.status === 'READY'
                          ? 'Đã đóng gói xong - Đang chờ Shipper lấy hàng'
                          : 'Shipper đang trên đường giao nông sản đến bạn'}
                      </p>
                      <p className="text-[11px] text-blue-700">
                        {order.shipperName ? `Tài xế giao hàng: ${order.shipperName}` : 'Hệ thống đang điều phối tài xế gần nhất'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowMapTracking(true)}
                    className="text-xs py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Navigation size={14} />
                    <span>Lộ trình Shipper (Map)</span>
                  </Button>
                </div>
              )}

              {/* 3. Thông Tin Giao Nhận & Nhà Vườn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Người nhận */}
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-bold uppercase text-[10px] tracking-wider text-emerald-800">
                    <MapPin size={14} />
                    <span>Địa chỉ giao hàng</span>
                  </div>
                  <p className="font-black text-sm text-stone-900">{order.recipientName || order.buyerName || 'Người nhận'}</p>
                  <p className="text-stone-600 font-semibold">{order.recipientPhone || 'Chưa có SĐT'}</p>
                  <p className="text-stone-600 leading-relaxed">{order.shippingAddress}</p>
                  {order.note && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      <strong>Ghi chú:</strong> {order.note}
                    </div>
                  )}
                </div>

                {/* Nhà vườn & Vận chuyển */}
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-bold uppercase text-[10px] tracking-wider text-emerald-800">
                    <Store size={14} />
                    <span>Nhà vườn cung cấp</span>
                  </div>
                  <p className="font-black text-sm text-stone-900">{order.shopName || 'Nhà vườn CapNong'}</p>
                  {order.shopAddress && <p className="text-stone-600 text-[11px]">{order.shopAddress}</p>}
                  {order.shopPhone && <p className="text-stone-600 text-[11px]">Hotline shop: {order.shopPhone}</p>}
                  
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">Shipper:</span>
                    <span className="font-bold text-stone-800">
                      {order.shipperName ? order.shipperName : 'Hệ thống tự động điều phối'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Danh Sách Sản Phẩm */}
              <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-2xs">
                <div className="px-4 py-3 bg-[#fafcf9] border-b border-stone-200 flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                    <Package size={15} className="text-emerald-700" />
                    <span>Sản phẩm trong đơn ({(order.items || []).length})</span>
                  </span>
                  {order.shopId && (
                    <Link
                      to={`/cua-hang/${order.shopId}`}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Ghé gian hàng &rarr;
                    </Link>
                  )}
                </div>

                <div className="divide-y divide-stone-100 p-2 sm:p-3">
                  {(order.items || []).map((it, idx) => {
                    const name = it.itemName || it.productName || it.mysteryBoxType || 'Sản phẩm nông sản'
                    const subtotal = it.subtotal || (it.unitPrice || 0) * (it.quantity || 1)

                    return (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3.5 hover:bg-neutral-50/60 rounded-xl transition-colors">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleProductClick(it)}
                          className="flex items-center gap-3.5 flex-1 min-w-0 group cursor-pointer select-none"
                          title="Nhấn để xem chi tiết sản phẩm"
                        >
                          <img
                            src={it.imageUrl || '/images/default-produce.png'}
                            alt={name}
                            className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0 bg-neutral-100 transition-all duration-200 group-hover:scale-105 group-hover:border-emerald-400 group-hover:shadow-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate group-hover:text-emerald-700 transition-colors">
                                {name}
                              </h4>
                              <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold shrink-0">
                                Xem chi tiết &rarr;
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Số lượng: <strong className="text-stone-800">{it.quantity}</strong> ×{' '}
                              {Number(it.unitPrice || 0).toLocaleString('vi-VN')} đ
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <p className="font-black text-emerald-800 text-xs sm:text-sm">
                            {Number(subtotal).toLocaleString('vi-VN')} đ
                          </p>
                          {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                            <div className="flex items-center gap-1.5 justify-end">
                              {onReturnItem && !it.isRequestedReturn && (
                                <button
                                  type="button"
                                  onClick={() => onReturnItem(it, order.orderId ?? order.id ?? 0)}
                                  className="text-[10px] font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md cursor-pointer"
                                >
                                  Trả hàng
                                </button>
                              )}
                              {onReviewItem && !it.isReviewed && (
                                <button
                                  type="button"
                                  onClick={() => onReviewItem(it, order.orderId ?? order.id ?? 0)}
                                  className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md cursor-pointer flex items-center gap-1"
                                >
                                  <Star size={10} className="fill-amber-500 text-amber-500" />
                                  <span>Đánh giá</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 5. Chi Tiết Thanh Toán (Bill Breakdown) */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-stone-200 space-y-2.5">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Chi tiết thanh toán
                </div>

                <div className="flex justify-between items-center text-stone-600">
                  <span>Tiền hàng ({order.items?.length || 0} sản phẩm):</span>
                  <span className="font-bold text-stone-900">
                    {Number(itemsSubtotal).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-stone-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-bold text-stone-900">
                    {order.shippingFee !== undefined
                      ? `${Number(order.shippingFee).toLocaleString('vi-VN')} đ`
                      : '0 đ'}
                  </span>
                </div>

                {order.voucherDiscountAmount !== undefined && order.voucherDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>Giảm giá Voucher:</span>
                    <span>-{Number(order.voucherDiscountAmount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {order.refundAmount !== undefined && order.refundAmount > 0 && (
                  <div className="flex justify-between items-center text-rose-600 font-bold">
                    <span>Đã hoàn tiền:</span>
                    <span>-{Number(order.refundAmount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-bold">
                  <span className="text-stone-900">Tổng thanh toán:</span>
                  <span className="text-lg font-black text-emerald-800">
                    {Number(order.totalAmount || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-stone-500 pt-1">
                  <span>Phương thức thanh toán:</span>
                  <span className="font-bold text-stone-800">
                    {order.paymentMethod === 'WALLET'
                      ? 'Ví CapNong'
                      : order.paymentMethod === 'PAYOS'
                        ? 'Chuyển khoản VietQR (PayOS)'
                        : 'Thanh toán tiền mặt (COD)'}
                    {Number(order.walletPaidAmount ?? 0) > 0 && order.paymentMethod !== 'WALLET' && (
                      <span className="block text-xs font-normal text-gray-500">
                        Ví đã trả {Number(order.walletPaidAmount).toLocaleString('vi-VN')}đ · còn {Number(order.amountDue ?? 0).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-stone-100 bg-[#fafcf9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500">
            {order?.status === 'DELIVERED' && (
              <span className="text-emerald-700 font-bold">Đơn hàng đã giao thành công. Vui lòng bấm Đã nhận hàng.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {isPendingCancel && onCancelOrder && order && (
              <Button
                variant="secondary"
                onClick={() => {
                  onClose()
                  onCancelOrder(order)
                }}
                className="text-xs py-2 px-4 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 font-bold cursor-pointer"
              >
                Hủy đơn hàng
              </Button>
            )}

            {isDelivered && onCompleteOrder && order && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  onCompleteOrder(order)
                }}
                className="text-xs py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
              >
                Đã nhận hàng
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs py-2 px-5 rounded-xl border-stone-200 text-stone-700 hover:bg-stone-100 font-bold cursor-pointer"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Theo Dõi Vị Trí Shipper Trên Google Maps */}
      {showMapTracking && order && (
        <GoogleMapTrackingModal
          orderId={order.orderId ?? order.id ?? 0}
          orderCode={`#${order.orderId ?? order.id ?? ''}`}
          role="BUYER"
          initialShopLat={order.shopLatitude ?? undefined}
          initialShopLng={order.shopLongitude ?? undefined}
          initialDestLat={order.shippingLatitude ?? undefined}
          initialDestLng={order.shippingLongitude ?? undefined}
          onClose={() => setShowMapTracking(false)}
        />
      )}
    </div>
  )
}
export default BuyerOrderDetailModal
