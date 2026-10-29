import React from 'react'
import {
  ChevronDown,
  Heart,
  Leaf,
  Loader2,
  MapPin,
  MessageSquare,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProductResponse } from '@/services'
import { ProductImageGallery } from './ProductImageGallery'

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
  onScrollToDetail,
  onNavigateToShop,
  onStartChat,
  highlights,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-0.5 pb-2">
      {/* Main product card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 sm:pt-4 animate-in fade-in duration-300 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          {/* Left Column: Gallery & Badges (5 cols) */}
          <div className="lg:col-span-5 flex flex-col w-full max-w-[360px] mx-auto lg:max-w-none">
            {product.images && product.images.length > 0 ? (
              <ProductImageGallery images={product.images} productName={product.productName} />
            ) : (
              <div className="relative w-full aspect-[4/3] sm:aspect-square max-h-[320px] rounded-xl overflow-hidden border border-line bg-paper-warm shadow-2xs flex items-center justify-center">
                <img
                  src={product.imageUrl || `https://picsum.photos/seed/product${product.id}/600/600`}
                  className="w-full h-full object-cover transition-transform duration-300"
                  alt={product.productName}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-2.5">
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
              {product.expiryDate && (
                <span className="bg-sun-100 text-soil-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-sun-300/40">
                  HSD: {new Date(product.expiryDate).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Information & Purchase (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div>
              <button
                type="button"
                onClick={onNavigateToShop}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 bg-leaf-50 hover:bg-leaf-100 border border-leaf-200 rounded-md px-2.5 py-0.5 mb-2 transition-colors cursor-pointer"
              >
                <Store className="size-3.5" />
                <span>{farmName}</span>
              </button>

              <h1 className="text-xl sm:text-2xl font-bold text-ink leading-snug">
                {product.productName}
              </h1>

              <div className="flex items-center gap-2 mt-1.5 pb-2.5 border-b border-gray-100">
                <div className="flex text-sun-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${i < Math.round(productAvgRating)
                          ? 'fill-sun-500 text-sun-500'
                          : 'text-line-strong'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-ink-muted text-xs font-medium">
                  {reviewsCount > 0
                    ? `${productAvgRating.toFixed(1)} · ${reviewsCount} đánh giá`
                    : 'Chưa có đánh giá'}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="rounded-xl bg-paper-warm/70 border border-line p-3 sm:p-3.5">
              {hasActiveDiscount ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-ink-muted text-xs sm:text-sm line-through font-medium">
                      {basePricePerKg.toLocaleString('vi-VN')}đ/kg
                    </span>
                    <span className="bg-sale text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                      -{product.discountPercent}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-black leading-none text-xl sm:text-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #326318, #4a7c2f)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {displayPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-ink-muted font-medium text-xs">/ kg</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                    <Heart className="size-2.5 fill-current" />
                    Tiết kiệm {(basePricePerKg - product.salePrice!).toLocaleString('vi-VN')}đ/kg
                    {product.discountEndDate &&
                      ` · đến ${new Date(product.discountEndDate).toLocaleDateString('vi-VN')}`}
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-black leading-none text-xl sm:text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #326318, #4a7c2f)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {displayPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-ink-muted font-medium text-xs">/ kg</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-line">
                <div className="text-center">
                  <p className="text-sm sm:text-base font-bold text-ink">
                    {stockKg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider">
                    Kg tồn kho
                  </p>
                </div>
                <div className="text-center border-l border-line">
                  <p className="text-sm sm:text-base font-bold text-ink">{minOrderKg}</p>
                  <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider">
                    Kg tối thiểu
                  </p>
                </div>
              </div>
            </div>

            {/* Description excerpt */}
            <p className="text-ink-muted text-xs leading-relaxed line-clamp-2">
              {product.description ||
                'Sản phẩm sạch được thu hoạch ngay tại vườn, đảm bảo độ tươi ngon khi đến tay bạn.'}
            </p>
            <button
              type="button"
              onClick={onScrollToDetail}
              className="self-start text-[11px] font-bold text-leaf-700 hover:text-leaf-800 hover:underline inline-flex items-center gap-1 cursor-pointer -mt-1"
            >
              <span>Xem chi tiết nông sản</span>
              <ChevronDown className="size-3" />
            </button>

            {/* Purchase actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="flex items-center justify-between sm:justify-center border border-line rounded-lg bg-paper overflow-hidden h-10 sm:h-10.5 shrink-0">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  disabled={isOutOfStock || quantity <= minOrderKg}
                  onClick={() => onQuantityChange(Math.max(minOrderKg, quantity - 1))}
                  className="w-8 sm:w-9 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-50 cursor-pointer"
                >
                  <Minus className="size-3.5" />
                </button>
                <input
                  type="text"
                  value={isOutOfStock ? '0 kg' : `${quantity} kg`}
                  readOnly
                  aria-label="Số lượng kg"
                  className="w-14 sm:w-16 text-center font-bold bg-transparent outline-none text-ink select-none text-xs"
                />
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  disabled={isOutOfStock || quantity >= stockKg}
                  onClick={() => onQuantityChange(quantity + 1)}
                  className="w-8 sm:w-9 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock || isAdding}
                onClick={onAddToCart}
                className="flex-1 h-10 sm:h-10.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] text-xs sm:text-sm"
                style={{
                  background: isOutOfStock
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #4a7c2f 0%, #326318 100%)',
                  boxShadow: isOutOfStock ? 'none' : '0 2px 10px 0 rgba(74,124,47,0.25)',
                  color: isOutOfStock ? '#9ca3af' : '#fff',
                }}
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

              {onStartChat && (
                <button
                  type="button"
                  onClick={onStartChat}
                  title="Nhắn tin với nhà vườn để hỏi về nông sản này"
                  className="h-10 sm:h-10.5 px-3 rounded-lg border border-leaf-300 bg-leaf-50/70 hover:bg-leaf-100 text-leaf-800 font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shrink-0"
                >
                  <MessageSquare className="size-3.5 text-leaf-700" />
                  <span className="hidden sm:inline">Hỏi shop</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
        {highlights.map(({ icon: Icon, label, sub, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 p-2.5 sm:p-3 flex items-start gap-2.5 shadow-2xs hover:shadow-xs transition-all"
          >
            <div className={`size-7 sm:size-8 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">{label}</p>
              <p className="text-[10px] text-ink-muted mt-0.5 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
