import React, { useState } from 'react'
import {
  Check,
  MessageSquare,
  Share2,
  ShieldCheck,
  Store,
} from 'lucide-react'
import type { ReviewResponse } from '@/services'
import { ProductSharePopover } from './ProductSharePopover'

interface ProductShopCardProps {
  farmName: string
  shopOwner: any
  resolvedShopId?: number
  shopReviews: ReviewResponse[]
  shopUrl: string | null
  isAuthenticated: boolean
  onNavigateToShop: () => void
  onStartChat: () => void
}

export const ProductShopCard: React.FC<ProductShopCardProps> = ({
  farmName,
  shopOwner,
  resolvedShopId,
  shopReviews,
  shopUrl,
  onNavigateToShop,
  onStartChat,
}) => {
  const [showShopShareMenu, setShowShopShareMenu] = useState(false)

  const shopAvgRating =
    shopReviews.length > 0
      ? (shopReviews.reduce((acc, r) => acc + r.ratingStar, 0) / shopReviews.length).toFixed(1)
      : '5.0'

  const replyRate =
    shopReviews.length > 0
      ? `${Math.round(
          (shopReviews.filter((r) => r.replyFromShop).length / shopReviews.length) * 100,
        )}%`
      : '98%'

  const joinDurationText = (() => {
    const joinDate = shopOwner?.createAt || shopOwner?.createdAt
    if (!joinDate) return '1 Năm'
    const years = Math.floor(
      (Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365),
    )
    return years > 0 ? `${years} Năm` : 'Mới tham gia'
  })()

  return (
    <div className="max-w-6xl mx-auto px-4 mt-3 mb-6">
      <div
        className="relative overflow-hidden rounded-2xl border border-leaf-200/60"
        style={{
          background: 'linear-gradient(135deg, #f0f7eb 0%, #e8f5e0 50%, #f5faf2 100%)',
          boxShadow: '0 2px 16px 0 rgba(74,124,47,0.06)',
        }}
      >
        <div
          className="absolute -top-16 -right-16 size-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4a7c2f, transparent)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 size-36 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #326318, transparent)' }}
        />
        <div className="relative z-10 p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
            {/* Shop info & Actions */}
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <div className="size-14 sm:size-16 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
                  <img
                    src={
                      shopOwner?.logoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        farmName,
                      )}&background=326318&color=fff&size=200&bold=true`
                    }
                    alt={farmName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-2xs">
                  <Check className="size-2.5 text-white" />
                </span>
              </div>

              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-bold text-ink text-base">{farmName}</h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-leaf-50 text-leaf-700 border border-leaf-200">
                    <ShieldCheck className="size-3" />
                    Đã xác minh
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={onNavigateToShop}
                    className="inline-flex items-center justify-center gap-1 h-8 px-3 bg-white text-leaf-700 hover:bg-leaf-50 font-semibold text-xs rounded-lg border border-leaf-300 hover:border-leaf-600 transition-all shadow-2xs whitespace-nowrap cursor-pointer"
                  >
                    <Store className="size-3.5 shrink-0" />
                    <span>Xem shop</span>
                  </button>

                  <button
                    type="button"
                    onClick={onStartChat}
                    className="inline-flex items-center justify-center gap-1 h-8 px-3 bg-leaf-700 hover:bg-leaf-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-all whitespace-nowrap cursor-pointer"
                  >
                    <MessageSquare className="size-3.5 shrink-0" />
                    <span>Nhắn tin</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowShopShareMenu((v) => !v)}
                      aria-label="Chia sẻ gian hàng"
                      className="inline-flex items-center justify-center gap-1 h-8 px-2.5 bg-paper hover:bg-paper-warm text-ink font-semibold text-xs rounded-lg border border-line transition-all shadow-2xs whitespace-nowrap cursor-pointer"
                    >
                      <Share2 className="size-3 shrink-0" />
                      <span>Chia sẻ</span>
                    </button>

                    {shopUrl && (
                      <ProductSharePopover
                        isOpen={showShopShareMenu}
                        onClose={() => setShowShopShareMenu(false)}
                        productUrl={shopUrl}
                        shopUrl={shopUrl}
                        type="shop"
                        align="left"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Statistics */}
            <div className="lg:col-span-2 flex items-center">
              <div className="grid grid-cols-3 gap-4 w-full bg-paper-warm/80 p-3 sm:p-3.5 rounded-xl border border-line shadow-2xs">
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-extrabold text-leaf-700 mb-0.5">{shopAvgRating}</p>
                  <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider">
                    Đánh Giá ({shopReviews.length})
                  </p>
                </div>
                <div className="text-center border-l border-r border-line px-2">
                  <p className="text-lg sm:text-xl font-extrabold text-ink mb-0.5">{replyRate}</p>
                  <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider">
                    Phản Hồi
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-extrabold text-ink mb-0.5">{joinDurationText}</p>
                  <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider">
                    Tham Gia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
