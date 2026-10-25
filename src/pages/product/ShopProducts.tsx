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
} from 'lucide-react'

import freshFarmerBanner from '@/assets/fresh-farmer-banner.jpg'
import { useAddToCart } from '@/features/cart'
import { useShopMysteryBoxes } from '@/features/mystery-box'
import { useShopProducts } from '@/features/product'
import { useReactToReview, useShopReviews } from '@/features/review'
import { useUser } from '@/features/user'
import { useReceiveVoucher, useShopVouchers } from '@/features/voucher'
import { globalShowAlert } from '@/components/common/Popup'
import { absoluteUrl, getErrorMessage } from '@/utils'

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const productsQuery = useShopProducts(shopId)
  const shopQuery = useUser(shopId)
  const reviewsQuery = useShopReviews(shopId)
  const boxesQuery = useShopMysteryBoxes(shopId)

  const products = productsQuery.data ?? []
  const shopInfo = shopQuery.data ?? null
  const reviews = reviewsQuery.data ?? []
  const mysteryBoxes = boxesQuery.data ?? []

  const loading =
    productsQuery.isPending || shopQuery.isPending || reviewsQuery.isPending || boxesQuery.isPending

  const vouchersQuery = useShopVouchers(shopId, 0, 4, isAuthenticated)
  const shopVouchers = vouchersQuery.data?.vouchers ?? []
  const canReceiveMap = vouchersQuery.data?.canReceive ?? {}
  const voucherLoading = vouchersQuery.isFetching
  const voucherError = vouchersQuery.isError ? 'Không tải được voucher của shop.' : null

  const addToCart = useAddToCart()
  const addingToCart = addToCart.isPending ? (addToCart.variables.productId ?? null) : null
  const addingBoxToCart = addToCart.isPending ? (addToCart.variables.mysteryBoxId ?? null) : null
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
      await addToCart.mutateAsync({ productId, quantity: 1 })
      window.dispatchEvent(new Event('cart-updated'))
      globalShowAlert('Đã thêm vào giỏ hàng!', 'Thành công', 'success')
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.'
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  const handleAddBoxToCart = async (boxId: number) => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    try {
      await addToCart.mutateAsync({ mysteryBoxId: boxId, quantity: 1 })
      window.dispatchEvent(new Event('cart-updated'))
      globalShowAlert('Đã thêm túi mù vào giỏ hàng!', 'Thành công', 'success')
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.'
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

  const handleChatNow = () => {
    if (!isAuthenticated) {
      onOpenLogin()
      return
    }
    window.dispatchEvent(
      new CustomEvent('open-chat-with-user', {
        detail: { userId: shopId, userName: shopName },
      }),
    )
  }

  const getCategoryName = (p: any): string => {
    if (!p?.category) return ''
    if (typeof p.category === 'string') return p.category
    return p.category.name || ''
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
      <div className="min-h-[70vh] bg-paper flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl border border-line shadow-card max-w-sm w-full mx-4">
          <Loader2 className="size-10 animate-spin text-leaf-700 mx-auto mb-3" />
          <h3 className="font-bold text-ink text-base mb-1">Đang tải gian hàng</h3>
          <p className="text-xs text-ink-muted">Đang kết nối dữ liệu nhà vườn và nông sản...</p>
        </div>
      </div>
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

          <div className="flex items-center gap-2">
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
      </div>

      {/* 2. Farm Cover Banner */}
      <div className="relative w-full h-52 sm:h-64 md:h-72 overflow-hidden bg-leaf-900">
        <img
          src={freshFarmerBanner}
          alt={`Cảnh quan nông trại của ${shopName}`}
          className="w-full h-full object-cover object-center scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20"
          aria-hidden
        />
        <div className="absolute top-4 right-4 hidden md:flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-xs font-semibold border border-white/20">
          <Leaf className="size-3.5 text-sun-300" />
          <span>Nông Trại Canh Tác Hữu Cơ CapNong</span>
        </div>
      </div>

      {/* 3. Floating Farm Profile Identity Card */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white rounded-3xl border border-line p-5 sm:p-7 shadow-card">
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="size-24 sm:size-28 rounded-2xl overflow-hidden bg-paper-warm border-4 border-white shadow-md shrink-0 relative group">
                <img
                  src={shopAvatar}
                  alt={shopName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-1 right-1 size-5 bg-leaf-700 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  <ShieldCheck className="size-3" />
                </div>
              </div>

              <div className="pt-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                    {shopName}
                  </h1>
                  {shopInfo?.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-leaf-50 text-leaf-700 border border-leaf-200">
                      <ShieldCheck className="size-3.5" />
                      Đã xác thực
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sun-100 text-soil-700 border border-sun-300/40">
                    <Award className="size-3.5" />
                    Chuẩn VietGAP
                  </span>
                </div>

                {shopInfo?.address && (
                  <p className="flex items-center gap-1 text-xs text-ink-muted font-medium mb-3">
                    <MapPin className="size-3.5 text-soil-600 shrink-0" />
                    <span>{shopInfo.address}</span>
                  </p>
                )}

                {shopInfo?.description ? (
                  <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 max-w-2xl bg-paper-warm/80 px-3 py-2 rounded-xl border border-line">
                    {shopInfo.description}
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted italic">
                    Chuyên cung cấp rau củ quả, trái cây tươi sạch trực tiếp từ vườn thu hoạch trong
                    ngày.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto pt-2 lg:pt-1">
              <button
                onClick={handleChatNow}
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs rounded-xl shadow-md shadow-leaf-700/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="size-4" />
                <span>Nhắn tin</span>
              </button>

              <button
                onClick={handleToggleFollow}
                className={`flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-leaf-50 text-leaf-700 border-leaf-200 shadow-xs'
                    : 'bg-white hover:bg-paper-warm text-ink border-line'
                }`}
              >
                <Heart
                  className={`size-4 ${isFollowing ? 'fill-leaf-700 text-leaf-700' : 'text-ink-muted'}`}
                />
                <span>{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowShareMenu((v) => !v)}
                  className="p-2.5 bg-white hover:bg-paper-warm text-ink font-bold text-xs rounded-xl border border-line transition-colors cursor-pointer"
                  title="Chia sẻ gian hàng"
                >
                  <Share2 className="size-4" />
                </button>

                {showShareMenu && (
                  <div className="absolute right-0 top-12 z-40 bg-white rounded-2xl shadow-xl border border-line p-3 w-56 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-line">
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-paper text-xs font-bold text-ink transition-colors cursor-pointer"
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 text-xs font-bold text-blue-600 transition-colors cursor-pointer"
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sky-50 text-xs font-bold text-sky-600 transition-colors cursor-pointer"
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
          </div>

          {/* Description */}
          {shopInfo?.description && (
            <div className="mt-4 p-4 bg-paper rounded-2xl border border-line">
              <p className="text-sm text-ink-muted font-medium">{shopInfo.description}</p>
            </div>
          )}

          {/* 4 Key Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-line">
            <div className="bg-paper rounded-2xl p-3 border border-line flex items-center gap-3">
              <div className="size-9 rounded-xl bg-leaf-50 flex items-center justify-center text-leaf-700 shrink-0">
                <Package className="size-4" />
              </div>
              <div>
                <p className="text-base font-black text-ink leading-tight">{products.length}</p>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                  Nông sản
                </p>
              </div>
            </div>

            <div className="bg-paper rounded-2xl p-3 border border-line flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <p className="text-base font-black text-ink leading-tight">{activeProducts}</p>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                  Đang thu hoạch
                </p>
              </div>
            </div>

            <div className="bg-paper rounded-2xl p-3 border border-line flex items-center gap-3">
              <div className="size-9 rounded-xl bg-sun-100 flex items-center justify-center text-soil-700 shrink-0">
                <Star className="size-4 fill-sun-500 text-sun-500" />
              </div>
              <div>
                <p className="text-base font-black text-ink leading-tight">
                  {reviews.length > 0 ? averageRating : '5.0'}
                  <span className="text-xs text-ink-muted font-normal ml-1">
                    ({reviews.length})
                  </span>
                </p>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                  Đánh giá uy tín
                </p>
              </div>
            </div>

            <div className="bg-paper rounded-2xl p-3 border border-line flex items-center gap-3">
              <div className="size-9 rounded-xl bg-leaf-100/60 flex items-center justify-center text-leaf-700 shrink-0">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-base font-black text-leaf-700 leading-tight">Sẵn sàng</p>
                <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                  Trạng thái vườn
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Voucher Tickets Carousel */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-paper-warm rounded-3xl border border-line p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-leaf-100 flex items-center justify-center text-leaf-700">
                <Gift className="size-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-ink">
                  Voucher Ưu Đãi Nhà Vườn
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Thu thập mã giảm giá để mua nông sản giá tốt nhất
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/cua-hang/${shopId}/voucher`)}
              className="text-xs font-bold text-leaf-700 hover:text-leaf-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {voucherLoading ? (
            <div className="rounded-2xl bg-white p-4 text-xs font-bold text-ink-muted flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-leaf-700" />
              <span>Đang kiểm tra voucher hiện có...</span>
            </div>
          ) : voucherError ? (
            <div className="rounded-2xl bg-sale-soft p-4 text-xs font-bold text-sale">
              {voucherError}
            </div>
          ) : shopVouchers.length === 0 ? (
            <div className="rounded-2xl bg-white p-4 text-xs font-medium text-ink-muted text-center border border-dashed border-line">
              Hiện nhà vườn chưa phát hành voucher mới. Hãy theo dõi để nhận thông báo ưu đãi sớm
              nhất nhé!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {shopVouchers.map((voucher) => {
                const canReceive = canReceiveMap[voucher.voucherCode] !== false
                const isPercent = voucher.voucherType === 'PERCENTAGE'
                const isFreeShip =
                  voucher.voucherType === 'FREE_SHIPPING' || voucher.voucherTarget === 'SHIPPING'
                const discountLabel = isPercent
                  ? `Giảm ${voucher.discountValue}%`
                  : isFreeShip
                    ? 'Miễn phí vận chuyển'
                    : `Giảm ${Number(voucher.discountValue).toLocaleString('vi-VN')}đ`
                const scopeLabel =
                  voucher.voucherScope === 'PLATFORM' || voucher.creatorRole === 'ADMIN'
                    ? 'Toàn sàn'
                    : 'Shop'

                return (
                  <div
                    key={voucher.voucherCode}
                    className="rounded-2xl border border-dashed border-leaf-300 bg-white p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:border-leaf-600 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="font-mono text-[11px] font-black uppercase text-leaf-800 bg-leaf-100 px-2 py-0.5 rounded-md">
                          {voucher.voucherCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-soil-50 text-soil-700 border border-soil-100">
                          {scopeLabel}
                        </span>
                        {isFreeShip && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                            Freeship
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-ink">{discountLabel}</p>
                      <p className="text-[11px] text-ink-muted font-medium mt-0.5">
                        {voucher.maxDiscount
                          ? `Tối đa ${Number(voucher.maxDiscount).toLocaleString('vi-VN')}đ · `
                          : ''}
                        Đơn từ {Number(voucher.minOrderValue || 0).toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    <button
                      onClick={() => handleReceiveVoucher(voucher.voucherCode)}
                      disabled={
                        receivingVoucher === voucher.voucherCode || (isAuthenticated && !canReceive)
                      }
                      className="w-full rounded-xl bg-leaf-700 px-3 py-2 text-xs font-bold text-white hover:bg-leaf-800 transition-colors disabled:bg-line disabled:text-ink-muted cursor-pointer disabled:cursor-not-allowed shadow-xs"
                    >
                      {receivingVoucher === voucher.voucherCode
                        ? 'Đang lưu...'
                        : isAuthenticated && !canReceive
                          ? 'Đã trong ví'
                          : 'Lưu Voucher'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Navigation Tab Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-leaf-700 text-white shadow-sm'
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
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'mystery-boxes'
                ? 'bg-leaf-700 text-white shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-paper-warm'
            }`}
          >
            <Gift className="size-3.5" />
            <span>Combo &amp; Túi mù bí ẩn</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'mystery-boxes'
                  ? 'bg-leaf-800 text-white'
                  : 'bg-paper-warm text-ink-muted'
              }`}
            >
              {mysteryBoxes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-leaf-700 text-white shadow-sm'
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
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'about'
                ? 'bg-leaf-700 text-white shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-paper-warm'
            }`}
          >
            <Store className="size-3.5" />
            <span>Về nhà vườn</span>
          </button>
        </div>
      </div>

      {/* 6. Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* TAB 1: SẢN PHẨM NÔNG SẢN */}
        {activeTab === 'products' && (
          <div>
            {/* Toolbar: Category Chips, Stock Filter, Sort */}
            <div className="bg-white rounded-2xl border border-line p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-leaf-50 text-leaf-700 text-xs font-bold border border-leaf-200">
                  <CheckCircle2 className="size-3.5" />
                  100% bán theo kg
                </span>

                {availableCategories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        selectedCategory === null
                          ? 'bg-ink text-white'
                          : 'bg-paper text-ink-muted hover:text-ink'
                      }`}
                    >
                      Tất cả
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-ink text-white'
                            : 'bg-paper text-ink-muted hover:text-ink'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <label className="flex items-center gap-1.5 text-xs text-ink-muted font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="accent-leaf-700 rounded-sm"
                  />
                  <span>Chỉ hiện còn hàng</span>
                </label>

                <div className="h-4 w-px bg-line" />

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-paper border border-line rounded-xl text-xs font-bold text-ink cursor-pointer hover:border-leaf-300 transition-colors"
                >
                  <option value="default">Sắp xếp: Mặc định</option>
                  <option value="asc">Giá: Thấp → Cao</option>
                  <option value="desc">Giá: Cao → Thấp</option>
                  <option value="name">Tên: A → Z</option>
                </select>
              </div>
            </div>

            {/* Product List / Grid */}
            {filteredProducts.length > 0 ? (
              <div
                className={`grid gap-5 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-1'
                }`}
              >
                {filteredProducts.map((product) => {
                  const basePricePerKg = product.pricePerKg ?? product.sellingPrice ?? 0
                  const isOutOfStock =
                    (product.stockKg ?? product.stockQuantity ?? product.stock ?? 0) <= 0
                  const hasDiscount = product.salePrice != null && product.salePrice > 0

                  return (
                    <div
                      key={product.id}
                      className={`group bg-white rounded-2xl border border-line overflow-hidden hover:shadow-card-hover hover:border-leaf-300 transition-all flex flex-col justify-between ${
                        viewMode === 'list' ? 'sm:flex-row sm:items-center p-3 sm:gap-5' : ''
                      }`}
                    >
                      {/* Image */}
                      <div
                        className={`relative overflow-hidden bg-paper-warm ${
                          viewMode === 'list'
                            ? 'w-full sm:w-40 aspect-square sm:aspect-auto sm:h-36 rounded-xl'
                            : 'aspect-square w-full'
                        }`}
                      >
                        <img
                          src={
                            product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`
                          }
                          alt={product.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-white text-xs font-black uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full border border-white/20">
                              Hết hàng
                            </span>
                          </div>
                        )}
                        {hasDiscount && !isOutOfStock && (
                          <span className="absolute top-2 left-2 bg-sale text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                            -{product.discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* Info & Purchase */}
                      <div className={`p-4 flex-1 flex flex-col justify-between`}>
                        <div>
                          <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mb-1">
                            {getCategoryName(product) || 'Nông sản sạch'}
                          </p>
                          <h4
                            onClick={() => navigate(`/san-pham/${product.id}`)}
                            className="font-bold text-ink text-sm mb-1.5 line-clamp-2 group-hover:text-leaf-700 transition-colors cursor-pointer"
                          >
                            {product.productName}
                          </h4>

                          <div className="flex items-baseline gap-1.5 mb-2">
                            {hasDiscount ? (
                              <>
                                <span className="text-base font-black text-leaf-700">
                                  {product.salePrice!.toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-xs text-ink-muted line-through">
                                  {basePricePerKg.toLocaleString('vi-VN')}đ
                                </span>
                              </>
                            ) : (
                              <span className="text-base font-black text-leaf-700">
                                {basePricePerKg.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                            <span className="text-xs text-ink-muted font-normal">/ kg</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-line mt-2">
                          <span className="text-[11px] text-ink-muted">
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
                            disabled={isOutOfStock || addingToCart === product.id}
                            className="p-2 bg-leaf-700 hover:bg-leaf-800 text-white rounded-xl transition-all shadow-sm disabled:bg-line disabled:text-ink-muted cursor-pointer disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            title="Thêm vào giỏ hàng"
                          >
                            {addingToCart === product.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Warm Natural Empty State */
              <div className="bg-white rounded-3xl border border-dashed border-line p-10 md:p-16 text-center max-w-2xl mx-auto shadow-xs">
                <div className="size-16 rounded-full bg-leaf-50 flex items-center justify-center text-leaf-700 mx-auto mb-4 border border-leaf-200">
                  <Leaf className="size-8 text-leaf-600 animate-pulse" />
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
                    className="px-5 py-2.5 bg-leaf-700 hover:bg-leaf-800 text-white text-xs font-bold rounded-xl shadow-md shadow-leaf-700/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <MessageCircle className="size-4" />
                    <span>Hỏi thăm nhà vườn</span>
                  </button>
                  <button
                    onClick={() => navigate('/nong-san-tuoi')}
                    className="px-5 py-2.5 bg-paper hover:bg-paper-warm text-ink text-xs font-bold rounded-xl border border-line transition-all cursor-pointer"
                  >
                    Khám phá nông sản khác
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMBO & TÚI MÙ (MYSTERY BOXES) */}
        {activeTab === 'mystery-boxes' && (
          <div>
            {mysteryBoxes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {mysteryBoxes.map((box: any) => (
                  <div
                    key={box.id}
                    className="group bg-white rounded-3xl border border-line overflow-hidden hover:shadow-card-hover transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-soil-50 via-paper-warm to-leaf-50 flex items-center justify-center overflow-hidden">
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
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles className="size-3 text-sun-300" />
                        <span>Túi mù bí ẩn</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-ink text-base mb-1">{box.boxType}</h4>
                        {box.description && (
                          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-3">
                            {box.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-line mt-3">
                        <span className="text-lg font-black text-leaf-700">
                          {box.price.toLocaleString('vi-VN')}đ
                        </span>

                        <button
                          onClick={() => handleAddBoxToCart(box.id)}
                          disabled={addingBoxToCart === box.id}
                          className="px-4 py-2 bg-leaf-700 hover:bg-leaf-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {addingBoxToCart === box.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ShoppingCart className="size-3.5" />
                          )}
                          <span>Thêm vào giỏ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-line p-12 text-center max-w-md mx-auto">
                <Gift className="size-12 text-ink-muted/40 mx-auto mb-3" />
                <h4 className="font-bold text-ink text-sm mb-1">Chưa có Túi Mù</h4>
                <p className="text-xs text-ink-muted">
                  Nhà vườn hiện chưa mở bán gói combo bí ẩn. Mời bạn xem các loại rau củ quả tươi lẻ
                  nhé!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ĐÁNH GIÁ TỪ KHÁCH MUA */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-xs">
            {/* Summary Rating */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-line mb-6">
              <div>
                <h3 className="text-lg font-black text-ink mb-1">Đánh giá từ khách hàng</h3>
                <p className="text-xs text-ink-muted">
                  Phản hồi minh bạch từ người mua thực tế sau khi nhận nông sản
                </p>
              </div>

              <div className="flex items-center gap-4 bg-paper-warm px-5 py-3 rounded-2xl border border-line">
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
              <div className="space-y-6">
                {reviews.map((review) => {
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
                          <div className="mb-3 rounded-xl overflow-hidden border border-line w-24 aspect-square bg-paper-warm">
                            <img
                              src={review.evidence}
                              alt="Hình ảnh thực tế từ khách"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {review.replyFromShop && (
                          <div className="mt-3 p-3.5 bg-paper rounded-xl border border-line">
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
          <div className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-ink mb-2">Giới thiệu về {shopName}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {shopInfo?.description ||
                  `${shopName} là đối tác tin cậy của CapNong, cam kết cung ứng các loại rau củ quả tươi ngon, thu hoạch tại vườn và đóng gói cẩn thận để giữ trọn vị ngọt tự nhiên khi đến tay người tiêu dùng.`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-line">
              <div className="p-4 rounded-2xl bg-paper-warm border border-line">
                <h4 className="font-bold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="size-4 text-soil-700" />
                  <span>Khu vực canh tác</span>
                </h4>
                <p className="text-xs text-ink-muted font-medium">
                  {shopInfo?.address || 'Đang cập nhật địa chỉ nhà vườn'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-paper-warm border border-line">
                <h4 className="font-bold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-leaf-700" />
                  <span>Cam kết chất lượng</span>
                </h4>
                <p className="text-xs text-ink-muted font-medium">
                  Nông sản minh bạch xuất xứ, không chất bảo quản độc hại, hỗ trợ đổi trả nếu dập hỏng.
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
