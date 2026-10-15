/**
 * OrderDetailModal
 *
 * Modal hiển thị chi tiết đơn hàng và các nút hành động.
 *
 * Logic flow:
 *   PENDING / PAID  → hiện checkbox cam kết + nút "Xác nhận đơn"  (→ CONFIRMED)
 *   CONFIRMED       → hiện nút "Đóng gói xong — Gọi shipper"       (→ READY)
 *   Tất cả trạng thái chưa ship → có thể hủy đơn
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { X, Loader2, AlertTriangle, Navigation } from 'lucide-react'
import type { OrderResponse } from '../../../types/order.types'
import { OrderStatusBadge } from './OrderStatusBadge'
import { useConfirmOrder, useReadyOrder, useCancelOrder } from '../hooks/useShopOrders'
import { GoogleMapTrackingModal } from '@/components/map/GoogleMapTrackingModal'

interface OrderDetailModalProps {
  order: OrderResponse
  onClose: () => void
}

const CANCELLABLE_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'READY']

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [weightAgreed, setWeightAgreed] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)

  const confirmMutation = useConfirmOrder()
  const readyMutation   = useReadyOrder()
  const cancelMutation  = useCancelOrder()

  const isProcessing =
    confirmMutation.isPending || readyMutation.isPending || cancelMutation.isPending

  const orderId = order.orderId ?? order.id
  const isPending   = order.status === 'PENDING' || order.status === 'PAID'
  const isConfirmed = order.status === 'CONFIRMED'
  const canCancel   = CANCELLABLE_STATUSES.includes(order.status) && !isProcessing

  const handleConfirm = async () => {
    if (!weightAgreed || orderId == null) return
    await confirmMutation.mutateAsync(orderId)
    onClose()
  }

  const handleReady = async () => {
    if (orderId == null) return
    await readyMutation.mutateAsync(orderId)
    onClose()
  }

  const handleCancel = async () => {
    if (orderId == null) return
    await cancelMutation.mutateAsync(orderId)
    setShowCancelConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-gray-900">#ORD-{orderId}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="size-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[65vh] px-6 py-4 space-y-4">

          {/* Khách hàng */}
          <Section label="Khách hàng">
            <p className="font-bold text-gray-800">{order.recipientName}</p>
            <p className="text-sm text-gray-500">{order.recipientPhone}</p>
            <p className="text-sm text-gray-500">{order.shippingAddress}</p>
            {order.note && (
              <p className="text-sm text-gray-400 italic mt-1">Ghi chú: {order.note}</p>
            )}
          </Section>

          {/* Sản phẩm */}
          <Section label={`Sản phẩm (${(order.items || []).length})`}>
            <div className="space-y-3">
              {(order.items || []).map((item, i) => {
                const name = item.itemName || item.productName || item.mysteryBoxType || 'Sản phẩm'
                const qty  = item.quantityKg ?? item.quantity
                const unit = item.quantityKg != null ? 'kg' : 'cái'
                const price = item.pricePerKg ?? item.unitPrice
                return (
                  <div key={i} className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={name} className="size-12 rounded-xl object-cover bg-gray-100" />
                    ) : (
                      <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-lg">🥬</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-500">
                        {qty} {unit} × {price.toLocaleString('vi-VN')}đ/{unit}
                      </p>
                    </div>
                    <p className="text-sm font-black text-indigo-600 shrink-0">
                      {(qty * price).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* Tổng tiền */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-600">Tổng cộng</span>
            <span className="text-lg font-black text-emerald-700">
              {order.totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>

          {/* Banner PAID */}
          {order.status === 'PAID' && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
              <p className="text-sm font-black text-blue-700">✅ Khách đã thanh toán QR</p>
              <p className="text-xs text-blue-500 mt-0.5">Xác nhận để bắt đầu chuẩn bị hàng</p>
            </div>
          )}

          {/* Checkbox cam kết cân nặng — chỉ hiện khi cần xác nhận */}
          {isPending && (
            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${weightAgreed ? 'border-emerald-400 bg-emerald-50' : 'border-yellow-300 bg-yellow-50'}`}>
              <input
                type="checkbox"
                checked={weightAgreed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightAgreed(e.target.checked)}
                className="mt-0.5 size-4 accent-emerald-500"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                <strong>Tôi đồng ý —</strong> Vì tính chất của trái cây, củ quả sẽ bị hao hụt
                nước, tôi cam kết đảm bảo giao đúng cân khi đến tay khách hàng.
              </span>
            </label>
          )}

        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-2">

          {/* PENDING/PAID → Xác nhận đơn */}
          {isPending && (
            <button
              onClick={handleConfirm}
              disabled={!weightAgreed || isProcessing}
              className="w-full py-3 rounded-2xl font-black text-sm transition-all
                bg-emerald-500 text-white hover:bg-emerald-600
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {confirmMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mx-auto" />
              ) : (
                'Xác nhận — Bắt đầu chuẩn bị hàng'
              )}
            </button>
          )}

          {/* CONFIRMED → Đóng gói xong */}
          {isConfirmed && (
            <button
              onClick={handleReady}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl font-black text-sm
                bg-purple-500 text-white hover:bg-purple-600 transition-all
                disabled:opacity-40"
            >
              {readyMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mx-auto" />
              ) : (
                '📦 Đóng gói xong — Gọi shipper đến lấy'
              )}
            </button>
          )}

          {/* SHIPPING / PICKED_UP / READY → Xem lộ trình Shipper trên Google Maps */}
          {(order.status === 'SHIPPING' || order.status === 'PICKED_UP' || order.status === 'READY') && (
            <button
              onClick={() => setShowTrackingModal(true)}
              className="w-full py-3 rounded-2xl font-black text-sm
                bg-blue-600 text-white hover:bg-blue-700 transition-all
                flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Navigation className="size-4" />
              Xem lộ trình Shipper (Google Maps)
            </button>
          )}

          {/* Hủy đơn */}
          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-2.5 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirm overlay */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <AlertTriangle className="size-10 text-red-500 mx-auto" />
            <h3 className="text-lg font-black text-gray-900">Xác nhận hủy đơn #ORD-{orderId}?</h3>
            <p className="text-sm text-gray-500">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-black hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {cancelMutation.isPending ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Theo Dõi Vị Trí Shipper Trên Google Maps (Shop view) */}
      {showTrackingModal && (
        <GoogleMapTrackingModal
          orderId={orderId ?? 0}
          orderCode={`#ORD-${orderId ?? ''}`}
          role="SHOP"
          initialShopLat={order.shopLatitude ?? undefined}
          initialShopLng={order.shopLongitude ?? undefined}
          initialDestLat={order.shippingLatitude ?? undefined}
          initialDestLng={order.shippingLongitude ?? undefined}
          onClose={() => setShowTrackingModal(false)}
        />
      )}
    </div>
  )
}

/** Helper component nhỏ cho từng section trong modal */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  )
}
