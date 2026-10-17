import { useEffect, Suspense } from 'react'
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { DEFAULT_TITLE, type RouteHandle } from '../router/routeMeta'

/** Route có section con cuộn tới bằng segment thứ 2, VD /nong-san-tuoi/san-pham. */
const SECTIONED = ['/nong-san-tuoi', '/combo-tui-mu']

/** Loading indicator khi chuyển trang / tải lazy chunk */
export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 p-8">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#e5e2da] border-t-[#326318]" />
      <span className="text-xs font-semibold text-[#5f6b57]">Đang tải dữ liệu...</span>
    </div>
  )
}

/**
 * RootLayout: Khung bọc tối cao cho toàn bộ ứng dụng
 * Đảm nhiệm:
 * 1. Chuyển hướng hash router cũ sang browser router chuẩn (VD: #/dang-nhap -> /dang-nhap)
 * 2. Tự động đổi document.title theo metadata của từng route
 * 3. Tự động cuộn trang (lên đầu hoặc cuộn mượt tới anchor section)
 * 4. Bọc Suspense toàn cục với PageLoading
 */
export default function RootLayout() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const matches = useMatches()

  // 1. Tự động chuyển hướng mượt mà nếu người dùng truy cập link cũ có dấu #
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.slice(1)
      navigate(cleanPath, { replace: true })
    }
  }, [navigate])

  // 2. Tìm kiếm title từ route match handle gần nhất
  const match = [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.title)
  const handle = match?.handle as RouteHandle | undefined
  const title =
    typeof handle?.title === 'function'
      ? handle.title(match!.params)
      : (handle?.title ?? DEFAULT_TITLE)

  useEffect(() => {
    const fullTitle = title.includes('CapNong') ? title : `${title} · CapNong`
    document.title = fullTitle
  }, [title, pathname, search])

  // 3. Tự động cuộn lại khi đổi route / query
  useEffect(() => {
    const anchor = SECTIONED.some((p) => pathname.startsWith(p))
      ? pathname.split('/')[2]
      : pathname.slice(1)

    const frame = requestAnimationFrame(() => {
      const target = anchor ? document.getElementById(anchor) : null
      if (target) {
        target.scrollIntoView({ behavior: 'instant' })
      } else {
        window.scrollTo(0, 0)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, search])

  return (
    <div className="min-h-screen bg-sand text-soil-800 antialiased font-sans">
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export { RootLayout }
