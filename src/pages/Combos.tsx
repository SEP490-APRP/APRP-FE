import { useState } from 'react'
import {
  Gift,
  ArrowRight,
  Check,
  Leaf,
  Sparkles,
  ShoppingBasket,
  ArrowUpDown,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import { products, money } from '@/mocks/catalog'
import { LegacyProduceImage } from '@/features/product'
import comboHeroBanner from '../assets/combo-hero-banner.jpg'
import comboMysteryImg from '../assets/combo-mystery.jpg'
import comboGreenImg from '../assets/combo-green.jpg'
import comboKitchenImg from '../assets/combo-kitchen.jpg'
import comboHotpotImg from '../assets/combo-hotpot.jpg'

interface CombosProps {
  onAdd: (s: string) => void
  onInfo: (s: string) => void
}

interface ComboItem {
  id: string
  name: string
  image: string
  badgeDiscount: string
  badgeWeight: string
  badgeHighlight: string
  category: string
  portion: string
  feature: string
  price: number
  original: number
  unit: string
  rating: number
  reviews: number
  sold: number
  stock: number
}

const ALL_COMBOS: ComboItem[] = [
  {
    id: 'mystery',
    name: 'Túi Mù Nông Sản Thần Bí (Mystery Box)',
    image: comboMysteryImg,
    badgeDiscount: '-60%',
    badgeWeight: '5kg ngẫu nhiên',
    badgeHighlight: 'Tiết kiệm 120k',
    category: 'Túi mù',
    portion: 'Gia đình 2–3 người',
    feature: 'Gồm 5–6 loại rau lá, củ hầm & quả tươi ngẫu nhiên thu hoạch sáng sớm',
    price: 79000,
    original: 199000,
    unit: 'túi',
    rating: 4.9,
    reviews: 348,
    sold: 348,
    stock: 35,
  },
  {
    id: 'green',
    name: 'Combo Rau Xanh 5 Bữa Gia Đình',
    image: comboGreenImg,
    badgeDiscount: '-43%',
    badgeWeight: '6kg rau củ',
    badgeHighlight: 'Bán chạy nhất',
    category: 'Gia đình',
    portion: 'Gia đình 3–4 người',
    feature: 'Cải bó xôi, mồng tơi, cà rốt, bí đỏ & đậu cô ve thanh mát cả tuần',
    price: 139000,
    original: 245000,
    unit: 'combo',
    rating: 4.8,
    reviews: 215,
    sold: 215,
    stock: 28,
  },
  {
    id: 'kitchen',
    name: 'Thùng Bếp Xanh Củ Quả 10kg',
    image: comboKitchenImg,
    badgeDiscount: '-37%',
    badgeWeight: '10kg tổng hợp',
    badgeHighlight: 'Tiết kiệm 131k',
    category: 'Thùng lớn',
    portion: 'Quán ăn & Bếp tập thể',
    feature: 'Khoai lang, củ dền, bí đỏ, bắp cải & cà chua chất lượng chuẩn bếp nấu',
    price: 219000,
    original: 350000,
    unit: 'thùng',
    rating: 4.9,
    reviews: 182,
    sold: 182,
    stock: 15,
  },
  {
    id: 'hotpot',
    name: 'Combo Lẩu Nấm & Rau Vườn Cuối Tuần',
    image: comboHotpotImg,
    badgeDiscount: '-32%',
    badgeWeight: '4.5kg rau nấm',
    badgeHighlight: 'Món ngon sum vầy',
    category: 'Cuối tuần',
    portion: 'Nhóm 4–6 người',
    feature: 'Nấm đùi gà, ngô ngọt, rau muống chẻ, cải thảo & nấm bào ngư xám',
    price: 149000,
    original: 220000,
    unit: 'combo',
    rating: 4.9,
    reviews: 164,
    sold: 164,
    stock: 20,
  },
]

const COMBO_CATEGORIES = [
  {
    id: 'all',
    label: 'Tất cả combo & túi mù',
    bannerTitle: 'Combo & Túi Mù Nông Sản',
    breadcrumb: 'Combo & Túi mù',
  },
  {
    id: 'mystery',
    label: 'Túi mù Mystery Box (79k)',
    bannerTitle: 'Túi Mù Nông Sản May Mắn',
    breadcrumb: 'Túi mù nông sản',
  },
  {
    id: 'family',
    label: 'Combo rau củ gia đình',
    bannerTitle: 'Combo Rau Củ Gia Đình',
    breadcrumb: 'Combo gia đình',
  },
  {
    id: 'bulk',
    label: 'Thùng lớn 10kg quán ăn',
    bannerTitle: 'Thùng Bếp Lớn 10kg',
    breadcrumb: 'Thùng lớn 10kg',
  },
  {
    id: 'custom',
    label: 'Tự thiết kế combo theo ý',
    bannerTitle: 'Tự Thiết Kế Combo Cá Nhân',
    breadcrumb: 'Tự thiết kế combo',
  },
]

const SORT_OPTIONS = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'price-asc', label: 'Giá thấp đến cao' },
  { id: 'price-desc', label: 'Giá cao xuống thấp' },
  { id: 'discount', label: 'Tiết kiệm nhất' },
  { id: 'best-selling', label: 'Bán chạy' },
]

export default function Combos({ onAdd, onInfo }: CombosProps) {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [priceRange, setPriceRange] = useState('all')
  const [selected, setSelected] = useState<string[]>([])

  // Filter pipeline
  let filteredCombos = [...ALL_COMBOS]

  if (category === 'mystery') {
    filteredCombos = filteredCombos.filter((c) => c.id === 'mystery')
  } else if (category === 'family') {
    filteredCombos = filteredCombos.filter(
      (c) => c.category === 'Gia đình' || c.category === 'Cuối tuần',
    )
  } else if (category === 'bulk') {
    filteredCombos = filteredCombos.filter((c) => c.category === 'Thùng lớn')
  }

  if (priceRange === 'under100') {
    filteredCombos = filteredCombos.filter((c) => c.price < 100000)
  } else if (priceRange === '100to200') {
    filteredCombos = filteredCombos.filter((c) => c.price >= 100000 && c.price <= 200000)
  } else if (priceRange === 'over200') {
    filteredCombos = filteredCombos.filter((c) => c.price > 200000)
  }

  // Sort pipeline
  if (sort === 'price-asc') filteredCombos.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') filteredCombos.sort((a, b) => b.price - a.price)
  if (sort === 'best-selling') filteredCombos.sort((a, b) => b.sold - a.sold)
  if (sort === 'discount')
    filteredCombos.sort((a, b) => b.original - b.price - (a.original - a.price))

  const totalCustom = products
    .filter((p) => selected.includes(p.id))
    .reduce((s, p) => s + p.price, 0)

  const activeCategory = COMBO_CATEGORIES.find((c) => c.id === category) || COMBO_CATEGORIES[0]

  const handleResetFilters = () => {
    setCategory('all')
    setSort('featured')
    setPriceRange('all')
  }

  const hasActiveFilters = category !== 'all' || priceRange !== 'all'

  return (
    <div className="w-full bg-[#fdfcf9] min-h-screen">
      {/* 1. Top Combo & Mystery Box Hero Banner (Dedicated Artwork) */}
      <div className="relative w-full h-72 sm:h-84 md:h-96 lg:h-[380px] overflow-hidden flex items-center justify-center text-center shadow-lg">
        <img
          src={comboHeroBanner}
          alt="Hộp quà nông sản và các gói combo tươi xanh"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
        />
        {/* Dark Vignette Overlay for maximum readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />

        {/* Dynamic Title & Breadcrumb */}
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#ffea79] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Gift size={13} />
            <span>Mua Theo Gói Tiết Kiệm 30% - 60% · Thu Hoạch Trong Ngày</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg animate-fadeIn leading-tight">
            {activeCategory.bannerTitle}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/85 font-normal max-w-xl mx-auto leading-relaxed drop-shadow">
            Tiết kiệm chi phí đi chợ mỗi ngày, đón giỏ quà bất ngờ từ nông trại và giải cứu nông sản
            cùng CapNong.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white/90 font-medium mt-1 shadow-sm">
            <a href="#/" className="hover:text-[#ffea79] transition-colors">
              Trang chủ
            </a>
            <span className="text-white/40">›</span>
            <span className="text-[#ffea79] font-bold">{activeCategory.breadcrumb}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Body: Sidebar + Combos Grid + Builder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT SIDEBAR: Categories & Guarantees */}
          <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
            {/* Box 1: Danh Mục Combo */}
            <div className="bg-[#f2f9ed] border border-[#d6ebd0] rounded-2xl p-5 shadow-sm">
              <h2 className="text-base sm:text-lg font-black text-[#2b5619] pb-3.5 mb-2 border-b border-[#cfe6c8] flex items-center justify-between">
                <span>Danh Mục Combo</span>
                <Gift size={18} className="text-[#4a7c2f]" />
              </h2>

              <ul className="flex flex-col divide-y divide-[#e3f2dc]">
                {COMBO_CATEGORIES.map((c) => {
                  const isActive = category === c.id
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCategory(c.id)
                          if (c.id === 'custom') {
                            const el = document.getElementById('custom-builder')
                            el?.scrollIntoView({ behavior: 'smooth' })
                          }
                        }}
                        className={`w-full py-2.5 px-2 flex items-center justify-between text-left text-xs sm:text-sm font-semibold transition-all rounded-lg cursor-pointer ${
                          isActive
                            ? 'text-[#1e4412] bg-[#ddf0d4] font-bold pl-3'
                            : 'text-[#38482f] hover:text-[#1e4412] hover:bg-[#e8f5e2]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isActive && <Check size={14} className="text-[#4a7c2f]" />}
                          <span>{c.label}</span>
                        </span>
                        <Plus
                          size={15}
                          className={`transition-transform duration-200 ${
                            isActive ? 'rotate-45 text-[#2b5619]' : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Box 2: Bộ Lọc & Lợi Ích (Dashed Green Border Style) */}
            <div className="bg-white border-2 border-dashed border-[#4a7c2f]/40 rounded-2xl p-5 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h2 className="text-base font-black text-[#2b5619] flex items-center gap-2">
                  <Filter size={17} className="text-[#4a7c2f]" />
                  <span>Lọc Theo Mức Giá</span>
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Xóa tất cả bộ lọc"
                  >
                    <RotateCcw size={11} />
                    <span>Xóa lọc</span>
                  </button>
                )}
              </div>

              {/* Lọc theo giá combo */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1.5 text-xs text-gray-700">
                  {[
                    { id: 'all', label: 'Tất cả mức giá' },
                    { id: 'under100', label: 'Dưới 100.000đ (Túi mù 79k)' },
                    { id: '100to200', label: '100.000đ – 200.000đ' },
                    { id: 'over200', label: 'Trên 200.000đ (Thùng 10kg)' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 cursor-pointer hover:text-[#2b5619]"
                    >
                      <input
                        type="radio"
                        name="priceComboFilter"
                        checked={priceRange === p.id}
                        onChange={() => setPriceRange(p.id)}
                        className="accent-[#4a7c2f] cursor-pointer"
                      />
                      <span className={priceRange === p.id ? 'font-bold text-[#2b5619]' : ''}>
                        {p.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cam kết combo */}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Đặc quyền khi mua Combo
                </span>
                <ul className="flex flex-col gap-2 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-[#4a7c2f] shrink-0 mt-0.5" />
                    <span>Tiết kiệm 30% - 60% so với mua lẻ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-[#4a7c2f] shrink-0 mt-0.5" />
                    <span>Thu hoạch tươi sớm hái trong ngày</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-[#4a7c2f] shrink-0 mt-0.5" />
                    <span>Đổi trả 100% nếu nông sản hư hỏng</span>
                  </li>
                </ul>
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full mt-1 py-2.5 px-3 text-xs font-bold text-[#2b5619] bg-[#f0f8ec] hover:bg-[#4a7c2f] hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#cbe5c4]"
              >
                <RotateCcw size={13} />
                <span>Đặt lại tất cả bộ lọc</span>
              </button>
            </div>
          </aside>

          {/* RIGHT MAIN AREA: Sort Bar, Combo Cards, Custom Builder */}
          <main className="flex-1 min-w-0 w-full flex flex-col gap-8">
            {/* Top Toolbar: 1-Row Horizontal Sort Bar (Consistent with Fresh.tsx) */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                <div className="text-xs font-bold text-gray-700 flex items-center gap-1 shrink-0 pr-1">
                  <ArrowUpDown size={14} className="text-[#4a7c2f]" />
                  <span>Xếp theo:</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                  {SORT_OPTIONS.map((s) => {
                    const isSelected = sort === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSort(s.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all border whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-[#4a7c2f] text-white border-[#4a7c2f] shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#4a7c2f] hover:text-[#4a7c2f]'
                        }`}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Jump to Custom Builder */}
              <a
                href="#custom-builder"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f2f9ed] border border-[#cde5c3] text-[#2b5619] text-xs font-bold hover:bg-[#4a7c2f] hover:text-white transition-all shrink-0"
              >
                <SlidersHorizontal size={14} />
                <span>Tự thiết kế combo</span>
              </a>
            </div>

            {/* Active Summary */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>
                Hiển thị <strong className="text-gray-900">{filteredCombos.length}</strong> gói
                combo mùa vụ
              </span>
              {category !== 'all' && (
                <span className="bg-[#eef8ea] text-[#2b5619] font-bold px-2.5 py-0.5 rounded-full border border-[#d2ecc9]">
                  {activeCategory.label}
                </span>
              )}
            </div>

            {/* Combo Cards Grid (4 columns on lg, 2 on sm) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5 sm:gap-6">
              {filteredCombos.map((c) => (
                <article
                  key={c.id}
                  className="group bg-white rounded-3xl border border-gray-200/80 hover:border-[#4a7c2f]/60 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
                >
                  {/* Image & Badges */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <LegacyProduceImage
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Red Discount Badge */}
                    <div className="absolute top-3 left-3 bg-[#d92228] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                      {c.badgeDiscount}
                    </div>

                    {/* Weight & Highlight Pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="bg-black/60 backdrop-blur-md text-[#ffea79] text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                        {c.badgeWeight}
                      </span>
                    </div>

                    {/* Highlight Badge Bottom */}
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-white/95 backdrop-blur-md text-[#2b5619] text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        {c.badgeHighlight}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
                    {/* Portion & Category */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold text-[#4a7c2f] bg-[#eef8ea] px-2 py-0.5 rounded-md">
                        {c.category}
                      </span>
                      <span className="font-medium text-gray-600">{c.portion}</span>
                    </div>

                    {/* Name */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug group-hover:text-[#2b5619] transition-colors">
                      {c.name}
                    </h3>

                    {/* Feature description */}
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {c.feature}
                    </p>

                    {/* Price Row */}
                    <div className="flex items-baseline gap-2 mt-auto pt-2 border-t border-gray-100">
                      <strong className="text-lg sm:text-xl font-black text-[#2b5619]">
                        {money(c.price)}
                      </strong>
                      <del className="text-xs text-gray-400 font-normal">
                        {money(c.original)}/{c.unit}
                      </del>
                      <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Tiết kiệm {money(c.original - c.price)}
                      </span>
                    </div>

                    {/* Progress Bar & Stock */}
                    <div className="flex flex-col gap-1">
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4a7c2f] h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((c.sold / (c.sold + c.stock)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                        <span>Đã bán {c.sold} gói</span>
                        <span className="text-[#4a7c2f]">
                          Còn {c.stock} {c.unit}
                        </span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      type="button"
                      onClick={() => onAdd(c.id)}
                      className="w-full mt-1 py-2.5 px-4 bg-[#4a7c2f] hover:bg-[#3b6624] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShoppingBasket size={16} />
                      <span>{c.id === 'mystery' ? 'Thêm Túi Mù 79k' : 'Thêm Combo Vào Giỏ'}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* 3. Interactive Custom Combo Builder */}
            <section
              id="custom-builder"
              className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6 scroll-mt-28"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef8ea] text-[#2b5619] text-xs font-bold uppercase tracking-wider mb-1">
                    <SlidersHorizontal size={13} />
                    <span>Tự Thiết Kế Combo Cá Nhân</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                    Tự chọn nông sản cho tuần mới
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Mỗi loại nông sản được chọn tương ứng 1kg. Nhấp chọn loại rau củ bạn yêu thích:
                  </p>
                </div>

                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Bỏ chọn tất cả</span>
                  </button>
                )}
              </div>

              {/* Product Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p) => {
                  const isChosen = selected.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setSelected((s) =>
                          s.includes(p.id) ? s.filter((id) => id !== p.id) : [...s, p.id],
                        )
                      }
                      className={`flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isChosen
                          ? 'border-[#4a7c2f] bg-[#f0f8ec] shadow-md ring-2 ring-[#4a7c2f]/30'
                          : 'border-gray-200 bg-white hover:border-[#4a7c2f]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 bg-gray-100">
                        <LegacyProduceImage
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isChosen
                              ? 'bg-[#4a7c2f] text-white shadow-md'
                              : 'bg-black/30 text-transparent border border-white/60'
                          }`}
                        >
                          <Check size={14} />
                        </div>
                      </div>

                      <span className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</span>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <strong className="text-[#2b5619] font-bold">{money(p.price)}/kg</strong>
                        <span className="text-[10px] text-gray-500">{p.region}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Sticky / Floating Total Action Bar */}
              <div className="bg-[#1d4213] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/15 text-[#ffea79] flex items-center justify-center shrink-0">
                    <ShoppingBasket size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-white/75 font-medium">Giỏ tự thiết kế:</span>
                    <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>
                        {selected.length} món đã chọn ({selected.length} kg)
                      </span>
                      <span className="text-[#ffea79]">· {money(totalCustom)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selected.length}
                  onClick={() => {
                    selected.forEach(onAdd)
                    setSelected([])
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#ffea79] hover:bg-[#ffd84d] disabled:opacity-50 text-[#1d4213] rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <ShoppingBasket size={16} />
                  <span>Thêm Giỏ Vào Đơn Hàng</span>
                </button>
              </div>
            </section>

            {/* 4. Referral / Community Callout */}
            <div className="bg-gradient-to-r from-[#244e18] via-[#1d4213] to-[#14330d] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-white/10 relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#ffea79] text-xs font-bold w-fit mx-auto sm:mx-0">
                  <Sparkles size={13} />
                  <span>Cộng Đồng Tiêu Dùng Xanh</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Rủ bạn bè cùng giải cứu nông sản
                </h2>
                <p className="text-xs sm:text-sm text-white/80 max-w-md">
                  Nhận ngay Voucher 30.000đ cho mỗi người bạn giới thiệu thành công đơn hàng Combo
                  đầu tiên.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onInfo('Chương trình giới thiệu bạn bè')}
                className="relative z-10 shrink-0 bg-[#ffea79] hover:bg-[#ffd84d] text-[#1d4213] px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Khám phá chương trình</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* 5. Key Highlights (3 Benefit Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#fef7e0] text-[#ca8a04] flex items-center justify-center shrink-0">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Mỗi Túi Một Bất Ngờ
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Trải nghiệm ẩm thực phong phú với nhiều loại rau củ hữu cơ tươi ngon theo mùa.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#eef8ea] text-[#4a7c2f] flex items-center justify-center shrink-0">
                  <Leaf size={20} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Nông Sản Thu Hoạch Sáng
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Giao thẳng từ vườn trong 2-4 giờ, đảm bảo giữ nguyên hàm lượng dinh dưỡng.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Đóng Gói Thân Thiện
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Thùng giấy tái chế Kraft và rơm tự nhiên, hạn chế tối đa rác thải nhựa.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
