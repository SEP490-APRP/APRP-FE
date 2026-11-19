import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Grid,
  List,
  Star,
  ShoppingCart,
  Heart,
  MessageCircle,
  Clock,
  Package,
  TrendingUp,
  Loader2,
  MapPin,
  ShieldCheck,
  Gift,
  Share2,
  Copy,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Info,
  ChevronRight,
  Store,
  Leaf,
  CheckCircle2,
  Award,
  Filter,
  Phone,
  Mail,
  Layers,
} from 'lucide-react'

import freshFarmerBanner from '@/assets/fresh-farmer-banner.jpg'
import comboGreenImg from '@/assets/combo-green.jpg'
import comboMysteryImg from '@/assets/combo-mystery.jpg'
import { formatMealType } from '@/services/combo.types'
import { useAddToCart } from '@/features/cart'
import { CustomSelect } from '@/components/common/CustomSelect'

const SORT_BY_OPTIONS = [
  { value: 'default', label: 'Sắp xếp: Mặc định' },
  { value: 'asc', label: 'Giá: Thấp → Cao' },
  { value: 'desc', label: 'Giá: Cao → Thấp' },
  { value: 'name', label: 'Tên: A → Z' },
]
import { useShopMysteryBoxes } from '@/features/mystery-box'
import { useShopProducts, useShopCombos } from '@/features/product'
import { useReactToReview, useShopReviews } from '@/features/review'
import { useUser } from '@/features/user'
import { useReceiveVoucher, useShopVouchers } from '@/features/voucher'
import { globalShowAlert } from '@/components/common/Popup'
import { useChatStore } from '@/stores/useChatStore'
import { absoluteUrl, getErrorMessage } from '@/utils'
import { CapNongLoading } from '@/components/ui/Loading'
import Pagination from '@/components/ui/Pagination'
import { getProduceFallback, resolveProductImage } from './components/productDetail.utils'
import logoIcon from '@/assets/logo-icon.png'

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

interface ShopProductsProps {
  shopId: number
  onBack: () => void
  isAuthenticated?: boolean
  onOpenLogin?: () => void
}

type TabType = 'products' | 'mystery-boxes' | 'reviews' | 'about'

const ShopProducts: React.FC<ShopProductsProps> = ({
  shopId,
  onBack,
  isAuthenticated = false,
  onOpenLogin = () => {},
}) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [comboTabFilter, setComboTabFilter] = useState<'all' | 'combos' | 'mystery-boxes'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const followStorageKey = `capnong_follow_shop_${shopId}`
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    return localStorage.getItem(followStorageKey) === 'true'
  })

  const productsQuery = useShopProducts(shopId)
  const shopQuery = useUser(shopId)
  const reviewsQuery = useShopReviews(shopId)
  const boxesQuery = useShopMysteryBoxes(shopId)
  const combosQuery = useShopCombos(shopId)

  const products = productsQuery.data ?? []
  const shopInfo = shopQuery.data ?? null
  const reviews = reviewsQuery.data ?? []
  const mysteryBoxes = boxesQuery.data ?? []
  const combos = combosQuery.data ?? []

  const totalComboMysteryCount = combos.length + mysteryBoxes.length

  const loading =
    productsQuery.isPending ||
    shopQuery.isPending ||
    reviewsQuery.isPending ||
    boxesQuery.isPending ||
    combosQuery.isPending

  const vouchersQuery = useShopVouchers(shopId, 0, 4, isAuthenticated)
  const shopVouchers = vouchersQuery.data?.vouchers ?? []
  const canReceiveMap = vouchersQuery.data?.canReceive ?? {}
  const voucherLoading = vouchersQuery.isFetching
  const voucherError = vouchersQuery.isError ? 'Không tải được voucher của shop.' : null

  const addToCart = useAddToCart()

  const isAddingItem = (type: 'PRODUCT' | 'MYSTERY_BOX' | 'BUILD_COMBO', id: number) => {
    if (!addToCart.isPending || !addToCart.variables) return false
    const vars = addToCart.variables as any
    if (type === 'PRODUCT') {
      return vars.productId === id || (vars.itemType === 'PRODUCT' && vars.itemId === id)
    }
    if (type === 'MYSTERY_BOX') {
      return vars.mysteryBoxId === id || (vars.itemType === 'MYSTERY_BOX' && vars.itemId === id)
    }
    if (type === 'BUILD_COMBO') {
      return vars.buildComboId === id || (vars.itemType === 'BUILD_COMBO' && vars.itemId === id)
    }
    return false
  }

  const receiveVoucher = useReceiveVoucher()
  const receivingVoucher = receiveVoucher.isPending ? receiveVoucher.variables : null
  const reactToReview = useReactToReview()
  const reactingReviewId = reactToReview.isPending ? reactToReview.variables.reviewId : null

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const handleAddToCart = async (productId: number) => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    try {
      await addToCart.mutateAsync({
        itemType: 'PRODUCT',
        itemId: productId,
        productId,
        quantity: 1,
      })
      window.dispatchEvent(new Event('cart-updated'))
      globalShowAlert('Đã thêm vào giỏ hàng!', 'Thành công', 'success')
    } catch (e: any) {
      const msg = getErrorMessage(e, 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.')
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  const handleAddBoxToCart = async (boxId: number) => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    if (!boxId) {
      globalShowAlert('Không tìm thấy thông tin túi mù.', 'Lỗi', 'error')
      return
    }
    try {
      await addToCart.mutateAsync({
        itemType: 'MYSTERY_BOX',
        itemId: boxId,
        mysteryBoxId: boxId,
        quantity: 1,
      })
      window.dispatchEvent(new Event('cart-updated'))
      globalShowAlert('Đã thêm túi mù vào giỏ hàng!', 'Thành công', 'success')
    } catch (e: any) {
      const msg = getErrorMessage(e, 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.')
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  const handleAddComboToCart = async (comboId: number) => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    if (!comboId) {
      globalShowAlert('Không tìm thấy thông tin combo.', 'Lỗi', 'error')
      return
    }
    try {
      await addToCart.mutateAsync({
        itemType: 'BUILD_COMBO',
        itemId: comboId,
        buildComboId: comboId,
        quantity: 1,
      })
      window.dispatchEvent(new Event('cart-updated'))
      globalShowAlert('Đã thêm combo vào giỏ hàng!', 'Thành công', 'success')
    } catch (e: any) {
      const msg = getErrorMessage(e, 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.')
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  const handleReceiveVoucher = async (voucherCode: string) => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    try {
      await receiveVoucher.mutateAsync(voucherCode)
      globalShowAlert('Đã lưu voucher vào kho của bạn.', 'Thành công', 'success')
    } catch (err) {
      globalShowAlert(
        getErrorMessage(err, 'Không thể nhận voucher. Vui lòng thử lại.'),
        'Lỗi',
        'error',
      )
    }
  }

  const handleReact = async (reviewId: number, reactionType: 'LIKE' | 'DISLIKE') => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    if (reactingReviewId === reviewId) return
    try {
      await reactToReview.mutateAsync({ reviewId, reaction: reactionType })
    } catch {
      /* silent */
    }
  }

  const handleToggleFollow = () => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    setIsFollowing((prev) => {
      const next = !prev
      localStorage.setItem(followStorageKey, String(next))
      globalShowAlert(
        next ? `Đã theo dõi ${shopName}!` : `Đã hủy theo dõi ${shopName}.`,
        'Thông báo',
        'info',
      )
      return next
    })
  }

  const shopName =
    shopInfo?.shopName ||
    shopInfo?.fullName ||
    (products.length > 0 ? products[0].shopName : null) ||
    'Nhà Vườn Nông Sản'

  const handleChatNow = async () => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    try {
      const conv = await useChatStore.getState().startChatWithUser(shopId)
      navigate(`/tin-nhan?chatId=${conv.id}`)
    } catch {
      navigate(`/tin-nhan?chatId=${shopId}`)
    }
  }

  const getCategoryName = (p: any): string => {
    if (!p) return ''
    if (typeof p.category === 'string') return p.category
    return p.category?.name || p.categoryName || p.category?.categoryName || ''
  }

  // Filter and sort products
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      const cat = getCategoryName(p)
      if (cat) set.add(cat)
    })
    return Array.from(set)
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (selectedCategory) {
      list = list.filter((p) => getCategoryName(p) === selectedCategory)
    }

    if (onlyInStock) {
      list = list.filter((p) => (p.stockKg ?? p.stockQuantity ?? p.stock ?? 0) > 0)
    }

    if (sortBy === 'asc') {
      list.sort(
        (a, b) =>
          (a.pricePerKg ?? a.sellingPrice ?? a.price ?? 0) -
          (b.pricePerKg ?? b.sellingPrice ?? b.price ?? 0),
      )
    } else if (sortBy === 'desc') {
      list.sort(
        (a, b) =>
          (b.pricePerKg ?? b.sellingPrice ?? b.price ?? 0) -
          (a.pricePerKg ?? a.sellingPrice ?? a.price ?? 0),
      )
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.productName.localeCompare(b.productName))
    }

    return list
  }, [products, selectedCategory, onlyInStock, sortBy])

  const PAGE_SIZE = 12
  const [currentPage, setCurrentPage] = useState(0)

  // Tự động reset về trang đầu khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(0)
  }, [selectedCategory, onlyInStock, sortBy])

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const pagedProducts = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, currentPage, PAGE_SIZE])

  // Phân trang danh sách đánh giá
  const REVIEW_PAGE_SIZE = 6
  const [reviewPage, setReviewPage] = useState(0)
  const reviewTotalPages = Math.ceil(reviews.length / REVIEW_PAGE_SIZE)
  const pagedReviews = useMemo(() => {
    const start = reviewPage * REVIEW_PAGE_SIZE
    return reviews.slice(start, start + REVIEW_PAGE_SIZE)
  }, [reviews, reviewPage, REVIEW_PAGE_SIZE])

  const activeProducts = useMemo(() => {
    return products.filter((p) => (p.stockKg ?? p.stockQuantity ?? p.stock ?? 0) > 0).length
  }, [products])

  const calculateAverageRating = () => {
    if (reviews.length === 0) return '0.0'
    const sum = reviews.reduce((acc, rev) => acc + rev.ratingStar, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const averageRating = calculateAverageRating()

  if (loading) {
    return (
      <CapNongLoading
        message="Đang tải thông tin gian hàng..."
        subMessage="CapNong · Kết nối trực tiếp nhà vườn uy tín"
      />
    )
  }

  const shopAvatar =
    shopInfo?.logoUrl ||
    shopInfo?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName)}&background=326318&color=fff&size=200&bold=true`

  return (
    <div className="min-h-screen bg-paper pb-24 font-sans text-ink">
      {/* 1. Breadcrumb Bar */}
      <div className="bg-white/90 border-b border-line backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between text-xs">
          <nav className="flex items-center gap-1.5 text-ink-muted truncate">
            <button
              onClick={onBack}
              className="flex items-center gap-1 font-bold text-leaf-700 hover:text-leaf-800 transition-colors mr-2 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Quay lại</span>
            </button>
            <span className="cursor-pointer hover:text-leaf-700" onClick={() => navigate('/')}>
              Trang chủ
            </span>
            <ChevronRight className="size-3 text-line-strong shrink-0" />
            <span
              className="cursor-pointer hover:text-leaf-700"
              onClick={() => navigate('/nong-san-tuoi')}
            >
              Nhà vườn
            </span>
            <ChevronRight className="size-3 text-line-strong shrink-0" />
            <span className="font-bold text-ink truncate">{shopName}</span>
          </nav>
        </div>
      </div>

      {/* 2. Farm Cover Banner */}
      <div className="relative w-full h-32 sm:h-36 md:h-40 overflow-hidden bg-leaf-900">
        <img
          src={freshFarmerBanner}
          alt={`Cảnh quan nông trại của ${shopName}`}
          className="w-full h-full object-cover object-center scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"
          aria-hidden
        />
      </div>

      {/* 3. Floating Farm Profile Identity Card */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 sm:-mt-12 relative z-20">
        <div className="bg-white rounded-xl border border-line p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start justify-between">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start flex-1 min-w-0">
              <div className="size-16 sm:size-18 rounded-lg overflow-hidden bg-paper-warm border-2 border-white shadow-xs shrink-0 relative group">
                <img
                  src={shopAvatar}
                  alt={shopName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0.5 right-0.5 size-4.5 bg-leaf-700 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  <ShieldCheck className="size-2.5" />
                </div>
              </div>

              <div className="pt-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight truncate">
                    {shopName}
                  </h1>
                  {shopInfo?.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-leaf-50 text-leaf-700 border border-leaf-200">
                      <ShieldCheck className="size-3" />
                      Đã xác thực
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sun-100 text-soil-700 border border-sun-300/40">
                    <Award className="size-3" />
                    Chuẩn VietGAP
                  </span>
                </div>

                {/* Chi tiết liên hệ & địa chỉ */}
                <div className="flex items-center gap-3 text-xs text-ink-muted mt-1 flex-wrap">
                  {shopInfo?.address && (
                    <p className="flex items-center gap-1.5 font-medium max-w-md truncate">
                      <MapPin className="size-3 text-soil-600 shrink-0" />
                      <span className="truncate">{shopInfo.address}</span>
                    </p>
                  )}
                  {(shopInfo?.phoneNumber || shopInfo?.phone) && (
                    <p className="flex items-center gap-1 font-medium">
                      <Phone className="size-3 text-leaf-700 shrink-0" />
                      <span>Hotline: <strong className="text-ink font-semibold">{shopInfo.phoneNumber || shopInfo.phone}</strong></span>
                    </p>
                  )}
                  {shopInfo?.email && (
                    <p className="flex items-center gap-1 font-medium">
                      <Mail className="size-3 text-leaf-700 shrink-0" />
                      <span>{shopInfo.email}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1 font-medium text-leaf-700">
                    <Clock className="size-3 text-leaf-600 shrink-0" />
                    <span>{shopInfo?.status === 'ACTIVE' ? 'Đang mở cửa đón khách' : 'Tạm nghỉ'}</span>
                  </p>
                </div>

                {shopInfo?.description ? (
                  <p className="text-xs text-ink-muted leading-relaxed max-w-2xl italic bg-paper-warm/70 px-3 py-1.5 rounded-lg border border-line mt-2 line-clamp-2">
                    "{shopInfo.description}"
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted italic mt-1.5">
                    Chuyên cung cấp rau củ quả, trái cây tươi sạch trực tiếp từ vườn thu hoạch trong ngày.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions & Voucher Mini Ticket */}
            <div className="flex flex-col items-stretch lg:items-end gap-2.5 w-full lg:w-72 pt-1 lg:pt-0 shrink-0">
              <div className="flex items-center gap-2 w-full justify-end">
                <button
                  onClick={handleChatNow}
                  className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 h-8 px-3.5 bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <MessageCircle className="size-3.5" />
                  <span>Nhắn tin</span>
                </button>

                <button
                  onClick={handleToggleFollow}
                  className={`flex-1 lg:flex-initial inline-flex items-center justify-center gap-1 h-8 px-3 font-bold text-xs rounded-lg border transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                    isFollowing
                      ? 'bg-leaf-50 text-leaf-700 border-leaf-300'
                      : 'bg-white hover:bg-paper-warm text-ink border-line'
                  }`}
                >
                  <Heart
                    className={`size-3.5 ${isFollowing ? 'fill-leaf-700 text-leaf-700' : 'text-ink-muted'}`}
                  />
                  <span>{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu((v) => !v)}
                    className="h-8 px-2.5 bg-white hover:bg-paper-warm text-ink font-semibold text-xs rounded-lg border border-line transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                    title="Chia sẻ gian hàng"
                  >
                    <Share2 className="size-3.5" />
                  </button>

                  {showShareMenu && (
                    <div className="absolute right-0 top-10 z-40 bg-white rounded-xl shadow-lg border border-line p-2.5 w-52 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-line">
                        <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest">
                          Chia sẻ gian hàng
                        </p>
                        <button
                          onClick={() => setShowShareMenu(false)}
                          className="size-5 flex items-center justify-center hover:bg-paper rounded-lg cursor-pointer"
                        >
                          <X className="size-3 text-ink-muted" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(absoluteUrl(`/cua-hang/${shopId}`))
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-paper text-xs font-semibold text-ink transition-colors cursor-pointer"
                        >
                          {copied ? (
                            <Check className="size-3.5 text-leaf-700" />
                          ) : (
                            <Copy className="size-3.5 text-ink-muted" />
                          )}
                          <span>{copied ? 'Đã sao chép link!' : 'Sao chép liên kết'}</span>
                        </button>

                        <button
                          onClick={() =>
                            window.open(
                              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                absoluteUrl(`/cua-hang/${shopId}`),
                              )}`,
                              '_blank',
                              'width=600,height=400',
                            )
                          }
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-xs font-semibold text-blue-600 transition-colors cursor-pointer"
                        >
                          <Facebook className="size-3.5" />
                          <span>Chia sẻ Facebook</span>
                        </button>

                        <button
                          onClick={() => {
                            const rawUrl = absoluteUrl(`/cua-hang/${shopId}`)
                            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                            if (isMobile) {
                              window.location.href = `zalo://share?url=${encodeURIComponent(rawUrl)}`
                            } else {
                              navigator.clipboard.writeText(rawUrl)
                              globalShowAlert(
                                'Đã sao chép link! Hãy dán vào Zalo để chia sẻ với bạn bè.',
                                'Zalo',
                                'info',
                              )
                            }
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-50 text-xs font-semibold text-sky-600 transition-colors cursor-pointer"
                        >
                          <span className="size-3.5 rounded-full bg-sky-500 text-white text-[7px] font-black flex items-center justify-center shrink-0">
                            Z
                          </span>
                          <span>Chia sẻ qua Zalo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hợp nhất Header Nhà vườn & Voucher: Thẻ Voucher mini ngang */}
              {shopVouchers.length > 0 && (
                <div className="w-full bg-[#FAF7EF] border border-dashed border-leaf-400/80 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-7 rounded-lg bg-leaf-100 text-leaf-800 flex items-center justify-center shrink-0">
                      <Gift className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-leaf-800 bg-leaf-100 px-1 py-0.2 rounded">
                          {shopVouchers[0].voucherCode}
                        </span>
                        <span className="text-[11px] font-bold text-ink">
                          {shopVouchers[0].voucherType === 'PERCENTAGE'
                            ? `Giảm ${shopVouchers[0].discountValue}%`
                            : shopVouchers[0].voucherType === 'FREE_SHIPPING'
                            ? 'Freeship'
                            : `Giảm ${Number(shopVouchers[0].discountValue).toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5 truncate">
                        Đơn từ {Number(shopVouchers[0].minOrderValue || 0).toLocaleString('vi-VN')}đ
                        {shopVouchers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => navigate(`/cua-hang/${shopId}/voucher`)}
                            className="ml-1 text-leaf-700 font-semibold hover:underline cursor-pointer"
                          >
                            (+{shopVouchers.length - 1} mã)
                          </button>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReceiveVoucher(shopVouchers[0].voucherCode)}
                    disabled={
                      receivingVoucher === shopVouchers[0].voucherCode ||
                      (isAuthenticated && canReceiveMap[shopVouchers[0].voucherCode] === false)
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:bg-line disabled:text-ink-muted shrink-0"
                  >
                    {receivingVoucher === shopVouchers[0].voucherCode
                      ? 'Đang lưu...'
                      : isAuthenticated && canReceiveMap[shopVouchers[0].voucherCode] === false
                      ? 'Đã có'
                      : 'Lưu mã'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4 Key Metrics Ribbon Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-paper-warm/80 rounded-xl p-2.5 border border-line mt-3.5">
            <div className="flex items-center gap-2.5 px-2">
              <div className="size-7 rounded-lg bg-white border border-line flex items-center justify-center text-leaf-700 shrink-0 shadow-2xs">
                <Package className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink leading-tight">{products.length}</p>
                <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider truncate">
                  Nông sản
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 border-l border-line/60 sm:border-line">
              <div className="size-7 rounded-lg bg-white border border-line flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                <TrendingUp className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink leading-tight">{activeProducts}</p>
                <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider truncate">
                  Đang thu hoạch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 border-t sm:border-t-0 sm:border-l border-line/60 sm:border-line pt-2 sm:pt-0">
              <div className="size-7 rounded-lg bg-white border border-line flex items-center justify-center text-sun-500 shrink-0 shadow-2xs">
                <Star className="size-3.5 fill-sun-500 text-sun-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink leading-tight">
                  {reviews.length > 0 ? averageRating : '5.0'}
                  <span className="text-[11px] text-ink-muted font-normal ml-1">
                    ({reviews.length})
                  </span>
                </p>
                <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider truncate">
                  Đánh giá uy tín
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 border-t sm:border-t-0 border-l border-line/60 sm:border-line pt-2 sm:pt-0">
              <div className="size-7 rounded-lg bg-white border border-line flex items-center justify-center text-leaf-700 shrink-0 shadow-2xs">
                <Clock className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-leaf-700 leading-tight">100%</p>
                <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider truncate">
                  Phản hồi chat
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Single Navigation Tab Bar (Đã hợp nhất bộ lọc, bỏ hàng voucher thừa) */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex items-center gap-2 border-b border-line pb-2.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-leaf-700 text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-paper-warm'
            }`}
          >
            <Leaf className="size-3.5" />
            <span>Tất cả nông sản</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'products'
                  ? 'bg-leaf-800 text-white'
                  : 'bg-paper-warm text-ink-muted'
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mystery-boxes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'mystery-boxes'
                ? 'bg-leaf-700 text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-paper-warm'
            }`}
          >
            <Gift className="size-3.5" />
            <span>Combo &amp; Túi mù</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'mystery-boxes'
                  ? 'bg-leaf-800 text-white'
                  : 'bg-paper-warm text-ink-muted'
              }`}
            >
              {totalComboMysteryCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-leaf-700 text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-paper-warm'
            }`}
          >
            <Star className="size-3.5" />
            <span>Đánh giá từ khách</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'reviews' ? 'bg-leaf-800 text-white' : 'bg-paper-warm text-ink-muted'
              }`}
            >
              {reviews.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-leaf-700 text-white shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-paper-warm'
            }`}
          >
            <Store className="size-3.5" />
            <span>Về nhà vườn</span>
          </button>
        </div>
      </div>

      {/* 5. Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* TAB 1: SẢN PHẨM NÔNG SẢN VỚI SIDEBAR LỌC 1:3 */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* STICKY LEFT SIDEBAR (25% ~ 3 cols) */}
            <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-20">
              <div className="bg-white rounded-xl border border-line p-4 sm:p-5 shadow-2xs space-y-5">
                {/* 1. Category Filter */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-line/60">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Filter className="size-3.5 text-leaf-700" />
                      <span>Danh mục nông sản</span>
                    </h3>
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-[11px] font-semibold text-leaf-700 hover:underline cursor-pointer"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        selectedCategory === null
                          ? 'bg-leaf-50 text-leaf-800 font-bold'
                          : 'text-ink-muted hover:bg-paper-warm hover:text-ink'
                      }`}
                    >
                      <span>Tất cả nông sản</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-paper border border-line text-ink-muted">
                        {products.length}
                      </span>
                    </button>

                    {availableCategories.map((cat) => {
                      const count = products.filter((p) => getCategoryName(p) === cat).length
                      const isSelected = selectedCategory === cat
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(isSelected ? null : cat)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-leaf-50 text-leaf-800 font-bold'
                              : 'text-ink-muted hover:bg-paper-warm hover:text-ink'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-paper border border-line text-ink-muted">
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Stock filter (Chỉ hiện còn hàng) */}
                <div className="pt-3 border-t border-line/60">
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <span className="text-xs font-semibold text-ink">Chỉ hiện còn hàng</span>
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="size-4 accent-leaf-700 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* 3. Sort by */}
                <div className="pt-3 border-t border-line/60">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Sắp xếp theo
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full text-xs font-semibold bg-paper border border-line rounded-lg px-2.5 py-2 outline-none focus:border-leaf-600 transition-colors cursor-pointer"
                  >
                    <option value="default">Mới nhất (Mặc định)</option>
                    <option value="asc">Giá: Thấp → Cao</option>
                    <option value="desc">Giá: Cao → Thấp</option>
                    <option value="name">Tên: A → Z</option>
                  </select>
                </div>
              </div>
            </aside>

            {/* RIGHT PRODUCT GRID (75% ~ 9 cols) */}
            <main id="shop-product-grid" className="lg:col-span-9 space-y-4 scroll-mt-24">
              {/* Top Result Bar */}
              <div className="bg-white rounded-xl border border-line px-4 py-2.5 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-ink">
                    {filteredProducts.length > 0
                      ? `Hiển thị ${currentPage * PAGE_SIZE + 1} - ${Math.min(
                          (currentPage + 1) * PAGE_SIZE,
                          filteredProducts.length,
                        )} trên ${filteredProducts.length} nông sản`
                      : '0 nông sản'}
                  </span>
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-leaf-50 text-leaf-700 border border-leaf-200">
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="cursor-pointer hover:text-leaf-900"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-leaf-50 text-leaf-700 border border-leaf-200'
                        : 'text-ink-muted hover:bg-paper hover:text-ink'
                    }`}
                    title="Xem dạng lưới"
                  >
                    <Grid className="size-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-leaf-50 text-leaf-700 border border-leaf-200'
                        : 'text-ink-muted hover:bg-paper hover:text-ink'
                    }`}
                    title="Xem dạng danh sách"
                  >
                    <List className="size-4" />
                  </button>
                </div>
              </div>

              {/* Product Grid / List */}
              {filteredProducts.length > 0 ? (
                <>
                  <div
                    className={`grid gap-4 ${
                      viewMode === 'grid'
                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1'
                    }`}
                  >
                    {pagedProducts.map((product) => {
                      const basePricePerKg = product.pricePerKg ?? product.sellingPrice ?? 0
                      const isOutOfStock =
                        (product.stockKg ?? product.stockQuantity ?? product.stock ?? 0) <= 0
                      const hasDiscount = product.salePrice != null && product.salePrice > 0

                      return (
                        <div
                          key={product.id}
                          className={`group bg-white rounded-xl border border-line overflow-hidden hover:shadow-card-hover hover:border-leaf-300 transition-all flex flex-col justify-between ${
                            viewMode === 'list' ? 'sm:flex-row sm:items-center p-3 sm:gap-4' : ''
                          }`}
                        >
                          {/* Image: Aspect 4/3, full-bleed cover, no letterbox gaps */}
                          <div
                            onClick={() => navigate(`/san-pham/${product.id}`)}
                            className={`relative overflow-hidden bg-paper-warm/50 cursor-pointer ${
                              viewMode === 'list'
                                ? 'w-full sm:w-36 aspect-square sm:aspect-auto sm:h-32 rounded-lg shrink-0'
                                : 'aspect-[4/3] w-full'
                            }`}
                          >
                            <img
                              src={
                                resolveProductImage(product.productName, product.imageUrl) ||
                                getProduceFallback(product.productName)
                              }
                              alt={product.productName}
                              onError={(e) => {
                                ;(e.currentTarget as HTMLImageElement).src = getProduceFallback(
                                  product.productName,
                                )
                              }}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/50 px-2.5 py-0.5 rounded-full border border-white/20">
                                  Hết hàng
                                </span>
                              </div>
                            )}
                            {hasDiscount && !isOutOfStock && (
                              <span className="absolute top-2 left-2 bg-sale text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-2xs">
                                -{product.discountPercent}%
                              </span>
                            )}
                          </div>

                          {/* Info & Purchase (Tight, compact padding & vertical rhythm) */}
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mb-1 truncate">
                                {getCategoryName(product) || 'Nông sản sạch'}
                              </p>
                              <h4
                                onClick={() => navigate(`/san-pham/${product.id}`)}
                                className="font-bold text-ink text-xs sm:text-sm mb-1 line-clamp-2 min-h-[38px] leading-snug group-hover:text-leaf-700 transition-colors cursor-pointer"
                              >
                                {product.productName}
                              </h4>

                              <div className="flex items-baseline gap-1.5 mb-1.5">
                                {hasDiscount ? (
                                  <>
                                    <span className="text-sm sm:text-base font-black text-leaf-700">
                                      {product.salePrice!.toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className="text-[11px] text-ink-muted line-through">
                                      {basePricePerKg.toLocaleString('vi-VN')}đ
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm sm:text-base font-black text-leaf-700">
                                    {basePricePerKg.toLocaleString('vi-VN')}đ
                                  </span>
                                )}
                                <span className="text-[11px] text-ink-muted font-normal">/ kg</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-line/60 mt-1">
                              <span className="text-[11px] text-ink-muted truncate">
                                Còn{' '}
                                <strong className="text-ink font-bold">
                                  {(
                                    product.stockKg ??
                                    product.stockQuantity ??
                                    product.stock ??
                                    0
                                  ).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                                </strong>{' '}
                                kg
                              </span>

                              <button
                                onClick={() => handleAddToCart(product.id)}
                                disabled={isOutOfStock || isAddingItem('PRODUCT', product.id)}
                                className="p-1.5 bg-leaf-700 hover:bg-leaf-800 text-white rounded-lg transition-all shadow-2xs disabled:bg-line disabled:text-ink-muted cursor-pointer disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
                                title="Thêm vào giỏ hàng"
                              >
                                {isAddingItem('PRODUCT', product.id) ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <ShoppingCart className="size-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                {/* Phân trang sản phẩm */}
                {totalPages > 1 && (
                  <div className="pt-6 pb-2 border-t border-line/70 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => {
                        setCurrentPage(page)
                        const el = document.getElementById('shop-product-grid')
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Warm Natural Empty State */
              <div className="bg-white rounded-xl border border-dashed border-line p-10 md:p-16 text-center max-w-2xl mx-auto shadow-xs">
                <div className="size-16 rounded-full bg-leaf-50 flex items-center justify-center text-leaf-700 mx-auto mb-4 border border-leaf-200">
                  <img src={logoIcon} alt="" className="size-10 object-contain" />
                </div>
                <h3 className="text-lg font-black text-ink mb-2">
                  Nhà vườn đang chuẩn bị vụ mùa mới
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-6 max-w-md mx-auto">
                  Hiện các nông sản sạch của đợt thu hoạch này đã bán hết hoặc đang trong thời gian
                  chăm sóc tự nhiên. Quý khách có thể nhắn tin trực tiếp để hỏi lịch thu hoạch hoặc
                  khám phá thêm các nông trại khác nhé!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleChatNow}
                    className="px-5 py-2.5 bg-leaf-700 hover:bg-leaf-800 text-white text-xs font-bold rounded-lg shadow-md shadow-leaf-700/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <MessageCircle className="size-4" />
                    <span>Hỏi thăm nhà vườn</span>
                  </button>
                  <button
                    onClick={() => navigate('/nong-san-tuoi')}
                    className="px-5 py-2.5 bg-paper hover:bg-paper-warm text-ink text-xs font-bold rounded-lg border border-line transition-all cursor-pointer"
                  >
                    Khám phá nông sản khác
                  </button>
                </div>
              </div>
            )}
            </main>
          </div>
        )}

        {/* TAB 2: COMBO & TÚI MÙ */}
        {activeTab === 'mystery-boxes' && (
          <div className="space-y-8">
            {/* Sub-filter chips when items exist */}
            {totalComboMysteryCount > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setComboTabFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    comboTabFilter === 'all'
                      ? 'bg-leaf-700 text-white shadow-sm'
                      : 'bg-white text-ink-muted hover:text-ink border border-line'
                  }`}
                >
                  Tất cả ({totalComboMysteryCount})
                </button>
                <button
                  type="button"
                  onClick={() => setComboTabFilter('combos')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    comboTabFilter === 'combos'
                      ? 'bg-leaf-700 text-white shadow-sm'
                      : 'bg-white text-ink-muted hover:text-ink border border-line'
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>Combo nông sản ({combos.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComboTabFilter('mystery-boxes')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    comboTabFilter === 'mystery-boxes'
                      ? 'bg-leaf-700 text-white shadow-sm'
                      : 'bg-white text-ink-muted hover:text-ink border border-line'
                  }`}
                >
                  <Gift className="size-3.5" />
                  <span>Túi mù bí ẩn ({mysteryBoxes.length})</span>
                </button>
              </div>
            )}

            {/* Total Empty State */}
            {totalComboMysteryCount === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-line p-12 text-center max-w-md mx-auto shadow-xs">
                <Gift className="size-12 text-ink-muted/40 mx-auto mb-3" />
                <h4 className="font-bold text-ink text-sm mb-1">Chưa có Combo & Túi Mù</h4>
                <p className="text-xs text-ink-muted mb-4">
                  Nhà vườn hiện chưa mở bán gói combo hoặc túi mù bí ẩn nào. Mời bạn xem các loại rau củ quả tươi lẻ nhé!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 bg-leaf-700 hover:bg-leaf-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Xem nông sản tươi
                </button>
              </div>
            )}

            {/* SECTION 1: COMBOS */}
            {(comboTabFilter === 'all' || comboTabFilter === 'combos') && (
              <div>
                {comboTabFilter === 'all' && combos.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-leaf-100 text-leaf-800 flex items-center justify-center">
                        <Layers className="size-4" />
                      </div>
                      <h3 className="font-black text-ink text-base">Combo nông sản chọn sẵn</h3>
                    </div>
                    <span className="text-xs text-ink-muted font-bold">{combos.length} combo</span>
                  </div>
                )}

                {combos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {combos.map((combo: any) => {
                      const comboId = combo.comboId ?? combo.id
                      const comboStock = Math.max(0, (combo.totalQuantity ?? 99) - (combo.soldQuantity ?? 0))
                      const isOutOfStock = comboStock <= 0
                      const isAdding = isAddingItem('BUILD_COMBO', comboId)

                      return (
                        <div
                          key={`combo-${comboId}`}
                          className="group bg-white rounded-3xl border border-line overflow-hidden hover:shadow-card-hover transition-all flex flex-col justify-between"
                        >
                          <div
                            onClick={() => navigate(`/combo/${comboId}`)}
                            className="relative aspect-square bg-gradient-to-br from-soil-50 via-paper-warm to-leaf-50 flex items-center justify-center overflow-hidden cursor-pointer"
                          >
                            <img
                              src={combo.imageUrl || comboGreenImg}
                              alt={combo.comboName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3 bg-leaf-700/90 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                              <Layers className="size-3 text-leaf-200" />
                              <span>{formatMealType(combo.type || (combo as any).mealType)}</span>
                            </div>
                            {isOutOfStock ? (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="text-white text-xs font-black uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full border border-white/20">
                                  Hết hàng
                                </span>
                              </div>
                            ) : comboStock < 10 ? (
                              <span className="absolute bottom-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                                Chỉ còn {comboStock} suất
                              </span>
                            ) : null}
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4
                                onClick={() => navigate(`/combo/${comboId}`)}
                                className="font-black text-ink text-base mb-1 hover:text-leaf-700 transition-colors cursor-pointer line-clamp-1"
                              >
                                {combo.comboName}
                              </h4>
                              {combo.description && (
                                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-2.5">
                                  {combo.description}
                                </p>
                              )}
                              {combo.items && combo.items.length > 0 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-leaf-700 bg-leaf-50 px-2.5 py-1 rounded-lg w-fit mb-2">
                                  <Package className="size-3" />
                                  <span>Gồm {combo.items.length} món nông sản tươi</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-line mt-3">
                              <span className="text-lg font-black text-leaf-700">
                                {Number(combo.price).toLocaleString('vi-VN')}đ
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAddComboToCart(comboId)}
                                disabled={isAdding || isOutOfStock}
                                className="px-4 py-2 bg-leaf-700 hover:bg-leaf-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                              >
                                {isAdding ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <ShoppingCart className="size-3.5" />
                                )}
                                <span>Thêm vào giỏ</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : comboTabFilter === 'combos' ? (
                  <div className="bg-white rounded-3xl border border-dashed border-line p-12 text-center max-w-md mx-auto shadow-xs">
                    <Layers className="size-12 text-ink-muted/40 mx-auto mb-3" />
                    <h4 className="font-bold text-ink text-sm mb-1">Chưa có combo nông sản</h4>
                    <p className="text-xs text-ink-muted">
                      Nhà vườn hiện chưa mở bán combo nào.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* SECTION 2: MYSTERY BOXES */}
            {(comboTabFilter === 'all' || comboTabFilter === 'mystery-boxes') && (
              <div>
                {comboTabFilter === 'all' && mysteryBoxes.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-soil-100 text-soil-800 flex items-center justify-center">
                        <Gift className="size-4" />
                      </div>
                      <h3 className="font-black text-ink text-base">Túi mù bí ẩn</h3>
                    </div>
                    <span className="text-xs text-ink-muted font-bold">{mysteryBoxes.length} túi mù</span>
                  </div>
                )}

                {mysteryBoxes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {mysteryBoxes.map((box: any) => {
                      const boxId = box.mysteryId ?? box.id
                      const boxStock = Math.max(0, (box.totalQuantity ?? 99) - (box.soldQuantity ?? 0))
                      const isOutOfStock = boxStock <= 0
                      const isAdding = isAddingItem('MYSTERY_BOX', boxId)

                      return (
                        <div
                          key={`box-${boxId}`}
                          className="group bg-white rounded-3xl border border-line overflow-hidden hover:shadow-card-hover transition-all flex flex-col justify-between"
                        >
                          <div
                            onClick={() => navigate(`/mystery-box/${boxId}`)}
                            className="relative aspect-square bg-gradient-to-br from-soil-50 via-paper-warm to-leaf-50 flex items-center justify-center overflow-hidden cursor-pointer"
                          >
                            {box.imageUrl ? (
                              <img
                                src={box.imageUrl}
                                alt={box.boxType}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="text-center p-6">
                                <Gift className="size-16 text-soil-600/40 mx-auto mb-2" />
                                <span className="text-3xl font-black text-soil-700/30">?</span>
                              </div>
                            )}
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                              <Sparkles className="size-3 text-sun-300" />
                              <span>Túi mù bí ẩn</span>
                            </div>
                            {isOutOfStock ? (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="text-white text-xs font-black uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full border border-white/20">
                                  Hết hàng
                                </span>
                              </div>
                            ) : boxStock < 10 ? (
                              <span className="absolute bottom-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                                Chỉ còn {boxStock} túi
                              </span>
                            ) : null}
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4
                                onClick={() => navigate(`/mystery-box/${boxId}`)}
                                className="font-black text-ink text-base mb-1 hover:text-leaf-700 transition-colors cursor-pointer line-clamp-1"
                              >
                                {box.boxType}
                              </h4>
                              {box.description && (
                                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-3">
                                  {box.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-line mt-3">
                              <span className="text-lg font-black text-leaf-700">
                                {Number(box.price).toLocaleString('vi-VN')}đ
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAddBoxToCart(boxId)}
                                disabled={isAdding || isOutOfStock}
                                className="px-4 py-2 bg-leaf-700 hover:bg-leaf-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                              >
                                {isAdding ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <ShoppingCart className="size-3.5" />
                                )}
                                <span>Thêm vào giỏ</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : comboTabFilter === 'mystery-boxes' ? (
                  <div className="bg-white rounded-3xl border border-dashed border-line p-12 text-center max-w-md mx-auto shadow-xs">
                    <Gift className="size-12 text-ink-muted/40 mx-auto mb-3" />
                    <h4 className="font-bold text-ink text-sm mb-1">Chưa có Túi Mù</h4>
                    <p className="text-xs text-ink-muted">
                      Nhà vườn hiện chưa mở bán gói combo bí ẩn.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ĐÁNH GIÁ TỪ KHÁCH MUA */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-line p-6 sm:p-8 shadow-xs">
            {/* Summary Rating */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-line mb-6">
              <div>
                <h3 className="text-lg font-black text-ink mb-1">Đánh giá từ khách hàng</h3>
                <p className="text-xs text-ink-muted">
                  Phản hồi minh bạch từ người mua thực tế sau khi nhận nông sản
                </p>
              </div>

              <div className="flex items-center gap-4 bg-paper-warm px-5 py-3 rounded-lg border border-line">
                <div className="text-3xl font-black text-ink">{averageRating}</div>
                <div>
                  <div className="flex text-sun-500 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${
                          i < Math.round(Number(averageRating))
                            ? 'fill-sun-500 text-sun-500'
                            : 'text-line-strong'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-ink-muted font-bold">
                    Dựa trên {reviews.length} lượt đánh giá
                  </p>
                </div>
              </div>
            </div>

            {/* Review Cards */}
            {reviews.length > 0 ? (
              <>
                <div className="space-y-6">
                  {pagedReviews.map((review) => {
                  const isLiked = review.currentUserReaction === 'LIKE'
                  const isDisliked = review.currentUserReaction === 'DISLIKE'
                  const isReacting = reactingReviewId === review.id

                  return (
                    <div
                      key={review.id}
                      className="flex gap-4 pb-6 border-b border-line last:border-0 last:pb-0"
                    >
                      <div className="size-10 rounded-full bg-leaf-50 border border-leaf-200 flex items-center justify-center font-bold text-leaf-700 text-sm shrink-0">
                        {review.fullName ? review.fullName.charAt(0).toUpperCase() : 'K'}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-bold text-ink text-sm">
                              {review.fullName || `Khách hàng #${review.buyerId}`}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex text-sun-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`size-3 ${
                                      i < review.ratingStar
                                        ? 'fill-sun-500 text-sun-500'
                                        : 'text-line-strong'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-ink-muted">
                                {review.createAt
                                  ? new Date(review.createAt).toLocaleDateString('vi-VN')
                                  : 'Gần đây'}
                              </span>
                            </div>
                            {(review.productName || review.boxType) && (
                              <span className="inline-block text-[10px] bg-paper px-2 py-0.5 rounded-md text-ink-muted mt-1 font-medium border border-line">
                                {review.productName ? `Sản phẩm: ${review.productName}` : `Túi mù`}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleReact(review.id, 'LIKE')}
                              disabled={isReacting}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                                isLiked
                                  ? 'bg-leaf-700 text-white border-leaf-700'
                                  : 'bg-white text-ink-muted border-line hover:border-leaf-300'
                              } disabled:opacity-50`}
                            >
                              <ThumbsUp className="size-3" />
                              <span>{review.likeCount ?? 0}</span>
                            </button>
                            <button
                              onClick={() => handleReact(review.id, 'DISLIKE')}
                              disabled={isReacting}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                                isDisliked
                                  ? 'bg-sale text-white border-sale'
                                  : 'bg-white text-ink-muted border-line hover:border-sale'
                              } disabled:opacity-50`}
                            >
                              <ThumbsDown className="size-3" />
                              <span>{review.dislikeCount ?? 0}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-ink text-xs sm:text-sm leading-relaxed mb-3">
                          {review.comment}
                        </p>

                        {review.evidence && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-line w-24 aspect-square bg-paper-warm">
                            <img
                              src={review.evidence}
                              alt="Hình ảnh thực tế từ khách"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {review.replyFromShop && (
                          <div className="mt-3 p-3.5 bg-paper rounded-lg border border-line">
                            <div className="flex items-center gap-1.5 mb-1 text-leaf-700 font-bold text-xs">
                              <MessageCircle className="size-3.5" />
                              <span>Phản hồi từ Nhà vườn:</span>
                            </div>
                            <p className="text-xs text-ink-muted italic pl-5">
                              {review.replyFromShop}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

                {reviewTotalPages > 1 && (
                  <div className="pt-6 border-t border-line/70 flex justify-center">
                    <Pagination
                      currentPage={reviewPage}
                      totalPages={reviewTotalPages}
                      onPageChange={(page) => setReviewPage(page)}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Star className="size-10 text-line-strong mx-auto mb-2" />
                <p className="text-xs text-ink-muted font-medium">
                  Chưa có đánh giá nào cho gian hàng này.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VỀ NHÀ VƯỜN */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-xl border border-line p-6 sm:p-8 shadow-xs space-y-8">
            {/* 1. Câu chuyện nhà vườn & Sứ mệnh canh tác */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-leaf-700 bg-leaf-50 px-2.5 py-1 rounded-full border border-leaf-200">
                  Câu chuyện đất &amp; người
                </span>
                <span className="text-xs text-ink-muted">· Gắn bó cùng nông nghiệp sạch</span>
              </div>
              <h3 className="text-xl font-black text-ink mb-3">
                Hành trình gieo mầm tử tế tại {shopName}
              </h3>
              <div className="prose prose-sm max-w-none text-ink-muted leading-relaxed space-y-3 font-normal text-sm">
                <p>
                  Khởi nguồn từ niềm đam mê với nông nghiệp sinh thái bền vững, {shopName} bắt đầu với những thửa đất màu mỡ phù sa, nơi mỗi gốc rau củ và cây trái được nâng niu bằng cả tâm huyết của người làm nông chân chính. Chúng tôi tin rằng thực phẩm ngon nhất là thực phẩm lớn lên tự nhiên, thuận theo thời tiết bốn mùa và không bị can thiệp bởi hóa chất kích thích tăng trưởng độc hại.
                </p>
                <p>
                  Tại nông trại, 100% diện tích canh tác tuân thủ nghiêm ngặt theo quy chuẩn VietGAP: nguồn nước tưới được kiểm định vi sinh định kỳ, phân bón ưu tiên nguồn hữu cơ ủ hoai và chế phẩm sinh học bảo vệ thực vật. Mỗi mùa vụ đều có sổ tay nhật ký canh tác minh bạch, đảm bảo tuyệt đối thời gian cách ly an toàn trước ngày thu hoạch.
                </p>
                <p>
                  Đồng hành cùng nền tảng CapNong, {shopName} cam kết thu hái nông sản tươi mới ngay trong sớm tinh mơ, sàng lọc kỹ lưỡng từng ký hàng và đóng gói cẩn trọng để bảo toàn trọn vẹn vị ngọt lành tự nhiên, giúp mỗi gia đình an tâm thưởng thức bữa cơm thuần khiết từ đồng quê.
                </p>
              </div>
            </div>

            {/* 2. Bốn trụ cột cam kết canh tác */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-[#FAF7EF] border border-[#F0EADB]">
                <div className="size-9 rounded-md bg-leaf-100 text-leaf-700 flex items-center justify-center mb-2.5">
                  <Leaf className="size-5" />
                </div>
                <h4 className="font-bold text-ink text-sm mb-1">Đất &amp; Nước sạch</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Đất trồng được cải tạo mùn tự nhiên, kiểm nghiệm định kỳ không tồn dư kim loại nặng hay hóa chất độc hại.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF7EF] border border-[#F0EADB]">
                <div className="size-9 rounded-md bg-leaf-100 text-leaf-700 flex items-center justify-center mb-2.5">
                  <ShieldCheck className="size-5" />
                </div>
                <h4 className="font-bold text-ink text-sm mb-1">Chuẩn VietGAP</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Quy trình canh tác khép kín, nhật ký nông vụ minh bạch và tuân thủ thời gian cách ly tuyệt đối trước thu hoạch.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF7EF] border border-[#F0EADB]">
                <div className="size-9 rounded-md bg-leaf-100 text-leaf-700 flex items-center justify-center mb-2.5">
                  <Sparkles className="size-5" />
                </div>
                <h4 className="font-bold text-ink text-sm mb-1">Chín cây tự nhiên</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Không ngâm ủ ép chín, quả ngọt đậm đà nhờ đón đủ nắng gió và tích tụ dinh dưỡng tối đa trên cành.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF7EF] border border-[#F0EADB]">
                <div className="size-9 rounded-md bg-leaf-100 text-leaf-700 flex items-center justify-center mb-2.5">
                  <CheckCircle2 className="size-5" />
                </div>
                <h4 className="font-bold text-ink text-sm mb-1">Đổi trả bảo đảm</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  CapNong và nhà vườn cam kết hoàn tiền hoặc bù hàng nếu nông sản giao đến tay người mua bị dập hỏng hay không đạt chuẩn.
                </p>
              </div>
            </div>

            {/* 3. Thông tin liên hệ & Vị trí nhà vườn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-line">
              <div className="p-4 rounded-lg bg-paper-warm border border-line">
                <h4 className="font-bold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="size-4 text-soil-700" />
                  <span>Khu vực nông trại canh tác</span>
                </h4>
                <p className="text-xs text-ink-muted font-medium">
                  {shopInfo?.address || 'Đang cập nhật địa chỉ trang trại'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-paper-warm border border-line">
                <h4 className="font-bold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Award className="size-4 text-sun-600" />
                  <span>Tiêu chuẩn &amp; Chứng nhận</span>
                </h4>
                <p className="text-xs text-ink-muted font-medium">
                  Chứng nhận VietGAP cơ sở đủ điều kiện ATTP · Đối tác liên kết trực tiếp cùng CapNong
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShopProducts
