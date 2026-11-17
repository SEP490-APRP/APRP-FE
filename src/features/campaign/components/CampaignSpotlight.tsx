import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCampaignsByPhase } from '@/features/campaign/hooks/useCampaignQueries'
import { useChatbotStore } from '@/features/chatbot/stores/useChatbotStore'
import {
  BANNER_KEYFRAMES,
  BannerCornerCard,
  BannerPill,
  BannerPopupCard,
  bannerOf,
  useCountdown,
} from './CampaignBanner'

/**
 * Quảng bá chiến dịch giải cứu ở trang chủ, theo banner Admin tuỳ chỉnh (AdminCampaigns > Banner trang chủ).
 * - Có chiến dịch đang nhận đặt trước mà máy này chưa thấy (hoặc Admin vừa đổi banner): bật popup lớn sau 2 giây.
 * - Đóng popup: thu về thẻ nhỏ ở góc phải, nằm trên nút trợ lý AI.
 * - Thu nhỏ thẻ: còn viên thuốc đếm ngược; bấm để mở lại thẻ.
 * Chiến dịch Admin tắt "Hiện ở trang chủ" thì không xuất hiện.
 */

type Mode = 'popup' | 'card' | 'pill' | 'hidden'

const SEEN_KEY = 'capnong.campaignSpotlight.seen'
const MODE_KEY = 'capnong.campaignSpotlight.mode'

function readSeen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}
function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-50)))
  } catch {
    /* trình duyệt chặn lưu: popup sẽ hiện lại lần sau, không sao */
  }
}
function readMode(): Mode | null {
  try {
    const v = localStorage.getItem(MODE_KEY)
    return v === 'card' || v === 'pill' ? v : null
  } catch {
    return null
  }
}
function writeMode(m: Mode) {
  try {
    if (m === 'card' || m === 'pill') localStorage.setItem(MODE_KEY, m)
  } catch {
    /* bỏ qua */
  }
}

/** Khoá "đã xem": đổi banner thì khoá đổi, popup hiện lại một lần */
const seenKey = (c: { campaignId: number; bannerUpdatedAt?: string | null }) => `${c.campaignId}@${c.bannerUpdatedAt ?? ''}`

export function CampaignSpotlight() {
  const { data } = useCampaignsByPhase('ONGOING', 0, 6)
  const chatOpen = useChatbotStore((s) => s.isOpen)

  const campaigns = useMemo(
    () =>
      (data?.content ?? [])
        .filter((c) => c.status === 'ACTIVE' && c.bannerOnHome !== false && new Date(c.cutoffAt).getTime() > Date.now())
        .sort((a, b) => new Date(b.publishedAt ?? b.createdAt ?? 0).getTime() - new Date(a.publishedAt ?? a.createdAt ?? 0).getTime()),
    [data],
  )

  const [mode, setModeState] = useState<Mode>('hidden')
  const [idx, setIdx] = useState(0)
  const [closing, setClosing] = useState(false)

  const setMode = (m: Mode) => {
    setModeState(m)
    writeMode(m)
  }

  useEffect(() => {
    if (campaigns.length === 0) {
      setModeState('hidden')
      return
    }
    const seen = readSeen()
    const fresh = campaigns.findIndex((c) => !seen.includes(seenKey(c)))
    if (fresh >= 0) {
      setIdx(fresh)
      const t = window.setTimeout(() => setModeState('popup'), 2000)
      return () => window.clearTimeout(t)
    }
    setModeState(readMode() ?? 'card')
  }, [campaigns])

  const c = campaigns[Math.min(idx, Math.max(0, campaigns.length - 1))]
  const countdown = useCountdown(c?.cutoffAt)

  function markAllSeen() {
    const seen = readSeen()
    writeSeen([...seen, ...campaigns.map(seenKey).filter((k) => !seen.includes(k))])
  }

  function closePopup() {
    markAllSeen()
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      setMode('card')
    }, 420)
  }

  // Khoá cuộn trang và cho phép Esc khi popup lớn đang mở
  useEffect(() => {
    if (mode !== 'popup') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePopup()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  if (!c || mode === 'hidden') return null

  const b = bannerOf(c)
  const go = (d: number) => setIdx((i) => (i + d + campaigns.length) % campaigns.length)
  const nav = { index: idx, total: campaigns.length, onPrev: () => go(-1), onNext: () => go(1) }
  const link = (onClick?: () => void) => (className: string, children: ReactNode) => (
    <Link to={`/chien-dich/${c.campaignId}`} onClick={onClick} className={className}>
      {children}
    </Link>
  )

  if (mode === 'popup') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
        <style>{BANNER_KEYFRAMES}</style>
        <button
          type="button"
          aria-label="Đóng quảng bá chiến dịch"
          onClick={closePopup}
          className={`absolute inset-0 bg-[#0f160a]/60 backdrop-blur-[2px] transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={b.headline}
          className={`relative w-full origin-bottom-right transition-all duration-[420ms] ease-in ${b.mode === 'IMAGE' ? 'max-w-[520px]' : 'max-w-[360px]'} ${
            closing ? 'translate-x-[38vw] translate-y-[34vh] scale-[0.12] opacity-0' : 'cs-pop'
          }`}
        >
          <BannerPopupCard
            c={c}
            b={b}
            countdown={countdown}
            onClose={closePopup}
            nav={nav}
            cta={link(() => {
              markAllSeen()
              setMode('card')
            })}
          />
        </div>
      </div>
    )
  }

  // Thẻ góc và viên thuốc nằm trên nút AI (nút AI: right-5, bottom-[86px], cao 56px). Ẩn khi đang chat với AI.
  if (chatOpen) return null

  if (mode === 'pill') {
    return (
      <>
        <style>{BANNER_KEYFRAMES}</style>
        <BannerPill c={c} b={b} countdown={countdown} onClick={() => setMode('card')} className="cs-bub fixed bottom-[154px] right-5 z-50" />
      </>
    )
  }

  return (
    <aside aria-label="Chiến dịch giải cứu đang mở" className="cs-up fixed bottom-[154px] right-5 z-50 w-[min(310px,calc(100vw-40px))]">
      <style>{BANNER_KEYFRAMES}</style>
      <BannerCornerCard c={c} b={b} countdown={countdown} onMinimize={() => setMode('pill')} cta={link()} nav={nav} />
    </aside>
  )
}

export default CampaignSpotlight
