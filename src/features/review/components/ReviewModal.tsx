import React, { useState, useRef } from 'react'
import { Star, X, UploadCloud, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { globalShowAlert } from '@/components/common/Popup'
import { uploadService } from '@/services/upload.service'
import { reviewService } from '@/services/review.service'
import type { OrderItem } from '@/types/order.types'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: OrderItem | null
  orderId?: number
  onSuccess?: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'Rất thất vọng (1/5 ⭐)',
  2: 'Không hài lòng (2/5 ⭐)',
  3: 'Bình thường (3/5 ⭐)',
  4: 'Hài lòng (4/5 ⭐)',
  5: 'Tuyệt vời (5/5 ⭐)',
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !item) return null

  const displayName = item.itemName || item.productName || item.mysteryBoxType || 'Sản phẩm'
  const activeRating = hoverRating ?? rating

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (imageUrls.length >= 3) {
      globalShowAlert('Bạn chỉ có thể tải lên tối đa 3 ảnh minh chứng.', 'Thông báo', 'warning')
      return
    }

    const file = files[0]
    if (file.size > 5 * 1024 * 1024) {
      globalShowAlert('Kích thước ảnh không được vượt quá 5MB.', 'Lỗi ảnh', 'warning')
      return
    }

    try {
      setIsUploading(true)
      const res = await uploadService.uploadImage(file, 'reviews')
      const uploadedUrl = res.result?.url
      if (uploadedUrl) {
        setImageUrls((prev) => [...prev, uploadedUrl])
      }
    } catch (err: unknown) {
      console.error('Lỗi khi tải ảnh lên:', err)
      globalShowAlert('Tải ảnh thất bại, vui lòng thử lại.', 'Lỗi', 'error')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!item.orderDetailId && !item.mysteryBoxId) {
      globalShowAlert('Không tìm thấy thông tin mặt hàng để đánh giá.', 'Lỗi', 'error')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        orderDetailId: item.orderDetailId,
        mysteryBoxId: item.mysteryBoxId,
        ratingStar: rating,
        comment: comment.trim(),
        evidence: imageUrls.length > 0 ? imageUrls[0] : undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      }

      const res = await reviewService.createReview(payload)

      if (res.result) {
        globalShowAlert('Cảm ơn bạn đã gửi đánh giá và đóng góp ý kiến!', 'Thành công', 'success')
        onSuccess?.()
        onClose()
      }
    } catch (err: unknown) {
      console.error('Lỗi khi gửi đánh giá:', err)
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.'
      globalShowAlert(errorMsg, 'Lỗi gửi đánh giá', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-line overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-black text-ink">Đánh Giá Sản Phẩm</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Ý kiến của bạn giúp nhà vườn nâng cao chất lượng nông sản
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Thông tin món hàng */}
          <div className="flex items-center gap-4 p-3.5 bg-neutral-50 rounded-2xl border border-line">
            <img
              src={item.imageUrl || '/images/default-produce.png'}
              alt={displayName}
              className="size-14 rounded-xl object-cover border border-line shrink-0 bg-white"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-ink truncate">{displayName}</h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Số lượng: <span className="font-semibold text-ink">{item.quantity}</span>
                {item.unitPrice && (
                  <>
                    {' · '}
                    <span className="font-semibold text-leaf-700 whitespace-nowrap">
                      {Number(item.unitPrice).toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Chọn số sao */}
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Độ hài lòng của bạn
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-neutral-300'
                      }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 mt-1">
              {RATING_LABELS[activeRating] || 'Chọn mức đánh giá'}
            </span>
          </div>

          {/* Ô nhập nhận xét */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="comment" className="font-bold text-ink">
                Nhận xét thực tế <span className="text-rose-500">*</span>
              </label>
              <span className="text-ink-muted">{comment.length}/500</span>
            </div>
            <textarea
              id="comment"
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận về độ tươi ngon, chất lượng đóng gói, hoặc điều bạn hài lòng/chưa hài lòng..."
              className="w-full text-xs sm:text-sm p-3.5 bg-neutral-50/50 rounded-2xl border border-line focus:bg-white focus:border-leaf-700 focus:ring-2 focus:ring-leaf-700/20 outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Tải ảnh minh chứng */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-ink">
              Hình ảnh thực tế <span className="font-normal text-ink-muted">(Tối đa 3 ảnh)</span>
            </label>

            <div className="flex flex-wrap gap-3 items-center">
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative size-20 rounded-2xl overflow-hidden border border-line group shrink-0"
                >
                  <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {imageUrls.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="size-20 rounded-2xl border-2 border-dashed border-line hover:border-leaf-600 bg-neutral-50/50 hover:bg-leaf-50/30 flex flex-col items-center justify-center gap-1 text-ink-muted hover:text-leaf-700 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin text-leaf-700" />
                  ) : (
                    <>
                      <UploadCloud size={20} />
                      <span className="text-[10px] font-bold">Thêm ảnh</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !comment.trim()}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-leaf-700 hover:bg-leaf-800 text-white shadow-md shadow-leaf-700/20"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang gửi...</span>
                </div>
              ) : (
                'Gửi đánh giá'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
