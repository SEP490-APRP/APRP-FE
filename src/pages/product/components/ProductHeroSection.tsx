import React from 'react'
import {
  ChevronDown,
  Heart,
  Leaf,
  Loader2,
  MapPin,
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
  highlights,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Main product card */}
      <div
        className="bg-white rounded-3xl border border-gray-100 p-5 lg:p-8 animate-in fade-in duration-500"
        style={{ boxShadow: '0 2px 20px 0 rgba(0,0,0,0.06)' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Gallery & Badges */}
          <div className="flex flex-col">
            {product.images && product.images.length > 0 ? (
              <ProductImageGallery images={product.images} productName={product.productName} />
            ) : (
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-line bg-paper-warm shadow-sm">
                <img
                  src={product.imageUrl || `https://picsum.photos/seed/product${product.id}/600/600`}
                  className="w-full h-full object-cover"
                  alt={product.productName}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {isOutOfStock ? (
                <span className="bg-sale-soft text-sale text-xs font-bold px-3 py-1.5 rounded-full border border-sale/20">
                  Hết hàng
                </span>
              ) : (
                <>
                  <span className="bg-leaf-50 text-leaf-700 text-xs font-bold px-3 py-1.5 rounded-full border border-leaf-200">
                    Thu hoạch tươi mới
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                    Còn {stockKg.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg
                  </span>
                </>
              )}
              {product.expiryDate && (
                <span className="bg-sun-100 text-soil-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sun-300/40">
                  HSD: {new Date(product.expiryDate).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Information & Purchase */}
          <div className="flex flex-col gap-5">
            <div>
              <button
                type="button"
                onClick={onNavigateToShop}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-leaf-700 bg-leaf-50 hover:bg-leaf-100 border border-leaf-200 rounded-full px-3 py-1 mb-3 transition-colors cursor-pointer"
              >
                <Store className="size-3.5" />
                <span>{farmName}</span>
              </button>

              <h1 className="text-2xl sm:text-3xl font-black text-ink leading-tight">
                {product.productName}
              </h1>

              <div className="flex items-center gap-3 mt-3 pb-4 border-b border-gray-100">
                <div className="flex text-sun-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < Math.round(productAvgRating)
                          ? 'fill-sun-500 text-sun-500'
                          : 'text-line-strong'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-ink-muted text-sm font-medium">
                  {reviewsCount > 0
                    ? `${productAvgRating.toFixed(1)} · ${reviewsCount} đánh giá`
                    : 'Chưa có đánh giá'}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="rounded-2xl bg-paper-warm border border-line p-5">
              {hasActiveDiscount ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-ink-muted text-base line-through font-medium">
                      {basePricePerKg.toLocaleString('vi-VN')}đ/kg
                    </span>
                    <span className="bg-sale text-white text-xs font-black px-2 py-0.5 rounded-full shadow-xs">
                      -{product.discountPercent}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-black leading-none"
                      style={{
                        fontSize: '2.2rem',
                        background: 'linear-gradient(135deg, #326318, #4a7c2f)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {displayPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-ink-muted font-semibold text-sm">/ kg</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <Heart className="size-3 fill-current" />
                    Tiết kiệm {(basePricePerKg - product.salePrice!).toLocaleString('vi-VN')}đ/kg
                    {product.discountEndDate &&
                      ` · đến ${new Date(product.discountEndDate).toLocaleDateString('vi-VN')}`}
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-black leading-none"
                    style={{
                      fontSize: '2.2rem',
                      background: 'linear-gradient(135deg, #326318, #4a7c2f)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {displayPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-ink-muted font-semibold text-sm">/ kg</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
                <div className="text-center">
                  <p className="text-lg font-black text-ink">
                    {stockKg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                    Kg tồn kho
                  </p>
                </div>
                <div className="text-center border-l border-line">
                  <p className="text-lg font-black text-ink">{minOrderKg}</p>
                  <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                    Kg tối thiểu
                  </p>
                </div>
              </div>
            </div>

            {/* Description excerpt */}
            <p className="text-ink-muted text-sm leading-relaxed line-clamp-3">
              {product.description ||
                'Sản phẩm sạch được thu hoạch ngay tại vườn, đảm bảo độ tươi ngon khi đến tay bạn.'}
            </p>
            <button
              type="button"
              onClick={onScrollToDetail}
              className="self-start text-xs font-bold text-leaf-700 hover:text-leaf-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết nông sản</span>
              <ChevronDown className="size-3.5" />
            </button>

            {/* Purchase actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex items-center justify-between sm:justify-center border border-line rounded-xl bg-paper overflow-hidden h-14 shrink-0">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  disabled={isOutOfStock || quantity <= minOrderKg}
                  onClick={() => onQuantityChange(Math.max(minOrderKg, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-50 cursor-pointer"
                >
                  <Minus className="size-4" />
                </button>
                <input
                  type="text"
                  value={isOutOfStock ? '0 kg' : `${quantity} kg`}
                  readOnly
                  aria-label="Số lượng kg"
                  className="w-20 text-center font-black bg-transparent outline-none text-ink select-none"
                />
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  disabled={isOutOfStock || quantity >= stockKg}
                  onClick={() => onQuantityChange(quantity + 1)}
                  className="w-12 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock || isAdding}
                onClick={onAddToCart}
                className="flex-1 h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: isOutOfStock
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #4a7c2f 0%, #326318 100%)',
                  boxShadow: isOutOfStock ? 'none' : '0 4px 20px 0 rgba(74,124,47,0.35)',
                  color: isOutOfStock ? '#9ca3af' : '#fff',
                }}
              >
                {isAdding ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ShoppingCart className="size-5" />
                )}
                <span>
                  {isAdding ? 'Đang thêm...' : isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {highlights.map(({ icon: Icon, label, sub, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className={`size-9 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink">{label}</p>
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
