import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { mysteryBoxService, comboService } from '@/services'
import {
  Gift,
  Check,
  Sparkles,
  ShoppingBasket,
  ShoppingCart,
  Eye,
  ArrowUpDown,
  ArrowRight,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react'
import { formatCurrency as money } from '@/utils'
import { getProduceFallback } from '@/pages/product/components/productDetail.utils'
import {
  isMeaningfulComboName,
  mapComboToCard,
  mapMysteryBoxToCard,
  resolveComboImage,
  type ComboCardItem,
} from './combos.utils'
import comboHeroBanner from '../assets/combo-hero-banner.jpg'
import comboMysteryImg from '../assets/combo-mystery.jpg'
import comboGreenImg from '../assets/combo-green.jpg'
import comboKitchenImg from '../assets/combo-kitchen.jpg'
import comboHotpotImg from '../assets/combo-hotpot.jpg'

interface CombosProps {
  onAdd: (id: string | number, itemType?: string) => void
  onInfo: (s: string) => void
}

type ComboItem = ComboCardItem

const ALL_COMBOS: ComboItem[] = []

const COMBO_CATEGORIES = [
  {
    id: 'all',
    label: 'Tất cả combo & túi mù',
    bannerTitle: 'Combo & Túi Mù Nông Sản',
    breadcrumb: 'Combo & Túi mù',
  },
  {
    id: 'mystery',
    label: 'Túi mù',
    bannerTitle: 'Túi Mù Nông Sản May Mắn',
    breadcrumb: 'Túi mù nông sản',
  },
  {
    id: 'family',
    label: 'Combo',
    bannerTitle: 'Combo Rau Củ Gia Đình',
    breadcrumb: 'Combo gia đình',
  },
  {
    id: 'bulk',
    label: 'Thùng lớn 10kg quán ăn',
    bannerTitle: 'Thùng Bếp Lớn 10kg',
    breadcrumb: 'Thùng lớn 10kg',
  },
]

const SORT_OPTIONS = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'price-asc', label: 'Giá thấp đến cao' },
  { id: 'price-desc', label: 'Giá cao xuống thấp' },
  { id: 'discount', label: 'Tiết kiệm nhất' },
  { id: 'best-selling', label: 'Bán chạy' },
]

const ITEMS_PER_PAGE = 9 // 3 hàng x 3 cột trên desktop

// Component thẻ Combo độc lập với xử lý ảnh fallback an toàn
function ComboCard({
  combo,
  onAdd,
}: {
  combo: ComboItem
  onAdd: (id: string | number, itemType?: string) => void
}) {
  const navigate = useNavigate()
  const [imgSrc, setImgSrc] = useState(combo.image)

  const handleImgError = () => {
    const fallback = getProduceFallback(combo.name)
    if (imgSrc !== fallback) {
      setImgSrc(fallback)
    }
  }

  const isMysteryItem = combo.itemType === 'MYSTERY_BOX' || combo.id === 'mystery'
  const detailUrl = isMysteryItem
    ? `/mystery-box/${combo.realId || 1}`
    : `/combo/${combo.realId || combo.id}`

  return (
    <article className="group bg-white rounded-2xl border border-gray-200/90 hover:border-[#4a7c2f] hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Khung ảnh tỷ lệ 4:3 phủ kín 100% */}
      <div
        onClick={() => navigate(detailUrl)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 cursor-pointer"
      >
        <img
          src={imgSrc}
          alt={combo.name}
          loading="lazy"
          onError={handleImgError}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Chỉ giữ lại nhãn Tiết kiệm / Giảm giá ở góc trên bên trái ảnh */}
        <div className="absolute top-3 left-3 bg-[#d92228] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
          <span>{combo.badgeDiscount || '-15%'}</span>
        </div>
      </div>

      {/* Nội dung thông tin thẻ */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2.5">
        {/* Phân loại & Khẩu phần */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-bold text-[#4a7c2f] bg-[#eef8ea] px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
            {combo.category}
          </span>
          <span className="font-medium text-gray-600 line-clamp-1 text-right">{combo.portion}</span>
        </div>

        {/* Tên gói combo */}
        <h3
          onClick={() => navigate(detailUrl)}
          className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#2b5619] transition-colors min-h-[44px] cursor-pointer"
        >
          {combo.name}
        </h3>

        {/* Mô tả đặc điểm */}
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 min-h-[36px]">
          {combo.feature}
        </p>

        {/* Hàng giá tiền & Tiết kiệm: đặt giá gốc gạch ngang bên dưới giá bán chính để nhường chiều ngang */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-gray-100">
          <div className="flex flex-col">
            <strong className="text-lg sm:text-xl font-black text-[#2b5619] leading-tight whitespace-nowrap">
              {money(combo.price)}
            </strong>
            <del className="text-xs text-gray-400 font-normal leading-tight whitespace-nowrap">
              {money(combo.original)}/{combo.unit}
            </del>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Tiết kiệm {money(combo.original - combo.price)}
          </span>
        </div>

        {/* Thanh tiến độ hàng tồn & đã bán */}
        <div className="flex flex-col gap-1">
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#4a7c2f] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((combo.sold / (combo.sold + combo.stock)) * 100))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Đã bán {combo.sold} gói</span>
            <span className="text-[#4a7c2f] font-semibold">Còn {combo.stock} {combo.unit}</span>
          </div>
        </div>

        {/* Nút hành động: 1 nút Chi tiết + 1 nút Thêm vào giỏ */}
        <div className="mt-2.5 flex items-center gap-2 pt-2.5 border-t border-gray-100">
          <Link
            to={detailUrl}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg border border-[#326318]/40 bg-[#f8faf6] text-[#326318] hover:bg-[#326318] hover:text-white text-xs font-bold transition-all text-center group/btn"
          >
            <Eye size={14} className="shrink-0 transition-transform group-hover/btn:scale-110" />
            <span className="truncate">Chi tiết</span>
          </Link>

          <button
            type="button"
            disabled={combo.stock <= 0}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAdd(
                combo.realId ?? combo.id,
                combo.itemType ?? (combo.id.startsWith('mystery') ? 'MYSTERY_BOX' : 'BUILD_COMBO'),
              )
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:bg-[#d6dccf] disabled:text-[#838d7b] disabled:cursor-not-allowed disabled:shadow-none text-center cursor-pointer"
          >
            <ShoppingCart size={14} className="shrink-0" />
            <span className="truncate">{combo.stock <= 0 ? 'Hết hàng' : 'Thêm giỏ'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default function Combos({ onAdd, onInfo }: CombosProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState(() => searchParams.get('category') || (searchParams.get('type') === 'mystery' ? 'mystery' : 'all'))
  const [sort, setSort] = useState('featured')
  const [priceRange, setPriceRange] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const mealTypeParam = searchParams.get('mealType')

  useEffect(() => {
    const cat = searchParams.get('category')
    const meal = searchParams.get('mealType')
    const type = searchParams.get('type')
    if (cat) {
      setCategory(cat)
      setCurrentPage(1)
    } else if (type === 'mystery') {
      setCategory('mystery')
      setCurrentPage(1)
    } else if (meal) {
      setCategory('family')
      setCurrentPage(1)
    }
  }, [searchParams])

  const { data: mysteryBoxesData } = useQuery({
    queryKey: ['mystery-boxes'],
    queryFn: () => mysteryBoxService.getForBuyer(),
  })

  const { data: combosData } = useQuery({
    queryKey: ['combos'],
    queryFn: () => comboService.getCombos(),
  })

  const allCombosList = useMemo(() => {
    const list: ComboItem[] = []

    const mBoxes = mysteryBoxesData?.content || []
    mBoxes.forEach((m) => {
      list.push(mapMysteryBoxToCard(m, comboMysteryImg))
    })

    const cList = combosData?.content || []
    cList.forEach((c) => {
      list.push(mapComboToCard(c, comboGreenImg))
    })

    return list.filter((item) => isMeaningfulComboName(item.name))
  }, [mysteryBoxesData, combosData])

  // Filter pipeline
  let filteredCombos = [...allCombosList]

  if (category === 'mystery') {
    filteredCombos = filteredCombos.filter(
      (c) => c.itemType === 'MYSTERY_BOX' || c.id.startsWith('mystery'),
    )
  } else if (category === 'family') {
    filteredCombos = filteredCombos.filter(
      (c) => c.itemType === 'BUILD_COMBO' || c.id.startsWith('combo'),
    )
  } else if (category === 'bulk') {
    filteredCombos = filteredCombos.filter(
      (c) => c.name.toLowerCase().includes('thùng') || c.category === 'Thùng lớn' || c.price >= 200000,
    )
  }

  if (mealTypeParam) {
    const mt = mealTypeParam.toUpperCase()
    filteredCombos = filteredCombos.filter(
      (c) =>
        c.mealType?.toUpperCase() === mt ||
        c.badgeHighlight?.toUpperCase().includes(mt) ||
        (c.portion && c.portion.toUpperCase().includes(mt))
    )
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

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCombos.length / ITEMS_PER_PAGE))
  const paginatedCombos = filteredCombos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const activeCategory = COMBO_CATEGORIES.find((c) => c.id === category) || COMBO_CATEGORIES[0]

  const handleResetFilters = () => {
    setCategory('all')
    setSort('featured')
    setPriceRange('all')
    setCurrentPage(1)
    if (searchParams.toString()) {
      setSearchParams({})
    }
  }

  const hasActiveFilters = category !== 'all' || priceRange !== 'all'

  return (
    <div className="w-full bg-[#fdfcf9] min-h-screen">
      {/* 1. Top Combo & Mystery Box Hero Banner */}
      <div className="relative w-full h-72 sm:h-84 md:h-96 lg:h-[360px] overflow-hidden flex items-center justify-center text-center shadow-lg">
        <img
          src={comboHeroBanner}
          alt="Hộp quà nông sản và các gói combo tươi xanh"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />

        <div className="relative z-10 flex flex-col items-center gap-3 px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#ffea79] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Gift size={13} />
            <span>Mua Theo Gói Tiết Kiệm 30% - 60% · Thu Hoạch Trong Ngày</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
            {activeCategory.bannerTitle}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/85 font-normal max-w-xl mx-auto leading-relaxed drop-shadow">
            Tiết kiệm chi phí đi chợ mỗi ngày, đón giỏ quà bất ngờ từ nông trại và cùng chung tay giải cứu nông sản với CapNong.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white/90 font-medium mt-1 shadow-sm">
            <a href="/" className="hover:text-[#ffea79] transition-colors">
              Trang chủ
            </a>
            <span className="text-white/40">›</span>
            <span className="text-[#ffea79] font-bold">
              {activeCategory.breadcrumb}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* LEFT SIDEBAR: Bật position sticky; top: 88px */}
            <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6 lg:sticky lg:top-[88px] self-start">
              {/* Box 1: Danh Mục */}
              <div className="bg-[#f2f9ed] border border-[#d6ebd0] rounded-2xl p-5 shadow-sm">
                <h2 className="text-base sm:text-lg font-black text-[#2b5619] pb-3.5 mb-2 border-b border-[#cfe6c8] flex items-center justify-between">
                  <span>Danh Mục</span>
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
                            setCurrentPage(1)
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

              {/* Box 2: Lọc Theo Mức Giá */}
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

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 text-xs text-gray-700">
                    {[
                      { id: 'all', label: 'Tất cả mức giá' },
                      { id: 'under100', label: 'Dưới 100.000đ (Tiết kiệm)' },
                      { id: '100to200', label: '100.000đ – 200.000đ' },
                      { id: 'over200', label: 'Trên 200.000đ (Thùng lớn)' },
                    ].map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 cursor-pointer hover:text-[#2b5619]"
                      >
                        <input
                          type="radio"
                          name="priceComboFilter"
                          checked={priceRange === p.id}
                          onChange={() => {
                            setPriceRange(p.id)
                            setCurrentPage(1)
                          }}
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
                    Đặc quyền mua Combo
                  </span>
                  <ul className="flex flex-col gap-2 text-xs text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-[#4a7c2f] shrink-0 mt-0.5" />
                      <span>Tiết kiệm 30% - 60% so với mua lẻ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-[#4a7c2f] shrink-0 mt-0.5" />
                      <span>Thu hoạch sớm hái trong ngày</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-[#4a7c2f] shrink-0 mt-0.5" />
                      <span>Bảo hiểm 100% đổi trả nếu hư hỏng</span>
                    </li>
                  </ul>
                </div>

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

            {/* RIGHT MAIN AREA */}
            <main className="flex-1 min-w-0 w-full flex flex-col gap-6">
              {/* Thanh công cụ dọn sạch: Chỉ giữ số lượng kết quả bên trái và dropdown Sắp xếp bên phải */}
              <div
                id="combo-grid-top"
                className="bg-white border border-gray-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span>
                    Hiển thị <strong className="text-gray-900 font-black">{filteredCombos.length}</strong> gói combo & túi mù
                  </span>
                  {category !== 'all' && (
                    <span className="bg-[#eef8ea] text-[#2b5619] font-bold px-2 py-0.5 rounded-full border border-[#d2ecc9] text-xs">
                      {activeCategory.label}
                    </span>
                  )}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold underline ml-1 cursor-pointer"
                    >
                      Đặt lại lọc
                    </button>
                  )}
                </div>

                {/* Dropdown Sắp xếp theo gọn gàng */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className="text-xs font-semibold text-gray-500 hidden sm:inline-flex items-center gap-1">
                    <ArrowUpDown size={13} className="text-[#4a7c2f]" />
                    Sắp xếp theo:
                  </span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="text-xs sm:text-sm font-semibold bg-gray-50 border border-gray-300 text-gray-800 rounded-xl px-3 py-1.5 sm:py-2 pr-8 focus:ring-2 focus:ring-[#4a7c2f]/30 focus:border-[#4a7c2f] outline-none transition-all cursor-pointer"
                    >
                      {SORT_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* LƯỚI 3 CỘT TRÊN DESKTOP: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 */}
              {paginatedCombos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedCombos.map((c) => (
                    <ComboCard key={c.id} combo={c} onAdd={onAdd} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                  <Package size={40} className="text-gray-300" />
                  <h3 className="text-base font-bold text-gray-800">Không tìm thấy gói combo phù hợp</h3>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Vui lòng điều chỉnh lại bộ lọc mức giá hoặc danh mục để xem thêm các gói nông sản khác.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-2 px-4 py-2 bg-[#4a7c2f] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Xem tất cả combo
                  </button>
                </div>
              )}

              {/* PHÂN TRANG: < 1 2 3 > GIỚI HẠN 9 COMBO MỖI TRANG */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200/80">
                  <span className="text-xs text-gray-500">
                    Hiển thị <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> –{' '}
                    <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredCombos.length)}</strong> trên tổng số{' '}
                    <strong>{filteredCombos.length}</strong> combo
                  </span>

                  <div className="inline-flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1))
                        document.getElementById('combo-grid-top')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="p-2 rounded-xl text-gray-600 hover:text-[#2b5619] hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-all"
                      title="Trang trước"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isCurrent = page === currentPage
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => {
                            setCurrentPage(page)
                            document.getElementById('combo-grid-top')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className={`min-w-9 h-9 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[#2b5619] text-white shadow-sm'
                              : 'text-gray-700 hover:bg-[#eef8ea] hover:text-[#2b5619]'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                        document.getElementById('combo-grid-top')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="p-2 rounded-xl text-gray-600 hover:text-[#2b5619] hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-all"
                      title="Trang sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Callout Chiến dịch Đồng hành cùng Nông dân */}
              <div className="bg-gradient-to-r from-[#1e4815] via-[#16390e] to-[#0f280a] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-white/10 relative overflow-hidden mt-4">
                <div className="relative z-10 flex flex-col gap-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#ffea79] text-xs font-bold w-fit mx-auto sm:mx-0">
                    <Sparkles size={13} />
                    <span>Đồng Hành Cùng Nông Dân Việt</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    Chung tay cùng các chiến dịch giải cứu nông sản
                  </h2>
                  <p className="text-xs sm:text-sm text-white/85 max-w-lg leading-relaxed">
                    Mỗi combo và hộp bí ẩn bạn lựa chọn đều góp phần giảm thiểu nông sản tồn đọng sau thu hoạch cho các hợp tác xã và nhà vườn liên kết.
                  </p>
                </div>
                <Link
                  to="/chien-dich"
                  className="relative z-10 shrink-0 bg-[#ffea79] hover:bg-[#ffd84d] text-[#14330d] px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Khám phá các chiến dịch</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </main>
          </div>
      </div>
    </div>
  )
}
