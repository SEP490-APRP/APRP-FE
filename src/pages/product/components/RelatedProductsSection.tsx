import React from 'react'
import { ChevronRight } from 'lucide-react'
import type { ProductResponse } from '@/services'
import { clImg } from './productDetail.utils'

interface RelatedProductsSectionProps {
  relatedProducts: ProductResponse[]
  farmName: string
  resolvedShopId?: number
  onNavigateToProduct: (productId: number) => void
  onNavigateToShop: () => void
}

export const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({
  relatedProducts,
  farmName,
  resolvedShopId,
  onNavigateToProduct,
  onNavigateToShop,
}) => {
  if (!relatedProducts || relatedProducts.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Sản phẩm liên quan từ nhà vườn</h2>
        {resolvedShopId && (
          <button
            type="button"
            onClick={onNavigateToShop}
            className="text-xs font-semibold text-leaf-700 hover:text-leaf-800 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Xem tất cả tại {farmName}</span>
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {relatedProducts.map((rp) => {
          const rpPrice = rp.salePrice ?? rp.pricePerKg ?? rp.sellingPrice ?? 0
          const rpStock = rp.stockKg ?? rp.stockQuantity ?? 0
          const fallbackSeedImg = `https://picsum.photos/seed/${rp.id}/400/400`

          return (
            <button
              key={rp.id}
              type="button"
              onClick={() => onNavigateToProduct(rp.id)}
              className="text-left bg-white rounded-xl border border-line shadow-2xs hover:shadow-xs hover:border-leaf-300 transition-all overflow-hidden group cursor-pointer"
            >
              <div className="aspect-square bg-paper-warm overflow-hidden relative">
                <img
                  src={clImg(rp.imageUrl, 'thumb') || rp.imageUrl || fallbackSeedImg}
                  alt={rp.productName}
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = fallbackSeedImg
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <p className="font-semibold text-ink text-xs sm:text-sm line-clamp-2 leading-snug mb-1 group-hover:text-leaf-700 transition-colors">
                  {rp.productName}
                </p>
                <p className="text-leaf-700 font-bold text-sm sm:text-base">
                  {rpPrice.toLocaleString('vi-VN')}đ
                  <span className="text-ink-muted font-normal text-xs ml-1">/kg</span>
                </p>
                <p className="text-[10px] text-ink-muted mt-0.5">
                  {rpStock > 0 ? `Còn ${rpStock} kg` : 'Hết hàng'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
