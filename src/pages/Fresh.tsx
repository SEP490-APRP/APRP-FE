import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Leaf,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from 'lucide-react'
import { filterProducts, type Cart } from '@/mocks/catalog'
import freshFarmerBanner from '../assets/fresh-farmer-banner.jpg'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import {
  AI_SCORES,
  CATEGORIES,
  DEFAULT_FILTERS,
  FilterPanel,
  PRICE_RANGES,
  REGIONS,
  countActiveFilters,
  filtersFromHash,
  ProductGrid,
  type Filters,
} from '@/features/product'
import { cn } from '@/utils'

const SORT_OPTIONS = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'best-selling', label: 'Bán chạy' },
  { id: 'price-asc', label: 'Giá tăng dần' },
  { id: 'price-desc', label: 'Giá giảm dần' },
  { id: 'name-asc', label: 'Tên A-Z' },
] as const
type SortId = (typeof SORT_OPTIONS)[number]['id']

type FreshProps = {
  query: string
  setQuery: (value: string) => void
  onAdd: (id: string) => void
  onInfo: (title: string) => void
  /** Tùy chọn: truyền giỏ hàng để card hiện "Trong giỏ: n". */
  cart?: Cart
}

const HIGHLIGHTS = [
  {
    icon: Leaf,
    title: 'AI thẩm định độ tươi',
    text: 'Minh bạch điểm độ tươi trên từng lô hàng.',
    tone: 'bg-leaf-50 text-leaf-600',
  },
  {
    icon: MapPin,
    title: 'Trực tiếp từ nhà vườn',
    text: 'Biết rõ người trồng và nhật ký canh tác.',
    tone: 'bg-sun-100 text-soil-600',
  },
  {
    icon: Truck,
    title: 'Giao nhanh 2–4 giờ',
    text: 'Đóng thùng tái chế, giữ trọn độ giòn ngọt.',
    tone: 'bg-sky-50 text-sky-700',
  },
] as const

export default function Fresh({ query, setQuery, onAdd, onInfo, cart }: FreshProps) {
  const [filters, setFilters] = useState<Filters>(() => filtersFromHash())

  // Bấm danh mục khác ở trang chủ/menu khi đang ở trang này: cập nhật bộ lọc theo URL
  useEffect(() => {
    const sync = () => {
      if (location.hash.includes('danh-muc=')) setFilters(filtersFromHash())
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const [sort, setSort] = useState<SortId>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const items = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.id === filters.price)
    const min = range && 'min' in range ? range.min : 0
    const max = range && 'max' in range ? range.max : Number.POSITIVE_INFINITY
    return filterProducts(query, filters.category, sort).filter(
      (p) =>
        p.price >= min &&
        p.price <= max &&
        (filters.region === 'all' || p.region.includes(filters.region)) &&
        p.score >= filters.minScore,
    )
  }, [query, filters, sort])

  const activeCount = countActiveFilters(filters) + (query.trim() ? 1 : 0)
  const category = CATEGORIES.find((c) => c.id === filters.category) ?? CATEGORIES[0]

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
    setSort('featured')
    setQuery('')
  }

  // Chip cho từng bộ lọc đang bật, bấm để gỡ riêng lẻ
  const chips = [
    filters.category !== 'Tất cả' && { key: 'category', label: category.label },
    filters.price !== 'all' && {
      key: 'price',
      label: PRICE_RANGES.find((r) => r.id === filters.price)?.label,
    },
    filters.region !== 'all' && {
      key: 'region',
      label: REGIONS.find((r) => r.id === filters.region)?.label,
    },
    filters.minScore !== 0 && {
      key: 'minScore',
      label: `AI ${AI_SCORES.find((s) => s.id === filters.minScore)?.label}`,
    },
  ].filter((c): c is { key: keyof Filters; label: string } => Boolean(c && c.label))

  return (
    <div className="min-h-screen bg-paper">
      {/* Banner: thấp hơn trên mobile để sản phẩm xuất hiện sớm hơn */}
      <header className="relative flex h-52 items-center justify-center overflow-hidden text-center sm:h-72 lg:h-80">
        <img
          src={freshFarmerBanner}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-3 px-4">
          <nav
            aria-label="Breadcrumb"
            className="text-caption font-medium text-white/85 sm:text-sm"
          >
            <ol className="flex items-center gap-2">
              <li>
                <a
                  href="#/"
                  className="rounded hover:text-sun-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sun-300"
                >
                  Trang chủ
                </a>
              </li>
              <li aria-hidden>›</li>
              <li aria-current="page" className="font-bold text-sun-300">
                {category.label}
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {category.bannerTitle}
          </h1>
          <p className="hidden max-w-xl text-sm leading-relaxed text-white/85 sm:block md:text-base">
            Thu hoạch trong ngày từ các nông hộ và hợp tác xã liên kết, giữ trọn độ tươi giòn và
            dinh dưỡng tự nhiên.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          {/* Sidebar chỉ hiện từ lg trở lên; mobile/tablet dùng Drawer */}
          <aside aria-label="Bộ lọc sản phẩm" className="hidden lg:block">
            <div className="sticky top-24 rounded-panel border border-line bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-ink">Bộ lọc</h2>
                {activeCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAll}
                    leftIcon={<RotateCcw size={14} aria-hidden />}
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>
              <FilterPanel idPrefix="sidebar" filters={filters} onChange={setFilters} />
            </div>
          </aside>

          <section aria-labelledby="fresh-results" className="flex min-w-0 flex-col gap-4 sm:gap-6">
            {/* Toolbar: dính đầu trang trên mobile để luôn lọc/tìm được */}
            <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-panel sm:border sm:bg-white sm:p-3 sm:shadow-card lg:static">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <label htmlFor="fresh-search" className="sr-only">
                    Tìm nông sản
                  </label>
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                    aria-hidden
                  />
                  <input
                    id="fresh-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm theo tên, nhà vườn, vùng trồng…"
                    className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-10 text-sm text-ink placeholder:text-ink-subtle focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/30"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Xóa từ khóa"
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle hover:bg-paper hover:text-ink"
                    >
                      <X size={16} aria-hidden />
                    </button>
                  )}
                </div>
                <Button
                  variant="secondary"
                  className="lg:hidden"
                  onClick={() => setFiltersOpen(true)}
                  leftIcon={<SlidersHorizontal size={16} aria-hidden />}
                  aria-label={`Mở bộ lọc${activeCount ? `, ${activeCount} đang bật` : ''}`}
                >
                  <span className="hidden sm:inline">Bộ lọc</span>
                  {activeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-leaf-700 px-1 text-caption text-white">
                      {activeCount}
                    </span>
                  )}
                </Button>
              </div>

              <div
                className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]"
                role="group"
                aria-label="Sắp xếp"
              >
                <ArrowUpDown size={15} className="shrink-0 text-leaf-600" aria-hidden />
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={sort === s.id}
                    onClick={() => setSort(s.id)}
                    className={cn(
                      'h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-caption font-bold transition-colors',
                      sort === s.id
                        ? 'border-leaf-700 bg-leaf-700 text-white'
                        : 'border-line bg-white text-ink-muted hover:border-leaf-600 hover:text-leaf-700',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h2 id="fresh-results" className="mr-auto text-sm text-ink-muted" aria-live="polite">
                <strong className="text-ink">{items.length}</strong> nông sản phù hợp
              </h2>
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, [chip.key]: DEFAULT_FILTERS[chip.key] }))
                  }
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-leaf-200 bg-leaf-50 pl-3 pr-2 text-caption font-bold text-leaf-800 hover:bg-leaf-100"
                  aria-label={`Bỏ lọc ${chip.label}`}
                >
                  {chip.label}
                  <X size={13} aria-hidden />
                </button>
              ))}
            </div>

            <ProductGrid
              products={items}
              onAdd={onAdd}
              cart={cart}
              priorityCount={4}
              empty={{
                title: 'Không tìm thấy nông sản phù hợp',
                description: query
                  ? `Không có kết quả cho “${query}”. Thử từ khóa khác hoặc bỏ bớt bộ lọc.`
                  : 'Thử bỏ bớt bộ lọc để xem thêm nông sản.',
                action: (
                  <Button onClick={resetAll} leftIcon={<RotateCcw size={16} aria-hidden />}>
                    Xóa tất cả bộ lọc
                  </Button>
                ),
              }}
            />

            <aside className="relative mt-4 flex flex-col items-center justify-between gap-5 overflow-hidden rounded-panel bg-gradient-to-r from-leaf-800 to-leaf-900 p-6 text-center text-white shadow-card sm:flex-row sm:p-8 sm:text-left">
              <div className="flex flex-col gap-1.5">
                <span className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-caption font-bold text-sun-300 sm:mx-0">
                  <Sparkles size={13} aria-hidden /> Trợ lý thực đơn AI
                </span>
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Chưa biết nấu món gì hôm nay?
                </h2>
                <p className="max-w-md text-sm text-white/85">
                  CapNongAI gợi ý công thức dựa trên rau củ trong giỏ của bạn.
                </p>
              </div>
              <Button
                variant="accent"
                size="lg"
                onClick={() => onInfo('AI gợi ý thực đơn')}
                leftIcon={<Sparkles size={16} aria-hidden />}
              >
                AI gợi ý thực đơn
              </Button>
            </aside>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, text, tone }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-card border border-line bg-white p-4 shadow-card"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      tone,
                    )}
                    aria-hidden
                  >
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{title}</h3>
                    <p className="mt-0.5 text-caption leading-relaxed text-ink-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <Drawer
        open={filtersOpen}
        title="Bộ lọc sản phẩm"
        onClose={() => setFiltersOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={resetAll}>
              Đặt lại
            </Button>
            <Button className="flex-[2]" onClick={() => setFiltersOpen(false)}>
              Xem {items.length} sản phẩm
            </Button>
          </div>
        }
      >
        <FilterPanel idPrefix="drawer" filters={filters} onChange={setFilters} />
      </Drawer>
    </div>
  )
}
