import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Boxes,
  Package,
  Gift,
  MapPin,
  Phone,
  User,
  FileText,
  Truck,
  Check,
} from 'lucide-react'
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

  const checkedCount = Object.values(checklist).filter(Boolean).length
  const allChecked = checkedCount === 4
  const progressPercent = (checkedCount / 4) * 100

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
      <div className="bg-white rounded-2xl p-8 border border-[#e8ece3] shadow-xs space-y-4 max-w-xl mx-auto mt-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={22} />
          <h4 className="text-sm font-bold">{error || 'Không tìm thấy thông tin đơn hàng.'}</h4>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-[#d2dbcd] text-xs font-bold text-[#2b5619] hover:bg-[#f4f7f1] cursor-pointer transition-colors"
        >
          ← Quay lại danh sách đơn hàng
        </button>
      </div>
    )
  }

  const resolvedId = order.orderId ?? order.id ?? orderId
  const totalOrderAmount =
    order.totalAmount ||
    (order.items || []).reduce(
      (sum, item) => sum + (item.subtotal || (item.unitPrice || 0) * item.quantity),
      0,
    )

  return (
    <div className="w-full space-y-5 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-5 border border-[#e8ece3] shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-[#f4f7f1] hover:bg-[#e8efe2] text-[#2b5619] flex items-center justify-center transition-colors cursor-pointer border border-[#dce5d6]"
            title="Quay lại danh sách đơn"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-[#1c2216] tracking-tight">
                Chuẩn Bị &amp; Đóng Gói Đơn Hàng
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#326318]/10 text-[#326318] text-xs font-black border border-[#326318]/20">
                #ORD-{resolvedId}
              </span>
            </div>
            <p className="text-xs text-[#555d4e] mt-0.5 font-medium">
              Kiểm tra kỹ chất lượng nông sản trước khi niêm phong thùng bàn giao cho Shipper CapNong.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Truck size={14} />
            <span>Chờ đóng thùng bàn giao</span>
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Order Details & Produce Items */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Thông Tin Người Nhận & Địa Chỉ */}
          <div className="bg-white rounded-2xl p-6 border border-[#e8ece3] shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#2b5619] pb-2 border-b border-[#f1f4ed]">
              <MapPin size={15} />
              <span>Thông Tin Nhận Hàng &amp; Địa Chỉ Giao</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#f8faf6] border border-[#eaf0e4] space-y-1">
                <div className="text-[11px] font-bold text-[#6a7465] flex items-center gap-1">
                  <User size={13} />
                  <span>Khách hàng nhận</span>
                </div>
                <p className="font-extrabold text-[#1c2216] text-sm">
                  {order.recipientName}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#f8faf6] border border-[#eaf0e4] space-y-1">
                <div className="text-[11px] font-bold text-[#6a7465] flex items-center gap-1">
                  <Phone size={13} />
                  <span>Số điện thoại</span>
                </div>
                <p className="font-extrabold text-[#1c2216] text-sm">
                  {order.recipientPhone}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f8faf6] border border-[#eaf0e4] text-xs space-y-1">
              <div className="text-[11px] font-bold text-[#6a7465] flex items-center gap-1">
                <MapPin size={13} />
                <span>Địa chỉ chi tiết</span>
              </div>
              <p className="font-medium text-[#1c2216] leading-relaxed">
                {order.shippingAddress}
              </p>
            </div>

            {order.note && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="text-[11px] font-extrabold flex items-center gap-1 text-amber-800">
                  <FileText size={13} />
                  <span>Ghi chú của người mua:</span>
                </div>
                <p className="font-medium italic">&quot;{order.note}&quot;</p>
              </div>
            )}
          </div>

          {/* 2. Danh Sách Nông Sản Cần Đóng Thùng */}
          <div className="bg-white rounded-2xl p-6 border border-[#e8ece3] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f4ed]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#2b5619]">
                <Package size={15} />
                <span>Nông Sản Cần Đóng Thùng ({(order.items || []).length})</span>
              </div>
              <span className="text-xs text-[#555d4e] font-semibold">
                Kiểm tra đúng số lượng &amp; quy cách
              </span>
            </div>

            <div className="divide-y divide-[#f1f4ed]">
              {(order.items || []).map((item, idx) => {
                const name = item.itemName || item.productName || item.mysteryBoxType || 'Nông sản'
                const isMystery = item.itemType === 'MYSTERY_BOX' || item.mysteryBoxType != null
                const itemTotal = item.subtotal || (item.unitPrice || 0) * item.quantity

                return (
                  <div
                    key={item.orderDetailId || idx}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#e0e7d9]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#f4f7f1] border border-[#e0e7d9] flex items-center justify-center text-[#2b5619] shrink-0">
                          {isMystery ? <Gift size={20} /> : <Package size={20} />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs sm:text-sm text-[#1c2216] block truncate">
                          {name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#555d4e]">
                          <span>
                            Định lượng:{' '}
                            <strong className="text-[#2b5619] font-bold">
                              {item.quantity}
                            </strong>{' '}
                            (kg/phần)
                          </span>
                          {item.unitPrice ? (
                            <span className="text-[#848d7e]">
                              · {Number(item.unitPrice).toLocaleString('vi-VN')} đ/đơn vị
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-xs sm:text-sm text-[#2b5619] block">
                        {Number(itemTotal).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10.5px] text-[#6b7665] font-semibold bg-[#f4f7f1] px-2 py-0.5 rounded-md mt-1 inline-block">
                        Số lượng: x{item.quantity}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Sticky Packing Checklist & Action Panel */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl p-6 border border-[#e8ece3] shadow-xs space-y-4">
            {/* Header Checklist */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
              <div>
                <h4 className="text-sm font-black text-[#1c2216] uppercase tracking-tight">
                  Quy Chuẩn Đóng Thùng
                </h4>
                <p className="text-[11px] text-[#555d4e] mt-0.5">
                  Cam kết chất lượng chuẩn CapNong
                </p>
              </div>
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-full border transition-all ${
                  allChecked
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                {checkedCount}/4 Tiêu chuẩn
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-[#f0f4ec] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2b5619] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10.5px] text-right text-[#555d4e] font-semibold">
                {allChecked ? '✓ Đã sẵn sàng niêm phong' : `Cần hoàn tất thêm ${4 - checkedCount} bước`}
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2 pt-1 text-xs">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  checklist.freshCheck
                    ? 'bg-[#f8faf6] border-[#cbe1be] text-[#1c2216]'
                    : 'bg-white border-[#e8ece3] text-[#555d4e] hover:bg-[#fafcf9]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist.freshCheck}
                  onChange={(e) => setChecklist({ ...checklist, freshCheck: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.freshCheck
                      ? 'bg-[#2b5619] text-white shadow-xs'
                      : 'border-2 border-gray-300 bg-white hover:border-[#2b5619]'
                  }`}
                >
                  {checklist.freshCheck && <Check size={13} strokeWidth={3} />}
                </div>
                <span className="font-semibold leading-relaxed">
                  Kiểm tra nông sản đạt độ tươi, rũ sạch đất cát, loại bỏ lá úa dập nát.
                </span>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  checklist.weightCheck
                    ? 'bg-[#f8faf6] border-[#cbe1be] text-[#1c2216]'
                    : 'bg-white border-[#e8ece3] text-[#555d4e] hover:bg-[#fafcf9]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist.weightCheck}
                  onChange={(e) => setChecklist({ ...checklist, weightCheck: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.weightCheck
                      ? 'bg-[#2b5619] text-white shadow-xs'
                      : 'border-2 border-gray-300 bg-white hover:border-[#2b5619]'
                  }`}
                >
                  {checklist.weightCheck && <Check size={13} strokeWidth={3} />}
                </div>
                <span className="font-semibold leading-relaxed">
                  Cân đúng hoặc dư trọng lượng cam kết (bù hao hụt thoát nước khi giao).
                </span>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  checklist.paddingCheck
                    ? 'bg-[#f8faf6] border-[#cbe1be] text-[#1c2216]'
                    : 'bg-white border-[#e8ece3] text-[#555d4e] hover:bg-[#fafcf9]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist.paddingCheck}
                  onChange={(e) => setChecklist({ ...checklist, paddingCheck: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.paddingCheck
                      ? 'bg-[#2b5619] text-white shadow-xs'
                      : 'border-2 border-gray-300 bg-white hover:border-[#2b5619]'
                  }`}
                >
                  {checklist.paddingCheck && <Check size={13} strokeWidth={3} />}
                </div>
                <span className="font-semibold leading-relaxed">
                  Đóng thùng carton / khay xốp có lót giấy thoáng khí hoặc màng chống dập.
                </span>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  checklist.labelCheck
                    ? 'bg-[#f8faf6] border-[#cbe1be] text-[#1c2216]'
                    : 'bg-white border-[#e8ece3] text-[#555d4e] hover:bg-[#fafcf9]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist.labelCheck}
                  onChange={(e) => setChecklist({ ...checklist, labelCheck: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checklist.labelCheck
                      ? 'bg-[#2b5619] text-white shadow-xs'
                      : 'border-2 border-gray-300 bg-white hover:border-[#2b5619]'
                  }`}
                >
                  {checklist.labelCheck && <Check size={13} strokeWidth={3} />}
                </div>
                <span className="font-semibold leading-relaxed">
                  Ghi hoặc dán mã đơn hàng <strong className="text-[#2b5619]">#ORD-{resolvedId}</strong> lên mặt thùng.
                </span>
              </label>
            </div>

            {/* Total Order Summary */}
            <div className="pt-3 border-t border-[#f1f4ed] flex items-center justify-between text-xs">
              <span className="font-bold text-[#555d4e]">Tổng giá trị đơn hàng:</span>
              <span className="text-base font-black text-[#2b5619]">
                {Number(totalOrderAmount).toLocaleString('vi-VN')} đ
              </span>
            </div>

            {/* Primary Action Button (Brand Earthy Green #2b5619) */}
            <button
              type="button"
              disabled={!allChecked || readyMutation.isPending}
              onClick={handleMarkAsReady}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2b5619] hover:bg-[#1e3d12] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2b5619] disabled:active:scale-100"
            >
              {readyMutation.isPending ? (
                <Loader2 size={16} className="animate-spin text-[#ffea79]" />
              ) : (
                <Boxes size={16} className="text-[#ffea79]" />
              )}
              <span>Xác Nhận Đóng Thùng Xong ➔ Sẵn Sàng Giao</span>
            </button>

            {!allChecked && (
              <p className="text-center text-[11px] text-amber-700 font-medium">
                * Vui lòng kiểm tra và tích chọn đủ 4 tiêu chí ở trên để mở khóa nút xác nhận.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
