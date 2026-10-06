import { createHashRouter, Navigate } from 'react-router-dom'
import StorefrontLayout from '@/app/layouts/StorefrontLayout'
import {
  RootLayout,
  HomeRoute,
  FreshRoute,
  CombosRoute,
  AiRoute,
  StoriesRoute,
  PrivacyRoute,
  ProductRoute,
  ShopRoute,
  ShopVouchersRoute,
  AuthRoute,
  ForgotPasswordRoute,
  OtpVerificationRoute,
  AdminRoute,
  SellerRoute,
  SectionOrNotFound,
} from './routeAdapters'
import { DEFAULT_TITLE, type RouteHandle } from './routeMeta'

const title = (t: RouteHandle['title']): RouteHandle => ({ title: t })

/**
 * Cấu hình điều hướng ứng dụng CapNong (Application Router)
 * Tinh giản, phân lớp rõ ràng: Admin Portal, Farmer Portal và Khách mua (Storefront).
 */
export const router = createHashRouter([
  {
    element: <RootLayout />,
    children: [
      // 1. Phân hệ Quản trị (Admin Portal)
      {
        path: 'admin/*',
        element: <AdminRoute />,
        handle: title('Quản Trị Hệ Thống · CapNong Admin'),
      },

      // 2. Phân hệ Nhà vườn (Farmer / Seller Portal)
      {
        path: 'shop/*',
        element: <SellerRoute />,
        handle: title('Kênh Người Bán · Nhà Vườn CapNong'),
      },

      // 3. Phân hệ Cửa hàng cho khách mua (Storefront)
      {
        element: <StorefrontLayout />,
        children: [
          // Các trang mua sắm & nội dung chính
          { index: true, element: <HomeRoute />, handle: title(DEFAULT_TITLE) },
          { path: 'nong-san-tuoi/*', element: <FreshRoute />, handle: title('Nông sản tươi') },
          { path: 'combo-tui-mu/*', element: <CombosRoute />, handle: title('Combo & Túi mù') },
          { path: 'cong-nghe-ai/*', element: <AiRoute />, handle: title('Công nghệ AI Tiên phong') },
          { path: 'cau-chuyen-nong-dan/*', element: <StoriesRoute />, handle: title('Chuyện Nông Dân') },
          { path: 'bao-mat-thong-tin/*', element: <PrivacyRoute />, handle: title('Chính Sách Bảo Mật') },

          // Sản phẩm & Gian hàng
          { path: 'san-pham', element: <ProductRoute /> },
          { path: 'san-pham/:productId/*', element: <ProductRoute /> },
          { path: 'cua-hang', element: <ShopRoute /> },
          { path: 'cua-hang/:shopId/*', element: <ShopRoute /> },
          { path: 'cua-hang/:shopId/voucher', element: <ShopVouchersRoute /> },

          // Xác thực & Tài khoản
          { path: 'dang-nhap/*', element: <AuthRoute mode="login" />, handle: title('Đăng nhập') },
          { path: 'dang-ky/*', element: <AuthRoute mode="register" />, handle: title('Đăng ký') },
          { path: 'login/*', element: <Navigate replace to="/dang-nhap" /> },
          { path: 'register/*', element: <Navigate replace to="/dang-ky" /> },
          { path: 'quen-mat-khau/*', element: <ForgotPasswordRoute />, handle: title('Quên mật khẩu') },
          { path: 'forgot-password/*', element: <Navigate replace to="/quen-mat-khau" /> },
          { path: 'xac-thuc-otp/*', element: <OtpVerificationRoute />, handle: title('Xác thực OTP') },
          { path: 'verify-otp/*', element: <Navigate replace to="/xac-thuc-otp" /> },
          { path: 'otp-verification/*', element: <Navigate replace to="/xac-thuc-otp" /> },

          // Điều hướng phụ trợ (Aliases)
          { path: 'farmer/*', element: <Navigate replace to="/shop" /> },
          { path: 'seller/*', element: <Navigate replace to="/shop" /> },
          { path: 'stories/*', element: <Navigate replace to="/cau-chuyen-nong-dan" /> },
          { path: 'privacy/*', element: <Navigate replace to="/bao-mat-thong-tin" /> },

          // 404 Fallback
          { path: '*', element: <SectionOrNotFound /> },
        ],
      },
    ],
  },
])

export default router
