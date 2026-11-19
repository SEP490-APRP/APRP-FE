import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  HandCoins,
  ImagePlus,
  Lightbulb,
  Loader2,
  MapPin,
  Megaphone,
  Navigation,
  Package,
  ShieldCheck,
  Sprout,
  Users,
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
import CampaignProposals from './CampaignProposals'
import { campaignProposalService } from '@/services/campaignProposal.service'

const FARMER_KEEP_RATE = 0.9 // nhà vườn nhận 90% sau phí dịch vụ 10% (khớp capnong.wallet.farmer-fee-rate)

// 3 mức bảo quản, số ngày tính từ NGÀY CHỐT chiến dịch (vd chốt ngày 20: mức 1 tươi tới 22–23, mức 2 tới 23–24, mức 3 tới 25–26)
export const SHELF_LIFE: { id: ShelfLifeTier; level: number; min: number; max: number; label: string; hint: string; tone: string }[] = [
  { id: 'DAYS_2_3', level: 1, min: 2, max: 3, label: '2 – 3 ngày', hint: 'Rau ăn lá, quả chín mềm: dễ dập héo, giao gấp', tone: 'text-[#b3261e] bg-[#fdecea]' },
  { id: 'DAYS_3_4', level: 2, min: 3, max: 4, label: '3 – 4 ngày', hint: 'Cà chua, dưa leo, bắp: giữ được vài ngày ở nơi mát', tone: 'text-[#8a5a00] bg-[#fff3d6]' },
  { id: 'DAYS_5_6', level: 3, min: 5, max: 6, label: '5 – 6 ngày', hint: 'Củ, quả vỏ dày (bí, khoai, dưa hấu): bảo quản lâu', tone: 'text-[#2b5619] bg-[#e7f3de]' },
]
const SHELF_MAX_DAYS: Record<ShelfLifeTier, number> = { DAYS_2_3: 3, DAYS_3_4: 4, DAYS_5_6: 6 } // khớp ShelfLifeTier.maxDays ở BE
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return localIsoDate(d) }
const localIsoDate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const fmtDay = (iso: string) => iso.slice(8, 10) // 'YYYY-MM-DD' -> 'DD'
const shelfLabel = (t?: ShelfLifeTier | null) => SHELF_LIFE.find((s) => s.id === t)?.label ?? '—'
const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—')

const keys = {
  calls: ['shop-campaigns', 'calls'] as const,
  mine: ['shop-campaigns', 'mine'] as const,
}

/** Kênh Nhà Vườn › Chiến dịch giải cứu: xem lời kêu gọi, đăng ký lô hàng, theo dõi duyệt / cân / chi trả */
export default function Campaigns({ onInfo }: { onInfo?: (msg: string) => void }) {
  const [view, setView] = useState<'calls' | 'mine' | 'propose'>('calls')
  const [registering, setRegistering] = useState<CampaignResponse | null>(null)
  const calls = useQuery({ queryKey: keys.calls, queryFn: () => campaignService.getOpenFarmCalls(), retry: 1 })
  const mine = useQuery({ queryKey: keys.mine, queryFn: () => campaignService.getMyRegistrations(), retry: 1 })
  // Lời mời cùng đề xuất chiến dịch từ shop lân cận (cùng key với tab Đề xuất để làm mới cùng lúc)
  const invites = useQuery({ queryKey: ['campaign-proposals', 'invites'], queryFn: () => campaignProposalService.getInvites(), retry: 1 })
  const pendingInvites = (invites.data ?? []).filter((p) => p.myInvite?.status === 'PENDING')
  // Một shop có thể góp nhiều lô vào cùng chiến dịch
  const myByCampaign = useMemo(() => {
    const m = new Map<number, FarmRegistrationResponse[]>()
    for (const r of [...(mine.data ?? [])].reverse()) m.set(r.campaignId, [...(m.get(r.campaignId) ?? []), r])
    return m
  }, [mine.data])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="flex items-center gap-2 text-2xl font-black text-[#1c2216]">
          <Flame size={22} className="text-[#e8590c]" /> Chiến dịch giải cứu
        </h3>
        <p className="mt-1 text-sm text-[#5d6657]">Chọn việc bạn muốn làm:</p>
      </div>

      {/* 3 việc khác nhau: mỗi thẻ có biểu tượng, tên và một dòng giải thích để shop phân biệt */}
      <div role="tablist" aria-label="Chiến dịch giải cứu" className="grid gap-3 sm:grid-cols-3">
        {(
          [
            { id: 'calls', icon: Megaphone, title: 'Đang kêu gọi', desc: 'Chiến dịch CapNong đang cần hàng, đăng ký góp lô', n: calls.data?.length ?? 0, alert: 0 },
            { id: 'mine', icon: ClipboardList, title: 'Đăng ký của tôi', desc: 'Lô hàng bạn đã góp: duyệt, cân hàng, chi trả', n: mine.data?.length ?? 0, alert: 0 },
            { id: 'propose', icon: Lightbulb, title: 'Đề xuất chiến dịch', desc: 'Tự đề xuất mở chiến dịch, rủ shop lân cận', n: null, alert: pendingInvites.length },
          ] as const
        ).map(({ id, icon: Icon, title, desc, n, alert }) => {
          const on = view === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setView(id)}
              className={`relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${on ? 'border-[#326318] bg-[#f1f7ec] shadow-sm' : 'border-[#e8ece3] bg-white hover:border-[#b9d6a3] hover:bg-[#fafcf8]'}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${on ? 'bg-[#326318] text-white' : 'bg-[#f1f5ec] text-[#4a7c2f]'}`}>
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`text-sm font-black ${on ? 'text-[#1f3d0f]' : 'text-[#1c2216]'}`}>{title}</span>
                  {n != null && <span className="rounded-full bg-[#e7efe0] px-2 py-0.5 text-[11px] font-bold text-[#3c6224]">{n}</span>}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-[#6b7465]">{desc}</span>
              </span>
              {alert > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e8590c] px-1.5 text-[11px] font-black text-white shadow" aria-label={`${alert} lời mời mới`}>
                  {alert}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {view !== 'propose' && pendingInvites.length > 0 && (
        <button
          type="button"
          onClick={() => setView('propose')}
          className="flex w-full items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-left transition hover:bg-amber-100"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8590c] text-white"><Users size={18} /></span>
          <span className="min-w-0 flex-1 text-sm text-amber-900">
            <b>Bạn có {pendingInvites.length} lời mời cùng đề xuất chiến dịch</b>
            <span className="block text-xs">
              {pendingInvites[0].initiatorShopName} rủ bạn góp hàng giải cứu {pendingInvites[0].productName}
              {pendingInvites.length > 1 ? ` và ${pendingInvites.length - 1} lời mời khác` : ''}. Bấm để xem chi tiết và trả lời.
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-[#326318] px-3 py-1.5 text-xs font-bold text-white">Xem lời mời</span>
        </button>
      )}

      {view === 'propose' ? (
        <CampaignProposals onInfo={onInfo} />
      ) : view === 'calls' ? (
        calls.isLoading ? (
          <Skeleton />
        ) : calls.isError ? (
          <Empty text={getErrorMessage(calls.error, 'Chưa tải được danh sách chiến dịch.')} />
        ) : !calls.data?.length ? (
          <Empty text="Hiện chưa có chiến dịch nào kêu gọi nhà vườn. CapNong sẽ gửi thông báo khi có chiến dịch mới." />
        ) : (
          <div className="mx-auto grid max-w-4xl gap-6">
            {calls.data.map((c) => (
              <CallCard key={c.campaignId} c={c} mine={myByCampaign.get(c.campaignId) ?? []} onRegister={() => setRegistering(c)} />
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

function CallCard({ c, mine, onRegister }: { c: CampaignResponse; mine: FarmRegistrationResponse[]; onRegister: () => void }) {
  const gathered = Number(c.approvedSurplusKg ?? 0)
  const pct = c.targetVolumeKg > 0 ? Math.min(100, (gathered / c.targetVolumeKg) * 100) : 0
  const remaining = Math.max(0, c.targetVolumeKg - gathered)
  const myKg = mine.reduce((s, r) => s + Number(r.surplusVolumeKg ?? 0), 0)
  // Kêu gọi bổ sung: mọi nhà vườn đã giao xong mà vẫn thiếu hàng cho người mua
  const topUp = !!c.topUpOpen
  const need = Number(c.topUpRemainingKg ?? 0)
  return (
    <article className="overflow-hidden rounded-3xl border border-[#e4ede0] bg-white shadow-sm">
      {/* Đầu thẻ: ảnh bìa + tiêu đề */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:p-6">
        {c.coverImageUrl && (
          <img src={c.coverImageUrl} alt="" className="h-36 w-full shrink-0 rounded-2xl object-cover sm:h-28 sm:w-40" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e7f3de] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#2b5619]">
              {[c.categoryName, c.season].filter(Boolean).join(' · ') || 'Chiến dịch'}
            </span>
            {topUp ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fdecea] px-2.5 py-0.5 text-[11px] font-extrabold text-[#b3261e]">
                <Clock size={12} /> Cần bổ sung gấp
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3d6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#8a5a00]">
                <Clock size={12} /> {timeLeftLabel(c.farmCutoffAt ?? c.cutoffAt)}
              </span>
            )}
          </div>
          <h4 className="mt-2 text-xl font-black leading-snug text-[#1c2216]">{c.title}</h4>
          <a
            href={`/chien-dich/${c.campaignId}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-sm font-bold text-[#326318] hover:underline"
          >
            Đọc bài chiến dịch →
          </a>
        </div>
      </div>

      {/* 3 con số chính */}
      {topUp ? (
        <dl className="grid grid-cols-3 divide-x divide-[#f6d9d5] border-y border-[#f6d9d5] bg-[#fff7f5]">
          <BigStat label="Giá thu mua" value={formatVnd(c.rescuePricePerKg)} unit="/kg" />
          <BigStat label="Còn cần bổ sung" value={formatKg(need)} unit={`/ ${formatKg(c.topUpKg)}`} />
          <BigStat label="Mở bổ sung" value={c.topUpCallAt ? fmtDate(c.topUpCallAt) : '—'} />
        </dl>
      ) : (
        <dl className="grid grid-cols-3 divide-x divide-[#eef2ea] border-y border-[#eef2ea] bg-[#fafcf8]">
          <BigStat label="Giá thu mua" value={formatVnd(c.rescuePricePerKg)} unit="/kg" />
          <BigStat label="Còn cần gom" value={formatKg(remaining)} unit={`/ ${formatKg(c.targetVolumeKg)}`} />
          <BigStat label="Hạn góp hàng" value={fmtDate(c.farmCutoffAt ?? c.cutoffAt)} />
        </dl>
      )}

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {topUp && (
          <p className="rounded-2xl bg-[#fdecea] px-4 py-3 text-sm text-[#7a1d16]">
            Các nhà vườn đã giao hết phần được chia nhưng hàng đạt chuẩn vẫn thiếu <b>{formatKg(need)}</b> để giao cho người mua.
            Bạn có thể đăng ký thêm lô, tối đa {formatKg(need)}. Được duyệt thì mang đúng số kg được chia tới điểm gom, không nhận phần dư.
          </p>
        )}

        {/* Tiến độ gom */}
        <div className={topUp ? 'hidden' : undefined}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-bold text-[#1c2216]">Đã gom {formatKg(gathered)}</span>
            <span className="text-[#5d6657]">{c.approvedFarmCount ?? 0} nhà vườn được duyệt · {Math.round(pct)}%</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-[#e9efe4]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#4a7c2f] to-[#8bc56b]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Điểm gom + bản đồ */}
        <SiteLocation c={c} label="Điểm gom hàng" compact />

        {/* Các lô mình đã đăng ký */}
        {mine.length > 0 && (
          <div className="rounded-2xl border border-[#e4ede0] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#5d6657]">
              Lô bạn đã đăng ký · {mine.length} lô · {formatKg(myKg)}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {mine.map((r, i) => (
                <li key={r.registrationId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 text-[#1c2216]">
                    <b>Lô {i + 1}</b> · {r.productName || 'Nông sản'} · {formatKg(r.surplusVolumeKg)}
                  </span>
                  <StatusChip status={r.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onRegister}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#326318] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#244a10] active:scale-[0.99] sm:w-auto sm:self-end"
        >
          <Sprout size={16} /> {topUp ? 'Đăng ký lô bổ sung' : mine.length ? 'Đăng ký thêm lô hàng' : 'Đăng ký góp hàng'}
        </button>
      </div>
    </article>
  )
}

function BigStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-6">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7e8779]">{label}</dt>
      <dd className="mt-0.5 truncate text-lg font-black text-[#1c2216] sm:text-xl">
        {value}
        {unit && <span className="ml-1 text-xs font-semibold text-[#7e8779]">{unit}</span>}
      </dd>
    </div>
  )
}

/* ─────────────────────────── Form đăng ký lô hàng ─────────────────────────── */

export function RegisterDialog({ c, onClose, onDone }: { c: CampaignResponse; onClose: () => void; onDone: () => void }) {
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
  // Kêu gọi bổ sung: giới hạn số kg còn thiếu; ngày giao dự kiến đã qua thì tính từ ngày mai
  const topUp = !!c.topUpOpen
  const topUpMax = Number(c.topUpRemainingKg ?? 0)
  const tomorrow = localIsoDate(new Date(Date.now() + 86400e3))
  const baseDelivery = c.deliveryDate ? c.deliveryDate.slice(0, 10) : null
  const deliveryDate = topUp && (!baseDelivery || baseDelivery < tomorrow) ? tomorrow : baseDelivery
  const priceDiff = c.rescuePricePerKg > 0 && priceNum > 0 ? (priceNum - c.rescuePricePerKg) / c.rescuePricePerKg : 0

  // Ngày thu hoạch phải trước ngày bắt đầu chiến dịch (chiến dịch cũ chưa có ngày bắt đầu: không sau ngày chốt)
  // Mốc tính bảo quản = ngày kết thúc chiến dịch (lô bổ sung thu hoạch sau mốc đó thì tính từ ngày thu hoạch)
  const cutoffDate = localIsoDate(new Date(c.cutoffAt))
  const startDate = c.startDate ? c.startDate.slice(0, 10) : null
  const endDate = c.endDate ? c.endDate.slice(0, 10) : null
  const harvestMax = topUp ? addDays(today, 2) : startDate ? addDays(startDate, -1) : cutoffDate
  const baseAnchor = endDate ?? cutoffDate
  const anchor = harvestDate && harvestDate > baseAnchor ? harvestDate : baseAnchor
  const freshUntil = (t: ShelfLifeTier) => addDays(anchor, SHELF_MAX_DAYS[t])
  const errors = {
    product: !productName.trim() ? 'Nhập tên sản phẩm' : null,
    kg: !(kgNum > 0) ? 'Nhập số kg lớn hơn 0' : topUp && kgNum > topUpMax ? `Chiến dịch chỉ còn cần bổ sung ${formatKg(topUpMax)}` : null,
    harvest: !harvestDate
      ? 'Chọn ngày thu hoạch'
      : harvestDate > harvestMax
        ? topUp ? `Lô bổ sung thu hoạch chậm nhất ${fmtDate(harvestMax)}`
          : startDate ? `Ngày thu hoạch phải trước ngày bắt đầu chiến dịch ${fmtDate(startDate)}` : `Ngày thu hoạch không được sau ngày chốt ${fmtDate(harvestMax)}`
        : null,
    images: images.length === 0 ? 'Thêm ít nhất 1 ảnh lô hàng' : null,
    shelf: !shelf
      ? 'Chọn thời gian bảo quản'
      : deliveryDate && deliveryDate > freshUntil(shelf)
        ? `${shelfLabel(shelf)} chỉ giữ tươi tới ${fmtDate(freshUntil(shelf))}, nhưng ngày giao là ${fmtDate(deliveryDate)}. Chọn độ bền dài hơn.`
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
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4a7c2f]">Đăng ký góp hàng</p>
            <h4 id="dk-title" className="mt-1 text-lg font-black leading-snug text-[#1c2216] sm:text-xl">{c.title}</h4>
            <SiteLocation c={c} />
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
                    step="any"
                    inputMode="decimal"
                    value={kg}
                    onChange={(e) => setKg(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 pr-10 text-sm font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7e8779]">kg</span>
                </div>
                {topUp && <span className="mt-1 block font-medium text-[#b3261e]">Bổ sung tối đa {formatKg(topUpMax)}</span>}
                {err('kg')}
              </label>
              <label className="text-xs font-bold text-[#1c2216]">
                Ngày thu hoạch dự kiến
                <input
                  type="date"
                  max={harvestMax}
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe6d8] bg-[#fbfcf9] px-3 py-2.5 text-sm font-medium"
                />
                <span className="mt-1 block text-[11px] font-medium text-[#7e8779]">
                  Chậm nhất {fmtDate(harvestMax)}{topUp ? '' : startDate ? ` (trước ngày bắt đầu ${fmtDate(startDate)})` : ' (ngày chốt)'}
                </span>
                {err('harvest')}
              </label>
            </div>

            {/* Mốc thời gian để shop chọn ngày thu hoạch phù hợp */}
            <ol className="mt-4 grid gap-x-2 gap-y-3 rounded-2xl border border-[#e3ecd9] bg-[#f6faf2] p-3.5 text-xs sm:grid-cols-2">
              <li className="flex gap-2">
                <CalendarClock size={15} className="mt-0.5 shrink-0 text-[#4a7c2f]" />
                <span>
                  <span className="block font-bold text-[#1c2216]">Hạn góp hàng</span>
                  <span className="text-[#5d6657]">{fmtDate(c.farmCutoffAt ?? c.cutoffAt)}</span>
                </span>
              </li>
              {(startDate || endDate) && (
                <li className="flex gap-2">
                  <CalendarClock size={15} className="mt-0.5 shrink-0 text-[#4a7c2f]" />
                  <span>
                    <span className="block font-bold text-[#1c2216]">Chiến dịch diễn ra</span>
                    <span className="text-[#5d6657]">
                      {startDate && `Từ ${fmtDate(startDate)}`}{startDate && endDate ? ' ' : ''}{endDate && `đến ${fmtDate(endDate)}`}
                    </span>
                  </span>
                </li>
              )}
              <li className="flex gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#4a7c2f]" />
                <span>
                  <span className="block font-bold text-[#1c2216]">Mang hàng tới điểm tập kết</span>
                  <span className="text-[#5d6657]">
                    Sau khi được duyệt, {deliveryDate ? `chậm nhất trước ngày ${fmtDate(deliveryDate)}` : 'CapNong sẽ hẹn ngày'}
                  </span>
                </span>
              </li>
              <li className="flex gap-2">
                <Package size={15} className="mt-0.5 shrink-0 text-[#4a7c2f]" />
                <span>
                  <span className="block font-bold text-[#1c2216]">Giao tới người mua</span>
                  <span className="text-[#5d6657]">{deliveryDate ? `Dự kiến ${fmtDate(deliveryDate)}` : 'Sẽ thông báo sau'}</span>
                </span>
              </li>
            </ol>
            <p className="mt-2 text-[11px] leading-relaxed text-[#7e8779]">
              {startDate ? `Ngày thu hoạch phải trước ngày bắt đầu chiến dịch ${fmtDate(startDate)}` : `Ngày thu hoạch không được sau ngày chốt ${fmtDate(cutoffDate)}`}. Độ bền ở bước 4 tính từ ngày kết thúc chiến dịch{endDate ? ` ${fmtDate(endDate)}` : ''}, và hàng phải còn tươi
              tới ngày giao{deliveryDate ? ` ${fmtDate(deliveryDate)}` : ''}.
            </p>
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
          <Step n={4} title="Độ bền sau khi kết thúc chiến dịch" icon={Clock} hint={`Chiến dịch kết thúc ${fmtDate(baseAnchor)}: tính từ ngày đó, hàng của bạn còn tươi thêm bao nhiêu ngày?`}>
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
                  <span className="mt-2 block text-sm font-bold text-[#1c2216]">
                    Tươi tới {fmtDay(addDays(anchor, s.min))} – {fmtDate(addDays(anchor, s.max))}
                  </span>
                  {deliveryDate && deliveryDate > addDays(anchor, s.max) && (
                    <span className="mt-1 block text-[11px] font-bold text-[#b3261e]">Không kịp ngày giao {fmtDate(deliveryDate)}</span>
                  )}
                  <span className="mt-1 block text-xs leading-snug text-[#5d6657]">{s.hint}</span>
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
                    step="any"
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
            <div className="min-w-0 space-y-0.5 text-xs leading-relaxed text-[#5d6657]">
              <p className="flex items-center gap-1.5 font-bold text-[#1c2216]">
                <CalendarClock size={14} className="shrink-0 text-[#4a7c2f]" /> Hạn góp hàng: {fmtDate(c.farmCutoffAt ?? c.cutoffAt)}
              </p>
              <p>CapNong sẽ liên hệ thương lượng giá và duyệt lô hàng trước {fmtDate(c.cutoffAt)}.</p>
            </div>
            <button
              type="submit"
              disabled={submit.isPending || uploading}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#326318] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#244a10] disabled:opacity-60"
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

/* ─────────────────────────── Điểm tập kết: chỉ đường + bản đồ ─────────────────────────── */

function SiteLocation({ c, label = 'Mang hàng tới', compact }: { c: CampaignResponse; label?: string; compact?: boolean }) {
  const [showMap, setShowMap] = useState(false)
  const hasCoord = c.collectionSiteLatitude != null && c.collectionSiteLongitude != null
  const q = hasCoord ? `${c.collectionSiteLatitude},${c.collectionSiteLongitude}` : (c.collectionSiteAddress ?? '')
  return (
    <div className={`${compact ? '' : 'mt-3 '}overflow-hidden rounded-2xl border border-[#e3ecd9] bg-[#f6faf2]`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#4a7c2f] shadow-sm">
          <MapPin size={16} />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7e8779]">{label}</p>
          <p className="text-sm font-bold text-[#1c2216]">{c.collectionSiteName || 'Điểm gom sẽ được thông báo'}</p>
          {c.collectionSiteAddress && <p className="text-xs leading-relaxed text-[#5d6657]">{c.collectionSiteAddress}</p>}
          {q && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                aria-expanded={showMap}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#2b5619] shadow-sm ring-1 ring-[#d6e6c8] hover:bg-[#eef6e7]"
              >
                <MapPin size={13} /> {showMap ? 'Ẩn bản đồ' : 'Xem bản đồ'}
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#4a7c2f] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2b5619]"
              >
                <Navigation size={13} /> Chỉ đường
              </a>
            </div>
          )}
        </div>
      </div>
      {showMap && q && (
        <iframe
          title="Bản đồ điểm tập kết"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=vi&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-56 w-full border-0 sm:h-64"
        />
      )}
    </div>
  )
}

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
          {r.intakeAt != null && r.countedWeightKg != null && <Mini label="Kg được tính tiền" value={formatKg(r.countedWeightKg)} />}
          {r.payoutAmount == null && r.estimatedPayoutAmount != null && <Mini label="Tiền dự tính" value={`${formatVnd(r.estimatedPayoutAmount)} · nhận khi hoàn thành`} />}
          {r.payoutAmount != null && <Mini label="Đã nhận" value={formatVnd(r.payoutAmount)} />}
          <Mini label="Điểm gom" value={r.collectionSiteName || '—'} />
        </dl>
        {r.reviewNote && <p className="mt-3 rounded-xl bg-[#f4f7f1] px-3 py-2 text-xs text-[#5d6657]">CapNong: {r.reviewNote}</p>}
        {r.status !== 'REJECTED' && r.status !== 'CANCELLED' && (
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
    CANCELLED: { t: 'Chiến dịch đã huỷ', c: 'bg-gray-100 text-gray-600', I: XCircle },
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
