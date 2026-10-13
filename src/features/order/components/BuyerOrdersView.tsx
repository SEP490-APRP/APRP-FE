import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Package,
  CreditCard,
  Store,
  Search,
  RefreshCw,
  XCircle,
  ChevronRight,
  Navigation,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { OrderStatusBadge } from './OrderStatusBadge'
import { PaymentQrModal } from './PaymentQrModal'
import { ResumePaymentModal } from './ResumePaymentModal'
import { BatchCheckoutGroupCard } from './BatchCheckoutGroupCard'
import { GoogleMapTrackingModal } from '@/components/map/GoogleMapTrackingModal'
import { orderService, paymentService } from '@/services'
import type { OrderResponse, OrderStatus } from '@/types/order.types'
import type { PaymentResponse, ResumePaymentOptionsResponse } from '@/types/payment.types'
import { useAuth } from '@/stores'

type TabKey = 'ALL' | 'AWAITING_PAYMENT' | 'PENDING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'AWAITING_PAYMENT', label: 'Chờ thanh toán' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'SHIPPING', label: 'Đang vận chuyển' },
  { key: 'COMPLETED', label: 'Đã hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
]

type OrderDisplayItem =
  | { kind: 'batch'; batchId: number; orders: OrderResponse[] }
  | { kind: 'single'; order: OrderResponse }

export const BuyerOrdersView: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = (searchParams.get('tab') as TabKey) || 'ALL'
  const [searchKeyword, setSearchKeyword] = useState('')
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)
  const [isCancellingBatch, setIsCancellingBatch] = useState(false)

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<PaymentResponse | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null)

  // Resume Options Modal State
  const [resumeOptions, setResumeOptions] = useState<ResumePaymentOptionsResponse | null>(null)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [isLoadingResumeOptions, setIsLoadingResumeOptions] = useState(false)
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderResponse | null>(null)

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      let statuses: OrderStatus[] | undefined = undefined
      if (currentTab === 'AWAITING_PAYMENT') {
        statuses = ['AWAITING_PAYMENT']
      } else if (currentTab === 'PENDING') {
        statuses = ['PENDING', 'PAID']
      } else if (currentTab === 'SHIPPING') {
        statuses = ['CONFIRMED', 'READY', 'SHIPPING', 'PICKED_UP']
      } else if (currentTab === 'COMPLETED') {
        statuses = ['DELIVERED', 'COMPLETED']
      } else if (currentTab === 'CANCELLED') {
        statuses = ['CANCELLED', 'FAILED']
      }

      const res = await orderService.fetchMyOrders({
        page: 0,
        size: 50,
        statuses: statuses,
      })
      setOrders(res.content || [])
    } catch (err) {
      console.error('Lỗi khi tải danh sách đơn hàng:', err)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, currentTab])

  // Lọc theo từ khóa tìm kiếm
  const filteredOrders = useMemo(() => {
    if (!searchKeyword.trim()) return orders
    const kw = searchKeyword.trim().toLowerCase()
    return orders.filter(
      (o) =>
        String(o.orderId || o.id).includes(kw) ||
        (o.shopName && o.shopName.toLowerCase().includes(kw)) ||
        (o.items && o.items.some((it) => it.productName && it.productName.toLowerCase().includes(kw))),
    )
  }, [orders, searchKeyword])

  // Gom các đơn thuộc cùng 1 checkout batch đang chờ thanh toán (nhiều shop)
  const displayItems = useMemo<OrderDisplayItem[]>(() => {
    const result: OrderDisplayItem[] = []
    const batchMap = new Map<number, OrderResponse[]>()
    const handledBatchIds = new Set<number>()

    for (const order of filteredOrders) {
      const isUnpaid =
        order.status === 'AWAITING_PAYMENT' ||
        (order.status === 'PENDING' &&
          (order.paymentMethod?.toUpperCase() === 'PAYOS' || order.paymentMethod?.toUpperCase() === 'TRANSFER'))

      if (order.batchId && isUnpaid) {
        if (!batchMap.has(order.batchId)) {
          batchMap.set(order.batchId, [])
        }
        batchMap.get(order.batchId)!.push(order)
      }
    }

    for (const order of filteredOrders) {
      const isUnpaid =
        order.status === 'AWAITING_PAYMENT' ||
        (order.status === 'PENDING' &&
          (order.paymentMethod?.toUpperCase() === 'PAYOS' || order.paymentMethod?.toUpperCase() === 'TRANSFER'))
      const batchId = order.batchId

      if (batchId && isUnpaid) {
        const batchOrders = batchMap.get(batchId) || []
        if (batchOrders.length > 1) {
          if (!handledBatchIds.has(batchId)) {
            handledBatchIds.add(batchId)
            result.push({ kind: 'batch', batchId, orders: batchOrders })
          }
          continue
        }
      }

      result.push({ kind: 'single', order })
    }

    return result
  }, [filteredOrders])

  // Xử lý mở modal lựa chọn thanh toán checkout (Thanh toán tất cả hoặc từng đơn)
  const handleResumeBatchPayment = async (batchId: number, triggerOrderId: number) => {
    setIsLoadingResumeOptions(true)
    try {
      const res = await paymentService.getResumePaymentOptions(triggerOrderId)
      if (res && res.isBatch && (res.unpaidOrders?.length || 0) > 1) {
        setResumeOptions(res)
        setIsResumeModalOpen(true)
      } else {
        // Fallback tạo thanh toán trực tiếp cho batch
        const payRes = await paymentService.createPayosPayment({
          batchId,
          returnUrl: `${window.location.origin}/payment/result`,
          cancelUrl: `${window.location.origin}/payment/result`,
        })
        if (payRes && (payRes.checkoutUrl || payRes.qrCodeUrl)) {
          setQrModalData(payRes)
          setIsQrModalOpen(true)
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi mở tùy chọn thanh toán:', err)
      alert(err?.message || 'Có lỗi khi mở thanh toán checkout.')
    } finally {
      setIsLoadingResumeOptions(false)
    }
  }

  // Xử lý thanh toán cho 1 đơn lẻ
  const handlePayNow = async (order: OrderResponse) => {
    const orderId = order.orderId || order.id || 0
    setPayingOrderId(orderId)
    try {
      if (order.batchId) {
        try {
          const optRes = await paymentService.getResumePaymentOptions(orderId)
          if (optRes && optRes.isBatch && (optRes.unpaidOrders?.length || 0) > 1) {
            setResumeOptions(optRes)
            setIsResumeModalOpen(true)
            return
          }
        } catch {
          // Bỏ qua nếu không lấy được options batch
        }
      }

      const res = await paymentService.createPayosPayment({
        orderId,
        returnUrl: `${window.location.origin}/payment/result`,
        cancelUrl: `${window.location.origin}/payment/result`,
      })

      if (res && (res.checkoutUrl || res.qrCodeUrl)) {
        setQrModalData(res)
        setIsQrModalOpen(true)
      } else {
        alert('Không thể tạo mã QR thanh toán. Vui lòng thử lại sau.')
      }
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err)
      alert(err?.message || 'Có lỗi khi kết nối cổng thanh toán PayOS.')
    } finally {
      setPayingOrderId(null)
    }
  }

  // Xử lý hủy 1 đơn đơn lẻ
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId}?`)) return
    setCancellingOrderId(orderId)
    try {
      await orderService.cancelOrder(orderId)
      await fetchOrders()
    } catch (err: any) {
      alert(err?.message || 'Không thể hủy đơn hàng này.')
    } finally {
      setCancellingOrderId(null)
    }
  }

  // Xử lý hủy toàn bộ batch checkout
  const handleCancelBatch = async (batchOrders: OrderResponse[]) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy toàn bộ checkout này gồm ${batchOrders.length} đơn hàng?`)) return
    setIsCancellingBatch(true)
    try {
      for (const o of batchOrders) {
        const id = o.orderId || o.id
        if (id) {
          await orderService.cancelOrder(id)
        }
      }
      await fetchOrders()
    } catch (err: any) {
      console.error('Lỗi hủy batch:', err)
      alert(err?.message || 'Có lỗi khi hủy các đơn trong checkout.')
    } finally {
      setIsCancellingBatch(false)
    }
  }

  const handleQrConfirmed = async () => {
    setIsQrModalOpen(false)
    setQrModalData(null)
    await fetchOrders()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Tiêu đề & Làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">Đơn Hàng Của Tôi</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Theo dõi, thanh toán và quản lý lịch sử mua nông sản của bạn
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={fetchOrders}
          disabled={isLoading}
          className="gap-2 self-start sm:self-auto rounded-xl"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </Button>
      </div>

      {/* Tabs thanh trạng thái */}
      <div className="bg-white rounded-2xl border border-line p-1.5 mb-6 flex overflow-x-auto gap-1 shadow-sm scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSearchParams(tab.key === 'ALL' ? {} : { tab: tab.key })
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-neutral-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Thanh tìm kiếm */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Tìm kiếm theo mã đơn, tên shop, tên sản phẩm..."
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-line text-sm text-ink outline-none focus:border-emerald-500 shadow-sm transition-colors"
        />
      </div>

      {/* Danh sách đơn hàng */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-line space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-line p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-ink-muted">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">Chưa có đơn hàng nào</h3>
          <p className="text-sm text-ink-muted mb-6">
            {searchKeyword
              ? 'Không tìm thấy đơn hàng nào phù hợp với từ khóa.'
              : 'Bạn chưa có đơn hàng nào trong mục này.'}
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/nong-san-tuoi')}
            className="rounded-xl px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Khám phá nông sản ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayItems.map((item) => {
            // Render Batch Card nếu là đợt checkout nhiều shop chưa thanh toán
            if (item.kind === 'batch') {
              return (
                <BatchCheckoutGroupCard
                  key={`batch-${item.batchId}`}
                  batchId={item.batchId}
                  orders={item.orders}
                  onResumePayment={handleResumeBatchPayment}
                  onCancelBatch={handleCancelBatch}
                  onCancelSingleOrder={handleCancelOrder}
                  isResuming={isLoadingResumeOptions}
                  isCancelling={isCancellingBatch}
                />
              )
            }

            // Render Card đơn hàng đơn lẻ
            const order = item.order
            const orderId = order.orderId || order.id || 0
            const isUnpaid =
              order.status === 'AWAITING_PAYMENT' ||
              (order.status === 'PENDING' && order.paymentMethod?.toUpperCase() === 'PAYOS')

            return (
              <div
                key={`single-${orderId}`}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isUnpaid
                    ? 'border-amber-300 shadow-md ring-1 ring-amber-200'
                    : 'border-line hover:border-neutral-300 shadow-sm'
                }`}
              >
                {/* Header đơn: Shop & Trạng thái */}
                <div className="px-6 py-4 bg-neutral-50/70 border-b border-line flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-line flex items-center justify-center text-emerald-700">
                      <Store size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={order.shopId ? `/cua-hang/${order.shopId}` : '#'}
                          className="font-bold text-ink text-sm hover:text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          {order.shopName || 'Nhà vườn'}
                          <ChevronRight size={14} className="text-ink-muted" />
                        </Link>
                        {order.batchId && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                            Đợt mua #{order.batchId}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-ink-muted">
                        Mã đơn: <span className="font-mono font-semibold text-ink">#{orderId}</span>
                        {order.createdAt && ` · ${new Date(order.createdAt).toLocaleString('vi-VN')}`}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} />
                  </div>
                </div>

                {/* Danh sách items */}
                <div className="p-6 divide-y divide-line/60">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                        <img
                          src={it.imageUrl || '/images/default-produce.png'}
                          alt={it.productName || 'Sản phẩm'}
                          className="w-16 h-16 rounded-xl object-cover border border-line shrink-0 bg-neutral-50"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-ink truncate">
                            {it.productName || it.mysteryBoxType || 'Sản phẩm nông sản'}
                          </h4>
                          <p className="text-xs text-ink-muted mt-0.5">
                            Số lượng: <span className="font-bold text-ink">{it.quantity}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-emerald-700">
                            {Number(it.unitPrice || 0).toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-xs text-ink-muted italic">
                      Chi tiết sản phẩm đang được cập nhật
                    </div>
                  )}
                </div>

                {/* Footer đơn: Tổng tiền & Nút hành động */}
                <div className="px-6 py-4 bg-neutral-50/40 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                    <div>
                      Phương thức: <span className="font-bold text-ink">{order.paymentMethod || 'COD'}</span>
                    </div>
                    {order.shippingFee !== undefined && (
                      <div>
                        Phí ship: <span className="font-bold text-ink">{Number(order.shippingFee).toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                    <div className="text-sm">
                      Tổng thanh toán:{' '}
                      <span className="font-black text-emerald-700 text-base">
                        {Number(order.totalAmount || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động theo trạng thái */}
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {/* Chờ thanh toán PayOS -> Nút THANH TOÁN NGAY */}
                    {isUnpaid && (
                      <Button
                        variant="primary"
                        onClick={() => handlePayNow(order)}
                        disabled={payingOrderId === orderId}
                        className="gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
                      >
                        <CreditCard size={14} />
                        {payingOrderId === orderId ? 'Đang mở QR...' : 'Thanh toán ngay'}
                      </Button>
                    )}

                    {/* Cho phép hủy đơn nếu chưa thanh toán hoặc đang PENDING */}
                    {(order.status === 'AWAITING_PAYMENT' || order.status === 'PENDING') && (
                      <Button
                        variant="secondary"
                        onClick={() => handleCancelOrder(orderId)}
                        disabled={cancellingOrderId === orderId}
                        className="gap-1 px-3 py-2 text-xs rounded-xl text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        <XCircle size={14} />
                        {cancellingOrderId === orderId ? 'Đang hủy...' : 'Hủy đơn'}
                      </Button>
                    )}

                    {/* Đang vận chuyển -> Nút THEO DÕI LỘ TRÌNH (GOOGLE MAPS) */}
                    {(order.status === 'SHIPPING' || order.status === 'PICKED_UP' || order.status === 'READY') && (
                      <Button
                        variant="primary"
                        onClick={() => setTrackingModalOrder(order)}
                        className="gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20"
                      >
                        <Navigation size={14} />
                        Theo dõi lộ trình (Map)
                      </Button>
                    )}

                    {/* Xem chi tiết kết quả */}
                    <Link
                      to={`/payment/result?orderId=${orderId}&method=${order.paymentMethod}`}
                      className="px-3 py-2 text-xs font-semibold rounded-xl text-ink-muted hover:text-ink hover:bg-neutral-100 transition-colors"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Lựa chọn thanh toán Checkout (Ảnh 2) */}
      <ResumePaymentModal
        isOpen={isResumeModalOpen}
        options={resumeOptions}
        onClose={() => setIsResumeModalOpen(false)}
        onSelectPayment={(paymentRes) => {
          setIsResumeModalOpen(false)
          setQrModalData(paymentRes)
          setIsQrModalOpen(true)
        }}
      />

      {/* Modal QR VietQR (Sau khi chọn thanh toán đơn lẻ hoặc toàn bộ) */}
      {qrModalData && (
        <PaymentQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onConfirmed={handleQrConfirmed}
          qrCodeUrl={qrModalData.qrCodeUrl}
          checkoutUrl={qrModalData.checkoutUrl}
          amount={qrModalData.amount}
          orderCode={qrModalData.payosOrderCode}
        />
      )}

      {/* Modal Theo Dõi Vị Trí Shipper Trên Google Maps */}
      {trackingModalOrder && (
        <GoogleMapTrackingModal
          orderId={trackingModalOrder.orderId ?? trackingModalOrder.id ?? 0}
          orderCode={`#${trackingModalOrder.orderId ?? trackingModalOrder.id ?? ''}`}
          role="BUYER"
          initialShopLat={trackingModalOrder.shopLatitude ?? undefined}
          initialShopLng={trackingModalOrder.shopLongitude ?? undefined}
          initialDestLat={trackingModalOrder.shippingLatitude ?? undefined}
          initialDestLng={trackingModalOrder.shippingLongitude ?? undefined}
          onClose={() => setTrackingModalOrder(null)}
        />
      )}
    </div>
  )
}
