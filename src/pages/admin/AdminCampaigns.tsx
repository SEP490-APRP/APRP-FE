import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Flame,
  ImagePlus,
  Loader2,
  Megaphone,
  Eye,
  PackageCheck,
  Plus,
  Scale,
  Truck,
  Warehouse,
  X,
} from 'lucide-react'
import {
  adminCampaignService,
  uploadService,
  type CampaignResponse,
  type CampaignStatus,
  type CampaignUpsertRequest,
  type FarmRegistrationResponse,
  type PreOrderResponse,
} from '@/services'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { AddressPicker, composeAddress, EMPTY_ADDRESS, type AddressValue } from '@/components/common/AddressPicker'
import { htmlToPlainText } from '@/components/common/RichTextEditor/RichTextContent'

// CKEditor khá nặng: chỉ tải khi mở form tạo chiến dịch
const RichTextEditor = lazy(() => import('@/components/common/RichTextEditor/RichTextEditor'))
import { getErrorMessage } from '@/utils'

/**
 * Admin vận hành chiến dịch giải cứu (WF-01): duyệt nhà vườn, cân nhận hàng tại điểm tập kết,
 * xử lý thiếu hàng, đóng gói đơn, đưa tới hub, hoàn tất.
 */

const STATUS: Record<CampaignStatus, { label: string; tone: string }> = {
  DRAFT: { label: 'Nháp', tone: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Đang mở đặt trước', tone: 'bg-amber-100 text-amber-800' },
  THRESHOLD_MET: { label: 'Đủ ngưỡng', tone: 'bg-sky-100 text-sky-800' },
  FULFILLING: { label: 'Đang gom hàng', tone: 'bg-emerald-100 text-emerald-800' },
  COMPLETED: { label: 'Hoàn tất', tone: 'bg-green-700 text-white' },
  CANCELLED: { label: 'Đã huỷ', tone: 'bg-red-100 text-red-700' },
}
const FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Tất cả' },
  { id: 'DRAFT', label: 'Nháp / gom nhà vườn' },
  { id: 'ACTIVE', label: 'Đang mở' },
  { id: 'THRESHOLD_MET', label: 'Đủ ngưỡng' },
  { id: 'FULFILLING', label: 'Đang gom hàng' },
  { id: 'COMPLETED', label: 'Hoàn tất' },
]
const PRE_ORDER_STATUS: Record<PreOrderResponse['status'], string> = {
  PENDING: 'Chờ cọc',
  DEPOSIT_PAID: 'Đã cọc · chờ đóng gói',
  PROCESSING: 'Đã đóng gói',
  READY: 'Tại hub',
  DELIVERED: 'Đã giao',
  FAILED: 'Giao thất bại',
  CANCELLED: 'Đã huỷ',
}
const kg = (v?: number | null) => (v == null ? '—' : formatKg(v))
const keys = {
  list: (s: string) => ['admin-campaigns', s] as const,
  one: (id: number) => ['admin-campaign', id] as const,
  regs: (id: number) => ['admin-campaign-regs', id] as const,
  orders: (id: number) => ['admin-campaign-orders', id] as const,
}

export default function AdminCampaigns() {
  const [selected, setSelected] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  if (selected != null) return <CampaignDetail id={selected} onBack={() => setSelected(null)} />
  return (
    <>
      <CampaignList onOpen={setSelected} onCreate={() => setCreating(true)} />
      {creating && <CreateDialog onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setSelected(id) }} />}
    </>
  )
}

/* ─────────────────────────── Danh sách ─────────────────────────── */

function CampaignList({ onOpen, onCreate }: { onOpen: (id: number) => void; onCreate: () => void }) {
  const [filter, setFilter] = useState('')
  const q = useQuery({ queryKey: keys.list(filter), queryFn: () => adminCampaignService.list(filter) })
  const rows = q.data?.content ?? []
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase text-gray-900 sm:text-3xl">Chiến dịch giải cứu</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Duyệt nhà vườn, cân nhận hàng tại điểm tập kết, xử lý thiếu hàng và giao đơn đặt trước.
          </p>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#254d12]">
          <Plus size={16} /> Tạo chiến dịch
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo trạng thái">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${filter === f.id ? 'border-[#326318] bg-[#326318] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#9ed67d]'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      ) : q.isError ? (
        <ErrorBox text={getErrorMessage(q.error, 'Không tải được danh sách chiến dịch.')} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">Chưa có chiến dịch nào.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Chiến dịch</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Đã đặt / mục tiêu</th>
                <th className="px-4 py-3 text-right">Nhà vườn</th>
                <th className="px-4 py-3">Chốt đơn</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((c) => (
                <tr key={c.campaignId} className="hover:bg-[#f7faf4]">
                  <td className="max-w-[320px] px-4 py-3">
                    <p className="truncate font-bold text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.code} · {c.collectionSiteName || 'Chưa có điểm tập kết'}</p>
                  </td>
                  <td className="px-4 py-3"><StatusChip s={c.status} called={!!c.callPostedAt} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{kg(c.bookedVolumeKg)} / {kg(c.targetVolumeKg)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.approvedFarmCount}
                    {c.pendingFarmCount > 0 && <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-800">+{c.pendingFarmCount} chờ duyệt</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(c.cutoffAt).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onOpen(c.campaignId)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-[#326318] hover:border-[#326318]">
                      Quản lý
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── Chi tiết ─────────────────────────── */

function CampaignDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const qc = useQueryClient()
  const campaign = useQuery({ queryKey: keys.one(id), queryFn: () => adminCampaignService.get(id) })
  const regs = useQuery({ queryKey: keys.regs(id), queryFn: () => adminCampaignService.registrations(id) })
  const orders = useQuery({ queryKey: keys.orders(id), queryFn: () => adminCampaignService.preOrders(id) })
  const [tab, setTab] = useState<'farms' | 'orders'>('farms')
  const [intakeFor, setIntakeFor] = useState<FarmRegistrationResponse | null>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: keys.one(id) })
    qc.invalidateQueries({ queryKey: keys.regs(id) })
    qc.invalidateQueries({ queryKey: keys.orders(id) })
    qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
  }
  const act = useMutation({
    mutationFn: ({ action }: { action: string; done: string }) => adminCampaignService.action(id, action),
    onSuccess: (_r, v) => { setNotice({ ok: true, text: v.done }); refresh() },
    onError: (e) => setNotice({ ok: false, text: getErrorMessage(e, 'Thao tác thất bại.') }),
  })

  const c = campaign.data
  if (campaign.isPending) return <div className="p-8"><div className="h-64 animate-pulse rounded-2xl bg-gray-100" /></div>
  if (!c) return <div className="p-8"><ErrorBox text={getErrorMessage(campaign.error, 'Không tải được chiến dịch.')} /></div>

  const fulfilling = c.status === 'FULFILLING'
  const shortfall = Number(c.shortfallVolumeKg ?? 0)
  const pendingIntake = c.intakePendingCount ?? 0
  const button = (action: string, label: string, done: string, icon: ReactNode, tone = 'primary') => (
    <button
      type="button"
      disabled={act.isPending}
      onClick={() => act.mutate({ action, done })}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold disabled:opacity-50 ${tone === 'primary' ? 'bg-[#326318] text-white hover:bg-[#254d12]' : tone === 'warn' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'border border-red-200 bg-white text-red-600 hover:bg-red-50'}`}
    >
      {act.isPending && act.variables?.action === action ? <Loader2 size={16} className="animate-spin" /> : icon} {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-[#326318]">
        <ArrowLeft size={16} /> Tất cả chiến dịch
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip s={c.status} called={!!c.callPostedAt} />
            <span className="text-xs font-semibold text-gray-400">{c.code}</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-gray-900 sm:text-2xl">{c.title}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1"><Warehouse size={14} /> {c.collectionSiteName || '—'}{c.collectionSiteAddress ? ` · ${c.collectionSiteAddress}` : ''}</span>
            <span>Giá giải cứu {formatVnd(c.rescuePricePerKg)}/kg</span>
            <span>Chốt {new Date(c.cutoffAt).toLocaleString('vi-VN')}</span>
            {c.deliveryDate && <span>Giao {new Date(c.deliveryDate).toLocaleDateString('vi-VN')}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/chien-dich/${c.campaignId}?xem-truoc=1`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50"
          >
            <Eye size={16} /> Xem bài viết
          </a>
          {c.status === 'DRAFT' && !c.callPostedAt && button('call', 'Đăng lời kêu gọi nhà vườn', 'Đã gửi lời kêu gọi tới các nhà vườn.', <Megaphone size={16} />)}
          {c.status === 'DRAFT' && button('publish', 'Mở bán đặt trước', 'Chiến dịch đã mở đặt trước.', <Flame size={16} />)}
          {c.status === 'THRESHOLD_MET' && button('start-fulfilling', 'Bắt đầu gom hàng', 'Đã báo nhà vườn mang hàng tới điểm tập kết.', <Truck size={16} />)}
          {fulfilling && shortfall > 0 && pendingIntake === 0 && button('resolve-shortfall', 'Xử lý thiếu hàng', 'Đã xử lý thiếu hàng: đơn bị giảm thùng hoặc huỷ đã được hoàn cọc.', <AlertTriangle size={16} />, 'warn')}
          {fulfilling && button('dispatch-to-hub', 'Đưa đơn đã đóng gói tới hub', 'Các đơn đã đóng gói đã chuyển sang Tại hub.', <Truck size={16} />)}
          {fulfilling && button('complete', 'Hoàn tất & chi trả', 'Đã hoàn tất: giải ngân cọc và chi trả nhà vườn.', <CheckCircle2 size={16} />)}
          {['DRAFT', 'ACTIVE', 'THRESHOLD_MET'].includes(c.status) && button('cancel', 'Huỷ & hoàn cọc', 'Đã huỷ chiến dịch và hoàn cọc.', <Ban size={16} />, 'danger')}
        </div>
      </div>

      {notice && (
        <div role="status" className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${notice.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {notice.text}
          <button type="button" aria-label="Đóng" onClick={() => setNotice(null)}><X size={16} /></button>
        </div>
      )}

      {['THRESHOLD_MET', 'FULFILLING', 'COMPLETED'].includes(c.status) && <SupplyPanel c={c} />}

      <div className="flex gap-1 border-b border-gray-200" role="tablist">
        {([['farms', `Nhà vườn & nhận hàng (${regs.data?.length ?? 0})`], ['orders', `Đơn đặt trước (${orders.data?.length ?? 0})`]] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold ${tab === k ? 'border-[#326318] text-[#326318]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'farms' ? (
        <FarmTable c={c} rows={regs.data ?? []} loading={regs.isPending} onIntake={setIntakeFor} onChanged={refresh} onError={(t) => setNotice({ ok: false, text: t })} />
      ) : (
        <OrderTable c={c} rows={orders.data ?? []} loading={orders.isPending} onChanged={refresh} onError={(t) => setNotice({ ok: false, text: t })} />
      )}

      {intakeFor && (
        <IntakeDialog
          r={intakeFor}
          onClose={() => setIntakeFor(null)}
          onSaved={(r) => { setIntakeFor(null); setNotice({ ok: true, text: `Đã ghi nhận ${kg(r.acceptedWeightKg)} đạt chuẩn từ ${r.shopName}.` }); refresh() }}
        />
      )}
    </div>
  )
}

/** Cung - cầu sau khi chốt: đã bán vs đạt chuẩn đã nhận; thiếu thì hướng dẫn xử lý */
function SupplyPanel({ c }: { c: CampaignResponse }) {
  const sold = Number(c.soldVolumeKg ?? 0)
  const accepted = Number(c.acceptedVolumeKg ?? 0)
  const packed = Number(c.packedVolumeKg ?? 0)
  const shortfall = Number(c.shortfallVolumeKg ?? 0)
  const pending = c.intakePendingCount ?? 0
  const pct = sold > 0 ? Math.min(100, (accepted / sold) * 100) : 0
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-gray-700"><Scale size={16} /> Hàng tại điểm tập kết</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Người mua đã cọc" value={kg(sold)} />
        <Stat label="Đạt chuẩn đã nhận" value={kg(accepted)} tone="text-[#326318]" />
        <Stat label="Đã đóng gói" value={kg(packed)} />
        <Stat label="Thiếu" value={kg(shortfall)} tone={shortfall > 0 ? 'text-red-600' : 'text-gray-900'} />
      </div>
      <div className="mt-4 h-2 rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${shortfall > 0 ? 'bg-amber-500' : 'bg-[#326318]'}`} style={{ width: `${pct}%` }} />
      </div>
      {pending > 0 ? (
        <p className="mt-3 text-sm text-gray-600">Còn <b>{pending}</b> nhà vườn chưa cân nhận hàng. Cân xong hết mới biết chính xác có thiếu hay không.</p>
      ) : shortfall > 0 && c.status === 'FULFILLING' ? (
        <div className="mt-3 flex gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            Thiếu <b>{kg(shortfall)}</b> so với số người mua đã cọc. Bấm <b>Xử lý thiếu hàng</b>: đơn cọc trước được giữ đủ hàng,
            đơn cọc sau bị giảm số thùng hoặc huỷ nếu không còn đủ một thùng, phần cọc tương ứng tự hoàn vào ví người mua và họ nhận
            thông báo. Trước khi xử lý, hệ thống không cho đóng gói vượt số kg đạt chuẩn.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-600">Đủ hàng cho tất cả đơn đã cọc.</p>
      )}
    </section>
  )
}

function FarmTable({
  c, rows, loading, onIntake, onChanged, onError,
}: {
  c: CampaignResponse
  rows: FarmRegistrationResponse[]
  loading: boolean
  onIntake: (r: FarmRegistrationResponse) => void
  onChanged: () => void
  onError: (t: string) => void
}) {
  const [prices, setPrices] = useState<Record<number, string>>({})
  const [viewing, setViewing] = useState<FarmRegistrationResponse | null>(null)
  const review = useMutation({
    mutationFn: ({ r, ok }: { r: FarmRegistrationResponse; ok: boolean }) =>
      ok ? adminCampaignService.approve(r.registrationId, prices[r.registrationId] ? Number(prices[r.registrationId]) : undefined)
        : adminCampaignService.reject(r.registrationId, 'Không phù hợp chiến dịch'),
    onSuccess: onChanged,
    onError: (e) => onError(getErrorMessage(e, 'Không duyệt được đăng ký.')),
  })
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
  if (rows.length === 0) return <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Chưa có nhà vườn nào đăng ký.</div>
  const canReview = c.status === 'DRAFT' || c.status === 'ACTIVE'
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {rows.map((r) => {
        const intaken = !!r.intakeAt
        return (
          <article key={r.registrationId} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setViewing(r)}
              title="Xem chi tiết đơn góp hàng"
              className="-m-2 flex items-start gap-3 rounded-xl p-2 text-left transition hover:bg-gray-50"
            >
              {r.productImageUrls[0] ? (
                <img src={r.productImageUrls[0]} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              ) : <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-gray-900">{r.shopName}</p>
                <p className="truncate text-sm text-gray-600">{r.productName} · khai {kg(r.surplusVolumeKg)}</p>
                <p className="text-xs text-gray-500">
                  Đề xuất {r.proposedPricePerKg ? formatVnd(r.proposedPricePerKg) : '—'}/kg
                  {r.agreedPricePerKg != null && <> · chốt <b className="text-gray-800">{formatVnd(r.agreedPricePerKg)}/kg</b></>}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#326318]"><Eye size={12} /> Xem đơn & ảnh lô hàng</span>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                {r.status === 'APPROVED' ? 'Đã duyệt' : r.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
              </span>
            </button>

            {r.status === 'PENDING' && canReview && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  Giá chốt
                  <input
                    id={`gia-chot-${r.registrationId}`}
                    type="number"
                    min={1}
                    max={c.rescuePricePerKg}
                    placeholder={String(Math.min(Number(r.proposedPricePerKg ?? c.rescuePricePerKg), c.rescuePricePerKg))}
                    value={prices[r.registrationId] ?? ''}
                    onChange={(e) => setPrices((p) => ({ ...p, [r.registrationId]: e.target.value }))}
                    className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  đ/kg
                </label>
                <div className="ml-auto flex gap-2">
                  <button type="button" disabled={review.isPending} onClick={() => review.mutate({ r, ok: false })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Từ chối</button>
                  <button type="button" disabled={review.isPending} onClick={() => review.mutate({ r, ok: true })} className="inline-flex items-center gap-1 rounded-lg bg-[#326318] px-3 py-1.5 text-xs font-bold text-white"><Check size={14} /> Duyệt</button>
                </div>
              </div>
            )}

            {r.status === 'APPROVED' && r.allocatedVolumeKg != null && (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f7faf4] p-3 text-xs sm:grid-cols-4">
                <Mini label="Phân bổ" value={kg(r.allocatedVolumeKg)} />
                <Mini label="Cân thực tế" value={kg(r.receivedWeightKg)} />
                <Mini label="Hư / loại" value={kg(r.rejectedWeightKg)} tone={Number(r.rejectedWeightKg ?? 0) > 0 ? 'text-red-600' : undefined} />
                <Mini label="Đạt chuẩn" value={kg(r.acceptedWeightKg)} tone="text-[#326318]" />
              </div>
            )}
            {intaken && Number(r.shortfallKg ?? 0) > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertTriangle size={14} /> Thiếu {kg(r.shortfallKg)} so với phân bổ. Chỉ trả tiền cho {kg(r.countedWeightKg)}.</p>
            )}
            {r.intakeNote && <p className="text-xs italic text-gray-500">Ghi chú cân: {r.intakeNote}</p>}

            {r.status === 'APPROVED' && c.status === 'FULFILLING' && !r.paidOutAt && Number(r.allocatedVolumeKg ?? 0) > 0 && (
              <button type="button" onClick={() => onIntake(r)} className={`inline-flex w-fit items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold ${intaken ? 'border border-gray-200 text-gray-700 hover:border-[#326318]' : 'bg-[#326318] text-white hover:bg-[#254d12]'}`}>
                <Scale size={16} /> {intaken ? 'Sửa số cân' : 'Cân nhận hàng'}
              </button>
            )}
            {r.paidOutAt && <p className="text-xs font-bold text-[#326318]">Đã chi trả {formatVnd(r.payoutAmount)}</p>}
          </article>
        )
      })}
      {viewing && <RegistrationDetailDialog r={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function OrderTable({
  c, rows, loading, onChanged, onError,
}: { c: CampaignResponse; rows: PreOrderResponse[]; loading: boolean; onChanged: () => void; onError: (t: string) => void }) {
  const pack = useMutation({
    mutationFn: (p: PreOrderResponse) => adminCampaignService.pack(p.preOrderId),
    onSuccess: onChanged,
    onError: (e) => onError(getErrorMessage(e, 'Không đóng gói được đơn.')),
  })
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
  if (rows.length === 0) return <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Chưa có đơn đặt trước.</div>
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Đơn</th>
            <th className="px-4 py-3">Người nhận</th>
            <th className="px-4 py-3">Thùng</th>
            <th className="px-4 py-3 text-right">Cọc</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((p) => (
            <tr key={p.preOrderId}>
              <td className="px-4 py-3 font-bold text-gray-900">{p.code}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-gray-800">{p.recipientName || p.buyerName}</p>
                <p className="max-w-[220px] truncate text-xs text-gray-500">{p.shippingAddress}</p>
              </td>
              <td className="px-4 py-3 tabular-nums">
                {p.crateQuantity} × {p.crateKg} kg
                {p.originalCrateQuantity != null && (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">giảm từ {p.originalCrateQuantity} thùng</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatVnd(p.depositAmount)}
                {Number(p.shortfallRefundAmount ?? 0) > 0 && <p className="text-[11px] font-bold text-red-600">đã hoàn {formatVnd(p.shortfallRefundAmount)}</p>}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-bold text-gray-700">{PRE_ORDER_STATUS[p.status]}</span>
                {p.cancelReason && <p className="max-w-[220px] text-[11px] text-gray-500">{p.cancelReason}</p>}
              </td>
              <td className="px-4 py-3 text-right">
                {p.status === 'DEPOSIT_PAID' && c.status === 'FULFILLING' && (
                  <button type="button" disabled={pack.isPending} onClick={() => pack.mutate(p)} className="inline-flex items-center gap-1 rounded-lg bg-[#326318] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                    <PackageCheck size={14} /> Đóng gói
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─────────────────────────── Cân nhận hàng ─────────────────────────── */

function IntakeDialog({ r, onClose, onSaved }: { r: FarmRegistrationResponse; onClose: () => void; onSaved: (r: FarmRegistrationResponse) => void }) {
  const [received, setReceived] = useState(r.receivedWeightKg != null ? String(r.receivedWeightKg) : '')
  const [rejected, setRejected] = useState(r.rejectedWeightKg != null && r.qualityPassed !== false ? String(r.rejectedWeightKg) : '0')
  const [allFailed, setAllFailed] = useState(r.intakeAt != null && r.qualityPassed === false)
  const [photos, setPhotos] = useState<string[]>(r.intakePhotoUrls ?? [])
  const [note, setNote] = useState(r.intakeNote ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useEscape(onClose)

  const rec = Number(received)
  const rej = allFailed ? rec : Number(rejected || 0)
  const accepted = Math.max(0, rec - rej)
  const allocated = Number(r.allocatedVolumeKg ?? 0)
  const invalid = !(rec >= 0) || received === '' || rej < 0 || rej > rec
  const save = useMutation({
    mutationFn: () => adminCampaignService.intake(r.registrationId, {
      receivedWeightKg: rec,
      rejectedWeightKg: allFailed ? 0 : rej,
      qualityPassed: !allFailed,
      photoUrls: photos,
      note: note.trim() || undefined,
    }),
    onSuccess: onSaved,
  })
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const f of Array.from(files).slice(0, 5 - photos.length)) {
        const url = (await uploadService.uploadImage(f, 'campaign-intake')).result?.url
        if (url) setPhotos((p) => [...p, url].slice(0, 5))
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="can-hang-title" onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 id="can-hang-title" className="text-lg font-black text-gray-900">Cân nhận hàng</h3>
            <p className="text-xs text-gray-500">{r.shopName} · {r.productName} · phân bổ {kg(r.allocatedVolumeKg)}</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form className="flex flex-col gap-4 overflow-y-auto p-5" onSubmit={(e) => { e.preventDefault(); if (!invalid) save.mutate() }}>
          <div className="grid grid-cols-2 gap-3">
            <NumField id="kg-can" label="Cân thực tế (kg)" value={received} onChange={setReceived} />
            <NumField id="kg-hu" label="Hư hỏng / loại (kg)" value={allFailed ? received : rejected} onChange={setRejected} disabled={allFailed} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input id="loai-ca-lo" type="checkbox" checked={allFailed} onChange={(e) => setAllFailed(e.target.checked)} className="h-4 w-4 accent-red-600" />
            Cả lô không đạt chất lượng (loại toàn bộ)
          </label>

          <div className="rounded-2xl bg-[#f7faf4] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-gray-700">Ghi nhận vào chiến dịch</span>
              <span className="text-2xl font-black text-[#326318] tabular-nums">{formatKg(accepted)}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              {rec > 0 && `${formatKg(rec)} cân − ${formatKg(rej)} hư = ${formatKg(accepted)} đạt chuẩn. `}
              {accepted < allocated
                ? <b className="text-red-600">Thiếu {formatKg(allocated - accepted)} so với phân bổ {formatKg(allocated)}; nhà vườn chỉ được trả cho {formatKg(accepted)}.</b>
                : accepted > allocated
                  ? `Dư ${formatKg(accepted - allocated)}: chỉ tính tiền ${formatKg(allocated)} theo phân bổ.`
                  : 'Đủ đúng phần phân bổ.'}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-700">Ảnh tại điểm tập kết</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((u) => (
                <div key={u} className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Xoá ảnh" onClick={() => setPhotos((p) => p.filter((x) => x !== u))} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"><X size={10} /></button>
                </div>
              ))}
              {photos.length < 5 && (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#326318]">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-bold text-gray-700">
            Ghi chú
            <textarea id="ghi-chu-can" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Vd: 20 kg dập úng do mưa, đã chụp ảnh" className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal" />
          </label>
          {invalid && received !== '' && <p className="text-sm font-semibold text-red-600">Số kg hư không được lớn hơn số kg cân.</p>}
          {save.isError && <p className="text-sm font-semibold text-red-600">{getErrorMessage(save.error, 'Không lưu được số cân.')}</p>}
          <button type="submit" disabled={invalid || save.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#326318] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
            {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Scale size={16} />} Lưu số cân
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ─────────────────────────── Tạo chiến dịch ─────────────────────────── */

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const inDays = (n: number) => new Date(Date.now() + n * 86400000)
  const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
  const [f, setF] = useState({
    title: '', description: '', season: '', target: '', min: '', price: '', deposit: '30',
    cutoff: local(inDays(7)).slice(0, 16), delivery: local(inDays(9)).slice(0, 10), site: '',
  })
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS)
  const [formError, setFormError] = useState<string | null>(null)
  useEscape(onClose)
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))
  const create = useMutation({
    mutationFn: () => {
      const body: CampaignUpsertRequest = {
        title: f.title.trim(), description: htmlToPlainText(f.description).trim() ? f.description : undefined, season: f.season.trim() || undefined,
        targetVolumeKg: Number(f.target), minThresholdKg: Number(f.min), rescuePricePerKg: Number(f.price),
        depositPercent: Number(f.deposit) / 100, cutoffAt: `${f.cutoff}:00`, deliveryDate: f.delivery || undefined,
        collectionSiteName: f.site.trim() || undefined, collectionSiteAddress: composeAddress(address) || undefined,
        collectionSiteLatitude: address.lat, collectionSiteLongitude: address.lng,
      }
      return adminCampaignService.create(body)
    },
    onSuccess: (c) => onCreated(c.campaignId),
  })
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="tao-cd-title" onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 id="tao-cd-title" className="text-lg font-black text-gray-900">Tạo chiến dịch giải cứu</h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault()
          if (address.provinceCode && (!address.wardCode || !address.detail.trim())) {
            setFormError('Vui lòng chọn đủ Phường/Xã và nhập địa chỉ cụ thể của điểm tập kết.')
            return
          }
          setFormError(null)
          create.mutate()
        }}>
          <TextField id="cd-title" label="Tên chiến dịch (hiện đúng như vậy cho người mua)" value={f.title} onChange={set('title')} wide required />
          <div className="flex flex-col gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
            Bài viết giới thiệu
            <Suspense fallback={<div className="flex h-56 items-center justify-center rounded-xl border border-gray-200 text-xs font-normal text-gray-500"><Loader2 size={16} className="mr-2 animate-spin" /> Đang tải trình soạn thảo…</div>}>
              <RichTextEditor value={f.description} onChange={set('description')} placeholder="Kể câu chuyện của vườn, vì sao cần giải cứu…" />
            </Suspense>
          </div>
          <NumField id="cd-target" label="Mục tiêu (kg)" value={f.target} onChange={set('target')} />
          <NumField id="cd-min" label="Ngưỡng tối thiểu (kg)" value={f.min} onChange={set('min')} />
          <NumField id="cd-price" label="Giá giải cứu (đ/kg)" value={f.price} onChange={set('price')} />
          <NumField id="cd-deposit" label="Cọc (%)" value={f.deposit} onChange={set('deposit')} />
          <TextField id="cd-cutoff" label="Hạn chốt đơn" type="datetime-local" value={f.cutoff} onChange={set('cutoff')} required />
          <TextField id="cd-delivery" label="Ngày giao dự kiến" type="date" value={f.delivery} onChange={set('delivery')} />
          <TextField id="cd-site" label="Điểm tập kết" value={f.site} onChange={set('site')} />
          <TextField id="cd-season" label="Mùa vụ" value={f.season} onChange={set('season')} />
          <div className="flex flex-col gap-2.5 sm:col-span-2">
            <p className="text-sm font-bold text-gray-700">Địa chỉ điểm tập kết</p>
            <AddressPicker value={address} onChange={setAddress} />
          </div>
          {formError && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{formError}</p>}
          {create.isError && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{getErrorMessage(create.error, 'Không tạo được chiến dịch.')}</p>}
          <button type="submit" disabled={create.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#326318] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
            {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Tạo chiến dịch (nháp)
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ─────────────────────────── Chi tiết đơn đăng ký của nhà vườn ─────────────────────────── */

const SHELF_LABEL: Record<string, string> = { DAYS_1_2: '1 – 2 ngày', DAYS_3_4: '3 – 4 ngày', DAYS_5_6: '5 – 6 ngày' }
const REG_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Đã duyệt', tone: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Từ chối', tone: 'bg-red-100 text-red-700' },
}
const fmtDay = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—')
const fmtDateTime = (v?: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '—')

function RegistrationDetailDialog({ r, onClose }: { r: FarmRegistrationResponse; onClose: () => void }) {
  useEscape(onClose)
  const [zoom, setZoom] = useState<string | null>(null)
  const st = REG_STATUS[r.status] ?? { label: r.status, tone: 'bg-gray-100 text-gray-700' }
  const photos = r.productImageUrls ?? []
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dk-chi-tiet-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#326318]">Đơn góp hàng #{r.registrationId}</p>
            <h3 id="dk-chi-tiet-title" className="mt-0.5 text-lg font-black text-gray-900">{r.shopName || `Shop #${r.shopId}`}</h3>
            <p className="mt-0.5 text-xs text-gray-500">Nộp lúc {fmtDateTime(r.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.tone}`}>{st.label}</span>
            <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
          </div>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-6">
          {/* Ảnh lô hàng shop chụp */}
          <section>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Ảnh lô hàng ({photos.length})</h4>
            {photos.length ? (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((u) => (
                  <button key={u} type="button" onClick={() => setZoom(u)} className="group overflow-hidden rounded-xl border border-gray-100">
                    <img src={u} alt="" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">Shop không gửi ảnh.</p>
            )}
          </section>

          {/* Thông tin lô hàng */}
          <section className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl bg-gray-50 p-4 sm:grid-cols-3">
            <Info label="Nông sản" value={r.productName || '—'} />
            <Info label="Khối lượng khai" value={kg(r.surplusVolumeKg)} />
            <Info label="Ngày thu hoạch" value={fmtDay(r.harvestDate)} />
            <Info label="Độ bền sau thu hoạch" value={r.shelfLifeTier ? SHELF_LABEL[r.shelfLifeTier] ?? r.shelfLifeTier : '—'} />
            <Info label="Giá đề xuất" value={r.proposedPricePerKg ? `${formatVnd(r.proposedPricePerKg)}/kg` : '—'} />
            <Info label="Giá chốt" value={r.agreedPricePerKg != null ? `${formatVnd(r.agreedPricePerKg)}/kg` : 'Chưa chốt'} />
            <Info label="Cam kết giá" value={r.priceCommitted ? 'Đồng ý giá chiến dịch' : 'Muốn thương lượng'} />
            {r.allocatedVolumeKg != null && <Info label="Được phân bổ" value={kg(r.allocatedVolumeKg)} />}
            {r.payoutAmount != null && <Info label="Đã chi trả" value={formatVnd(r.payoutAmount)} />}
          </section>

          {/* Lời nhắn của shop */}
          <section>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Mô tả / ghi chú của shop</h4>
            <p className="mt-2 whitespace-pre-line rounded-2xl border border-gray-100 p-4 text-sm leading-relaxed text-gray-800">
              {r.note?.trim() || <span className="text-gray-400">Shop không để lại ghi chú.</span>}
            </p>
          </section>

          {/* Liên hệ */}
          <section className="flex flex-wrap items-center gap-3 text-sm">
            {r.shopPhone && (
              <a href={`tel:${r.shopPhone}`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 font-bold text-gray-800 hover:bg-gray-50">
                Gọi {r.shopPhone}
              </a>
            )}
            <a
              href={`/cua-hang/${r.shopId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 font-bold text-gray-800 hover:bg-gray-50"
            >
              <Eye size={14} /> Xem gian hàng
            </a>
          </section>

          {(r.reviewNote || r.reviewedAt) && (
            <section className="rounded-2xl border-l-4 border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-bold">Ghi chú duyệt {r.reviewedAt ? `· ${fmtDateTime(r.reviewedAt)}` : ''}</p>
              {r.reviewNote && <p className="mt-1">{r.reviewNote}</p>}
            </section>
          )}

          {r.intakeAt && (
            <section className="rounded-2xl bg-[#f7faf4] p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#326318]">Nhận hàng tại điểm tập kết · {fmtDateTime(r.intakeAt)}</h4>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <Mini label="Cân thực tế" value={kg(r.receivedWeightKg)} />
                <Mini label="Hư / loại" value={kg(r.rejectedWeightKg)} />
                <Mini label="Đạt chuẩn" value={kg(r.acceptedWeightKg)} tone="text-[#326318]" />
                <Mini label="Tính tiền" value={kg(r.countedWeightKg)} />
              </div>
              {r.intakeNote && <p className="mt-3 text-sm text-gray-700">{r.intakeNote}</p>}
              {!!r.intakePhotoUrls?.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.intakePhotoUrls.map((u) => (
                    <button key={u} type="button" onClick={() => setZoom(u)}>
                      <img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/80 p-4" onClick={(e) => { e.stopPropagation(); setZoom(null) }}>
          <img src={zoom} alt="" className="max-h-[90vh] max-w-full rounded-xl object-contain" />
          <button type="button" aria-label="Đóng ảnh" className="absolute right-4 top-4 rounded-full bg-white/90 p-2"><X size={18} /></button>
        </div>
      )}
    </div>,
    document.body,
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-gray-900">{value}</p>
    </div>
  )
}

/* ─────────────────────────── Mảnh nhỏ ─────────────────────────── */

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

/** DRAFT đã đăng lời kêu gọi = bài đã công khai, đang gom hàng từ nhà vườn (chưa mở bán) */
function StatusChip({ s, called }: { s: CampaignStatus; called?: boolean }) {
  const { label, tone } =
    s === 'DRAFT' && called ? { label: 'Đã đăng · gom nhà vườn', tone: 'bg-lime-100 text-lime-800' } : STATUS[s]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone}`}>{label}</span>
}

function Stat({ label, value, tone = 'text-gray-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-gray-500">{label}</p>
      <p className={`font-black tabular-nums ${tone ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function NumField({ id, label, value, onChange, disabled }: { id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm font-bold text-gray-700">
      {label}
      <input id={id} type="number" min={0} step="any" required value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal tabular-nums disabled:bg-gray-100" />
    </label>
  )
}

function TextField({ id, label, value, onChange, type = 'text', wide, required }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean; required?: boolean }) {
  return (
    <label htmlFor={id} className={`flex flex-col gap-1.5 text-sm font-bold text-gray-700 ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      <input id={id} type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal" />
    </label>
  )
}

function ErrorBox({ text }: { text: string }) {
  return <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{text}</div>
}
