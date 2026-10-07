import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import {
  Banknote,
  BarChart3,
  Bell,
  ExternalLink,
  Gavel,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  PackageCheck,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserX,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AuthUser } from '@/features/auth'
import { Button, LinkButton } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/StateViews'
import { cn } from '@/utils'

/* ------------------------------------------------------------------ */
/* Tách code theo tab: người mua không phải tải ~250KB code admin       */
/* ------------------------------------------------------------------ */

const TABS = {
  overview: {
    name: 'Bảng tổng quan',
    icon: LayoutDashboard,
    page: lazy(() => import('./Dashboard')),
  },
  'user-report': {
    name: 'Báo cáo người dùng',
    icon: BarChart3,
    page: lazy(() => import('./UserReport')),
  },
  kyc: {
    name: 'Duyệt hồ sơ KYC',
    icon: ShieldCheck,
    page: lazy(() => import('./KYCApproval')),
    badge: 'Mới',
  },
  products: {
    name: 'Duyệt nông sản',
    icon: PackageCheck,
    page: lazy(() => import('./ProductApproval')),
  },
  disputes: { name: 'Khiếu nại & Hoàn tiền', icon: Gavel, page: lazy(() => import('./Disputes')) },
  shops: { name: 'Giám sát Shop', icon: Store, page: lazy(() => import('./ShopMonitoring')) },
  shippers: {
    name: 'Quản lý Shipper',
    icon: Truck,
    page: lazy(() => import('./ShipperManagement')),
  },
  'bad-buyers': {
    name: 'Cảnh báo người mua',
    icon: UserX,
    page: lazy(() => import('./BadBuyers')),
  },
  cod: {
    name: 'Đối soát COD Shipper',
    icon: Banknote,
    page: lazy(() => import('./CodSettlement')),
  },
  wallet: { name: 'Ví sàn & Rút tiền', icon: Wallet, page: lazy(() => import('./AdminWallet')) },
  news: { name: 'Quản lý tin tức', icon: Newspaper, page: lazy(() => import('./NewsManagement')) },
  notifications: {
    name: 'Gửi thông báo',
    icon: Bell,
    page: lazy(() => import('./NotificationManagement')),
  },
  messages: {
    name: 'Tin nhắn hỗ trợ',
    icon: MessageSquare,
    page: lazy(() => import('./Messages')),
  },
} satisfies Record<
  string,
  { name: string; icon: LucideIcon; page: LazyExoticComponent<ComponentType>; badge?: string }
>

export type AdminTabId = keyof typeof TABS

const SECTIONS: { title: string; items: AdminTabId[] }[] = [
  { title: 'Tổng quan & Báo cáo', items: ['overview', 'user-report'] },
  { title: 'Kiểm duyệt', items: ['kyc', 'products', 'disputes'] },
  { title: 'Thành viên', items: ['shops', 'shippers', 'bad-buyers'] },
  { title: 'Tài chính & Đối soát', items: ['cod', 'wallet'] },
  { title: 'Truyền thông & CSKH', items: ['news', 'notifications', 'messages'] },
]

const isTabId = (value: string): value is AdminTabId => value in TABS

/** Đọc tab từ URL (#/admin/products) để F5 hoặc chia sẻ link vẫn giữ đúng trang. */
function tabFromHash(): AdminTabId {
  const segment = location.hash.split('/')[2] ?? ''
  return isTabId(segment) ? segment : 'overview'
}

type AdminPortalProps = {
  user?: AuthUser | null
  onLogout?: () => void
  onNavigateStore?: () => void
  /** Giữ để tương thích với App.tsx; hiện chưa dùng trong portal. */
  onInfo?: (message: string) => void
}

export default function AdminPortal({ user, onLogout, onNavigateStore }: AdminPortalProps) {
  const [tab, setTab] = useState<AdminTabId>(tabFromHash)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const sync = () => setTab(tabFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  // Chặn ở UI. Server vẫn phải kiểm tra quyền ở từng API, đây chỉ là lớp hiển thị.
  if (!user || user.role !== 'admin') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-paper p-4">
        <EmptyState
          className="w-full max-w-md"
          icon={<Shield size={30} />}
          title="Bạn không có quyền truy cập"
          description="Trang quản trị chỉ dành cho tài khoản Admin. Vui lòng đăng nhập bằng tài khoản phù hợp."
          action={
            <LinkButton href="#/dang-nhap" leftIcon={<LogIn size={16} aria-hidden />}>
              Đăng nhập
            </LinkButton>
          }
        />
      </main>
    )
  }

  const current = TABS[tab]
  const Page = current.page

  const navigate = (id: AdminTabId) => {
    location.hash = `/admin/${id}`
    setNavOpen(false)
  }

  const nav = (
    <nav aria-label="Menu quản trị" className="flex flex-col gap-6">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-caption font-bold uppercase tracking-wider text-ink-subtle">
            {section.title}
          </p>
          <ul className="flex flex-col gap-1">
            {section.items.map((id) => {
              const item: (typeof TABS)[AdminTabId] = TABS[id]
              const Icon = item.icon
              const active = id === tab
              return (
                <li key={id}>
                  <a
                    href={`#/admin/${id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(id)
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-600',
                      active
                        ? 'bg-leaf-700 text-white'
                        : 'text-ink-muted hover:bg-leaf-50 hover:text-ink',
                    )}
                  >
                    <Icon size={18} className="shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{item.name}</span>
                    {'badge' in item && item.badge && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-caption font-bold',
                          active ? 'bg-white/20' : 'bg-leaf-100 text-leaf-800',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  const initials = user.name
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex h-dvh bg-paper text-ink">
      {/* Sidebar cố định chỉ từ lg; dưới lg là Drawer để nội dung có đủ bề ngang */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-line p-5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf-700 text-white"
            aria-hidden
          >
            <Shield size={20} />
          </span>
          <div>
            <p className="text-base font-black uppercase leading-none">CapNong</p>
            <p className="mt-1 text-caption font-bold uppercase tracking-wider text-leaf-700">
              Trung tâm quản trị
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{nav}</div>
        <div className="flex items-center gap-3 border-t border-line p-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-800 text-caption font-bold text-white"
            aria-hidden
          >
            {initials || 'AD'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="text-caption text-ink-muted">Quản trị viên</p>
          </div>
          {onLogout && (
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Đăng xuất">
              <LogOut size={18} aria-hidden />
            </Button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Mở menu quản trị"
            aria-expanded={navOpen}
          >
            <Menu size={20} aria-hidden />
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-base font-extrabold sm:text-lg">
            {current.name}
          </h1>
          <LinkButton
            href="#/shop"
            variant="secondary"
            size="sm"
            className="hidden md:inline-flex"
            leftIcon={<Store size={15} aria-hidden />}
          >
            Kênh người bán
          </LinkButton>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (onNavigateStore ? onNavigateStore() : (location.hash = '/'))}
            leftIcon={<ShoppingBag size={15} aria-hidden />}
          >
            <span className="hidden sm:inline">Xem cửa hàng</span>
            <ExternalLink size={13} className="hidden opacity-60 sm:block" aria-hidden />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {/* key={tab}: mỗi tab mount mới, không giữ state lỗi của tab trước */}
          <Suspense key={tab} fallback={<AdminPageSkeleton />}>
            <Page />
          </Suspense>
        </main>
      </div>

      <Drawer open={navOpen} side="left" title="Menu quản trị" onClose={() => setNavOpen(false)}>
        {nav}
      </Drawer>
    </div>
  )
}

function AdminPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8" role="status" aria-label="Đang tải trang">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <div className="rounded-card border border-line bg-white">
        <TableSkeleton />
      </div>
    </div>
  )
}
