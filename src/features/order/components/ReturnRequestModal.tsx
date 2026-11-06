import React, { useState, useEffect } from 'react'
import {
  RotateCcw,
  X,
  UploadCloud,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Film,
} from 'lucide-react'
import type { OrderItem } from '@/types/order.types'
import { uploadService } from '@/services/upload.service'
import { useCreateReturnRequest } from '@/features/order/hooks/useOrderQueries'
import { globalShowAlert } from '@/components/common/Popup'

interface ReturnRequestModalProps {
  isOpen: boolean
  orderId: number
  item: OrderItem | null
  onClose: () => void
  onSuccess?: () => void
}

const RETURN_REASONS = [
  'Nông sản bị thối / dập nát / hư hỏng trong quá trình vận chuyển',
  'Giao sai chủng loại hoặc không đúng với mô tả trên gian hàng',
  'Giao thiếu số lượng / trọng lượng so với đơn đặt',
  'Hàng đã quá ngày sử dụng hoặc biến chất khi nhận',
  'Lý do khác',
]

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  isOpen,
  orderId,
  item,
  onClose,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(RETURN_REASONS[0])
  const [customReason, setCustomReason] = useState<string>('')
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createReturnMutation = useCreateReturnRequest()

  const orderDetailId = item?.orderDetailId ?? item?.id
  const itemUnitPrice = Number(item?.unitPrice || 0)
  const itemQty = Number(item?.quantity || 1)
  const maxRefundAmount = itemUnitPrice * itemQty

  // Reset khi mở modal
  useEffect(() => {
    if (isOpen && item) {
      setSelectedReason(RETURN_REASONS[0])
      setCustomReason('')
      setRefundAmount(maxRefundAmount)
      setEvidenceUrls([])
      setErrorMessage(null)
    }
  }, [isOpen, item, maxRefundAmount])

  // Thoát bằng Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !createReturnMutation.isPending && !isUploading) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, createReturnMutation.isPending, isUploading, onClose])

  if (!isOpen || !item) {
    return null
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setErrorMessage(null)

    try {
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Đang tải lên tệp ${i + 1}/${files.length}...`)
        const res = await uploadService.uploadMedia(file, 'returns')
        if (res.result?.url) {
          newUrls.push(res.result.url)
        }
      }
      setEvidenceUrls((prev) => [...prev, ...newUrls])
    } catch (err: any) {
      console.error('Upload evidence failed:', err)
      setErrorMessage('Không thể tải tệp lên máy chủ. Vui lòng thử lại với ảnh dung lượng nhỏ hơn!')
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      e.target.value = ''
    }
  }

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!orderDetailId) {
      setErrorMessage('Không tìm thấy thông tin dòng sản phẩm trong đơn hàng!')
      return
    }

    const reasonText =
      selectedReason === 'Lý do khác' && customReason.trim()
        ? `Lý do khác: ${customReason.trim()}`
        : selectedReason

    if (refundAmount <= 0 || refundAmount > maxRefundAmount) {
      setErrorMessage(`Số tiền yêu cầu hoàn phải từ 1.000 đ đến tối đa ${maxRefundAmount.toLocaleString('vi-VN')} đ`)
      return
    }

    try {
      await createReturnMutation.mutateAsync({
        orderDetailId,
        reason: reasonText,
        refundAmount,
        evidenceUrls,
      })

      globalShowAlert(
        'Đã gửi yêu cầu trả hàng / hoàn tiền thành công! Shop sẽ phản hồi trong thời gian sớm nhất.',
        'Thành công',
        'success'
      )
      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('Submit return request failed:', err)
      setErrorMessage(err?.message || 'Gửi yêu cầu hoàn hàng thất bại. Vui lòng kiểm tra lại điều kiện đơn!')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createReturnMutation.isPending && !isUploading) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-stone-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp relative">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          disabled={createReturnMutation.isPending || isUploading}
          aria-label="Đóng"
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-50 z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-stone-100 flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-inner">
            <RotateCcw size={22} />
          </div>
          <div className="pr-6">
            <h3 id="return-modal-title" className="text-base sm:text-lg font-black text-[#1c2216]">
              Yêu cầu Trả hàng / Hoàn tiền
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Đơn hàng #{orderId} • Áp dụng chính sách bảo vệ người mua CapNong
            </p>
          </div>
        </div>

        {/* Nội dung Form */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-left">
          {/* Lỗi */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Chi tiết sản phẩm trả */}
          <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e3ebdc] flex items-center gap-3">
            <img
              src={item.imageUrl || '/images/default-produce.png'}
              alt={item.productName || 'Sản phẩm'}
              className="w-14 h-14 rounded-xl object-cover border border-[#d6e0cc] shrink-0 bg-white"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#1c2216] truncate">
                {item.productName || item.mysteryBoxType || 'Sản phẩm nông sản'}
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Số lượng mua: <strong className="text-stone-700">{itemQty}</strong> • Đơn giá:{' '}
                <strong className="text-stone-700">{itemUnitPrice.toLocaleString('vi-VN')} đ</strong>
              </p>
              <p className="text-xs font-bold text-emerald-700 mt-1">
                Tổng giá trị mặt hàng: {maxRefundAmount.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          {/* Chọn lý do */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#343b2e] flex items-center justify-between">
              <span>Lý do hoàn trả:</span>
              <span className="text-[10px] text-stone-400 font-normal">Bắt buộc</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={createReturnMutation.isPending}
              className="w-full p-2.5 bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            >
              {RETURN_REASONS.map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {selectedReason === 'Lý do khác' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Mô tả cụ thể vấn đề bạn gặp phải với món hàng..."
                rows={2}
                disabled={createReturnMutation.isPending}
                className="w-full p-2.5 mt-1.5 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            )}
          </div>

                    {/* Ghi chú: Shop là bên quyết định có lấy hàng về hay không */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <span className="font-bold text-amber-700 shrink-0">💡 Lưu ý:</span>
            <span>
              Phương án thu hồi hàng (Shipper đến lấy lại hàng hay hoàn tiền ngay không cần trả lại hàng) sẽ do <strong>Shop quyết định</strong> sau khi kiểm tra lý do và bằng chứng của bạn.
            </span>
          </div>

          {/* Số tiền yêu cầu hoàn */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#343b2e] flex items-center justify-between">
              <span>Số tiền yêu cầu hoàn lại:</span>
              <span className="text-[10px] text-stone-400">Tối đa {maxRefundAmount.toLocaleString('vi-VN')} đ</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1000}
                max={maxRefundAmount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                disabled={createReturnMutation.isPending}
                className="w-full p-2.5 pr-12 bg-white border border-stone-200 rounded-xl text-xs font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Tải ảnh / video bằng chứng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#343b2e]">Bằng chứng hình ảnh / video:</span>
              <span className="text-[10px] text-stone-400">
                {evidenceUrls.length > 0 ? `Đã chọn ${evidenceUrls.length} tệp` : 'Khuyến khích cung cấp'}
              </span>
            </div>

            {/* Danh sách ảnh đã tải lên */}
            {evidenceUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {evidenceUrls.map((url, idx) => {
                  const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('video')
                  return (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square bg-black/5">
                      {isVideo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-white p-1">
                          <Film size={20} className="text-amber-400" />
                          <span className="text-[9px] mt-1 font-mono">Video</span>
                        </div>
                      ) : (
                        <img src={url} alt="Bằng chứng" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        disabled={createReturnMutation.isPending}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Khu vực bấm tải lên */}
            <label className="border-2 border-dashed border-stone-200 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-stone-50/60 hover:bg-stone-50 transition-all">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={isUploading || createReturnMutation.isPending}
                className="hidden"
              />
              {isUploading ? (
                <>
                  <Loader2 size={20} className="text-amber-600 animate-spin" />
                  <span className="text-xs font-bold text-amber-700">{uploadProgress}</span>
                </>
              ) : (
                <>
                  <UploadCloud size={22} className="text-stone-400" />
                  <span className="text-xs font-bold text-stone-700">Tải ảnh hoặc video bằng chứng</span>
                  <span className="text-[10px] text-stone-400">Hỗ trợ JPG, PNG, MP4 (Tối đa 50MB)</span>
                </>
              )}
            </label>
          </div>

          {/* Lưu ý chính sách bảo đảm */}
          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-emerald-950">
              Yêu cầu của bạn sẽ được gửi trực tiếp đến người bán. Nếu người bán từ chối hoặc có tranh chấp, Quản trị viên CapNong sẽ trực tiếp can thiệp phân xử bảo vệ quyền lợi người mua.
            </p>
          </div>
        </div>

        {/* Nút hành động chân Modal */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-[#fafcf9] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={createReturnMutation.isPending || isUploading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-white hover:border-stone-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createReturnMutation.isPending || isUploading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {createReturnMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang gửi yêu cầu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Gửi yêu cầu hoàn tiền</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
