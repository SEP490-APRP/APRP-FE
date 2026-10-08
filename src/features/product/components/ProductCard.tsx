import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Leaf, MapPin, ShoppingCart } from 'lucide-react'
import { money, type Product } from '@/mocks/catalog'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils'

// Một nơi duy nhất quy đổi id catalog sang id trang chi tiết.
const DETAIL_IDS: Partial<Record<string, number>> = {
  carrot: 702,
  tomato: 704,
  pomelo: 703,
  potato: 701,
  cabbage: 702,
  spinach: 702,
  pumpkin: 705,
}

export const productHref = (product: Pick<Product, 'id'>) =>
  `/san-pham/${DETAIL_IDS[product.id] ?? product.id}`

export const discountPercent = ({ price, original }: Pick<Product, 'price' | 'original'>) =>
  original > price ? Math.round((1 - price / original) * 100) : 0

type ProduceImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function ProduceImage({ src, alt, className, priority = false }: ProduceImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-2 bg-leaf-50 p-3 text-leaf-600',
          className,
        )}
      >
        <Leaf size={36} aria-hidden />
        <span className="line-clamp-2 text-center text-caption font-semibold text-ink-muted">
          {alt}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
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
  const rescued = Math.min(100, Math.max(0, p.rescued))
  const soldOut = p.stock <= 0
  const reachedStock = inCartQuantity >= p.stock

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8ece3] bg-white shadow-sm',
        'transition-all duration-300 hover:border-[#326318]/50 hover:shadow-md',
        className,
      )}
    >
      {/* Ảnh sản phẩm */}
      <Link
        to={href}
        className="relative block aspect-square overflow-hidden bg-[#faf7ef]"
      >
        <ProduceImage
          src={p.image}
          alt={p.name}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-[#e53935] px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
            -{discount}%
          </span>
        )}
        <span
          className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-[#ffd54f] backdrop-blur-sm"
          title="Điểm chất lượng tươi sạch"
        >
          AI {p.score}%
        </span>
        <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[#5f6b57] shadow-sm">
          {p.flaw}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {/* Nguồn gốc & Nhà vườn */}
        <p className="flex items-center justify-between gap-2 text-xs text-[#5f6b57]">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={13} className="shrink-0 text-[#326318]" aria-hidden />
            <span className="truncate font-medium">{p.farm}</span>
          </span>
          <span className="shrink-0 font-medium">{p.region}</span>
        </p>

        {/* Tên sản phẩm */}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-[#1f241a]">
          <Link
            to={href}
            className="hover:text-[#326318] transition-colors"
          >
            {p.name}
          </Link>
        </h3>

        {/* Giá tiền */}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <strong className="text-base font-extrabold text-[#326318] sm:text-lg">
            {money(p.price)}
          </strong>
          <span className="text-xs text-[#838d7b]">/{p.unit}</span>
          {discount > 0 && (
            <del className="text-xs text-[#838d7b]">
              <span className="sr-only">Giá gốc </span>
              {money(p.original)}
            </del>
          )}
        </div>

        {/* Tiến độ giải cứu & Tồn kho */}
        <div className="flex flex-col gap-1">
          <div
            role="progressbar"
            aria-valuenow={rescued}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8ece3]"
          >
            <div
              className="h-full rounded-full bg-[#326318] transition-[width] duration-500"
              style={{ width: `${rescued}%` }}
            />
          </div>
          <p className="flex justify-between gap-2 whitespace-nowrap text-xs font-medium text-[#5f6b57]">
            <span>Đã cứu {rescued}%</span>
            <span className={cn(p.stock < 20 && 'font-bold text-[#b71c1c]')}>
              {soldOut ? 'Hết hàng' : `Còn ${p.stock} ${p.unit}`}
            </span>
          </p>
        </div>

        {/* Nút hành động: 1 nút Xem chi tiết + 1 nút Thêm vào giỏ */}
        <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-[#f0eee6]">
          <Link
            to={href}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-xl border border-[#326318]/40 bg-[#f8faf6] text-[#326318] hover:bg-[#326318] hover:text-white text-xs font-bold transition-all text-center group/btn"
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
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:bg-[#d6dccf] disabled:text-[#838d7b] disabled:cursor-not-allowed disabled:shadow-none text-center"
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
