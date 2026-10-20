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
        className="max-w-7xl mx-auto px-4 mb-12 scroll-mt-24"
      >
        <div className="bg-white rounded-3xl border border-line shadow-card overflow-hidden">
          {/* Tabs bar */}
          <div className="flex border-b border-line overflow-x-auto">
            {['Mô tả chi tiết', 'Chứng nhận', 'Đánh giá'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleSelectTab(tab)}
                className={`flex-1 min-w-[120px] px-4 py-4 text-sm font-bold transition-all border-b-2 -mb-px cursor-pointer ${
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
          <div className="p-6 lg:p-8">
            {activeTab === 'Mô tả chi tiết' && (
              <div className="max-w-3xl">
                <h3 className="text-lg font-bold text-ink mb-4">Thông tin sản phẩm</h3>
                <div className="text-ink-muted text-sm leading-loose whitespace-pre-wrap bg-paper-warm p-6 rounded-2xl border border-line">
                  {product.description ||
                    'Nông sản sạch tận vườn, được thu hoạch và đóng gói cẩn thận trước khi giao đến bạn.'}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="rounded-xl border border-line p-4 bg-paper">
                    <p className="text-xs text-ink-muted font-bold uppercase tracking-wider mb-1">
                      Đơn vị
                    </p>
                    <p className="font-bold text-ink">{product.unit || 'kg'}</p>
                  </div>
                  <div className="rounded-xl border border-line p-4 bg-paper">
                    <p className="text-xs text-ink-muted font-bold uppercase tracking-wider mb-1">
                      Cửa hàng
                    </p>
                    <p className="font-bold text-ink">{farmName}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Chứng nhận' && (
              <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
                {certItems.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex gap-4 p-5 rounded-2xl border border-line bg-paper-warm"
                  >
                    <div className="size-11 rounded-xl bg-leaf-50 text-leaf-700 border border-leaf-200 flex items-center justify-center shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-ink text-sm">{title}</p>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{desc}</p>
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
                  reviews.map((review) => {
                    const isLiked = review.currentUserReaction === 'LIKE'
                    const isDisliked = review.currentUserReaction === 'DISLIKE'
                    const isReacting = reactingReviewId === review.id

                    return (
                      <div
                        key={review.id}
                        className="bg-paper-warm p-6 sm:p-7 rounded-3xl border border-line animate-in fade-in slide-in-from-bottom-2"
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

                        {review.evidence && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-line w-32 aspect-square bg-white">
                            <img
                              src={review.evidence}
                              alt="Bằng chứng"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {review.replyFromShop && (
                          <div className="bg-white p-5 rounded-2xl border border-line relative mb-2">
                            <div className="inline-flex items-center gap-1.5 text-leaf-700 font-bold text-xs uppercase tracking-wider mb-1">
                              <MessageSquare className="size-3.5" />
                              <span>Phản hồi từ Nhà vườn</span>
                            </div>
                            <p className="text-ink-muted text-sm italic">{review.replyFromShop}</p>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-16 bg-paper-warm rounded-2xl border border-dashed border-line">
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
