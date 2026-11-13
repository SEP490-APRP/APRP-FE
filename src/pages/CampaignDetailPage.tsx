import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Info,
  MapPin,
  Navigation,
  ShoppingBasket,
  Sprout,
  Pencil,
  Wallet,
  X,
  Loader2,
  LogIn,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import bannerImg from '@/assets/farmer-forum-banner.jpg'
import { useCampaign } from '@/features/campaign/hooks/useCampaignQueries'
import { CRATE_SIZES, formatKg, formatVnd, progressOf, timeLeftLabel } from '@/features/campaign/utils'
import { adminCampaignService, campaignService, type CampaignResponse, type CrateSize } from '@/services'
import logoIcon from '@/assets/logo-icon.png'
import { useMyWallet } from '@/features/wallet/hooks/useWalletQueries'
import { AddressPicker, composeAddress, EMPTY_ADDRESS, type AddressValue } from '@/components/common/AddressPicker'
import comboImg from '@/assets/combo-green.jpg'
import farmerImg from '@/assets/hero-farmer.jpg'
import { RegisterDialog } from '@/pages/farmer/Campaigns'
import { useAuth } from '@/stores'
import { getErrorMessage } from '@/utils'
import { RichTextContent, htmlToPlainText, isHtmlContent } from '@/components/common/RichTextEditor/RichTextContent'

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

const STATUS_LABEL: Record<CampaignResponse['status'], string> = {
  DRAFT: 'Sắp mở',
  ACTIVE: 'Đang mở đặt trước',
  THRESHOLD_MET: 'Đã đủ ngưỡng',
  FULFILLING: 'Đang thu hoạch & giao',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã huỷ',
}

/** Trang chi tiết chiến dịch, trình bày như một bài báo: tiêu đề, sapo, ảnh, thân bài, bản đồ, rồi mới tới phần tham gia. */
export default function CampaignDetailPage() {
  const { campaignId } = useParams()
  const [params] = useSearchParams()
  const id = Number(campaignId) || null
  const { user } = useAuth()
  // Admin bấm "Xem bài viết": đọc qua API admin để xem được cả bản nháp chưa công khai
  const preview = params.get('xem-truoc') === '1' && user?.role === 'admin'
  const publicQ = useCampaign(preview ? null : id)
  const adminQ = useQuery({
    queryKey: ['admin-campaigns', 'one', id],
    queryFn: () => adminCampaignService.get(id as number),
    enabled: preview && !!id,
  })
  const { data: c, isLoading, isError } = preview ? adminQ : publicQ

  useEffect(() => {
    if (c?.title) document.title = `${c.title} · CapNong`
  }, [c?.title])

  // Bấm "Đặt trước thùng ngay" từ trang danh sách: nội dung tải xong mới cuộn tới đúng khung
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!c || !hash) return
    const t = window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    return () => window.clearTimeout(t)
  }, [c])

  if (isLoading) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-[#ede8df]" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-[#ede8df]" />
        </div>
        <div className="mx-auto mt-8 h-[360px] max-w-5xl animate-pulse rounded-3xl bg-[#ede8df]" />
      </div>
    )
  }

  if (isError || !c) {
    return (
      <div className="page-container flex flex-col items-center py-24 text-center">
        <h1 className="text-2xl font-black text-[#1c1c18]">Không tìm thấy chiến dịch</h1>
        <p className="mt-2 text-sm text-[#42493c]">Chiến dịch có thể đã bị gỡ hoặc đường dẫn không đúng.</p>
        <a
          href="/chien-dich"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4a7c2f] px-5 py-2.5 text-sm font-bold text-white"
        >
          <ArrowLeft size={16} /> Xem các chiến dịch khác
        </a>
      </div>
    )
  }

  return <Article c={c} preview={preview} />
}

/** Nhà vườn còn đăng ký góp hàng được: lời kêu gọi đã đăng (DRAFT) hoặc đang mở bán, và chưa qua hạn chốt */
const acceptsFarms = (c: CampaignResponse) =>
  ((c.status === 'DRAFT' && !!c.callPostedAt) || c.status === 'ACTIVE') && Date.parse(c.cutoffAt) > Date.now()

function Article({ c, preview }: { c: CampaignResponse; preview: boolean }) {
  const progress = useReadingProgress()
  const richHtml = isHtmlContent(c.description) ? c.description! : null
  const paragraphs = useMemo(() => (richHtml ? [] : splitParagraphs(c.description)), [richHtml, c.description])
  const pct = progressOf(c)
  const depositPct = Math.round(Number(c.depositPercent ?? 0) * 100)
  const tag = [c.categoryName, c.season].filter(Boolean).join(' · ') || 'Nông sản'
  const posted = fmtDate(c.publishedAt ?? c.callPostedAt ?? c.createdAt)
  const farmOpen = acceptsFarms(c)
  const hasLocation = !!c.collectionSiteAddress || c.collectionSiteLatitude != null

  return (
    <article className="bg-[#fcf9f1] pb-20">
      {/* Thanh tiến độ đọc */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent" aria-hidden>
        <div className="h-full bg-[#ffba41] transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {preview && (
        <div className="border-b border-[#f0d77a] bg-[#fff6d1] px-4 py-2.5 text-center text-xs font-bold text-[#6b4e00] sm:text-sm">
          Bản xem trước cho admin · Trạng thái: {STATUS_LABEL[c.status]}
          {c.status === 'DRAFT' && !c.callPostedAt ? ' · Người dùng chưa thấy bài này cho tới khi đăng lời kêu gọi hoặc mở bán.' : ''}
        </div>
      )}

      {/* Banner ảnh bìa + tiêu đề, đồng bộ với các trang khác */}
      <header className="relative w-full overflow-hidden">
        <img
          src={c.coverImageUrl || bannerImg}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" aria-hidden />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center sm:py-20 lg:py-24">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md sm:text-sm"
          >
            <a href="/" className="hover:text-[#ffea79]">Trang chủ</a>
            <span className="text-white/40">›</span>
            <a href="/chien-dich" className="hover:text-[#ffea79]">Chiến dịch</a>
            <span className="text-white/40">›</span>
            <span className="font-bold text-[#ffea79]">{tag}</span>
          </nav>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl">{c.title}</h1>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/85 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffba41] px-3 py-1 font-extrabold text-[#3d2a00]">
              {STATUS_LABEL[c.status]}
            </span>
            {posted && <span>Đăng ngày {posted}</span>}
            <span aria-hidden className="text-white/40">•</span>
            <span>Chốt đơn {fmtDate(c.cutoffAt)}</span>
            <span aria-hidden className="text-white/40">•</span>
            <span>{readMinutes(c)} phút đọc</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="mx-auto w-full min-w-0 max-w-3xl">
            {/* Thân bài: giữ đúng định dạng soạn trong CKEditor */}
            {richHtml ? (
              <RichTextContent html={richHtml} />
            ) : paragraphs.length ? (
              paragraphs.map((p, i) => <Prose key={i}>{p}</Prose>)
            ) : (
              <Prose>{defaultLead(c)}</Prose>
            )}

            {/* Con số của chiến dịch (mẫu B: thanh mốc ngưỡng & mục tiêu) */}
            <CampaignNumbers c={c} depositPct={depositPct} />

            {/* Tác giả bài viết */}
            <div className="mb-10 flex items-center gap-2.5 border-y border-[#e4ddcc] py-3.5 text-sm text-[#6b7363]">
              <img src={logoIcon} alt="" className="h-9 w-9 rounded-full border border-[#e4ddcc] bg-white object-contain p-1" />
              <span className="leading-tight">
                <span className="block font-bold text-[#1c1c18]">Ban điều phối CapNong</span>
                <span className="text-xs">
                  {[c.season, c.collectionSiteName && `Điểm tập kết ${c.collectionSiteName}`].filter(Boolean).join(' · ') || 'Chiến dịch giải cứu'}
                </span>
              </span>
            </div>

            {/* Hai cột: hành trình nông sản | tiền cọc */}
            <div className="grid gap-5 sm:grid-cols-2">
              <InfoCard icon={Truck} title="Từ vườn tới bạn">
                <InfoStep n={1}>
                  Nhà vườn mang hàng tới {c.collectionSiteName ? <b>{c.collectionSiteName}</b> : 'điểm tập kết'}.
                </InfoStep>
                <InfoStep n={2}>CapNong cân, đóng thùng 10 / 20 / 50 kg, dán QR truy xuất vườn.</InfoStep>
                <InfoStep n={3}>
                  Giao tận nơi sau ngày chốt {fmtDate(c.cutoffAt)}
                  {c.deliveryDate ? `, dự kiến từ ${fmtDate(c.deliveryDate)}` : ''}.
                </InfoStep>
              </InfoCard>
              <InfoCard icon={ShieldCheck} title="Tiền cọc an toàn">
                <InfoStep n={1}>Cọc trước {depositPct}% qua PayOS, CapNong giữ hộ.</InfoStep>
                <InfoStep n={2}>Phần còn lại trả khi nhận hàng.</InfoStep>
                <InfoStep n={3}>Chưa đủ {formatKg(c.minThresholdKg)} tới ngày chốt: tự huỷ, hoàn 100% cọc về ví.</InfoStep>
              </InfoCard>
            </div>

            {/* Vị trí điểm tập kết: chốt cuối bài */}
            {hasLocation && <LocationSection c={c} />}

            {/* Hết bài: phần tham gia cho người mua và nhà vườn */}
            <div className="my-12 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-[#a39b8a]" aria-hidden>
              <span className="h-px flex-1 bg-[#e4ddcc]" />
              Cùng tham gia
              <span className="h-px flex-1 bg-[#e4ddcc]" />
            </div>

            <JoinSection c={c} farmOpen={farmOpen} />

            <a href="/chien-dich" className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-[#2b5619] hover:underline">
              <ArrowLeft size={16} /> Xem các chiến dịch khác
            </a>
          </div>

          {/* Cột phải: tóm tắt nhanh, bám theo khi cuộn */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4 rounded-3xl border border-[#e4ddcc] bg-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#4a7c2f]">Tóm tắt chiến dịch</p>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-[#1c1c18]">{Math.round(pct)}%</span>
                  <span className="text-xs text-[#6b7363]">
                    {formatKg(c.bookedVolumeKg)} / {formatKg(c.targetVolumeKg)}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#ede8df]">
                  <div className="h-full rounded-full bg-[#4a7c2f]" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                <SideRow label="Giá giải cứu" value={`${formatVnd(c.rescuePricePerKg)}/kg`} />
                <SideRow label="Chốt đơn" value={fmtDate(c.cutoffAt) ?? '—'} />
                {c.deliveryDate && <SideRow label="Giao dự kiến" value={fmtDate(c.deliveryDate) ?? '—'} />}
                <SideRow label="Thời gian" value={c.status === 'ACTIVE' || farmOpen ? timeLeftLabel(c.cutoffAt) : STATUS_LABEL[c.status]} />
              </dl>
              {c.status === 'ACTIVE' && (
                <a
                  href="#dat-truoc"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4a7c2f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2b5619]"
                >
                  <ShoppingBasket size={16} /> Đặt trước thùng
                </a>
              )}
              {farmOpen && (
                <a
                  href="#nha-vuon"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#4a7c2f] px-4 py-2.5 text-sm font-bold text-[#2b5619] hover:bg-[#f2f9ed]"
                >
                  <Sprout size={16} /> Nhà vườn góp hàng
                </a>
              )}
              {hasLocation && (
                <a href="#vi-tri" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#6b7363] hover:text-[#2b5619]">
                  <MapPin size={14} /> Xem vị trí điểm tập kết
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────── Con số của chiến dịch (mẫu B) ─────────────────────────── */

function CampaignNumbers({ c, depositPct }: { c: CampaignResponse; depositPct: number }) {
  const booked = Number(c.bookedVolumeKg ?? 0)
  const target = Number(c.targetVolumeKg ?? 0)
  const threshold = Number(c.minThresholdKg ?? 0)
  const pct = progressOf(c)
  const thresholdPct = target > 0 ? Math.min(100, (threshold / target) * 100) : 0
  const needForThreshold = Math.max(0, threshold - booked)
  const needForTarget = Math.max(0, target - booked)
  const open = c.status === 'ACTIVE'
  const lots = Number(c.approvedLotCount ?? 0)
  const farms = Number(c.approvedFarmCount ?? 0)

  const badge =
    needForThreshold > 0
      ? { text: `Cần thêm ${formatKg(needForThreshold)} để đủ ngưỡng`, tone: 'bg-[#fff1cc] text-[#6b4e00]' }
      : needForTarget > 0
        ? { text: `Đã đủ ngưỡng · còn ${formatKg(needForTarget)} tới mục tiêu`, tone: 'bg-[#e7f3de] text-[#2b5619]' }
        : { text: 'Đã đạt mục tiêu', tone: 'bg-[#e7f3de] text-[#2b5619]' }

  return (
    <figure className="mb-6 mt-10 rounded-3xl border border-[#e4ddcc] bg-white p-6 shadow-sm sm:p-7">
      <figcaption className="text-xs font-extrabold uppercase tracking-wider text-[#4a7c2f]">Con số của chiến dịch</figcaption>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="text-4xl font-black text-[#1c1c18] sm:text-[40px]">{formatKg(booked)}</span>{' '}
          <span className="text-sm text-[#6b7363]">đã được đặt trước</span>
        </p>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${badge.tone}`}>{badge.text}</span>
      </div>

      {/* Thanh mốc: 0 · ngưỡng · mục tiêu */}
      <div className="relative mb-11 mt-6" role="img" aria-label={`Đã đặt ${formatKg(booked)} trên mục tiêu ${formatKg(target)}, ngưỡng ${formatKg(threshold)}`}>
        <div className="h-4 rounded-full bg-[#ede8df]" />
        <div
          className="absolute left-0 top-0 h-4 rounded-full bg-gradient-to-r from-[#4a7c2f] to-[#9ed67d]"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute -top-2 h-8 w-[3px] rounded bg-[#c27c00]" style={{ left: `${thresholdPct}%` }} />
        <span className="absolute top-7 left-0 text-xs text-[#6b7363]">0 kg</span>
        <span
          className="absolute top-7 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-[#c27c00]"
          style={{ left: `${Math.min(85, Math.max(15, thresholdPct))}%` }}
        >
          Ngưỡng {formatKg(threshold)}
        </span>
        <span className="absolute top-7 right-0 text-xs font-semibold text-[#6b7363]">Mục tiêu {formatKg(target)}</span>
      </div>

      <p className="mb-4 flex gap-2 rounded-2xl bg-[#fff8e6] p-3 text-[13px] leading-relaxed text-[#5c4300]">
        <Info size={16} className="mt-0.5 shrink-0 text-[#c27c00]" />
        <span>
          <b>Ngưỡng {formatKg(threshold)}</b> là mức tối thiểu để chiến dịch được giao. Đủ {formatKg(threshold)} trước ngày chốt{' '}
          {fmtDate(c.cutoffAt)} thì nhà vườn thu hoạch và giao hàng; chưa đủ thì chiến dịch tự huỷ và hoàn 100% tiền cọc về ví.
        </span>
      </p>

      <div className="flex flex-wrap gap-2.5">
        <Chip icon={Wallet}>{formatVnd(c.rescuePricePerKg)}/kg</Chip>
        <Chip icon={Sprout}>
          {farms} nhà vườn{lots > farms ? ` · ${lots} lô` : ''}
        </Chip>
        <Chip icon={ShieldCheck}>Cọc {depositPct}%</Chip>
        <Chip icon={CalendarClock} warn={open}>
          Chốt {fmtDate(c.cutoffAt)}
          {open ? ` · ${timeLeftLabel(c.cutoffAt).toLowerCase()}` : ''}
        </Chip>
      </div>
    </figure>
  )
}

function Chip({ icon: Icon, warn, children }: { icon: typeof Wallet; warn?: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4ddcc] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1c18]">
      <Icon size={15} className={warn ? 'text-[#c27c00]' : 'text-[#4a7c2f]'} />
      {children}
    </span>
  )
}

/* ─────────────────────────── Bản đồ điểm tập kết ─────────────────────────── */

function LocationSection({ c }: { c: CampaignResponse }) {
  const hasCoord = c.collectionSiteLatitude != null && c.collectionSiteLongitude != null
  const q = hasCoord ? `${c.collectionSiteLatitude},${c.collectionSiteLongitude}` : (c.collectionSiteAddress ?? '')
  const embed = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=vi&output=embed`
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
  return (
    <section id="vi-tri" className="scroll-mt-24">
      <H2>Điểm tập kết của chiến dịch</H2>
      <div className="mt-5 overflow-hidden rounded-3xl border border-[#e4ddcc] bg-white shadow-sm">
        <iframe
          title="Bản đồ điểm tập kết"
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-72 w-full border-0 sm:h-80"
        />
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f9ed] text-[#2b5619]">
              <MapPin size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-black text-[#1c1c18]">{c.collectionSiteName || 'Điểm tập kết'}</p>
              {c.collectionSiteAddress && <p className="text-sm text-[#42493c]">{c.collectionSiteAddress}</p>}
            </div>
          </div>
          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#4a7c2f] px-4 py-2 text-sm font-bold text-[#2b5619] hover:bg-[#f2f9ed]"
          >
            <Navigation size={15} /> Chỉ đường
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Cùng tham gia: 2 cột người mua | nhà vườn ─────────────────────────── */

function JoinSection({ c, farmOpen }: { c: CampaignResponse; farmOpen: boolean }) {
  const { user } = useAuth()
  const canOrder = c.status === 'ACTIVE' && user?.role === 'buyer'
  const [ordering, setOrdering] = useState(false)

  // Link "#dat-truoc" (cột tóm tắt, trang danh sách) mở popup đặt trước thay vì cuộn tới form
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === '#dat-truoc' && canOrder) setOrdering(true)
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [canOrder])

  const close = () => {
    setOrdering(false)
    if (window.location.hash === '#dat-truoc') history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <BuyerJoinCard c={c} onOrder={canOrder ? () => setOrdering(true) : undefined} />
        <FarmJoinBox c={c} open={farmOpen} />
      </div>
      {ordering && canOrder && <PreOrderModal c={c} onClose={close} />}
    </>
  )
}

/** Popup "Góp một thùng cho chiến dịch này": chọn thùng, người nhận, địa chỉ rồi sang bước xác nhận */
function PreOrderModal({ c, onClose }: { c: CampaignResponse; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-end justify-center bg-black/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dat-truoc-title"
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-[#42493c] hover:bg-[#f2eee3]"
        >
          <X size={20} />
        </button>
        <div className="overflow-y-auto">
          <PreOrderBox c={c} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

function JoinCard({
  id,
  image,
  badge,
  badgeIcon: BadgeIcon,
  title,
  points,
  children,
}: {
  id?: string
  image: string
  badge: string
  badgeIcon: typeof Sprout
  title: string
  points: string[]
  children: ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col overflow-hidden rounded-3xl border border-[#e4ddcc] bg-white shadow-sm">
      <div className="relative h-40 overflow-hidden">
        <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#2b5619] shadow">
          <BadgeIcon size={14} /> {badge}
        </span>
        <h2 className="absolute inset-x-4 bottom-3 text-xl font-black leading-tight text-white drop-shadow">{title}</h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <ul className="flex flex-col gap-2 text-sm text-[#42493c]">
          {points.map((p) => (
            <li key={p} className="flex gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-[#4a7c2f]" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto">{children}</div>
      </div>
    </section>
  )
}

function BuyerJoinCard({ c, onOrder }: { c: CampaignResponse; onOrder?: () => void }) {
  const { user } = useAuth()
  const depositPct = Math.round(Number(c.depositPercent ?? 0) * 100)
  const remainingKg = Math.max(0, Number(c.remainingVolumeKg ?? c.targetVolumeKg - c.bookedVolumeKg))
  const closedText =
    c.status === 'DRAFT'
      ? 'Đang gom hàng từ nhà vườn. Phần đặt trước sẽ mở ngay khi CapNong duyệt đủ hàng.'
      : c.status === 'COMPLETED'
        ? `Chiến dịch đã giải cứu ${formatKg(c.bookedVolumeKg)}. Cảm ơn bạn đã đồng hành!`
        : c.status === 'CANCELLED'
          ? 'Chiến dịch đã huỷ, tiền cọc đã được hoàn về ví CapNong của người đặt.'
          : 'Đã đủ ngưỡng và đóng đặt trước, nông sản đang được thu hoạch và giao.'
  return (
    <JoinCard
      id="dat-truoc"
      image={comboImg}
      badge="Người mua"
      badgeIcon={ShoppingBasket}
      title="Đặt trước một thùng"
      points={[
        `Thùng 10 / 20 / 50 kg, giá ${formatVnd(c.rescuePricePerKg)}/kg`,
        `Cọc ${depositPct}% qua PayOS, còn lại trả khi nhận`,
        'Không đủ ngưỡng thì hoàn 100% cọc',
      ]}
    >
      {c.status !== 'ACTIVE' ? (
        <p className="rounded-2xl bg-[#f5f1e6] p-3.5 text-sm text-[#42493c]">
          <b className="block text-[#1c1c18]">{STATUS_LABEL[c.status]}</b>
          {closedText}
        </p>
      ) : !user ? (
        <a href="/dang-nhap" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4a7c2f] px-5 py-3 text-sm font-bold text-white hover:bg-[#2b5619]">
          <LogIn size={16} /> Đăng nhập khách hàng
        </a>
      ) : user.role === 'buyer' ? (
        <button type="button" onClick={onOrder} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4a7c2f] px-5 py-3 text-sm font-bold text-white hover:bg-[#2b5619]">
          <ShoppingBasket size={16} /> Đặt trước ngay · còn {formatKg(remainingKg)}
        </button>
      ) : (
        <p className="rounded-2xl bg-[#f5f1e6] p-3.5 text-sm text-[#42493c]">Chỉ tài khoản người mua mới đặt trước được.</p>
      )}
    </JoinCard>
  )
}

function FarmJoinBox({ c, open }: { c: CampaignResponse; open: boolean }) {
  const { user } = useAuth()
  const [registering, setRegistering] = useState(false)
  const [done, setDone] = useState(false)
  const what = (c.categoryName || 'nông sản').toLowerCase()

  return (
    <JoinCard
      id="nha-vuon"
      image={farmerImg}
      badge="Nhà vườn"
      badgeIcon={Sprout}
      title="Góp lô hàng đang dư"
      points={[
        `Bán lô ${what} dư với giá tới ${formatVnd(c.rescuePricePerKg)}/kg`,
        'Mang hàng tới điểm tập kết, cân tại chỗ',
        'Được góp nhiều lô, mỗi lô duyệt riêng',
      ]}
    >
      {!open ? (
        <p className="rounded-2xl bg-[#f5f1e6] p-3.5 text-sm text-[#42493c]">Chiến dịch hiện không nhận thêm lô hàng từ nhà vườn.</p>
      ) : done ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#f2f9ed] p-3.5 text-sm text-[#2b3a24]">
          <span className="inline-flex items-center gap-2 font-bold">
            <Check size={16} className="text-[#4a7c2f]" /> Đã gửi đăng ký lô hàng.
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRegistering(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#4a7c2f] px-4 py-2 text-xs font-bold text-white hover:bg-[#2b5619]"
            >
              <Sprout size={14} /> Đăng ký thêm lô
            </button>
            <a href="/shop?tab=campaigns" className="text-xs font-bold text-[#2b5619] underline">
              Theo dõi trong Kênh Nhà Vườn
            </a>
          </div>
        </div>
      ) : !user ? (
        <a href="/dang-nhap" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4a7c2f] px-5 py-3 text-sm font-bold text-white hover:bg-[#2b5619]">
          <LogIn size={16} /> Đăng nhập nhà vườn
        </a>
      ) : user.role === 'shop' ? (
        <button
          type="button"
          onClick={() => setRegistering(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4a7c2f] px-5 py-3 text-sm font-bold text-white hover:bg-[#2b5619]"
        >
          <Sprout size={16} /> Đăng ký góp lô hàng
        </button>
      ) : (
        <p className="rounded-2xl bg-[#f5f1e6] p-3.5 text-sm text-[#42493c]">Chỉ tài khoản nhà vườn mới đăng ký góp hàng được.</p>
      )}

      {registering && (
        <RegisterDialog
          c={c}
          onClose={() => setRegistering(false)}
          onDone={() => {
            setRegistering(false)
            setDone(true)
          }}
        />
      )}
    </JoinCard>
  )
}

/* ─────────────────────────── Khung đặt trước ở cuối bài ─────────────────────────── */

const CRATE_ENUM: Record<(typeof CRATE_SIZES)[number], CrateSize> = { 10: 'KG_10', 20: 'KG_20', 50: 'KG_50' }

function PreOrderBox({ c }: { c: CampaignResponse }) {
  const { user } = useAuth()
  const [crate, setCrate] = useState<(typeof CRATE_SIZES)[number]>(20)
  const [qty, setQty] = useState(1)
  const [name, setName] = useState(user?.fullName || user?.name || '')
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || '')
  const [addr, setAddr] = useState<AddressValue>(EMPTY_ADDRESS)
  const [addrError, setAddrError] = useState<string | null>(null)
  const address = composeAddress(addr)
  const [note, setNote] = useState('')

  const totalKg = crate * qty
  const total = totalKg * Number(c.rescuePricePerKg ?? 0)
  const deposit = total * Number(c.depositPercent ?? 0)
  const remainingKg = Math.max(0, Number(c.remainingVolumeKg ?? c.targetVolumeKg - c.bookedVolumeKg))
  const overLimit = totalKg > remainingKg

  const [confirming, setConfirming] = useState(false)
  // Trả cọc bằng ví trước, phần còn lại qua PayOS
  const [payWithWallet, setPayWithWallet] = useState(false)
  const { data: myWallet } = useMyWallet(user?.role === 'buyer')
  const walletBalance = Math.max(0, Math.floor(Number(myWallet?.balance ?? 0) - Number(myWallet?.frozenBalance ?? 0)))
  const order = useMutation({
    mutationFn: () =>
      campaignService.createPreOrder(c.campaignId, {
        crateSize: CRATE_ENUM[crate],
        crateQuantity: qty,
        recipientName: name.trim(),
        recipientPhone: phone.trim(),
        shippingAddress: address,
        shippingLatitude: addr.lat,
        shippingLongitude: addr.lng,
        note: note.trim() || undefined,
        useWallet: payWithWallet && walletBalance > 0,
      }),
    onSuccess: (res) => {
      if (res.checkoutUrl) window.location.href = res.checkoutUrl
      // Ví trả đủ cọc: không qua PayOS, sang trang kết quả cọc luôn
      else window.location.href = `/payment/result?type=campaign&preOrderId=${res.preOrderId}`
    },
  })

  // Bước 1 chỉ kiểm tra form rồi mở bước xác nhận; tạo đơn và sang PayOS ở bước 2
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!addr.wardCode || !addr.detail.trim()) {
      setAddrError('Chọn Tỉnh/Thành phố, Phường/Xã và nhập địa chỉ cụ thể để giao hàng.')
      return
    }
    setAddrError(null)
    if (!overLimit) {
      order.reset()
      setConfirming(true)
    }
  }

  const isBuyer = user?.role === 'buyer'

  return (
    <section className="p-6 sm:p-8">
      <h2 id="dat-truoc-title" className="pr-10 text-2xl font-black text-[#1c1c18]">
        Góp một thùng cho chiến dịch này
      </h2>
      <p className="mt-1 text-sm text-[#42493c]">
        Còn {formatKg(remainingKg)} có thể đặt · {timeLeftLabel(c.cutoffAt).toLowerCase()} trước khi chốt đơn.
      </p>

      {!user ? (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl bg-[#f5f1e6] p-5">
          <p className="text-sm text-[#42493c]">Bạn cần đăng nhập tài khoản người mua để đặt trước thùng.</p>
          <a href="/dang-nhap" className="inline-flex items-center gap-2 rounded-full bg-[#4a7c2f] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2b5619]">
            <LogIn size={16} /> Đăng nhập để đặt trước
          </a>
        </div>
      ) : !isBuyer ? (
        <p className="mt-6 rounded-2xl bg-[#f5f1e6] p-5 text-sm text-[#42493c]">
          Chỉ tài khoản người mua mới đặt trước được. Bạn đang đăng nhập bằng tài khoản {user.role}.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
          <fieldset>
            <legend className="text-sm font-bold text-[#1c1c18]">Cỡ thùng</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {CRATE_SIZES.map((kg) => (
                <button
                  key={kg}
                  type="button"
                  aria-pressed={crate === kg}
                  onClick={() => setCrate(kg)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${crate === kg ? 'border-[#4a7c2f] bg-[#f2f9ed] ring-2 ring-[#4a7c2f]/30' : 'border-[#e4ddcc] hover:border-[#9ed67d]'
                    }`}
                >
                  <span className="block text-base font-black text-[#1c1c18]">{kg} kg</span>
                  <span className="block text-xs text-[#6b7363]">{formatVnd(kg * Number(c.rescuePricePerKg))}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-[#1c1c18]">Số thùng</span>
            <div className="inline-flex items-center rounded-full border border-[#e4ddcc]">
              <button type="button" aria-label="Bớt một thùng" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 text-[#2b5619] disabled:opacity-40" disabled={qty <= 1}>
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-black" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Thêm một thùng" onClick={() => setQty((q) => Math.min(99, q + 1))} className="p-2.5 text-[#2b5619]">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Người nhận" value={name} onChange={setName} autoComplete="name" />
            <Field label="Số điện thoại" value={phone} onChange={setPhone} autoComplete="tel" inputMode="tel" />
            <div className="flex flex-col gap-2.5 sm:col-span-2">
              <span className="text-sm font-bold text-[#1c1c18]">Địa chỉ giao hàng</span>
              <AddressPicker value={addr} onChange={setAddr} required />
              {user?.address && !addr.provinceCode && (
                <p className="text-xs text-[#6b7363]">Địa chỉ trong hồ sơ: {user.address}</p>
              )}
              {addrError && <p className="text-sm font-semibold text-[#b3261e]">{addrError}</p>}
            </div>
            <div className="sm:col-span-2">
              <Field label="Ghi chú (không bắt buộc)" value={note} onChange={setNote} required={false} />
            </div>
          </div>

          <dl className="rounded-2xl bg-[#f5f1e6] p-4 text-sm">
            <Row label={`${qty} thùng × ${crate} kg`} value={formatKg(totalKg)} />
            <Row label="Tạm tính" value={formatVnd(total)} />
            <Row label={`Cọc ngay (${Math.round(Number(c.depositPercent) * 100)}%)`} value={formatVnd(deposit)} strong />
            <Row label="Trả khi nhận hàng" value={formatVnd(total - deposit)} />
          </dl>

          {overLimit && (
            <p className="text-sm font-semibold text-[#b3261e]">Chiến dịch chỉ còn {formatKg(remainingKg)}, bạn giảm số thùng nhé.</p>
          )}

          <button
            type="submit"
            disabled={order.isPending || overLimit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4a7c2f] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-[#4a7c2f]/30 transition hover:bg-[#2b5619] disabled:opacity-60"
          >
            <ArrowRight size={18} />
            Tiếp tục xác nhận đặt trước
          </button>
        </form>
      )}
      {confirming && (
        <ConfirmPreOrder
          c={c}
          crate={crate}
          qty={qty}
          total={total}
          deposit={deposit}
          walletBalance={walletBalance}
          payWithWallet={payWithWallet}
          onToggleWallet={setPayWithWallet}
          recipient={{ name: name.trim(), phone: phone.trim(), address, note: note.trim() }}
          pending={order.isPending || order.isSuccess}
          error={order.isError ? getErrorMessage(order.error, 'Chưa tạo được đơn đặt trước, bạn thử lại nhé.') : null}
          onPay={() => order.mutate()}
          onClose={() => !order.isPending && setConfirming(false)}
        />
      )}
    </section>
  )
}

/** Bước xác nhận kiểu trang thanh toán: xem lại thùng, địa chỉ, khoản cọc và điều kiện hoàn cọc trước khi sang PayOS */
function ConfirmPreOrder({
  c,
  crate,
  qty,
  total,
  deposit,
  walletBalance,
  payWithWallet,
  onToggleWallet,
  recipient,
  pending,
  error,
  onPay,
  onClose,
}: {
  c: CampaignResponse
  crate: number
  qty: number
  total: number
  deposit: number
  walletBalance: number
  payWithWallet: boolean
  onToggleWallet: (v: boolean) => void
  recipient: { name: string; phone: string; address: string; note: string }
  pending: boolean
  error: string | null
  onPay: () => void
  onClose: () => void
}) {
  const [agreed, setAgreed] = useState(false)
  const walletUse = payWithWallet ? Math.min(walletBalance, Math.round(deposit)) : 0
  const payosDue = Math.max(0, Math.round(deposit) - walletUse)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  const pct = Math.round(Number(c.depositPercent) * 100)
  const steps = ['Chọn thùng', 'Xác nhận', 'Cọc qua PayOS']

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="xac-nhan-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-[#fcf9f1] shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#e4ddcc] bg-white px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <h2 id="xac-nhan-title" className="text-lg font-black text-[#1c1c18] sm:text-xl">Xác nhận đặt trước</h2>
            <ol className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i === 0 ? 'bg-[#4a7c2f] text-white' : i === 1 ? 'bg-[#ffba41] text-[#3d2a00]' : 'bg-[#ede8df] text-[#6b7363]'}`}>
                    {i === 0 ? <Check size={12} /> : i + 1}
                  </span>
                  <span className={i === 1 ? 'text-[#1c1c18]' : 'text-[#6b7363]'}>{s}</span>
                  {i < steps.length - 1 && <span className="text-[#c9c2b1]">›</span>}
                </li>
              ))}
            </ol>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 text-[#42493c] hover:bg-[#f2eee3]">
            <X size={20} />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            {/* Sản phẩm đặt trước */}
            <section className="rounded-2xl border border-[#e4ddcc] bg-white p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6b7363]">Đặt trước từ chiến dịch</h3>
              <div className="mt-3 flex gap-3">
                <img src={c.coverImageUrl || bannerImg} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-extrabold leading-snug text-[#1c1c18]">{c.title}</p>
                  <p className="mt-1 text-xs text-[#6b7363]">
                    {qty} thùng × {crate} kg · {formatVnd(c.rescuePricePerKg)}/kg
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#2b5619]">{formatKg(crate * qty)} nông sản tươi tận vườn</p>
                </div>
                <p className="shrink-0 text-sm font-black text-[#1c1c18]">{formatVnd(total)}</p>
              </div>
            </section>

            {/* Giao tới */}
            <section className="rounded-2xl border border-[#e4ddcc] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#6b7363]">
                  <MapPin size={14} /> Giao tới
                </h3>
                <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-xs font-bold text-[#2b5619] hover:underline">
                  <Pencil size={12} /> Sửa
                </button>
              </div>
              <p className="mt-2 text-sm font-bold text-[#1c1c18]">
                {recipient.name} · {recipient.phone}
              </p>
              <p className="mt-0.5 text-sm text-[#42493c]">{recipient.address}</p>
              {recipient.note && <p className="mt-1.5 text-xs italic text-[#6b7363]">Ghi chú: {recipient.note}</p>}
            </section>

            {/* Điều gì xảy ra tiếp theo */}
            <section className="rounded-2xl border border-[#e4ddcc] bg-white p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6b7363]">Sau khi bạn cọc</h3>
              <ol className="mt-3 flex flex-col gap-3 text-sm">
                <TimelineItem icon={Wallet} title={`Hôm nay: cọc ${formatVnd(deposit)} qua PayOS`}>
                  CapNong giữ khoản cọc, chưa chuyển cho nhà vườn.
                </TimelineItem>
                <TimelineItem icon={CalendarClock} title={`Chốt đơn ${fmtDate(c.cutoffAt) ?? ''}`}>
                  Đủ {formatKg(c.minThresholdKg)} thì nhà vườn thu hoạch. Không đủ thì chiến dịch tự huỷ và hoàn cọc vào ví CapNong của bạn.
                </TimelineItem>
                <TimelineItem icon={Truck} title={c.deliveryDate ? `Giao dự kiến từ ${fmtDate(c.deliveryDate)}` : 'Giao sau khi gom hàng'}>
                  Shipper giao tận nơi, bạn trả {formatVnd(total - deposit)} còn lại khi nhận.
                </TimelineItem>
              </ol>
            </section>
          </div>

          {/* Tóm tắt thanh toán */}
          <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-[#e4ddcc] bg-white p-4 md:sticky md:top-0">
            <h3 className="text-base font-black text-[#1c1c18]">Thanh toán</h3>
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Tạm tính" value={formatVnd(total)} />
              <Row label="Phí giao hàng" value="Không tính thêm" />
              <div className="my-1 border-t border-dashed border-[#e4ddcc]" />
              <Row label={`Cọc ngay (${pct}%)`} value={formatVnd(deposit)} strong />
              {walletUse > 0 && <Row label="· Trừ ví CapNong" value={`-${formatVnd(walletUse)}`} />}
              {walletUse > 0 && <Row label="· Chuyển khoản PayOS" value={formatVnd(payosDue)} />}
              <Row label="Trả khi nhận hàng" value={formatVnd(total - deposit)} />
            </dl>

            {/* Dùng ví trước cho tiền cọc */}
            <label
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm ${walletBalance > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${payWithWallet ? 'border-[#4a7c2f] bg-[#f2f9ed]' : 'border-[#e4ddcc]'}`}
            >
              <input
                type="checkbox"
                checked={payWithWallet}
                disabled={walletBalance <= 0 || pending}
                onChange={(e) => onToggleWallet(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a7c2f]"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-bold text-[#1c1c18]">
                  <Wallet size={15} className="text-[#2b5619]" /> Dùng ví CapNong
                </span>
                <span className="block text-xs text-[#6b7363]">
                  Số dư {formatVnd(walletBalance)}
                  {payWithWallet && walletUse > 0
                    ? payosDue > 0
                      ? ` · trừ ${formatVnd(walletUse)}, chuyển khoản thêm ${formatVnd(payosDue)}`
                      : ' · ví trả đủ tiền cọc'
                    : ''}
                </span>
              </span>
            </label>

            {payosDue > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#4a7c2f] bg-[#f2f9ed] p-3 text-sm">
                <ShieldCheck size={18} className="shrink-0 text-[#2b5619]" />
                <span className="text-[#1c1c18]">
                  <b>PayOS</b> · chuyển khoản / quét QR ngân hàng {formatVnd(payosDue)}
                </span>
              </div>
            )}
            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#42493c]">
              <input
                id="dong-y-coc"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a7c2f]"
              />
              Tôi hiểu đơn đặt trước không tự huỷ được sau khi đã cọc, và tiền cọc được hoàn khi chiến dịch không đủ ngưỡng.
            </label>
            {error && <p className="text-sm font-semibold text-[#b3261e]">{error}</p>}
            <button
              type="button"
              disabled={!agreed || pending}
              onClick={onPay}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4a7c2f] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-[#4a7c2f]/30 transition hover:bg-[#2b5619] disabled:opacity-50"
            >
              {pending ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
              {pending
                ? payosDue > 0 ? 'Đang mở PayOS...' : 'Đang trừ ví...'
                : payosDue <= 0
                  ? `Cọc ${formatVnd(deposit)} bằng ví`
                  : walletUse > 0
                    ? `Trừ ví & chuyển khoản ${formatVnd(payosDue)}`
                    : `Cọc ${formatVnd(deposit)} qua PayOS`}
            </button>
            <button type="button" onClick={onClose} disabled={pending} className="text-sm font-bold text-[#42493c] hover:underline disabled:opacity-50">
              Quay lại chỉnh sửa
            </button>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function TimelineItem({ icon: Icon, title, children }: { icon: typeof Wallet; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2f9ed] text-[#2b5619]">
        <Icon size={15} />
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-[#1c1c18]">{title}</span>
        <span className="block text-[13px] text-[#6b7363]">{children}</span>
      </span>
    </li>
  )
}

/* ─────────────────────────── Thành phần nhỏ ─────────────────────────── */

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-12 text-2xl font-black tracking-tight text-[#1c1c18] sm:text-[28px]">{children}</h2>
}

function Prose({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[17px] leading-[1.8] text-[#33392d]">{children}</p>
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof Truck; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-3xl border border-[#e4ddcc] bg-white p-5 shadow-sm sm:p-6">
      <h3 className="flex items-center gap-2.5 text-lg font-black text-[#1c1c18]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f9ed] text-[#4a7c2f]">
          <Icon size={18} />
        </span>
        {title}
      </h3>
      <ol className="mt-4 flex flex-col gap-3">{children}</ol>
    </section>
  )
}

function InfoStep({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-snug text-[#33392d]">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4a7c2f] text-[11px] font-black text-white">{n}</span>
      <span>{children}</span>
    </li>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <dt className={strong ? 'font-bold text-[#1c1c18]' : 'text-[#42493c]'}>{label}</dt>
      <dd className={strong ? 'text-lg font-black text-[#c27c00]' : 'font-bold text-[#1c1c18]'}>{value}</dd>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required = true,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  autoComplete?: string
  inputMode?: 'tel' | 'text'
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-[#1c1c18]">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-[#e4ddcc] bg-[#fcf9f1] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4a7c2f] focus:ring-2 focus:ring-[#4a7c2f]/20"
        {...rest}
      />
    </label>
  )
}

function splitParagraphs(text?: string | null) {
  return (text ?? '')
    .split(/\n\s*\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#6b7363]">{label}</dt>
      <dd className="text-right font-bold text-[#1c1c18]">{value}</dd>
    </div>
  )
}

function defaultLead(c: CampaignResponse) {
  return `${c.approvedFarmCount || 'Nhiều'} nhà vườn đang có ${formatKg(c.targetVolumeKg)} ${(c.categoryName || 'nông sản').toLowerCase()} cần tìm người mua trước khi hỏng ngoài ruộng. CapNong mở chiến dịch này để gom đơn đặt trước với giá giải cứu ${formatVnd(c.rescuePricePerKg)}/kg, giúp bà con không phải bán tháo hay đổ bỏ.`
}

function readMinutes(c: CampaignResponse) {
  const words = htmlToPlainText(c.description).split(/\s+/).length + 220
  return Math.max(2, Math.round(words / 200))
}

function useReadingProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setP(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return p
}
