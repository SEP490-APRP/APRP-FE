import React from 'react'
import { Star, Clock, Maximize2, MessageSquare, Loader2, Send } from 'lucide-react'
import type { ReviewResponse } from '@/services/review.types'
import { QUICK_REPLY_TEMPLATES } from '../review.constants'
import { Button } from '@/components/ui/Button'

interface ReviewCardProps {
  review: ReviewResponse
  isFirstCard?: boolean
  isReplying: boolean
  replyText: string
  isSubmittingReply: boolean
  onOpenReply: (rev: ReviewResponse) => void
  onCancelReply: () => void
  onReplyTextChange: (text: string) => void
  onApplyTemplate: (text: string) => void
  onSendReply: (reviewId: number) => void
  onViewOrder: (orderId: number) => void
  onViewImage: (imgUrl: string) => void
  onNavigateToProductInventory?: (productName: string) => void
}

export function ReviewCard({
  review: rev,
  isFirstCard,
  isReplying,
  replyText,
  isSubmittingReply,
  onOpenReply,
  onCancelReply,
  onReplyTextChange,
  onApplyTemplate,
  onSendReply,
  onViewOrder,
  onViewImage,
  onNavigateToProductInventory,
}: ReviewCardProps) {
  const reviewId = rev.id || rev.reviewId || 0
  const starCount = Math.round(Number(rev.ratingStar) || 5)
  const dateStr = rev.createAt || rev.createdAt
    ? new Date(rev.createAt || rev.createdAt!).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Gần đây'

  // Tiêu đề sản phẩm
  const itemTitle =
    rev.productName ||
    (rev.boxType ? `Túi mù: ${rev.boxType}` : '') ||
    (rev.comboName ? `Combo: ${rev.comboName}` : '') ||
    'Nông sản giải cứu'

  return (
    <div
      id={isFirstCard ? 'tour-reviews-first-card' : undefined}
      className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#e5ebd9] shadow-2xs hover:border-[#326318]/30 transition-all space-y-2.5"
    >
      {/* Header Card: Tên khách + Mã đơn + NÚT SẢN PHẨM TRONG KHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#f4f7f0] gap-2">
        <div className="flex items-center gap-2.5">
          {/* Avatar nhỏ gọn */}
          <div className="size-8 rounded-full bg-[#326318] text-white font-black text-xs flex items-center justify-center shrink-0">
            {(rev.fullName || rev.buyerName || 'K').charAt(0).toUpperCase()}
          </div>

          <div>
            <strong className="text-xs font-bold text-[#1c2216]">
              {rev.fullName || rev.buyerName || `Khách hàng #${rev.buyerId}`}
            </strong>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-[#7e8779]">
              {rev.orderId && (
                <button
                  type="button"
                  onClick={() => onViewOrder(rev.orderId!)}
                  title="Bấm để xem chi tiết đơn hàng này"
                  className="font-bold text-[#326318] hover:text-[#1a3a09] bg-[#326318]/10 hover:bg-[#326318]/20 px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <span>#ORD-{rev.orderId}</span>
                  <span className="text-[9px] underline font-normal opacity-85">Chi tiết</span>
                </button>
              )}
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {dateStr}
              </span>
            </div>
          </div>
        </div>

        {/* NÚT TRUY CẬP VÀO KHO NÔNG SẢN CỦA SHOP (Nhỏ gọn, thuần text) */}
        <div>
          <button
            type="button"
            onClick={() => {
              const targetSearchName = (rev.productName || rev.boxType || rev.comboName || '').trim()
              if (targetSearchName) {
                onNavigateToProductInventory?.(targetSearchName)
              }
            }}
            title="Bấm để xem và quản lý mặt hàng này trong Kho Nông Sản của bạn"
            className="inline-flex items-center text-[11px] font-bold text-[#326318] hover:text-[#1a3a09] bg-[#f0f6ec] hover:bg-[#e2ebd9] px-2.5 py-1 rounded-lg border border-[#326318]/25 transition-all cursor-pointer max-w-xs truncate shadow-2xs"
          >
            <span className="truncate">{itemTitle}</span>
          </button>
        </div>
      </div>

      {/* Rating Stars */}
      <div className="flex items-center gap-0.5 text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={13}
            className={
              i < starCount
                ? 'fill-amber-400 text-amber-400'
                : 'text-neutral-200 fill-neutral-100'
            }
          />
        ))}
      </div>

      {/* Nội dung Nhận xét */}
      <p className="text-xs text-[#2e3728] leading-relaxed font-normal">
        "{rev.comment}"
      </p>

      {/* Ảnh chụp từ khách hàng */}
      {(rev.imageUrls?.length || rev.evidence) && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {rev.imageUrls && rev.imageUrls.length > 0 ? (
            rev.imageUrls.map((img, i) => (
              <div
                key={i}
                onClick={() => onViewImage(img)}
                className="size-14 rounded-lg overflow-hidden border border-[#e2e8dc] hover:border-[#326318] transition-all cursor-pointer relative group shrink-0"
              >
                <img
                  src={img}
                  alt="Ảnh đánh giá"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Maximize2 size={12} />
                </div>
              </div>
            ))
          ) : rev.evidence ? (
            <div
              onClick={() => onViewImage(rev.evidence!)}
              className="size-14 rounded-lg overflow-hidden border border-[#e2e8dc] hover:border-[#326318] transition-all cursor-pointer relative group shrink-0"
            >
              <img
                src={rev.evidence}
                alt="Ảnh đánh giá"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Maximize2 size={12} />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Phản hồi từ Nhà Vườn */}
      {rev.replyFromShop && !isReplying && (
        <div className="bg-[#f7f9f5] p-2.5 rounded-lg border border-[#e3ebd9] mt-1.5">
          <div className="flex items-center justify-between pb-0.5">
            <span className="text-[11px] font-bold text-[#326318]">
              Phản hồi từ Nhà Vườn:
            </span>
            <button
              type="button"
              onClick={() => onOpenReply(rev)}
              className="text-[11px] font-bold text-[#7e8779] hover:text-[#326318] underline cursor-pointer"
            >
              Chỉnh sửa
            </button>
          </div>
          <p className="text-xs text-[#444f3e] leading-relaxed">
            {rev.replyFromShop}
          </p>
        </div>
      )}

      {/* Khung Soạn Thảo Phản Hồi */}
      {isReplying ? (
        <div className="pt-1.5 space-y-2 bg-[#f8faf6] p-3 rounded-lg border border-[#326318]/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1c2216]">
              Soạn phản hồi gửi khách hàng:
            </span>
          </div>

          {/* Mẫu phản hồi nhanh 1 chạm */}
          <div className="flex flex-wrap gap-1">
            {QUICK_REPLY_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onApplyTemplate(tpl.text)}
                className="px-2 py-0.5 text-[10px] font-bold bg-white text-[#326318] hover:bg-[#326318] hover:text-white border border-[#326318]/25 rounded-md transition-all cursor-pointer shadow-2xs"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            placeholder="Nhập phản hồi gửi tới khách hàng..."
            className="w-full p-2.5 text-xs bg-white border border-[#d7e2cf] rounded-lg focus:outline-none focus:border-[#326318] transition-all resize-none text-[#1c2216]"
          />

          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancelReply}
              className="px-3 py-1 text-xs rounded-md font-bold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => onSendReply(reviewId)}
              disabled={isSubmittingReply || !replyText.trim()}
              className="px-3.5 py-1 text-xs rounded-md bg-[#326318] hover:bg-[#254d12] text-white font-bold gap-1 shadow-xs"
            >
              {isSubmittingReply ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              <span>{rev.replyFromShop ? 'Cập nhật' : 'Gửi phản hồi'}</span>
            </Button>
          </div>
        </div>
      ) : !rev.replyFromShop ? (
        <div className="flex items-center justify-end pt-0.5">
          <button
            type="button"
            onClick={() => onOpenReply(rev)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#326318] hover:bg-[#254d12] px-3 py-1 rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <MessageSquare size={11} />
            <span>Phản hồi khách hàng</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
