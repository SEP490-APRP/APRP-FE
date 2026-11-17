import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowUpDown,
  Leaf,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from 'lucide-react'
import freshFarmerBanner from '../assets/fresh-farmer-banner.jpg'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import Pagination from '@/components/ui/Pagination'
import {
  CATEGORIES,
  DEFAULT_FILTERS,
  FilterPanel,
  PRICE_RANGES,
  REGIONS,
  countActiveFilters,
  filtersFromHash,
  ProductGrid,
  useAllProducts,
  useCategories,
  type Filters,
} from '@/features/product'
import { cn } from '@/utils'

type Cart = {
  items?: Readonly<Record<string, number>>
}

function getProduceRegion(address?: string): string {
  if (!address) return 'Đà Lạt'
  const a = address.toLowerCase()
  if (a.includes('đà lạt') || a.includes('lâm đồng')) return 'Đà Lạt'
  if (a.includes('gia lai')) return 'Gia Lai'
  if (a.includes('bến tre')) return 'Bến Tre'
  if (a.includes('đắk lắk')) return 'Đắk Lắk'
  if (a.includes('tiền giang') || a.includes('đồng tháp') || a.includes('miền tây')) return 'Bến Tre'
  return 'Đà Lạt'
}

const PAGE_SIZE = 16

const SORT_OPTIONS = [
  { id: 'featured', label: 'Phổ biến nhất' },
  { id: 'harvested', label: 'Mới thu hoạch' },
  { id: 'price-asc', label: 'Giá: Thấp đến Cao' },
  { id: 'price-desc', label: 'Giá: Cao đến Thấp' },
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: apiCategories = [] } = useCategories()
  const [filters, setFilters] = useState<Filters>(() => filtersFromHash())

  // Bấm danh mục khác ở trang chủ/menu khi đang ở trang này: cập nhật bộ lọc theo URL & searchParams
  useEffect(() => {
    const kw = searchParams.get('keyword')
    if (kw && kw !== query) {
      setQuery(kw)
    }

    const catId = searchParams.get('categoryId')
    const danhMuc = searchParams.get('danh-muc')

    if (catId) {
      const catIdNum = Number(catId)
      const foundCat = apiCategories.find((c) => c.categoryId === catIdNum)
      if (foundCat) {
        setFilters((prev) => ({ ...prev, category: foundCat.name }))
      }
    } else if (danhMuc) {
      const match = CATEGORIES.find((c) => c.slug === danhMuc)
      if (match) setFilters((prev) => ({ ...prev, category: match.id }))
    }

    const sync = () => {
      if (location.hash.includes('danh-muc=')) setFilters(filtersFromHash())
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [searchParams, apiCategories])

  const [sort, setSort] = useState<SortId>('featured')
  const [currentPage, setCurrentPage] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const {
    data: apiProducts = [],
    isLoading: isProductsLoading,
    error: productsError,
    refetch,
  } = useAllProducts()

  // Tự động quay về trang 1 khi thay đổi bộ lọc, từ khóa tìm kiếm hoặc kiểu sắp xếp
  useEffect(() => {
    setCurrentPage(0)
  }, [filters, sort, query])

  const items = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.id === filters.price)
    const min = range && 'min' in range ? range.min : 0
    const max = range && 'max' in range ? range.max : Number.POSITIVE_INFINITY

    if (!apiProducts || apiProducts.length === 0) {
      return []
    }

    let filtered = apiProducts.map((p) => {
      const price = p.sellingPrice ?? p.price ?? 0
      const original = p.discountPercent
        ? Math.round(price / (1 - p.discountPercent / 100))
        : price
      const image = p.primaryImageUrl || p.imageUrl || p.image || ''
      const catName =
        typeof p.category === 'object' && p.category
          ? p.category.name
          : typeof p.category === 'string'
            ? p.category
            : 'Rau củ'

      return {
        id: String(p.productId || p.id),
        name: p.productName || p.name || 'Nông sản',
        price,
        original,
        image,
        category: catName,
        farm: p.shop?.shopName || 'Nhà vườn CapNong',
        region: getProduceRegion(p.shop?.address),
        flaw: 'Ngoại hình tự nhiên',
        score: 96,
        stock: p.stockQuantity ?? p.stock ?? 0,
        rescued: 50,
        unit: p.unit || 'kg',
      }
    })

    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q))
    }

    if (filters.category && filters.category !== 'Tất cả') {
      filtered = filtered.filter(
        (p) =>
          p.category.toLowerCase().includes(filters.category.toLowerCase()) ||
          filters.category.toLowerCase().includes(p.category.toLowerCase()),
      )
    }

    filtered = filtered.filter((p) => p.price >= min && p.price <= max)

    if (filters.region !== 'all') {
      filtered = filtered.filter(
        (p) => p.region === filters.region || p.region.includes(filters.region),
      )
    }

    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price)
    else if (sort === 'harvested') filtered.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    else if (sort === 'featured') filtered.sort((a, b) => (b.rescued ?? 0) - (a.rescued ?? 0))

    return filtered
  }, [query, filters, sort, apiProducts])

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pagedItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return items.slice(start, start + PAGE_SIZE)
  }, [items, currentPage])

  const category =
    CATEGORIES.find((c) => c.id === filters.category) ?? {
      id: filters.category,
      label: filters.category,
      bannerTitle: filters.category,
    }

  const activeCount = countActiveFilters(filters) + (query.trim() ? 1 : 0)

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
    setSort('featured')
    setQuery('')
    setCurrentPage(0)
  }

  // Chip cho từng bộ lọc đang bật, bấm để gỡ riêng lẻ
  type ChipItem = { key: keyof Filters; label: string }
  const chips: ChipItem[] = []
  if (filters.category !== 'Tất cả') chips.push({ key: 'category', label: category.label })
  if (filters.price !== 'all') {
    const pLabel = PRICE_RANGES.find((r) => r.id === filters.price)?.label
    if (pLabel) chips.push({ key: 'price', label: pLabel })
  }
  if (filters.region !== 'all') {
    const rLabel = REGIONS.find((r) => r.id === filters.region)?.label
    if (rLabel) chips.push({ key: 'region', label: rLabel })
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* 1. Top Fresh Produce Hero Banner (Synchronized Centered Design) */}
      <div className="relative w-full h-72 sm:h-84 md:h-96 lg:h-[380px] overflow-hidden flex items-center justify-center text-center shadow-lg">
        <img
          src={freshFarmerBanner}
          alt="Bà con nông dân vui mừng thu hoạch nông sản tươi xanh"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
        />
        {/* Dark Vignette Overlay for maximum readability & clear imagery */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35"
          aria-hidden
        />
        {/* Dynamic Title & Breadcrumb */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-3 px-4">
          <nav
            aria-label="Breadcrumb"
            className="text-caption font-medium text-white/85 sm:text-sm"
          >
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  to="/"
                  className="rounded hover:text-sun-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sun-300"
                >
                  Trang chủ
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li aria-current="page" className="font-bold text-sun-300">
                {category.label}
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl">
            {category.bannerTitle}
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-white/85 drop-shadow sm:text-sm md:text-base">
            Thu hoạch trong ngày từ các nông hộ và hợp tác xã liên kết, giữ trọn độ tươi giòn và
            dinh dưỡng tự nhiên.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          {/* Sidebar chỉ hiện từ lg trở lên; mobile/tablet dùng Drawer */}
          <aside aria-label="Bộ lọc sản phẩm" className="hidden lg:block">
            <div className="sticky top-[88px] max-h-[calc(100vh-104px)] overflow-y-auto rounded-xl border border-line bg-white p-5 shadow-card">
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

          <section id="fresh-results-section" aria-labelledby="fresh-results" className="flex min-w-0 flex-col gap-4 sm:gap-6">
            {/* Toolbar trên lưới sản phẩm: Bên trái là Số lượng + Chips; Bên phải là Dropdown Sắp xếp theo */}
            <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
              {/* Bên trái: Số lượng kết quả + Tag bộ lọc đang áp dụng + Nút xóa tất cả */}
              <div className="flex flex-wrap items-center gap-2">
                <div id="fresh-results" className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <span>Tìm thấy</span>
                  <strong className="text-base font-extrabold text-[#326318]">{items.length}</strong>
                  <span>nông sản phù hợp</span>
                </div>

                {chips.length > 0 && (
                  <>
                    <div className="hidden h-4 w-px bg-line/80 sm:block mx-0.5" aria-hidden />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {chips.map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() =>
                            setFilters((f) => ({ ...f, [chip.key]: DEFAULT_FILTERS[chip.key] }))
                          }
                          className="inline-flex h-7 items-center gap-1 rounded-full border border-leaf-200 bg-leaf-50 pl-2.5 pr-1.5 text-[11px] font-bold text-leaf-800 transition-colors hover:bg-leaf-100"
                          aria-label={`Bỏ lọc ${chip.label}`}
                        >
                          {chip.label}
                          <X size={12} aria-hidden />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={resetAll}
                        className="ml-1 cursor-pointer text-[11px] font-semibold text-ink-muted underline hover:text-[#326318]"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bên phải: Nút mở bộ lọc mobile & Dropdown Sắp xếp theo */}
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 lg:hidden"
                  onClick={() => setFiltersOpen(true)}
                  leftIcon={<SlidersHorizontal size={14} aria-hidden />}
                  aria-label={`Mở bộ lọc${activeCount ? `, ${activeCount} đang bật` : ''}`}
                >
                  <span>Bộ lọc</span>
                  {activeCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-leaf-700 px-1 text-[10px] text-white">
                      {activeCount}
                    </span>
                  )}
                </Button>

                <div className="ml-auto flex items-center gap-2 sm:ml-0">
                  <label
                    htmlFor="sort-select"
                    className="hidden whitespace-nowrap text-xs font-medium text-ink-muted sm:inline-block"
                  >
                    Sắp xếp theo:
                  </label>
                  <div className="relative">
                    <select
                      id="sort-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortId)}
                      className="h-9 cursor-pointer appearance-none rounded-lg border border-line bg-white pl-3.5 pr-8 text-xs font-bold text-ink shadow-2xs hover:border-leaf-600 focus:border-leaf-600 focus:outline-none focus:ring-1 focus:ring-leaf-600"
                    >
                      {SORT_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ArrowUpDown
                      size={13}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>

            <ProductGrid
              products={pagedItems}
              onAdd={onAdd}
              columns="wide"
              status={isProductsLoading ? 'loading' : productsError ? 'error' : 'success'}
              error={productsError ? 'Không thể kết nối máy chủ để tải nông sản. Vui lòng bấm thử lại.' : undefined}
              onRetry={() => refetch()}
              cart={cart?.items}
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

            {/* Phân trang: Giới hạn 16 sản phẩm/trang (lưới 4x4) */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-xl border border-line bg-white p-4 shadow-xs sm:flex-row">
                <p className="text-xs text-ink-muted sm:text-sm">
                  Hiển thị{' '}
                  <strong className="font-bold text-ink">
                    {currentPage * PAGE_SIZE + 1}–
                    {Math.min((currentPage + 1) * PAGE_SIZE, items.length)}
                  </strong>{' '}
                  trong tổng số <strong className="font-bold text-ink">{items.length}</strong> nông sản
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page)
                    const el = document.getElementById('fresh-results-section')
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    } else {
                      window.scrollTo({ top: 380, behavior: 'smooth' })
                    }
                  }}
                />
              </div>
            )}

            <aside className="relative mt-4 flex flex-col items-center justify-between gap-5 overflow-hidden rounded-xl bg-gradient-to-r from-leaf-800 to-leaf-900 p-6 text-center text-white shadow-card sm:flex-row sm:p-8 sm:text-left">
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
                onClick={() => navigate('/ke-hoach-an-uong')}
                leftIcon={<Sparkles size={16} aria-hidden />}
              >
                AI gợi ý thực đơn
              </Button>
            </aside>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, text, tone }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-card"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
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
