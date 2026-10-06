import type { HTMLAttributes } from 'react'
import { cn } from '@/utils'

/**
 * Khối placeholder có hiệu ứng shimmer. Tự tắt animation khi người dùng
 * bật "giảm chuyển động" (motion-reduce).
 */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-lg bg-leaf-100/70',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
        'motion-reduce:before:hidden',
        className,
      )}
      {...rest}
    />
  )
}

/** Các dòng chữ giả, dòng cuối ngắn hơn cho tự nhiên. */
export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/** Hàng bảng giả cho các trang admin, thay cho spinner chiếm cả trang. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-label="Đang tải dữ liệu" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="grid gap-4 px-4 py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-3/4' : 'w-1/2')} />
          ))}
        </div>
      ))}
      <span className="sr-only">Đang tải dữ liệu…</span>
    </div>
  )
}
