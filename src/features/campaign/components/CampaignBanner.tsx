import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Clock3, Leaf, Minus, X } from 'lucide-react'
import vegImg from '@/assets/fresh-veg-promo.png'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import type { CampaignResponse } from '@/services'

/**
 * Giao diện banner chiến dịch dùng chung cho trang chủ (popup, thẻ góc, viên thuốc)
 * và màn xem trước khi Admin tuỳ chỉnh banner.
 */

export type BannerMode = 'AUTO' | 'IMAGE'
export type BannerTheme = 'ORANGE' | 'GREEN' | 'RED'

export interface BannerConfig {
  mode: BannerMode
  theme: BannerTheme
  headline: string
  subline: string
  badge: string
  ctaText: string
  /** AUTO: ảnh minh hoạ (trống = ảnh bìa); IMAGE: ảnh banner hoàn chỉnh */
  imageUrl: string
  showOnHome: boolean
}

export const BANNER_THEMES: Record<BannerTheme, {
  name: string
  bg: string
  rays: string
  shadow: string
  tile: string
  tileMid: string
  burst: string
  head: string
  accent: string
  soft: string
  border: string
}> = {
  ORANGE: {
    name: 'Cam bùng nổ',
    bg: 'radial-gradient(120% 70% at 50% 0%, #ffe680 0%, #ffba41 38%, #f26a1b 70%, #c84a0c 100%)',
    rays: 'rgba(255,255,255,.55)',
    shadow: '#b23c06',
    tile: '#326318',
    tileMid: '#1a3a0c',
    burst: '#d32f2f',
    head: 'linear-gradient(90deg, #f26a1b, #ffba41)',
    accent: '#c84a0c',
    soft: '#fdeedd',
    border: '#f3c9a6',
  },
  GREEN: {
    name: 'Xanh nhà vườn',
    bg: 'radial-gradient(120% 70% at 50% 0%, #e3f7c8 0%, #8cc95a 36%, #4a7c2f 70%, #1f4210 100%)',
    rays: 'rgba(255,255,255,.45)',
    shadow: '#1a3a0c',
    tile: '#1a3a0c',
    tileMid: '#0f2507',
    burst: '#f26a1b',
    head: 'linear-gradient(90deg, #326318, #5e9440)',
    accent: '#326318',
    soft: '#e3f1da',
    border: '#cfe6c4',
  },
  RED: {
    name: 'Đỏ khẩn cấp',
    bg: 'radial-gradient(120% 70% at 50% 0%, #ffd6b8 0%, #ff7a59 36%, #d32f2f 70%, #861212 100%)',
    rays: 'rgba(255,255,255,.45)',
    shadow: '#6e0f0f',
    tile: '#3e220d',
    tileMid: '#2a1607',
    burst: '#326318',
    head: 'linear-gradient(90deg, #d32f2f, #ff7a59)',
    accent: '#b71c1c',
    soft: '#fde3df',
    border: '#f5c2bb',
  },
}

/** % đã đặt so với ngưỡng (đủ ngưỡng thì nhà vườn thu hoạch) */
export const thresholdPct = (c: CampaignResponse) =>
  c.minThresholdKg > 0 ? Math.min(100, Math.round((Number(c.bookedVolumeKg ?? 0) / c.minThresholdKg) * 100)) : 0

export const depositPctOf = (c: CampaignResponse) => Math.round(Number(c.depositPercent ?? 0) * 100)

const priceK = (v: number) => {
  const k = Number(v) / 1000
  return `${k.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}K`
}

/** Banner tự dựng từ thông tin chiến dịch (khi Admin chưa sửa gì) */
export function defaultBanner(c: CampaignResponse): BannerConfig {
  return {
    mode: 'AUTO',
    theme: 'ORANGE',
    headline: c.title,
    subline: c.approvedFarmCount > 0 ? `${c.approvedFarmCount} nhà vườn đang chờ bạn đặt trước` : 'Đặt trước để nhà vườn yên tâm thu hoạch',
    badge: `CHỈ CỌC ${depositPctOf(c)}%`,
    ctaText: 'ĐẶT TRƯỚC NGAY',
    imageUrl: '',
    showOnHome: true,
  }
}

/** Banner đang dùng = cấu hình Admin đã lưu, chỗ nào trống thì lấy từ thông tin chiến dịch */
export function bannerOf(c: CampaignResponse): BannerConfig {
  const d = defaultBanner(c)
  return {
    mode: c.bannerMode === 'IMAGE' && c.bannerImageUrl ? 'IMAGE' : 'AUTO',
    theme: (['ORANGE', 'GREEN', 'RED'] as const).includes(c.bannerTheme as BannerTheme) ? (c.bannerTheme as BannerTheme) : d.theme,
    headline: c.bannerHeadline || d.headline,
    subline: c.bannerSubline || d.subline,
    badge: c.bannerBadge || d.badge,
    ctaText: c.bannerCtaText || d.ctaText,
    imageUrl: c.bannerImageUrl || '',
    showOnHome: c.bannerOnHome !== false,
  }
}

/** Ảnh minh hoạ cho mẫu tự dựng: ảnh Admin chọn > ảnh bìa > rổ rau có sẵn */
const heroOf = (c: CampaignResponse, b: BannerConfig) => (b.mode === 'AUTO' && b.imageUrl) || c.coverImageUrl || ''

export const BANNER_KEYFRAMES = `
@keyframes csPop{from{opacity:0;transform:translateY(16px) scale(.88)}to{opacity:1;transform:none}}
@keyframes csUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes csBub{0%{opacity:0;transform:scale(.3)}70%{transform:scale(1.08)}100%{opacity:1;transform:none}}
.cs-pop{animation:csPop .38s cubic-bezier(.2,1.3,.4,1) both}
.cs-up{animation:csUp .35s cubic-bezier(.2,1.2,.4,1) both}
.cs-bub{animation:csBub .4s ease-out both}
@media (prefers-reduced-motion:reduce){.cs-pop,.cs-up,.cs-bub{animation:none}}
`

interface Nav {
  index: number
  total: number
  onPrev?: () => void
  onNext?: () => void
}

/* ───────────── Popup lớn ───────────── */

export function BannerPopupCard({
  c, b, countdown, onClose, cta, nav,
}: {
  c: CampaignResponse
  b: BannerConfig
  countdown: string
  onClose?: () => void
  /** Nút / link hành động; nhận className và nội dung */
  cta: (className: string, children: ReactNode) => ReactNode
  nav?: Nav
}) {
  const t = BANNER_THEMES[b.theme]
  const many = !!nav && nav.total > 1
  const closeBtn = onClose && (
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng"
      className="absolute -right-3 -top-3 z-10 grid size-9 place-items-center rounded-full border-2 border-white bg-[#1c2216]/75 text-white hover:bg-[#1c2216]"
    >
      <X size={18} strokeWidth={3} />
    </button>
  )

  if (b.mode === 'IMAGE') {
    return (
      <div className="relative">
        {closeBtn}
        <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.35)]">
          {cta('block', <img src={b.imageUrl} alt={b.headline} className="block max-h-[62vh] w-full object-contain" />)}
          <div className="flex items-center gap-2 p-3" style={{ background: t.head }}>
            {many && <NavBtn dir="prev" onClick={nav!.onPrev} />}
            <span className="flex items-center gap-1 rounded-lg bg-[#1c2216] px-2 py-1.5 text-[12px] font-black tabular-nums text-[#ffea79]">
              <Clock3 size={13} /> {countdown}
            </span>
            {cta(
              'flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-[#fff36b] to-[#ffd21f] py-2 text-[14px] font-black text-[#7a2b00] shadow-[0_2px_0_#b97a00]',
              <>{b.ctaText} <ChevronRight size={16} strokeWidth={3} /></>,
            )}
            {many && <NavBtn dir="next" onClick={nav!.onNext} />}
          </div>
        </div>
      </div>
    )
  }

  const hero = heroOf(c, b)
  const pct = thresholdPct(c)
  // Phần to bắt đầu từ từ cuối cùng có chữ số (vd "CÒN 31 GIỜ" -> "31 GIỜ"), không có số thì là từ cuối
  const words = b.badge.trim().split(/\s+/)
  let cut = words.length - 1
  for (let i = words.length - 1; i >= 0; i--) if (/\d/.test(words[i])) { cut = i; break }
  const badgeBig = words.slice(cut).join(' ')
  const badgeSmall = words.slice(0, cut).join(' ')

  return (
    <div
      className="relative rounded-[22px] px-4 pb-4 pt-4 text-white shadow-[0_24px_60px_rgba(0,0,0,.35)]"
      style={{ background: t.bg }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px] opacity-35"
        style={{ background: `repeating-conic-gradient(from 0deg at 50% 30%, ${t.rays} 0 6deg, transparent 6deg 18deg)` }}
      />
      {closeBtn}

      <div className="relative flex items-start justify-between">
        <span className="rounded-lg bg-white px-2.5 py-1 text-[12px] font-black leading-tight" style={{ color: t.accent, boxShadow: `0 2px 0 ${t.shadow}` }}>
          CHIẾN DỊCH MỚI
          <span className="block text-[11px] font-semibold text-[#326318]">Chốt sau {countdown}</span>
        </span>
        {many && (
          <span className="rounded-full bg-[#1c2216]/70 px-2 py-1 text-[11px] font-bold text-[#ffea79]">
            {nav!.index + 1}/{nav!.total} chiến dịch
          </span>
        )}
      </div>

      {b.badge.trim() && (
        <div aria-hidden className="absolute -right-5 top-16 z-[1] grid size-[92px] place-items-center text-center">
          <span
            className="absolute inset-0"
            style={{
              background: t.burst,
              clipPath:
                'polygon(50% 0,61% 13%,77% 6%,80% 23%,96% 26%,89% 41%,100% 54%,87% 63%,92% 79%,75% 80%,68% 96%,54% 87%,40% 99%,33% 84%,16% 90%,16% 73%,1% 66%,11% 52%,2% 37%,18% 32%,18% 15%,35% 17%)',
              transform: 'rotate(-8deg)',
            }}
          />
          <span className="relative max-w-[76px] -rotate-6 text-[10px] font-black leading-none">
            {badgeSmall}
            <b className="block break-words text-[22px] leading-none text-[#ffea79]">{badgeBig}</b>
          </span>
        </div>
      )}

      <div className="relative grid h-[168px] place-items-center">
        {hero ? (
          <img src={hero} alt="" className="h-[150px] w-[220px] -rotate-2 rounded-2xl border-4 border-white object-cover shadow-[0_10px_20px_rgba(0,0,0,.3)]" />
        ) : (
          <img src={vegImg} alt="" className="h-[160px] object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,.35)]" />
        )}
      </div>

      <h2
        className="relative mt-1 line-clamp-3 text-balance text-center text-[26px] font-black uppercase leading-[1.05] text-white"
        style={{ textShadow: `0 3px 0 ${t.shadow}, 0 6px 14px rgba(0,0,0,.3)` }}
      >
        {b.headline}
      </h2>
      {b.subline && <p className="relative mb-3 mt-1.5 text-center text-[13px] font-bold text-white/90">{b.subline}</p>}

      <div className="relative mt-2 grid grid-cols-[1fr_1.15fr_1fr] gap-1.5">
        <Tile bg={t.tile} label="Giá giải cứu" big={priceK(c.rescuePricePerKg)} unit="/kg" />
        <Tile bg={t.tileMid} label="Đã đặt" big={`${pct}%`} unit="so với ngưỡng" mid />
        <Tile bg={t.tile} label="Thùng" big="5–15" unit="kg" />
      </div>

      <div className="relative mt-3 flex items-center gap-2">
        {many && <NavBtn dir="prev" onClick={nav!.onPrev} light />}
        {cta(
          'mx-auto flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#fff36b] to-[#ffd21f] px-4 py-2.5 text-[17px] font-black uppercase text-[#7a2b00] shadow-[0_4px_0_#b97a00] transition active:translate-y-0.5',
          <>{b.ctaText} <ChevronRight size={18} strokeWidth={3} /></>,
        )}
        {many && <NavBtn dir="next" onClick={nav!.onNext} light />}
      </div>
      <p className="relative mt-2 text-center text-[10.5px] text-white/85">
        Không đủ {formatKg(c.minThresholdKg)} lúc chốt thì hoàn 100% cọc về ví CapNong
      </p>
    </div>
  )
}

/* ───────────── Thẻ góc ───────────── */

export function BannerCornerCard({
  c, b, countdown, onMinimize, cta, nav,
}: {
  c: CampaignResponse
  b: BannerConfig
  countdown: string
  onMinimize?: () => void
  cta: (className: string, children: ReactNode) => ReactNode
  nav?: Nav
}) {
  const t = BANNER_THEMES[b.theme]
  const pct = thresholdPct(c)
  const many = !!nav && nav.total > 1
  const thumb = (b.mode === 'AUTO' && b.imageUrl) || c.coverImageUrl || vegImg
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white shadow-[0_14px_40px_rgba(0,0,0,.25)]" style={{ borderColor: t.border }}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-black tracking-wide text-white" style={{ background: t.head }}>
        <span className="flex items-center gap-1.5">
          <Leaf size={13} className="text-[#ffea79]" /> CHIẾN DỊCH GIẢI CỨU
          {many && <span className="rounded-full bg-white/25 px-1.5">{nav!.index + 1}/{nav!.total}</span>}
        </span>
        {onMinimize && (
          <button type="button" onClick={onMinimize} aria-label="Thu nhỏ" className="grid size-6 place-items-center rounded-full hover:bg-white/25">
            <Minus size={15} strokeWidth={3} />
          </button>
        )}
      </div>

      {b.mode === 'IMAGE' ? (
        <div className="p-3 pb-2">
          {cta('block', <img src={b.imageUrl} alt={b.headline} className="block h-[110px] w-full rounded-xl object-cover" />)}
          <h3 className="mt-2 line-clamp-1 text-[14px] font-black text-[#1c2216]">{b.headline}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-[76px_1fr] gap-3 p-3">
          <div className="relative">
            <img src={thumb} alt="" className="size-[76px] rounded-xl object-cover" style={{ background: t.soft }} />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-px text-[10px] font-black text-white" style={{ background: t.burst }}>
              Cọc {depositPctOf(c)}%
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-black leading-tight text-[#1c2216]">{b.headline}</h3>
            <p className="mt-1 text-[13px] font-black" style={{ color: t.accent }}>
              {formatVnd(c.rescuePricePerKg)}
              <span className="font-semibold text-[#5f6b57]">/kg</span>
            </p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: t.soft }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.head }} />
            </div>
            <p className="mt-1 text-[11px] text-[#5f6b57]">Đã đặt {pct}% ngưỡng thu hoạch</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 pb-3">
        <span className="flex items-center gap-1 rounded-lg bg-[#1c2216] px-2 py-1.5 text-[12px] font-black tabular-nums text-[#ffea79]">
          <Clock3 size={13} /> {countdown}
        </span>
        {cta(
          'flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-[#fff36b] to-[#ffd21f] py-2 text-[13px] font-black text-[#7a2b00] shadow-[0_2px_0_#b97a00]',
          <>Đặt trước <ChevronRight size={15} strokeWidth={3} /></>,
        )}
        {many && (
          <button type="button" onClick={nav!.onNext} aria-label="Chiến dịch khác" className="grid size-8 place-items-center rounded-lg border" style={{ borderColor: t.border, color: t.accent }}>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ───────────── Viên thuốc thu nhỏ ───────────── */

export function BannerPill({ c, b, countdown, onClick, className = '', style }: {
  c: CampaignResponse
  b: BannerConfig
  countdown: string
  onClick?: () => void
  className?: string
  style?: CSSProperties
}) {
  const t = BANNER_THEMES[b.theme]
  const thumb = b.imageUrl || c.coverImageUrl || vegImg
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Mở chiến dịch ${b.headline}`}
      className={`flex items-center gap-2 rounded-full border-2 border-white py-1.5 pl-1.5 pr-3.5 text-white shadow-[0_6px_16px_rgba(0,0,0,.3)] ${className}`}
      style={{ background: t.head, ...style }}
    >
      <span className="relative grid size-9 place-items-center rounded-full bg-white/95">
        <img src={thumb} alt="" className="size-8 rounded-full object-cover" />
        <span className="absolute -left-2 -top-2 rounded-full border-2 border-white bg-[#d32f2f] px-1.5 py-px text-[9px] font-black">MỚI</span>
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="hidden max-w-[150px] truncate text-[11px] font-bold sm:block">{b.headline}</span>
        <span className="flex items-center gap-1 text-[12px] font-black tabular-nums text-[#ffea79]">
          <Clock3 size={12} /> {countdown}
        </span>
      </span>
    </button>
  )
}

function Tile({ bg, label, big, unit, mid }: { bg: string; label: string; big: string; unit: string; mid?: boolean }) {
  return (
    <div
      className={`rounded-xl border-2 border-[#ffea79] px-1 py-1.5 text-center text-[10.5px] font-bold leading-tight ${mid ? '-translate-y-1' : ''}`}
      style={{ background: bg }}
    >
      {label}
      <b className="block text-[19px] font-black leading-tight text-[#ffea79]">{big}</b>
      {unit}
    </div>
  )
}

function NavBtn({ dir, onClick, light }: { dir: 'prev' | 'next'; onClick?: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Chiến dịch trước' : 'Chiến dịch sau'}
      className={`grid size-9 shrink-0 place-items-center rounded-full ${light ? 'bg-white/25 hover:bg-white/40' : 'bg-white/30 text-white hover:bg-white/50'}`}
    >
      {dir === 'prev' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Đồng hồ đếm ngược tới giờ chốt, cập nhật mỗi giây */
export function useCountdown(cutoffAt?: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!cutoffAt) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [cutoffAt])
  const ms = cutoffAt ? Math.max(0, new Date(cutoffAt).getTime() - now) : 0
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  return `${d > 0 ? `${d} ngày ` : ''}${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}
