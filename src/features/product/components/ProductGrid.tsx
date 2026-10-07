import type { ReactNode } from 'react'
import type { Product } from '@/mocks/catalog'
import { cn } from '@/utils'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

type ProductGridProps = {
  products: readonly Product[]
  onAdd: (id: string) => void
  /** Mặc định 'success' vì catalog hiện là dữ liệu tĩnh. Khi nối API, map từ trạng thái của query. */
  status?: 'loading' | 'error' | 'success'
  error?: string
  onRetry?: () => void
  cart?: Readonly<Record<string, number>>
  /** Số card skeleton hiển thị khi đang tải. */
  skeletonCount?: number
  /** Số card đầu tiên tải ảnh ngay (nằm trong màn hình đầu). */
  priorityCount?: number
  empty?: { title: string; description?: ReactNode; action?: ReactNode }
  columns?: 'default' | 'wide'
  className?: string
}

// Mobile 2 cột (đủ rộng cho card từ 360px), tablet 3, desktop 4.
const GRID_COLUMNS = {
  default: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  wide: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
} as const

export function ProductGrid({
  products,
  onAdd,
  status = 'success',
  error,
  onRetry,
  cart,
  skeletonCount = 8,
  priorityCount = 0,
  empty = { title: 'Chưa có nông sản nào', description: 'Vui lòng quay lại sau nhé.' },
  columns = 'default',
  className,
}: ProductGridProps) {
  const gridClass = cn('grid gap-3 sm:gap-5', GRID_COLUMNS[columns], className)

  if (status === 'loading') {
    return (
      <div role="status" aria-label="Đang tải nông sản" className={gridClass}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
        <span className="sr-only">Đang tải nông sản…</span>
      </div>
    )
  }

  if (status === 'error') return <ErrorState description={error} onRetry={onRetry} />

  if (products.length === 0) return <EmptyState {...empty} />

  return (
    <ul className={gridClass}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard
            product={p}
            onAdd={onAdd}
            inCartQuantity={cart?.[p.id]}
            priority={i < priorityCount}
          />
        </li>
      ))}
    </ul>
  )
}
