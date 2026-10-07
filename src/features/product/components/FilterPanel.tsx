import { Check } from 'lucide-react'
import { cn } from '@/utils'

/* ------------------------------------------------------------------ */
/* Kiểu dữ liệu bộ lọc: union type thay cho string tự do               */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  { id: 'Tất cả', slug: 'tat-ca', label: 'Tất cả nông sản', bannerTitle: 'Tất cả sản phẩm' },
  { id: 'Rau ăn lá', slug: 'rau-an-la', label: 'Rau ăn lá', bannerTitle: 'Rau ăn lá tươi sạch' },
  { id: 'Củ quả', slug: 'cu-qua', label: 'Củ quả vườn', bannerTitle: 'Củ quả vườn tự nhiên' },
  { id: 'Trái cây', slug: 'trai-cay', label: 'Trái cây', bannerTitle: 'Trái cây theo mùa' },
  { id: 'Hữu cơ', slug: 'huu-co', label: 'Hữu cơ', bannerTitle: 'Nông sản hữu cơ' },
  { id: 'Đà Lạt', slug: 'da-lat', label: 'Đặc sản Đà Lạt', bannerTitle: 'Nông sản Đà Lạt' },
] as const
export type CategoryId = (typeof CATEGORIES)[number]['id']

export const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá' },
  { id: 'under20', label: 'Dưới 20.000đ', max: 19_999 },
  { id: '20to30', label: '20.000đ – 30.000đ', min: 20_000, max: 30_000 },
  { id: 'over30', label: 'Trên 30.000đ', min: 30_001 },
] as const satisfies readonly { id: string; label: string; min?: number; max?: number }[]
export type PriceRangeId = (typeof PRICE_RANGES)[number]['id']

export const REGIONS = [
  { id: 'all', label: 'Tất cả vùng trồng' },
  { id: 'Đà Lạt', label: 'Đà Lạt (Lâm Đồng)' },
  { id: 'Gia Lai', label: 'Gia Lai' },
  { id: 'Bến Tre', label: 'Bến Tre' },
  { id: 'Đắk Lắk', label: 'Đắk Lắk' },
] as const
export type RegionId = (typeof REGIONS)[number]['id']

export const AI_SCORES = [
  { id: 0, label: 'Tất cả điểm AI' },
  { id: 95, label: 'Từ 95% trở lên' },
] as const
export type MinScore = (typeof AI_SCORES)[number]['id']

export type Filters = {
  category: CategoryId
  price: PriceRangeId
  region: RegionId
  minScore: MinScore
}

export const DEFAULT_FILTERS: Filters = {
  category: 'Tất cả',
  price: 'all',
  region: 'all',
  minScore: 0,
}

/** Đọc danh mục từ URL, VD: #/nong-san-tuoi?danh-muc=rau-an-la (link từ trang chủ). */
export function filtersFromHash(hash: string = location.hash): Filters {
  const slug = new URLSearchParams(hash.split('?')[1] ?? '').get('danh-muc')
  const category = CATEGORIES.find((c) => c.slug === slug)?.id ?? DEFAULT_FILTERS.category
  return { ...DEFAULT_FILTERS, category }
}

export function countActiveFilters(f: Filters): number {
  return (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter(
    (k) => f[k] !== DEFAULT_FILTERS[k],
  ).length
}

/* ------------------------------------------------------------------ */
/* Nhóm radio dùng chung: fieldset + legend cho trình đọc màn hình     */
/* ------------------------------------------------------------------ */

type Option<T extends string | number> = { readonly id: T; readonly label: string }

function RadioGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string
  name: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-2 text-caption font-bold uppercase tracking-wider text-ink-muted">
        {legend}
      </legend>
      {options.map((o) => {
        const checked = o.id === value
        return (
          <label
            key={String(o.id)}
            className={cn(
              'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm transition-colors',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-leaf-600',
              checked ? 'bg-leaf-50 font-bold text-leaf-800' : 'text-ink-muted hover:bg-paper',
            )}
          >
            <input
              type="radio"
              name={name}
              checked={checked}
              onChange={() => onChange(o.id)}
              className="h-4 w-4 accent-leaf-600"
            />
            <span className="flex-1">{o.label}</span>
            {checked && <Check size={15} className="text-leaf-600" aria-hidden />}
          </label>
        )
      })}
    </fieldset>
  )
}

/* ------------------------------------------------------------------ */
/* Panel: dùng chung cho sidebar desktop và drawer mobile              */
/* ------------------------------------------------------------------ */

export function FilterPanel({
  idPrefix,
  filters,
  onChange,
}: {
  /** name của radio phải khác nhau giữa sidebar và drawer vì cả hai cùng nằm trong DOM. */
  idPrefix: string
  filters: Filters
  onChange: (next: Filters) => void
}) {
  const set =
    <K extends keyof Filters>(key: K) =>
    (value: Filters[K]) =>
      onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <RadioGroup
        legend="Danh mục"
        name={`${idPrefix}-category`}
        options={CATEGORIES}
        value={filters.category}
        onChange={set('category')}
      />
      <RadioGroup
        legend="Khoảng giá"
        name={`${idPrefix}-price`}
        options={PRICE_RANGES}
        value={filters.price}
        onChange={set('price')}
      />
      <RadioGroup
        legend="Vùng trồng"
        name={`${idPrefix}-region`}
        options={REGIONS}
        value={filters.region}
        onChange={set('region')}
      />
      <RadioGroup
        legend="Điểm chất lượng AI"
        name={`${idPrefix}-score`}
        options={AI_SCORES}
        value={filters.minScore}
        onChange={set('minScore')}
      />
    </div>
  )
}
