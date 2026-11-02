import React, { useState, useEffect } from 'react'
import { FileText, Loader2, X } from 'lucide-react'
import * as orderService from '@/services/order.service'
import type { OrderResponse } from '@/types/order.types'
import { formatOrderStatus } from '../review.constants'
import { Button } from '@/components/ui/Button'

interface ReviewOrderDetailModalProps {
  orderId: number | null
  isOpen: boolean
  onClose: () => void
}

export function ReviewOrderDetailModal({
  orderId,
  isOpen,
  onClose,
}: ReviewOrderDetailModalProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null)
      return
    }

    let isMounted = true
    setIsLoading(true)

    orderService
      .getOrderById(orderId)
      .then((data) => {
        if (isMounted) setOrder(data)
      })
      .catch((err) => {
        console.error('Lỗi tải chi tiết đơn hàng:', err)
        if (isMounted) setOrder(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, orderId])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-xl border border-[#e2e8dc]"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f4ed]">
          <div className="flex items-center gap-2">
            <FileText className="text-[#326318]" size={18} />
            <h4 className="text-sm font-bold text-[#1c2216]">
              {order ? `Chi Tiết Đơn Hàng #ORD-${order.orderId ?? order.id}` : 'Chi Tiết Đơn Hàng'}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg bg-[#f4f7f1] hover:bg-[#eaf0e6] flex items-center justify-center text-[#555d4e] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="size-6 text-[#326318] animate-spin" />
            <p className="text-xs text-[#7e8779] font-medium">Đang tải chi tiết đơn hàng...</p>
          </div>
        ) : order ? (
          <div className="space-y-3 text-xs">
            {/* Trạng thái & Hình thức thanh toán */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f9faf7] border border-[#e8ece3]">
              <div>
                <span className="text-[10px] text-[#7e8779] block">Trạng thái:</span>
                <span className="font-bold text-emerald-700">
                  {formatOrderStatus(order.status)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#7e8779] block">Thanh toán:</span>
                <span className="font-bold text-[#1c2216]">
                  {order.paymentMethod === 'PAYOS' ? 'VietQR PayOS' : 'Thu hộ COD'}
                </span>
              </div>
            </div>

            {/* Thông tin người nhận */}
            <div className="p-3 rounded-lg bg-[#fafcf9] border border-[#edf3e8] space-y-1">
              <span className="text-[10px] font-bold text-[#326318] uppercase tracking-wider block mb-1">
                Thông Tin Giao Hàng
              </span>
              <p className="text-[#1c2216]">
                <strong className="text-[#454d40]">Khách hàng:</strong> {order.recipientName}
              </p>
              <p className="text-[#1c2216]">
                <strong className="text-[#454d40]">Số điện thoại:</strong> {order.recipientPhone}
              </p>
              <p className="text-[#1c2216]">
                <strong className="text-[#454d40]">Địa chỉ nhận:</strong> {order.shippingAddress}
              </p>
              {order.note && (
                <p className="text-amber-800">
                  <strong>Ghi chú:</strong> {order.note}
                </p>
              )}
            </div>

            {/* Danh sách sản phẩm trong đơn */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#326318] uppercase tracking-wider block">
                Danh Sách Mặt Hàng Trong Đơn ({order.items?.length || 0})
              </span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {(order.items || []).map((it, idx) => (
                  <div
                    key={it.orderDetailId || idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-100"
                  >
                    <div>
                      <span className="font-bold text-[#1c2216] block">
                        {it.itemName || it.productName || it.mysteryBoxType || 'Nông sản'}
                      </span>
                      <span className="text-[11px] text-[#747e70]">
                        Số lượng: {it.quantity} × {(it.unitPrice || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <strong className="text-[#1c2216]">
                      {(it.subtotal || (it.unitPrice || 0) * it.quantity).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng thanh toán */}
            <div className="p-3 rounded-lg bg-[#f0f6ec] border border-[#d6e5ce] flex justify-between items-center text-xs">
              <span className="font-bold text-[#1c2216]">Tổng thanh toán:</span>
              <strong className="text-sm font-black text-[#326318]">
                {(order.totalAmount || 0).toLocaleString('vi-VN')} đ
              </strong>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-rose-500 font-medium">
            Không thể tải thông tin đơn hàng này hoặc đơn đã bị hủy.
          </div>
        )}

        {/* Footer Modal */}
        <div className="pt-1 text-right">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
