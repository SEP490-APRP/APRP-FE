import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Loader2,
  AlertCircle,
  Leaf,
  MapPin,
  Package,
  ShieldCheck,
} from 'lucide-react'

import { useAddToCart } from '@/features/cart'
import { useProductDetail } from '@/features/product'
import { useProductReviews, useReactToReview, useShopReviews } from '@/features/review'
import { useUser } from '@/features/user'
import { globalShowAlert } from '@/components/common/Popup'
import { useAuth } from '@/stores'
import { absoluteUrl } from '@/utils'
import ShopProducts from './ShopProducts'

import { ProductHeroSection } from './components/ProductHeroSection'
import { ProductShopCard } from './components/ProductShopCard'
import { ProductDetailTabs } from './components/ProductDetailTabs'
import { RelatedProductsSection } from './components/RelatedProductsSection'
import { ProductSharePopover } from './components/ProductSharePopover'

interface ProductDetailProps {
  productId?: string
  onBack?: () => void
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  productId: propProductId,
  onBack: propOnBack,
}) => {
  const { productId: urlProductId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const productId = propProductId || urlProductId || ''

  const detailQuery = useProductDetail(productId)
  const product = detailQuery.data?.product ?? null
  const relatedProducts = detailQuery.data?.related ?? []
  const isLoading = detailQuery.isPending
  const error = detailQuery.isError
    ? 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.'
    : detailQuery.data && !detailQuery.data.product
      ? 'Sản phẩm hiện không khả dụng hoặc cửa hàng đang tạm đóng.'
      : null

  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('Mô tả chi tiết')
  const [viewShopMode, setViewShopMode] = useState(false)
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const detailSectionRef = useRef<HTMLDivElement>(null)

  const resolvedShopId =
    product?.shopId ||
    product?.shopOwnerId ||
    (typeof product?.shop === 'object' && product?.shop ? product.shop.id : undefined)

  const reviewsQuery = useProductReviews(product?.id)
  const reviews = reviewsQuery.data ?? []
  const isReviewsLoading = reviewsQuery.isLoading
  const shopReviews = useShopReviews(resolvedShopId).data ?? []
  const shopOwner =
    useUser(resolvedShopId, { enabled: isAuthenticated && !!resolvedShopId }).data ?? null

  const addToCart = useAddToCart()
  const isAdding = addToCart.isPending
  const reactToReview = useReactToReview()
  const reactingReviewId = reactToReview.isPending ? reactToReview.variables.reviewId : null

  const farmName =
    product?.shopName ||
    (typeof product?.shop === 'object' && product?.shop
      ? product.shop.shopName || product.shop.fullName
      : undefined) ||
    shopOwner?.shopName ||
    shopOwner?.fullName ||
    (resolvedShopId ? `Nông trại #${resolvedShopId}` : 'Nông trại đối tác')

  const productUrl = product ? absoluteUrl(`/san-pham/${product.id}`) : ''
  const shopUrl = resolvedShopId ? absoluteUrl(`/cua-hang/${resolvedShopId}`) : null

  const scrollToProductDetail = () => {
    setActiveTab('Mô tả chi tiết')
    window.setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const handleBack = () => {
    if (propOnBack) propOnBack()
    else navigate('/')
  }

  // Set default quantity according to minOrderKg once product loads
  useEffect(() => {
    if (product?.minOrderKg && product.minOrderKg > 1) {
      setQuantity(product.minOrderKg)
    }
  }, [product?.minOrderKg])

  // OG tags & SEO document title
  useEffect(() => {
    const DEFAULT_TITLE = 'CapNong - Nông sản xấu mã – Ngon thật'
    const DEFAULT_DESC = 'Nền tảng nông sản sạch, tươi ngon, giao hàng tận nhà.'
    const DEFAULT_IMG = '/logo.png'

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (product) {
      const price = product.salePrice ?? product.pricePerKg ?? product.sellingPrice ?? 0
      const priceStr = price.toLocaleString('vi-VN') + 'đ'
      const desc = `${priceStr}/kg tại ${farmName} · ${
        product.description?.slice(0, 80) || 'Nông sản sạch, tươi ngon'
      }`

      document.title = `${product.productName} - ${farmName} | Nông Sản Xấu Mã`
      setMeta('og:title', `${product.productName} - ${farmName}`)
      setMeta('og:description', desc)
      setMeta('og:image', product.imageUrl || DEFAULT_IMG)
      setMeta('og:url', window.location.href)
      setMeta('og:type', 'product')
      setMeta('og:site_name', 'Nông Sản Xấu Mã')
    }

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('og:title', DEFAULT_TITLE)
      setMeta('og:description', DEFAULT_DESC)
      setMeta('og:image', DEFAULT_IMG)
      setMeta('og:url', 'https://nongsanxauma.vn')
      setMeta('og:type', 'website')
      setMeta('og:site_name', 'Nông Sản Xấu Mã')
    }
  }, [product, farmName])

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

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const targetId = product?.id ?? Number(productId)
    if (!targetId || isNaN(targetId)) {
      globalShowAlert('Không xác định được sản phẩm để thêm vào giỏ hàng.', 'Lỗi', 'error')
      return
    }
    try {
      await addToCart.mutateAsync({
        itemType: 'PRODUCT',
        itemId: targetId,
        productId: targetId,
        quantity,
      })
      window.dispatchEvent(new Event('cart-updated'))
      globalShowAlert(
        `Đã thêm ${quantity} kg ${product?.productName || 'nông sản'} vào giỏ hàng`,
        'Thành công',
        'success',
      )
    } catch (e: any) {
      console.error('Failed to add to cart', e)
      const msg = e?.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.'
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  const handleStartChat = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (resolvedShopId) {
      window.dispatchEvent(
        new CustomEvent('open-chat-with-user', {
          detail: {
            userId: resolvedShopId,
            userName: farmName || 'Chủ shop',
          },
        }),
      )
    }
  }

  const handleNavigateToShop = () => {
    if (resolvedShopId) {
      navigate(`/cua-hang/${resolvedShopId}`)
    } else {
      setSelectedShopId(resolvedShopId || null)
      setViewShopMode(true)
    }
  }

  if (viewShopMode && selectedShopId) {
    return (
      <ShopProducts
        shopId={selectedShopId}
        onBack={() => setViewShopMode(false)}
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => navigate('/login')}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4 w-full">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          Đang tải sản phẩm chi tiết...
        </p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 w-full px-4">
        <div className="bg-red-50 border border-red-100 p-8 rounded-3xl flex flex-col items-center gap-4 text-red-600 font-bold max-w-lg text-center">
          <AlertCircle className="size-10" />
          <p>{error || 'Sản phẩm không khả dụng'}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 px-6 py-2 bg-white text-red-600 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  const stockKg = product.stockKg ?? product.stockQuantity ?? 0
  const basePricePerKg = product.pricePerKg ?? product.sellingPrice ?? 0
  const isOutOfStock = stockKg <= 0
  const hasActiveDiscount = product.salePrice != null && product.salePrice > 0
  const displayPrice = hasActiveDiscount ? product.salePrice! : basePricePerKg
  const productAvgRating =
    reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.ratingStar, 0) / reviews.length : 0
  const shopAvgRating =
    shopReviews.length > 0
      ? shopReviews.reduce((acc, r) => acc + r.ratingStar, 0) / shopReviews.length
      : 0
  const minOrderKg = product.minOrderKg ?? 1

  const highlights = [
    {
      icon: Leaf,
      label: 'Thu hoạch tươi',
      sub: 'Giao trong ngày',
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
      sub: 'Giữ độ tươi',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      icon: ShieldCheck,
      label: 'Shop uy tín',
      sub: shopReviews.length > 0 ? `${shopAvgRating.toFixed(1)}★ cửa hàng` : 'Đã xác minh',
      color: 'text-leaf-700 bg-leaf-50 border-leaf-200',
    },
  ]

  return (
    <div
      className="flex-1 pb-10 font-sans text-ink"
      style={{
        background: 'linear-gradient(160deg, #f0f7eb 0%, #fcf9f1 40%, #fcf9f1 100%)',
      }}
    >
      {/* Top breadcrumbs */}
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
            onClick={handleBack}
          >
            Trang chủ
          </span>
          <ChevronRight className="size-3 shrink-0 hidden sm:block text-line-strong" />
          <span
            className="cursor-pointer hover:text-leaf-700 truncate hidden sm:inline"
            onClick={() => navigate('/nong-san-tuoi')}
          >
            Nông sản tươi
          </span>
          <ChevronRight className="size-3 shrink-0 hidden sm:block text-line-strong" />
          <span className="text-ink font-semibold truncate">{product.productName}</span>
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
            productUrl={productUrl}
            shopUrl={shopUrl}
            type="product"
            align="right"
          />
        </div>
      </div>

      {/* Hero section */}
      <ProductHeroSection
        product={product}
        farmName={farmName}
        resolvedShopId={resolvedShopId}
        productAvgRating={productAvgRating}
        reviewsCount={reviews.length}
        stockKg={stockKg}
        isOutOfStock={isOutOfStock}
        basePricePerKg={basePricePerKg}
        hasActiveDiscount={hasActiveDiscount}
        displayPrice={displayPrice}
        minOrderKg={minOrderKg}
        quantity={quantity}
        onQuantityChange={setQuantity}
        isAdding={isAdding}
        onAddToCart={handleAddToCart}
        onScrollToDetail={scrollToProductDetail}
        onNavigateToShop={handleNavigateToShop}
        onStartChat={handleStartChat}
        highlights={highlights}
      />

      {/* Seller Farm Card */}
      <ProductShopCard
        farmName={farmName}
        shopOwner={shopOwner}
        resolvedShopId={resolvedShopId}
        shopReviews={shopReviews}
        shopUrl={shopUrl}
        isAuthenticated={isAuthenticated}
        onNavigateToShop={handleNavigateToShop}
        onStartChat={handleStartChat}
      />

      {/* Details, Certifications, and Reviews Tabs */}
      <ProductDetailTabs
        ref={detailSectionRef}
        product={product}
        farmName={farmName}
        reviews={reviews}
        isReviewsLoading={isReviewsLoading}
        reactingReviewId={reactingReviewId}
        onReact={handleReact}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Related Products Section */}
      <RelatedProductsSection
        relatedProducts={relatedProducts}
        farmName={farmName}
        resolvedShopId={resolvedShopId}
        onNavigateToProduct={(rpId) => navigate(`/san-pham/${rpId}`)}
        onNavigateToShop={handleNavigateToShop}
      />
    </div>
  )
}

export default ProductDetail
