import type { ReactNode } from 'react'
import { LogIn, Shield } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/StateViews'
import type { UserRole } from '@/features/auth'
import { useAuth } from '@/stores'

type RequireRoleProps = {
  roles: UserRole[]
  /** Mô tả ai được vào, hiện trên màn hình từ chối. */
  audience: string
  loginHref?: string
  children: ReactNode
}

/**
 * Chặn route theo role ở UI (cùng giao diện màn chặn cũ của AdminPortal).
 * Server vẫn phải kiểm tra quyền ở từng API; đây chỉ là lớp hiển thị.
 */
export default function RequireRole({
  roles,
  audience,
  loginHref = '#/dang-nhap',
  children,
}: RequireRoleProps) {
  const { user } = useAuth()
  if (user && roles.includes(user.role)) return <>{children}</>

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper p-4">
      <EmptyState
        className="w-full max-w-md"
        icon={<Shield size={30} />}
        title="Bạn không có quyền truy cập"
        description={`Trang này chỉ dành cho ${audience}. Vui lòng đăng nhập bằng tài khoản phù hợp.`}
        action={
          <LinkButton href={loginHref} leftIcon={<LogIn size={16} aria-hidden />}>
            Đăng nhập
          </LinkButton>
        }
      />
    </main>
  )
}
