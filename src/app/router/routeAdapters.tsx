import { lazy } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStorefront } from '@/app/layouts/StorefrontLayout'
import RequireRole from './RequireRole'
import type { AuthUser } from '@/types/auth.types'
import { useAuth } from '@/stores'
import { authService } from '@/services'

// Re-export PageLoading từ RootLayout để đảm bảo tính tập trung
export { PageLoading } from '@/app/layouts/RootLayout'

// ---- Lazy-loaded page chunks (Tải theo nhu cầu, code-splitting tự động) ----
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
const ShopOrdersPage = lazy(() => import('@/pages/ShopOrdersPage/ShopOrdersPage').then((m) => ({ default: m.ShopOrdersPage })))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'))
const BuyerOrdersPage = lazy(() => import('@/pages/BuyerOrdersPage'))
const MyVouchersPage = lazy(() => import('@/pages/MyVouchersPage/MyVouchersPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ShipperDashboard = lazy(() => import('@/pages/shipper/Dashboard'))

const DEFAULT_PRODUCT_ID = '701'
const DEFAULT_SHOP_ID = '101'

// ---- Storefront Route Adapters (Truyền state/handlers từ StorefrontLayout xuống pages) ----

export function HomeRoute() {
  const { onAdd, onInfo, cart } = useStorefront()
  return <Home onAdd={onAdd} onInfo={onInfo} cart={cart} />
}

export function FreshRoute() {
  const { query, setQuery, onAdd, onInfo, cart } = useStorefront()
  return <Fresh query={query} setQuery={setQuery} onAdd={onAdd} onInfo={onInfo} cart={cart} />
}

export function CombosRoute() {
  const { onAdd, onInfo } = useStorefront()
  return <Combos onAdd={onAdd} onInfo={onInfo} />
}

export function AiRoute() {
  const { onInfo } = useStorefront()
  return <AiPage onInfo={onInfo} />
}

export function StoriesRoute() {
  const { onAdd, onInfo } = useStorefront()
  return <FarmerStoriesPage onAdd={onAdd} onInfo={onInfo} />
}

export function PrivacyRoute() {
  const navigate = useNavigate()
  return <PrivacyPolicy onNavigateHome={() => navigate('/')} />
}

export function ProductRoute() {
  const { productId = DEFAULT_PRODUCT_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <ProductDetail productId={productId} onBack={() => navigate('/')} />
    </div>
  )
}

export function ShopRoute() {
  const { shopId = DEFAULT_SHOP_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <ShopPage shopId={shopId} onBack={() => navigate('/')} />
    </div>
  )
}

export function ShopVouchersRoute() {
  const { shopId = DEFAULT_SHOP_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <ShopVouchers shopId={shopId} onBack={() => navigate(`/cua-hang/${shopId}`)} />
    </div>
  )
}

export function MyVouchersRoute() {
  return (
    <RequireRole roles={['buyer', 'shop', 'admin']} audience="khách mua hàng">
      <div className="pt-6">
        <MyVouchersPage />
      </div>
    </RequireRole>
  )
}

export function AuthRoute({ mode }: { mode: 'login' | 'register' }) {
  const { pathname, search, state } = useLocation()
  const navigate = useNavigate()
  const initialRole =
    search.includes('role=shop') || search.includes('ban-nong-san')
      ? 'shop'
      : search.includes('role=shipper')
        ? 'shipper'
        : 'buyer'

  return (
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
  )
}

export function ForgotPasswordRoute() {
  return <ForgotPasswordPage />
}

export function OtpVerificationRoute() {
  return <OtpVerificationPage />
}

// ---- Portals với Role Guards ----

function usePortalProps() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  return {
    user,
    onNavigateStore: () => navigate('/'),
    onLogout: async () => {
      await authService.logout()
      logout()
      await navigate('/')
    },
  }
}

export function AdminRoute() {
  return (
    <RequireRole roles={['admin']} audience="tài khoản Admin" loginHref="/dang-nhap?role=admin">
      <AdminPortal {...usePortalProps()} />
    </RequireRole>
  )
}

export function SellerRoute() {
  return (
    <RequireRole roles={['shop']} audience="tài khoản Nhà vườn" loginHref="/dang-nhap?role=shop">
      <FarmerPortal {...usePortalProps()} />
    </RequireRole>
  )
}

export function ShopOrdersRoute() {
  return (
    <RequireRole roles={['shop']} audience="tài khoản Nhà vườn" loginHref="/dang-nhap?role=shop">
      <ShopOrdersPage />
    </RequireRole>
  )
}

export function CartRoute() {
  return <CartPage />
}

export function CheckoutRoute() {
  return <CheckoutPage />
}

export function PaymentResultRoute() {
  return <PaymentResultPage />
}

export function BuyerOrdersRoute() {
  return <BuyerOrdersPage />
}

export function ProfileRoute() {
  return (
    <RequireRole
      roles={['buyer', 'shop', 'shipper', 'admin']}
      audience="người dùng"
      loginHref="/dang-nhap"
    >
      <ProfilePage />
    </RequireRole>
  )
}

export function ShipperRoute() {
  return (
    <RequireRole
      roles={['shipper']}
      audience="tài khoản Tài xế (Shipper)"
      loginHref="/dang-nhap?role=shipper"
    >
      <ShipperDashboard {...usePortalProps()} />
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
  return isHomeSection(segment) ? <HomeRoute /> : <NotFoundPage />
}
