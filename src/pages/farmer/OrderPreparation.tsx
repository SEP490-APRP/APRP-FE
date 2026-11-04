import React, { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Boxes, Package, Gift } from 'lucide-react'
import * as orderService from '@/services/order.service'
import { useReadyOrder } from '@/features/shop/hooks/useShopOrders'
import type { OrderResponse } from '@/types/order.types'
import { CapNongLoading } from '@/components/ui/Loading'

interface OrderPreparationProps {
  orderId?: string
  onBack: () => void
  onInfo?: (msg: string) => void
}

export default function OrderPreparation({ orderId, onBack, onInfo }: OrderPreparationProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Checklist kiểm tra quy cách đóng gói
  const [checklist, setChecklist] = useState({
    freshCheck: true,
    weightCheck: true,
    paddingCheck: true,
    labelCheck: true,
  })

  const readyMutation = useReadyOrder()

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    const loadOrder = async () => {
      try {
        setIsLoading(true)
        const data = await orderService.getOrderById(Number(orderId))
        if (isMounted) setOrder(data)
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết đơn hàng.'
          setError(msg)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadOrder()
    return () => {
      isMounted = false
    }
  }, [orderId])

  const handleMarkAsReady = async () => {
    const id = order?.orderId ?? order?.id ?? Number(orderId)
    if (!id) return

    try {
      await readyMutation.mutateAsync(id)
      onInfo?.(`Đã xác nhận đóng gói hoàn tất cho đơn #ORD-${id}! Đơn đã sẵn sàng giao cho shipper.`)
      onBack()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái đơn hàng.'
      onInfo?.(msg)
    }
  }

  const allChecked = Object.values(checklist).every(Boolean)

  if (isLoading) {
    return (
      <CapNongLoading
        className="!min-h-[300px]"
        message="Đang tải thông tin đóng gói đơn hàng..."
        subMessage="Quy chuẩn đóng gói và bàn giao cho shipper"
        size="md"
      />
    )
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#e8ece3] shadow-sm space-y-4 max-w-2xl">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <h4 className="text-sm font-bold">{error || 'Không tìm thấy thông tin đơn hàng.'}</h4>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 cursor-pointer"
        >
          ← Quay lại danh sách đơn hàng
        </button>
      </div>
    )
  }

  const resolvedId = order.orderId ?? order.id ?? orderId

  return (
    <div className="bg-white rounded-3xl p-8 border border-[#e8ece3] shadow-sm space-y-6 animate-fadeIn max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f4ed]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-[#f4f7f1] text-[#616a5b] cursor-pointer"
            title="Quay lại danh sách đơn"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="text-xl font-black text-[#1c2216]">Chuẩn Bị &amp; Đóng Gói Đơn Hàng</h3>
            <span className="text-xs text-[#326318] font-bold">Mã đơn: #ORD-{resolvedId}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Người nhận & Giao hàng */}
        <div className="p-4 rounded-2xl bg-[#fbfdf9] border border-[#e5edd9] space-y-1">
          <div className="font-extrabold text-[#326318] uppercase text-[10px] tracking-wider">
            Thông Tin Giao Hàng:
          </div>
          <p className="text-[#1c2216]">
            <strong>Khách nhận:</strong> {order.recipientName} ({order.recipientPhone})
          </p>
          <p className="text-[#606a5b]">
            <strong>Địa chỉ:</strong> {order.shippingAddress}
          </p>
          {order.note && (
            <p className="text-amber-800 bg-amber-50 p-2 rounded-xl mt-1">
              <strong>Ghi chú:</strong> {order.note}
            </p>
          )}
        </div>

        {/* Danh Sách Nông Sản Cần Đóng Thùng */}
        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e5edd9] space-y-3">
          <div className="font-extrabold text-[#326318] uppercase text-[10px] tracking-wider">
            Danh Sách Nông Sản Cần Đóng Thùng:
          </div>
          <div className="space-y-2">
            {(order.items || []).map((item, idx) => {
              const name = item.itemName || item.productName || item.mysteryBoxType || 'Sản phẩm'
              const isMystery = item.itemType === 'MYSTERY_BOX' || item.mysteryBoxType != null
              return (
                <div
                  key={item.orderDetailId || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#edf3e8]"
                >
                  <div className="flex items-center gap-2.5">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={name}
                        className="size-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="size-9 rounded-lg bg-[#f0f6ec] flex items-center justify-center text-[#326318]">
                        {isMystery ? <Gift size={16} /> : <Package size={16} />}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-[#1c2216] block">{name}</span>
                      <span className="text-[11px] text-[#717b6d]">
                        Định lượng: <strong className="text-[#326318]">{item.quantity}</strong> (kg/phần)
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-[#326318]">
                    {(item.subtotal || (item.unitPrice || 0) * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Checklist Quy Cách Đóng Gói */}
        <div className="p-4 rounded-2xl bg-[#fdfcf9] border border-[#f0ebd9] space-y-2.5">
          <div className="font-bold text-[#8a4e1d] uppercase text-[10px] tracking-wider">
            Checklist Kiểm Tra Đóng Gói Chuẩn CapNong:
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.freshCheck}
                onChange={(e) => setChecklist({ ...checklist, freshCheck: e.target.checked })}
                className="size-4 accent-[#326318] rounded cursor-pointer"
              />
              <span className="text-[#3c4436]">
                Kiểm tra nông sản đạt độ tươi, rũ sạch đất cát, loại bỏ lá úa dập nát.
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.weightCheck}
                onChange={(e) => setChecklist({ ...checklist, weightCheck: e.target.checked })}
                className="size-4 accent-[#326318] rounded cursor-pointer"
              />
              <span className="text-[#3c4436]">
                Cân đúng hoặc dư trọng lượng theo cam kết (bù hao hụt thoát nước trong quá trình giao).
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.paddingCheck}
                onChange={(e) => setChecklist({ ...checklist, paddingCheck: e.target.checked })}
                className="size-4 accent-[#326318] rounded cursor-pointer"
              />
              <span className="text-[#3c4436]">
                Đóng thùng carton / khay xốp có lót giấy thoáng khí hoặc màng bọc chống dập.
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist.labelCheck}
                onChange={(e) => setChecklist({ ...checklist, labelCheck: e.target.checked })}
                className="size-4 accent-[#326318] rounded cursor-pointer"
              />
              <span className="text-[#3c4436]">
                Ghi hoặc dán mã đơn hàng #ORD-{resolvedId} lên mặt thùng hàng.
              </span>
            </label>
          </div>
        </div>

        {/* Action Button: CONFIRMED -> READY */}
        <button
          type="button"
          disabled={!allChecked || readyMutation.isPending}
          onClick={handleMarkAsReady}
          className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {readyMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Boxes size={16} />
          )}
          <span>Xác Nhận Đóng Thùng Xong ➔ Sẵn Sàng Giao (READY)</span>
        </button>
      </div>
    </div>
  )
}
