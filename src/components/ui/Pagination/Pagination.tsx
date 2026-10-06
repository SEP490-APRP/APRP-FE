import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/utils'

export interface PageInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

/** Hoặc truyền pageInfo từ API, hoặc truyền currentPage + totalPages. Không cho phép trộn. */
type PaginationProps = {
  onPageChange: (page: number) => void
  className?: string
} & (
  | { pageInfo: PageInfo | null | undefined; currentPage?: never; totalPages?: never }
  | { pageInfo?: never; currentPage: number; totalPages: number }
)

type PageItem = { type: 'page'; page: number } | { type: 'gap'; key: string }

/** Tách khỏi component để dễ viết unit test. Trang đánh số từ 0. */
export function getPageItems(current: number, total: number, siblings = 1): PageItem[] {
  if (total <= 5 + siblings * 2)
    return Array.from({ length: total }, (_, page) => ({ type: 'page', page }))
  let start = Math.max(1, Math.min(current - siblings, total - 2 - siblings * 2 - 1))
  let end = Math.min(total - 2, Math.max(current + siblings, siblings * 2 + 2))
  // Dấu … chỉ thay cho từ 2 trang trở lên; thiếu đúng 1 trang thì hiện luôn trang đó
  if (start === 2) start = 1
  if (end === total - 3) end = total - 2
  const items: PageItem[] = [{ type: 'page', page: 0 }]
  if (start > 1) items.push({ type: 'gap', key: 'start' })
  for (let page = start; page <= end; page++) items.push({ type: 'page', page })
  if (end < total - 2) items.push({ type: 'gap', key: 'end' })
  items.push({ type: 'page', page: total - 1 })
  return items
}

const navBtn =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors ' +
  'hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600'

export default function Pagination(props: PaginationProps) {
  const { onPageChange, className } = props
  const current = props.pageInfo ? props.pageInfo.page : (props.currentPage ?? 0)
  const total = props.pageInfo ? props.pageInfo.totalPages : (props.totalPages ?? 1)

  if (total <= 1) return null

  const isFirst = current <= 0
  const isLast = current >= total - 1

  return (
    <nav
      aria-label="Phân trang"
      className={cn(
        'flex flex-col items-center gap-3 px-2 py-3 sm:flex-row sm:justify-between',
        className,
      )}
    >
      {props.pageInfo && (
        <p className="text-caption text-ink-muted">
          Trang <strong className="text-ink">{current + 1}</strong> /{' '}
          <strong className="text-ink">{total}</strong> ({props.pageInfo.totalElements} mục)
        </p>
      )}
      <ul className="flex items-center gap-1 sm:ml-auto">
        <li className="hidden sm:block">
          <button
            type="button"
            className={navBtn}
            onClick={() => onPageChange(0)}
            disabled={isFirst}
            aria-label="Trang đầu"
          >
            <ChevronsLeft size={16} aria-hidden />
          </button>
        </li>
        <li>
          <button
            type="button"
            className={navBtn}
            onClick={() => onPageChange(current - 1)}
            disabled={isFirst}
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
        </li>
        {getPageItems(current, total).map((item) =>
          item.type === 'gap' ? (
            <li key={item.key} aria-hidden className="px-1 text-caption text-ink-subtle">
              …
            </li>
          ) : (
            <li key={item.page}>
              <button
                type="button"
                onClick={() => onPageChange(item.page)}
                aria-current={item.page === current ? 'page' : undefined}
                aria-label={`Trang ${item.page + 1}`}
                className={cn(
                  'h-9 min-w-9 rounded-lg px-2 text-caption font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600',
                  item.page === current
                    ? 'bg-leaf-700 text-white'
                    : 'border border-line text-ink hover:bg-paper',
                )}
              >
                {item.page + 1}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={navBtn}
            onClick={() => onPageChange(current + 1)}
            disabled={isLast}
            aria-label="Trang sau"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </li>
        <li className="hidden sm:block">
          <button
            type="button"
            className={navBtn}
            onClick={() => onPageChange(total - 1)}
            disabled={isLast}
            aria-label="Trang cuối"
          >
            <ChevronsRight size={16} aria-hidden />
          </button>
        </li>
      </ul>
    </nav>
  )
}
