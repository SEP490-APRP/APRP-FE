import { lazy, Suspense } from 'react'
import {
  createHashRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import StorefrontLayout, { useStorefront } from '@/app/layouts/StorefrontLayout'
import RequireRole from './RequireRole'
import { DEFAULT_TITLE, type RouteHandle } from './routeMeta'
import type { AuthUser } from '@/types/auth.types'

// ---- Code Splitting: Lazy load các trang lớn & các trang phụ để tối ưu First Load Bundle ----
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

// Các portal nghiệp vụ nặng (Admin: 14 subpages, Farmer: 18 subpages) -> Chỉ tải khi vào portal
const AdminPortal = lazy(() => import('@/pages/admin/AdminPortal'))
const FarmerPortal = lazy(() => import('@/pages/farmer/FarmerPortal'))

// Id mặc định khi URL thiếu id (giữ hành vi của App.tsx cũ).
const DEFAULT_PRODUCT_ID = '701'
const DEFAULT_SHOP_ID = '101'

/** Loading fallback thanh thoát chuẩn thương hiệu CapNong */
function PageLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 p-8">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#e5e2da] border-t-[#326318]" />
      <span className="text-xs font-semibold text-[#5f6b57]">Đang tải dữ liệu...</span>
    </div>
  )
}

/** Layout gốc: bọc Suspense để hiển thị loading êm ái khi tải các chunk mã nguồn */
function RootLayout() {
  return (
    <div className="min-h-screen bg-sand text-soil-800 antialiased font-sans">
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
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
  return (
    <Suspense fallback={<PageLoading />}>
      <Home onAdd={onAdd} onInfo={onInfo} cart={cart} />
    </Suspense>
  )
}

function FreshRoute() {
  const { query, setQuery, onAdd, onInfo, cart } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <Fresh query={query} setQuery={setQuery} onAdd={onAdd} onInfo={onInfo} cart={cart} />
    </Suspense>
  )
}

function CombosRoute() {
  const { onAdd, onInfo } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <Combos onAdd={onAdd} onInfo={onInfo} />
    </Suspense>
  )
}

function AiRoute() {
  const { onInfo } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <AiPage onInfo={onInfo} />
    </Suspense>
  )
}

function StoriesRoute() {
  const { onAdd, onInfo } = useStorefront()
  return (
    <Suspense fallback={<PageLoading />}>
      <FarmerStoriesPage onAdd={onAdd} onInfo={onInfo} />
    </Suspense>
  )
}

function PrivacyRoute() {
  const navigate = useNavigate()
  return (
    <Suspense fallback={<PageLoading />}>
      <PrivacyPolicy onNavigateHome={() => navigate('/')} />
    </Suspense>
  )
}

function ProductRoute() {
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

function ShopRoute() {
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

function ShopVouchersRoute() {
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

function AuthRoute({ mode }: { mode: 'login' | 'register' }) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
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
          navigate(user.role === 'admin' ? '/admin' : user.role === 'shop' ? '/shop' : '/')
        }}
      />
    </Suspense>
  )
}

/** /:segment không khớp route nào: section của trang chủ thì mở trang chủ, còn lại là 404. */
function SectionOrNotFound() {
  const { '*': segment } = useParams()
  return isHomeSection(segment) ? (
    <HomeRoute />
  ) : (
    <Suspense fallback={<PageLoading />}>
      <NotFoundPage />
    </Suspense>
  )
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
    <RequireRole roles={['admin']} audience="tài khoản Admin" loginHref="/dang-nhap?role=admin">
      <Suspense fallback={<PageLoading />}>
        <AdminPortal {...usePortalProps()} />
      </Suspense>
    </RequireRole>
  )
}

function SellerRoute() {
  return (
    <RequireRole roles={['shop']} audience="tài khoản Nhà vườn" loginHref="/dang-nhap?role=shop">
      <Suspense fallback={<PageLoading />}>
        <FarmerPortal {...usePortalProps()} />
      </Suspense>
    </RequireRole>
  )
}

const title = (t: RouteHandle['title']): RouteHandle => ({ title: t })

export const router = createHashRouter([
  {
    element: <RootLayout />,
    children: [
      // Portal (Quản trị & Nhà vườn)
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

      // Storefront (Cửa hàng khách mua)
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
            element: (
              <Suspense fallback={<PageLoading />}>
                <ForgotPasswordPage />
              </Suspense>
            ),
            handle: title('Quên Mật Khẩu'),
          },
          { path: 'forgot-password/*', element: <Alias to="/quen-mat-khau" /> },
          {
            path: 'xac-thuc-otp/*',
            element: (
              <Suspense fallback={<PageLoading />}>
                <OtpVerificationPage />
              </Suspense>
            ),
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
