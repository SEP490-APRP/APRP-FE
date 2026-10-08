import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStorefront } from '@/app/layouts/StorefrontLayout'
import RequireRole from './RequireRole'
import type { AuthUser } from '@/types/auth.types'
import { useAuth } from '@/stores'

// ---- Lazy-loaded page chunks (Tải theo nhu cầu, không làm phình file JS chính) ----
const Home = lazy(() => import('@/pages/Home'))
const Fresh = lazy(() => import('@/pages/Fresh'))
const Combos = lazy(() => import('@/pages/Combos'))
const AiPage = lazy(() => import('@/pages/AiPage'))
const FarmerStoriesPage = lazy(() => import('@/pages/FarmerStoriesPage'))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const ProductDetail = lazy(() => import('@/pages/product/ProductDetail'))
const ShopPage = lazy(() => import('@/pages/product/ShopPage'))
const ShopVouchers = lazy(() => import('@/pages/product/ShopVouchers'))
const AuthPage = lazy(() => import('@/pages/AuthPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage/ForgotPasswordPage'))
const OtpVerificationPage = lazy(() => import('@/pages/OtpVerificationPage/OtpVerificationPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const AdminPortal = lazy(() => import('@/pages/admin/AdminPortal'))
const FarmerPortal = lazy(() => import('@/pages/farmer/FarmerPortal'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'))
const BuyerOrdersPage = lazy(() => import('@/pages/BuyerOrdersPage'))
const ShipperDashboard = lazy(() => import('@/pages/shipper/Dashboard'))

const DEFAULT_PRODUCT_ID = '701'
const DEFAULT_SHOP_ID = '101'

/** Loading indicator khi chuyển trang */
export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 p-8">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#e5e2da] border-t-[#326318]" />
      <span className="text-xs font-semibold text-[#5f6b57]">Đang tải dữ liệu...</span>
    </div>
  )
}

/** Root Layout bọc toàn bộ ứng dụng */
export function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    // Tự động chuyển hướng mượt mà nếu người dùng truy cập link cũ có dấu # (VD: /#/dang-nhap -> /dang-nhap)
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.slice(1)
      navigate(cleanPath, { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-sand text-soil-800 antialiased font-sans">
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

// ---- Storefront Route Adapters (Tiếp nhận context từ StorefrontLayout) ----

export function HomeRoute() {
  const { onAdd, onInfo, cart } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <Home onAdd={onAdd} onInfo={onInfo} cart={cart} />
    </Suspense>
  )
}

export function FreshRoute() {
  const { query, setQuery, onAdd, onInfo, cart } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <Fresh query={query} setQuery={setQuery} onAdd={onAdd} onInfo={onInfo} cart={cart} />
    </Suspense>
  )
}

export function CombosRoute() {
  const { onAdd, onInfo } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <Combos onAdd={onAdd} onInfo={onInfo} />
    </Suspense>
  )
}

export function AiRoute() {
  const { onInfo } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <AiPage onInfo={onInfo} />
    </Suspense>
  )
}

export function StoriesRoute() {
  const { onAdd, onInfo } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <FarmerStoriesPage onAdd={onAdd} onInfo={onInfo} />
    </Suspense>
  )
}

export function PrivacyRoute() {
  const navigate = useNavigate()
  return (
    <Suspense fallback={<PageLoading />}>
      <PrivacyPolicy onNavigateHome={() => navigate('/')} />
    </Suspense>
  )
}

export function ProductRoute() {
  const { productId = DEFAULT_PRODUCT_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <Suspense fallback={<PageLoading />}>
        <ProductDetail productId={productId} onBack={() => navigate('/')} />
      </Suspense>
    </div>
  )
}

export function ShopRoute() {
  const { shopId = DEFAULT_SHOP_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <Suspense fallback={<PageLoading />}>
        <ShopPage shopId={shopId} onBack={() => navigate('/')} />
      </Suspense>
    </div>
  )
}

export function ShopVouchersRoute() {
  const { shopId = DEFAULT_SHOP_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <Suspense fallback={<PageLoading />}>
        <ShopVouchers shopId={shopId} onBack={() => navigate(`/cua-hang/${shopId}`)} />
      </Suspense>
    </div>
  )
}

export function AuthRoute({ mode }: { mode: 'login' | 'register' }) {
  const { pathname, search, state } = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const initialRole =
    search.includes('role=shop') || search.includes('ban-nong-san')
      ? 'shop'
      : search.includes('role=shipper')
        ? 'shipper'
        : 'buyer'

  return (
    <Suspense fallback={<PageLoading />}>
      <AuthPage
        key={pathname + search}
        initialMode={mode}
        initialRole={initialRole}
        onLoginSuccess={(user: AuthUser) => {
          const fromLocation = (state as { from?: { pathname: string } })?.from?.pathname
          if (fromLocation && fromLocation !== '/dang-nhap' && fromLocation !== '/dang-ky') {
            navigate(fromLocation)
          } else {
            navigate(
              user.role === 'admin'
                ? '/admin'
                : user.role === 'shop'
                  ? '/shop'
                  : user.role === 'shipper'
                    ? '/shipper'
                    : '/',
            )
          }
        }}
      />
    </Suspense>
  )
}

export function ForgotPasswordRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ForgotPasswordPage />
    </Suspense>
  )
}

export function OtpVerificationRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <OtpVerificationPage />
    </Suspense>
  )
}

// ---- Portals với Role Guards ----

function usePortalProps() {
  const navigate = useNavigate()
  return {
    onNavigateStore: () => navigate('/'),
    onLogout: async () => {
      await navigate('/')
    },
  }
}

export function AdminRoute() {
  return (
    <RequireRole roles={['admin']} audience="tài khoản Admin" loginHref="/dang-nhap?role=admin">
      <Suspense fallback={<PageLoading />}>
        <AdminPortal {...usePortalProps()} />
      </Suspense>
    </RequireRole>
  )
}

export function SellerRoute() {
  return (
    <RequireRole roles={['shop']} audience="tài khoản Nhà vườn" loginHref="/dang-nhap?role=shop">
      <Suspense fallback={<PageLoading />}>
        <FarmerPortal {...usePortalProps()} />
      </Suspense>
    </RequireRole>
  )
}

export function CartRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CartPage />
    </Suspense>
  )
}

export function CheckoutRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CheckoutPage />
    </Suspense>
  )
}

export function PaymentResultRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PaymentResultPage />
    </Suspense>
  )
}

export function BuyerOrdersRoute() {
  return (
    <Suspense fallback={<PageLoading />}>
      <BuyerOrdersPage />
    </Suspense>
  )
}

export function ShipperRoute() {
  return (
    <RequireRole
      roles={['shipper']}
      audience="tài khoản Tài xế (Shipper)"
      loginHref="/dang-nhap?role=shipper"
    >
      <Suspense fallback={<PageLoading />}>
        <ShipperDashboard {...usePortalProps()} />
      </Suspense>
    </RequireRole>
  )
}

const HOME_SECTION_IDS = [
  'fresh',
  'combos',
  'farmer-story',
  'ai-features',
  'categories',
  'today-rescue',
  'process',
  'reviews',
  'danh-muc',
  'giai-cuu-hom-nay',
  'quy-trinh',
  'cong-dong-tieu-dung',
  'dang-ky-dong-hanh',
  'newsletter-contact',
] as const

const isHomeSection = (segment?: string) =>
  (HOME_SECTION_IDS as readonly string[]).includes(segment ?? '')

export function SectionOrNotFound() {
  const { '*': segment } = useParams()
  return isHomeSection(segment) ? (
    <HomeRoute />
  ) : (
    <Suspense fallback={<PageLoading />}>
      <NotFoundPage />
    </Suspense>
  )
}
