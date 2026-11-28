import { memo, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Leaf, MapPin, ShoppingCart } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils'
import {
  getProduceFallback,
  resolveProductImage,
} from '@/pages/product/components/productDetail.utils'

export type Product = {
  id: string
  name: string
  price: number
  original: number
  image: string
  category: string
  farm: string
  region: string
  flaw?: string
  score?: number
  stock: number
  rescued?: number
  unit: string
}

export const formatMoney = (val: number) => val.toLocaleString('vi-VN') + 'đ'

export const productHref = (product: { id: string | number }) =>
  `/san-pham/${product.id}`

export const discountPercent = ({ price, original }: { price: number; original: number }) =>
  original > price ? Math.round((1 - price / original) * 100) : 0

type ProduceImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function ProduceImage({ src, alt, className, priority = false }: ProduceImageProps) {
  const initial = useMemo(() => resolveProductImage(alt, src), [alt, src])
  const [imgSrc, setImgSrc] = useState(initial)
  const [hasFallbackFailed, setHasFallbackFailed] = useState(false)

  useEffect(() => {
    setImgSrc(resolveProductImage(alt, src))
    setHasFallbackFailed(false)
  }, [alt, src])

  const handleError = () => {
    const fallback = getProduceFallback(alt)
    if (imgSrc !== fallback) {
      setImgSrc(fallback)
    } else {
      setHasFallbackFailed(true)
    }
  }

  if (hasFallbackFailed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f4f6f0] p-3 text-[#326318]',
          className,
        )}
      >
        <Leaf size={32} aria-hidden />
        <span className="line-clamp-2 text-center text-xs font-semibold text-[#5f6b57]">
          {alt}
        </span>
      </div>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={handleError}
      className={cn('h-full w-full object-cover', className)}
    />
  )
}

export type ProductCardProps = {
  product: Product
  onAdd: (id: string) => void
  inCartQuantity?: number
  priority?: boolean
  className?: string
}

function ProductCardBase({
  product: p,
  onAdd,
  inCartQuantity = 0,
  priority,
  className,
}: ProductCardProps) {
  const href = productHref(p)
  const discount = discountPercent(p)
  const rescued = Math.min(100, Math.max(0, p.rescued ?? 0))
  const soldOut = p.stock <= 0
  const reachedStock = inCartQuantity >= p.stock

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#e8ece3] bg-white shadow-xs',
        'transition-all duration-300 hover:border-[#326318]/50 hover:shadow-md',
        className,
      )}
    >
      {/* Khung ảnh: aspect-[4/3] trên mobile, square trên desktop, tràn viền sạch sẽ */}
      <Link
        to={href}
        className="relative block aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-[#faf7ef]"
      >
        <ProduceImage
          src={p.image}
          alt={p.name}
          priority={priority}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />
        {/* Chỉ giữ lại badge Giảm giá (-15%) ở góc trên bên trái, gỡ bỏ các badge đen/trắng che ảnh */}
        {discount > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-[#e53935] px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
            -{discount}%
          </span>
        )}

      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        {/* Nguồn gốc & Nhà vườn - truncate 1 dòng */}
        <p className="flex items-center justify-between gap-2 text-xs text-[#5f6b57]">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={13} className="shrink-0 text-[#326318]" aria-hidden />
            <span className="truncate font-medium">{p.farm}</span>
          </span>
          <span className="shrink-0 font-medium text-[11px] text-[#838d7b]">{p.region}</span>
        </p>

        {/* Tên sản phẩm - cố định min-h-[40px] line-clamp-2 để hàng luôn bằng phẳng */}
        <h3 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-bold leading-snug text-[#1f241a]">
          <Link
            to={href}
            className="hover:text-[#326318] transition-colors"
          >
            {p.name}
          </Link>
        </h3>

        {/* Giá tiền - mt-auto đẩy xuống để thẳng hàng với các thẻ bên cạnh */}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          <strong className="text-base font-extrabold text-[#326318] sm:text-lg">
            {formatMoney(p.price)}
          </strong>
          <span className="text-xs text-[#838d7b]">/{p.unit}</span>
          {discount > 0 && (
            <del className="text-xs text-[#838d7b]">
              <span className="sr-only">Giá gốc </span>
              {formatMoney(p.original)}
            </del>
          )}
        </div>

        {/* Tồn kho thực tế */}
        <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[#5f6b57]">
          <span className={cn(p.stock < 20 ? 'font-bold text-[#b71c1c]' : 'text-[#326318]')}>
            {soldOut ? 'Hết hàng' : `Còn ${p.stock} ${p.unit}`}
          </span>
        </div>

        {/* Nút hành động: 1 nút Xem chi tiết + 1 nút Thêm vào giỏ */}
        <div className="mt-2.5 flex items-center gap-2 pt-2.5 border-t border-[#f0eee6]">
          <Link
            to={href}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg border border-[#326318]/40 bg-[#f8faf6] text-[#326318] hover:bg-[#326318] hover:text-white text-xs font-bold transition-all text-center group/btn"
          >
            <Eye size={14} className="shrink-0 transition-transform group-hover/btn:scale-110" />
            <span className="truncate">Chi tiết</span>
          </Link>

          <button
            type="button"
            disabled={soldOut || reachedStock}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAdd(p.id)
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:bg-[#d6dccf] disabled:text-[#838d7b] disabled:cursor-not-allowed disabled:shadow-none text-center"
          >
            <ShoppingCart size={14} className="shrink-0" />
            <span className="truncate">
              {soldOut
                ? 'Hết hàng'
                : reachedStock
                  ? 'Đã đủ'
                  : inCartQuantity > 0
                    ? `Trong giỏ (${inCartQuantity})`
                    : 'Thêm giỏ'}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}

export const ProductCard = memo(ProductCardBase)
export default ProductCard

/** Skeleton có đúng bố cục của ProductCard, nên khi dữ liệu về không bị nhảy layout. */
export function ProductCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card"
      aria-hidden
    >
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-auto h-5 w-1/2" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  )
}
