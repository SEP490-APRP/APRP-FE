import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Loader2, MapPin, Plus, Search, Send, ShieldCheck, Store, X } from 'lucide-react'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import {
  adminCampaignService,
  type CampaignResponse,
  type CampaignShopRow,
  type FarmRegistrationResponse,
  type FarmRegistrationStatus,
  type ShelfLifeTier,
} from '@/services'
import logoIcon from '@/assets/logo-icon.png'
import { getErrorMessage } from '@/utils'

/**
 * Admin chủ động tìm hàng cho chiến dịch đã tạo:
 * - Mời shop lân cận điểm tập kết (gửi thông báo)
 * - Nhập hộ số kg cho shop đã đồng ý góp (lô được duyệt luôn)
 * - Bổ sung hàng thiếu khi gom hàng (shop trong chiến dịch, shop khác, shop mới)
 */

const RADII = [5, 10, 20, 30, 50]
const REG_LABEL: Record<FarmRegistrationStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Đã duyệt', tone: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Đã từ chối', tone: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Đã huỷ', tone: 'bg-gray-100 text-gray-600' },
}
const SHELF: { id: ShelfLifeTier; label: string }[] = [
  { id: 'DAYS_2_3', label: '2–3 ngày' },
  { id: 'DAYS_3_4', label: '3–4 ngày' },
  { id: 'DAYS_5_6', label: '5–6 ngày' },
]
const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal'

/* ─────────────────────────── Mời shop lân cận ─────────────────────────── */

export function InviteShopsDialog({ c, onClose, onDone }: { c: CampaignResponse; onClose: () => void; onDone: (n: number) => void }) {
  const [radius, setRadius] = useState(10)
  const [sameCategory, setSameCategory] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [message, setMessage] = useState(
    `CapNong đang cần ${formatKg(c.targetVolumeKg)} cho chiến dịch "${c.title}". Vườn bạn có hàng thì cùng góp nhé!`,
  )
  const hasSite = c.collectionSiteLatitude != null && c.collectionSiteLongitude != null
  const q = useQuery({
    queryKey: ['admin-campaign-nearby', c.campaignId, radius, sameCategory],
    queryFn: () => adminCampaignService.nearbyShops(c.campaignId, radius, sameCategory),
    enabled: hasSite,
  })
  const invite = useMutation({
    mutationFn: () => adminCampaignService.inviteShops(c.campaignId, picked, message.trim() || undefined),
    onSuccess: (n) => onDone(n),
  })
  const rows = q.data ?? []
  const toggle = (id: number) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(0, 50)))
  const allIds = rows.map((r) => r.shopId)
  const allPicked = allIds.length > 0 && allIds.every((id) => picked.includes(id))

  return (
    <Shell title="Mời shop lân cận góp hàng" subtitle={c.collectionSiteName ? `Quanh ${c.collectionSiteName}` : undefined} onClose={onClose}>
      {!hasSite ? (
        <p className="m-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Chiến dịch chưa ghim điểm tập kết trên bản đồ. Bấm "Chỉnh sửa" và chọn địa chỉ điểm tập kết trước.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
            <span className="text-xs font-bold text-gray-500">Bán kính:</span>
            {RADII.map((r) => (
              <button key={r} type="button" onClick={() => setRadius(r)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${radius === r ? 'bg-[#326318] text-white' : 'bg-[#f4f7f1] text-[#326318]'}`}>
                {r} km
              </button>
            ))}
            <label className="ml-auto flex items-center gap-1.5 text-xs font-bold text-gray-600">
              <input type="checkbox" checked={sameCategory} onChange={(e) => setSameCategory(e.target.checked)} className="accent-[#326318]" />
              Chỉ shop cùng loại{c.categoryName ? ` (${c.categoryName})` : ''}
            </label>
          </div>
          <div className="min-h-[220px] flex-1 overflow-y-auto px-5 py-2">
            {q.isPending ? (
              <div className="mt-2 h-40 animate-pulse rounded-2xl bg-gray-100" />
            ) : q.isError ? (
              <p className="py-6 text-sm font-semibold text-red-600">{getErrorMessage(q.error, 'Chưa tải được shop lân cận.')}</p>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">Chưa có shop đã xác minh nào trong {radius} km. Thử mở rộng bán kính.</p>
            ) : (
              <>
                <label className="flex items-center gap-2 border-b border-gray-100 py-2.5 text-xs font-bold text-gray-600">
                  <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? [] : allIds.slice(0, 50))} className="h-4 w-4 accent-[#326318]" />
                  Chọn tất cả ({rows.length} shop)
                </label>
                <ul className="divide-y divide-gray-100">
                  {rows.map((s) => (
                    <li key={s.shopId}>
                      <label className="flex cursor-pointer items-center gap-3 py-3">
                        <input type="checkbox" checked={picked.includes(s.shopId)} onChange={() => toggle(s.shopId)} className="h-4 w-4 accent-[#326318]" />
                        <ShopIdentity s={s} />
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
            <textarea value={message} maxLength={300} rows={2} onChange={(e) => setMessage(e.target.value)} className={inputCls} aria-label="Lời nhắn" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500">Shop nhận thông báo kèm lời nhắn. Tối đa 50 shop mỗi lần.</p>
              <button type="button" disabled={!picked.length || invite.isPending} onClick={() => invite.mutate()}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#326318] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {invite.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Mời {picked.length || ''} shop
              </button>
            </div>
            {invite.isError && <p className="text-sm font-semibold text-red-600">{getErrorMessage(invite.error, 'Chưa gửi được lời mời.')}</p>}
          </div>
        </>
      )}
    </Shell>
  )
}

/* ─────────────────────────── Nhập hộ shop & số kg ─────────────────────────── */

export function AddShopKgDialog({ c, onClose, onDone }: { c: CampaignResponse; onClose: () => void; onDone: (text: string) => void }) {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query.trim(), 400)
  const [shop, setShop] = useState<CampaignShopRow | null>(null)
  const hasSite = c.collectionSiteLatitude != null && c.collectionSiteLongitude != null
  // Chưa gõ tên: gợi ý shop trong 20 km quanh điểm tập kết
  const list = useQuery({
    queryKey: ['admin-campaign-shop-pick', c.campaignId, debounced],
    queryFn: () => (debounced.length >= 2
      ? adminCampaignService.searchShops(c.campaignId, debounced)
      : adminCampaignService.nearbyShops(c.campaignId, 20, false)),
    enabled: debounced.length >= 2 || hasSite,
  })

  const harvestMax = c.startDate ? dayBefore(c.startDate) : (c.cutoffAt ? c.cutoffAt.slice(0, 10) : undefined)
  const [f, setF] = useState({
    kg: '',
    harvest: '',
    shelf: 'DAYS_3_4' as ShelfLifeTier,
    note: '',
  })
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }))
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => adminCampaignService.addRegistration(c.campaignId, {
      shopId: shop!.shopId,
      surplusVolumeKg: Number(f.kg),
      harvestDate: f.harvest,
      shelfLifeTier: f.shelf,
      note: f.note.trim() || undefined,
    }),
    onSuccess: (r) => onDone(`Đã nhập hộ ${formatKg(r.surplusVolumeKg)} cho ${shop?.shopName} và duyệt lô.`),
  })
  const submit = () => {
    if (!shop) return setError('Chọn shop trước.')
    if (!(Number(f.kg) > 0)) return setError('Nhập số kg lớn hơn 0.')
    if (!f.harvest) return setError('Chọn ngày thu hoạch dự kiến.')
    if (harvestMax && f.harvest > harvestMax) {
      return setError(c.startDate ? `Ngày thu hoạch phải trước ngày bắt đầu mở điểm tập kết (chậm nhất ${fmtDay(harvestMax)}).` : `Ngày thu hoạch không được sau ngày chốt ${fmtDay(harvestMax)}.`)
    }
    setError(null)
    save.mutate()
  }

  return (
    <Shell title="Thêm shop đã đồng ý góp" subtitle="CapNong nhập hộ số kg, lô được duyệt luôn và shop nhận thông báo" onClose={onClose}>
      <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:overflow-hidden">
        {/* Bước 1: chọn shop */}
        <section className="flex min-h-0 flex-col border-b border-gray-100 md:border-b-0 md:border-r">
          <p className="px-5 pt-4 text-xs font-extrabold uppercase tracking-wide text-[#4a7c2f]">1 · Chọn shop</p>
          <div className="relative px-5 py-3">
            <Search size={15} className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên gian hàng hoặc số điện thoại" className={`${inputCls} pl-9`} />
          </div>
          <div className="min-h-[180px] flex-1 overflow-y-auto px-5 pb-3 md:max-h-[52vh]">
            {!list.isFetched && list.isFetching ? (
              <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            ) : list.isError ? (
              <p className="py-4 text-sm font-semibold text-red-600">{getErrorMessage(list.error, 'Chưa tải được danh sách shop.')}</p>
            ) : (list.data ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                {debounced.length >= 2 ? 'Không tìm thấy shop phù hợp.' : 'Gõ tên shop để tìm (gợi ý shop lân cận cần điểm tập kết có toạ độ).'}
              </p>
            ) : (
              <>
                {debounced.length < 2 && <p className="pb-1 text-[11px] font-semibold text-gray-500">Gợi ý: shop trong 20 km quanh điểm tập kết</p>}
                <ul className="flex flex-col gap-1.5">
                  {(list.data ?? []).map((s) => (
                    <li key={s.shopId}>
                      <button type="button" onClick={() => { setShop(s); setError(null) }}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${shop?.shopId === s.shopId ? 'border-[#326318] bg-[#f4f7f1] ring-2 ring-[#326318]/20' : 'border-gray-200 hover:border-[#9ed67d]'}`}>
                        <ShopIdentity s={s} />
                        {shop?.shopId === s.shopId && <Check size={16} className="shrink-0 text-[#326318]" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* Bước 2: số kg và thông tin lô */}
        <section className="flex min-h-0 flex-col overflow-y-auto">
          <p className="px-5 pt-4 text-xs font-extrabold uppercase tracking-wide text-[#4a7c2f]">2 · Lô hàng</p>
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <Store size={15} className="shrink-0 text-[#326318]" />
            {shop ? <b className="truncate">{shop.shopName}</b> : <span className="text-gray-500">Chưa chọn shop</span>}
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Field label="Số kg góp" required>
              <input type="number" step="any" min={0} value={f.kg} onChange={(e) => set('kg')(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Ngày thu hoạch dự kiến" required hint={harvestMax ? `Chậm nhất ${fmtDay(harvestMax)}` : undefined}>
              <input type="date" max={harvestMax} value={f.harvest} onChange={(e) => set('harvest')(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nông sản">
              <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm font-black text-gray-900">{c.productName || c.categoryName || c.title}</p>
            </Field>
            <Field label="Giá thu mua cố định">
              <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm font-black text-gray-900">{formatVnd(c.rescuePricePerKg)}/kg</p>
            </Field>
            <Field label="Độ bền sau ngày kết thúc mở điểm tập kết" wide>
              <div className="grid grid-cols-3 gap-2">
                {SHELF.map((s) => (
                  <button key={s.id} type="button" onClick={() => set('shelf')(s.id)}
                    className={`rounded-xl border px-2 py-2 text-xs font-bold ${f.shelf === s.id ? 'border-[#326318] bg-[#f4f7f1] text-[#326318]' : 'border-gray-200 text-gray-600'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Ghi chú (vd shop xác nhận qua điện thoại)" wide>
              <input value={f.note} maxLength={300} onChange={(e) => set('note')(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="mt-auto space-y-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
            {(error || save.isError) && (
              <p className="text-sm font-semibold text-red-600">{error ?? getErrorMessage(save.error, 'Chưa lưu được lô hàng.')}</p>
            )}
            <button type="button" onClick={submit} disabled={save.isPending}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Lưu & duyệt lô hàng
            </button>
          </div>
        </section>
      </div>
    </Shell>
  )
}

/* ─────────────────────────── Bổ sung hàng thiếu ─────────────────────────── */

interface SupplyShop {
  shopId: number
  shopName: string
  sub: string
  /** Lô đã duyệt trong chiến dịch: kg đạt chuẩn đã nhận, kg còn thiếu so với phân bổ và giá thu mua */
  inCampaign?: { kg: number; short: number; price?: number | null }
}

const EMPTY_SHOP = { shopName: '', ownerName: '', phoneNumber: '', email: '', address: '', bankName: '', bankAccount: '', bankAccountHolder: '' }

export function AddSupplyDialog({ c, regs, onClose, onDone }: {
  c: CampaignResponse
  regs: FarmRegistrationResponse[]
  onClose: () => void
  onDone: (text: string) => void
}) {
  const need = Number(c.topUpRemainingKg ?? c.shortfallVolumeKg ?? 0)
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query.trim(), 400)
  const [picked, setPicked] = useState<SupplyShop | 'new' | null>(null)
  const [weight, setWeight] = useState('')
  const [info, setInfo] = useState(EMPTY_SHOP)
  const [error, setError] = useState<string | null>(null)
  const search = useQuery({
    queryKey: ['admin-campaign-shop-pick', c.campaignId, debounced],
    queryFn: () => adminCampaignService.searchShops(c.campaignId, debounced),
    enabled: debounced.length >= 2,
  })

  // Shop đang có lô đã duyệt trong chiến dịch (gộp các lô của cùng shop)
  const members = new Map<number, SupplyShop>()
  for (const r of regs) {
    if (r.status !== 'APPROVED' || r.paidOutAt) continue
    const old = members.get(r.shopId)
    const received = (old?.inCampaign?.kg ?? 0) + Number(r.countedWeightKg ?? 0)
    const short = (old?.inCampaign?.short ?? 0) + Number(r.shortfallKg ?? 0)
    members.set(r.shopId, {
      shopId: r.shopId,
      shopName: r.shopName ?? `Shop #${r.shopId}`,
      sub: r.shopPhone ?? '',
      inCampaign: { kg: received, short, price: r.agreedPricePerKg },
    })
  }
  const q = query.trim().toLowerCase()
  // Shop giao thiếu xếp trước
  const mine = [...members.values()]
    .filter((s) => !q || s.shopName.toLowerCase().includes(q) || s.sub.includes(q))
    .sort((a, b) => (b.inCampaign?.short ?? 0) - (a.inCampaign?.short ?? 0))
  const others: SupplyShop[] = debounced.length >= 2
    ? (search.data ?? [])
      .filter((s) => !members.has(s.shopId))
      .map((s) => ({ shopId: s.shopId, shopName: s.shopName, sub: s.categories.join(', ') }))
    : []

  const isNew = picked === 'new'
  const shop = picked && picked !== 'new' ? picked : null
  const setField = (k: keyof typeof EMPTY_SHOP) => (v: string) => setInfo((s) => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: () => adminCampaignService.supplement(c.campaignId, {
      shopId: shop?.shopId,
      newShop: isNew
        ? (Object.fromEntries(Object.entries(info).map(([k, v]) => [k, v.trim()])) as typeof EMPTY_SHOP)
        : undefined,
      weightKg: Number(weight),
    }),
    onSuccess: (r) => onDone(`Đã nhận thêm ${formatKg(Number(weight))} từ ${r.shopName}.${isNew ? ' Đã tạo tài khoản shop, shop đặt mật khẩu qua "Quên mật khẩu".' : ''}`),
  })

  const pick = (s: SupplyShop | 'new') => {
    setPicked(s)
    setError(null)
    save.reset()
    if (s === 'new' && !info.shopName) setField('shopName')(query.trim())
  }

  const submit = () => {
    if (!picked) return setError('Chọn shop trước.')
    if (isNew) {
      if (![info.shopName, info.ownerName, info.phoneNumber, info.email, info.address].every((v) => v.trim())) {
        return setError('Nhập đủ các ô có dấu *.')
      }
      if (!/^(0|\+84)[35789]\d{8}$/.test(info.phoneNumber.trim())) return setError('Số điện thoại chưa đúng.')
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(info.email.trim())) return setError('Email chưa đúng.')
    }
    if (!(Number(weight) > 0)) return setError('Nhập số kg lớn hơn 0.')
    if (Number(weight) > need) return setError(`Chỉ còn thiếu ${formatKg(need)}.`)
    setError(null)
    save.mutate()
  }

  const row = (s: SupplyShop) => (
    <li key={s.shopId}>
      <button type="button" onClick={() => pick(s)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${shop?.shopId === s.shopId ? 'border-[#326318] bg-[#f4f7f1] ring-2 ring-[#326318]/20' : 'border-gray-200 hover:border-[#9ed67d]'}`}>
        <Store size={18} className="shrink-0 text-[#326318]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-gray-900">{s.shopName}</span>
          {s.sub && <span className="block truncate text-[11px] text-gray-500">{s.sub}</span>}
        </span>
        {s.inCampaign && (
          <span className="flex shrink-0 flex-col items-end gap-1 text-[11px] font-bold">
            {s.inCampaign.short > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">thiếu {formatKg(s.inCampaign.short)}</span>}
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">đã nhận {formatKg(s.inCampaign.kg)}</span>
          </span>
        )}
      </button>
    </li>
  )

  return (
    <Shell title="Bổ sung hàng" subtitle={`Còn thiếu ${formatKg(need)}`} onClose={onClose}>
      <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
        <section className="flex min-h-0 flex-col border-b border-gray-100 md:border-b-0 md:border-r">
          <div className="relative px-5 py-3">
            <Search size={15} className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên shop hoặc số điện thoại" aria-label="Tìm shop" className={`${inputCls} pl-9`} />
          </div>
          <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto px-5 pb-3 md:max-h-[56vh]">
            {mine.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold text-gray-500">Trong chiến dịch</p>
                <ul className="flex flex-col gap-1.5">{mine.map(row)}</ul>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold text-gray-500">Shop khác trên CapNong</p>
                <ul className="flex flex-col gap-1.5">{others.map(row)}</ul>
              </div>
            )}
            {search.isFetching && <div className="h-12 animate-pulse rounded-xl bg-gray-100" />}
            {search.isError && <p className="text-sm font-semibold text-red-600">{getErrorMessage(search.error, 'Chưa tìm được shop.')}</p>}
            <button type="button" onClick={() => pick('new')}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-2.5 text-sm font-bold text-[#326318] ${isNew ? 'border-[#326318] bg-[#f4f7f1]' : 'border-[#9ed67d]'}`}>
              <Plus size={16} /> Shop mới{query.trim() ? `: ${query.trim()}` : ''}
            </button>
          </div>
        </section>

        <section className="flex min-h-0 flex-col md:overflow-y-auto">
          {!picked ? (
            <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-400">Chọn shop giao thêm hàng</p>
          ) : (
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {isNew ? (
                <>
                  <Field label="Tên gian hàng" required><input value={info.shopName} onChange={(e) => setField('shopName')(e.target.value)} className={inputCls} /></Field>
                  <Field label="Chủ shop" required><input value={info.ownerName} onChange={(e) => setField('ownerName')(e.target.value)} className={inputCls} /></Field>
                  <Field label="Số điện thoại" required><input type="tel" value={info.phoneNumber} onChange={(e) => setField('phoneNumber')(e.target.value)} className={inputCls} /></Field>
                  <Field label="Email" required><input type="email" value={info.email} onChange={(e) => setField('email')(e.target.value)} className={inputCls} /></Field>
                  <Field label="Địa chỉ" required wide><input value={info.address} onChange={(e) => setField('address')(e.target.value)} className={inputCls} /></Field>
                  <Field label="Ngân hàng"><input value={info.bankName} onChange={(e) => setField('bankName')(e.target.value)} className={inputCls} /></Field>
                  <Field label="Số tài khoản"><input inputMode="numeric" value={info.bankAccount} onChange={(e) => setField('bankAccount')(e.target.value)} className={inputCls} /></Field>
                  <Field label="Tên chủ tài khoản" wide><input value={info.bankAccountHolder} onChange={(e) => setField('bankAccountHolder')(e.target.value)} className={inputCls} /></Field>
                </>
              ) : shop && (
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm sm:col-span-2">
                  <Store size={15} className="shrink-0 text-[#326318]" />
                  <b className="min-w-0 flex-1 truncate">{shop.shopName}</b>
                  {!!shop.inCampaign?.short && <span className="shrink-0 text-xs font-bold text-red-700">thiếu {formatKg(shop.inCampaign.short)}</span>}
                  <span className="shrink-0 text-xs text-gray-500">{formatVnd(shop.inCampaign?.price ?? c.rescuePricePerKg)}/kg</span>
                </div>
              )}
              <Field label="Số kg nhận thêm" hint={`Giá thu mua cố định ${formatVnd(c.rescuePricePerKg)}/kg`} required wide>
                <div className="flex gap-2">
                  <input type="number" step="any" min={0} max={need} value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
                  <button type="button" onClick={() => setWeight(String(need))} className="shrink-0 rounded-xl bg-[#f4f7f1] px-3 text-xs font-bold text-[#326318]">Đủ {formatKg(need)}</button>
                </div>
              </Field>
            </div>
          )}
          <div className="mt-auto space-y-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
            {(error || save.isError) && (
              <p role="alert" className="text-sm font-semibold text-red-600">{error ?? getErrorMessage(save.error, 'Chưa lưu được.')}</p>
            )}
            <button type="button" onClick={submit} disabled={!picked || save.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {Number(weight) > 0 ? `Nhận thêm ${formatKg(Number(weight))}` : 'Nhận thêm hàng'}
            </button>
          </div>
        </section>
      </div>
    </Shell>
  )
}

/* ─────────────────────────── Phần dùng chung ─────────────────────────── */

function ShopIdentity({ s }: { s: CampaignShopRow }) {
  const reg = s.registrationStatus ? REG_LABEL[s.registrationStatus] : null
  return (
    <>
      <img src={s.logoUrl || logoIcon} alt="" className="h-10 w-10 shrink-0 rounded-full border border-gray-200 bg-white object-cover" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-bold text-gray-900">
          <span className="truncate">{s.shopName}</span>
          <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="Đã xác minh" />
          {s.sameCategory && <span className="shrink-0 rounded-full bg-[#e7f3de] px-1.5 text-[10px] font-bold text-[#2b5619]">Cùng loại</span>}
        </p>
        <p className="truncate text-[11px] text-gray-500">
          {s.ratingAverage != null && `★ ${s.ratingAverage.toFixed(1)} · `}
          {s.categories.length ? s.categories.join(', ') : 'Chưa đăng sản phẩm'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {s.distanceKm != null && (
          <span className="inline-flex items-center gap-0.5 text-xs font-black tabular-nums text-[#326318]"><MapPin size={11} />~{s.distanceKm} km</span>
        )}
        {reg && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${reg.tone}`}>
            {reg.label}{Number(s.registeredKg) > 0 ? ` · ${formatKg(Number(s.registeredKg))}` : ''}
          </span>
        )}
      </div>
    </>
  )
}

function Shell({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function Field({ label, hint, required, wide, children }: { label: string; hint?: string; required?: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-bold text-gray-700 ${wide ? 'sm:col-span-2' : ''}`}>
      <span>{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {hint && <span className="text-[11px] font-medium text-gray-500">{hint}</span>}
    </label>
  )
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** yyyy-MM-dd của ngày trước đó (tính theo UTC để không lệch múi giờ) */
function dayBefore(day: string) {
  const d = new Date(day.slice(0, 10) + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
const fmtDay = (day: string) => day.split('-').reverse().join('/')
