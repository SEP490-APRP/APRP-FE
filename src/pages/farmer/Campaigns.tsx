import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock,
  Flame,
  HandCoins,
  ImagePlus,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Sprout,
  X,
  XCircle,
} from 'lucide-react'
import {
  campaignService,
  uploadService,
  type CampaignResponse,
  type FarmRegistrationResponse,
  type ShelfLifeTier,
} from '@/services'
import { useMyProducts } from '@/features/product/hooks/useProductQueries'
import { formatKg, formatVnd, timeLeftLabel } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'
import logoIcon from '@/assets/logo-icon.png'

const FARMER_KEEP_RATE = 0.9 // nhà vườn nhận 90% sau phí dịch vụ 10% (khớp capnong.wallet.farmer-fee-rate)

export const SHELF_LIFE: { id: ShelfLifeTier; label: string; hint: string; tone: string }[] = [
  { id: 'DAYS_1_2', label: '1 – 2 ngày', hint: 'Rau ăn lá, quả chín mềm: cần giao ngay sau thu hoạch', tone: 'text-[#b3261e] bg-[#fdecea]' },
  { id: 'DAYS_3_4', label: '3 – 4 ngày', hint: 'Cà chua, dưa leo, bắp: giữ được vài ngày ở nơi mát', tone: 'text-[#8a5a00] bg-[#fff3d6]' },
  { id: 'DAYS_5_6', label: '5 – 6 ngày', hint: 'Củ, quả vỏ dày (bí, khoai, dưa hấu): bảo quản lâu', tone: 'text-[#2b5619] bg-[#e7f3de]' },
]
const SHELF_MAX_DAYS: Record<ShelfLifeTier, number> = { DAYS_1_2: 2, DAYS_3_4: 4, DAYS_5_6: 6 } // khớp ShelfLifeTier.maxDays ở BE
const localIsoDate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
const shelfLabel = (t?: ShelfLifeTier | null) => SHELF_LIFE.find((s) => s.id === t)?.label ?? '—'
const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—')

const keys = {
  calls: ['shop-campaigns', 'calls'] as const,
  mine: ['shop-campaigns', 'mine'] as const,
}

/** Kênh Nhà Vườn › Chiến dịch giải cứu: xem lời kêu gọi, đăng ký lô hàng, theo dõi duyệt / cân / chi trả */
export default function Campaigns({ onInfo }: { onInfo?: (msg: string) => void }) {
  const [view, setView] = useState<'calls' | 'mine'>('calls')
  const [registering, setRegistering] = useState<CampaignResponse | null>(null)
  const calls = useQuery({ queryKey: keys.calls, queryFn: () => campaignService.getOpenFarmCalls(), retry: 1 })
  const mine = useQuery({ queryKey: keys.mine, queryFn: () => campaignService.getMyRegistrations(), retry: 1 })
  const myByCampaign = useMemo(
    () => new Map((mine.data ?? []).map((r) => [r.campaignId, r])),
    [mine.data],
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 border-b border-[#f1f4ed] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-2xl font-black text-[#1c2216]">
            <Flame size={22} className="text-[#e8590c]" /> Chiến dịch giải cứu
          </h3>
          <p className="text-xs text-[#7e8779]">
            Góp lô hàng dư vào chiến dịch của CapNong. Khi được duyệt, bạn mang hàng tới điểm gom để cân và nhận tiền theo
            giá đã chốt.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-[#f4f7f1] p-1 text-xs font-bold">
          {(
            [
              ['calls', 'Đang kêu gọi', calls.data?.length],
              ['mine', 'Đăng ký của tôi', mine.data?.length],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-full px-4 py-2 transition ${view === id ? 'bg-[#326318] text-white shadow' : 'text-[#326318]'}`}
            >
              {label}
              {n != null && <span className="ml-1.5 opacity-75">{n}</span>}
            </button>
          ))}
        </div>
      </div>

      {view === 'calls' ? (
        calls.isLoading ? (
          <Skeleton />
        ) : calls.isError ? (
          <Empty text={getErrorMessage(calls.error, 'Chưa tải được danh sách chiến dịch.')} />
        ) : !calls.data?.length ? (
          <Empty text="Hiện chưa có chiến dịch nào kêu gọi nhà vườn. CapNong sẽ gửi thông báo khi có chiến dịch mới." />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {calls.data.map((c) => (
              <CallCard key={c.campaignId} c={c} mine={myByCampaign.get(c.campaignId)} onRegister={() => setRegistering(c)} />
            ))}
          </div>
        )
      ) : mine.isLoading ? (
        <Skeleton />
      ) : !mine.data?.length ? (
        <Empty text="Bạn chưa đăng ký chiến dịch nào." />
      ) : (
        <div className="space-y-4">
          {mine.data.map((r) => (
            <RegistrationRow key={r.registrationId} r={r} />
          ))}
        </div>
      )}

      {registering && (
        <RegisterDialog
          c={registering}
          onClose={() => setRegistering(null)}
          onDone={() => {
            setRegistering(null)
            setView('mine')
            onInfo?.('Đã gửi đăng ký. CapNong sẽ liên hệ thương lượng giá và duyệt lô hàng của bạn.')
          }}
        />
      )}
    </div>
  )
}

/* ─────────────────────────── Thẻ lời kêu gọi ─────────────────────────── */

function CallCard({ c, mine, onRegister }: { c: CampaignResponse; mine?: FarmRegistrationResponse; onRegister: () => void }) {
  const gathered = Number(c.approvedSurplusKg ?? 0)
  const pct = c.targetVolumeKg > 0 ? Math.min(100, (gathered / c.targetVolumeKg) * 100) : 0
  return (
    <article className="flex flex-col rounded-3xl border border-[#e4ede0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4a7c2f]">
            {[c.categoryName, c.season].filter(Boolean).join(' · ') || 'Chiến dịch'}
          </p>
          <h4 className="mt-1 text-lg font-black leading-snug text-[#1c2216]">{c.title}</h4>
        </div>
        <span className="shrink-0 rounded-full bg-[#fff3d6] px-2.5 py-1 text-[11px] font-extrabold text-[#8a5a00]">
          {timeLeftLabel(c.cutoffAt)}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-[#f4f7f1] p-3.5 text-sm">
        <p className="flex items-start gap-2 font-bold text-[#1c2216]">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[#4a7c2f]" />
          <span>
            Điểm gom: {c.collectionSiteName || 'Đang cập nhật'}
            {c.collectionSiteAddress && <span className="block text-xs font-medium text-[#5d6657]">{c.collectionSiteAddress}</span>}
          </span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Mini label="Giá tham khảo" value={`${formatVnd(c.rescuePricePerKg)}/kg`} />
          <Mini label="Cần gom" value={formatKg(c.targetVolumeKg)} />
          <Mini label="Hạn đăng ký" value={fmtDate(c.cutoffAt)} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-[#5d6657]">
          <span>{c.approvedFarmCount} nhà vườn đã được duyệt</span>
          <span className="font-bold">{formatKg(gathered)}</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-[#e9efe4]">
          <div className="h-full rounded-full bg-[#4a7c2f]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <a href={`/chien-dich/${c.campaignId}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#326318] hover:underline">
          Xem bài chiến dịch
        </a>
        {mine ? (
          <StatusChip status={mine.status} />
        ) : (
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#326318] px-5 py-2.5 text-xs font-extrabold uppercase text-white shadow-sm transition hover:bg-[#244a10] active:scale-95"
          >
            <Sprout size={15} /> Đăng ký góp hàng
          </button>
        )}
      </div>
    </article>
  )
}

/* ─────────────────────────── Form đăng ký lô hàng ─────────────────────────── */

function RegisterDialog({ c, onClose, onDone }: { c: CampaignResponse; onClose: () => void; onDone: () => void }) {
  const qc = useQueryClient()
  const { data: myProducts } = useMyProducts({ size: 100 })
  const products = (myProducts?.content ?? []).map((p) => ({
    id: Number(p.productId ?? p.id),
    name: String(p.productName ?? p.name ?? ''),
    image: (p.images?.find((i: { isPrimary?: boolean }) => i.isPrimary) ?? p.images?.[0])?.imageUrl ?? p.imageUrl ?? '',
  }))

  const [productId, setProductId] = useState<number | ''>('')
  const [productName, setProductName] = useState('')
  const [kg, setKg] = useState('')
  const [harvestDate, setHarvestDate] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [shelf, setShelf] = useState<ShelfLifeTier | null>(null)
  const [price, setPrice] = useState(String(Math.round(Number(c.rescuePricePerKg ?? 0))))
  const [committed, setCommitted] = useState(false)
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const kgNum = Number(kg)
  const priceNum = Number(price)
  // Giá chốt không vượt giá giải cứu (BE chặn), nên tạm tính theo min(giá đề xuất, giá giải cứu)
  const payPrice = c.rescuePricePerKg > 0 ? Math.min(priceNum, c.rescuePricePerKg) : priceNum
  const estimate = kgNum > 0 && priceNum > 0 ? kgNum * payPrice * FARMER_KEEP_RATE : 0
  const today = localIsoDate(new Date())
  const deliveryDate = c.deliveryDate ? c.deliveryDate.slice(0, 10) : null
  const priceDiff = c.rescuePricePerKg > 0 && priceNum > 0 ? (priceNum - c.rescuePricePerKg) / c.rescuePricePerKg : 0

  const errors = {
    product: !productName.trim() ? 'Nhập tên sản phẩm' : null,
    kg: !(kgNum > 0) ? 'Nhập số kg lớn hơn 0' : null,
    harvest: !harvestDate || harvestDate < today
      ? 'Chọn ngày thu hoạch từ hôm nay'
      : deliveryDate && harvestDate > deliveryDate
        ? `Ngày thu hoạch không được sau ngày giao ${fmtDate(deliveryDate)}`
        : null,
    images: images.length === 0 ? 'Thêm ít nhất 1 ảnh lô hàng' : null,
    shelf: !shelf
      ? 'Chọn thời gian bảo quản'
      : deliveryDate && harvestDate && daysBetween(harvestDate, deliveryDate) > SHELF_MAX_DAYS[shelf]
        ? `Hàng chỉ giữ ${shelfLabel(shelf)} nhưng từ ngày thu hoạch tới ngày giao (${fmtDate(deliveryDate)}) là ${daysBetween(harvestDate, deliveryDate)} ngày. Hãy lùi ngày thu hoạch.`
        : null,
    price: !(priceNum > 0) ? 'Nhập giá đề xuất' : null,
    commit: !committed ? 'Bạn cần tick cam kết' : null,
  }
  const valid = Object.values(errors).every((e) => !e)

  const submit = useMutation({
    mutationFn: () =>
      campaignService.registerFarm(c.campaignId, {
        productId: productId === '' ? undefined : productId,
        productName: productName.trim(),
        surplusVolumeKg: kgNum,
        harvestDate,
        productImageUrls: images,
        shelfLifeTier: shelf as ShelfLifeTier,
        proposedPricePerKg: priceNum,
        priceCommitted: committed,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-campaigns'] })
      onDone()
    },
  })

  const pickProduct = (id: string) => {
    if (!id) {
      setProductId('')
      return
    }
    const p = products.find((x) => x.id === Number(id))
    setProductId(Number(id))
    if (p) {
      setProductName(p.name)
      if (p.image && !images.includes(p.image)) setImages((prev) => [p.image, ...prev].slice(0, 5))
    }
  }

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const room = 5 - images.length
      for (const f of Array.from(files).slice(0, room)) {
        const res = await uploadService.uploadImage(f, 'campaigns')
        const url = res.result?.url
        if (url) setImages((prev) => [...prev, url].slice(0, 5))
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const err = (k: keyof typeof errors) =>
    touched && errors[k] ? <p className="mt-1 text-xs font-semibold text-[#b3261e]">{errors[k]}</p> : null

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

  // Render ra body để phủ cả thanh header của Kênh Nhà Vườn
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="dk-title">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#eef2ea] px-6 py-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4a7c2f]">Đăng ký góp hàng</p>
            <h4 id="dk-title" className="text-lg font-black text-[#1c2216]">{c.title}</h4>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#5d6657]">
              <MapPin size={13} /> Mang hàng tới: <strong>{c.collectionSiteName || 'điểm gom sẽ được thông báo'}</strong>
              {c.collectionSiteAddress ? ` · ${c.collectionSiteAddress}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-2 text-[#5d6657] hover:bg-[#f4f7f1]">
            <X size={18} />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            setTouched(true)
            if (valid) submit.mutate()
          }}
        >
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-5">
          {/* 1. Sản phẩm */}
          <Step n={1} title="Sản phẩm góp vào chiến dịch" icon={Package}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#1c2216]">
                Chọn từ gian hàng (tuỳ chọn)
                <select
                  value={productId}
                  onChange={(e) => pickProduct(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 text-sm font-medium"
                >
                  <option value="">— Nhập tên sản phẩm mới —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-[#1c2216]">
                Tên sản phẩm
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  maxLength={200}
                  placeholder="Vd: Dưa hấu Long An loại 2"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 text-sm font-medium"
                />
                {err('product')}
              </label>
            </div>
          </Step>

          {/* 2. Số lượng */}
          <Step n={2} title="Số lượng & ngày thu hoạch" icon={CalendarClock}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#1c2216]">
                Số kg dư có thể góp
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    inputMode="decimal"
                    value={kg}
                    onChange={(e) => setKg(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 pr-10 text-sm font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7e8779]">kg</span>
                </div>
                {err('kg')}
              </label>
              <label className="text-xs font-bold text-[#1c2216]">
                Ngày thu hoạch dự kiến
                <input
                  type="date"
                  min={today}
                  max={deliveryDate ?? undefined}
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 text-sm font-medium"
                />
                {err('harvest')}
              </label>
            </div>
          </Step>

          {/* 3. Ảnh */}
          <Step n={3} title="Ảnh minh hoạ lô hàng" icon={Camera} hint="1 – 5 ảnh chụp thật tại vườn giúp CapNong duyệt nhanh hơn.">
            <div className="flex flex-wrap gap-3">
              {images.map((url) => (
                <div key={url} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#dfe6d8]">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Xoá ảnh"
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#c7d6bd] text-[11px] font-bold text-[#4a7c2f] hover:bg-[#f4f7f1]"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                  {uploading ? 'Đang tải' : 'Thêm ảnh'}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </div>
            {err('images')}
          </Step>

          {/* 4. Bảo quản */}
          <Step n={4} title="Thời gian bảo quản sau thu hoạch" icon={Clock}>
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Thời gian bảo quản">
              {SHELF_LIFE.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={shelf === s.id}
                  onClick={() => setShelf(s.id)}
                  className={`rounded-2xl border p-3.5 text-left transition ${shelf === s.id ? 'border-[#326318] bg-[#f4f7f1] ring-2 ring-[#326318]/25' : 'border-[#dfe6d8] hover:border-[#9ed67d]'}`}
                >
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${s.tone}`}>{s.label}</span>
                  <span className="mt-2 block text-xs leading-snug text-[#5d6657]">{s.hint}</span>
                </button>
              ))}
            </div>
            {err('shelf')}
          </Step>

          {/* 5. Giá & cam kết */}
          <Step n={5} title="Giá đề xuất & cam kết" icon={HandCoins}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#1c2216]">
                Giá bạn đề xuất
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min={1}
                    step="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 pr-14 text-sm font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7e8779]">đ/kg</span>
                </div>
                <span className="mt-1 block font-medium text-[#7e8779]">
                  Giá giải cứu chiến dịch: {formatVnd(c.rescuePricePerKg)}/kg
                  {priceDiff > 0 && (
                    <span className="text-[#b3261e]"> · giá chốt tối đa bằng giá giải cứu, phần cao hơn sẽ không được tính</span>
                  )}
                </span>
                {err('price')}
              </label>
              <div className="rounded-2xl bg-[#f4f7f1] p-3.5 text-xs text-[#5d6657]">
                <p>Tạm tính bạn nhận (sau phí 10%)</p>
                <p className="mt-1 text-xl font-black text-[#326318]">{formatVnd(estimate)}</p>
                <p className="mt-1">Tính theo số kg cân đạt chuẩn tại điểm gom × giá chốt sau thương lượng.</p>
              </div>
            </div>

            <label className={`mt-4 flex cursor-pointer gap-3 rounded-2xl border p-4 ${committed ? 'border-[#326318] bg-[#f4f7f1]' : 'border-[#dfe6d8]'}`}>
              <input type="checkbox" checked={committed} onChange={(e) => setCommitted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#326318]" />
              <span className="text-sm leading-relaxed text-[#1c2216]">
                <strong>Tôi cam kết</strong> giữ đúng mức giá được CapNong chốt sau thương lượng (không vượt giá đề xuất ở
                trên), giao đủ số kg đã khai và đúng chất lượng như ảnh, mang hàng tới điểm gom đúng hẹn. Hàng không đạt
                chuẩn khi cân kiểm sẽ không được tính tiền.
              </span>
            </label>
            {err('commit')}

            <label className="mt-4 block text-xs font-bold text-[#1c2216]">
              Ghi chú cho CapNong (tuỳ chọn)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Vd: có thể tự chở hàng tới điểm gom, liên hệ sau 17h"
                className="mt-1.5 w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 text-sm font-medium"
              />
            </label>
          </Step>

          {submit.isError && (
            <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm font-semibold text-[#b3261e]">
              {getErrorMessage(submit.error, 'Chưa gửi được đăng ký, bạn thử lại nhé.')}
            </p>
          )}

          </div>

          <footer className="flex flex-col gap-3 border-t border-[#eef2ea] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#5d6657]">
              Sau khi gửi, CapNong sẽ liên hệ thương lượng giá và duyệt lô hàng trước {fmtDate(c.cutoffAt)}.
            </p>
            <button
              type="submit"
              disabled={submit.isPending || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#326318] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#244a10] disabled:opacity-60"
            >
              {submit.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Gửi đăng ký
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ─────────────────────────── Đăng ký của tôi ─────────────────────────── */

function RegistrationRow({ r }: { r: FarmRegistrationResponse }) {
  const steps = [
    { label: 'Gửi đăng ký', done: true },
    { label: 'Duyệt & chốt giá', done: r.status === 'APPROVED' },
    { label: 'Cân tại điểm gom', done: !!r.intakeAt },
    { label: 'Nhận tiền', done: !!r.paidOutAt },
  ]
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-[#e4ede0] bg-white p-5 shadow-sm md:flex-row">
      <div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-[#f4f7f1] md:w-36">
        {r.productImageUrls?.[0] ? (
          <img src={r.productImageUrls[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[#9db58e]"><Package size={28} /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-[#7e8779]">{r.campaignTitle}</p>
            <h4 className="text-base font-black text-[#1c2216]">{r.productName || 'Lô hàng'}</h4>
          </div>
          <StatusChip status={r.status} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <Mini label="Số kg khai" value={formatKg(r.surplusVolumeKg)} />
          <Mini label="Thu hoạch" value={fmtDate(r.harvestDate)} />
          <Mini label="Bảo quản" value={shelfLabel(r.shelfLifeTier)} />
          <Mini
            label={r.agreedPricePerKg != null ? 'Giá đã chốt' : 'Giá đề xuất'}
            value={r.effectivePricePerKg != null ? `${formatVnd(r.effectivePricePerKg)}/kg` : '—'}
          />
          {r.allocatedVolumeKg != null && <Mini label="Được phân bổ" value={formatKg(r.allocatedVolumeKg)} />}
          {r.receivedWeightKg != null && (
            <Mini label="Cân thực tế" value={`${formatKg(r.receivedWeightKg)}${r.qualityPassed === false ? ' · không đạt' : ''}`} />
          )}
          {r.payoutAmount != null && <Mini label="Đã nhận" value={formatVnd(r.payoutAmount)} />}
          <Mini label="Điểm gom" value={r.collectionSiteName || '—'} />
        </dl>
        {r.reviewNote && <p className="mt-3 rounded-xl bg-[#f4f7f1] px-3 py-2 text-xs text-[#5d6657]">CapNong: {r.reviewNote}</p>}
        {r.status !== 'REJECTED' && (
          <ol className="mt-4 flex items-center gap-2 text-[11px] font-bold">
            {steps.map((s, i) => (
              <li key={s.label} className="flex flex-1 items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${s.done ? 'bg-[#326318] text-white' : 'bg-[#e9efe4] text-[#7e8779]'}`}>
                  {s.done ? <CheckCircle2 size={12} /> : i + 1}
                </span>
                <span className={s.done ? 'text-[#326318]' : 'text-[#7e8779]'}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  )
}

/* ─────────────────────────── Thành phần nhỏ ─────────────────────────── */

function Step({ n, title, icon: Icon, hint, children }: { n: number; title: string; icon: typeof Package; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h5 className="flex items-center gap-2 text-sm font-black text-[#1c2216]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#326318] text-[11px] text-white">{n}</span>
        <Icon size={16} className="text-[#4a7c2f]" />
        {title}
      </h5>
      {hint && <p className="ml-8 mt-0.5 text-xs text-[#7e8779]">{hint}</p>}
      <div className="mt-3 sm:ml-8">{children}</div>
    </section>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[#7e8779]">{label}</dt>
      <dd className="truncate font-bold text-[#1c2216]">{value}</dd>
    </div>
  )
}

function StatusChip({ status }: { status: FarmRegistrationResponse['status'] }) {
  const map = {
    PENDING: { t: 'Chờ duyệt & thương lượng giá', c: 'bg-[#fff3d6] text-[#8a5a00]', I: Clock },
    APPROVED: { t: 'Đã duyệt', c: 'bg-[#e7f3de] text-[#2b5619]', I: CheckCircle2 },
    REJECTED: { t: 'Bị từ chối', c: 'bg-[#fdecea] text-[#b3261e]', I: XCircle },
  }[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold ${map.c}`}>
      <map.I size={13} /> {map.t}
    </span>
  )
}

function Skeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {[0, 1].map((k) => (
        <div key={k} className="h-64 animate-pulse rounded-3xl bg-[#f1f4ed]" />
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#d6dcce] bg-white px-6 py-14 text-center">
      <img src={logoIcon} alt="CapNong" className="h-14 w-14 object-contain" />
      <p className="mt-3 max-w-md text-sm text-[#5d6657]">{text}</p>
    </div>
  )
}
