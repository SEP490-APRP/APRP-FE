import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  MapPin,
  Pencil,
  Wallet,
  X,
  Loader2,
  LogIn,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import bannerImg from '@/assets/farmer-forum-banner.jpg'
import { useCampaign } from '@/features/campaign/hooks/useCampaignQueries'
import { CRATE_SIZES, formatKg, formatVnd, progressOf, timeLeftLabel } from '@/features/campaign/utils'
import { campaignService, type CampaignResponse, type CrateSize } from '@/services'
import { useAuth } from '@/stores'
import { getErrorMessage } from '@/utils'

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

/** Trang chi tiết chiến dịch, trình bày như một bài báo: đọc hết câu chuyện rồi mới đặt trước ở cuối bài. */
export default function CampaignDetailPage() {
  const { campaignId } = useParams()
  const id = Number(campaignId) || null
  const { data: c, isLoading, isError } = useCampaign(id)

  useEffect(() => {
    if (c?.title) document.title = `${c.title} · CapNong`
  }, [c?.title])

  // Bấm "Đặt trước thùng ngay" từ trang danh sách: nội dung tải xong mới cuộn tới khung đặt trước
  useEffect(() => {
    if (!c || window.location.hash !== '#dat-truoc') return
    const t = window.setTimeout(() => document.getElementById('dat-truoc')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    return () => window.clearTimeout(t)
  }, [c])

  if (isLoading) {
    return (
      <div className="page-container py-16">
        <div className="h-[360px] animate-pulse rounded-3xl bg-[#ede8df]" />
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="h-4 animate-pulse rounded bg-[#ede8df]" />
          ))}
        </div>
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

  return <Article c={c} />
}

function Article({ c }: { c: CampaignResponse }) {
  const progress = useReadingProgress()
  const paragraphs = useMemo(() => splitParagraphs(c.description), [c.description])
  const lead = paragraphs[0] ?? defaultLead(c)
  const rest = paragraphs.slice(1)
  const pct = progressOf(c)
  const thresholdPct = c.targetVolumeKg > 0 ? Math.min(100, (c.minThresholdKg / c.targetVolumeKg) * 100) : 0
  const depositPct = Math.round(Number(c.depositPercent ?? 0) * 100)
  const tag = [c.categoryName, c.season].filter(Boolean).join(' · ') || 'Nông sản'

  return (
    <article className="bg-[#fcf9f1] pb-20">
      {/* Thanh tiến độ đọc */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent" aria-hidden>
        <div className="h-full bg-[#ffba41] transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {/* Ảnh bìa + tiêu đề (đúng tên admin đặt) */}
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
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl">
            {c.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/85 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffba41] px-3 py-1 font-extrabold text-[#3d2a00]">
              {STATUS_LABEL[c.status]}
            </span>
            {fmtDate(c.publishedAt ?? c.callPostedAt ?? c.createdAt) && (
              <span>Đăng ngày {fmtDate(c.publishedAt ?? c.callPostedAt ?? c.createdAt)}</span>
            )}
            <span aria-hidden className="text-white/40">•</span>
            <span>Chốt đơn {fmtDate(c.cutoffAt)}</span>
            <span aria-hidden className="text-white/40">•</span>
            <span>{readMinutes(c)} phút đọc</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Mở bài */}
        <p className="mt-10 text-lg leading-relaxed text-[#1c1c18] first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.9] first-letter:text-[#4a7c2f] sm:text-xl">
          {lead}
        </p>
        {rest.map((p, i) => (
          <Prose key={i}>{p}</Prose>
        ))}

        {/* Con số của chiến dịch */}
        <figure className="my-10 rounded-3xl border border-[#e4ddcc] bg-white p-6 shadow-sm sm:p-8">
          <figcaption className="text-xs font-extrabold uppercase tracking-wider text-[#4a7c2f]">
            Con số của chiến dịch
          </figcaption>
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <span className="text-3xl font-black text-[#1c1c18]">{formatKg(c.bookedVolumeKg)}</span>
            <span className="text-sm text-[#6b7363]">đã được đặt trước / mục tiêu {formatKg(c.targetVolumeKg)}</span>
          </div>
          <div className="relative mt-3 h-3 rounded-full bg-[#ede8df]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#4a7c2f] to-[#9ed67d]" style={{ width: `${pct}%` }} />
            <span className="absolute -top-1 h-5 w-0.5 rounded bg-[#c27c00]" style={{ left: `${thresholdPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#6b7363]">
            Vạch cam là ngưỡng tối thiểu {formatKg(c.minThresholdKg)}. Vượt vạch trước ngày chốt thì chiến dịch chắc chắn
            được thu hoạch và giao.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[#ede8df] pt-5 sm:grid-cols-4">
            <Fact label="Giá giải cứu" value={`${formatVnd(c.rescuePricePerKg)}/kg`} />
            <Fact label="Nhà vườn tham gia" value={`${c.approvedFarmCount}`} />
            <Fact label="Cọc trước" value={`${depositPct}%`} />
            <Fact label="Thời gian" value={c.status === 'ACTIVE' ? timeLeftLabel(c.cutoffAt) : STATUS_LABEL[c.status]} />
          </dl>
        </figure>

        <H2>Nông sản đi từ vườn tới bạn như thế nào</H2>
        <Prose>
          Các nhà vườn tham gia chiến dịch mang nông sản tới điểm thu gom
          {c.collectionSiteName ? <strong> {c.collectionSiteName}</strong> : ''}
          {c.collectionSiteAddress ? ` (${c.collectionSiteAddress})` : ''}. Tại đây đội CapNong cân từng lô, đóng thành
          thùng chuẩn 10, 20 hoặc 50 kg và dán mã QR để bạn biết thùng hàng đến từ vườn nào.
        </Prose>
        <Prose>
          Sau ngày chốt đơn {fmtDate(c.cutoffAt)}, hàng được chở về kho trung chuyển rồi giao tận nơi
          {c.deliveryDate ? `, dự kiến từ ngày ${fmtDate(c.deliveryDate)}` : ''}.
        </Prose>

        <H2>Tiền cọc của bạn được giữ ra sao</H2>
        <Prose>
          Bạn chỉ cọc trước {depositPct}% giá trị thùng qua PayOS. CapNong giữ khoản cọc này cho tới khi chiến dịch kết
          thúc, phần còn lại bạn trả khi nhận hàng.
        </Prose>
        <aside className="my-6 flex gap-4 rounded-2xl border-l-4 border-[#4a7c2f] bg-[#f2f9ed] p-5">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-[#4a7c2f]" aria-hidden />
          <p className="text-[15px] leading-relaxed text-[#2b3a24]">
            Nếu tới ngày chốt mà tổng số kg đặt trước chưa đạt {formatKg(c.minThresholdKg)}, chiến dịch tự huỷ và toàn bộ
            tiền cọc được hoàn về ví CapNong của bạn.
          </p>
        </aside>

        {/* Hết bài */}
        <div className="my-12 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-[#a39b8a]" aria-hidden>
          <span className="h-px flex-1 bg-[#e4ddcc]" />
          Đặt trước
          <span className="h-px flex-1 bg-[#e4ddcc]" />
        </div>

        {c.status === 'ACTIVE' ? <PreOrderBox c={c} /> : <ClosedBox c={c} />}

        <a
          href="/chien-dich"
          className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-[#2b5619] hover:underline"
        >
          <ArrowLeft size={16} /> Xem các chiến dịch khác
        </a>
      </div>
    </article>
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
  const [address, setAddress] = useState(user?.address || '')
  const [note, setNote] = useState('')

  const totalKg = crate * qty
  const total = totalKg * Number(c.rescuePricePerKg ?? 0)
  const deposit = total * Number(c.depositPercent ?? 0)
  const remainingKg = Math.max(0, Number(c.remainingVolumeKg ?? c.targetVolumeKg - c.bookedVolumeKg))
  const overLimit = totalKg > remainingKg

  const [confirming, setConfirming] = useState(false)
  const order = useMutation({
    mutationFn: () =>
      campaignService.createPreOrder(c.campaignId, {
        crateSize: CRATE_ENUM[crate],
        crateQuantity: qty,
        recipientName: name.trim(),
        recipientPhone: phone.trim(),
        shippingAddress: address.trim(),
        note: note.trim() || undefined,
      }),
    onSuccess: (res) => {
      if (res.checkoutUrl) window.location.href = res.checkoutUrl
    },
  })

  // Bước 1 chỉ kiểm tra form rồi mở bước xác nhận; tạo đơn và sang PayOS ở bước 2
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!overLimit) {
      order.reset()
      setConfirming(true)
    }
  }

  const isBuyer = user?.role === 'buyer'

  return (
    <section id="dat-truoc" aria-labelledby="dat-truoc-title" className="rounded-3xl border border-[#e4ddcc] bg-white p-6 shadow-lg sm:p-8">
      <h2 id="dat-truoc-title" className="text-2xl font-black text-[#1c1c18]">
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
            <div className="sm:col-span-2">
              <Field label="Địa chỉ giao hàng" value={address} onChange={setAddress} autoComplete="street-address" />
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
          recipient={{ name: name.trim(), phone: phone.trim(), address: address.trim(), note: note.trim() }}
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
  recipient: { name: string; phone: string; address: string; note: string }
  pending: boolean
  error: string | null
  onPay: () => void
  onClose: () => void
}) {
  const [agreed, setAgreed] = useState(false)
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
              <Row label="Trả khi nhận hàng" value={formatVnd(total - deposit)} />
            </dl>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#4a7c2f] bg-[#f2f9ed] p-3 text-sm">
              <ShieldCheck size={18} className="shrink-0 text-[#2b5619]" />
              <span className="text-[#1c1c18]">
                <b>PayOS</b> · chuyển khoản / quét QR ngân hàng
              </span>
            </div>
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
              {pending ? 'Đang mở PayOS...' : `Cọc ${formatVnd(deposit)} qua PayOS`}
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

function ClosedBox({ c }: { c: CampaignResponse }) {
  const upcoming = c.status === 'DRAFT'
  const Icon = upcoming ? CalendarClock : c.status === 'COMPLETED' ? PackageCheck : c.status === 'CANCELLED' ? ShieldCheck : Truck
  const text = upcoming
    ? 'Chiến dịch đang gom hàng từ các nhà vườn. Khi CapNong duyệt và mở bán, phần đặt trước sẽ xuất hiện ngay tại đây.'
    : c.status === 'COMPLETED'
      ? `Chiến dịch đã giải cứu ${formatKg(c.bookedVolumeKg)} cùng ${c.approvedFarmCount} nhà vườn. Cảm ơn bạn đã đồng hành!`
      : c.status === 'CANCELLED'
        ? 'Chiến dịch không đủ ngưỡng nên đã huỷ, tiền cọc đã được hoàn về ví CapNong của người đặt.'
        : 'Chiến dịch đã đủ ngưỡng và đóng đặt trước. Nông sản đang được thu hoạch, cân và giao tới người mua.'
  return (
    <section className="flex gap-4 rounded-3xl border border-[#e4ddcc] bg-white p-6 shadow-sm">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2f9ed] text-[#4a7c2f]">
        <Icon size={22} />
      </span>
      <div>
        <h2 className="text-lg font-black text-[#1c1c18]">{STATUS_LABEL[c.status]}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#42493c]">{text}</p>
      </div>
    </section>
  )
}

/* ─────────────────────────── Thành phần nhỏ ─────────────────────────── */

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-12 text-2xl font-black tracking-tight text-[#1c1c18] sm:text-[28px]">{children}</h2>
}

function Prose({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[17px] leading-[1.8] text-[#33392d]">{children}</p>
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#6b7363]">{label}</dt>
      <dd className="mt-0.5 text-lg font-black text-[#1c1c18]">{value}</dd>
    </div>
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

function defaultLead(c: CampaignResponse) {
  return `${c.approvedFarmCount || 'Nhiều'} nhà vườn đang có ${formatKg(c.targetVolumeKg)} ${(c.categoryName || 'nông sản').toLowerCase()} cần tìm người mua trước khi hỏng ngoài ruộng. CapNong mở chiến dịch này để gom đơn đặt trước với giá giải cứu ${formatVnd(c.rescuePricePerKg)}/kg, giúp bà con không phải bán tháo hay đổ bỏ.`
}

function readMinutes(c: CampaignResponse) {
  const words = (c.description ?? '').split(/\s+/).length + 220
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
