import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Package,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Leaf,
  Clock,
  Sparkles,
  Gift,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Store,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MapPin,
  Heart,
} from 'lucide-react'

import { useAddToCart } from '@/features/cart'
import {
  useShopReviews,
  useComboReviews,
  useMysteryBoxReviews,
  useReactToReview,
} from '@/features/review'
import { useUser } from '@/features/user'
import { comboService, mysteryBoxService, type BuildCombo, type MysteryBox } from '@/services'
import { useAuth } from '@/stores'
import { useChatStore } from '@/stores/useChatStore'
import { CapNongLoading } from '@/components/ui/Loading'
import Pagination from '@/components/ui/Pagination'
import { globalShowAlert } from '@/components/common/Popup'
import { ProductShopCard } from '@/pages/product/components/ProductShopCard'
import { ProductSharePopover } from '@/pages/product/components/ProductSharePopover'

export default function ComboDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // Xác định loại sản phẩm: Túi Mù hay Build Combo qua URL
  const isMystery =
    location.pathname.includes('/mystery-box') || location.pathname.includes('/tui-mu')
  const kind = isMystery ? 'MYSTERY_BOX' : 'BUILD_COMBO'
  const numericId = Number(id) || 0

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comboData, setComboData] = useState<BuildCombo | null>(null)
  const [mysteryData, setMysteryData] = useState<MysteryBox | null>(null)
  const [relatedItems, setRelatedItems] = useState<(BuildCombo | MysteryBox)[]>([])
  const [quantity, setQuantity] = useState(1)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'policy' | 'reviews'>('info')
  const [reviewPage, setReviewPage] = useState(0)
  const detailSectionRef = useRef<HTMLDivElement>(null)

  // Reviews hook
  const comboReviewsQuery = useComboReviews(!isMystery && numericId > 0 ? numericId : undefined)
  const mysteryReviewsQuery = useMysteryBoxReviews(isMystery && numericId > 0 ? numericId : undefined)
  const reviews = isMystery ? mysteryReviewsQuery.data ?? [] : comboReviewsQuery.data ?? []
  const isReviewsLoading = isMystery ? mysteryReviewsQuery.isLoading : comboReviewsQuery.isLoading

  // React to review hook
  const reactToReview = useReactToReview()
  const reactingReviewId = reactToReview.isPending ? reactToReview.variables.reviewId : null

  const addToCart = useAddToCart()

  // Fetch chi tiết combo hoặc túi mù
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        if (isMystery) {
          const res = await mysteryBoxService.getById(numericId)
          if (isMounted) setMysteryData(res)
        } else {
          const res = await comboService.getComboById(numericId)
          if (isMounted) setComboData(res)
        }
      } catch {
        if (isMounted) {
          setError(
            isMystery
              ? 'Không tìm thấy túi mù này hoặc túi mù đã ngừng bán.'
              : 'Không tìm thấy gói combo này hoặc combo đã ngừng bán.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (numericId > 0) {
      fetchData()
    } else {
      setError('Mã sản phẩm không hợp lệ')
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [numericId, isMystery])

  // Fetch các combo / túi mù liên quan
  useEffect(() => {
    let isMounted = true
    const fetchRelated = async () => {
      try {
        if (isMystery) {
          const res = await mysteryBoxService.getForBuyer({ size: 6, isActive: true })
          if (isMounted) {
            const list = (res.content || []).filter(
              (b) => (b.mysteryId ?? b.id) !== numericId,
            )
            setRelatedItems(list.slice(0, 4))
          }
        } else {
          const res = await comboService.getCombos({ size: 6, status: 'ACTIVE' })
          if (isMounted) {
            const list = (res.content || []).filter(
              (c) => (c.comboId ?? c.id) !== numericId,
            )
            setRelatedItems(list.slice(0, 4))
          }
        }
      } catch {
        /* silent */
      }
    }
    fetchRelated()
    return () => {
      isMounted = false
    }
  }, [numericId, isMystery])

  // Trích xuất thông tin chung
  const title = isMystery
    ? mysteryData?.boxType || 'Túi Mù Nông Sản'
    : comboData?.comboName || 'Combo Nông Sản'
  const price = Number(isMystery ? mysteryData?.price || 0 : comboData?.price || 0)
  const originalPrice = isMystery
    ? Math.round(price * 1.35)
    : price > 0
      ? Math.round(price * 1.3)
      : 0
  const savings = originalPrice > price ? originalPrice - price : 0
  const discountPercent =
    originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 30
  const imageUrl = isMystery
    ? mysteryData?.imageUrl || '/assets/combo-mystery.jpg'
    : comboData?.imageUrl || '/assets/combo-green.jpg'
  const description = isMystery
    ? mysteryData?.description ||
      'Nông sản tươi ngon ngẫu nhiên thu hoạch trực tiếp tại vườn trong ngày.'
    : comboData?.description || 'Gói nông sản dinh dưỡng tiện lợi cho bữa ăn gia đình.'
  const portion = isMystery ? mysteryData?.note || 'Khẩu phần 2–4 người' : 'Khẩu phần gia đình'
  const cookingSuggestion = !isMystery ? comboData?.cookingSuggestion : null
  const totalQuantity = Number(
    isMystery ? (mysteryData?.totalQuantity ?? 0) : (comboData?.totalQuantity ?? 0),
  )
  const soldQuantity = Number(
    isMystery ? (mysteryData?.soldQuantity ?? 0) : (comboData?.soldQuantity ?? 0),
  )
  const stock = Math.max(0, totalQuantity - soldQuantity)
  const isOutOfStock = stock <= 0

  // Shop thông tin
  const shopId = isMystery
    ? mysteryData?.shopId || mysteryData?.shopOwnerId
    : comboData?.shop?.id || (comboData as any)?.shopId
  const farmName = isMystery
    ? mysteryData?.shopName || 'Nhà vườn CapNong'
    : comboData?.shop?.shopName || 'Nhà vườn CapNong'
  const shopReviews = useShopReviews(shopId).data ?? []
  const shopOwner = useUser(shopId, { enabled: isAuthenticated && !!shopId }).data ?? null

  // Đánh giá trung bình
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.ratingStar, 0) / reviews.length
      : 5.0

  // SEO document title & OG tags
  useEffect(() => {
    if (title) {
      document.title = `${title} - ${farmName} | CapNong`
    }
    return () => {
      document.title = 'CapNong - Nông sản xấu mã – Ngon thật'
    }
  }, [title, farmName])

  const handleBack = () => {
    navigate('/combo-tui-mu')
  }

  const handleNavigateToShop = () => {
    if (shopId) {
      navigate(`/cua-hang/${shopId}`)
    }
  }

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (shopId) {
      try {
        const conv = await useChatStore.getState().startChatWithUser(shopId)
        navigate(`/tin-nhan?chatId=${conv.id}`)
      } catch {
        navigate(`/tin-nhan?chatId=${shopId}`)
      }
    }
  }

  const handleAddToCart = async (buyNow = false) => {
    if (numericId <= 0) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      await addToCart.mutateAsync({
        itemId: numericId,
        itemType: kind,
        quantity,
      })
      window.dispatchEvent(new Event('cart-updated'))
      globalShowAlert(`Đã thêm ${quantity} gói ${title} vào giỏ hàng`, 'Thành công', 'success')
      if (buyNow) {
        navigate('/cart')
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.'
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  const handleReact = async (reviewId: number, reactionType: 'LIKE' | 'DISLIKE') => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (reactingReviewId === reviewId) return
    try {
      await reactToReview.mutateAsync({ reviewId, reaction: reactionType })
    } catch {
      /* silent */
    }
  }

  if (loading) {
    return (
      <CapNongLoading
        message="Đang tải thông tin gói nông sản..."
        subMessage="CapNong · Tuyển chọn tươi ngon từ nhà vườn"
      />
    )
  }

  if (error || (!comboData && !mysteryData)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 w-full px-4">
        <div className="bg-red-50 border border-red-100 p-8 rounded-xl flex flex-col items-center gap-4 text-red-600 font-bold max-w-lg text-center">
          <AlertCircle className="size-10" />
          <p>{error || 'Gói nông sản không tồn tại.'}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 px-6 py-2 bg-white text-red-600 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            Quay lại danh sách Combo & Túi mù
          </button>
        </div>
      </div>
    )
  }

  const items = !isMystery ? comboData?.items || [] : mysteryData?.items || []

  const highlights = [
    {
      icon: Leaf,
      label: 'Thu hoạch tươi',
      sub: 'Hái trực tiếp trong ngày',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      icon: MapPin,
      label: 'Nguồn gốc rõ',
      sub: farmName,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      icon: Package,
      label: 'Đóng gói cẩn thận',
      sub: 'Giữ độ tươi giòn',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      icon: ShieldCheck,
      label: 'Đổi trả miễn phí 24h',
      sub: 'Bù tiền nếu dập nát',
      color: 'text-leaf-700 bg-leaf-50 border-leaf-200',
    },
  ]

  // Pagination for reviews
  const REVIEW_PAGE_SIZE = 5
  const totalReviewPages = Math.ceil(reviews.length / REVIEW_PAGE_SIZE)
  const pagedReviews = reviews.slice(
    reviewPage * REVIEW_PAGE_SIZE,
    (reviewPage + 1) * REVIEW_PAGE_SIZE,
  )

  return (
    <div
      className="flex-1 pb-12 font-sans text-ink"
      style={{
        background: 'linear-gradient(160deg, #f0f7eb 0%, #fcf9f1 40%, #fcf9f1 100%)',
      }}
    >
      {/* 1. Breadcrumbs & Share */}
      <div className="max-w-6xl mx-auto px-4 pt-2.5 pb-1 flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-ink-muted min-w-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Quay lại"
            className="shrink-0 size-7 flex items-center justify-center rounded-md bg-paper-warm hover:bg-paper text-ink transition-colors border border-line cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span
            className="cursor-pointer hover:text-leaf-700 truncate hidden sm:inline"
            onClick={() => navigate('/')}
          >
            Trang chủ
          </span>
          <ChevronRight className="size-3 shrink-0 hidden sm:block text-line-strong" />
          <span
            className="cursor-pointer hover:text-leaf-700 truncate hidden sm:inline"
            onClick={handleBack}
          >
            Combo & Túi mù
          </span>
          <ChevronRight className="size-3 shrink-0 hidden sm:block text-line-strong" />
          <span className="text-ink font-semibold truncate">{title}</span>
        </nav>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowShareMenu((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 bg-paper-warm hover:bg-paper text-ink rounded-md text-xs font-medium transition-all border border-line cursor-pointer"
          >
            <Share2 className="size-3" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          <ProductSharePopover
            isOpen={showShareMenu}
            onClose={() => setShowShareMenu(false)}
            productUrl={window.location.href}
            shopUrl={shopId ? `${window.location.origin}/cua-hang/${shopId}` : null}
            shopId={shopId ? Number(shopId) : undefined}
            comboId={!isMystery ? numericId : undefined}
            mysteryBoxId={isMystery ? numericId : undefined}
            targetType={kind}
            targetId={numericId}
            type="product"
            align="right"
          />
        </div>
      </div>

      {/* 2. Hero Section (Matching ProductHeroSection format) */}
      <div className="max-w-6xl mx-auto px-4 pt-1 pb-3">
        <div className="bg-white rounded-xl border border-line p-5 sm:p-7 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 lg:gap-10 items-start">
            {/* Cột trái: Ảnh & Badge & Trust Highlights (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-line-subtle bg-paper-warm/50 shadow-2xs group">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge giảm giá */}
                {savings > 0 && (
                  <div className="absolute top-3 left-3 bg-sale text-white text-[11px] font-black px-2 py-0.5 rounded shadow-2xs">
                    -{discountPercent}%
                  </div>
                )}

                {/* Badge phân loại */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-md ${
                      isMystery ? 'bg-purple-700/90 text-white' : 'bg-leaf-700/90 text-white'
                    }`}
                  >
                    {isMystery ? <Gift className="size-3.5" /> : <Package className="size-3.5" />}
                    <span>{isMystery ? 'Túi Mù May Mắn' : 'Combo Nông Sản'}</span>
                  </span>
                </div>
              </div>

              {/* 2x2 Trust Badges Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {highlights.map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 p-2 rounded-lg bg-paper-warm/70 border border-line/80"
                  >
                    <div className="size-7 rounded-md bg-leaf-50 text-leaf-700 flex items-center justify-center shrink-0">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-ink leading-tight truncate">
                        {label}
                      </p>
                      <p className="text-[10px] text-ink-muted leading-tight truncate mt-0.5">
                        {sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải: Thông tin, Giá, Thành phần & Mua hàng (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-3 sm:gap-3.5">
              <div>
                {/* Farm tag */}
                <button
                  type="button"
                  onClick={handleNavigateToShop}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 bg-leaf-50 hover:bg-leaf-100 border border-leaf-200/80 rounded-md px-2.5 py-0.5 mb-2 transition-colors cursor-pointer"
                >
                  <Store className="size-3.5" />
                  <span>{farmName}</span>
                </button>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink leading-snug tracking-tight">
                  {title}
                </h1>

                {/* Rating & Sold count */}
                <div className="flex items-center gap-2 mt-1.5 pb-2.5 border-b border-line/60">
                  <div className="flex text-sun-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          i < Math.round(avgRating)
                            ? 'fill-sun-500 text-sun-500'
                            : 'text-line-strong'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-ink-muted text-xs font-medium">
                    {reviews.length > 0
                      ? `${avgRating.toFixed(1)} (${reviews.length} đánh giá)`
                      : 'Chưa có đánh giá'}
                  </span>
                  <span className="text-ink-muted text-xs font-normal">·</span>
                  <span className="text-ink-muted text-xs font-medium">
                    Đã bán {soldQuantity} gói
                  </span>
                </div>
              </div>

              {/* Price Block */}
              <div>
                {savings > 0 ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted text-sm line-through font-medium">
                        {originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="bg-sale text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                        -{discountPercent}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-2xl sm:text-3xl text-leaf-800 leading-none">
                        {price.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-ink-muted font-medium text-xs sm:text-sm">
                        / {isMystery ? 'túi' : 'gói'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Heart className="size-2.5 fill-current" />
                      Tiết kiệm {savings.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-2xl sm:text-3xl text-leaf-800 leading-none">
                      {price.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-ink-muted font-medium text-xs sm:text-sm">
                      / {isMystery ? 'túi' : 'gói'}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badges Row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isOutOfStock ? (
                  <span className="bg-sale-soft text-sale text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-sale/20">
                    Tạm hết hàng
                  </span>
                ) : (
                  <>
                    <span className="bg-leaf-50 text-leaf-700 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-leaf-200">
                      {portion}
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
                      Còn sẵn {stock} gói
                    </span>
                  </>
                )}
              </div>

              {/* Description snippet */}
              {description && (
                <p className="text-ink-muted text-xs leading-relaxed line-clamp-2">
                  {description}
                </p>
              )}

              {/* THÀNH PHẦN NÔNG SẢN BÊN TRONG */}
              <div className="rounded-lg border border-line bg-paper-warm/50 p-3 flex flex-col gap-2">
                <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                  {isMystery ? (
                    <Gift className="size-3.5 text-purple-600" />
                  ) : (
                    <Package className="size-3.5 text-leaf-700" />
                  )}
                  <span>
                    {isMystery
                      ? 'Nông sản bí ẩn bên trong túi'
                      : `Gói combo bao gồm (${items.length} loại nông sản)`}
                  </span>
                </p>

                {isMystery ? (
                  <div className="text-xs text-purple-900 bg-purple-50/70 border border-purple-200/60 p-2.5 rounded-lg leading-relaxed">
                    <p className="font-semibold mb-0.5">Thu hoạch ngẫu nhiên tại vườn:</p>
                    <p className="text-[11px] text-purple-800">
                      Tuyển chọn tươi mới nhất sáng nay. Mở túi để đón nhận bất ngờ tươi ngon!
                    </p>
                    {items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-purple-200/50 flex flex-wrap gap-1.5">
                        <span className="text-[11px] font-bold text-purple-900">
                          Có thể bao gồm:
                        </span>
                        {items.map((it: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-white border border-purple-200 text-purple-800 text-[10px] font-semibold"
                          >
                            {it.productName || it.name || 'Rau củ mùa vụ'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-xs text-ink-muted italic">
                    Nhà vườn đang cập nhật chi tiết thành phần.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {items.map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-1.5 rounded-md bg-white border border-line/70"
                      >
                        <CheckCircle2 className="size-3.5 text-leaf-600 shrink-0" />
                        <span className="text-xs font-medium text-ink flex-1 truncate">
                          {it.productName || it.name || `Nông sản #${idx + 1}`}
                        </span>
                        <span className="text-[11px] font-semibold text-ink-muted shrink-0">
                          {it.quantity || it.productQuantity || 1} {it.unit || 'phần'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Actions */}
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  {/* Quantity picker */}
                  <div className="flex items-center border border-line rounded-lg bg-paper overflow-hidden h-10 shrink-0">
                    <button
                      type="button"
                      aria-label="Giảm số lượng"
                      disabled={isOutOfStock || quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="size-3" />
                    </button>
                    <input
                      type="text"
                      value={isOutOfStock ? '0' : `${quantity}`}
                      readOnly
                      aria-label="Số lượng gói"
                      className="w-12 text-center font-bold bg-transparent outline-none text-ink select-none text-xs"
                    />
                    <button
                      type="button"
                      aria-label="Tăng số lượng"
                      disabled={isOutOfStock || quantity >= stock}
                      onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                      className="w-8 h-full flex items-center justify-center hover:bg-paper-warm transition-colors text-ink disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    disabled={isOutOfStock || addToCart.isPending}
                    onClick={() => handleAddToCart(false)}
                    className="flex-1 h-10 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] text-xs sm:text-sm text-leaf-800 bg-leaf-50 hover:bg-leaf-100 border border-leaf-300"
                  >
                    {addToCart.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="size-4 text-leaf-700" />
                    )}
                    <span>{addToCart.isPending ? 'Đang thêm...' : 'Thêm vào giỏ'}</span>
                  </button>

                  {/* Buy Now */}
                  <button
                    type="button"
                    disabled={isOutOfStock || addToCart.isPending}
                    onClick={() => handleAddToCart(true)}
                    className="flex-1 h-10 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] text-xs sm:text-sm text-white bg-leaf-700 hover:bg-leaf-800 shadow-sm"
                  >
                    <Zap className="size-4" />
                    <span>Mua ngay</span>
                  </button>

                  {/* Chat button */}
                  {shopId && (
                    <button
                      type="button"
                      onClick={handleStartChat}
                      title="Nhắn tin với nhà vườn"
                      className="h-10 px-3 rounded-lg border border-leaf-300 bg-leaf-50/70 hover:bg-leaf-100 text-leaf-800 font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shrink-0"
                    >
                      <MessageSquare className="size-3.5 text-leaf-700" />
                      <span className="hidden sm:inline">Hỏi shop</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Asymmetric 7:3 Content Layout */}
      <div className="max-w-6xl mx-auto px-4 mt-6 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột trái: Tabs (Mô tả, Chính sách, Đánh giá) - 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            <div
              ref={detailSectionRef}
              className="bg-white rounded-xl border border-line shadow-2xs overflow-hidden"
            >
              {/* Tab Header */}
              <div className="flex border-b border-line overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 min-w-[120px] px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer ${
                    activeTab === 'info'
                      ? 'border-leaf-700 text-leaf-700 bg-leaf-50/50'
                      : 'border-transparent text-ink-muted hover:text-ink hover:bg-paper-warm'
                  }`}
                >
                  Mô tả & Gợi ý chế biến
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('policy')}
                  className={`flex-1 min-w-[120px] px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer ${
                    activeTab === 'policy'
                      ? 'border-leaf-700 text-leaf-700 bg-leaf-50/50'
                      : 'border-transparent text-ink-muted hover:text-ink hover:bg-paper-warm'
                  }`}
                >
                  Chính sách & Bảo quản
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 min-w-[120px] px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'border-leaf-700 text-leaf-700 bg-leaf-50/50'
                      : 'border-transparent text-ink-muted hover:text-ink hover:bg-paper-warm'
                  }`}
                >
                  Đánh giá ({reviews.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 sm:p-6">
                {activeTab === 'info' && (
                  <div className="space-y-5 text-sm text-ink leading-relaxed">
                    <div>
                      <h3 className="font-bold text-base text-ink mb-2">Giới thiệu gói nông sản</h3>
                      <p className="text-ink-muted text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {description}
                      </p>
                    </div>

                    {cookingSuggestion && (
                      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                        <h4 className="font-bold text-amber-900 mb-1.5 flex items-center gap-2 text-sm">
                          <Sparkles className="size-4 text-amber-600" />
                          <span>Gợi ý thực đơn & Cách chế biến:</span>
                        </h4>
                        <p className="text-amber-800 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                          {cookingSuggestion}
                        </p>
                      </div>
                    )}

                    {isMystery && (
                      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                        <h4 className="font-bold text-purple-900 mb-1.5 flex items-center gap-2 text-sm">
                          <Gift className="size-4 text-purple-600" />
                          <span>Trải nghiệm mở túi mù (Unboxing):</span>
                        </h4>
                        <p className="text-purple-800 text-xs sm:text-sm leading-relaxed">
                          Mỗi túi mù là một bất ngờ thú vị! Nông dân sẽ thu hái các loại rau củ quả
                          đạt độ ngon ngọt nhất trong vườn vào đúng buổi sáng bạn đặt hàng. Tiết kiệm
                          đến 35% so với mua lẻ từng loại và giảm thiểu lãng phí nông sản đạt chuẩn
                          nhưng hình thức độc lạ.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'policy' && (
                  <div className="space-y-4 text-xs sm:text-sm text-ink leading-relaxed">
                    <div className="flex gap-3 p-3.5 rounded-lg border border-line bg-paper-warm/50">
                      <Package className="size-5 text-leaf-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink">Quy cách đóng gói</p>
                        <p className="text-ink-muted text-xs mt-0.5">
                          Nông sản được xếp cẩn thận vào thùng carton giữ nhiệt hoặc túi sinh học giữ
                          ẩm, có lớp giấy rơm tự nhiên chống dập nát suốt quá trình vận chuyển.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3.5 rounded-lg border border-line bg-paper-warm/50">
                      <Clock className="size-5 text-leaf-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink">Bảo quản tại gia đình</p>
                        <p className="text-ink-muted text-xs mt-0.5">
                          Sau khi nhận hàng, quý khách nên phân loại, để ráo nước và đặt vào ngăn mát
                          tủ lạnh (3–8°C) để giữ nguyên vị ngọt giòn trong 5–7 ngày.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3.5 rounded-lg border border-line bg-paper-warm/50">
                      <ShieldCheck className="size-5 text-leaf-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink">Chính sách đổi trả 24h</p>
                        <p className="text-ink-muted text-xs mt-0.5">
                          Nếu phát hiện nông sản bị thối, dập hỏng quá 20% do quá trình thu hoạch
                          hoặc vận chuyển, CapNong cam kết đổi mới hoặc hoàn tiền ngay trong 24 giờ.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-5">
                    {/* Rating Overview */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-paper-warm/60 border border-line">
                      <div className="text-center shrink-0 pr-4 border-r border-line">
                        <p className="text-3xl font-black text-leaf-800">{avgRating.toFixed(1)}</p>
                        <div className="flex text-sun-500 justify-center my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < Math.round(avgRating)
                                  ? 'fill-sun-500 text-sun-500'
                                  : 'text-line-strong'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-ink-muted">{reviews.length} đánh giá</p>
                      </div>

                      <div className="text-xs text-ink-muted leading-relaxed">
                        <p className="font-bold text-ink">Đánh giá từ khách mua thực tế</p>
                        <p>
                          Tất cả phản hồi được gửi bởi người mua đã nhận và trải nghiệm gói nông sản
                          này từ nhà vườn.
                        </p>
                      </div>
                    </div>

                    {isReviewsLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-leaf-700 size-8" />
                      </div>
                    ) : reviews.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {pagedReviews.map((review) => {
                            const isLiked = review.currentUserReaction === 'LIKE'
                            const isDisliked = review.currentUserReaction === 'DISLIKE'
                            const isReacting = reactingReviewId === review.id

                            return (
                              <div
                                key={review.id}
                                className="bg-paper-warm p-4 rounded-lg border border-line"
                              >
                                <div className="flex justify-between items-start mb-2.5 gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-full bg-leaf-50 border border-leaf-200 flex items-center justify-center font-bold text-leaf-700 text-xs shrink-0">
                                      {review.fullName
                                        ? review.fullName.charAt(0).toUpperCase()
                                        : review.buyerId}
                                    </div>
                                    <div>
                                      <p className="font-bold text-ink text-xs sm:text-sm">
                                        {review.fullName || `Khách mua #${review.buyerId}`}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-sun-500 mt-0.5">
                                        <div className="flex">
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
                                          {review.createAt || review.createdAt
                                            ? new Date(
                                                review.createAt || review.createdAt!,
                                              ).toLocaleDateString('vi-VN')
                                            : 'Gần đây'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleReact(review.id, 'LIKE')}
                                      disabled={isReacting}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                                        isLiked
                                          ? 'bg-leaf-700 text-white border-leaf-700'
                                          : 'bg-white text-ink-muted border-line hover:border-leaf-300'
                                      }`}
                                    >
                                      <ThumbsUp className="size-3" />
                                      <span>{review.likeCount ?? 0}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReact(review.id, 'DISLIKE')}
                                      disabled={isReacting}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                                        isDisliked
                                          ? 'bg-sale text-white border-sale'
                                          : 'bg-white text-ink-muted border-line hover:border-sale'
                                      }`}
                                    >
                                      <ThumbsDown className="size-3" />
                                      <span>{review.dislikeCount ?? 0}</span>
                                    </button>
                                  </div>
                                </div>

                                <p className="text-ink text-xs sm:text-sm leading-relaxed mb-2">
                                  {review.comment}
                                </p>

                                {review.imageUrls && review.imageUrls.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {review.imageUrls.map((url, i) => (
                                      <div
                                        key={i}
                                        className="rounded-lg overflow-hidden border border-line size-20 bg-white shrink-0"
                                      >
                                        <img
                                          src={url}
                                          alt={`Ảnh đánh giá ${i + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {review.replyFromShop && (
                                  <div className="bg-white p-3 rounded-lg border border-line text-xs mt-2">
                                    <div className="inline-flex items-center gap-1.5 text-leaf-700 font-bold text-xs uppercase tracking-wider mb-1">
                                      <MessageSquare className="size-3" />
                                      <span>Phản hồi từ Nhà vườn</span>
                                    </div>
                                    <p className="text-ink-muted italic">{review.replyFromShop}</p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {totalReviewPages > 1 && (
                          <div className="pt-4 border-t border-line/70 flex justify-center">
                            <Pagination
                              currentPage={reviewPage}
                              totalPages={totalReviewPages}
                              onPageChange={(page) => setReviewPage(page)}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 bg-paper-warm/50 rounded-xl border border-dashed border-line">
                        <Star className="size-10 text-line-strong mx-auto mb-2" />
                        <p className="text-ink-muted font-bold text-xs uppercase tracking-wider">
                          Chưa có đánh giá nào cho gói nông sản này
                        </p>
                        <p className="text-ink-muted text-xs mt-1">
                          Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Shop Farm Card + Gợi ý liên quan - 4 cols (sticky) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            <ProductShopCard
              farmName={farmName}
              shopOwner={shopOwner}
              resolvedShopId={shopId ? Number(shopId) : undefined}
              shopReviews={shopReviews}
              shopUrl={shopId ? `${window.location.origin}/cua-hang/${shopId}` : null}
              isAuthenticated={isAuthenticated}
              onNavigateToShop={handleNavigateToShop}
              onStartChat={handleStartChat}
            />

            {/* Compact Related items widget */}
            {relatedItems && relatedItems.length > 0 && (
              <div className="bg-white rounded-xl border border-line p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-line/60">
                  <h3 className="font-bold text-ink text-sm">
                    {isMystery ? 'Túi mù đề xuất khác' : 'Combo đề xuất khác'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/combo-tui-mu')}
                    className="text-[11px] font-semibold text-leaf-700 hover:text-leaf-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="size-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {relatedItems.map((item: any) => {
                    const itemId = item.mysteryId ?? item.comboId ?? item.id
                    const itemName = item.boxType || item.comboName || 'Gói nông sản'
                    const itemPrice = Number(item.price || 0)
                    const itemRemaining = Math.max(
                      0,
                      Number(item.totalQuantity ?? 0) - Number(item.soldQuantity ?? 0),
                    )
                    const itemImg =
                      item.imageUrl ||
                      (isMystery ? '/assets/combo-mystery.jpg' : '/assets/combo-green.jpg')
                    const targetLink = isMystery ? `/mystery-box/${itemId}` : `/combo/${itemId}`

                    return (
                      <button
                        key={itemId}
                        type="button"
                        onClick={() => navigate(targetLink)}
                        className="w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-paper-warm/70 transition-colors text-left group cursor-pointer"
                      >
                        <div className="size-13 rounded-lg bg-paper-warm/50 border border-line/70 overflow-hidden shrink-0">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-ink line-clamp-1 group-hover:text-leaf-700 transition-colors">
                            {itemName}
                          </p>
                          <p className="text-xs font-bold text-leaf-700 mt-0.5">
                            {itemPrice.toLocaleString('vi-VN')}đ
                          </p>
                          <p className="text-[10px] text-ink-muted">
                            {item.totalQuantity != null
                              ? itemRemaining > 0
                                ? `Còn ${itemRemaining} gói`
                                : 'Tạm hết hàng'
                              : 'Sẵn sàng giao'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
