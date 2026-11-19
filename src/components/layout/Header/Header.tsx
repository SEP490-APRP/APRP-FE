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
  ChevronRight,
  ArrowRight,
  Sparkles,
  Gift,
  Flame,
  ShieldCheck,
  LogOut,
  User,
  FileText,
  ShoppingBag,
  Truck,
  Ticket,
  Wallet,
  Lock,
  MessageSquare,
  HeartPulse,
  Bell,
} from 'lucide-react'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AuthUser } from '@/types'
import { useAuth, useChatStore, useNotificationStore, useUiStore } from '@/stores'
import NotificationDropdown from './NotificationDropdown'
import CartDropdown from './CartDropdown'
import { useActiveCampaigns } from '@/features/campaign/hooks/useCampaignQueries'
import { useAllProducts, useCategories, useCombos } from '@/features/product'
import { mysteryBoxService, type BuildCombo } from '@/services'
import { ImageSearchModal } from '@/components/common/ImageSearchModal'
import freshPromoImg from '@/assets/fresh-veg-promo.png'
import mysteryPromoImg from '@/assets/mystery-box-promo.png'
import logoIcon from '@/assets/logo-icon.png'

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
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false)
  const [openMobile, setOpenMobile] = useState(false)
  const [mobileSubMenu, setMobileSubMenu] = useState<'fresh' | 'combo' | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<'fresh' | 'combo' | null>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const accountRef = useRef<HTMLDivElement | null>(null)
  const {
    unreadCount,
    isOpen: notifOpen,
    setIsOpen: setNotifOpen,
    fetchNotifications,
    fetchUnreadCount,
    connectRealtime,
  } = useNotificationStore()

  const { token } = useAuth()
  const { unreadTotal, loadConversations, loadUnreadCount, initRealtime } = useChatStore()
  const { cartOpen, openCart, closeCart } = useUiStore()

  const [isBellRinging, setIsBellRinging] = useState(false)
  const prevUnreadCountRef = useRef(unreadCount || 0)

  useEffect(() => {
    if ((unreadCount || 0) > (prevUnreadCountRef.current || 0)) {
      setIsBellRinging(true)
      const timer = setTimeout(() => {
        setIsBellRinging(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
    prevUnreadCountRef.current = unreadCount || 0
  }, [unreadCount])

  const messagesHref =
    user?.role === 'shop'
      ? '/shop?tab=messages'
      : user?.role === 'admin'
      ? '/admin/messages'
      : '/tin-nhan'

  const homeHref =
    user?.role === 'shop'
      ? '/shop'
      : user?.role === 'admin'
      ? '/admin'
      : user?.role === 'shipper'
      ? '/shipper'
      : '/'

  const userId = (user as { id?: string | number } | null | undefined)?.id

  useEffect(() => {
    if (user && token && userId) {
      initRealtime(token)
      loadConversations()
      loadUnreadCount()
      connectRealtime(userId, token)
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [
    userId,
    token,
    initRealtime,
    loadConversations,
    loadUnreadCount,
    connectRealtime,
    fetchNotifications,
    fetchUnreadCount,
  ])

  // Close account menu & chat popover on outside click
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
    setNotifOpen(false)
  }

  const handleSelectCategory = (term: string, targetPath: string = '/nong-san-tuoi') => {
    closeDropdown()
    const t = term.toLowerCase().trim()
    if (t === 'rau ăn lá' || t === 'rau lá') {
      onSearch('')
      navigate('/nong-san-tuoi?categoryId=1')
    } else if (t === 'củ quả' || t === 'củ') {
      onSearch('')
      navigate('/nong-san-tuoi?categoryId=2')
    } else if (t === 'trái cây' || t === 'quả') {
      onSearch('')
      navigate('/nong-san-tuoi?categoryId=3')
    } else if (t === 'hữu cơ' || t === 'vietgap') {
      onSearch('')
      navigate('/nong-san-tuoi?categoryId=4')
    } else if (t === 'nấm' || t === 'nấm tươi' || t === 'đậu') {
      onSearch('')
      navigate('/nong-san-tuoi?categoryId=5')
    } else if (t === 'đặc sản' || t === 'vùng miền') {
      onSearch('')
      navigate('/nong-san-tuoi?categoryId=6')
    } else if (t === 'tất cả' || t === '') {
      onSearch('')
      navigate(targetPath)
    } else {
      onSearch(term)
      navigate(targetPath)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    onSearch(query)
    closeDropdown()
    if (!route.startsWith('/nong-san-tuoi')) {
      navigate('/nong-san-tuoi')
    }
  }

  const handleImageSearchSelect = (keyword: string) => {
    setQuery(keyword)
    onSearch(keyword)
    closeDropdown()
    if (!route.startsWith('/nong-san-tuoi')) {
      navigate('/nong-san-tuoi')
    }
  }

  const isFreshActive = route.startsWith('/nong-san-tuoi')
  const isComboActive = route.startsWith('/combo-tui-mu')
  const isFarmerActive = route.startsWith('/cau-chuyen-nong-dan')
  const isCampaignActive = route.startsWith('/chien-dich')
  const { data: openCampaigns } = useActiveCampaigns(0, 1)
  const openCampaignCount = openCampaigns?.totalElements ?? 0
  const isAuthActive =
    route.startsWith('/dang-nhap') ||
    route.startsWith('/dang-ky') ||
    route.startsWith('/login') ||
    route.startsWith('/register')
  const isHomeActive = route === '/' || route === ''

  // Dynamic queries for live mega menus & category links
  const { data: allProducts = [] } = useAllProducts()
  const { data: allCategories = [] } = useCategories()
  const combosQuery = useCombos()
  const allCombos: BuildCombo[] = combosQuery.data?.content ?? (Array.isArray(combosQuery.data) ? combosQuery.data : [])
  const { data: mysteryBoxes = [] } = useQuery({
    queryKey: ['mystery-boxes', 'header'],
    queryFn: async () => (await mysteryBoxService.getForBuyer()).content ?? [],
  })

  const getCatId = (p: any): number => {
    if (typeof p.categoryId === 'number') return p.categoryId
    if (typeof p.category === 'object' && p.category?.categoryId) return p.category.categoryId
    return 0
  }

  const leafProducts = allProducts.filter((p) => getCatId(p) === 1)
  const rootProducts = allProducts.filter((p) => getCatId(p) === 2)
  const fruitProducts = allProducts.filter((p) => getCatId(p) === 3)
  const specialtyProducts = allProducts.filter((p) => [4, 5, 6].includes(getCatId(p)))

  const minProducePrice = allProducts.length > 0
    ? Math.min(...allProducts.map((p) => p.price ?? p.sellingPrice ?? 12000).filter((v) => v > 0))
    : 12000

  const minMysteryPrice = mysteryBoxes.length > 0
    ? Math.min(...mysteryBoxes.map((b) => b.price).filter((v) => v > 0))
    : (allCombos.length > 0 ? Math.min(...allCombos.map((c) => c.price).filter((v) => v > 0)) : 69000)

  return (
    <header className="site-header relative z-50">
      {/* Main Header Row */}
      <div className="page-container header-main relative z-50">
        <a href={homeHref} className="brand" aria-label="CapNong – Trang chủ" onClick={closeDropdown}>
          <img
            src={logoIcon}
            alt="CapNong"
            className="h-10 w-auto object-contain shrink-0"
          />
          <span>
            <strong>CapNong</strong>
            <small>Nông sản xấu mã – ngon thật</small>
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
            className="ai-search flex items-center gap-1 cursor-pointer"
            onClick={() => setIsImageSearchOpen(true)}
            title="Tìm kiếm bằng hình ảnh"
          >
            <Camera size={16} />
            <span>Tìm bằng ảnh</span>
          </button>
        </form>

        {/* Header Actions */}
        <div className="header-actions flex items-center gap-2">
          {/* Cart Trigger & Popover Dropdown (Chỉ dành cho khách mua) */}
          {user?.role !== 'shop' && user?.role !== 'admin' && user?.role !== 'shipper' && (
            <div className="relative">
              <button
                type="button"
                className="icon-button cart-trigger relative"
                aria-label={`Giỏ hàng, ${count} sản phẩm`}
                onClick={() => {
                  setActiveDropdown(null)
                  setAccountMenuOpen(false)
                  setNotifOpen(false)
                  if (cartOpen) {
                    closeCart()
                  } else {
                    openCart()
                  }
                }}
              >
                <ShoppingBasket />
                {count > 0 && <span>{count}</span>}
              </button>
              <CartDropdown isOpen={cartOpen} onClose={closeCart} />
            </div>
          )}

          {/* Message Trigger (Tin nhắn trực tiếp) */}
          {user && (
            <Link
              to={messagesHref}
              className="icon-button relative"
              aria-label={`Tin nhắn, ${unreadTotal} chưa đọc`}
              title={unreadTotal > 0 ? `${unreadTotal} tin nhắn chưa đọc` : 'Tin nhắn'}
              onClick={() => {
                setActiveDropdown(null)
                setAccountMenuOpen(false)
                setNotifOpen(false)
                closeCart()
              }}
            >
              <MessageSquare size={20} />
              {unreadTotal > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </Link>
          )}

          {/* Notification Trigger & Popover */}
          {user && (
            <div className="relative">
              <button
                type="button"
                className="icon-button relative"
                aria-label={`Thông báo hệ thống, ${unreadCount} chưa đọc`}
                title={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
                onClick={() => {
                  setActiveDropdown(null)
                  setAccountMenuOpen(false)
                  setNotifOpen(!notifOpen)
                }}
              >
                <Bell className={isBellRinging ? 'animate-bell-ring text-[#326318]' : ''} size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                messagesHref={messagesHref}
              />
            </div>
          )}

          {/* Auth Action Buttons: Đăng nhập & Đăng ký (hoặc Hồ sơ nếu đã đăng nhập) */}
          <div className="relative flex items-center gap-1.5 z-50" ref={accountRef}>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(null)
                  setAccountMenuOpen(!accountMenuOpen)
                }}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#f0ebd9] hover:bg-[#e7e1cc] border border-[#d6cfbe] transition-colors relative"
                aria-label="Tài khoản cá nhân"
              >
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#326318] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#1f241a] leading-tight max-w-[130px] truncate">
                    {(user.name || '').replace(/\s*\(Khách mua\)/gi, '').trim()}
                  </span>
                </div>
                <ChevronDown size={14} className="text-[#5b6354]" />
              </button>
            ) : (
              <>
                {/* Desktop: Explicit "Đăng nhập" and "Đăng ký" buttons with Hero colors & compact size */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <a
                    href="/dang-nhap"
                    onClick={closeDropdown}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all border ${
                      route.startsWith('/dang-nhap') || route.startsWith('/login')
                        ? 'bg-primary-container text-white border-primary-container shadow-sm'
                        : 'border-[#4a7c2f]/40 hover:border-[#326318] bg-white/80 hover:bg-[#4a7c2f]/10 text-[#2b591b]'
                    }`}
                  >
                    <UserRound size={14} />
                    <span>Đăng nhập</span>
                  </a>

                  <a
                    href="/dang-ky"
                    onClick={closeDropdown}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-xs transition-all border ${
                      route.startsWith('/dang-ky') || route.startsWith('/register')
                        ? 'bg-[#254b12] text-white border-[#254b12] shadow-sm'
                        : 'bg-primary-container hover:bg-primary text-white border-transparent shadow-sm shadow-primary-container/25'
                    }`}
                  >
                    <span>Đăng ký</span>
                  </a>
                </div>


              </>
            )}

            {/* Account Popover Menu */}
            {accountMenuOpen && (
              <div className="absolute right-0 sm:-right-12 md:-right-16 lg:-right-24 xl:-right-28 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#ede8df] p-3 z-50 animate-fadeIn">
                {user ? (
                  <div>
                    <div className="p-3 rounded-xl bg-[#faf7ef] border border-[#eee8da] mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#326318] text-white flex items-center justify-center font-extrabold text-sm shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-xs text-[#20271c] truncate">
                            {(user.name || '').replace(/\s*\(Khách mua\)/gi, '').trim()}
                          </h4>
                          <p className="text-[11px] text-[#6d7567] truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-xs">
                      {/* Lối vào Portal chuyên biệt theo vai trò người dùng */}
                      {user.role === 'shop' && (
                        <Link
                          to="/shop"
                          onClick={closeDropdown}
                          className="w-full text-left py-2 px-2.5 rounded-xl bg-[#2b5619]/10 hover:bg-[#2b5619]/20 text-[#2b5619] font-bold flex items-center justify-between transition-colors border border-[#2b5619]/20 mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-[#2b5619] text-white flex items-center justify-center shrink-0">
                              <Store size={15} />
                            </span>
                            <span>Kênh Quản Lý Nhà Vườn</span>
                          </div>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={closeDropdown}
                          className="w-full text-left py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold flex items-center justify-between transition-colors border border-purple-200 mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                              <ShieldCheck size={15} />
                            </span>
                            <span>Trung Tâm Quản Trị Admin</span>
                          </div>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                      {user.role === 'shipper' && (
                        <Link
                          to="/shipper"
                          onClick={closeDropdown}
                          className="w-full text-left py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center justify-between transition-colors border border-amber-200 mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                              <Truck size={15} />
                            </span>
                            <span>Cổng Giao Hàng Shipper</span>
                          </div>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      <Link
                        to="/orders"
                        onClick={closeDropdown}
                        className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-[#f3eee2] text-[#333a2d] font-semibold flex items-center gap-2.5 transition-colors group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#eaf4e5] group-hover:bg-[#d8ebd1] flex items-center justify-center shrink-0 text-[#326318]">
                          <ShoppingBag size={16} />
                        </span>
                        <span>Đơn Hàng Của Tôi</span>
                      </Link>

                      <Link
                        to="/my-vouchers"
                        onClick={closeDropdown}
                        className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-[#f3eee2] text-[#333a2d] font-semibold flex items-center gap-2.5 transition-colors group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#fef3db] group-hover:bg-[#fde9c0] flex items-center justify-center shrink-0 text-amber-700">
                          <Ticket size={16} />
                        </span>
                        <span>Kho Voucher Của Tôi</span>
                      </Link>

                      <Link
                        to="/my-wallet"
                        onClick={closeDropdown}
                        className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-[#f3eee2] text-[#333a2d] font-semibold flex items-center gap-2.5 transition-colors group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#eaf4e5] group-hover:bg-[#d8ebd1] flex items-center justify-center shrink-0 text-[#326318]">
                          <Wallet size={16} />
                        </span>
                        <span>Ví Của Tôi</span>
                      </Link>

                      <Link
                        to="/tai-khoan"
                        onClick={closeDropdown}
                        className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-[#f3eee2] text-[#333a2d] font-semibold flex items-center gap-2.5 transition-colors group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#eaf4e5] group-hover:bg-[#d8ebd1] flex items-center justify-center shrink-0 text-[#326318]">
                          <User size={16} />
                        </span>
                        <span>Hồ Sơ & Cài Đặt</span>
                      </Link>

                      <hr className="my-1.5 border-[#ede8df]" />

                      <button
                        type="button"
                        onClick={() => {
                          closeDropdown()
                          onLogout?.()
                        }}
                        className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-red-50 text-red-600 font-bold flex items-center gap-2.5 transition-colors group cursor-pointer"
                      >
                        <span className="w-7 h-7 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center shrink-0 text-red-600">
                          <LogOut size={16} />
                        </span>
                        <span>Đăng Xuất</span>
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
                      <Link
                        to="/dang-nhap"
                        onClick={closeDropdown}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs text-center transition-colors shadow-sm"
                      >
                        Đăng Nhập
                      </Link>

                      <Link
                        to="/dang-ky"
                        onClick={closeDropdown}
                        className="w-full py-2.5 px-3 rounded-xl border border-[#326318] text-[#326318] hover:bg-[#f1faea] font-bold text-xs text-center transition-colors"
                      >
                        Đăng Ký Tài Khoản Mới
                      </Link>
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
              href={homeHref}
              className={`nav-pill ${isHomeActive ? 'is-active' : ''}`}
              aria-current={isHomeActive ? 'page' : undefined}
              onClick={closeDropdown}
            >
              Trang chủ
            </a>

            {/* 1b. Chiến dịch giải cứu: cùng kiểu pill, thêm icon lửa + số chiến dịch đang mở */}
            <a
              href="/chien-dich"
              className={`nav-pill nav-pill-campaign ${isCampaignActive ? 'is-active' : ''}`}
              aria-current={isCampaignActive ? 'page' : undefined}
              onClick={closeDropdown}
            >
              <Flame size={14} className="nav-pill-campaign-icon" aria-hidden />
              <span>Chiến dịch</span>
              {openCampaignCount > 0 && (
                <span className="nav-pill-campaign-count" aria-label={`${openCampaignCount} chiến dịch đang mở`}>
                  {openCampaignCount > 9 ? '9+' : openCampaignCount}
                </span>
              )}
            </a>

            {/* 2. Nông sản tươi (Hover trigger) */}
            <div className="relative" onMouseEnter={() => handleMouseEnter('fresh')}>
              <a
                href="/nong-san-tuoi"
                className={`nav-pill ${isFreshActive ? 'is-active' : ''} ${activeDropdown === 'fresh' ? 'is-hovered' : ''
                  }`}
                aria-current={isFreshActive ? 'page' : undefined}
                onClick={closeDropdown}
              >
                <span>Nông sản tươi</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${activeDropdown === 'fresh' ? 'rotate-180 text-white' : 'opacity-75'
                    }`}
                />
              </a>
            </div>

            {/* 3. Combo & Túi mù (Hover trigger) */}
            <div className="relative" onMouseEnter={() => handleMouseEnter('combo')}>
              <a
                href="/combo-tui-mu"
                className={`nav-pill ${isComboActive ? 'is-active' : ''} ${activeDropdown === 'combo' ? 'is-hovered' : ''
                  }`}
                aria-current={isComboActive ? 'page' : undefined}
                onClick={closeDropdown}
              >
                <span>Combo &amp; Túi mù</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${activeDropdown === 'combo' ? 'rotate-180 text-white' : 'opacity-75'
                    }`}
                />
              </a>
            </div>

            {/* 4. Kế hoạch ăn uống */}
            <a
              href="/ke-hoach-an-uong"
              className={`nav-pill ${route.startsWith('/ke-hoach-an-uong') ? 'is-active' : ''}`}
              aria-current={route.startsWith('/ke-hoach-an-uong') ? 'page' : undefined}
              onClick={closeDropdown}
            >
              Thực đơn AI
            </a>

            {/* 6. Câu chuyện nông dân */}
            <a
              href="/cau-chuyen-nong-dan"
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
                      {(leafProducts.length > 0 ? leafProducts : allProducts).slice(0, 5).map((item) => (
                        <li key={item.productId ?? item.id}>
                          <Link
                            to={`/san-pham/${item.productId ?? item.id}`}
                            onClick={closeDropdown}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5 truncate"
                          >
                            {item.productName ?? item.name}
                          </Link>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Rau lá', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem tất cả rau lá</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 2: Củ Tươi */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#e65100]" />
                      <span>Củ Tươi Ngon</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {(rootProducts.length > 0 ? rootProducts : allProducts).slice(0, 5).map((item) => (
                        <li key={item.productId ?? item.id}>
                          <Link
                            to={`/san-pham/${item.productId ?? item.id}`}
                            onClick={closeDropdown}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5 truncate"
                          >
                            {item.productName ?? item.name}
                          </Link>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Củ', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-[#e65100] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem tất cả củ</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 3: Quả / Trái Cây */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                      <span>Quả / Trái Cây</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {(fruitProducts.length > 0 ? fruitProducts : allProducts).slice(0, 5).map((item) => (
                        <li key={item.productId ?? item.id}>
                          <Link
                            to={`/san-pham/${item.productId ?? item.id}`}
                            onClick={closeDropdown}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5 truncate"
                          >
                            {item.productName ?? item.name}
                          </Link>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Trái cây', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-[#d97706] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem tất cả trái cây</span>
                          <ArrowRight size={12} />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Col 4: Hữu Cơ & Đặc Sản */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                      <span>Hữu Cơ &amp; Đặc Sản</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {(specialtyProducts.length > 0 ? specialtyProducts : allProducts).slice(0, 5).map((item) => (
                        <li key={item.productId ?? item.id}>
                          <Link
                            to={`/san-pham/${item.productId ?? item.id}`}
                            onClick={closeDropdown}
                            className="text-left text-[#384133] hover:text-primary hover:translate-x-1 font-medium transition-all block py-0.5 truncate"
                          >
                            {item.productName ?? item.name}
                          </Link>
                        </li>
                      ))}
                      <li className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('Tất cả', '/nong-san-tuoi')}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
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
                    <span className="text-xs font-bold text-[#ffea79]">
                      Chỉ từ {minProducePrice.toLocaleString('vi-VN')}đ{minProducePrice < 100000 ? '/kg' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('Tất cả', '/nong-san-tuoi')}
                      className="px-3.5 py-1.5 rounded-full bg-white text-[#144217] hover:bg-[#ffea79] font-bold text-xs transition-colors shadow flex items-center gap-1 cursor-pointer"
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
                      {mysteryBoxes.slice(0, 5).map((item) => (
                        <li key={item.mysteryId ?? item.id}>
                          <Link
                            to={`/mystery-box/${item.mysteryId ?? item.id}`}
                            onClick={closeDropdown}
                            className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5 truncate"
                          >
                            {item.boxType} ({item.price.toLocaleString('vi-VN')}đ)
                          </Link>
                        </li>
                      ))}
                      <li className="pt-1">
                        <Link
                          to="/combo-tui-mu"
                          onClick={closeDropdown}
                          className="text-[11px] font-bold text-[#8a4e1d] hover:underline flex items-center gap-1"
                        >
                          <span>Mở hộp bất ngờ ngay</span>
                          <ArrowRight size={12} />
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Col 2: Combo Bữa Ăn & Tiết Kiệm */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8a4e1d] border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#2e7d32]" />
                      <span>Combo Bữa Ăn &amp; Gia Đình</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      {allCombos.slice(0, 5).map((item) => (
                        <li key={item.comboId ?? item.id}>
                          <Link
                            to={`/combo/${item.comboId ?? item.id}`}
                            onClick={closeDropdown}
                            className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5 truncate"
                          >
                            {item.comboName} ({item.price.toLocaleString('vi-VN')}đ)
                          </Link>
                        </li>
                      ))}
                      <li className="pt-1">
                        <Link
                          to="/combo-tui-mu"
                          onClick={closeDropdown}
                          className="text-[11px] font-bold text-[#8a4e1d] hover:underline flex items-center gap-1"
                        >
                          <span>Xem tất cả combo</span>
                          <ArrowRight size={12} />
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Col 3: Phân Loại Bữa Ăn & Thực Đơn AI */}
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8a4e1d] border-b border-[#ede8df] pb-2 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#d97706]" />
                      <span>Phân Loại Theo Bữa &amp; AI</span>
                    </h3>
                    <ul className="flex flex-col gap-1.5 text-xs text-[#444b3e]">
                      <li>
                        <Link
                          to="/combo-tui-mu?mealType=BREAKFAST"
                          onClick={closeDropdown}
                          className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5"
                        >
                          Combo Bữa Sáng Tiện Lợi
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/combo-tui-mu?mealType=LUNCH"
                          onClick={closeDropdown}
                          className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5"
                        >
                          Combo Cơm Trưa Gia Đình
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/combo-tui-mu?mealType=DINNER"
                          onClick={closeDropdown}
                          className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5"
                        >
                          Combo Bữa Tối Thanh Nhiệt
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/ke-hoach-an-uong"
                          onClick={closeDropdown}
                          className="text-left text-[#384133] hover:text-[#8a4e1d] hover:translate-x-1 font-medium transition-all block py-0.5"
                        >
                          Kế hoạch ăn uống AI cá nhân hóa
                        </Link>
                      </li>
                      <li className="pt-1">
                        <Link
                          to="/ke-hoach-an-uong"
                          onClick={closeDropdown}
                          className="text-[11px] font-bold text-[#8a4e1d] hover:underline flex items-center gap-1"
                        >
                          <span>Khám phá thực đơn AI</span>
                          <ArrowRight size={12} />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Promo Box */}
                <div className="col-span-4 xl:col-span-3 bg-gradient-to-br from-[#8a4e1d] via-[#6e3910] to-[#452008] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 text-[#ffea79] px-2.5 py-0.5 rounded-full w-fit">
                      <Sparkles size={12} />
                      <span>HỘP BÍ ẨN CAPNONG</span>
                    </span>
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      Mở Túi Mù – Đón Bất Ngờ
                    </h4>
                    <p className="text-xs text-white/85 leading-snug line-clamp-2">
                      Nông sản tươi tuyển chọn từ các nhà vườn chuẩn VietGAP, tiết kiệm chi phí tối đa.
                    </p>
                  </div>

                  <div className="relative z-10 mt-3 pt-2 border-t border-white/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffea79]">
                      Chỉ từ {minMysteryPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdown()
                        navigate('/combo-tui-mu')
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-white text-[#6e3910] hover:bg-[#ffea79] font-bold text-xs transition-colors shadow flex items-center gap-1 cursor-pointer"
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
            href={homeHref}
            className={`text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors ${isHomeActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
              }`}
            onClick={closeDropdown}
          >
            Trang chủ
          </a>

          {/* 1b. Chiến dịch giải cứu */}
          <a
            href="/chien-dich"
            className={`text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors flex items-center gap-2 ${isCampaignActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
              }`}
            aria-current={isCampaignActive ? 'page' : undefined}
            onClick={closeDropdown}
          >
            <Flame size={15} className={isCampaignActive ? 'text-[#ffba41]' : 'text-[#e8590c]'} aria-hidden />
            Chiến dịch
            {openCampaignCount > 0 && (
              <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[#ffba41] text-[11px] font-extrabold text-[#3d2a00] inline-flex items-center justify-center">
                {openCampaignCount > 9 ? '9+' : openCampaignCount}
              </span>
            )}
          </a>

          {/* 2. Nông sản tươi (Accordion) */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setMobileSubMenu(mobileSubMenu === 'fresh' ? null : 'fresh')}
              className={`text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors flex items-center justify-between ${isFreshActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
                }`}
            >
              <span>Nông sản tươi</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${mobileSubMenu === 'fresh' ? 'rotate-180 text-primary' : ''
                  }`}
              />
            </button>
            {mobileSubMenu === 'fresh' && (
              <div className="pl-4 pr-2 py-3 flex flex-col gap-2 bg-[#f0ece1] rounded-2xl my-1.5 text-xs">
                <span className="font-bold text-primary uppercase text-[10px]">Danh mục nông sản:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[#384133]">
                  {allCategories.map((cat) => (
                    <button
                      key={cat.categoryId}
                      type="button"
                      onClick={() => {
                        closeDropdown()
                        navigate(`/nong-san-tuoi?categoryId=${cat.categoryId}`)
                      }}
                      className="text-left py-1 hover:text-primary truncate"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <Link
                  to="/nong-san-tuoi"
                  onClick={closeDropdown}
                  className="mt-2 text-center py-2 rounded-xl bg-primary text-white font-bold"
                >
                  Xem tất cả nông sản →
                </Link>
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
                {mysteryBoxes.slice(0, 3).map((box) => (
                  <button
                    key={box.mysteryId ?? box.id}
                    type="button"
                    onClick={() => {
                      closeDropdown()
                      navigate(`/mystery-box/${box.mysteryId ?? box.id}`)
                    }}
                    className="text-left py-1 hover:text-[#8a4e1d] truncate"
                  >
                    🎁 {box.boxType} ({box.price.toLocaleString('vi-VN')}đ)
                  </button>
                ))}
                {allCombos.slice(0, 3).map((combo) => (
                  <button
                    key={combo.comboId ?? combo.id}
                    type="button"
                    onClick={() => {
                      closeDropdown()
                      navigate(`/combo/${combo.comboId ?? combo.id}`)
                    }}
                    className="text-left py-1 hover:text-[#8a4e1d] truncate"
                  >
                    🍲 {combo.comboName} ({combo.price.toLocaleString('vi-VN')}đ)
                  </button>
                ))}
                <Link
                  to="/combo-tui-mu"
                  onClick={closeDropdown}
                  className="mt-2 text-center py-2 rounded-xl bg-[#8a4e1d] text-white font-bold"
                >
                  Khám phá tất cả Combo &amp; Túi Mù →
                </Link>
              </div>
            )}
          </div>

          {/* 4. Thực đơn AI */}
          <a
            href="/ke-hoach-an-uong"
            className={`text-left text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors ${route.startsWith('/ke-hoach-an-uong') ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
              }`}
            onClick={closeDropdown}
          >
            Thực đơn AI
          </a>

          {/* 5. Câu chuyện nông dân */}
          <a
            href="/cau-chuyen-nong-dan"
            className={`text-left text-sm font-bold py-2.5 px-3.5 rounded-full transition-colors ${isFarmerActive ? 'bg-[#4a7c2f] text-white' : 'text-[#42493c] hover:bg-[#e7efdf]'
              }`}
            onClick={closeDropdown}
          >
            Câu chuyện nông dân
          </a>

          {/* 6. Auth Mobile Section */}
          <div className="mt-3 pt-3 border-t border-[#ede8df] flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2 p-3 bg-[#f0ebd9] rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#326318] text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-[#20271c] truncate">
                        {(user.name || '').replace(/\s*\(Khách mua\)/gi, '').trim()}
                      </div>
                      <div className="text-[11px] text-[#555d4e] truncate">{user.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeDropdown()
                      onLogout?.()
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 my-1">
                  {user.role === 'shop' && (
                    <Link
                      to="/shop"
                      onClick={closeDropdown}
                      className="w-full py-2 px-3 rounded-xl bg-[#2b5619] text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 mb-0.5"
                    >
                      <Store size={14} />
                      <span>Kênh Quản Lý Nhà Vườn</span>
                    </Link>
                  )}

                  <Link
                    to="/orders"
                    onClick={closeDropdown}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-xs text-center border border-emerald-300 flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={14} className="text-emerald-700" />
                    <span>Đơn Hàng Của Tôi</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-1.5">
                    <Link
                      to="/my-vouchers"
                      onClick={closeDropdown}
                      className="py-2 px-2.5 rounded-xl bg-white border border-amber-500 text-amber-800 font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Ticket size={13} />
                      <span>Kho Voucher</span>
                    </Link>
                    <Link
                      to="/my-wallet"
                      onClick={closeDropdown}
                      className="py-2 px-2.5 rounded-xl bg-white border border-[#326318] text-[#326318] font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Wallet size={13} />
                      <span>Ví Của Tôi</span>
                    </Link>
                  </div>

                  <Link
                    to={messagesHref}
                    onClick={closeDropdown}
                    className="w-full py-2 px-3 rounded-xl bg-white text-[#326318] font-bold text-xs border border-[#326318] flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-[#326318]" />
                      <span>Tin Nhắn Của Tôi</span>
                    </div>
                    {unreadTotal > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {unreadTotal}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/tai-khoan"
                    onClick={closeDropdown}
                    className="w-full py-2 px-3 rounded-xl bg-[#f4f8f1] text-[#2b5619] font-bold text-xs text-center border border-[#d2e3cc] flex items-center justify-center gap-1.5"
                  >
                    <User size={14} />
                    <span>Hồ Sơ & Cài Đặt</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/dang-nhap"
                  onClick={closeDropdown}
                  className="py-2.5 rounded-xl bg-[#326318] text-white font-bold text-xs text-center shadow-sm"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/dang-ky"
                  onClick={closeDropdown}
                  className="py-2.5 rounded-xl border border-[#326318] text-[#326318] bg-white font-bold text-xs text-center"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSelectKeyword={handleImageSearchSelect}
      />
    </header>
  )
}
