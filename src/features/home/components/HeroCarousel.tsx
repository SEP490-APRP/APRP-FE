import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  BookOpen,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Gift,
  Pause,
  Play,
  PlayCircle,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react'
import heroFarmerImg from '@/assets/hero-farmer.jpg'
import campaignImg from '@/assets/farmer-forum-banner.jpg'
import comboImg from '@/assets/combo-hotpot.jpg'
import aiImg from '@/assets/ai-hero-banner.jpg'
import { useActiveCampaigns } from '@/features/campaign/hooks/useCampaignQueries'
import { formatKg, formatVnd, progressOf, timeLeftLabel } from '@/features/campaign/utils'
import type { CampaignResponse } from '@/services'

const AUTOPLAY_MS = 6500

type Slide = {
  id: string
  /** Nhãn ngắn trên thanh chỉ mục */
  label: string
  render: (active: boolean) => ReactNode
}

/**
 * Section đầu trang chủ: nhiều banner tự chuyển.
 * - Tự chuyển mỗi 6,5 giây, dừng khi rê chuột / focus bàn phím / tab bị ẩn / người dùng bấm tạm dừng.
 * - Không tự chạy khi hệ điều hành bật "giảm chuyển động".
 * - Vuốt trái/phải trên điện thoại, phím ← → khi focus vào banner.
 */
export default function HeroCarousel() {
  const { data } = useActiveCampaigns(0, 1)
  const featured = data?.content?.[0]

  const slides: Slide[] = [
    { id: 'rescue', label: 'Giải cứu hôm nay', render: (a) => <RescueSlide active={a} /> },
    { id: 'campaign', label: 'Chiến dịch giải cứu', render: (a) => <CampaignSlide active={a} campaign={featured} /> },
    { id: 'combo', label: 'Combo & Túi mù', render: (a) => <ComboSlide active={a} /> },
    { id: 'ai', label: 'Thực đơn AI', render: (a) => <AiSlide active={a} /> },
  ]
  const count = slides.length

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Luôn tự chuyển; chỉ dừng khi tab trình duyệt bị ẩn hoặc người dùng bấm nút tạm dừng.
  // (Trước đây dừng cả khi rê chuột / focus, mà banner chiếm gần hết màn hình nên gần như không bao giờ tự chuyển.)
  const running = !paused && !userPaused

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count])

  useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => go(index + 1), AUTOPLAY_MS)
    return () => window.clearTimeout(t)
  }, [running, index, go])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner nổi bật CapNong"
      className="relative w-full overflow-hidden bg-on-surface min-h-[560px] sm:min-h-[620px] lg:min-h-[660px] xl:min-h-[720px]"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} / ${count}: ${s.label}`}
          aria-hidden={i !== index}
          inert={i !== index ? true : undefined}
          className={`absolute inset-0 transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-opacity will-change-[opacity,transform] ${
            i === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.03] z-0'
          }`}
        >
          {s.render(i === index)}
        </div>
      ))}

      {/* Thanh điều khiển */}
      <div className="absolute inset-x-0 bottom-0 z-20 pb-5 sm:pb-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-3xl" role="tablist" aria-label="Chọn banner">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.label}
                onClick={() => go(i)}
                className="group flex-1 min-w-0 text-left pt-3 pb-1 cursor-pointer"
              >
                <span className="relative block h-1 rounded-full bg-white/25 overflow-hidden">
                  <span
                    key={`${i}-${index}-${running}`}
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      s.id === 'campaign' ? 'bg-tertiary-fixed-dim' : 'bg-white'
                    }`}
                    style={
                      i < index
                        ? { width: '100%' }
                        : i === index
                          ? running
                            ? { width: '100%', animation: `capnong-hero-progress ${AUTOPLAY_MS}ms linear` }
                            : { width: '100%' }
                          : { width: '0%' }
                    }
                  />
                </span>
                <span
                  className={`hidden md:block mt-2 text-xs font-bold truncate transition-colors ${
                    i === index ? 'text-white' : 'text-white/55 group-hover:text-white/85'
                  }`}
                >
                  {s.id === 'campaign' && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim mr-1.5 align-middle" />
                  )}
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CtrlButton label={userPaused ? 'Tiếp tục tự chuyển' : 'Tạm dừng tự chuyển'} onClick={() => setUserPaused((v) => !v)}>
              {userPaused ? <Play size={16} /> : <Pause size={16} />}
            </CtrlButton>
            <CtrlButton label="Banner trước" onClick={() => go(index - 1)}>
              <ChevronLeft size={20} />
            </CtrlButton>
            <CtrlButton label="Banner tiếp theo" onClick={() => go(index + 1)}>
              <ChevronRight size={20} />
            </CtrlButton>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes capnong-hero-progress { from { width: 0% } to { width: 100% } }
        @keyframes capnong-hero-zoom { from { transform: scale(1.08) } to { transform: scale(1) } }
        @keyframes capnong-hero-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes capnong-hero-rise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
        .capnong-hero-zoom { animation: capnong-hero-zoom 8s ease-out both }
        .capnong-hero-rise > * { animation: capnong-hero-rise .8s cubic-bezier(.2,.7,.2,1) .25s both }
        .capnong-hero-rise > *:nth-child(2) { animation-delay: .33s }
        .capnong-hero-rise > *:nth-child(3) { animation-delay: .41s }
        .capnong-hero-rise > *:nth-child(4) { animation-delay: .49s }
        .capnong-hero-rise > *:nth-child(5) { animation-delay: .57s }
        @media (prefers-reduced-motion: reduce) {
          .capnong-hero-zoom { animation: none }
          .capnong-hero-rise > * { animation-name: capnong-hero-fade }
        }
      `}</style>
    </section>
  )
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="w-10 h-10 sm:w-11 sm:h-11 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white border border-white/25 backdrop-blur-md transition-colors"
    >
      {children}
    </button>
  )
}

/* ───────────────────────── Khung dùng chung: mọi banner theo đúng bố cục banner gốc ─────────────────────────
 * Cùng ảnh nền + lớp tối, cùng vị trí (nội dung neo từ trên xuống nên tiêu đề các banner thẳng hàng),
 * cùng nhãn, cỡ chữ tiêu đề, đoạn mô tả, kiểu nút và hàng số liệu.
 */

function PhotoSlide({
  active,
  img,
  alt,
  imgPosition = 'object-[center_top] lg:object-right-top',
  children,
}: {
  active: boolean
  img: string
  alt: string
  imgPosition?: string
  children: ReactNode
}) {
  return (
    <div className="absolute inset-0 flex items-start">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          alt={alt}
          src={img}
          className={`w-full h-full object-cover ${imgPosition} ${active ? 'capnong-hero-zoom' : ''}`}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/95 via-on-surface/80 to-on-surface/50 lg:hidden" />
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-on-surface/95 via-on-surface/75 to-transparent w-[62%] xl:w-[55%]" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply pointer-events-none" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full pt-10 sm:pt-14 lg:pt-16 xl:pt-20">
        <div className={`max-w-2xl flex flex-col gap-4 sm:gap-6 text-surface-bright ${active ? 'capnong-hero-rise' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Pill({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-md w-fit shadow-sm">
      <span className="relative flex w-2.5 h-2.5 shrink-0" aria-hidden>
        {live && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#dca858] opacity-70 animate-ping motion-reduce:animate-none" />
        )}
        <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#dca858] shadow-[0_0_8px_rgba(220,168,88,0.6)]" />
      </span>
      <span className="text-xs sm:text-[13px] font-bold tracking-wider text-[#ecd4a6] uppercase">{children}</span>
    </div>
  )
}

/** Tiêu đề 2 dòng: dòng 1 trắng, dòng 2 vàng (giống "Nông sản xấu mã – / Ngon thật, rẻ thật.") */
function Headline({ as: Tag = 'h2', line1, line2 }: { as?: 'h1' | 'h2'; line1: string; line2: string }) {
  return (
    <Tag className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl text-surface-bright font-extrabold tracking-tight leading-[1.18] sm:leading-[1.15]">
      {line1} <br />
      <span className="text-tertiary-fixed-dim inline-block">{line2}</span>
    </Tag>
  )
}

function Lead({ children }: { children: ReactNode }) {
  return <p className="text-sm sm:text-base lg:text-lg text-surface-container-high leading-relaxed max-w-xl">{children}</p>
}

const ctaPrimary =
  'inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-primary-container hover:bg-primary text-white font-bold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary-container/30 min-h-[46px]'
const ctaGhost =
  'inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-surface-bright border border-white/25 backdrop-blur-md font-bold text-sm sm:text-base transition-all min-h-[46px]'

type Cta = { href: string; label: string; icon: typeof ShoppingBasket }

function Ctas({ primary, ghost }: { primary: Cta; ghost: Cta }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
      <a className={ctaPrimary} href={primary.href}>
        <primary.icon size={20} aria-hidden />
        <span>{primary.label}</span>
      </a>
      <a className={ctaGhost} href={ghost.href}>
        <ghost.icon size={20} aria-hidden />
        <span>{ghost.label}</span>
      </a>
    </div>
  )
}

/** Hàng số liệu 3 cột: vàng / xanh nhạt / trắng như banner gốc */
function Stats({ items }: { items: [string, string][] }) {
  const tones = ['text-tertiary-fixed-dim', 'text-primary-fixed', 'text-surface-bright']
  return (
    <div className="hidden sm:grid grid-cols-3 gap-2 sm:gap-4 pt-5 mt-2 sm:mt-4 border-t border-white/20">
      {items.map(([value, label], i) => (
        <div key={label} className="flex flex-col min-w-0">
          <span className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${tones[i]}`}>{value}</span>
          <span className="text-caption sm:text-sm text-surface-container-highest mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── 1. Banner gốc: Giải cứu hôm nay ───────────────────────── */

function RescueSlide({ active }: { active: boolean }) {
  return (
    <PhotoSlide active={active} img={heroFarmerImg} alt="Hai cô chú nông dân Việt Nam tươi cười với nông sản tươi ngon thu hoạch từ vườn">
      <Pill>Nền tảng nông sản Việt Nam</Pill>
      <Headline as="h1" line1="Nông sản xấu mã –" line2="Ngon thật, rẻ thật." />
      <Lead>
        Cứu rau củ lỡ "mất dáng" khỏi bãi rác, bảo vệ túi tiền của bạn và giúp nông dân Việt Nam bán được trọn vẹn mùa vụ.
        Tươi ngon, an lành và giao thần tốc mỗi ngày.
      </Lead>
      <Ctas
        primary={{ href: '/giai-cuu-hom-nay', label: 'Mua ngay hôm nay', icon: ShoppingBasket }}
        ghost={{ href: '/cong-nghe-ai', label: 'Xem cách hoạt động', icon: PlayCircle }}
      />
      <Stats
        items={[
          ['12.000+', 'Đơn giải cứu'],
          ['500+', 'Nông dân liên kết'],
          ['30 Tấn', 'Tránh lãng phí'],
        ]}
      />
    </PhotoSlide>
  )
}

/* ───────────────────────── 2. Banner chiến dịch giải cứu (WF-01) ───────────────────────── */

function CampaignSlide({ active, campaign: c }: { active: boolean; campaign?: CampaignResponse }) {
  return (
    <PhotoSlide
      active={active}
      img={campaignImg}
      alt="Các nhà vườn cùng giơ thùng nông sản vừa thu hoạch trên đồi rau"
      imgPosition="object-center"
    >
      <Pill live>Chiến dịch giải cứu · Đang mở</Pill>
      <Headline line1="Góp một thùng –" line2="Cứu cả mùa vụ." />
      <Lead>
        {c ? `${c.title}. ` : ''}Khi giá rớt hay thương lái bỏ đi, cả vườn có thể phải đổ bỏ. Thùng bạn đặt trước giúp
        nhà vườn có lý do thu hoạch tiếp, và nếu chiến dịch không thành, tiền cọc luôn trở về với bạn.
      </Lead>
      <Ctas
        primary={{ href: c ? `/chien-dich/${c.campaignId}` : '/chien-dich', label: c ? 'Đọc chiến dịch' : 'Xem chiến dịch', icon: BookOpen }}
        ghost={{ href: '/chien-dich?trang-thai=sap-mo', label: 'Chiến dịch sắp mở', icon: CalendarClock }}
      />
      <Stats
        items={
          c
            ? [
                [`${progressOf(c)}%`, `Đã đặt ${formatKg(c.bookedVolumeKg)}`],
                [`${formatVnd(c.rescuePricePerKg)}`, 'Giá giải cứu / kg'],
                [timeLeftLabel(c.cutoffAt).replace('Còn ', ''), 'Đến ngày chốt đơn'],
              ]
            : [
                ['10–50 kg', 'Thùng đặt trước'],
                ['Cọc trước', 'Trả phần còn lại khi nhận'],
                ['Hoàn 100%', 'Nếu không đủ ngưỡng'],
              ]
        }
      />
    </PhotoSlide>
  )
}

/* ───────────────────────── 3. Combo & Túi mù ───────────────────────── */

function ComboSlide({ active }: { active: boolean }) {
  return (
    <PhotoSlide active={active} img={comboImg} alt="Mâm rau củ tươi được chọn sẵn cho một bữa lẩu" imgPosition="object-center">
      <Pill>Combo &amp; Túi mù</Pill>
      <Headline line1="Mở túi bất ngờ –" line2="Bữa nào cũng tươi." />
      <Lead>
        Combo rau củ theo bữa và túi mù nông sản giải cứu được nhà vườn chọn sẵn mỗi ngày. Ít phải nghĩ, nhiều món ngon,
        giá mềm hơn mua lẻ.
      </Lead>
      <Ctas
        primary={{ href: '/combo-tui-mu', label: 'Xem combo hôm nay', icon: ShoppingBasket }}
        ghost={{ href: '/combo-tui-mu', label: 'Túi mù là gì?', icon: Gift }}
      />
      <Stats
        items={[
          ['Theo bữa', 'Combo chọn sẵn'],
          ['Mỗi ngày', 'Túi mù mới'],
          ['Tận vườn', 'Nhà vườn đóng gói'],
        ]}
      />
    </PhotoSlide>
  )
}

/* ───────────────────────── 4. Thực đơn AI ───────────────────────── */

function AiSlide({ active }: { active: boolean }) {
  return (
    <PhotoSlide active={active} img={aiImg} alt="Nông dân dùng máy tính bảng kiểm tra rau trong nhà kính thông minh" imgPosition="object-center">
      <Pill>CapNong AI</Pill>
      <Headline line1="Thực đơn cả tuần –" line2="Từ nông sản đang có." />
      <Lead>
        AI gợi ý thực đơn chay hoặc mặn, chia khẩu phần và lên sẵn danh sách đi chợ từ chính hàng giải cứu trên sàn.
      </Lead>
      <Ctas
        primary={{ href: '/ke-hoach-an-uong', label: 'Tạo thực đơn miễn phí', icon: Sparkles }}
        ghost={{ href: '/cong-nghe-ai', label: 'Xem cách hoạt động', icon: PlayCircle }}
      />
      <Stats
        items={[
          ['7 ngày', 'Thực đơn cả tuần'],
          ['Chay / Mặn', 'Theo khẩu vị'],
          ['1 chạm', 'Ra danh sách đi chợ'],
        ]}
      />
    </PhotoSlide>
  )
}
