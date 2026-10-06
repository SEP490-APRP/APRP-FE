import { memo, useState } from 'react'
import { Leaf, MapPin, ShoppingBasket } from 'lucide-react'
import { money, type Product } from '@/mocks/catalog'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * Card sản phẩm DUY NHẤT cho toàn site.
 * Trước đây có 3 bản khác nhau (components/ProductCard, card inline trong Fresh,
 * card inline trong TodayRescue) với 3 kiểu giá, 3 kiểu nút và 2 kiểu link chi tiết
 * (#/san-pham/702 và #/san-pham/carrot) dẫn tới cùng một sản phẩm.
 */

// Một nơi duy nhất quy đổi id catalog sang id trang chi tiết.
// Nên chuyển thành trường `detailId` trong type Product khi có API thật.
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
  `#/san-pham/${DETAIL_IDS[product.id] ?? 701}`

export const discountPercent = ({ price, original }: Pick<Product, 'price' | 'original'>) =>
  original > price ? Math.round((1 - price / original) * 100) : 0

type ProduceImageProps = {
  src: string
  alt: string
  className?: string
  /** Ảnh nằm trong màn hình đầu tiên thì không lazy-load (tránh LCP chậm). */
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
  /** Đánh dấu khi sản phẩm đã có trong giỏ, để nút phản hồi trạng thái. */
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
        'group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card',
        'transition-[box-shadow,border-color] duration-300 hover:border-leaf-600/50 hover:shadow-card-hover',
        'focus-within:ring-2 focus-within:ring-leaf-600/40',
        className,
      )}
    >
      {/* Ảnh: tabIndex -1 vì link ở tiêu đề đã là điểm focus chính, tránh 2 lần Tab cho cùng 1 đích */}
      <a
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-square overflow-hidden bg-paper-warm"
      >
        <ProduceImage
          src={p.image}
          alt=""
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-sale px-2 py-0.5 text-caption font-extrabold text-white shadow-sm">
            -{discount}%
          </span>
        )}
        <span
          className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-caption font-bold text-sun-300 backdrop-blur-sm"
          title="Điểm chất lượng do AI chấm (minh họa)"
        >
          AI {p.score}%
        </span>
        <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-white/95 px-2 py-0.5 text-caption font-semibold text-soil-600 shadow-sm">
          {p.flaw}
        </span>
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="flex items-center justify-between gap-2 text-caption text-ink-muted">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={12} className="shrink-0 text-leaf-600" aria-hidden />
            <span className="truncate">{p.farm}</span>
          </span>
          <span className="shrink-0 font-medium">{p.region}</span>
        </p>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-ink sm:text-[0.9375rem]">
          {/* after:inset-0 làm cả card bấm được mà vẫn chỉ có 1 link trong cây accessibility */}
          <a
            href={href}
            className="after:absolute after:inset-0 after:content-[''] hover:text-leaf-700 focus-visible:outline-none"
          >
            {p.name}
          </a>
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <strong className="text-base font-extrabold text-leaf-700 sm:text-lg">
            {money(p.price)}
          </strong>
          <span className="text-caption text-ink-subtle">/{p.unit}</span>
          {discount > 0 && (
            <del className="text-caption text-ink-subtle">
              <span className="sr-only">Giá gốc </span>
              {money(p.original)}
            </del>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div
            role="progressbar"
            aria-valuenow={rescued}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Đã giải cứu ${rescued}%`}
            className="h-1.5 w-full overflow-hidden rounded-full bg-leaf-100"
          >
            <div
              className="h-full rounded-full bg-leaf-600 transition-[width] duration-500"
              style={{ width: `${rescued}%` }}
            />
          </div>
          <p className="flex justify-between gap-2 whitespace-nowrap text-caption font-medium text-ink-muted">
            <span>Đã cứu {rescued}%</span>
            <span className={cn(p.stock < 20 && 'font-bold text-soil-600')}>
              {soldOut ? 'Hết hàng' : `Còn ${p.stock} ${p.unit}`}
            </span>
          </p>
        </div>

        {/* z-10 để nút nằm trên lớp link phủ cả card */}
        <Button
          size="sm"
          fullWidth
          className="relative z-10 mt-1"
          disabled={soldOut || reachedStock}
          onClick={() => onAdd(p.id)}
          leftIcon={<ShoppingBasket size={16} aria-hidden />}
          aria-label={`Thêm ${p.name} vào giỏ`}
        >
          {soldOut
            ? 'Hết hàng'
            : reachedStock
              ? 'Đã đủ tồn kho'
              : inCartQuantity > 0
                ? `Trong giỏ: ${inCartQuantity}`
                : 'Thêm vào giỏ'}
        </Button>
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
