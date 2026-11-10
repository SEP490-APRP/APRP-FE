import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  Flame,
  MapPin,
  PackageCheck,
  Scale,
  ShoppingBasket,
  Tag,
  Truck,
  Users,
} from 'lucide-react'
import bannerImg from '@/assets/farmer-forum-banner.jpg'
import { useCampaignsByPhase } from '@/features/campaign/hooks/useCampaignQueries'
import { formatKg, formatVnd, progressOf, timeLeftLabel } from '@/features/campaign/utils'
import type { CampaignPhase, CampaignResponse } from '@/services'
import logoIcon from '@/assets/logo-icon.png'

type PhaseKey = 'dang-dien-ra' | 'sap-mo' | 'dang-giao' | 'da-hoan-thanh'

type Phase = {
  key: PhaseKey
  phase: CampaignPhase
  label: string
  icon: typeof Flame
  tone: string
  empty: string
  featuredBadge: string
  feedTitle: string
}

const PHASES: Phase[] = [
  { key: 'dang-dien-ra', phase: 'ONGOING', label: 'Đang mở đặt trước', icon: Flame, tone: 'text-[#c82626]', empty: 'Hiện chưa có chiến dịch nào đang mở đặt trước.', featuredBadge: 'Sắp chốt · Cần bạn', feedTitle: 'Chiến dịch đang mở khác' },
  { key: 'sap-mo', phase: 'UPCOMING', label: 'Sắp mở', icon: CalendarClock, tone: 'text-[#8a5a00]', empty: 'Chưa có chiến dịch nào đang gom nhà vườn.', featuredBadge: 'Sắp mở bán', feedTitle: 'Chiến dịch đang gom nhà vườn' },
  { key: 'dang-giao', phase: 'DELIVERING', label: 'Đủ ngưỡng · Đang giao', icon: Truck, tone: 'text-[#2e5d16]', empty: 'Chưa có chiến dịch nào đang thu hoạch và giao hàng.', featuredBadge: 'Đang về tay bạn', feedTitle: 'Nhật ký thu hoạch & giao hàng' },
  { key: 'da-hoan-thanh', phase: 'DONE', label: 'Đã giải cứu xong', icon: PackageCheck, tone: 'text-[#4a6a8a]', empty: 'Chưa có chiến dịch nào hoàn thành.', featuredBadge: 'Câu chuyện thành công', feedTitle: 'Những mùa vụ đã được giải cứu' },
]

export default function CampaignsPage() {
  const [params, setParams] = useSearchParams()
  const current = PHASES.find((p) => p.key === params.get('trang-thai')) ?? PHASES[0]
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, refetch } = useCampaignsByPhase(current.phase, page, 9)
  const selectPhase = (key: PhaseKey) => {
    setPage(0)
    setParams(key === 'dang-dien-ra' ? {} : { 'trang-thai': key }, { replace: true })
  }
  const campaigns = data?.content ?? []
  // Tiêu điểm chỉ ở trang đầu: tab đang mở chọn chiến dịch sắp chốt nhất, tab khác lấy bài mới nhất
  const featured =
    page === 0 && campaigns.length > 0
      ? current.phase === 'ONGOING'
        ? [...campaigns].sort((a, b) => Date.parse(a.cutoffAt) - Date.parse(b.cutoffAt))[0]
        : campaigns[0]
      : null
  const feed = featured ? campaigns.filter((c) => c.campaignId !== featured.campaignId) : campaigns
  const totalFarms = campaigns.reduce((n, c) => n + Number(c.approvedFarmCount || 0), 0)

  return (
    <div className="bg-[#fcf9f1]">
      {/* 1. Banner đầu trang (cùng kiểu với Nông sản tươi / Combo) */}
      <div className="relative w-full h-72 sm:h-84 md:h-96 lg:h-[380px] overflow-hidden flex items-center justify-center text-center shadow-lg">
        <img
          src={bannerImg}
          alt="Các nhà vườn cùng giơ thùng nông sản trong chiến dịch giải cứu"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" aria-hidden />

        <div className="relative z-10 flex flex-col items-center gap-3 px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#ffea79] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Flame size={13} aria-hidden />
            <span>Mỗi thùng bạn đặt · Một mùa vụ không bị bỏ lại</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
            Chiến Dịch Giải Cứu Nông Sản
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/85 font-normal max-w-xl mx-auto leading-relaxed drop-shadow">
            Mỗi thùng bạn đặt trước là một phần mùa vụ không phải đổ bỏ: nhà vườn bán được giá, còn bạn nhận nông sản
            tươi tận gốc.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white/90 font-medium mt-1 shadow-sm">
            <a href="/" className="hover:text-[#ffea79] transition-colors">
              Trang chủ
            </a>
            <span className="text-white/40">›</span>
            <span className="text-[#ffea79] font-bold">Chiến dịch giải cứu</span>
          </div>
        </div>
      </div>

      {/* Bộ lọc giai đoạn: kiểu tab danh mục của trang Câu chuyện nông dân */}
      <div className="page-container pt-6 sm:pt-8">
        <div
          role="tablist"
          aria-label="Lọc chiến dịch theo trạng thái"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
        >
          {PHASES.map((p) => (
            <PhaseTab key={p.key} item={p} active={p.key === current.key} onSelect={() => selectPhase(p.key)} />
          ))}
        </div>
      </div>

      <section id="danh-sach-chien-dich" className="page-container scroll-mt-28 pb-12 pt-6 sm:pt-8">
        {isLoading ? (
          <div className="flex flex-col gap-8">
            <div className="h-[340px] animate-pulse rounded-[28px] bg-[#ede8df]" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-[420px] animate-pulse rounded-2xl bg-[#ede8df]" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <EmptyState
            title="Chưa tải được danh sách chiến dịch"
            text="Kết nối tới máy chủ bị gián đoạn. Bạn thử tải lại nhé."
            action={{ label: 'Tải lại', onClick: () => refetch() }}
          />
        ) : campaigns.length === 0 ? (
          <EmptyState
            title={current.empty}
            text="Khi một vùng trồng cần giải cứu, chiến dịch sẽ xuất hiện ở đây và trên banner trang chủ."
            action={{ label: 'Mua nông sản tươi', href: '/nong-san-tuoi' }}
          />
        ) : (
          <>
            {featured && <FeaturedCampaign campaign={featured} phase={current} />}

            {feed.length > 0 && (
              <>
                <div className={`flex flex-wrap items-end justify-between gap-2 ${featured ? 'mt-12' : ''}`}>
                  <h2 className="text-xl font-black text-[#191f14] sm:text-2xl">
                    {current.feedTitle} ({data?.totalElements != null && featured ? data.totalElements - 1 : feed.length})
                  </h2>
                  <span className="text-xs font-medium text-[#717a6c] sm:text-sm">
                    {totalFarms > 0 ? `Cập nhật trực tiếp từ ${totalFarms} nhà vườn tham gia` : 'Cập nhật trực tiếp từ các vùng trồng'}
                  </span>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 sm:gap-7">
                  {feed.map((c) => (
                    <CampaignCard key={c.campaignId} campaign={c} />
                  ))}
                </div>
              </>
            )}

            {data && data.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={data.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-full border border-[#c9c2b1] bg-white px-4 py-2 text-sm font-bold text-[#2e5d16] disabled:opacity-40"
                >
                  Trang trước
                </button>
                <span className="text-sm font-semibold text-[#42493c]">
                  {data.page + 1} / {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-[#c9c2b1] bg-white px-4 py-2 text-sm font-bold text-[#2e5d16] disabled:opacity-40"
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function PhaseTab({
  item,
  active,
  onSelect,
}: {
  item: Phase
  active: boolean
  onSelect: () => void
}) {
  const { data } = useCampaignsByPhase(item.phase, 0, 1)
  const count = data?.totalElements
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-extrabold transition ${active
        ? 'border-[#2e5d16] bg-[#2e5d16] text-white shadow-md'
        : 'border-[#e4ded2] bg-white text-[#353c2e] hover:border-[#9ed67d] hover:bg-[#f2f9ed]'
        }`}
    >
      <item.icon size={15} aria-hidden className={active ? 'text-[#ffba41]' : item.tone} />
      {item.label}
      {count != null && (
        <span
          className={`min-w-5 rounded-full px-1.5 text-[11px] font-extrabold leading-5 ${active ? 'bg-white/20 text-white' : 'bg-[#f2eee3] text-[#555d4e]'}`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/** Trạng thái hiển thị chung cho thẻ tiêu điểm và thẻ bản tin */
function view(c: CampaignResponse) {
  const isOpen = c.status === 'ACTIVE'
  const isUpcoming = c.status === 'DRAFT'
  const chip = isOpen
    ? timeLeftLabel(c.cutoffAt)
    : isUpcoming
      ? 'Đang gom nhà vườn'
      : c.status === 'COMPLETED'
        ? 'Hoàn thành'
        : c.status === 'CANCELLED'
          ? 'Đã huỷ'
          : 'Đang giao'
  const pct = isUpcoming
    ? c.targetVolumeKg > 0
      ? Math.min(100, (Number(c.approvedSurplusKg ?? 0) / c.targetVolumeKg) * 100)
      : 0
    : progressOf(c)
  const excerpt =
    (c.description ?? '').split(/\r?\n/).map((p) => p.trim()).find(Boolean) ||
    `${c.approvedFarmCount || 'Nhiều'} nhà vườn cần tìm người mua cho ${formatKg(c.targetVolumeKg)} ${(c.categoryName || 'nông sản').toLowerCase()} với giá giải cứu ${formatVnd(c.rescuePricePerKg)}/kg.`
  const date = c.publishedAt ?? c.callPostedAt ?? c.createdAt
  const place = c.collectionSiteAddress || c.collectionSiteName || 'Toàn quốc'
  const byline = c.collectionSiteName ? `Điểm tập kết ${c.collectionSiteName}` : 'Ban điều phối CapNong'
  const progressText = isUpcoming
    ? `${formatKg(c.approvedSurplusKg)} nhà vườn đã góp / ${formatKg(c.targetVolumeKg)}`
    : `${formatKg(c.bookedVolumeKg)} / ${formatKg(c.targetVolumeKg)} đã đặt`
  return { isOpen, isUpcoming, chip, pct, excerpt, date, place, byline, progressText }
}

const fmtDay = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '')

/** Bài tiêu điểm: chiến dịch cần chú ý nhất của tab đang chọn (đang mở thì là chiến dịch sắp chốt nhất) */
function FeaturedCampaign({ campaign: c, phase }: { campaign: CampaignResponse; phase: Phase }) {
  const v = view(c)
  const href = `/chien-dich/${c.campaignId}`
  return (
    <article className="rounded-[28px] border border-[#e4ded2] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:p-6 lg:p-8">
      <div className="grid items-center gap-6 md:grid-cols-12 lg:gap-8">
        <a href={href} className="group relative block overflow-hidden rounded-2xl md:col-span-6 lg:col-span-5">
          <img
            src={c.coverImageUrl || bannerImg}
            alt=""
            className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#c82626] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
            {phase.featuredBadge}
          </span>
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <CalendarClock size={12} /> {v.chip}
          </span>
        </a>

        <div className="flex flex-col md:col-span-6 lg:col-span-7">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[#2e5d16]">
              {c.categoryName || 'Nông sản'}
              {c.season ? ` · ${c.season}` : ''}
            </span>
            <span className="text-[#b6ad9b]">•</span>
            <span className="inline-flex items-center gap-1 text-[#6e7668]">
              <MapPin size={12} /> {v.place}
            </span>
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#191f14] sm:text-3xl lg:text-[34px]">
            <a href={href} className="hover:text-[#2e5d16]">
              {c.title}
            </a>
          </h2>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#555d4e] sm:text-[15px]">{v.excerpt}</p>

          {/* Con số chiến dịch thay cho lượt thích / bình luận của blog */}
          <div className="mt-5 border-t border-[#ede7dc] pt-4">
            <div className="h-2 rounded-full bg-[#ede8df]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2e5d16] to-[#9ed67d]" style={{ width: `${v.pct}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-[#5c6555] sm:text-[13px]">
              <span className="inline-flex items-center gap-1.5">
                <Scale size={15} className="text-[#2e5d16]" /> {v.progressText}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} className="text-[#2e5d16]" /> {c.approvedFarmCount} nhà vườn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Tag size={15} className="text-[#c82626]" /> {formatVnd(c.rescuePricePerKg)}/kg
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={href}
              className="inline-flex items-center gap-2 rounded-full bg-[#f2eee3] px-5 py-2.5 text-sm font-extrabold text-[#2b3324] transition hover:bg-[#e8e1d1]"
            >
              Đọc toàn bộ chiến dịch <ArrowRight size={15} />
            </a>
            {v.isOpen && (
              <a
                href={`${href}#dat-truoc`}
                className="inline-flex items-center gap-2 rounded-full bg-[#2e5d16] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#254d12]"
              >
                <ShoppingBasket size={16} /> Đặt trước thùng ngay
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

/** Thẻ bản tin: đầu thẻ là điểm tập kết + địa điểm + mốc thời gian, giống thẻ bài của nhà vườn */
function CampaignCard({ campaign: c }: { campaign: CampaignResponse }) {
  const v = view(c)
  return (
    <a
      href={`/chien-dich/${c.campaignId}`}
      className="group flex flex-col gap-4 rounded-2xl border border-[#e6dfd2] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e0dad0] bg-[#fdfbf6] shadow-xs">
          <img src={logoIcon} alt="" className="h-6 w-6 object-contain" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-extrabold text-[#191f14]">{v.byline}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[#717a6c]">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{v.place}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-[#f2eee3] px-2.5 py-1 text-[10px] font-bold text-[#555d4e]">
          {v.isOpen || v.isUpcoming ? v.chip : fmtDay(v.date) || v.chip}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl">
        <img
          src={c.coverImageUrl || bannerImg}
          alt=""
          loading="lazy"
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#2e5d16]">
          {c.categoryName || 'Nông sản'}
          {c.season ? ` · ${c.season}` : ''}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-[#ffba41] px-2.5 py-1 text-[11px] font-extrabold text-[#3d2a00]">
          {formatVnd(c.rescuePricePerKg)}/kg
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-lg font-black leading-snug text-[#191f14] group-hover:text-[#2e5d16]">{c.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#555d4e]">{v.excerpt}</p>
        <div className="mt-auto pt-4">
          <div className="h-1.5 rounded-full bg-[#ede8df]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#2e5d16] to-[#9ed67d]" style={{ width: `${v.pct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#ede7dc] pt-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#5c6555]">
              <Users size={13} /> {c.approvedFarmCount} nhà vườn · {Math.round(v.pct)}%
            </span>
            <span className="inline-flex items-center gap-1 font-extrabold text-[#2e5d16]">
              Đọc chiến dịch <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

function EmptyState({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action: { label: string; href?: string; onClick?: () => void }
}) {
  const cls =
    'mt-5 inline-flex items-center gap-2 rounded-full bg-[#4a7c2f] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2b5619]'
  return (
    <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-[#c9c2b1] bg-white px-6 py-14 text-center">
      <img src={logoIcon} alt="CapNong" className="h-16 w-16 object-contain" />
      <h3 className="mt-4 text-lg font-extrabold text-[#1c1c18]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-[#42493c]">{text}</p>
      {action.href ? (
        <a href={action.href} className={cls}>
          {action.label} <ArrowRight size={16} />
        </a>
      ) : (
        <button type="button" onClick={action.onClick} className={cls}>
          {action.label}
        </button>
      )}
    </div>
  )
}
