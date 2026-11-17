import React, { forwardRef, useState } from 'react'
import {
  Leaf,
  Loader2,
  MessageSquare,
  Package,
  ShieldCheck,
  Star,
  ThumbsDown,
  ThumbsUp,
  Truck,
} from 'lucide-react'
import type { ProductResponse, ReviewResponse } from '@/services'
import Pagination from '@/components/ui/Pagination'

interface ProductDetailTabsProps {
  product: ProductResponse
  farmName: string
  reviews: ReviewResponse[]
  isReviewsLoading: boolean
  reactingReviewId: number | null
  onReact: (reviewId: number, reactionType: 'LIKE' | 'DISLIKE') => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export const ProductDetailTabs = forwardRef<HTMLDivElement, ProductDetailTabsProps>(
  (
    {
      product,
      farmName,
      reviews,
      isReviewsLoading,
      reactingReviewId,
      onReact,
      activeTab: controlledTab,
      onTabChange,
    },
    ref,
  ) => {
    const [internalTab, setInternalTab] = useState('Mô tả chi tiết')
    const activeTab = controlledTab ?? internalTab

    const [reviewPage, setReviewPage] = useState(0)
    const REVIEW_PAGE_SIZE = 5
    const totalReviewPages = Math.ceil(reviews.length / REVIEW_PAGE_SIZE)
    const pagedReviews = reviews.slice(
      reviewPage * REVIEW_PAGE_SIZE,
      (reviewPage + 1) * REVIEW_PAGE_SIZE,
    )

    const handleSelectTab = (tab: string) => {
      if (onTabChange) {
        onTabChange(tab)
      } else {
        setInternalTab(tab)
      }
    }

    const certItems = [
      {
        icon: ShieldCheck,
        title: 'Shop trên nền tảng',
        desc: 'Cửa hàng đã đăng ký và hoạt động trên Nông Sản Xấu Mã.',
      },
      {
        icon: Leaf,
        title: 'Nguồn gốc minh bạch',
        desc: 'Thông tin shop và sản phẩm được hiển thị công khai cho người mua.',
      },
      {
        icon: Truck,
        title: 'Giao hàng tận nơi',
        desc: 'Đơn hàng được xử lý và giao qua hệ thống vận chuyển đối tác.',
      },
      {
        icon: Package,
        title: 'Đóng gói chuẩn',
        desc: 'Nông sản được bảo quản và đóng gói cẩn thận trong quá trình vận chuyển.',
      },
    ]

    return (
      <div
        ref={ref}
        id="product-detail-section"
        className="w-full scroll-mt-24"
      >
        <div className="bg-white rounded-xl border border-line shadow-2xs overflow-hidden">
          {/* Tabs bar */}
          <div className="flex border-b border-line overflow-x-auto">
            {['Mô tả chi tiết', 'Chứng nhận', 'Đánh giá'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleSelectTab(tab)}
                className={`flex-1 min-w-[110px] px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer ${
                  activeTab === tab
                    ? 'border-leaf-700 text-leaf-700 bg-leaf-50/50'
                    : 'border-transparent text-ink-muted hover:text-ink hover:bg-paper-warm'
                }`}
              >
                {tab}
                {tab === 'Đánh giá' && reviews.length > 0 && (
                  <span className="ml-1.5 text-xs font-semibold text-ink-muted">
                    ({reviews.length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="p-5 sm:p-6">
            {activeTab === 'Mô tả chi tiết' && (
              <div className="space-y-6">
                {/* 1. Đặc điểm & Nguồn gốc */}
                <div>
                  <h3 className="text-base font-bold text-ink mb-2">Đặc điểm & Nguồn gốc</h3>
                  <p className="text-ink-muted text-sm leading-relaxed whitespace-pre-wrap">
                    {product.description ||
                      'Nông sản sạch tận vườn, được canh tác tự nhiên, thu hoạch và đóng gói cẩn thận trước khi giao đến bạn.'}
                  </p>
                </div>

                {/* 2. Thông số nông sản */}
                <div className="border-t border-line/60 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                    Thông số nông sản
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="text-ink-muted">Quy cách bán:</span>
                      <span className="font-bold text-ink ml-1.5">{product.unit || 'kg'}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted">Nhà vườn:</span>
                      <span className="font-bold text-ink ml-1.5">{farmName}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted">Hạn sử dụng:</span>
                      <span className="font-bold text-ink ml-1.5">
                        {product.expiryDate
                          ? new Date(product.expiryDate).toLocaleDateString('vi-VN')
                          : 'Dùng tươi 3-5 ngày'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Khối Đánh giá từ khách hàng hiển thị trực tiếp bên dưới */}
                <div className="border-t border-line pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <Star className="size-4 text-sun-500 fill-sun-500" />
                      <span>Đánh giá từ khách hàng</span>
                      <span className="text-xs font-semibold text-ink-muted">({reviews.length})</span>
                    </h3>
                  </div>

                  {isReviewsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-leaf-700 size-6" />
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-3.5">
                      {reviews.slice(0, 3).map((review) => {
                        const isLiked = review.currentUserReaction === 'LIKE'
                        const isDisliked = review.currentUserReaction === 'DISLIKE'
                        const isReacting = reactingReviewId === review.id

                        return (
                          <div
                            key={review.id}
                            className="bg-paper-warm/60 p-4 rounded-lg border border-line"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-leaf-100 font-bold text-leaf-800 text-xs flex items-center justify-center shrink-0">
                                  {review.fullName
                                    ? review.fullName.charAt(0).toUpperCase()
                                    : review.buyerId}
                                </div>
                                <div>
                                  <p className="font-bold text-ink text-xs sm:text-sm">
                                    {review.fullName || `Người dùng #${review.buyerId}`}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-sun-500 mt-0.5">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`size-3 ${
                                            i < review.ratingStar
                                              ? 'fill-sun-500 text-sun-500'
                                              : 'text-line-strong'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-ink-muted">
                                      {review.createAt
                                        ? new Date(review.createAt).toLocaleDateString('vi-VN')
                                        : 'Gần đây'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onReact(review.id, 'LIKE')}
                                  disabled={isReacting}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                                    isLiked
                                      ? 'bg-leaf-700 text-white border-leaf-700'
                                      : 'bg-white text-ink-muted border-line hover:border-leaf-300'
                                  }`}
                                >
                                  <ThumbsUp className="size-3" />
                                  <span>{review.likeCount ?? 0}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onReact(review.id, 'DISLIKE')}
                                  disabled={isReacting}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                                    isDisliked
                                      ? 'bg-sale text-white border-sale'
                                      : 'bg-white text-ink-muted border-line hover:border-sale'
                                  }`}
                                >
                                  <ThumbsDown className="size-3" />
                                  <span>{review.dislikeCount ?? 0}</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-ink text-xs sm:text-sm leading-relaxed mb-2">
                              {review.comment}
                            </p>

                            {review.replyFromShop && (
                              <div className="bg-white p-3 rounded-lg border border-line text-xs">
                                <p className="font-bold text-leaf-700 mb-0.5">Phản hồi từ Nhà vườn:</p>
                                <p className="text-ink-muted italic">{review.replyFromShop}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {reviews.length > 3 && (
                        <button
                          type="button"
                          onClick={() => handleSelectTab('Đánh giá')}
                          className="w-full py-2 text-center text-xs font-bold text-leaf-700 hover:text-leaf-800 hover:underline cursor-pointer"
                        >
                          Xem tất cả {reviews.length} đánh giá →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-paper-warm/60 rounded-lg border border-dashed border-line text-xs text-ink-muted">
                      Chưa có đánh giá nào cho nông sản này. Hãy là người đầu tiên trải nghiệm!
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Chứng nhận' && (
              <div className="grid sm:grid-cols-2 gap-3.5">
                {certItems.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex gap-3 p-3.5 rounded-lg border border-line bg-paper-warm/50"
                  >
                    <div className="size-8 rounded-lg bg-leaf-50 text-leaf-700 border border-leaf-200/60 flex items-center justify-center shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-ink text-xs sm:text-sm">{title}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Đánh giá' && (
              <div className="space-y-6">
                {isReviewsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-leaf-700 size-8" />
                  </div>
                ) : reviews.length > 0 ? (
                  <>
                    {pagedReviews.map((review) => {
                    const isLiked = review.currentUserReaction === 'LIKE'
                    const isDisliked = review.currentUserReaction === 'DISLIKE'
                    const isReacting = reactingReviewId === review.id

                    return (
                      <div
                        key={review.id}
                        className="bg-paper-warm p-4 sm:p-5 rounded-lg border border-line animate-in fade-in slide-in-from-bottom-2"
                      >
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-leaf-50 border border-leaf-200 flex items-center justify-center font-bold text-leaf-700 text-sm shrink-0">
                              {review.fullName
                                ? review.fullName.charAt(0).toUpperCase()
                                : review.buyerId}
                            </div>
                            <div>
                              <p className="font-bold text-ink text-sm">
                                {review.fullName || `Người dùng #${review.buyerId}`}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex text-sun-500">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`size-3.5 ${
                                        i < review.ratingStar
                                          ? 'fill-sun-500 text-sun-500'
                                          : 'text-line-strong'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-ink-muted">
                                  {review.createAt
                                    ? new Date(review.createAt).toLocaleDateString('vi-VN')
                                    : 'Gần đây'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onReact(review.id, 'LIKE')}
                              disabled={isReacting}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                                isLiked
                                  ? 'bg-leaf-700 text-white border-leaf-700'
                                  : 'bg-white text-ink-muted border-line hover:border-leaf-300'
                              } disabled:opacity-50`}
                            >
                              <ThumbsUp className="size-3.5" />
                              <span>{review.likeCount ?? 0}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onReact(review.id, 'DISLIKE')}
                              disabled={isReacting}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                                isDisliked
                                  ? 'bg-sale text-white border-sale'
                                  : 'bg-white text-ink-muted border-line hover:border-sale'
                              } disabled:opacity-50`}
                            >
                              <ThumbsDown className="size-3.5" />
                              <span>{review.dislikeCount ?? 0}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-ink text-sm leading-relaxed mb-4">{review.comment}</p>

                        {review.imageUrls && review.imageUrls.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {review.imageUrls.map((url, i) => (
                              <div
                                key={i}
                                className="rounded-lg overflow-hidden border border-line w-24 h-24 bg-white shrink-0 hover:scale-105 transition-transform"
                              >
                                <img
                                  src={url}
                                  alt={`Bằng chứng ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : review.evidence ? (
                          <div className="mb-4 rounded-lg overflow-hidden border border-line w-32 aspect-square bg-white">
                            <img
                              src={review.evidence}
                              alt="Bằng chứng"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}

                        {review.replyFromShop && (
                          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-line relative mt-3">
                            <div className="inline-flex items-center gap-1.5 text-leaf-700 font-bold text-xs uppercase tracking-wider mb-1">
                              <MessageSquare className="size-3.5" />
                              <span>Phản hồi từ Nhà vườn</span>
                            </div>
                            <p className="text-ink-muted text-xs sm:text-sm italic">{review.replyFromShop}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {totalReviewPages > 1 && (
                    <div className="pt-6 border-t border-line/70 flex justify-center">
                      <Pagination
                        currentPage={reviewPage}
                        totalPages={totalReviewPages}
                        onPageChange={(page) => setReviewPage(page)}
                      />
                    </div>
                  )}
                </>
              ) : (
                  <div className="text-center py-16 bg-paper-warm rounded-xl border border-dashed border-line">
                    <Star className="size-12 text-line-strong mx-auto mb-3" />
                    <p className="text-ink-muted font-bold text-xs uppercase tracking-wider">
                      Chưa có đánh giá nào cho sản phẩm này
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
)

ProductDetailTabs.displayName = 'ProductDetailTabs'
