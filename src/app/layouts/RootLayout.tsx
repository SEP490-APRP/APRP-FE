import { useEffect, Suspense } from 'react'
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { DEFAULT_TITLE, type RouteHandle } from '../router/routeMeta'

/** Route có section con cuộn tới bằng segment thứ 2, VD /nong-san-tuoi/san-pham. */
const SECTIONED = ['/nong-san-tuoi', '/combo-tui-mu']

import { CapNongLoading } from '@/components/ui/Loading'

/** Loading indicator khi chuyển trang / tải lazy chunk */
export function PageLoading() {
  return <CapNongLoading message="Đang tải nông sản tươi ngon..." />
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

  // 1. Tự động chuyển hướng mượt mà nếu người dùng truy cập link cũ có dấu # hoặc hash thay đổi
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash
        const cleanPath = hash.startsWith('#/')
          ? hash.slice(1)
          : hash.startsWith('#')
            ? hash.slice(1)
            : hash
        if (cleanPath.startsWith('/')) {
          navigate(cleanPath, { replace: true })
        }
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
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
