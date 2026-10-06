import { useEffect } from 'react'
import { Outlet, useLocation, useMatches } from 'react-router-dom'
import { DEFAULT_TITLE, type RouteHandle } from '../router/routeMeta'

/** Route có section con cuộn tới bằng segment thứ 2, VD #/nong-san-tuoi/san-pham. */
const SECTIONED = ['/nong-san-tuoi', '/combo-tui-mu']

/** Đặt tiêu đề tab và cuộn tới anchor (hoặc lên đầu) mỗi khi đổi URL, cho mọi trang. */
export default function RootLayout() {
  const { pathname, search } = useLocation()
  const matches = useMatches()

  const match = [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.title)
  const handle = match?.handle as RouteHandle | undefined
  const title =
    typeof handle?.title === 'function'
      ? handle.title(match!.params)
      : (handle?.title ?? DEFAULT_TITLE)

  // Đặt lại ở mỗi lần đổi URL (trang chi tiết tự đổi tiêu đề sau khi tải dữ liệu),
  // nên pathname/search là dependency có chủ đích dù không dùng trong thân effect.
  useEffect(() => {
    document.title = `${title} · CapNong`
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [title, pathname, search])

  // Cuộn lại cả khi chỉ query đổi (VD đổi ?danh-muc=), giống App.tsx cũ.
  useEffect(() => {
    const anchor = SECTIONED.some((p) => pathname.startsWith(p))
      ? pathname.split('/')[2]
      : pathname.slice(1)
    const frame = requestAnimationFrame(() => {
      const target = anchor ? document.getElementById(anchor) : null
      if (target) target.scrollIntoView({ behavior: 'instant' })
      else window.scrollTo(0, 0)
    })
    return () => cancelAnimationFrame(frame)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [pathname, search])

  return <Outlet />
}
