import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LogIn, Shield, Home } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/StateViews'
import type { UserRole } from '@/types'
import { useAuth } from '@/stores'

type RequireRoleProps = {
  roles?: (UserRole | string)[]
  allowedRoles?: (UserRole | string)[]
  /** Mô tả ai được vào, hiện trên màn hình từ chối. */
  audience?: string
  /** Đường dẫn đăng nhập khi chưa có phiên (mặc định /dang-nhap) */
  loginHref?: string
  children: ReactNode
}

/**
 * Chặn route theo role ở UI (Role-based Access Control Guard).
 * Tách bạch rõ 2 trạng thái:
 * 1. 401 Unauthorized: Chưa đăng nhập -> Tự động chuyển sang trang đăng nhập (lưu location để redirect lại sau khi login).
 * 2. 403 Forbidden: Đã đăng nhập nhưng không đúng Role -> Hiển thị màn hình từ chối kèm nút về Trang chủ / Đổi tài khoản.
 */
export default function RequireRole({
  roles,
  allowedRoles,
  audience = 'người dùng hợp lệ',
  loginHref = '/dang-nhap',
  children,
}: RequireRoleProps) {
  const { user } = useAuth()
  const location = useLocation()

  const cleanLoginPath = loginHref.startsWith('#') ? loginHref.slice(1) : loginHref

  // 1. Chưa đăng nhập -> Tự động điều hướng đến trang Login
  if (!user) {
    return <Navigate to={cleanLoginPath} replace state={{ from: location }} />
  }

  // 2. Đã đăng nhập nhưng không đủ quyền (403 Forbidden)
  const targetRoles = (roles || allowedRoles || []).map((r) => r.toLowerCase())
  if (targetRoles.length > 0 && (!user.role || !targetRoles.includes(user.role.toLowerCase()))) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#fbf9f4] p-4">
        <EmptyState
          className="w-full max-w-md bg-white p-8 rounded-3xl border border-[#e5e2da] shadow-sm text-center"
          icon={<Shield size={36} className="text-[#c0392b] mx-auto" />}
          title="Không có quyền truy cập"
          description={`Khu vực này chỉ dành riêng cho ${audience}. Tài khoản hiện tại (${user.name} - ${user.role.toUpperCase()}) không đủ quyền.`}
          action={
            <div className="flex items-center justify-center gap-3 mt-4">
              <LinkButton href="/" leftIcon={<Home size={15} />}>
                Về trang chủ
              </LinkButton>
              <LinkButton
                href={cleanLoginPath}
                variant="secondary"
                leftIcon={<LogIn size={15} />}
              >
                Đổi tài khoản
              </LinkButton>
            </div>
          }
        />
      </main>
    )
  }

  return <>{children}</>
}
