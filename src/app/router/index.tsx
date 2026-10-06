import {
  createHashRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import StorefrontLayout, { useStorefront } from '@/app/layouts/StorefrontLayout'
import AdminPortal from '@/pages/admin/AdminPortal'
import AiPage from '@/pages/AiPage'
import AuthPage from '@/pages/AuthPage'
import Combos from '@/pages/Combos'
import FarmerPortal from '@/pages/farmer/FarmerPortal'
import FarmerStoriesPage from '@/pages/FarmerStoriesPage'
import Fresh from '@/pages/Fresh'
import Home from '@/pages/Home'
import NotFoundPage from '@/pages/NotFoundPage'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import ProductDetail from '@/pages/product/ProductDetail'
import ShopPage from '@/pages/product/ShopPage'
import ShopVouchers from '@/pages/product/ShopVouchers'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage/ForgotPasswordPage'
import OtpVerificationPage from '@/pages/OtpVerificationPage/OtpVerificationPage'
import RequireRole from './RequireRole'
import { DEFAULT_TITLE, type RouteHandle } from './routeMeta'

// Id mặc định khi URL thiếu id (giữ hành vi của App.tsx cũ).
const DEFAULT_PRODUCT_ID = '701'
const DEFAULT_SHOP_ID = '101'

import type { AuthUser } from '@/types/auth.types'

/** Layout gốc: gom thẻ cuộn lên đầu trang khi đổi route */
function RootLayout() {
  return (
    <div className="min-h-screen bg-sand text-soil-800 antialiased font-sans">
      <Outlet />
    </div>
  )
}

/** Khớp các hash section trên trang chủ: #fresh, #combos, #farmer-story... */
const HOME_SECTION_IDS = [
  'fresh',
  'combos',
  'farmer-story',
  'ai-features',
  'categories',
  'today-rescue',
  'process',
  'reviews',
] as const

const isHomeSection = (segment?: string) =>
  (HOME_SECTION_IDS as readonly string[]).includes(segment ?? '')

/** Alias cũ -> URL chuẩn, giữ phần đường dẫn phía sau và query. VD /product/702 -> /san-pham/702 */
function Alias({ to }: { to: string }) {
  const { '*': rest } = useParams()
  const { search } = useLocation()
  return <Navigate replace to={`${to}${rest ? `/${rest}` : ''}${search}`} />
}

function ShopVouchersAlias() {
  const { shopId = DEFAULT_SHOP_ID } = useParams()
  return <Navigate replace to={`/cua-hang/${shopId}/voucher`} />
}

// ---- Trang storefront: lấy callback từ StorefrontLayout ----

function HomeRoute() {
  const { onAdd, onInfo, cart } = useStorefront()
  return <Home onAdd={onAdd} onInfo={onInfo} cart={cart} />
}

function FreshRoute() {
  const { query, setQuery, onAdd, onInfo, cart } = useStorefront()
  return <Fresh query={query} setQuery={setQuery} onAdd={onAdd} onInfo={onInfo} cart={cart} />
}

function CombosRoute() {
  const { onAdd, onInfo } = useStorefront()
  return <Combos onAdd={onAdd} onInfo={onInfo} />
}

function AiRoute() {
  const { onInfo } = useStorefront()
  return <AiPage onInfo={onInfo} />
}

function StoriesRoute() {
  const { onAdd, onInfo } = useStorefront()
  return <FarmerStoriesPage onAdd={onAdd} onInfo={onInfo} />
}

function PrivacyRoute() {
  const navigate = useNavigate()
  return <PrivacyPolicy onNavigateHome={() => navigate('/')} />
}

function ProductRoute() {
  const { productId = DEFAULT_PRODUCT_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <ProductDetail productId={productId} onBack={() => navigate('/')} />
    </div>
  )
}

function ShopRoute() {
  const { shopId = DEFAULT_SHOP_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <ShopPage shopId={shopId} onBack={() => navigate('/')} />
    </div>
  )
}

function ShopVouchersRoute() {
  const { shopId = DEFAULT_SHOP_ID } = useParams()
  const navigate = useNavigate()
  return (
    <div className="pt-6">
      <ShopVouchers shopId={shopId} onBack={() => navigate(`/cua-hang/${shopId}`)} />
    </div>
  )
}

function AuthRoute({ mode }: { mode: 'login' | 'register' }) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  // Mock auth handler from stores
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
        navigate(user.role === 'admin' ? '/admin' : user.role === 'shop' ? '/shop' : '/')
      }}
    />
  )
}

/** /:segment không khớp route nào: section của trang chủ thì mở trang chủ, còn lại là 404. */
function SectionOrNotFound() {
  const { '*': segment } = useParams()
  return isHomeSection(segment) ? <HomeRoute /> : <NotFoundPage />
}

// ---- Portal: toàn màn hình, không có Header/Footer của storefront ----

function usePortalProps() {
  const navigate = useNavigate()
  return {
    onNavigateStore: () => navigate('/'),
    onLogout: async () => {
      await navigate('/')
    },
  }
}

function AdminRoute() {
  return (
    <RequireRole roles={['admin']} audience="tài khoản Admin">
      <AdminPortal {...usePortalProps()} />
    </RequireRole>
  )
}

function SellerRoute() {
  return (
    <RequireRole roles={['shop']} audience="tài khoản Nhà vườn" loginHref="#/dang-nhap?role=shop">
      <FarmerPortal {...usePortalProps()} />
    </RequireRole>
  )
}

const title = (t: RouteHandle['title']): RouteHandle => ({ title: t })

export const router = createHashRouter([
  {
    element: <RootLayout />,
    children: [
      // Portal
      {
        path: 'admin/*',
        element: <AdminRoute />,
        handle: title('Trung Tâm Quản Trị Hệ Thống · CapNong Admin'),
      },
      { path: 'quan-tri/*', element: <Alias to="/admin" /> },
      { path: 'administrator/*', element: <Alias to="/admin" /> },
      {
        path: 'shop/*',
        element: <SellerRoute />,
        handle: title('Bảng Điều Khiển Nông Dân · Kênh Người Bán'),
      },
      { path: 'shop/:shopId/vouchers', element: <ShopVouchersAlias /> },
      { path: 'farmer/*', element: <Alias to="/shop" /> },
      { path: 'kenh-nguoi-ban/*', element: <Alias to="/shop" /> },
      { path: 'seller/*', element: <Alias to="/shop" /> },

      // Storefront
      {
        element: <StorefrontLayout />,
        children: [
          { index: true, element: <HomeRoute />, handle: title(DEFAULT_TITLE) },
          { path: 'nong-san-tuoi/*', element: <FreshRoute />, handle: title('Nông sản tươi') },
          { path: 'combo-tui-mu/*', element: <CombosRoute />, handle: title('Combo & Túi mù') },
          {
            path: 'cong-nghe-ai/*',
            element: <AiRoute />,
            handle: title('Công nghệ AI Tiên phong'),
          },
          {
            path: 'cau-chuyen-nong-dan/*',
            element: <StoriesRoute />,
            handle: title('Chuyện Nông Dân & Diễn Đàn'),
          },
          { path: 'stories/*', element: <Alias to="/cau-chuyen-nong-dan" /> },
          {
            path: 'bao-mat-thong-tin/*',
            element: <PrivacyRoute />,
            handle: title('Chính Sách Bảo Mật Thông Tin'),
          },
          { path: 'privacy/*', element: <Alias to="/bao-mat-thong-tin" /> },
          { path: 'chinh-sach-bao-mat/*', element: <Alias to="/bao-mat-thong-tin" /> },

          {
            path: 'san-pham',
            handle: title('Chi Tiết Nông Sản & Nhà Vườn'),
            children: [
              { index: true, element: <ProductRoute /> },
              { path: ':productId/*', element: <ProductRoute /> },
            ],
          },
          { path: 'product/*', element: <Alias to="/san-pham" /> },
          { path: 'chi-tiet-san-pham/*', element: <Alias to="/san-pham" /> },

          {
            path: 'cua-hang',
            handle: title('Gian Hàng Nông Dân'),
            children: [
              { index: true, element: <ShopRoute /> },
              { path: ':shopId/*', element: <ShopRoute /> },
              {
                path: ':shopId/voucher',
                element: <ShopVouchersRoute />,
                handle: title('Voucher & Ưu Đãi Gian Hàng'),
              },
            ],
          },
          { path: 'shop-detail/*', element: <Alias to="/cua-hang" /> },
          { path: 'shop-page/*', element: <Alias to="/cua-hang" /> },
          { path: 'shop-vouchers', element: <ShopVouchersAlias /> },
          { path: 'shop-vouchers/:shopId/*', element: <ShopVouchersAlias /> },
          { path: 'voucher-shop', element: <ShopVouchersAlias /> },
          { path: 'voucher-shop/:shopId/*', element: <ShopVouchersAlias /> },

          // Auth routes
          {
            path: 'dang-nhap/*',
            element: <AuthRoute mode="login" />,
            handle: title('Đăng nhập thành viên'),
          },
          {
            path: 'dang-ky/*',
            element: <AuthRoute mode="register" />,
            handle: title('Đăng ký tài khoản (Buyer, Shop, Shipper, Admin)'),
          },
          { path: 'login/*', element: <Alias to="/dang-nhap" /> },
          { path: 'register/*', element: <Alias to="/dang-ky" /> },
          {
            path: 'quen-mat-khau/*',
            element: <ForgotPasswordPage />,
            handle: title('Quên Mật Khẩu'),
          },
          { path: 'forgot-password/*', element: <Alias to="/quen-mat-khau" /> },
          {
            path: 'xac-thuc-otp/*',
            element: <OtpVerificationPage />,
            handle: title('Xác Thực Mã OTP'),
          },
          { path: 'verify-otp/*', element: <Alias to="/xac-thuc-otp" /> },
          { path: 'otp-verification/*', element: <Alias to="/xac-thuc-otp" /> },

          {
            path: '*',
            element: <SectionOrNotFound />,
            handle: title((params) =>
              isHomeSection(params['*']) ? DEFAULT_TITLE : 'Không tìm thấy trang',
            ),
          },
        ],
      },
    ],
  },
])

export default router
