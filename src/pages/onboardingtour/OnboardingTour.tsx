import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, X, Sparkles, BookOpen } from 'lucide-react'

interface DetailStep {
  label: string
  description: string
  targetId?: string
  /** Chỉ highlight phần tử con đầu tiên trong tbody */
  firstChildOnly?: boolean
  /** Giới hạn highlight chỉ lấy phần header (60px đầu) của container lớn */
  headerOnly?: boolean
  /** false = bao hết toàn bộ element, không giới hạn chiều cao */
  clampHeight?: boolean
  /** Thêm padding extra (px) vào 4 cạnh highlight */
  extraPad?: number
}

interface SidebarStep {
  sidebarItemId: string
  routePath: string
  title: string
  description: string
  details: DetailStep[]
}

const TOUR_STEPS: SidebarStep[] = [
  {
    sidebarItemId: 'sidebar-item-overview',
    routePath: 'overview',
    title: '📊 Tổng quan',
    description:
      'Đây là trang chủ của bạn. Xem doanh thu, đơn hàng mới và các thống kê quan trọng tại đây.',
    details: [
      {
        label: '📈 Thẻ thống kê',
        description:
          'Các ô số liệu ở đầu trang cho bạn thấy tổng đơn hàng, sản phẩm đang bán, hộp mù và điểm chất lượng shop. Nhìn vào đây mỗi sáng để nắm tình hình nhanh nhất!',
        targetId: 'tour-overview-stats',
      },
      {
        label: '📦 Bảng sản phẩm',
        description:
          'Phần giữa trang liệt kê nhanh các sản phẩm và hộp mù của bạn. Bấm vào tab "Nông Sản" hoặc "Hộp Mù" để chuyển loại xem.',
        targetId: 'tour-overview-products',
      },
      {
        label: '🛒 Đơn hàng gần đây',
        description:
          'Cột bên phải hiển thị 5 đơn hàng mới nhất. Bấm "Xem Tất Cả Đơn Hàng" để vào trang quản lý đơn hàng đầy đủ.',
        targetId: 'tour-overview-orders',
      },
      {
        label: '💳 Chi tiết tài chính',
        description:
          'Theo dõi 3 chỉ số quan trọng: Số dư khả dụng (sẵn sàng rút), Đang chờ quyết toán (đơn đang giao) và Doanh thu tháng. Bấm "Xem ví tiền ›" để tạo yêu cầu rút tiền về ngân hàng.',
        targetId: 'tour-overview-finance-cards',
        clampHeight: false,
        extraPad: 6,
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-revenue-report',
    routePath: 'revenue-report',
    title: '📈 Báo cáo doanh thu',
    description:
      'Theo dõi chi tiết dòng tiền, số lượng nông sản đã giải cứu và hiệu quả kinh doanh của nhà vườn theo từng chu kỳ.',
    details: [
      {
        label: '📅 Bộ lọc thời gian',
        description:
          'Chuyển đổi linh hoạt giữa các mốc: "Tuần Này", "Tháng Này" hoặc "6 Tháng" để xem xu hướng tăng trưởng doanh thu theo thời gian.',
        targetId: 'tour-revenue-filter',
        extraPad: 4,
      },
      {
        label: '📊 Chỉ số hiệu quả kinh doanh',
        description:
          'Bốn thẻ số liệu đo lường trọng yếu: Tổng doanh thu, Số đơn hoàn thành, Điểm đánh giá shop và Khối lượng nông sản đã được giải cứu thành công.',
        targetId: 'tour-revenue-stats',
        extraPad: 6,
      },
      {
        label: '📈 Biểu đồ doanh số theo ngày',
        description:
          'Trực quan hóa doanh số thu được theo từng ngày trong tuần. Rê chuột vào từng cột để xem chi tiết số tiền bán được trong ngày đó.',
        targetId: 'tour-revenue-chart',
        extraPad: 6,
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-products',
    routePath: 'products',
    title: '🌿 Sản phẩm',
    description:
      'Quản lý toàn bộ nông sản thu hoạch, đăng bán sản phẩm mới và tạo các túi mù giải cứu.',
    details: [
      {
        label: '🎁 Tạo Túi Mù Blind Box',
        description:
          'Bấm nút này để đóng gói các loại nông sản giải cứu thành các túi mù với giá ưu đãi. Đây là tính năng đặc biệt giúp tiêu thụ nhanh nông sản thu hoạch!',
        targetId: 'tour-products-blindbox-btn',
        extraPad: 4,
      },
      {
        label: '➕ Đăng bán nông sản mới',
        description:
          'Bấm nút xanh này để đăng bán từng loại nông sản riêng lẻ. Điền thông tin giá, sản lượng và chứng nhận để quản trị viên duyệt nhanh nhất.',
        targetId: 'tour-products-add-btn',
        extraPad: 4,
      },
      {
        label: '🗂️ Tab Nông Sản / Hộp Mù',
        description:
          'Bấm vào 2 tab ở đầu trang để chuyển giữa danh sách nông sản và hộp mù. Mỗi tab có bộ lọc riêng phù hợp.',
        targetId: 'tour-products-tabs',
      },
      {
        label: '🔍 Tìm kiếm & Lọc',
        description:
          'Dùng ô tìm kiếm để tìm theo tên hoặc ID. Dùng bộ lọc danh mục và trạng thái để thu hẹp kết quả. Có thể lọc "Chờ duyệt" để xem sản phẩm đang chờ Admin phê duyệt.',
        targetId: 'tour-products-filter-bar',
      },
      {
        label: '✏️ Thao tác sản phẩm',
        description:
          'Mỗi dòng có 3 nút: ✏️ Chỉnh sửa thông tin, 👁️ Ẩn/Hiện sản phẩm, 🗑️ Xóa. Lưu ý: sản phẩm mới đăng sẽ ở trạng thái "Chờ duyệt" cho đến khi Admin phê duyệt.',
        targetId: 'tour-products-action-btns',
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-orders',
    routePath: 'orders',
    title: '🛒 Đơn hàng',
    description:
      'Xem và xử lý các đơn hàng từ khách mua. Nhớ xác nhận đơn hàng sớm để khách không phải chờ lâu nhé!',
    details: [
      {
        label: '📋 Tab trạng thái đơn hàng',
        description:
          'Các tab ở đầu giúp lọc đơn theo trạng thái: Chờ xác nhận, Đang chuẩn bị, Đang giao, Đã giao, Đã hủy. Số trong ngoặc là số đơn đang ở trạng thái đó.',
        targetId: 'tour-orders-tabs',
      },
      {
        label: '✅ Xác nhận & xử lý đơn',
        description:
          'Khi có đơn mới (màu vàng "Chờ xác nhận"), bấm nút "Chuẩn bị hàng" để xác nhận và bắt đầu đóng gói. Sau khi đóng gói xong, shipper sẽ đến lấy hàng.',
        targetId: 'tour-orders-first-card',
        clampHeight: false,
      },
      {
        label: '📞 Liên hệ khách hàng',
        description:
          'Trong mỗi đơn hàng có nút "Liên hệ KH" để nhắn tin với khách. Bấm "Hủy đơn" nếu không thể giao và nhập lý do rõ ràng để khách hiểu.',
        targetId: 'tour-orders-contact-btns',
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-reviews',
    routePath: 'reviews',
    title: '⭐ Đánh giá',
    description:
      'Xem phản hồi của khách hàng về sản phẩm của bạn. Đánh giá tốt giúp cửa hàng bán được nhiều hơn.',
    details: [
      {
        label: '📊 Thống kê đánh giá',
        description:
          'Thẻ lớn bên trái hiển thị điểm trung bình của cửa hàng. Hai thẻ bên phải cho thấy tổng lượt đánh giá và số đánh giá chưa được phản hồi.',
        targetId: 'tour-reviews-stats',
        extraPad: 8,
      },
      {
        label: '💬 Danh sách đánh giá',
        description:
          'Tất cả đánh giá từ khách hàng được hiển thị ở đây. Bấm "Phản hồi" để trả lời từng đánh giá. Phản hồi nhanh và lịch sự giúp tăng uy tín cửa hàng rất nhiều!',
        targetId: 'tour-reviews-first-card',
        clampHeight: false,
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-notifications',
    routePath: 'notifications',
    title: '🔔 Thông báo',
    description:
      'Nhận thông báo về đơn hàng mới, thanh toán và các cập nhật quan trọng từ hệ thống.',
    details: [
      {
        label: '📬 Danh sách thông báo',
        description:
          'Tất cả thông báo từ hệ thống hiển thị ở đây. Thông báo chưa đọc sẽ được đánh dấu nổi bật. Bấm "Đánh dấu tất cả đã đọc" ở góc trên phải để xóa hết dấu chưa đọc.',
        targetId: 'tour-notifications-list',
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-messages',
    routePath: 'messages',
    title: '💬 Tin nhắn',
    description:
      'Trò chuyện trực tiếp với khách hàng. Trả lời nhanh giúp tăng tỷ lệ chốt đơn hàng.',
    details: [
      {
        label: '📋 Danh sách hội thoại',
        description:
          'Bên trái là danh sách các cuộc trò chuyện với khách hàng. Số đỏ bên cạnh tên là tin nhắn chưa đọc. Bấm vào tên khách để mở hội thoại.',
        targetId: 'tour-messages-search',
      },
      {
        label: '💬 Chọn cuộc trò chuyện',
        description:
          'Bấm vào một cuộc trò chuyện để mở khung chat bên phải. Gõ tin nhắn vào ô bên dưới và bấm gửi. Trả lời nhanh giúp khách hàng tin tưởng hơn!',
        targetId: 'tour-messages-first-conv',
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-wallet',
    routePath: 'wallet',
    title: '💰 Ví tiền',
    description:
      'Xem số dư và lịch sử giao dịch. Bạn có thể rút tiền về tài khoản ngân hàng tại đây.',
    details: [
      {
        label: '💵 Tổng doanh thu & Đã rút',
        description:
          'Hai thẻ đầu trang hiển thị tổng doanh thu từ trước đến nay và tổng số tiền đã rút thành công. Số dư khả dụng là phần bạn có thể rút ngay.',
        targetId: 'tour-wallet-cards',
        extraPad: 8,
      },
      {
        label: '🏦 Yêu cầu rút tiền',
        description:
          'Bấm nút "Yêu cầu rút tiền" góc trên phải, điền số tiền muốn rút và thông tin tài khoản ngân hàng rồi xác nhận. Tiền sẽ về trong 1-2 ngày làm việc.',
        targetId: 'tour-wallet-withdraw-btn',
      },
      {
        label: '📜 Lịch sử giao dịch',
        description:
          'Bảng bên dưới liệt kê tất cả các lần rút tiền, trạng thái xử lý và ngày thực hiện. Trạng thái "Đang xử lý" nghĩa là Admin đang duyệt yêu cầu của bạn.',
        targetId: 'tour-wallet-history',
      },
      {
        label: '🚪 Nút đăng xuất',
        description:
          'Nút đỏ nhỏ ở góc dưới sidebar là nút Đăng xuất. Bấm vào đây khi bạn muốn thoát khỏi tài khoản. Nhớ đăng xuất khi dùng máy tính chung để bảo mật tài khoản nhé!',
        targetId: 'tour-sidebar-logout',
      },
    ],
  },
  {
    sidebarItemId: 'sidebar-item-profile',
    routePath: 'profile',
    title: '👤 Hồ sơ cá nhân',
    description:
      'Bấm vào thẻ tài khoản/tên cửa hàng ở góc dưới cùng thanh điều hướng (cạnh nút đăng xuất) để xem và cập nhật hồ sơ, logo đại diện cùng địa chỉ liên hệ của bạn.',
    details: [
      {
        label: '📈 Thống kê cửa hàng',
        description:
          'Bốn thẻ số liệu cho thấy tổng sản phẩm, đơn hàng, doanh thu và điểm đánh giá của cửa hàng bạn. Đây là bức tranh tổng quan về hiệu quả kinh doanh.',
        targetId: 'tour-profile-stats',
      },
      {
        label: '📝 Thông tin & Ảnh đại diện',
        description:
          'Điền đầy đủ tên cửa hàng, số điện thoại, địa chỉ và mô tả. Bấm vào ảnh đại diện để tải ảnh logo lên. Thông tin đầy đủ giúp khách hàng tin tưởng hơn!',
        targetId: 'tour-profile-form',
      },
    ],
  },
]

const STORAGE_KEY = 'farmer_onboarding_done'
const TOOLTIP_W = 300
const TOOLTIP_H = 280
const GAP = 14

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function getRect(
  id: string,
  firstChildOnly = false,
  headerOnly = false,
  clampHeight = false,
  extraPad = 0,
): Rect | null {
  const el = document.getElementById(id)
  if (!el) return null

  if (headerOnly) {
    const r = el.getBoundingClientRect()
    const h = Math.min(64, r.height)
    const p = 6 + extraPad
    return { top: r.top - p, left: r.left - p, width: r.width + p * 2, height: h + p * 2 }
  }

  if (firstChildOnly) {
    const firstRow = el.querySelector(
      'tbody tr:first-child, .space-y-4 > div:first-child, .space-y-6 > div:first-child',
    ) as HTMLElement | null
    const target = firstRow || el
    const r = target.getBoundingClientRect()
    if (r.top < 0 || r.bottom > window.innerHeight) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const p = 6 + extraPad
    return { top: r.top - p, left: r.left - p, width: r.width + p * 2, height: r.height + p * 2 }
  }

  const r = el.getBoundingClientRect()
  const p = 6 + extraPad
  // Mặc định clampHeight=false → highlight bao trọn vẹn 100% element (full), không cắt ngắn 160px
  const h = clampHeight ? Math.min(r.height + p * 2, 160) : r.height + p * 2
  return { top: r.top - p, left: r.left - p, width: r.width + p * 2, height: h }
}

function calcTooltipPos(rect: Rect): React.CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const centerY = rect.top + rect.height / 2

  // 1. Phía bên phải của element (nếu đủ chỗ)
  if (rect.left + rect.width + GAP + TOOLTIP_W <= vw - 12) {
    const top = Math.min(Math.max(centerY - TOOLTIP_H / 2, 12), vh - TOOLTIP_H - 12)
    return { top, left: rect.left + rect.width + GAP }
  }
  // 2. Phía bên trái của element (nếu đủ chỗ)
  if (rect.left - GAP - TOOLTIP_W >= 12) {
    const top = Math.min(Math.max(centerY - TOOLTIP_H / 2, 12), vh - TOOLTIP_H - 12)
    return { top, left: rect.left - GAP - TOOLTIP_W }
  }
  // 3. Phía bên dưới của element
  const centerX = rect.left + rect.width / 2
  const left = Math.min(Math.max(centerX - TOOLTIP_W / 2, 12), vw - TOOLTIP_W - 12)
  if (rect.top + rect.height + GAP + TOOLTIP_H <= vh - 12) {
    return { top: rect.top + rect.height + GAP, left }
  }
  // 4. Phía bên trên của element
  if (rect.top - GAP - TOOLTIP_H >= 12) {
    return { top: rect.top - GAP - TOOLTIP_H, left }
  }
  // 5. Nếu cả 4 hướng đều chật (element rất to), chọn phía trên hoặc dưới có nhiều không gian hơn
  const spaceAbove = rect.top
  const spaceBelow = vh - (rect.top + rect.height)
  if (spaceAbove >= spaceBelow && spaceAbove >= 80) {
    return { top: Math.max(12, rect.top - GAP - TOOLTIP_H), left }
  }
  if (spaceBelow >= 80) {
    return { top: Math.min(vh - TOOLTIP_H - 12, rect.top + rect.height + GAP), left }
  }
  return { top: Math.max(16, vh - TOOLTIP_H - 24), left: Math.max(16, vw - TOOLTIP_W - 24) }
}

function waitForElement(id: string, maxMs = 1500): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const el = document.getElementById(id)
    if (el) {
      resolve(el)
      return
    }
    const start = Date.now()
    const check = () => {
      const found = document.getElementById(id)
      if (found) {
        resolve(found)
        return
      }
      if (Date.now() - start > maxMs) {
        resolve(null)
        return
      }
      requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

async function scrollAndGetRect(
  id: string,
  firstChildOnly = false,
  headerOnly = false,
  clampHeight = false,
  extraPad = 0,
): Promise<Rect | null> {
  const el = await waitForElement(id)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const fitsInView = rect.height <= window.innerHeight * 0.75
  el.scrollIntoView({
    behavior: 'smooth',
    block: headerOnly ? 'start' : fitsInView ? 'center' : 'start',
  })
  await new Promise((r) => setTimeout(r, 380))
  return getRect(id, firstChildOnly, headerOnly, clampHeight, extraPad)
}

type Phase = 'sidebar' | 'detail'
interface Props {
  onNavigate: (path: string) => void
  isOpen?: boolean
  onClose?: () => void
}

const OnboardingTour: React.FC<Props> = ({ onNavigate, isOpen, onClose }) => {
  const [visible, setVisible] = useState(false)
  const [sidebarIdx, setSidebarIdx] = useState(0)
  const [detailIdx, setDetailIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('sidebar')
  const [highlight, setHighlight] = useState<Rect | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [opacity, setOpacity] = useState(1)

  const sIdx = useRef(0)
  const dIdx = useRef(0)
  const phaseRef = useRef<Phase>('sidebar')
  sIdx.current = sidebarIdx
  dIdx.current = detailIdx
  phaseRef.current = phase

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
    onClose?.()
  }, [onClose])

  const applyRect = useCallback((rect: Rect | null) => {
    if (!rect) {
      setHighlight(null)
      setTooltipStyle({
        top: window.innerHeight / 2 - TOOLTIP_H / 2,
        left: window.innerWidth / 2 - TOOLTIP_W / 2,
      })
    } else {
      setHighlight(rect)
      setTooltipStyle(calcTooltipPos(rect))
    }
  }, [])

  const withFade = useCallback((fn: () => Promise<void> | void) => {
    setOpacity(0)
    setTimeout(async () => {
      await fn()
      setOpacity(1)
    }, 180)
  }, [])

  const focusSidebar = useCallback(
    async (idx: number) => {
      const rect = await scrollAndGetRect(TOUR_STEPS[idx].sidebarItemId)
      applyRect(rect)
    },
    [applyRect],
  )

  const navigateAndFocus = useCallback(
    async (
      path: string,
      targetId?: string,
      firstChildOnly = false,
      headerOnly = false,
      clampHeight = false,
      extraPad = 0,
    ) => {
      onNavigate(path)
      if (targetId) {
        const rect = await scrollAndGetRect(
          targetId,
          firstChildOnly,
          headerOnly,
          clampHeight,
          extraPad,
        )
        applyRect(rect)
      } else {
        await new Promise((r) => setTimeout(r, 450))
        applyRect(null)
      }
    },
    [onNavigate, applyRect],
  )

  useEffect(() => {
    if (isOpen === true) {
      setVisible(true)
      setSidebarIdx(0)
      setDetailIdx(0)
      setPhase('sidebar')
      const t = setTimeout(() => {
        focusSidebar(0)
      }, 300)
      return () => clearTimeout(t)
    } else if (isOpen === false) {
      setVisible(false)
    } else {
      if (localStorage.getItem(STORAGE_KEY)) return
      const t = setTimeout(() => {
        setVisible(true)
        focusSidebar(0)
      }, 700)
      return () => clearTimeout(t)
    }
  }, [isOpen, focusSidebar])

  useEffect(() => {
    if (!visible) return
    const handleResize = () => {
      if (phaseRef.current === 'sidebar') {
        const rect = getRect(TOUR_STEPS[sIdx.current].sidebarItemId)
        applyRect(rect)
      } else {
        const d = TOUR_STEPS[sIdx.current].details[dIdx.current]
        if (d?.targetId) {
          const rect = getRect(
            d.targetId,
            d.firstChildOnly,
            d.headerOnly,
            d.clampHeight ?? false,
            d.extraPad,
          )
          applyRect(rect)
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [visible, applyRect])

  const handleSidebarNext = useCallback(() => {
    const cur = sIdx.current
    if (cur >= TOUR_STEPS.length - 1) {
      dismiss()
      return
    }
    withFade(async () => {
      const next = cur + 1
      setSidebarIdx(next)
      setPhase('sidebar')
      await navigateAndFocus(TOUR_STEPS[next].routePath)
      await focusSidebar(next)
    })
  }, [dismiss, withFade, navigateAndFocus, focusSidebar])

  const handleSidebarDetail = useCallback(() => {
    const cur = sIdx.current
    const step = TOUR_STEPS[cur]
    const d = step.details[0]
    withFade(async () => {
      setDetailIdx(0)
      setPhase('detail')
      await navigateAndFocus(
        step.routePath,
        d?.targetId,
        d?.firstChildOnly,
        d?.headerOnly,
        d?.clampHeight,
        d?.extraPad,
      )
    })
  }, [withFade, navigateAndFocus])

  const handleDetailNext = useCallback(() => {
    const si = sIdx.current
    const di = dIdx.current
    const maxD = TOUR_STEPS[si].details.length - 1
    if (di < maxD) {
      withFade(async () => {
        const next = di + 1
        setDetailIdx(next)
        const d = TOUR_STEPS[si].details[next]
        if (d.targetId) {
          const rect = await scrollAndGetRect(
            d.targetId,
            d.firstChildOnly,
            d.headerOnly,
            d.clampHeight,
            d.extraPad,
          )
          applyRect(rect)
        } else {
          applyRect(null)
        }
      })
    } else {
      handleDetailSkip()
    }
  }, [withFade, applyRect]) // eslint-disable-line

  const handleDetailSkip = useCallback(() => {
    const cur = sIdx.current
    if (cur >= TOUR_STEPS.length - 1) {
      dismiss()
      return
    }
    withFade(async () => {
      const next = cur + 1
      setSidebarIdx(next)
      setDetailIdx(0)
      setPhase('sidebar')
      await navigateAndFocus(TOUR_STEPS[next].routePath)
      await focusSidebar(next)
    })
  }, [dismiss, withFade, navigateAndFocus, focusSidebar])

  if (!visible) return null

  const currentSidebar = TOUR_STEPS[sidebarIdx]
  const currentDetail = currentSidebar.details[detailIdx]
  const isLastSidebar = sidebarIdx === TOUR_STEPS.length - 1
  const isLastDetail = detailIdx === currentSidebar.details.length - 1

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlight && (
                <rect
                  x={highlight.left}
                  y={highlight.top}
                  width={highlight.width}
                  height={highlight.height}
                  rx="16"
                  fill="black"
                  style={{ transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)' }}
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#tour-mask)" />
        </svg>
      </div>

      {/* Highlight border */}
      {highlight && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-[16px] border-2 border-primary"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
            animation: 'tour-pulse 1.8s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] pointer-events-auto"
        style={{
          ...tooltipStyle,
          width: TOOLTIP_W,
          transition:
            'top 0.28s cubic-bezier(0.4,0,0.2,1), left 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease',
          opacity,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-green-50 px-5 pt-4 pb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {phase === 'detail' ? (
                <BookOpen className="size-4 text-primary shrink-0" />
              ) : (
                <Sparkles className="size-4 text-primary shrink-0" />
              )}
              <p className="text-[10px] font-black text-primary uppercase tracking-widest truncate">
                {phase === 'sidebar'
                  ? `Mục ${sidebarIdx + 1}/${TOUR_STEPS.length} — ${currentSidebar.title}`
                  : `Chi tiết ${detailIdx + 1}/${currentSidebar.details.length}`}
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              title="Thoát hướng dẫn"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            <h3 className="text-sm font-black text-gray-900 mb-2">
              {phase === 'sidebar' ? currentSidebar.title : currentDetail.label}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {phase === 'sidebar' ? currentSidebar.description : currentDetail.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="px-5 pb-2 flex gap-1.5">
            {(phase === 'sidebar' ? TOUR_STEPS : currentSidebar.details).map((_, i) => {
              const active = phase === 'sidebar' ? sidebarIdx : detailIdx
              return (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === active
                      ? 'bg-primary w-5'
                      : i < active
                        ? 'bg-primary/40 w-2'
                        : 'bg-gray-200 w-2'
                  }`}
                />
              )
            })}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-2 flex gap-2">
            {phase === 'sidebar' ? (
              <>
                <button
                  onClick={dismiss}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleSidebarDetail}
                  className="flex-1 py-2.5 rounded-xl border border-primary/30 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                >
                  <BookOpen className="size-3.5" /> Chi tiết
                </button>
                <button
                  onClick={handleSidebarNext}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-black flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30"
                >
                  {isLastSidebar ? 'Xong' : 'Tiếp'}
                  {!isLastSidebar && <ChevronRight className="size-3.5" />}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDetailSkip}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Bỏ qua mục này
                </button>
                <button
                  onClick={handleDetailNext}
                  className="flex-[2] py-2.5 rounded-xl bg-primary text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30"
                >
                  {isLastDetail ? '✓ Xong mục này' : 'Tiếp tục'}
                  <ChevronRight className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Arrow */}
        {highlight &&
          tooltipStyle.left !== undefined &&
          Number(tooltipStyle.left) > highlight.left + highlight.width && (
            <div
              className="absolute -left-2 pointer-events-none"
              style={{
                top: Math.min(
                  Math.max(
                    (Number(tooltipStyle.top ?? 0) > 0
                      ? highlight.top + highlight.height / 2 - Number(tooltipStyle.top)
                      : TOOLTIP_H / 2) - 8,
                    16,
                  ),
                  TOOLTIP_H - 32,
                ),
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '8px solid white',
                filter: 'drop-shadow(-2px 0 2px rgba(0,0,0,0.07))',
              }}
            />
          )}
      </div>

      <style>{`
        @keyframes tour-pulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(34,197,94,0.18); }
          50%      { box-shadow: 0 0 0 10px rgba(34,197,94,0.06); }
        }
      `}</style>
    </>,
    document.body,
  )
}

export default OnboardingTour
