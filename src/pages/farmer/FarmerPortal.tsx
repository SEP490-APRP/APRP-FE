import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingCart,
  MessageSquare,
  Gift,
  Bell,
  Send,
  Wallet,
  Search,
  ChevronRight,
  LogOut,
  Leaf,
  HelpCircle,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import type { AuthUser } from '@/features/auth'
import type {
  FarmerProduct,
  FarmerOrder,
  FarmerVoucher,
  FarmerReview,
} from './types'
import { useShopOrders, useShopProfile } from '@/features/shop'
import { useAuth, useChatStore } from '@/stores'
import { useMyProducts } from '@/features/product/hooks/useProductQueries'

// Modular Subpage Components
import Dashboard from './Dashboard'
import Products from './Products'
import Orders from './Orders'
import OrderPreparation from './OrderPreparation'
import RevenueReport from './RevenueReport'
import Reviews from './Reviews'
import Vouchers from './Vouchers'
import Notifications from './Notifications'
import Profile from './Profile'
import WalletComponent from './Wallet'
import AddProduct from './AddProduct'
import BlindBoxTool from './BlindBoxTool'
import ComboBuilder from './ComboBuilder'
import FarmerDisputes from './FarmerDisputes'
import FarmerBlogs from './FarmerBlogs'
import FarmerMessages from './FarmerMessages'
import OnboardingTour from './OnboardingTour'
import { STORAGE_KEYS } from '@/utils'
import logoIcon from '@/assets/logo-icon.png'

interface FarmerPortalProps {
  user?: AuthUser | null
  onLogout?: () => void
  onNavigateStore?: () => void
  onInfo?: (msg: string) => void
}

export default function FarmerPortal({
  user: propUser,
  onLogout,
  onNavigateStore,
  onInfo,
}: FarmerPortalProps) {
  const { user: authUser, logout: authLogout, token } = useAuth()
  const { data: shopProfile } = useShopProfile()
  const { unreadTotal, loadConversations, loadUnreadCount, initRealtime, setChatViewActive } = useChatStore()

  useEffect(() => {
    if (token) {
      initRealtime(token)
      loadConversations()
      loadUnreadCount()
    }
  }, [token, initRealtime, loadConversations, loadUnreadCount])

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    } else {
      authLogout()
      onNavigateStore?.()
    }
  }
  const user = propUser || authUser
  const displayShopName =
    shopProfile?.shopName ||
    shopProfile?.fullName ||
    user?.shopName ||
    user?.name ||
    'Gian Hàng Nông Sản'

  const displayShopLogo =
    shopProfile?.logoUrl ||
    user?.avatar

  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [currentTab, setCurrentTab] = useState<string>(tabFromUrl || 'overview')
  const [shopActive, setShopActive] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedOrderIdForPrep, setSelectedOrderIdForPrep] = useState<string | null>(null)
  const [showTour, setShowTour] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.FARMER_TOUR_DONE) !== 'true'
  })

  // Cập nhật tab khi URL search param thay đổi
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabParam !== currentTab) {
      setCurrentTab(tabParam)
      setSelectedOrderIdForPrep(null)
    }
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId)
    setSelectedOrderIdForPrep(null)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tabId)
        return next
      },
      { replace: true },
    )
  }

  // Cập nhật trạng thái view chat đang active khi nông dân chọn tab Tin nhắn
  useEffect(() => {
    const isMessages = currentTab === 'messages' && !selectedOrderIdForPrep
    setChatViewActive(isMessages)
  }, [currentTab, selectedOrderIdForPrep, setChatViewActive])

  // Real shop orders hook from backend API (loại trừ AWAITING_PAYMENT)
  const { data: realShopOrdersData } = useShopOrders({ page: 0, size: 50 })
  const realShopOrders = (realShopOrdersData?.content || []).filter((o) => o.status !== 'AWAITING_PAYMENT')
  const pendingOrdersCount = realShopOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PAID',
  ).length

  // Real shop products hook from backend API
  const { data: realMyProductsData } = useMyProducts({ size: 100 })
  const realProductsList: FarmerProduct[] = (realMyProductsData?.content || []).map((p) => ({
    id: String(p.id ?? p.productId),
    name: p.productName || p.name || 'Nông sản',
    category:
      (typeof p.category === 'object' && p.category !== null ? (p.category as any).name : p.category) ||
      'Nông sản',
    price: Number(p.sellingPrice ?? p.price ?? 0),
    originalPrice: Number(p.originalPrice ?? p.price ?? 0),
    discount: p.discountPercent ? `-${p.discountPercent}%` : null,
    status:
      p.status === 'ACTIVE' || p.status === 'APPROVED'
        ? 'Đang bán'
        : p.status === 'PENDING'
          ? 'Chờ duyệt'
          : p.status === 'REJECTED'
            ? 'Bị từ chối'
            : 'Tạm dừng',
    stock: Number(p.stockQuantity ?? p.stock ?? 0),
    unit: p.unit || 'kg',
    region: p.region || 'Đà Lạt',
    image:
      p.imageUrl ||
      p.image ||
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
  }))

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showBlindBoxTool, setShowBlindBoxTool] = useState(false)
  const [showComboBuilder, setShowComboBuilder] = useState(false)
  const [comboToEdit, setComboToEdit] = useState<any | null>(null)
  const [showCreateVoucherModal, setShowCreateVoucherModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [internalToast, setInternalToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  } | null>(null)

  const handleInfo = (
    msg: string,
    type?: 'success' | 'error' | 'warning' | 'info',
  ) => {
    let resolvedType = type
    if (!resolvedType) {
      const lower = msg.toLowerCase()
      if (
        lower.includes('không') ||
        lower.includes('lỗi') ||
        lower.includes('thất bại') ||
        lower.includes('từ chối') ||
        lower.includes('hợp lệ') ||
        lower.includes('vui lòng') ||
        lower.includes('chưa đủ') ||
        lower.includes('vượt quá')
      ) {
        resolvedType = 'error'
      } else {
        resolvedType = 'success'
      }
    }
    setInternalToast({ message: msg, type: resolvedType })
    onInfo?.(msg)
  }

  useEffect(() => {
    if (!internalToast) return
    const timer = setTimeout(() => setInternalToast(null), 4000)
    return () => clearTimeout(timer)
  }, [internalToast])

  // Central Farmer Products State
  const [products, setProducts] = useState<FarmerProduct[]>([
    {
      id: '1',
      name: 'Cà chua Bi vườn hữu cơ Đà Lạt',
      category: 'Nông sản',
      price: 38250,
      originalPrice: 45000,
      discount: '-15%',
      status: 'Đang bán',
      stock: 120,
      unit: 'kg',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: '2',
      name: 'Cải bẹ xanh thủy canh',
      category: 'Nông sản',
      price: 25000,
      originalPrice: 25000,
      discount: null,
      status: 'Đang bán',
      stock: 85,
      unit: 'kg',
      region: 'Lâm Đồng',
      image:
        'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: '3',
      name: 'Khoai Lang Mật Đà Lạt',
      category: 'Nông sản',
      price: 32000,
      originalPrice: 32000,
      discount: null,
      status: 'Đang bán',
      stock: 350,
      unit: 'kg',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: '4',
      name: 'Nấm Đùi Gà Hữu Cơ Đà Lạt',
      category: 'Nông sản',
      price: 45000,
      originalPrice: 45000,
      discount: null,
      status: 'Đang bán',
      stock: 60,
      unit: 'kg',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'box-1',
      name: 'Túi Mù Nông Sản Giải Cứu 5kg',
      category: 'Hộp mù',
      price: 79000,
      originalPrice: 150000,
      discount: '-47%',
      status: 'Đang bán',
      stock: 45,
      unit: 'hộp',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'box-2',
      name: 'Thùng Rau Xanh Gia Đình 10kg',
      category: 'Hộp mù',
      price: 139000,
      originalPrice: 245000,
      discount: '-43%',
      status: 'Đang bán',
      stock: 28,
      unit: 'thùng',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'box-3',
      name: 'Combo Củ Quả Bếp Nấu 10kg',
      category: 'Hộp mù',
      price: 219000,
      originalPrice: 350000,
      discount: '-37%',
      status: 'Đang bán',
      stock: 15,
      unit: 'thùng',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'box-4',
      name: 'Combo Lẩu Nấm Cuối Tuần 4.5kg',
      category: 'Hộp mù',
      price: 149000,
      originalPrice: 220000,
      discount: '-32%',
      status: 'Đang bán',
      stock: 20,
      unit: 'combo',
      region: 'Đà Lạt',
      image:
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
    },
  ])

  // Central Farmer Orders State
  const [orders, setOrders] = useState<FarmerOrder[]>([
    {
      id: 'DH-8921',
      customer: 'Chị Mai Lan (Quận 7, TP.HCM)',
      phone: '0912 *** 889',
      items: 'Khoai Lang Mật 5kg + Cà chua Bi 2kg',
      total: 236500,
      status: 'Chờ xác nhận',
      statusCode: 'PENDING',
      time: '15 phút trước',
      payment: 'VietQR Đã thanh toán',
    },
    {
      id: 'DH-8919',
      customer: 'Bếp Cơm Thiện Nguyện Xanh',
      phone: '0988 *** 112',
      items: 'Thùng Rau Xanh Gia Đình 10kg (x2)',
      total: 278000,
      status: 'Đang chuẩn bị',
      statusCode: 'CONFIRMED',
      time: '1 giờ trước',
      payment: 'COD (Thu hộ khi giao)',
    },
    {
      id: 'DH-8902',
      customer: 'Anh Tuấn Kiệt (Cầu Giấy, HN)',
      phone: '0903 *** 456',
      items: 'Túi Mù Nông Sản 5kg',
      total: 79000,
      status: 'Đang giao',
      statusCode: 'SHIPPING',
      time: 'Hôm qua',
      payment: 'Ví CapNong Pay',
    },
  ])

  // Central Vouchers State
  const [vouchers, setVouchers] = useState<FarmerVoucher[]>([
    {
      id: 'VOUCHER-1',
      code: 'GIAICUU15',
      discount: 'Giảm 15%',
      minOrder: 'Đơn từ 100.000đ',
      expiry: 'Còn 15 ngày',
      used: 48,
    },
    {
      id: 'VOUCHER-2',
      code: 'FREESHIPKHO',
      discount: 'Freeship 20k',
      minOrder: 'Đơn từ 150.000đ',
      expiry: 'Còn 30 ngày',
      used: 92,
    },
  ])

  // Central Reviews State
  const [reviews] = useState<FarmerReview[]>([
    {
      id: '1',
      user: 'Trần Ngọc Bích (TP.HCM)',
      rating: 5,
      date: 'Hôm qua',
      product: 'Khoai Lang Mật Đà Lạt',
      comment:
        'Khoai nướng tươm mật ngọt lịm, củ tuy hơi cong queo nhưng ăn ngon gấp đôi hàng ngoài chợ. Sẽ ủng hộ chú Bảy tiếp!',
    },
    {
      id: '2',
      user: 'Bếp Cơm Nhà Gạo',
      rating: 5,
      date: '2 ngày trước',
      product: 'Cải bẹ xanh thủy canh',
      comment:
        'Rau xanh mướt, tươi giòn xào thịt bò rất thơm ngon. Đóng thùng cẩn thận lót giấy ẩm rất chuẩn.',
    },
  ])

  // Handlers
  const handleAddNewProduct = (newProd: FarmerProduct) => {
    setProducts([newProd, ...products])
  }

  const handleAddNewVoucher = () => {
    const newVc: FarmerVoucher = {
      id: Date.now().toString(),
      code: 'UUDAI20K',
      discount: 'Giảm 20.000đ',
      minOrder: 'Đơn từ 120.000đ',
      expiry: 'Còn 20 ngày',
      used: 0,
    }
    setVouchers([newVc, ...vouchers])
    setShowCreateVoucherModal(false)
    onInfo?.('Đã tạo mã khuyến mãi mới thành công')
  }

  // Sidebar Menu List (Đã đồng bộ chuẩn 10 tính năng CapNong)
  const farmerMenu = [
    { name: 'Tổng quan', icon: LayoutDashboard, id: 'overview' },
    { name: 'Báo cáo doanh thu', icon: BarChart3, id: 'revenue-report' },
    { name: 'Sản phẩm', icon: Package, id: 'products' },
    { name: 'Đơn hàng', icon: ShoppingCart, id: 'orders' },
    { name: 'Khiếu nại & Trợ giúp', icon: AlertTriangle, id: 'disputes' },
    { name: 'Đánh giá', icon: MessageSquare, id: 'reviews' },
    { name: 'Bài viết & Bảng tin', icon: BookOpen, id: 'blogs' },
    { name: 'Voucher', icon: Gift, id: 'vouchers' },
    { name: 'Thông báo', icon: Bell, id: 'notifications' },
    { name: 'Tin nhắn', icon: Send, id: 'messages' },
    { name: 'Ví tiền', icon: Wallet, id: 'wallet' },
  ]

  return (
    <div className="flex h-screen w-full bg-[#f8faf6] text-[#1c2216] overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR                                                           */}
      {/* ========================================================================= */}
      <aside className="w-72 bg-white border-r border-[#e8ece3] flex flex-col h-full shadow-sm z-30 shrink-0">
        <div className="p-6 pb-4 border-b border-[#f1f4ed]">
          <div
            onClick={() => {
              setCurrentTab('overview')
              setSelectedOrderIdForPrep(null)
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={logoIcon}
              alt="CapNong"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-base font-black leading-none text-[#1c2216] tracking-tight uppercase">
                CapNong
              </h1>
              <p className="text-[#326318] text-[10px] font-extrabold mt-1 tracking-widest uppercase">
                NÔNG TRẠI XANH
              </p>
            </div>
          </div>
        </div>

        <nav className="farmer-sidebar-nav flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {farmerMenu.map((item) => {
            const isActive = currentTab === item.id && !selectedOrderIdForPrep
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                className={`farmer-sidebar-btn w-full flex items-center gap-3.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer text-left ${isActive
                  ? showTour
                    ? 'border-2 border-[#326318] bg-[#326318]/10 text-[#326318] font-black shadow-md'
                    : 'bg-[#326318]/10 text-[#326318] font-black shadow-sm'
                  : 'text-[#616a5b] hover:bg-[#f2f6ee] hover:text-[#1c2216]'
                  }`}
              >
                <item.icon
                  size={19}
                  className={`shrink-0 ${isActive ? 'text-[#326318]' : 'text-[#879181]'}`}
                />
                <span className="font-extrabold flex-1">{item.name}</span>
                {item.id === 'messages' && unreadTotal > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs animate-pulse shrink-0">
                    {unreadTotal > 9 ? '9+' : unreadTotal}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-[#326318] opacity-70" />}
              </button>
            )
          })}
        </nav>

        <div className="p-4 [@media(min-height:980px)]:p-5 border-t border-[#f1f4ed] bg-[#fdfcf9]">
          <div
            className={`p-2.5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm ${currentTab === 'profile' && !selectedOrderIdForPrep
              ? 'bg-[#326318]/10 border-[#326318] shadow-sm ring-2 ring-[#326318]/20'
              : 'bg-white border-[#e5eadd] hover:border-[#326318]/40 hover:bg-[#fafcf8]'
              }`}
          >
            <div
              id="sidebar-item-profile"
              role="button"
              tabIndex={0}
              onClick={() => handleTabChange('profile')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTabChange('profile')
                }
              }}
              title="Bấm để xem và chỉnh sửa hồ sơ cá nhân"
              className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer group py-0.5"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 shadow-xs overflow-hidden ${currentTab === 'profile' && !selectedOrderIdForPrep
                  ? 'bg-[#326318] text-white ring-2 ring-[#326318]/40'
                  : 'bg-[#326318] text-white'
                  }`}
              >
                {displayShopLogo ? (
                  <img src={displayShopLogo} alt={displayShopName} className="w-full h-full object-cover" />
                ) : (
                  <span>{displayShopName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <div
                  className={`text-[11px] font-black truncate transition-colors flex items-center gap-1 ${currentTab === 'profile' && !selectedOrderIdForPrep
                    ? 'text-[#326318]'
                    : 'text-[#1c2216] group-hover:text-[#326318]'
                    }`}
                >
                  <span className="truncate">{displayShopName}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShopActive(!shopActive)
                    onInfo?.(shopActive ? 'Cửa hàng đã tạm nghỉ bán' : 'Cửa hàng đã mở bán')
                  }}
                  title="Bấm để đổi trạng thái bán hàng"
                  className="flex items-center gap-1.5 text-[9px] font-bold text-[#326318] cursor-pointer hover:underline mt-0.5"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${shopActive ? 'bg-[#326318]' : 'bg-gray-400'
                      }`}
                  />
                  <span>{shopActive ? 'ĐANG BÁN' : 'TẠM NGHỈ'}</span>
                </button>
              </div>
            </div>

            <button
              id="tour-sidebar-logout"
              type="button"
              onClick={handleLogout}
              title="Đăng xuất / Về trang mua sắm"
              className="p-1.5 rounded-xl hover:bg-[#fdeeed] text-[#9aa194] hover:text-[#c5221f] transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT                                                           */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white border-b border-[#e8ece3] px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-[#1c2216] tracking-tight">
              Bảng Điều Khiển Nông Dân
            </h2>
            <p className="text-xs text-[#737c6e] font-medium mt-0.5">
              Chào buổi sáng, hôm nay bạn có{' '}
              <strong className="text-[#326318]">
                {realShopOrders.length > 0
                  ? pendingOrdersCount
                  : orders.filter((o) => o.statusCode === 'PENDING').length}
              </strong>{' '}
              đơn hàng cần xử lý.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929a8c]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhanh..."
                className="pl-9 pr-4 py-2 bg-[#f4f7f1] rounded-full text-xs text-[#1e2319] placeholder-[#8e9688] outline-none focus:bg-white focus:ring-1 focus:ring-[#326318] w-56 transition-all"
              />
            </div>


            <button
              type="button"
              onClick={() => {
                setCurrentTab('notifications')
                setSelectedOrderIdForPrep(null)
              }}
              className="w-10 h-10 rounded-full bg-[#f4f7f1] hover:bg-[#eaf0e6] flex items-center justify-center text-[#555d4e] relative transition-colors cursor-pointer"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#e53935] ring-2 ring-white" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTour(true)
                setCurrentTab('overview')
              }}
              title="Xem lại hướng dẫn cho nông dân"
              className="px-3.5 py-2 rounded-full bg-[#f4f7f1] hover:bg-[#e4ede0] text-xs font-bold text-[#326318] flex items-center gap-1.5 transition-colors cursor-pointer border border-[#d6dcce]"
            >
              <HelpCircle size={15} />
              <span>Hướng dẫn</span>
            </button>
          </div>
        </header>

        {/* Dynamic Modular Subpages Body */}
        <div className="p-8 space-y-8 flex-1">
          {selectedOrderIdForPrep ? (
            <OrderPreparation
              orderId={selectedOrderIdForPrep}
              onBack={() => setSelectedOrderIdForPrep(null)}
              onInfo={handleInfo}
            />
          ) : currentTab === 'overview' ? (
            <Dashboard
              onNavigate={(tab) => handleTabChange(tab)}
              onOpenAddProduct={() => setShowAddProductModal(true)}
            />
          ) : currentTab === 'revenue-report' ? (
            <RevenueReport />
          ) : currentTab === 'products' ? (
            <Products
              products={realProductsList.length > 0 ? realProductsList : products}
              onOpenAddProduct={() => setShowAddProductModal(true)}
              onOpenBlindBoxTool={() => setShowBlindBoxTool(true)}
              onOpenComboBuilder={(combo?: any) => {
                const isEvent = combo && typeof combo === 'object' && ('nativeEvent' in combo || 'target' in combo || 'bubbles' in combo)
                setComboToEdit(isEvent ? null : (combo || null))
                setShowComboBuilder(true)
              }}
              onInfo={handleInfo}
            />
          ) : currentTab === 'orders' ? (
            <Orders
              onOpenOrderPrep={(ordId) => setSelectedOrderIdForPrep(ordId)}
              onInfo={handleInfo}
            />
          ) : currentTab === 'disputes' ? (
            <FarmerDisputes />
          ) : currentTab === 'blogs' ? (
            <FarmerBlogs onInfo={handleInfo} />
          ) : currentTab === 'reviews' ? (
            <Reviews reviews={reviews} />
          ) : currentTab === 'vouchers' ? (
            <Vouchers onInfo={handleInfo} />
          ) : currentTab === 'notifications' ? (
            <Notifications />
          ) : currentTab === 'profile' ? (
            <Profile user={user} shopProfile={shopProfile} onInfo={handleInfo} />
          ) : currentTab === 'wallet' ? (
            <WalletComponent onOpenWithdraw={() => setShowWithdrawModal(true)} onInfo={handleInfo} />
          ) : currentTab === 'messages' ? null : (
            <FarmerDisputes />
          )}

          {/* Duy trì phân hệ Tin nhắn luôn mounted để không làm mất tiến trình tải video/ảnh khi chuyển tab */}
          <div className={!selectedOrderIdForPrep && currentTab === 'messages' ? 'block' : 'hidden'}>
            <FarmerMessages />
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* ONBOARDING TOUR FOR NEW FARMERS                                           */}
      {/* ========================================================================= */}
      <OnboardingTour
        isOpen={showTour}
        onNavigate={(path) => handleTabChange(path)}
        onClose={() => setShowTour(false)}
      />

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <AddProduct
          onAddProduct={handleAddNewProduct}
          onClose={() => setShowAddProductModal(false)}
          onInfo={handleInfo}
        />
      )}

      {showBlindBoxTool && (
        <BlindBoxTool
          onAddBox={handleAddNewProduct}
          onClose={() => setShowBlindBoxTool(false)}
          onInfo={handleInfo}
        />
      )}

      {showComboBuilder && (
        <ComboBuilder
          initialCombo={comboToEdit}
          onAddCombo={handleAddNewProduct}
          onClose={() => {
            setShowComboBuilder(false)
            setComboToEdit(null)
          }}
          onInfo={handleInfo}
        />
      )}

      {/* Floating Toast Notification */}
      {internalToast && (
        <div
          className={`fixed top-6 right-6 z-[100] max-w-sm w-full bg-[#1c2216] text-white p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-fadeIn ${internalToast.type === 'error'
            ? 'border-rose-500/50'
            : internalToast.type === 'warning'
              ? 'border-amber-500/50'
              : 'border-emerald-500/30'
            }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black ${internalToast.type === 'error'
              ? 'bg-rose-500/20 text-rose-400'
              : internalToast.type === 'warning'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
              }`}
          >
            {internalToast.type === 'error' ? '✕' : internalToast.type === 'warning' ? '⚠️' : '✓'}
          </div>
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {internalToast.message}
          </div>
          <button
            type="button"
            onClick={() => setInternalToast(null)}
            className="text-gray-400 hover:text-white font-bold px-1 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
