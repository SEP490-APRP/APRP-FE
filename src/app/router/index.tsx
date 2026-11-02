import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '@/app/layouts/RootLayout'
import StorefrontLayout from '@/app/layouts/StorefrontLayout'
import {
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
  ChangePasswordRoute,
  OtpVerificationRoute,
  OAuthSuccessRoute,
  AdminRoute,
  SellerRoute,
  ShopOrdersRoute,
  ShipperRoute,
  CartRoute,
  CheckoutRoute,
  PaymentResultRoute,
  BuyerOrdersRoute,
  MyVouchersRoute,
  MealPlanRoute,
  ProfileRoute,
  BuyerMessagesRoute,
  SectionOrNotFound,
} from './routeAdapters'
import { DEFAULT_TITLE, type RouteHandle } from './routeMeta'

const title = (t: RouteHandle['title']): RouteHandle => ({ title: t })

/**
 * Cấu hình điều hướng ứng dụng CapNong (Application Router)
 * Tinh giản, phân lớp rõ ràng: Admin Portal, Farmer Portal, Shipper Portal và Khách mua (Storefront).
 */
export const router = createBrowserRouter([
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
        path: 'shop/orders',
        element: <ShopOrdersRoute />,
        handle: title('Quản lý đơn hàng · Kênh Nhà Vườn'),
      },
      {
        path: 'shop/*',
        element: <SellerRoute />,
        handle: title('Kênh Người Bán · Nhà Vườn CapNong'),
      },

      // 3. Phân hệ Giao hàng (Shipper Portal)
      {
        path: 'shipper/*',
        element: <ShipperRoute />,
        handle: title('Cổng Giao Hàng · Shipper CapNong'),
      },

      // 4. Phân hệ Cửa hàng cho khách mua (Storefront)
      {
        element: <StorefrontLayout />,
        children: [
          // Các trang mua sắm & nội dung chính
          { index: true, element: <HomeRoute />, handle: title(DEFAULT_TITLE) },
          { path: 'nong-san-tuoi/*', element: <FreshRoute />, handle: title('Nông sản tươi') },
          { path: 'combo-tui-mu/*', element: <CombosRoute />, handle: title('Combo & Túi mù') },
          { path: 'ke-hoach-an-uong/*', element: <MealPlanRoute />, handle: title('Kế Hoạch Ăn Uống · CapNong AI') },
          { path: 'meal-plan/*', element: <Navigate replace to="/ke-hoach-an-uong" /> },
          { path: 'meal-planner/*', element: <Navigate replace to="/ke-hoach-an-uong" /> },
          { path: 'cong-nghe-ai/*', element: <AiRoute />, handle: title('Công nghệ AI Tiên phong') },
          { path: 'cau-chuyen-nong-dan/*', element: <StoriesRoute />, handle: title('Chuyện Nông Dân') },
          { path: 'bao-mat-thong-tin/*', element: <PrivacyRoute />, handle: title('Chính Sách Bảo Mật') },

          // Sản phẩm & Gian hàng
          { path: 'san-pham', element: <Navigate replace to="/nong-san-tuoi" /> },
          { path: 'san-pham/:productId/*', element: <ProductRoute /> },
          { path: 'cua-hang', element: <ShopRoute /> },
          { path: 'cua-hang/:shopId/*', element: <ShopRoute /> },
          { path: 'cua-hang/:shopId/voucher', element: <ShopVouchersRoute /> },

          // Mua sắm & Đơn hàng (English routing)
          { path: 'cart/*', element: <CartRoute />, handle: title('Giỏ hàng · CapNong') },
          { path: 'checkout/*', element: <CheckoutRoute />, handle: title('Thanh toán đơn hàng · CapNong') },
          { path: 'payment/result/*', element: <PaymentResultRoute />, handle: title('Kết quả thanh toán · CapNong') },
          { path: 'payment/success/*', element: <Navigate replace to="/payment/result" /> },
          { path: 'payment/cancel/*', element: <Navigate replace to="/payment/result" /> },
          { path: 'orders/*', element: <BuyerOrdersRoute />, handle: title('Đơn hàng của tôi · CapNong') },
          { path: 'don-hang/*', element: <Navigate replace to="/orders" /> },
          { path: 'my-orders/*', element: <Navigate replace to="/orders" /> },
          { path: 'my-vouchers/*', element: <MyVouchersRoute />, handle: title('Kho Voucher Của Tôi · CapNong') },
          { path: 'kho-voucher/*', element: <Navigate replace to="/my-vouchers" /> },
          { path: 'voucher-cua-toi/*', element: <Navigate replace to="/my-vouchers" /> },
          { path: 'gio-hang/*', element: <Navigate replace to="/cart" /> },
          { path: 'thanh-toan/*', element: <Navigate replace to="/checkout" /> },

          // Tin nhắn & Trò chuyện (Chat trực tuyến với Nhà Vườn & Hỗ trợ)
          { path: 'tin-nhan/*', element: <BuyerMessagesRoute />, handle: title('Tin Nhắn & Trò Chuyện · CapNong') },
          { path: 'messages/*', element: <Navigate replace to="/tin-nhan" /> },
          { path: 'chat/*', element: <Navigate replace to="/tin-nhan" /> },

          // Xác thực & Tài khoản
          { path: 'tai-khoan/*', element: <ProfileRoute />, handle: title('Hồ Sơ Cá Nhân · CapNong') },
          { path: 'profile/*', element: <Navigate replace to="/tai-khoan" /> },
          { path: 'thong-bao/*', element: <Navigate replace to="/tai-khoan?tab=thong-bao" /> },
          { path: 'notifications/*', element: <Navigate replace to="/tai-khoan?tab=thong-bao" /> },
          { path: 'ho-so/*', element: <Navigate replace to="/tai-khoan" /> },
          { path: 'login/*', element: <AuthRoute mode="login" />, handle: title('Đăng nhập') },
          { path: 'dang-nhap/*', element: <AuthRoute mode="login" />, handle: title('Đăng nhập') },
          { path: 'register/*', element: <AuthRoute mode="register" />, handle: title('Đăng ký') },
          { path: 'dang-ky/*', element: <AuthRoute mode="register" />, handle: title('Đăng ký') },
          { path: 'forgot-password/*', element: <ForgotPasswordRoute />, handle: title('Quên mật khẩu') },
          { path: 'quen-mat-khau/*', element: <ForgotPasswordRoute />, handle: title('Quên mật khẩu') },
          { path: 'change-password/*', element: <ChangePasswordRoute />, handle: title('Đổi mật khẩu') },
          { path: 'doi-mat-khau/*', element: <ChangePasswordRoute />, handle: title('Đổi mật khẩu') },
          { path: 'otp-verification/*', element: <OtpVerificationRoute />, handle: title('Xác thực OTP') },
          { path: 'verify-otp/*', element: <OtpVerificationRoute />, handle: title('Xác thực OTP') },
          { path: 'xac-thuc-otp/*', element: <OtpVerificationRoute />, handle: title('Xác thực OTP') },
          { path: 'oauth-success/*', element: <OAuthSuccessRoute />, handle: title('Đăng nhập Google') },

          // Điều hướng phụ trợ (Aliases)
          { path: 'farmer/*', element: <Navigate replace to="/shop" /> },
          { path: 'seller/*', element: <Navigate replace to="/shop" /> },
          { path: 'driver/*', element: <Navigate replace to="/shipper" /> },
          { path: 'delivery/*', element: <Navigate replace to="/shipper" /> },
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
