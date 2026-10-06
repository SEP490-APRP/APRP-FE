import {
  Leaf,
  Search,
  Camera,
  ShoppingBasket,
  Store,
  UserRound,
  Menu,
  X,
  Zap,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Gift,
  Flame,
  ShieldCheck,
  LogOut,
  User,
} from 'lucide-react'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import type { AuthUser } from '@/types'
import freshPromoImg from '@/assets/fresh-veg-promo.png'
import mysteryPromoImg from '@/assets/mystery-box-promo.png'

interface HeaderProps {
  route: string
  count: number
  user?: AuthUser | null
  onLogout?: () => void
  onSearch: (s: string) => void
  onCart: () => void
  onInfo: (s: string) => void
}

export default function Header({
  route,
  count,
  user,
  onLogout,
  onSearch,
  onCart,
  onInfo,
}: HeaderProps) {
  const [query, setQuery] = useState('')
  const [openMobile, setOpenMobile] = useState(false)
  const [mobileSubMenu, setMobileSubMenu] = useState<'fresh' | 'combo' | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<'fresh' | 'combo' | null>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const accountRef = useRef<HTMLDivElement | null>(null)

  // Close account menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = (menu: 'fresh' | 'combo') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(menu)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(null)
    }, 160)
  }

  const closeDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(null)
    setOpenMobile(false)
    setAccountMenuOpen(false)
  }

  const handleSelectCategory = (term: string, targetPath: string = '/nong-san-tuoi') => {
    closeDropdown()
    onSearch(term)
    if (location.hash !== `#${targetPath}`) {
      location.hash = targetPath
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    onSearch(query)
    closeDropdown()
    if (!route.startsWith('/nong-san-tuoi')) {
      location.hash = '/nong-san-tuoi'
    }
  }

  const isFreshActive = route.startsWith('/nong-san-tuoi')
  const isComboActive = route.startsWith('/combo-tui-mu')
  const isAiActive = route.startsWith('/cong-nghe-ai')
  const isFarmerActive = route.startsWith('/cau-chuyen-nong-dan')
  const isAuthActive =
    route.startsWith('/dang-nhap') ||
    route.startsWith('/dang-ky') ||
    route.startsWith('/login') ||
    route.startsWith('/register')
  const isHomeActive = route === '/' || route === ''

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'buyer':
        return { label: 'Khách Mua', bg: 'bg-[#eaf5e1] text-[#2c5f11]', border: 'border-[#b9e49c]' }
      case 'shop':
        return { label: 'Nhà Vườn', bg: 'bg-[#fdf3e7] text-[#824413]', border: 'border-[#f3cc9f]' }
      case 'shipper':
        return { label: 'Tài Xế', bg: 'bg-[#e9f6f7] text-[#195962]', border: 'border-[#b1dfe4]' }
      case 'admin':
        return { label: 'Admin', bg: 'bg-[#f9edf9] text-[#79247d]', border: 'border-[#ebc5eb]' }
      case 'staff':
        return { label: 'Staff', bg: 'bg-[#eef2f8] text-[#2c4772]', border: 'border-[#cddbf0]' }
      default:
        return {
          label: 'Thành viên',
          bg: 'bg-[#eaf5e1] text-[#2c5f11]',
          border: 'border-[#b9e49c]',
        }
    }
  }

  return (
    <header className="site-header relative z-50">
      {/* Main Header Row */}
      <div className="page-container header-main">
        <a href="#/" className="brand" aria-label="CapNong – Trang chủ" onClick={closeDropdown}>
          <span className="brand-leaf">
            <Leaf size={29} />
          </span>
          <span>
            <strong>CapNong</strong>
            <small>Nông sản xấu mã – Ngon thật</small>
          </span>
        </a>

        {/* Global Search Bar */}
        <form onSubmit={submit} className="header-search">
          <Search size={19} />
          <input
            aria-label="Tìm nông sản"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm rau củ, trái cây hoặc nhà vườn..."
          />
          <button type="submit" aria-label="Tìm kiếm">
            <Search size={18} />
          </button>
          <button
            type="button"
            className="ai-search flex items-center gap-1"
            onClick={() => onInfo('Tìm bằng ảnh AI')}
          >
            <Camera size={16} />
            <span>Tìm AI</span>
          </button>
        </form>

        {/* Header Actions */}
        <div className="header-actions flex items-center gap-2">
          {/* Vendor Button / Direct Registration for Shop */}
          <a
            href="#/dang-ky?role=shop"
            className="btn btn-gold vendor-button hidden sm:inline-flex"
            onClick={closeDropdown}
          >
            <Store size={16} />
            <span>Bán nông sản</span>
          </a>

          {/* Cart Trigger */}
          <button
            className="icon-button cart-trigger"
            aria-label={`Giỏ hàng, ${count} sản phẩm`}
            onClick={onCart}
          >
            <ShoppingBasket />
            {count > 0 && <span>{count}</span>}
          </button>

          {/* Auth Action Buttons: Đăng nhập & Đăng ký (hoặc Hồ sơ nếu đã đăng nhập) */}
          <div className="relative flex items-center gap-1.5" ref={accountRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#f0ebd9] hover:bg-[#e7e1cc] border border-[#d6cfbe] transition-colors"
                aria-label="Tài khoản cá nhân"
              >
                <div className="w-7 h-7 rounded-full bg-[#326318] text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#1f241a] leading-tight max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 rounded-full w-fit ${getRoleBadge(user.role).bg}`}
                  >
                    {getRoleBadge(user.role).label}
                  </span>
                </div>
                <ChevronDown size={14} className="text-[#5b6354]" />
              </button>
            ) : (
              <>
                {/* Desktop: Explicit "Đăng nhập" and "Đăng ký" buttons */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <a
                    href="#/dang-nhap"
                    onClick={closeDropdown}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all border ${
                      route.startsWith('/dang-nhap') || route.startsWith('/login')
                        ? 'bg-[#326318] text-white border-[#326318] shadow-sm'
                        : 'border-[#d6dccf] text-[#326318] hover:bg-[#326318]/10 hover:border-[#326318]'
                    }`}
                  >
                    <UserRound size={14} />
                    <span>Đăng nhập</span>
                  </a>

                  <a
                    href="#/dang-ky"
                    onClick={closeDropdown}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-xs transition-all border ${
                      route.startsWith('/dang-ky') || route.startsWith('/register')
                        ? 'bg-[#254b12] text-white border-[#254b12] shadow-sm'
                        : 'bg-[#326318] hover:bg-[#254b12] text-white border-[#326318] shadow-sm hover:shadow'
                    }`}
                  >
                    <span>Đăng ký</span>
                  </a>
                </div>

                {/* Mobile icon button */}
                <a
                  href="#/dang-nhap"
                  onClick={closeDropdown}
                  className={`icon-button sm:hidden ${isAuthActive ? 'bg-[#326318] text-white' : ''}`}
                  aria-label="Đăng nhập / Đăng ký"
                >
                  <UserRound size={20} />
                </a>
              </>
            )}

            {/* Account Popover Menu */}
            {accountMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#ede8df] p-3 z-50 animate-fadeIn">
                {user ? (
                  <div>
                    <div className="p-3 rounded-xl bg-[#faf7ef] border border-[#eee8da] mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#326318] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-xs text-[#20271c] truncate">
                            {user.name}
                          </h4>
                          <p className="text-[11px] text-[#6d7567] truncate">{user.email}</p>
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              getRoleBadge(user.role).bg
                            } ${getRoleBadge(user.role).border}`}
                          >
                            Vai trò: {getRoleBadge(user.role).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-xs">
                      {user.role === 'admin' && (
                        <a
                          href="#/admin"
                          onClick={closeDropdown}
                          className="w-full text-left py-2 px-3 rounded-xl bg-purple-50 text-purple-900 font-bold flex items-center gap-2 border border-purple-200"
                        >
                          <ShieldCheck size={15} className="text-purple-700" />
                          <span>🛡️ Trung Tâm Quản Trị Admin</span>
                        </a>
                      )}

                      {user.role === 'shop' ? (
                        <a
                          href="#/shop"
                          onClick={closeDropdown}
                          className="w-full text-left py-2 px-3 rounded-xl bg-[#fdf5eb] text-[#8a4e1d] font-bold flex items-center gap-2 border border-[#f5ddbd]"
                        >
                          <Store size={15} className="text-[#8a4e1d]" />
                          <span>🌾 Bảng Điều Khiển Nông Dân</span>
                        </a>
                      ) : (
                        <a
                          href="#/shop"
                          onClick={closeDropdown}
                          className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#f3eee2] text-[#333a2d] font-semibold flex items-center gap-2"
                        >
                          <Store size={15} className="text-[#8a4e1d]" />
                          <span>🌾 Kênh Bán Hàng Nhà Vườn</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          closeDropdown()
                          onInfo(`Hồ sơ ${user.name} (${getRoleBadge(user.role).label})`)
                        }}
                        className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#f3eee2] text-[#333a2d] font-semibold flex items-center gap-2"
                      >
                        <User size={15} className="text-primary" />
                        <span>Xem hồ sơ cá nhân</span>
                      </button>

                      <a
                        href="#/dang-ky"
                        onClick={closeDropdown}
                        className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#f3eee2] text-[#333a2d] font-semibold flex items-center gap-2"
                      >
                        <Zap size={15} className="text-[#ff9800]" />
                        <span>Chuyển đổi / Mở thêm vai trò</span>
                      </a>

                      <hr className="my-1 border-[#ede8df]" />

                      <button
                        type="button"
                        onClick={() => {
                          closeDropdown()
                          onLogout?.()
                        }}
                        className="w-full text-left py-2 px-3 rounded-xl hover:bg-red-50 text-red-600 font-bold flex items-center gap-2"
                      >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-center pb-3 border-b border-[#ede8df] mb-2.5">
                      <h4 className="font-extrabold text-xs text-[#20271c] mb-1">
                        Chào mừng đến với CapNong
                      </h4>
                      <p className="text-[11px] text-[#6f7669]">
                        Đăng nhập để nhận ưu đãi cứu nông sản
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <a
                        href="#/dang-nhap"
                        onClick={closeDropdown}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs text-center transition-colors shadow-sm"
                      >
                        Đăng Nhập
                      </a>

                      <a
                        href="#/dang-ky"
                        onClick={closeDropdown}
                        className="w-full py-2.5 px-3 rounded-xl border border-[#326318] text-[#326318] hover:bg-[#f1faea] font-bold text-xs text-center transition-colors"
                      >
                        Đăng Ký Tài Khoản Mới
                      </a>

                      <div className="pt-2 border-t border-[#f0ebd9] flex flex-col gap-1 text-[11px]">
                        <span className="font-bold text-[#8a4e1d] px-1 uppercase text-[10px]">
                          Chọn vai trò đăng ký:
                        </span>
                        <a
                          href="#/dang-ky?role=buyer"
                          onClick={closeDropdown}
                          className="py-1 px-2 rounded-lg hover:bg-[#faf7ef] text-[#4d5546] flex items-center justify-between font-medium"
                        >
                          <span>1. Buyer (Khách mua nông sản)</span>
                          <ArrowRight size={12} />
                        </a>
                        <a
                          href="#/dang-ky?role=shop"
                          onClick={closeDropdown}
                          className="py-1 px-2 rounded-lg hover:bg-[#faf7ef] text-[#4d5546] flex items-center justify-between font-medium"
                        >
                          <span>2. Shop (Nhà vườn mở gian hàng)</span>
                          <ArrowRight size={12} />
                        </a>
                        <a
                          href="#/dang-ky?role=shipper"
                          onClick={closeDropdown}
                          className="py-1 px-2 rounded-lg hover:bg-[#faf7ef] text-[#4d5546] flex items-center justify-between font-medium"
                        >
                          <span>3. Shipper (Tài xế giao hàng)</span>
                          <ArrowRight size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="icon-button mobile-toggle lg:hidden"
            aria-label={openMobile ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={openMobile}
            onClick={() => setOpenMobile(!openMobile)}
          >
            {openMobile ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Original Cream Navigation Bar with Hover Dropdown */}
      <div className="nav-bar relative" onMouseLeave={handleMouseLeave}>
        <div className="page-container nav-inner">
          <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-1.5">
            {/* 1. Trang chủ */}
            <a
              href="#/"
              className={`nav-pill ${isHomeActive ? 'is-active' : ''}`}
              aria-current={isHomeActive ? 'page' : undefined}
              onClick={closeDropdown}
            >
              Trang chủ
            </a>

            {/* 2. Nông sản tươi (Hover trigger) */}
            <div className="relative" onMouseEnter={() => handleMouseEnter('fresh')}>
              <a
                href="#/nong-san-tuoi"
                className={`nav-pill ${isFreshActive ? 'is-active' : ''} ${
                  activeDropdown === 'fresh' ? 'is-hovered' : ''
                }`}
                aria-current={isFreshActive ? 'page' : undefined}
                onClick={closeDropdown}
              >
                <span>Nông sản tươi</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    activeDropdown === 'fresh' ? 'rotate-180 text-white' : 'opacity-75'
                  }`}
                />
              </a>
            </div>

            {/* 3. Combo & Túi mù (Hover trigger) */}
            <div className="relative" onMouseEnter={() => handleMouseEnter('combo')}>
              <a
                href="#/combo-tui-mu"
                className={`nav-pill ${isComboActive ? 'is-active' : ''} ${
                  activeDropdown === 'combo' ? 'is-hovered' : ''
                }`}
                aria-current={isComboActive ? 'page' : undefined}
                onClick={closeDropdown}
              >
                <span>Combo &amp; Túi mù</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    activeDropdown === 'combo' ? 'rotate-180 text-white' : 'opacity-75'
                  }`}
                />
              </a>
            </div>

            {/* 4. Công nghệ AI */}
            <a
              href="#/cong-nghe-ai"
              className={`nav-pill ${isAiActive ? 'is-active' : ''}`}
              aria-current={isAiActive ? 'page' : undefined}
              onClick={closeDropdown}
            >
              Công nghệ AI
            </a>

            {/* 5. Câu chuyện nông dân */}
            <a
              href="#/cau-chuyen-nong-dan"
              className={`nav-pill ${isFarmerActive ? 'is-active' : ''}`}
              aria-current={isFarmerActive ? 'page' : undefined}
              onClick={closeDropdown}
            >
              Câu chuyện nông dân
            </a>
          </nav>
        </div>

        {/* ---------------------------------------------------- */}
        {/* HOVER DROPDOWN 1: NÔNG SẢN TƯƠI                      */}
        {/* ---------------------------------------------------- */}
        {activeDropdown === 'fresh' && (
          <div
            className="absolute top-full left-0 w-full bg-white shadow-2xl border-b-2 border-primary z-50 animate-fadeIn"
            onMouseEnter={() => handleMouseEnter('fresh')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-7">
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* 4 Category Columns */}
                <div className="col-span-8 xl:col-span-9 grid grid-cols-4 gap-6">
                  {/* Col 1: Rau Ăn Lá */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2e7d32]" />
                      <span>Rau Ăn Lá</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {[
                        { name: 'Cải bó xôi hữu cơ', filter: 'Cải bó xôi' },
                        { name: 'Bắp cải xanh cuộn', filter: 'Bắp cải' },
                        { name: 'Rau mồng tơi tươi', filter: 'Rau mồng tơi' },
                        { name: 'Xà lách xoăn Đà Lạt', filter: 'Xà lách' },
                        { name: 'Rau muống sạch', filter: 'Rau muống' },
                      ].map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(item.filter, '/nong-san-tuoi')}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Rau ăn lá', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>Xem tất cả rau lá</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 2: Củ Quả Tươi */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#e65100]" />
                      <span>Củ Quả Tươi</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {[
                        { name: 'Cà rốt hai nhánh', filter: 'Cà rốt' },
                        { name: 'Khoai lang mật Gia Lai', filter: 'Khoai lang' },
                        { name: 'Cà chua bi hữu cơ', filter: 'Cà chua' },
                        { name: 'Củ dền đỏ Đơn Dương', filter: 'Củ dền' },
                        { name: 'Bí đỏ hồ lô Đắk Lắk', filter: 'Bí đỏ' },
                      ].map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(item.filter, '/nong-san-tuoi')}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Củ quả', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-[#e65100] hover:underline flex items-center gap-1"
                        >
                          <span>Xem tất cả củ quả</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 3: Hoa Quả Sạch */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                      <span>Hoa Quả Sạch</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {[
                        { name: 'Bưởi da xanh ruột hồng', filter: 'Bưởi' },
                        { name: 'Thanh long ruột đỏ', filter: 'Thanh long' },
                        { name: 'Cam sành Hàm Yên', filter: 'Cam sành' },
                        { name: 'Chuối già Nam Mỹ', filter: 'Chuối' },
                        { name: 'Dưa hấu Long An', filter: 'Dưa hấu' },
                      ].map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(item.filter, '/nong-san-tuoi')}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Trái cây', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-[#d97706] hover:underline flex items-center gap-1"
                        >
                          <span>Xem tất cả trái cây</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 4: Hữu Cơ & Vùng Miền */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                      <span>Vùng Trồng &amp; AI</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {[
                        { name: 'Nông sản Hữu cơ', filter: 'Hữu cơ' },
                        { name: 'Nông trại Đà Lạt', filter: 'Đà Lạt' },
                        { name: 'HTX Đơn Dương', filter: 'Đơn Dương' },
                        { name: 'Vùng đất đỏ Gia Lai', filter: 'Gia Lai' },
                        { name: 'Miệt vườn Bến Tre', filter: 'Bến Tre' },
                      ].map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(item.filter, '/nong-san-tuoi')}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Tất cả', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>Xem toàn bộ chợ</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Promo Box */}
                <div className="col-span-4 xl:col-span-3 bg-gradient-to-br from-[#246927] to-[#144217] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 text-[#ffea79] px-2.5 py-0.5 rounded-full w-fit">
                      <Flame size={12} />
                      <span>Giải cứu hôm nay</span>
                    </span>
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      Rau củ tươi sạch thu hoạch sớm
                    </h4>
                    <p className="text-xs text-white/85 leading-snug line-clamp-2">
                      Giữ trọn vitamin, giá tốt hơn 30–50% từ nhà vườn liên kết.
                    </p>
                  </div>

                  <div className="relative z-10 mt-3 pt-2 border-t border-white/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffea79]">Chỉ từ 15.000đ/kg</span>
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('Tất cả', '/nong-san-tuoi')}
                      className="px-3.5 py-1.5 rounded-full bg-white text-[#144217] hover:bg-[#ffea79] font-bold text-xs transition-colors shadow flex items-center gap-1"
                    >
                      <span>Khám phá</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Background Cutout Image */}
                  <div className="absolute right-0 -bottom-4 w-32 h-32 opacity-25 pointer-events-none">
                    <img
                      src={freshPromoImg}
                      alt="Rau củ tươi"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* HOVER DROPDOWN 2: COMBO & TÚI MÙ                     */}
        {/* ---------------------------------------------------- */}
        {activeDropdown === 'combo' && (
          <div
            className="absolute top-full left-0 w-full bg-white shadow-2xl border-b-2 border-[#8a4e1d] z-50 animate-fadeIn"
            onMouseEnter={() => handleMouseEnter('combo')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-7">
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* 3 Category Columns */}
                <div className="col-span-8 xl:col-span-9 grid grid-cols-3 gap-8">
                  {/* Col 1: Túi Mù (Mystery Box) */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8a4e1d] border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <Gift size={14} className="text-[#d97706]" />
                      <span>Túi Mù Nông Sản</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {[
                        { name: 'Túi Mù Thần Bí 5kg (79k)', id: 'mystery' },
                        { name: 'Túi Mù Mini 3kg (49k)', id: 'mystery' },
                        { name: 'Túi Mù Trái Cây Độc Đáo', id: 'mystery' },
                        { name: 'Túi Mù Rau Củ Hỗn Hợp', id: 'mystery' },
                      ].map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(item.name, '/combo-tui-mu')}
                            className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('', '/combo-tui-mu')}
                          className="text-[11px] font-bold text-[#8a4e1d] hover:underline flex items-center gap-1"
                        >
                          <span>Mở hộp bất ngờ ngay</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 2: Combo Tiết Kiệm Gia Đình */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8a4e1d] border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#2e7d32]" />
                      <span>Combo Gia Đình</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {[
                        { name: 'Combo Rau Xanh 5 Bữa (6kg)', id: 'green' },
                        { name: 'Thùng Bếp Xanh Củ Quả 10kg', id: 'kitchen' },
                        { name: 'Combo Tiệc Lẩu & Nướng (4.5kg)', id: 'hotpot' },
                        { name: 'Combo Dinh Dưỡng Ăn Dặm', id: 'green' },
                      ].map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(item.name, '/combo-tui-mu')}
                            className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('', '/combo-tui-mu')}
                          className="text-[11px] font-bold text-[#8a4e1d] hover:underline flex items-center gap-1"
                        >
                          <span>Xem tất cả combo</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 3: Dịch Vụ & Ưu Đãi */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8a4e1d] border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#d97706]" />
                      <span>Dịch Vụ &amp; Đăng Ký</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {[
                        { name: 'Tự thiết kế combo tuần', action: 'Tự thiết kế combo' },
                        { name: 'Đăng ký giao rau định kỳ', action: 'Giao rau định kỳ' },
                        { name: 'Gói tiếp tế Bếp ăn / Quán', action: 'Gói sỉ bếp ăn' },
                        { name: 'Ví thưởng giới thiệu 50k', action: 'Ví thưởng giới thiệu' },
                      ].map((item, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => {
                              closeDropdown()
                              onInfo(item.action)
                            }}
                            className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            closeDropdown()
                            onInfo('Tư vấn chọn combo')
                          }}
                          className="text-[11px] font-bold text-[#8a4e1d] hover:underline flex items-center gap-1"
                        >
                          <span>Nhận tư vấn combo</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Promo Box */}
                <div className="col-span-4 xl:col-span-3 bg-gradient-to-br from-[#8a4e1d] via-[#6e3910] to-[#452008] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 text-[#ffea79] px-2.5 py-0.5 rounded-full w-fit">
                      <Sparkles size={12} />
                      <span>HOT DEAL -60%</span>
                    </span>
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      Mở Túi Mù – Đón Bất Ngờ
                    </h4>
                    <p className="text-xs text-white/85 leading-snug line-clamp-2">
                      Hộp quà 5kg nông sản tuyển chọn hái sớm, giá chỉ 79.000đ.
                    </p>
                  </div>

                  <div className="relative z-10 mt-3 pt-2 border-t border-white/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffea79]">79.000đ/túi 5kg</span>
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('', '/combo-tui-mu')}
                      className="px-3.5 py-1.5 rounded-full bg-white text-[#6e3910] hover:bg-[#ffea79] font-bold text-xs transition-colors shadow flex items-center gap-1"
                    >
                      <span>Mở túi ngay</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Background Cutout Image */}
                  <div className="absolute right-0 -bottom-4 w-32 h-32 opacity-25 pointer-events-none">
                    <img
                      src={mysteryPromoImg}
                      alt="Túi Mù"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      {openMobile && (
        <div className="lg:hidden bg-[#fbf9f4] border-t border-[#ede8df] px-4 py-4 flex flex-col gap-2 shadow-2xl max-h-[80vh] overflow-y-auto">
          {/* 1. Trang chủ */}
          <a
            href="#/"
            className={`text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors ${
              isHomeActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
            }`}
            onClick={closeDropdown}
          >
            Trang chủ
          </a>

          {/* 2. Nông sản tươi (Accordion) */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setMobileSubMenu(mobileSubMenu === 'fresh' ? null : 'fresh')}
              className={`text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors flex items-center justify-between ${
                isFreshActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
              }`}
            >
              <span>Nông sản tươi</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  mobileSubMenu === 'fresh' ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>
            {mobileSubMenu === 'fresh' && (
              <div className="pl-4 pr-2 py-3 flex flex-col gap-2 bg-[#f0ece1] rounded-2xl my-1.5 text-xs">
                <span className="font-bold text-primary uppercase text-[10px]">Rau Ăn Lá:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[#384133]">
                  <button
                    onClick={() => handleSelectCategory('Cải bó xôi')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Cải bó xôi
                  </button>
                  <button
                    onClick={() => handleSelectCategory('Bắp cải')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Bắp cải xanh
                  </button>
                  <button
                    onClick={() => handleSelectCategory('Rau mồng tơi')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Rau mồng tơi
                  </button>
                  <button
                    onClick={() => handleSelectCategory('Xà lách')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Xà lách Đà Lạt
                  </button>
                </div>
                <span className="font-bold text-primary uppercase text-[10px] mt-2">
                  Củ Quả &amp; Trái Cây:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[#384133]">
                  <button
                    onClick={() => handleSelectCategory('Cà rốt')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Cà rốt 2 nhánh
                  </button>
                  <button
                    onClick={() => handleSelectCategory('Khoai lang')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Khoai lang mật
                  </button>
                  <button
                    onClick={() => handleSelectCategory('Bưởi')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Bưởi da xanh
                  </button>
                  <button
                    onClick={() => handleSelectCategory('Cà chua')}
                    className="text-left py-1 hover:text-primary"
                  >
                    Cà chua bi
                  </button>
                </div>
                <a
                  href="#/nong-san-tuoi"
                  onClick={closeDropdown}
                  className="mt-2 text-center py-2 rounded-xl bg-primary text-white font-bold"
                >
                  Xem tất cả nông sản →
                </a>
              </div>
            )}
          </div>

          {/* 3. Combo & Túi mù (Accordion) */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setMobileSubMenu(mobileSubMenu === 'combo' ? null : 'combo')}
              className={`text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors flex items-center justify-between ${
                isComboActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
              }`}
            >
              <span>Combo &amp; Túi mù</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  mobileSubMenu === 'combo' ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>
            {mobileSubMenu === 'combo' && (
              <div className="pl-4 pr-2 py-3 flex flex-col gap-2 bg-[#f0ece1] rounded-2xl my-1.5 text-xs">
                <button
                  onClick={() => handleSelectCategory('mystery', '/combo-tui-mu')}
                  className="text-left py-1 hover:text-[#8a4e1d]"
                >
                  🎁 Túi Mù Thần Bí 5kg (79k)
                </button>
                <button
                  onClick={() => handleSelectCategory('green', '/combo-tui-mu')}
                  className="text-left py-1 hover:text-[#8a4e1d]"
                >
                  🥬 Combo Rau Xanh 5 Bữa (139k)
                </button>
                <button
                  onClick={() => handleSelectCategory('kitchen', '/combo-tui-mu')}
                  className="text-left py-1 hover:text-[#8a4e1d]"
                >
                  🥕 Thùng Bếp Xanh 10kg (199k)
                </button>
                <button
                  onClick={() => handleSelectCategory('hotpot', '/combo-tui-mu')}
                  className="text-left py-1 hover:text-[#8a4e1d]"
                >
                  🍲 Combo Tiệc Lẩu &amp; Nướng (119k)
                </button>
                <a
                  href="#/combo-tui-mu"
                  onClick={closeDropdown}
                  className="mt-2 text-center py-2 rounded-xl bg-[#8a4e1d] text-white font-bold"
                >
                  Khám phá tất cả Combo &amp; Túi Mù →
                </a>
              </div>
            )}
          </div>

          {/* 4. Công nghệ AI */}
          <a
            href="#/cong-nghe-ai"
            className={`text-left text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors ${
              isAiActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
            }`}
            onClick={closeDropdown}
          >
            Công nghệ AI
          </a>

          {/* 5. Câu chuyện nông dân */}
          <a
            href="#/cau-chuyen-nong-dan"
            className={`text-left text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors ${
              isFarmerActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
            }`}
            onClick={closeDropdown}
          >
            Câu chuyện nông dân
          </a>

          {/* 6. Auth Mobile Section */}
          <div className="mt-3 pt-3 border-t border-[#ede8df] flex flex-col gap-2">
            {user ? (
              <div className="p-3 bg-[#f0ebd9] rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#20271c]">{user.name}</div>
                  <div className="text-[11px] text-[#555d4e]">
                    Vai trò: <strong>{getRoleBadge(user.role).label}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeDropdown()
                    onLogout?.()
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="#/dang-nhap"
                  onClick={closeDropdown}
                  className="py-2.5 rounded-xl bg-[#326318] text-white font-bold text-xs text-center shadow-sm"
                >
                  Đăng Nhập
                </a>
                <a
                  href="#/dang-ky"
                  onClick={closeDropdown}
                  className="py-2.5 rounded-xl border border-[#326318] text-[#326318] bg-white font-bold text-xs text-center"
                >
                  Đăng Ký
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
