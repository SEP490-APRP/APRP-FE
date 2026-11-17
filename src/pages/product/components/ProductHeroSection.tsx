import React from 'react'
import {
  Heart,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Store,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProductResponse } from '@/services'
import { ProductImageGallery } from './ProductImageGallery'
import { getProduceFallback, resolveProductImage } from './productDetail.utils'

interface TrustHighlight {
  icon: LucideIcon
  label: string
  sub: string
  color: string
}

interface ProductHeroSectionProps {
  product: ProductResponse
  farmName: string
  resolvedShopId?: number
  productAvgRating: number
  reviewsCount: number
  stockKg: number
  isOutOfStock: boolean
  basePricePerKg: number
  hasActiveDiscount: boolean
  displayPrice: number
  minOrderKg: number
  quantity: number
  onQuantityChange: (qty: number) => void
  isAdding: boolean
  onAddToCart: () => void
  onScrollToDetail: () => void
  onNavigateToShop: () => void
  onStartChat?: () => void
  highlights: TrustHighlight[]
}

export const ProductHeroSection: React.FC<ProductHeroSectionProps> = ({
  product,
  farmName,
  productAvgRating,
  reviewsCount,
  stockKg,
  isOutOfStock,
  basePricePerKg,
  hasActiveDiscount,
  displayPrice,
  minOrderKg,
  quantity,
  onQuantityChange,
  isAdding,
  onAddToCart,
  onNavigateToShop,
  onStartChat,
  highlights,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-1 pb-3">
      {/* Main product card (Buy Box 50/50) */}
      <div className="bg-white rounded-xl border border-line p-5 sm:p-7 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 lg:gap-10 items-start">
          {/* Left Column: 1:1 Gallery (50%) */}
          <div className="w-full">
            {product.images && product.images.length > 0 ? (
              <ProductImageGallery images={product.images} productName={product.productName} />
            ) : (
              <div className="relative w-full aspect-[4/3] max-h-[420px] rounded-lg overflow-hidden border border-line-subtle bg-paper-warm/50 shadow-2xs">
                <img
                  src={
                    resolveProductImage(product.productName, product.imageUrl) ||
                    getProduceFallback(product.productName)
                  }
                  className="w-full h-full object-cover object-center"
                  alt={product.productName}
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = getProduceFallback(
                      product.productName,
                    )
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column: Details, Price, Actions & Trust strip (50%) */}
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <div>
              {/* Farm tag */}
              <button
                type="button"
                onClick={onNavigateToShop}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 bg-leaf-50 hover:bg-leaf-100 border border-leaf-200/80 rounded-md px-2.5 py-0.5 mb-2 transition-colors cursor-pointer"
              >
                <Store className="size-3.5" />
                <span>{farmName}</span>
              </button>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink leading-snug tracking-tight">
                {product.productName}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-1.5 pb-2.5 border-b border-line/60">
                <div className="flex text-sun-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < Math.round(productAvgRating)
                          ? 'fill-sun-500 text-sun-500'
                          : 'text-line-strong'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-ink-muted text-xs font-medium">
                  {reviewsCount > 0
                    ? `${productAvgRating.toFixed(1)} (${reviewsCount} đánh giá)`
                    : 'Chưa có đánh giá'}
                </span>
              </div>
            </div>

            {/* Price Block (Airy, compact typography, gap ~12px) */}
            <div>
              {hasActiveDiscount ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted text-sm line-through font-medium">
                      {basePricePerKg.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="bg-sale text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                      -{product.discountPercent}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-2xl sm:text-3xl text-leaf-800 leading-none">
                      {displayPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-ink-muted font-medium text-xs sm:text-sm">/ kg</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <Heart className="size-2.5 fill-current" />
                    Tiết kiệm {(basePricePerKg - product.salePrice!).toLocaleString('vi-VN')}đ/kg
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-black text-2xl sm:text-3xl text-leaf-800 leading-none">
                    {displayPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-ink-muted font-medium text-xs sm:text-sm">/ kg</span>
                </div>
              )}
            </div>

            {/* Single Horizontal Status Badges Row (No data duplication) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {isOutOfStock ? (
                <span className="bg-sale-soft text-sale text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-sale/20">
                  Hết hàng
                </span>
              ) : (
                <>
                  <span className="bg-leaf-50 text-leaf-700 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-leaf-200">
                    Thu hoạch tươi mới
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Còn {stockKg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} kg
                  </span>
                </>
              )}
              {minOrderKg > 1 && (
                <span className="bg-paper-warm text-ink-muted text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-line">
                  Tối thiểu {minOrderKg} kg
                </span>
              )}
              {product.expiryDate && (
                <span className="bg-sun-100 text-soil-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-sun-300/40">
                  HSD: {new Date(product.expiryDate).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            {/* Description note */}
            {product.description && (
              <p className="text-ink-muted text-xs leading-relaxed line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Purchase CTA Actions */}
            <div className="pt-1">
              <div className="flex items-center gap-2">
                {/* Quantity input */}
                <div className="flex items-center border border-line rounded-lg bg-paper overflow-hidden h-10.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    disabled={isOutOfStock || quantity <= minOrderKg}
                    onClick={() => onQuantityChange(Math.max(minOrderKg, quantity - 1))}
                    className="w-9 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-50 cursor-pointer"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <input
                    type="text"
                    value={isOutOfStock ? '0 kg' : `${quantity} kg`}
                    readOnly
                    aria-label="Số lượng kg"
                    className="w-16 text-center font-bold bg-transparent outline-none text-ink select-none text-xs"
                  />
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    disabled={isOutOfStock || quantity >= stockKg}
                    onClick={() => onQuantityChange(quantity + 1)}
                    className="w-9 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                {/* Add to cart button */}
                <button
                  type="button"
                  disabled={isOutOfStock || isAdding}
                  onClick={onAddToCart}
                  className="flex-1 h-10.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] text-xs sm:text-sm text-white bg-leaf-700 hover:bg-leaf-800 shadow-sm"
                >
                  {isAdding ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="size-4" />
                  )}
                  <span>
                    {isAdding ? 'Đang thêm...' : isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </span>
                </button>

                {/* Chat button */}
                {onStartChat && (
                  <button
                    type="button"
                    onClick={onStartChat}
                    title="Nhắn tin với nhà vườn"
                    className="h-10.5 px-3 rounded-lg border border-leaf-300 bg-leaf-50/70 hover:bg-leaf-100 text-leaf-800 font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shrink-0"
                  >
                    <MessageSquare className="size-3.5 text-leaf-700" />
                    <span className="hidden sm:inline">Hỏi shop</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2x2 Trust Badges Grid - không bị cắt chữ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-3.5 mt-1 border-t border-line/70">
              {highlights.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-leaf-50 text-leaf-700 flex items-center justify-center shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink leading-tight">
                      {label}
                    </p>
                    <p className="text-[11px] text-ink-muted leading-tight mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
