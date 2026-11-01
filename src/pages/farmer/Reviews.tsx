import React, { useState } from 'react'
import { RotateCcw, Loader2, Star } from 'lucide-react'
import {
  useMyShopReviews,
  useShopReport,
  useReplyReview,
  ReviewStatsHero,
  ReviewFilterToolbar,
  ReviewCard,
  ReviewOrderDetailModal,
  ReviewImageLightbox,
  type FilterType,
  type SortType,
} from '@/features/review'
import { globalShowAlert } from '@/components/common/Popup'
import { Button } from '@/components/ui/Button'
import type { ReviewResponse } from '@/services/review.types'
import type { FarmerReview } from './types'

interface ReviewsProps {
  reviews?: FarmerReview[]
  onNavigateToProductInventory?: (productName: string) => void
}

const PAGE_SIZE = 10

export default function Reviews({
  reviews: _initialMockReviews,
  onNavigateToProductInventory,
}: ReviewsProps) {
  const [page, setPage] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL')
  const [sortBy, setSortBy] = useState<SortType>('NEWEST')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')

  // Modals state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [viewingOrderId, setViewingOrderId] = useState<number | null>(null)

  // API Queries & Mutations
  const { data: pagedData, isLoading, refetch } = useMyShopReviews(page, PAGE_SIZE)
  const { data: reportData } = useShopReport()
  const replyMutation = useReplyReview()

  const realReviews: ReviewResponse[] = pagedData?.content || []

  // Thống kê tổng quan
  const avgRating = reportData?.averageRating ?? 5.0
  const totalReviews = reportData?.totalReviewers ?? realReviews.length
  const fiveStars = reportData?.fiveStarNumber ?? 0
  const fourStars = reportData?.fourStarNumber ?? 0
  const threeStars = reportData?.threeStarNumber ?? 0
  const twoStars = reportData?.twoStarNumber ?? 0
  const oneStars = reportData?.oneStarNumber ?? 0
  const positivePercent =
    totalReviews > 0 ? Math.round(((fiveStars + fourStars) / totalReviews) * 100) : 100
  const unrepliedCount = realReviews.filter((r) => !r.replyFromShop).length

  // Xử lý bộ lọc và sắp xếp
  const filteredReviews = realReviews
    .filter((rev) => {
      if (selectedFilter === 'UNREPLIED') {
        if (rev.replyFromShop) return false
      } else if (selectedFilter === 'HAS_IMAGE') {
        const hasImg = (rev.imageUrls && rev.imageUrls.length > 0) || Boolean(rev.evidence)
        if (!hasImg) return false
      } else if (selectedFilter === 'NEEDS_CARE') {
        if (Number(rev.ratingStar) > 2) return false
      } else if (typeof selectedFilter === 'number') {
        if (Math.round(Number(rev.ratingStar)) !== selectedFilter) return false
      }

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase()
        const userName = (rev.fullName || rev.buyerName || '').toLowerCase()
        const prodName = (rev.productName || rev.boxType || rev.comboName || '').toLowerCase()
        const comment = (rev.comment || '').toLowerCase()
        const orderIdStr = rev.orderId ? `ord-${rev.orderId}` : ''
        return (
          userName.includes(q) ||
          prodName.includes(q) ||
          comment.includes(q) ||
          orderIdStr.includes(q)
        )
      }

      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.createAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.createAt || b.createdAt || 0).getTime()
      const starA = Number(a.ratingStar) || 0
      const starB = Number(b.ratingStar) || 0

      switch (sortBy) {
        case 'OLDEST':
          return dateA - dateB
        case 'RATING_DESC':
          return starB - starA
        case 'RATING_ASC':
          return starA - starB
        case 'NEWEST':
        default:
          return dateB - dateA
      }
    })

  // Thao tác gửi phản hồi của nhà vườn
  const handleOpenReply = (rev: ReviewResponse) => {
    setReplyingReviewId(rev.id ?? rev.reviewId ?? null)
    setReplyText(rev.replyFromShop || '')
  }

  const handleCancelReply = () => {
    setReplyingReviewId(null)
    setReplyText('')
  }

  const handleSendReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      globalShowAlert('Vui lòng nhập nội dung phản hồi.', 'Nhắc nhở', 'warning')
      return
    }

    try {
      await replyMutation.mutateAsync({
        reviewId,
        request: { replyFromShop: replyText.trim() },
      })
      globalShowAlert('Đã gửi phản hồi thành công!', 'Thành công', 'success')
      setReplyingReviewId(null)
      setReplyText('')
      refetch()
    } catch (err: unknown) {
      console.error('Lỗi phản hồi:', err)
      globalShowAlert('Gửi phản hồi thất bại, vui lòng thử lại sau.', 'Lỗi', 'error')
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Header Trang Tinh Giản */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#e8ece3] gap-2">
        <div>
          <h2 className="text-xl font-black text-[#1c2216] tracking-tight">
            Đánh Giá &amp; Phản Hồi Từ Khách Hàng
          </h2>
          <p className="text-[11px] text-[#6e7768] mt-0.5">
            Lắng nghe và phản hồi đánh giá thực tế từ khách mua nông sản.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => refetch()}
          className="self-start sm:self-auto px-2.5 py-1 text-xs font-bold text-[#326318] bg-[#326318]/5 hover:bg-[#326318]/10 border border-[#326318]/20 rounded-lg gap-1.5 transition-all shadow-2xs"
        >
          <RotateCcw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* 2. Hero Section Thống Kê (Mang ID #tour-reviews-stats) */}
      <ReviewStatsHero
        avgRating={avgRating}
        totalReviews={totalReviews}
        fiveStars={fiveStars}
        fourStars={fourStars}
        threeStars={threeStars}
        twoStars={twoStars}
        oneStars={oneStars}
        positivePercent={positivePercent}
        unrepliedCount={unrepliedCount}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {/* 3. Toolbar Tìm Kiếm & Bộ Lọc */}
      <ReviewFilterToolbar
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        totalReviews={totalReviews}
        unrepliedCount={unrepliedCount}
      />

      {/* 4. Danh Sách Thẻ Đánh Giá */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-[#e8ece3] gap-2">
          <Loader2 className="size-6 text-[#326318] animate-spin" />
          <p className="text-[11px] text-[#7e8779] font-bold uppercase tracking-wider">
            Đang tải dữ liệu đánh giá...
          </p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-3">
          {filteredReviews.map((rev, idx) => (
            <ReviewCard
              key={rev.id || rev.reviewId || idx}
              review={rev}
              isFirstCard={idx === 0}
              isReplying={replyingReviewId === (rev.id || rev.reviewId)}
              replyText={replyText}
              isSubmittingReply={replyMutation.isPending}
              onOpenReply={handleOpenReply}
              onCancelReply={handleCancelReply}
              onReplyTextChange={setReplyText}
              onApplyTemplate={setReplyText}
              onSendReply={handleSendReply}
              onViewOrder={setViewingOrderId}
              onViewImage={setLightboxImage}
              onNavigateToProductInventory={onNavigateToProductInventory}
            />
          ))}

          {/* Phân trang */}
          {pagedData && pagedData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-[#e8ece3] text-xs">
              <span className="text-[#6e7768] text-[11px]">
                Trang <strong className="font-bold text-[#1c2216]">{pagedData.page + 1}</strong> /{' '}
                {pagedData.totalPages} (Tổng {pagedData.totalElements} đánh giá)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  disabled={pagedData.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-2.5 py-1 text-xs rounded-md font-bold"
                >
                  Trước
                </Button>
                <Button
                  variant="secondary"
                  disabled={pagedData.last}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 text-xs rounded-md font-bold"
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-[#d8e0ce] space-y-2">
          <div className="size-10 rounded-xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center font-bold">
            <Star className="size-5 fill-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#1c2216] uppercase tracking-wider">
              Chưa có đánh giá nào phù hợp với bộ lọc
            </h4>
            <p className="text-[11px] text-[#7e8779] mt-0.5">
              Khi khách hàng nhận nông sản và để lại đánh giá, phản hồi sẽ xuất hiện tại đây.
            </p>
          </div>
          {selectedFilter !== 'ALL' && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelectedFilter('ALL')
                setSearchKeyword('')
              }}
              className="px-3 py-1 text-xs font-bold text-[#326318] rounded-md border border-[#326318]/30"
            >
              Xem tất cả
            </Button>
          )}
        </div>
      )}

      {/* 5. Modal Lightbox Phóng To Ảnh */}
      <ReviewImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* 6. Modal Chi Tiết Đơn Hàng */}
      <ReviewOrderDetailModal
        orderId={viewingOrderId}
        isOpen={Boolean(viewingOrderId)}
        onClose={() => setViewingOrderId(null)}
      />
    </div>
  )
}
