import React, { useState, useEffect } from 'react'
import {
  Star,
  Search,
  ShieldCheck,
  Eye,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Filter,
} from 'lucide-react'
import { reviewService } from '@/services/review.service'
import type { ReviewResponse } from '@/services/review.types'
import { Button } from '@/components/ui/Button'

export default function ReviewMonitoring() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedStar, setSelectedStar] = useState<number | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const res = await reviewService.getAllReviewsAdmin(page, 15)
      if (res.result) {
        setReviews(res.result.content || [])
        setTotalPages(res.result.totalPages || 1)
        setTotalElements(res.result.totalElements || 0)
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err)
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [page])

  // Lọc theo số sao và từ khóa
  const filteredList = reviews.filter((rev) => {
    if (typeof selectedStar === 'number') {
      if (Math.round(Number(rev.ratingStar)) !== selectedStar) return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const bName = (rev.fullName || rev.buyerName || '').toLowerCase()
      const sName = (rev.shopName || '').toLowerCase()
      const pName = (rev.productName || rev.boxType || rev.comboName || '').toLowerCase()
      const cmt = (rev.comment || '').toLowerCase()
      return bName.includes(q) || sName.includes(q) || pName.includes(q) || cmt.includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-ink">Giám Sát Đánh Giá &amp; Phản Hồi Toàn Sàn</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Chế độ chỉ xem (Read-only)
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Theo dõi mức độ hài lòng của khách hàng và chất lượng phục vụ của các nhà vườn mà không can thiệp nội dung đánh giá
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm theo khách, shop, sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-line rounded-full text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-leaf-700 transition-all shadow-xs"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-ink-muted mr-2">Mức sao:</span>
        {([
          { key: 'ALL' as const, label: 'Tất cả' },
          { key: 5, label: '5 ⭐' },
          { key: 4, label: '4 ⭐' },
          { key: 3, label: '3 ⭐' },
          { key: 2, label: '2 ⭐' },
          { key: 1, label: '1 ⭐' },
        ] as const).map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            onClick={() => setSelectedStar(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedStar === tab.key
                ? 'bg-ink text-white shadow-xs'
                : 'bg-white text-ink-muted border border-line hover:border-ink/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review List Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="size-8 text-leaf-700 animate-spin" />
          <p className="text-xs text-ink-muted font-bold uppercase tracking-wider">
            Đang tải dữ liệu đánh giá...
          </p>
        </div>
      ) : filteredList.length > 0 ? (
        <div className="space-y-4">
          {filteredList.map((rev) => {
            const starCount = Math.round(Number(rev.ratingStar) || 5)
            const dateStr = rev.createAt || rev.createdAt
              ? new Date(rev.createAt || rev.createdAt!).toLocaleDateString('vi-VN')
              : 'Gần đây'

            return (
              <div
                key={rev.id || rev.reviewId}
                className="bg-white rounded-2xl p-5 border border-line shadow-xs space-y-3"
              >
                {/* Header row: Buyer, Star, Shop, Product */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/60">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-neutral-100 text-ink font-bold text-xs flex items-center justify-center">
                      {(rev.fullName || rev.buyerName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">
                        {rev.fullName || rev.buyerName || `Người dùng #${rev.buyerId}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < starCount ? 'fill-amber-400' : 'text-neutral-200'}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-ink-muted">{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-muted">Shop:</span>
                    <strong className="text-ink font-bold">{rev.shopName || `#${rev.shopId}`}</strong>
                    <span className="text-neutral-300">|</span>
                    <span className="text-ink-muted">Mặt hàng:</span>
                    <span className="font-semibold text-leaf-700">
                      {rev.productName || rev.boxType || rev.comboName || 'Nông sản'}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-ink leading-relaxed">
                  "{rev.comment}"
                </p>

                {/* Evidence photos */}
                {(rev.imageUrls?.length || rev.evidence) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.imageUrls && rev.imageUrls.length > 0 ? (
                      rev.imageUrls.map((img, i) => (
                        <a
                          key={i}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="size-14 rounded-xl overflow-hidden border border-line shrink-0 hover:scale-105 transition-transform"
                        >
                          <img src={img} alt="Ảnh đánh giá" className="w-full h-full object-cover" />
                        </a>
                      ))
                    ) : rev.evidence ? (
                      <a
                        href={rev.evidence}
                        target="_blank"
                        rel="noreferrer"
                        className="size-14 rounded-xl overflow-hidden border border-line shrink-0 hover:scale-105 transition-transform"
                      >
                        <img src={rev.evidence} alt="Ảnh đánh giá" className="w-full h-full object-cover" />
                      </a>
                    ) : null}
                  </div>
                )}

                {/* Phản hồi từ Shop */}
                {rev.replyFromShop && (
                  <div className="bg-neutral-50 p-3 rounded-xl border border-line/80 text-xs text-ink-muted flex items-start gap-2">
                    <MessageSquare size={14} className="text-leaf-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-leaf-700 block">Phản hồi từ Nhà vườn:</span>
                      <p className="mt-0.5 italic">{rev.replyFromShop}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-line text-xs">
              <span className="text-ink-muted">
                Trang {page + 1} / {totalPages} (Tổng {totalElements} đánh giá)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 text-xs rounded-xl"
                >
                  Trước
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs rounded-xl"
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-line">
          <Star className="size-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">
            Chưa có đánh giá nào trên hệ thống
          </p>
        </div>
      )}
    </div>
  )
}
