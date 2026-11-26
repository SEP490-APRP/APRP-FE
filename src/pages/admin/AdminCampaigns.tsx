import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Bell,
  Check,
  CheckCircle2,
  FileText, Flame,
  GalleryHorizontal,
  ImagePlus,
  MapPinned,
  PackagePlus, Pencil,
  UserPlus,
  Loader2,
  Megaphone,
  BellRing,
  QrCode, Route,
  Eye,
  PackageCheck,
  Plus,
  Scale,
  Sprout,
  Truck,
  Wallet,
  Warehouse,
  X, Lock } from 'lucide-react'
import {
  adminCampaignService,
  adminHubTripService,
  campaignProposalService,
  uploadService,
  type CampaignResponse,
  type CampaignStatus,
  type CampaignUpsertRequest,
  type FarmRegistrationResponse,
  type PreOrderResponse,
} from '@/services'
import { adminReadyLabel, formatKg, formatVnd } from '@/features/campaign/utils'
import HubDeliverySection from './HubDeliverySection'
import ShipperCallDialog from './ShipperCallDialog'
import ShortfallCloseButton from './ShortfallCloseButton'
import SupplyStory, { supplyVerdict } from '@/features/campaign/components/SupplyStory'
import TruckCallSection from './TruckCallSection'
import CampaignReportDialog from './CampaignReportDialog'
import CampaignResultPanel from './CampaignResultPanel'
import PackageLabelsDialog from './PackageLabelsDialog'
import { QRCodeSVG } from 'qrcode.react'
import { isPackageToken, savedWebUrl, traceUrl } from '@/features/campaign/packageLabels'
import CampaignSection, { InfoRow, ProgressBar } from './CampaignSection'
import { plannable } from '@/features/campaign/deliveryPlan'
import { LotFreshnessBox, PriorityChip, fmtDeadline, tierLabel } from './lotFreshness'
import HomeBannerDialog from './HomeBannerDialog'
import CampaignDamageClaims, { damageClaimsKey } from './CampaignDamageClaims'
import CampaignBannerEditor from './CampaignBannerEditor'
import { AddShopKgDialog, AddSupplyDialog, InviteShopsDialog } from './CampaignShopDialogs'
import AdminCampaignProposals, { ProposalSourcePanel, type ApprovePrefill } from './AdminCampaignProposals'
import { useNewProposalBadge } from '@/features/campaign/hooks/useNewProposalBadge'
import { composeAddress, EMPTY_ADDRESS, PlaceSearch, type PlaceValue } from '@/components/common/AddressPicker'
import { htmlToPlainText } from '@/components/common/RichTextEditor/RichTextContent'

// CKEditor khá nặng: chỉ tải khi mở form tạo chiến dịch
const RichTextEditor = lazy(() => import('@/components/common/RichTextEditor/RichTextEditor'))
import { getErrorMessage } from '@/utils'
import { globalShowConfirm } from '@/components/common/Popup'

/**
 * Admin vận hành chiến dịch giải cứu (WF-01): duyệt nhà vườn, cân nhận hàng tại điểm tập kết,
 * bổ sung hàng thiếu, đóng gói đơn, đưa tới hub, hoàn tất.
 */

const STATUS: Record<CampaignStatus, { label: string; tone: string }> = {
  DRAFT: { label: 'Chuẩn bị', tone: 'bg-gray-100 text-gray-700' },
  ACTIVE: { label: 'Đang mở đặt trước', tone: 'bg-amber-100 text-amber-800' },
  THRESHOLD_MET: { label: 'Đủ ngưỡng', tone: 'bg-sky-100 text-sky-800' },
  FULFILLING: { label: 'Đang gom hàng', tone: 'bg-emerald-100 text-emerald-800' },
  COMPLETED: { label: 'Hoàn tất', tone: 'bg-green-700 text-white' },
  CANCELLED: { label: 'Đã huỷ', tone: 'bg-red-100 text-red-700' },
}
const FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Tất cả' },
  { id: 'DRAFT', label: 'Chuẩn bị / kêu gọi nhà vườn' },
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
  SHIPPING: 'Đang giao',
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
  // Vừa tạo xong chiến dịch: trang chi tiết mở kèm khung "bước tiếp theo" mời / thêm shop
  const [justCreated, setJustCreated] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState<'campaigns' | 'proposals'>('campaigns')
  const [approving, setApproving] = useState<ApprovePrefill | null>(null)
  // Số đề xuất mới từ shop: mở tab "Đề xuất từ shop" là tính đã xem, số biến mất
  const { count: newProposals, markSeen } = useNewProposalBadge()
  useEffect(() => {
    if (view === 'proposals' && selected == null) markSeen()
  }, [view, selected, markSeen])
  if (selected != null) return <CampaignDetail id={selected} justCreated={justCreated === selected} onBack={() => { setSelected(null); setJustCreated(null) }} />
  return (
    <>
      <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-8 sm:pt-8" role="tablist" aria-label="Chiến dịch hoặc đề xuất từ shop">
        {([['campaigns', 'Chiến dịch'], ['proposals', 'Đề xuất từ shop']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${view === id ? 'bg-[#326318] text-white' : 'bg-white text-[#326318] ring-1 ring-gray-200 hover:ring-[#9ed67d]'}`}>
            {label}
            {id === 'proposals' && newProposals > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white" aria-label={`${newProposals} đề xuất mới`}>
                {newProposals}
              </span>
            )}
          </button>
        ))}
      </div>
      {view === 'campaigns' ? (
        <CampaignList onOpen={setSelected} onCreate={() => setCreating(true)} />
      ) : (
        <AdminCampaignProposals onApprove={setApproving} onOpenCampaign={setSelected} />
      )}
      {creating && <CreateDialog onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setJustCreated(id); setSelected(id) }} />}
      {approving && (
        <CreateDialog
          prefill={approving}
          onClose={() => setApproving(null)}
          onCreated={(id) => { setApproving(null); setJustCreated(id); setSelected(id) }}
        />
      )}
    </>
  )
}

/* ─────────────────────────── Danh sách ─────────────────────────── */

function CampaignList({ onOpen, onCreate }: { onOpen: (id: number) => void; onCreate: () => void }) {
  const [filter, setFilter] = useState('')
  const [bannerOpen, setBannerOpen] = useState(false)
  const [bannerNote, setBannerNote] = useState('')
  const q = useQuery({ queryKey: keys.list(filter), queryFn: () => adminCampaignService.list(filter) })
  const rows = q.data?.content ?? []
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black uppercase text-gray-900 sm:text-3xl">Chiến dịch giải cứu</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Duyệt nhà vườn, cân nhận hàng tại điểm tập kết, bổ sung hàng thiếu và giao đơn đặt trước.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setBannerOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#326318] bg-white px-4 py-2.5 text-sm font-bold text-[#326318] hover:bg-[#f4f7f1]">
            <GalleryHorizontal size={16} /> Banner trang chủ
          </button>
          <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#254d12]">
            <Plus size={16} /> Tạo chiến dịch
          </button>
        </div>
      </div>

      {bannerNote && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> {bannerNote}</span>
          <button type="button" aria-label="Ẩn thông báo" onClick={() => setBannerNote('')} className="rounded-full p-1 hover:bg-emerald-100"><X size={14} /></button>
        </div>
      )}
      {bannerOpen && (
        <HomeBannerDialog
          onClose={() => setBannerOpen(false)}
          onSaved={(n) => {
            setBannerOpen(false)
            setBannerNote(n > 0 ? `Đã lưu ${n} chiến dịch vào banner trang chủ.` : 'Đã bỏ hết chiến dịch khỏi banner trang chủ, trang chủ dùng banner chung.')
          }}
        />
      )}

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
                  <td className="max-w-[380px] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CoverThumb url={c.coverImageUrl || c.bannerImageUrl} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">{c.title}</p>
                        <p className="truncate text-xs text-gray-500">{c.code} · {c.collectionSiteName || 'Chưa có điểm tập kết'}</p>
                      </div>
                    </div>
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

function CampaignDetail({ id, onBack, justCreated = false }: { id: number; onBack: () => void; justCreated?: boolean }) {
  const qc = useQueryClient()
  const campaign = useQuery({ queryKey: keys.one(id), queryFn: () => adminCampaignService.get(id) })
  const regs = useQuery({ queryKey: keys.regs(id), queryFn: () => adminCampaignService.registrations(id) })
  const orders = useQuery({ queryKey: keys.orders(id), queryFn: () => adminCampaignService.preOrders(id) })
  const claims = useQuery({ queryKey: damageClaimsKey(id), queryFn: () => adminCampaignService.damageClaims(id) })
  // Cùng khoá với màn xe: chốt xong là thanh tiến trình đổi ngay
  const trips = useQuery({ queryKey: ['admin-campaigns', 'hub-trips', id], queryFn: () => adminHubTripService.list(id) })
  const [tab, setTab] = useState<'farms' | 'orders' | 'claims' | 'banner'>('farms')
  const [intakeFor, setIntakeFor] = useState<FarmRegistrationResponse | null>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), notice.ok ? 5000 : 9000)
    return () => window.clearTimeout(t)
  }, [notice])
  const [editing, setEditing] = useState(false)
  const [shopDialog, setShopDialog] = useState<'invite' | 'add' | null>(null)
  const [showNextStep, setShowNextStep] = useState(justCreated)
  const [planOpen, setPlanOpen] = useState(false)
  const [supplyOpen, setSupplyOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const openPlan = () => setPlanOpen(true)
  const tabsRef = useRef<HTMLDivElement>(null)
  /** Mở tab Đơn đặt trước để đóng gói */
  const goPack = () => {
    setPlanOpen(false)
    setTab('orders')
    window.setTimeout(() => tabsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 0)
  }

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
  // Đơn đặt trước chỉ mở sau khi cân đủ lô và xử lý xong phần thiếu
  const ordersLocked =
    c.status === 'THRESHOLD_MET'
      ? 'Mở sau khi bắt đầu gom hàng và cân đủ các lô tại điểm tập kết.'
      : c.status !== 'FULFILLING'
        ? null
        : pendingIntake > 0
          ? `Còn ${pendingIntake} lô chưa cân (tab Nhà vườn & nhận hàng).`
          : shortfall > 0
            ? `Còn thiếu ${kg(shortfall)}: bổ sung hàng hoặc chốt phần thiếu.`
            : null
  const activeTab = ordersLocked && tab === 'orders' ? 'farms' : tab
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

  // Các bước chính theo thứ tự; bước đầu tiên chưa xong là bước hiện tại
  const after = (...st: CampaignStatus[]) => st.includes(c.status)
  // Bước 3 gồm: bắt đầu gom hàng -> cân nhận đủ lô -> kêu gọi shipper & chốt kế hoạch xe (mọi đơn giao tận nơi đã ra hub / giao thẳng)
  const startDay = c.startDate ? new Date(`${c.startDate.slice(0, 10)}T00:00:00`) : null
  const collectOpen = !startDay || Date.now() >= startDay.getTime()
  const deliveryOrders = (orders.data ?? []).filter((o) => o.fulfillmentMethod !== 'PICKUP' && !['PENDING', 'CANCELLED'].includes(o.status))
  // Chốt xe xong khi mọi đơn đã được chia ra hub và mọi chuyến đã chốt (shipper nhận hàng là việc sau đó)
  const unplanned = deliveryOrders.filter((o) => plannable(o) && !(o.status === 'READY' && o.hubId != null)).length
  const activeTrips = (trips.data ?? []).filter((t) => t.status !== 'CANCELLED')
  const planDone = fulfilling && !trips.isPending && deliveryOrders.length > 0 && unplanned === 0 &&
    activeTrips.every((t) => t.confirmed || t.status === 'IN_TRANSIT' || t.status === 'DELIVERED')
  // Đã gọi xe là gom hàng được; bước gọi xe chỉ tính xong khi mọi chuyến có tài xế nhận (không có đơn giao tận nơi thì không cần xe)
  const drivenTrips = activeTrips.filter((t) => t.driverId != null).length
  const trucksReady = !orders.isPending && !trips.isPending &&
    (deliveryOrders.length === 0 || (activeTrips.length > 0 && drivenTrips === activeTrips.length))
  const trucksCalled = !orders.isPending && !trips.isPending && (deliveryOrders.length === 0 || activeTrips.length > 0)
  // Mọi đơn đã có shipper lấy: mới tới lúc hoàn tất
  const allClaimed = planDone && !deliveryOrders.some(plannable)
  const unpacked = deliveryOrders.filter((o) => o.status === 'DEPOSIT_PAID').length
  const subSteps: { label: string; done: boolean; action?: ReactNode; hint?: string }[] = [
    {
      label: 'Bắt đầu gom hàng',
      done: after('FULFILLING', 'COMPLETED'),
      // Chỉ gom hàng từ ngày bắt đầu chiến dịch (BE cũng chặn)
      action: c.status === 'THRESHOLD_MET' && collectOpen && trucksCalled ? button('start-fulfilling', 'Bắt đầu gom hàng', 'Đã báo nhà vườn mang hàng tới điểm tập kết.', <Truck size={16} />) : undefined,
      hint: !trucksCalled ? 'Mở sau khi dự toán và gửi thông báo gọi xe'
        : startDay ? `Mở từ ngày bắt đầu chiến dịch ${startDay.toLocaleDateString('vi-VN')}` : undefined,
    },
    {
      label: 'Cân nhận hàng nhà vườn',
      done: fulfilling && pendingIntake === 0,
      hint: fulfilling ? `Còn ${pendingIntake} lô chưa cân (tab Nhà vườn & nhận hàng)` : 'Sau khi bắt đầu gom hàng',
    },
    {
      label: 'Đóng gói đơn đặt trước',
      done: fulfilling && pendingIntake === 0 && !orders.isPending && unpacked === 0,
      action: fulfilling && !ordersLocked ? (
        <button type="button" onClick={goPack} className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#254d12]">
          <PackageCheck size={14} /> Đóng gói ({unpacked} đơn)
        </button>
      ) : undefined,
      hint: ordersLocked ?? undefined,
    },
    {
      label: 'Chốt xe chở ra hub',
      done: planDone,
      action: fulfilling ? (
        <button type="button" onClick={openPlan} className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#254d12]">
          <Route size={14} /> Chốt xe ra hub{unplanned > 0 ? ` (${unplanned} đơn)` : ''}
        </button>
      ) : undefined,
    },
  ]
  // Đủ ngưỡng chỉ được xét lúc chốt đơn: ghi rõ giờ chốt để admin biết khi nào các bước sau mở
  const closing = splitDateTime(c.cutoffAt)
  const closingText = `${closing.date} lúc ${closing.time}`
  const reached = Number(c.bookedVolumeKg ?? 0) >= Number(c.minThresholdKg ?? 0)
  /** open: làm được ngay dù bước trước chưa xong */
  const steps: { label: string; done: boolean; open?: boolean; action?: ReactNode; hint?: string; extra?: ReactNode }[] = [
    {
      label: 'Kêu gọi nhà vườn',
      done: !!c.callPostedAt || c.status !== 'DRAFT',
      action: c.status === 'DRAFT' && !c.callPostedAt ? button('call', 'Đăng lời kêu gọi', 'Đã gửi lời kêu gọi tới các nhà vườn.', <Megaphone size={16} />) : undefined,
      hint: c.publishAt ? `Tự đăng lúc ${splitDateTime(c.publishAt).time} ngày ${splitDateTime(c.publishAt).date}` : undefined,
    },
    {
      label: 'Mở bán đặt trước',
      done: after('ACTIVE', 'THRESHOLD_MET', 'FULFILLING', 'COMPLETED'),
      action: c.status === 'DRAFT' ? button('publish', 'Mở bán đặt trước', 'Chiến dịch đã mở đặt trước.', <Flame size={16} />) : undefined,
    },
    {
      // Bước riêng: mở bán xong (đủ ngưỡng) là biết số đơn, số kg -> kêu gọi shipper sớm
      label: 'Dự toán & gọi xe',
      done: c.status === 'COMPLETED' || (after('THRESHOLD_MET', 'FULFILLING') && trucksReady),
      action: after('THRESHOLD_MET', 'FULFILLING') ? (
        <>
          <button type="button" onClick={openPlan} className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#254d12]">
            <BellRing size={16} /> Dự toán & gọi xe
          </button>
          {activeTrips.length > 0 && (
            <span className="w-full text-xs font-semibold text-amber-800">Đã có tài xế {drivenTrips}/{activeTrips.length} xe</span>
          )}
        </>
      ) : undefined,
      hint: c.status === 'ACTIVE' ? `Mở sau khi chốt đơn ${closingText}` : 'Sau khi mở bán đặt trước',
      // Khi đang gom hàng đã có nút "Xe chở hàng ra hub" bên dưới
      extra: activeTrips.length > 0 && c.status === 'THRESHOLD_MET' ? (
        <button type="button" onClick={openPlan} className="text-left text-xs font-bold text-[#326318] underline">
          {drivenTrips} xe đã nhận · Mở bảng xe
        </button>
      ) : undefined,
    },
    {
      label: 'Gom hàng & chia xe',
      done: c.status === 'COMPLETED' || planDone,
      open: after('THRESHOLD_MET', 'FULFILLING') && trucksCalled,
      action: after('THRESHOLD_MET', 'FULFILLING') ? (
        <ol className="flex w-full flex-col gap-1.5">
          {subSteps.map((s, k) => {
            const now = !s.done && subSteps.slice(0, k).every((x) => x.done)
            return (
              <li key={s.label} className="flex flex-col gap-1">
                <span className={`flex items-center gap-1.5 text-xs font-bold ${s.done ? 'text-[#326318]' : now ? 'text-gray-900' : 'text-gray-400'}`}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${s.done ? 'bg-[#326318] text-white' : now ? 'border border-[#326318] text-[#326318]' : 'border border-gray-300'}`}>
                    {s.done ? <Check size={10} /> : k + 1}
                  </span>
                  {s.label}
                </span>
                {now && (s.action ?? (s.hint && <span className="pl-5 text-[11px] text-gray-500">{s.hint}</span>))}
              </li>
            )
          })}
        </ol>
      ) : undefined,
      hint: c.status !== 'ACTIVE' ? 'Sau khi mở bán đặt trước'
        : reached ? `Đã đủ ngưỡng, chờ chốt đơn ${closingText}` : `Cần đủ ${kg(c.minThresholdKg)} trước ${closingText}`,
    },
    {
      label: 'Hoàn tất & chi trả',
      done: c.status === 'COMPLETED',
      action: allClaimed ? button('complete', 'Hoàn tất & chi trả', 'Đã hoàn tất: giải ngân cọc và chi trả nhà vườn.', <CheckCircle2 size={16} />) : undefined,
      hint: fulfilling && !planDone ? 'Sau khi chốt kế hoạch xe và giao xong đơn' : 'Sau khi giao xong đơn đặt trước',
    },
  ]
  const toolBtn = 'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-bold text-gray-800 hover:border-[#326318] hover:text-[#326318]'

  const cover = c.coverImageUrl || c.bannerImageUrl || null
  const lead = articleLead(c.description)
  const now = Date.now()
  const timeline = [
    c.publishAt ? { label: 'Đăng bài kêu gọi', ...splitDateTime(c.publishAt), done: new Date(c.publishAt).getTime() <= now } : null,
    c.farmCutoffAt ? { label: 'Chốt góp hàng', ...splitDateTime(c.farmCutoffAt), done: new Date(c.farmCutoffAt).getTime() <= now } : null,
    { label: 'Chốt đơn đặt trước', ...splitDateTime(c.cutoffAt), done: new Date(c.cutoffAt).getTime() <= now },
    c.startDate ? { label: 'Bắt đầu mở điểm tập kết', date: fmtYmd(c.startDate), time: '', done: new Date(c.startDate + 'T00:00:00').getTime() <= now } : null,
    c.endDate ? { label: 'Kết thúc mở điểm tập kết', date: fmtYmd(c.endDate), time: '', done: new Date(c.endDate + 'T23:59:59').getTime() <= now } : null,
    c.finishDate ? { label: 'Kết thúc chiến dịch (giao xong)', date: fmtYmd(c.finishDate), time: '', done: c.status === 'COMPLETED' } : null,
  ].filter((x): x is { label: string; date: string; time: string; done: boolean } => x != null)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-[#326318]">
          <ArrowLeft size={16} /> Tất cả chiến dịch
        </button>
        {c.status === 'COMPLETED' && (
          <button
            type="button"
            disabled={orders.isPending || regs.isPending}
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#254d12] disabled:opacity-50"
          >
            <FileText size={16} /> Báo cáo
          </button>
        )}
      </div>

      {showNextStep && (c.status === 'DRAFT' || c.status === 'ACTIVE') && (
        <section aria-label="Bước tiếp theo" className="flex flex-col gap-4 rounded-3xl border-2 border-[#326318] bg-[#f4f9ef] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#326318] text-white"><CheckCircle2 size={20} /></span>
            <div>
              <p className="text-base font-black text-gray-900">Đã tạo chiến dịch. Bước tiếp theo: tìm shop góp hàng</p>
              <p className="mt-0.5 text-sm text-gray-600">
                Mời các shop quanh điểm tập kết, hoặc thêm luôn shop đã đồng ý kèm số kg họ góp. Bạn cũng có thể làm sau ở mục "Tìm nguồn hàng" bên dưới.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShopDialog('invite')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#254d12]">
              <MapPinned size={16} /> Mời shop lân cận
            </button>
            <button type="button" onClick={() => setShopDialog('add')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#326318] bg-white px-4 py-2.5 text-sm font-bold text-[#326318] hover:bg-[#eef6e7]">
              <UserPlus size={16} /> Thêm shop &amp; số kg
            </button>
            <button type="button" onClick={() => setShowNextStep(false)} className="rounded-xl px-3 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800">
              Để sau
            </button>
          </div>
        </section>
      )}

      {/* Đầu trang dạng bài báo: ảnh bìa, tít, sapo, thông tin chính, mốc thời gian */}
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <figure className="relative aspect-[16/10] bg-[#eef5e7] lg:aspect-auto lg:min-h-[300px]">
            {cover ? (
              <img src={cover} alt={c.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#e4f0da] to-[#fff6c4] text-[#326318]">
                <Sprout size={44} strokeWidth={1.5} />
                <span className="text-sm font-bold">Chưa có ảnh bìa</span>
              </div>
            )}
            {(c.categoryName || c.season) && (
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#326318] shadow-sm backdrop-blur">
                {[c.categoryName, c.season].filter(Boolean).join(' · ')}
              </figcaption>
            )}
          </figure>

          <div className="flex min-w-0 flex-col gap-4 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusChip s={c.status} called={!!c.callPostedAt} />
              <span className="font-bold text-[#e8590c]">Chiến dịch giải cứu</span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-400">{c.code}</span>
            </div>
            <h2 className="text-2xl font-black leading-tight text-gray-900 [text-wrap:balance] sm:text-[1.9rem]">{c.title}</h2>
            {lead && <p className="line-clamp-3 text-[15px] leading-relaxed text-gray-600">{lead}</p>}
            <p className="flex items-start gap-2 text-sm text-gray-700">
              <Warehouse size={16} className="mt-0.5 shrink-0 text-[#326318]" />
              <span>
                <b className="font-bold">{c.collectionSiteName || 'Chưa có điểm tập kết'}</b>
                {c.collectionSiteAddress && <span className="text-gray-500"> · {c.collectionSiteAddress}</span>}
              </span>
            </p>
            <dl className="mt-auto grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact label="Giá giải cứu" value={`${formatVnd(c.rescuePricePerKg)}/kg`} strong />
              <Fact label="Cọc" value={`${Math.round(Number(c.depositPercent) * 100)}%`} />
              <Fact label="Ngưỡng tối thiểu" value={kg(c.minThresholdKg)} />
              <Fact
                label={Number(c.targetVolumeKg) > Number(c.plannedTargetKg ?? c.targetVolumeKg) ? `Tổng hàng · mục tiêu ${kg(c.plannedTargetKg)}` : 'Mục tiêu'}
                value={kg(c.targetVolumeKg)}
              />
            </dl>
          </div>
        </div>

        <ol className="grid grid-cols-2 gap-px border-t border-gray-100 bg-gray-100 sm:grid-cols-4">
          {timeline.map((t) => (
            <li key={t.label} className="flex flex-col gap-0.5 bg-white px-5 py-4 sm:px-8">
              <span className={`flex items-center gap-1.5 text-xs font-bold ${t.done ? 'text-[#326318]' : 'text-gray-500'}`}>
                <span className={`h-2 w-2 rounded-full ${t.done ? 'bg-[#326318]' : 'border border-gray-300 bg-white'}`} /> {t.label}
              </span>
              <span className="text-lg font-black tabular-nums text-gray-900">{t.date}</span>
              {t.time && <span className="text-xs tabular-nums text-gray-500">lúc {t.time}</span>}
            </li>
          ))}
        </ol>

        {/* Thanh thao tác: tiến trình theo thứ tự các bước, rồi các nhóm việc phụ */}
        <div className="flex flex-col gap-5 border-t border-gray-100 bg-[#fafbf8] px-5 py-5 sm:px-8">
          <section aria-label="Tiến trình chiến dịch">
            <p className="mb-2 text-sm font-black text-gray-900">Tiến trình</p>
            {c.status === 'CANCELLED' ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Chiến dịch đã huỷ, tiền cọc đã được hoàn cho người mua.</p>
            ) : (
              <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {steps.map((st, i) => {
                  const current = !st.done && (!!st.open || steps.slice(0, i).every((x) => x.done))
                  return (
                    <li key={st.label}
                      className={`flex flex-col gap-2 rounded-2xl border p-3.5 ${st.done ? 'border-[#cfe6c4] bg-[#eef6e7]' : current ? 'border-[#326318] bg-white shadow-sm' : 'border-gray-200 bg-white/60'}`}>
                      {/* Số bước nằm trên, tên bước dùng hết bề ngang thẻ để không rớt chữ */}
                      <div className="flex flex-col items-start gap-2">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${st.done ? 'bg-[#326318] text-white' : current ? 'border-2 border-[#326318] text-[#326318]' : 'border border-gray-300 text-gray-400'}`}>
                          {st.done ? <Check size={14} /> : i + 1}
                        </span>
                        <span className={`text-sm font-bold [text-wrap:balance] ${st.done || current ? 'text-gray-900' : 'text-gray-400'}`}>{st.label}</span>
                      </div>
                      {st.done ? (
                        st.extra ?? <span className="text-xs font-semibold text-[#326318]">Đã xong</span>
                      ) : st.action ? (
                        <div className="flex flex-wrap gap-2">{st.action}</div>
                      ) : (
                        <span className="text-xs text-gray-500">{st.hint}</span>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          {fulfilling && (
            <section aria-label="Gom và giao hàng">
              <p className="mb-2 text-sm font-black text-gray-900">Gom &amp; giao hàng</p>
              <div className="flex flex-wrap gap-2">
                {pendingIntake === 0 && !c.topUpOpen && Number(c.topUpRemainingKg ?? 0) > 0 && button('top-up-call', `Kêu gọi bổ sung ${kg(c.topUpRemainingKg)}`, 'Đã gửi kêu gọi bổ sung tới các nhà vườn.', <Megaphone size={16} />)}
                {c.topUpOpen && button('top-up-call/close', 'Đóng kêu gọi bổ sung', 'Đã đóng kêu gọi bổ sung.', <X size={16} />, 'danger')}
                {shortfall > 0 && pendingIntake === 0 && (
                  <button type="button" onClick={() => setSupplyOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-sm font-bold text-white hover:bg-amber-600">
                    <PackagePlus size={16} /> Bổ sung hàng
                  </button>
                )}
                {shortfall > 0 && pendingIntake === 0 && <ShortfallCloseButton c={c} onNotice={(n) => { setNotice(n); refresh() }} />}
                <button type="button" onClick={openPlan} className={toolBtn}><Route size={16} /> Xe chở hàng ra hub</button>
              </div>
            </section>
          )}

          <div className="flex flex-col gap-5 border-t border-gray-200 pt-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
              {(c.status === 'DRAFT' || c.status === 'ACTIVE') && (
                <section aria-label="Tìm nguồn hàng">
                  <p className="mb-2 text-sm font-black text-gray-900">Tìm nguồn hàng</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setShopDialog('invite')} className={toolBtn}>
                      <MapPinned size={16} /> Mời shop lân cận
                    </button>
                    <button type="button" onClick={() => setShopDialog('add')} className={toolBtn}>
                      <UserPlus size={16} /> Thêm shop &amp; số kg
                    </button>
                  </div>
                </section>
              )}
              <section aria-label="Bài viết chiến dịch">
                <p className="mb-2 text-sm font-black text-gray-900">Bài viết</p>
                <div className="flex flex-wrap gap-2">
                  {c.status === 'DRAFT' && (
                    <button type="button" onClick={() => setEditing(true)} className={toolBtn}>
                      <Pencil size={16} /> Chỉnh sửa
                    </button>
                  )}
                  <button type="button" onClick={() => setTab('banner')} className={toolBtn}>
                    <ImagePlus size={16} /> Banner trang chủ
                  </button>
                  <a href={`/chien-dich/${c.campaignId}?xem-truoc=1`} target="_blank" rel="noreferrer" className={toolBtn}>
                    <Eye size={16} /> Xem bài viết
                  </a>
                </div>
              </section>
            </div>
            {['DRAFT', 'ACTIVE', 'THRESHOLD_MET'].includes(c.status) && (
              <section aria-label="Huỷ chiến dịch" className="lg:text-right">
                <p className="mb-7 text-sm font-black text-gray-900"></p>
                {button('cancel', 'Huỷ & hoàn cọc', 'Đã huỷ chiến dịch và hoàn cọc.', <Ban size={16} />, 'danger')}
              </section>
            )}
          </div>
        </div>
      </article>
      {shopDialog === 'invite' && (
        <InviteShopsDialog
          c={c}
          onClose={() => setShopDialog(null)}
          onDone={(n) => { setShopDialog(null); setNotice({ ok: true, text: `Đã gửi lời mời góp hàng tới ${n} shop.` }) }}
        />
      )}
      {shopDialog === 'add' && (
        <AddShopKgDialog
          c={c}
          onClose={() => setShopDialog(null)}
          onDone={(text) => { setShopDialog(null); setTab('farms'); setNotice({ ok: true, text }); refresh() }}
        />
      )}
      {editing && (
        <CreateDialog
          editing={c}
          onClose={() => setEditing(false)}
          onCreated={() => { setEditing(false); setNotice({ ok: true, text: 'Đã lưu thay đổi chiến dịch.' }); refresh() }}
        />
      )}

      {supplyOpen && (
        <AddSupplyDialog
          c={c}
          regs={regs.data ?? []}
          onClose={() => setSupplyOpen(false)}
          onDone={(text) => { setSupplyOpen(false); setTab('farms'); setNotice({ ok: true, text }); refresh() }}
        />
      )}

      {reportOpen && (
        <CampaignReportDialog c={c} orders={orders.data ?? []} regs={regs.data ?? []} onClose={() => setReportOpen(false)} />
      )}

      {planOpen && (
        <ShipperCallDialog
          c={c}
          orders={orders.data ?? []}
          pendingIntake={pendingIntake}
          onClose={() => setPlanOpen(false)}
          onPack={goPack}
          onNotice={(n) => { setNotice(n); refresh() }}
        />
      )}

      {notice && (
        <div
          role={notice.ok ? 'status' : 'alert'}
          className={`fixed bottom-6 left-1/2 z-[1100] flex w-[min(92vw,34rem)] -translate-x-1/2 items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${notice.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}
        >
          <span>{notice.text}</span>
          <button type="button" aria-label="Đóng" onClick={() => setNotice(null)}><X size={16} /></button>
        </div>
      )}

      {/* Số liệu chiến dịch: xếp dọc, bấm mục nào mới mở mục đó */}
      {(['THRESHOLD_MET', 'FULFILLING', 'COMPLETED'].includes(c.status) || (orders.data?.length ?? 0) > 0) && (
        <div className="flex flex-col gap-3">
          {['THRESHOLD_MET', 'FULFILLING'].includes(c.status) && (
            <TruckCallSection c={c} orders={orders.data ?? []} pendingIntake={pendingIntake} onPack={goPack} onNotice={(n) => { setNotice(n); refresh() }} />
          )}
          {['FULFILLING', 'COMPLETED'].includes(c.status) && (
            <HubDeliverySection c={c} orders={orders.data ?? []} onNotice={(n) => { setNotice(n); refresh() }} />
          )}
          {['THRESHOLD_MET', 'FULFILLING', 'COMPLETED'].includes(c.status) && <SupplyPanel c={c} onAdd={() => setSupplyOpen(true)} onNotice={(n) => { setNotice(n); refresh() }} />}
          {['FULFILLING', 'COMPLETED'].includes(c.status) && <CampaignResultPanel c={c} orders={orders.data ?? []} regs={regs.data ?? []} />}
          {(orders.data?.length ?? 0) > 0 && <DepositPanel rows={orders.data ?? []} />}
        </div>
      )}

      <div ref={tabsRef} className="flex scroll-mt-4 gap-1 overflow-x-auto border-b border-gray-200" role="tablist">
        {([['farms', `Nhà vườn & nhận hàng (${regs.data?.length ?? 0})`], ['orders', `Đơn đặt trước (${orders.data?.length ?? 0})`], ['claims', `Báo hư${claims.data?.some((x) => x.status === 'PENDING') ? ` (${claims.data.filter((x) => x.status === 'PENDING').length} chờ)` : ''}`], ['banner', `Banner trang chủ${c.bannerOnHome === false ? ' (tắt)' : ''}`]] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={activeTab === k} onClick={() => setTab(k)}
            disabled={k === 'orders' && !!ordersLocked} title={k === 'orders' ? ordersLocked ?? undefined : undefined}
            className={`-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${activeTab === k ? 'border-[#326318] text-[#326318]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {k === 'orders' && ordersLocked && <Lock size={13} />}
            {label}
          </button>
        ))}
      </div>

      {ordersLocked && (
        <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <Lock size={13} /> Tab Đơn đặt trước đang khoá. {ordersLocked}
        </p>
      )}

      {activeTab === 'banner' ? (
        <CampaignBannerEditor key={c.bannerUpdatedAt ?? 'new'} c={c} onNotice={(n) => { setNotice(n); refresh() }} />
      ) : activeTab === 'claims' ? (
        <CampaignDamageClaims campaignId={id} onNotice={(n) => { setNotice(n); refresh() }} />
      ) : activeTab === 'farms' ? (
        <FarmTable c={c} rows={regs.data ?? []} loading={regs.isPending} onIntake={setIntakeFor} onChanged={refresh} onError={(t) => setNotice({ ok: false, text: t })} />
      ) : (
        <OrderTable c={c} rows={orders.data ?? []} loading={orders.isPending} onChanged={refresh} onError={(t) => setNotice({ ok: false, text: t })} />
      )}

      {intakeFor && (
        <IntakeDialog
          c={c}
          r={intakeFor}
          onClose={() => setIntakeFor(null)}
          onSaved={(r) => { setIntakeFor(null); setNotice({ ok: true, text: `Đã ghi nhận ${kg(r.acceptedWeightKg)} đạt chuẩn từ ${r.shopName}.` }); refresh() }}
        />
      )}
    </div>
  )
}

/** Tiền cọc của người mua theo trạng thái: sàn đang giữ, đã hoàn, đã giải ngân, chờ thanh toán */
function DepositPanel({ rows }: { rows: PreOrderResponse[] }) {
  const of = (s: string) => rows.filter((r) => r.depositStatus === s)
  const sum = (s: string) => of(s).reduce((t, r) => t + Number(r.depositAmount ?? 0), 0)
  const items = [
    { s: 'HELD_IN_ESCROW', label: 'Sàn đang giữ', tone: 'text-amber-700' },
    { s: 'REFUNDED', label: 'Đã hoàn người mua', tone: 'text-sky-700' },
    { s: 'RELEASED_TO_FARMER', label: 'Đã giải ngân', tone: 'text-[#326318]' },
    { s: 'PENDING', label: 'Chờ thanh toán cọc', tone: 'text-gray-700' },
  ]
  return (
    <CampaignSection icon={<Wallet size={20} />} title="Tiền cọc người mua" badge={`Đang giữ ${formatVnd(sum('HELD_IN_ESCROW'))}`} badgeTone="amber">
      <dl>
        {items.map((i) => <InfoRow key={i.s} label={i.label} hint={`${of(i.s).length} đơn`} value={formatVnd(sum(i.s))} tone={i.tone} />)}
      </dl>
      <p className="mt-2 text-xs text-gray-500">Huỷ chiến dịch thì hoàn cọc về ví người mua, hoàn tất thì giải ngân cho nhà vườn.</p>
    </CampaignSection>
  )
}

/** Cung - cầu sau khi chốt: đã bán vs đạt chuẩn đã nhận; thiếu thì bổ sung hàng */
function SupplyPanel({ c, onAdd, onNotice }: { c: CampaignResponse; onAdd: () => void; onNotice: (n: { ok: boolean; text: string }) => void }) {
  const sold = Number(c.soldVolumeKg ?? 0)
  const accepted = Number(c.acceptedVolumeKg ?? 0)
  const packed = Number(c.packedVolumeKg ?? 0)
  const shortfall = Number(c.shortfallVolumeKg ?? 0)
  const pending = c.intakePendingCount ?? 0
  const short = pending === 0 && shortfall > 0
  return (
    <CampaignSection
      icon={<Scale size={20} />}
      title="Hàng tại điểm tập kết"
      badge={pending > 0 ? `Còn ${pending} lô chưa cân` : short ? `Thiếu ${kg(shortfall)}` : c.supply ? supplyVerdict(c.supply).text : 'Đủ hàng'}
      badgeTone={pending > 0 ? 'amber' : short ? 'red' : c.supply ? supplyVerdict(c.supply).tone : 'green'}
    >
      {c.supply ? (
        <div className="pt-3">
          <SupplyStory s={c.supply} showMoney />
          <p className="border-t border-gray-100 pt-2 text-xs text-gray-500">
            Đã đóng gói {kg(packed)}{pending > 0 ? ` · còn ${pending} lô chưa cân nên số liệu chưa đủ` : ''}
          </p>
        </div>
      ) : (
        <>
          <div className="pt-3">
            <ProgressBar percent={sold > 0 ? (accepted / sold) * 100 : 0} tone={shortfall > 0 ? 'bg-amber-500' : 'bg-[#326318]'} />
          </div>
          <dl className="mt-1">
            <InfoRow label="Người mua đã cọc" value={kg(sold)} />
            <InfoRow label="Đạt chuẩn đã nhận" value={kg(accepted)} tone="text-[#326318]" />
            <InfoRow label="Đã đóng gói" value={kg(packed)} />
            <InfoRow label="Thiếu" value={kg(shortfall)} tone={shortfall > 0 ? 'text-red-600' : 'text-gray-900'} />
          </dl>
        </>
      )}
      {c.topUpOpen && (
        <p className="mt-2 flex items-center gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-900">
          <Megaphone size={16} className="shrink-0" />
          <span>Đang kêu gọi bổ sung <b>{kg(c.topUpKg)}</b>, còn <b>{kg(c.topUpRemainingKg)}</b> chưa có nhà vườn nhận. Duyệt lô ở tab Nhà vườn.</span>
        </p>
      )}
      {short && c.status === 'FULFILLING' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">
            <PackagePlus size={16} /> Bổ sung hàng
          </button>
          <ShortfallCloseButton c={c} onNotice={onNotice} />
        </div>
      )}
    </CampaignSection>
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
  const [viewing, setViewing] = useState<FarmRegistrationResponse | null>(null)
  const review = useMutation({
    mutationFn: ({ r, ok }: { r: FarmRegistrationResponse; ok: boolean }) =>
      ok ? adminCampaignService.approve(r.registrationId)
        : adminCampaignService.reject(r.registrationId, 'Không phù hợp chiến dịch'),
    onSuccess: onChanged,
    onError: (e) => onError(getErrorMessage(e, 'Không duyệt được đăng ký.')),
  })
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
  if (rows.length === 0) return <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Chưa có nhà vườn nào đăng ký.</div>
  const canReview = c.status === 'DRAFT' || c.status === 'ACTIVE' || !!c.topUpOpen
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
                  Giá thu mua <b className="text-gray-800">{formatVnd(r.agreedPricePerKg ?? c.rescuePricePerKg)}/kg</b>
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#326318]"><Eye size={12} /> Xem đơn & ảnh lô hàng</span>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : r.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'}`}>
                {r.status === 'APPROVED' ? 'Đã duyệt' : r.status === 'REJECTED' ? 'Từ chối' : r.status === 'CANCELLED' ? 'Huỷ theo chiến dịch' : 'Chờ duyệt'}
              </span>
            </button>

            {r.status === 'PENDING' && canReview && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
                <div className="ml-auto flex gap-2">
                  <button type="button" disabled={review.isPending} onClick={() => review.mutate({ r, ok: false })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Từ chối</button>
                  <button type="button" disabled={review.isPending} onClick={() => review.mutate({ r, ok: true })} className="inline-flex items-center gap-1 rounded-lg bg-[#326318] px-3 py-1.5 text-xs font-bold text-white"><Check size={14} /> Duyệt</button>
                </div>
              </div>
            )}

            {r.status === 'APPROVED' && <LotFreshnessBox c={c} r={r} />}
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
  // Xem / in tem QR: 'all' = mọi thùng đã đóng gói, số = một đơn
  const [labelsFor, setLabelsFor] = useState<number | 'all' | null>(null)
  const pack = useMutation({
    mutationFn: (p: PreOrderResponse) => adminCampaignService.pack(p.preOrderId),
    onSuccess: (_r, p) => {
      onChanged()
      setLabelsFor(p.preOrderId)
    },
    onError: (e) => onError(getErrorMessage(e, 'Không đóng gói được đơn.')),
  })
  const packing = c.status === 'FULFILLING'
  const toPack = packing ? rows.filter((p) => p.status === 'DEPOSIT_PAID') : []
  const [packedCount, setPackedCount] = useState<number | null>(null)
  const packAll = useMutation({
    mutationFn: async (list: PreOrderResponse[]) => {
      for (let i = 0; i < list.length; i++) {
        setPackedCount(i)
        await adminCampaignService.pack(list[i].preOrderId)
      }
    },
    onSuccess: onChanged,
    onError: (e) => {
      onChanged()
      onError(getErrorMessage(e, 'Chưa đóng gói hết, một phần đơn đã đóng.'))
    },
    onSettled: () => setPackedCount(null),
  })
  const pickedUp = useMutation({
    mutationFn: (p: PreOrderResponse) => adminCampaignService.confirmPickup(p.preOrderId),
    onSuccess: onChanged,
    onError: (e) => onError(getErrorMessage(e, 'Không xác nhận được khách đã lấy hàng.')),
  })
  const remind = useMutation({
    mutationFn: (p: PreOrderResponse) => adminCampaignService.remindPickup(p.preOrderId),
    onSuccess: onChanged,
    onError: (e) => onError(getErrorMessage(e, 'Không gửi được thông báo nhắc khách.')),
  })
  const remindAll = useMutation({
    mutationFn: async (list: PreOrderResponse[]) => { for (const p of list) await adminCampaignService.remindPickup(p.preOrderId) },
    onSuccess: onChanged,
    onError: (e) => { onChanged(); onError(getErrorMessage(e, 'Có đơn chưa gửi được thông báo nhắc.')) },
  })
  const noShow = useMutation({
    mutationFn: (p: PreOrderResponse) => adminCampaignService.pickupNoShow(p.preOrderId, 'Khách không đến lấy hàng sau khi đã được nhắc'),
    onSuccess: onChanged,
    onError: (e) => onError(getErrorMessage(e, 'Không cập nhật được đơn.')),
  })
  const packed = rows.filter((p) => ['PROCESSING', 'READY', 'SHIPPING'].includes(p.status))
  const waitingPickup = rows.filter((p) => p.status === 'PROCESSING' && p.fulfillmentMethod === 'PICKUP')
  const notReminded = waitingPickup.filter((p) => !p.pickupRemindCount)
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
  if (rows.length === 0) return <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Chưa có đơn đặt trước.</div>
  return (
    <div className="space-y-3">
      {labelsFor != null && <PackageLabelsDialog c={c} orderId={labelsFor === 'all' ? undefined : labelsFor} onClose={() => setLabelsFor(null)} />}
      {toPack.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#326318] bg-[#eef6e7] px-4 py-3">
          <p className="text-sm text-[#254d12]">
            Còn <b>{toPack.length}</b> đơn chưa đóng gói · <b>{toPack.reduce((n, p) => n + p.crateQuantity - (p.packedCrates?.length ?? 0), 0)}</b> thùng.
            Bấm từng số thùng khi đóng xong, hoặc đóng cả loạt.
          </p>
          <button type="button" disabled={packAll.isPending}
            onClick={async () => {
              const agreed = await globalShowConfirm('Đóng gói tất cả đơn?', 'Chỉ bấm khi mọi thùng đã đóng xong thực tế.', {
                confirmText: 'Đóng gói tất cả',
                details: [`${toPack.length} đơn · ${toPack.reduce((n, p) => n + p.crateQuantity, 0)} thùng`],
              })
              if (agreed) packAll.mutate(toPack)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2 text-sm font-black text-white hover:bg-[#254d12] disabled:opacity-60">
            {packAll.isPending ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
            {packAll.isPending ? `Đang đóng ${(packedCount ?? 0) + 1}…` : 'Đóng gói tất cả'}
          </button>
        </div>
      )}
      {packed.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-700">
            <b>{packed.reduce((n, p) => n + p.crateQuantity, 0)}</b> thùng đã đóng gói, dán tem QR trước khi chuyển đi
          </p>
          <button type="button" onClick={() => setLabelsFor('all')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#326318] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#254d12]">
            <QrCode size={14} /> In tem QR
          </button>
        </div>
      )}
      {c.status === 'FULFILLING' && waitingPickup.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-900">
            <b>{waitingPickup.length}</b> đơn tự đến lấy đã đóng gói, chờ khách đến nhận
            {notReminded.length > 0 ? <> · <b>{notReminded.length}</b> đơn chưa được nhắc</> : ' · đã nhắc tất cả'}
          </p>
          <button type="button" disabled={remindAll.isPending || notReminded.length === 0} onClick={() => remindAll.mutate(notReminded)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
            <Bell size={14} /> {remindAll.isPending ? 'Đang gửi…' : 'Gửi thông báo đến lấy hàng'}
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Đơn</th>
              <th className="px-4 py-3">Người nhận</th>
              <th className="px-4 py-3">Thùng</th>
              <th className="px-4 py-3">Mã QR</th>
              <th className="px-4 py-3 text-right">Cọc</th>
              <th className="px-4 py-3 text-right">Phí giao</th>
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
                  {p.fulfillmentMethod === 'PICKUP' ? (
                    <span className="mt-0.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Tự đến lấy</span>
                  ) : (
                    <p className="max-w-[220px] truncate text-xs text-gray-500">{p.shippingAddress}</p>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {p.crateQuantity} × {p.crateKg} kg
                  {p.priorityLevel && (
                    <div className="mt-1 flex flex-col items-start gap-0.5">
                      <PriorityChip level={p.priorityLevel} />
                      <span className="text-[11px] font-normal text-gray-500">
                        Giữ tươi {tierLabel(p.shelfLifeTier)}{p.deliverBy ? ` · giao trước ${fmtDeadline(p.deliverBy)}` : ''}
                      </span>
                      {p.sourceProductName && <span className="text-[11px] font-normal text-gray-500">Lô: {p.sourceProductName}{p.sourceShopName ? ` (${p.sourceShopName})` : ''}</span>}
                    </div>
                  )}
                  {p.originalCrateQuantity != null && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">giảm từ {p.originalCrateQuantity} thùng</span>
                  )}
                  {packing && p.status === 'DEPOSIT_PAID' && (
                    <CrateTicks p={p} disabled={packAll.isPending} onPacked={onChanged} onError={onError} />
                  )}
                </td>
                <td className="px-4 py-3">
                  <OrderQr p={p} onOpen={() => setLabelsFor(p.preOrderId)} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatVnd(p.depositAmount)}
                  {Number(p.shortfallRefundAmount ?? 0) > 0 && <p className="text-[11px] font-bold text-red-600">đã hoàn {formatVnd(p.shortfallRefundAmount)}</p>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {p.fulfillmentMethod === 'PICKUP' ? '0đ' : formatVnd(p.shippingFee ?? 0)}
                  {p.shippingDistanceKm != null && <p className="text-[11px] text-gray-500">{p.shippingDistanceKm} km</p>}
                  {Number(p.shippingDiscountAmount ?? 0) > 0 && <p className="text-[11px] font-bold text-emerald-700">gom đơn -{formatVnd(p.shippingDiscountAmount)}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold text-gray-700">{p.status === 'READY' ? adminReadyLabel(p) : PRE_ORDER_STATUS[p.status]}</span>
                  {p.cancelReason && <p className="max-w-[220px] text-[11px] text-gray-500">{p.cancelReason}</p>}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === 'DEPOSIT_PAID' && c.status === 'FULFILLING' && (
                    <button type="button" disabled={pack.isPending} onClick={() => pack.mutate(p)} className="inline-flex items-center gap-1 rounded-lg bg-[#326318] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                      <PackageCheck size={14} /> Đóng cả đơn
                    </button>
                  )}
                  {p.status === 'PROCESSING' && p.fulfillmentMethod === 'PICKUP' && c.status === 'FULFILLING' && (
                    <button type="button" disabled={pickedUp.isPending} onClick={() => pickedUp.mutate(p)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                      <Check size={14} /> Khách đã lấy · thu {formatVnd(p.remainingAmount)}
                    </button>
                  )}
                  {p.status === 'PROCESSING' && p.fulfillmentMethod === 'PICKUP' && c.status === 'FULFILLING' && (
                    <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                      <button type="button" disabled={remind.isPending} onClick={() => remind.mutate(p)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-[11px] font-bold text-emerald-800 disabled:opacity-50">
                        <Bell size={12} /> {p.pickupRemindCount ? `Nhắc lại (${p.pickupRemindCount})` : 'Nhắc khách đến lấy'}
                      </button>
                      <button type="button" disabled={noShow.isPending || !p.pickupRemindCount} title={p.pickupRemindCount ? 'Khách không đến: đơn thất bại, giữ tiền cọc' : 'Cần nhắc khách ít nhất 1 lần trước'}
                        onClick={async () => { if (await globalShowConfirm(`Đơn ${p.code} khách không đến lấy?`, 'Đơn được đánh dấu thất bại.', { danger: true, confirmText: 'Đánh dấu không đến', details: [`Khách: ${p.recipientName}`, `Mất cọc: ${formatVnd(p.depositAmount)}`] })) noShow.mutate(p) }}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-700 disabled:opacity-40">
                        Khách không đến
                      </button>
                    </div>
                  )}
                  {p.pickupRemindedAt && p.status === 'PROCESSING' && (
                    <p className="mt-1 text-[11px] text-gray-500">Đã nhắc lúc {new Date(p.pickupRemindedAt).toLocaleString('vi-VN')}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Tick từng thùng khi đóng xong; đủ mọi thùng thì đơn chuyển sang đã đóng gói */
function CrateTicks({ p, disabled, onPacked, onError }: { p: PreOrderResponse; disabled: boolean; onPacked: () => void; onError: (t: string) => void }) {
  const qc = useQueryClient()
  const key = ['admin-campaign-orders', p.campaignId]
  const mutationKey = ['pack-crates', p.preOrderId]
  const save = useMutation({
    mutationKey,
    // Lưu lần lượt: bấm liên tiếp không ghi đè nhau
    scope: { id: `pack-crates-${p.preOrderId}` },
    mutationFn: (crates: number[]) => adminCampaignService.markCrates(p.preOrderId, crates),
    onMutate: (crates) => {
      qc.setQueryData<PreOrderResponse[]>(key, (old) => old?.map((o) => (o.preOrderId === p.preOrderId ? { ...o, packedCrates: crates } : o)))
    },
    onError: (e) => onError(getErrorMessage(e, 'Không lưu được thùng đã đóng.')),
    onSettled: () => {
      if (qc.isMutating({ mutationKey }) <= 1) onPacked()
    },
  })
  const done = p.packedCrates ?? []
  return (
    <div className="mt-2 flex max-w-[260px] flex-wrap items-center gap-1">
      {Array.from({ length: p.crateQuantity }, (_, i) => i + 1).map((n) => {
        const on = done.includes(n)
        return (
          <button key={n} type="button" aria-pressed={on} aria-label={`Đóng thùng ${n} đơn ${p.code}`} disabled={disabled}
            onClick={() => save.mutate(on ? done.filter((x) => x !== n) : [...done, n])}
            className={`flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-lg border px-1 text-[11px] font-black disabled:opacity-50 ${on ? 'border-[#326318] bg-[#326318] text-white' : 'border-gray-300 bg-white text-gray-600 hover:border-[#326318]'}`}>
            {on && <Check size={11} />}{n}
          </button>
        )
      })}
      <span className="ml-1 text-[11px] font-bold tabular-nums text-gray-500">{done.length}/{p.crateQuantity}</span>
    </div>
  )
}

/** Ô mã QR của đơn: có sau khi đóng gói; bấm để xem to và in tem, đơn đã giao thì mở trang tra cứu */
function OrderQr({ p, onOpen }: { p: PreOrderResponse; onOpen: () => void }) {
  const packed = ['PROCESSING', 'READY', 'SHIPPING'].includes(p.status)
  const url = isPackageToken(p.qrCode) ? traceUrl(savedWebUrl(), p.qrCode) : null
  const frame = 'inline-flex rounded-lg border border-gray-200 bg-white p-1 hover:border-[#326318]'
  if (packed) {
    return url ? (
      <button type="button" onClick={onOpen} title="Xem và in tem QR" aria-label={`Xem và in tem QR đơn ${p.code}`} className={frame}>
        <QRCodeSVG value={url} size={52} />
      </button>
    ) : (
      <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:border-[#326318] hover:text-[#326318]">
        <QrCode size={12} /> Lấy mã QR
      </button>
    )
  }
  if (url && p.status === 'DELIVERED') {
    return (
      <a href={url} target="_blank" rel="noreferrer" title="Mở trang người quét thấy" aria-label={`Mở trang tra cứu đơn ${p.code}`} className={frame}>
        <QRCodeSVG value={url} size={52} />
      </a>
    )
  }
  return <span className="text-[11px] text-gray-400">{p.status === 'DEPOSIT_PAID' ? 'Sau khi đóng gói' : '—'}</span>
}

/* ─────────────────────────── Cân nhận hàng ─────────────────────────── */

function IntakeDialog({ c, r, onClose, onSaved }: { c: CampaignResponse; r: FarmRegistrationResponse; onClose: () => void; onSaved: (r: FarmRegistrationResponse) => void }) {
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
  // Không nhận vượt phần được chia: nhà vườn mang dư thì mang về, thiếu thì chiến dịch kêu gọi bổ sung sau
  const over = r.allocatedVolumeKg != null && rec > allocated
  const invalid = !(rec >= 0) || received === '' || rej < 0 || rej > rec || over
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
          <LotFreshnessBox c={c} r={r} />
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
              {over
                ? <b className="text-red-600">Vượt {formatKg(rec - allocated)} so với phân bổ {formatKg(allocated)}. Chỉ nhận tối đa {formatKg(allocated)}, phần dư nhà vườn mang về.</b>
                : accepted < allocated
                  ? <b className="text-red-600">Thiếu {formatKg(allocated - accepted)} so với phân bổ {formatKg(allocated)}; nhà vườn chỉ được trả cho {formatKg(accepted)}.</b>
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
          {invalid && received !== '' && <p className="text-sm font-semibold text-red-600">{over ? `Không nhận quá ${formatKg(allocated)} được chia cho lô này.` : 'Số kg hư không được lớn hơn số kg cân.'}</p>}
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

/** Tạo chiến dịch mới; có `prefill` khi duyệt / gộp đơn đề xuất của shop (tạo xong mới đánh dấu đơn đã duyệt) */
function CreateDialog({ onClose, onCreated, prefill, editing }: { onClose: () => void; onCreated: (id: number) => void; prefill?: ApprovePrefill; editing?: CampaignResponse }) {
  const inDays = (n: number) => new Date(Date.now() + n * 86400000)
  const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
  const [f, setF] = useState(() => withFinish({
    title: '', product: '', description: '', season: '', target: '', price: '', deposit: '30',
    publish: local(new Date(Math.ceil(Date.now() / 3600000) * 3600000 + 3600000)).slice(0, 16), farmCutoff: local(inDays(5)).slice(0, 16), cutoff: local(inDays(7)).slice(0, 16), start: local(inDays(8)).slice(0, 10), end: local(inDays(14)).slice(0, 10), finish: '', site: '',
    ...prefill?.fields,
    ...(editing ? fieldsOf(editing) : {}),
  }))
  const [pickupEnabled, setPickupEnabled] = useState(editing ? editing.pickupEnabled !== false : true)
  // Sửa chiến dịch hoặc duyệt đề xuất: điền sẵn địa chỉ đã lưu / shop gửi
  const [site, setSite] = useState<PlaceValue>(() => {
    const seed = prefill?.address ?? (editing?.collectionSiteAddress
      ? { ...EMPTY_ADDRESS, detail: editing.collectionSiteAddress, lat: editing.collectionSiteLatitude ?? undefined, lng: editing.collectionSiteLongitude ?? undefined }
      : undefined)
    return { name: f.site, address: (seed ? composeAddress(seed) : '') || f.site, lat: seed?.lat, lng: seed?.lng }
  })
  const [cover, setCover] = useState(editing?.coverImageUrl ?? prefill?.coverImageUrl ?? '')
  const [coverUploading, setCoverUploading] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)
  const onCover = async (file?: File) => {
    if (!file) return
    setCoverUploading(true)
    try {
      const url = (await uploadService.uploadImage(file, 'campaigns')).result?.url
      if (url) setCover(url)
    } finally {
      setCoverUploading(false)
      if (coverRef.current) coverRef.current.value = ''
    }
  }
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  useEscape(onClose)
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))
  const cutoffDay = f.cutoff ? f.cutoff.slice(0, 10) : ''
  const create = useMutation({
    mutationFn: () => {
      const body: CampaignUpsertRequest = {
        title: f.title.trim(), productName: f.product.trim(), description: htmlToPlainText(f.description).trim() ? f.description : undefined, season: f.season.trim() || undefined,
        targetVolumeKg: Number(f.target), minThresholdKg: Number(f.target) / 2, rescuePricePerKg: Number(f.price),
        depositPercent: Number(f.deposit) / 100, cutoffAt: `${f.cutoff}:00`, startDate: f.start || undefined, endDate: f.end || undefined, finishDate: f.finish || undefined, publishAt: f.publish ? `${f.publish}:00` : undefined, farmCutoffAt: f.farmCutoff ? `${f.farmCutoff}:00` : undefined,
        collectionSiteName: site.name.trim() || undefined, collectionSiteAddress: site.address.trim() || undefined,
        collectionSiteLatitude: site.lat, collectionSiteLongitude: site.lng,
        pickupEnabled,
        categoryId: editing ? editing.categoryId ?? undefined : prefill?.categoryId ?? undefined,
        coverImageUrl: cover || undefined,
      }
      if (editing) return adminCampaignService.update(editing.campaignId, body)
      if (prefill) return campaignProposalService.approve(prefill.proposalIds, body, note.trim() || undefined)
      return adminCampaignService.create(body)
    },
    onSuccess: (c) => onCreated(c.campaignId),
  })
  // Duyệt từ đề xuất: 2 popup cạnh nhau, trái là thông tin gốc của shop, phải là bài đăng chiến dịch để đối soát
  const sources = prefill?.proposals ?? []
  const split = sources.length > 0
  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex bg-black/50 ${split ? 'flex-col items-center gap-4 overflow-y-auto p-3 sm:p-6 lg:flex-row lg:items-stretch lg:justify-center lg:overflow-hidden' : 'items-end justify-center sm:items-center sm:p-6'}`}
      onClick={onClose}
    >
      {split && (
        <aside
          aria-label="Thông tin gốc của đề xuất"
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-2xl shrink-0 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:max-h-[94vh] lg:w-[440px] lg:max-w-none"
        >
          <div className="border-b border-gray-100 bg-[#f7faf4] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a7c2f]">Bước 1 · Đối chiếu</p>
            <h3 className="text-lg font-black text-gray-900">
              {sources.length > 1 ? `Thông tin gốc của ${sources.length} đề xuất` : 'Thông tin gốc shop đã gửi'}
            </h3>
            <p className="text-xs text-gray-500">Chỉ để xem, không sửa được</p>
          </div>
          <div className="overflow-y-auto p-5">
            <ProposalSourcePanel proposals={sources} />
          </div>
        </aside>
      )}
      <div role="dialog" aria-modal="true" aria-labelledby="tao-cd-title" onClick={(e) => e.stopPropagation()} className={`flex w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl ${split ? 'shrink-0 rounded-3xl lg:max-h-[94vh]' : 'max-h-[94vh] rounded-t-3xl sm:rounded-3xl'}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            {split && <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a7c2f]">Bước 2 · Soạn bài đăng</p>}
            <h3 id="tao-cd-title" className="text-lg font-black text-gray-900">
              {editing ? 'Chỉnh sửa chiến dịch' : prefill ? (prefill.proposalIds.length > 1 ? `Gộp ${prefill.proposalIds.length} đề xuất thành 1 chiến dịch` : 'Bài đăng chiến dịch') : 'Tạo chiến dịch giải cứu'}
            </h3>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault()
          // Cước xe và phí giao tính từ vị trí này (bản đồ không tải được thì vẫn cho lưu)
          if (site.address.trim() && site.lat == null && 'google' in window) {
            setFormError('Chọn một gợi ý hoặc chạm bản đồ để ghim vị trí điểm tập kết.')
            return
          }
          // Đã gửi lời kêu gọi rồi thì giờ đăng bài cũ được giữ nguyên
          if (f.publish && !editing?.callPostedAt && new Date(f.publish).getTime() < Date.now() - 60000) {
            setFormError('Ngày giờ đăng bài đã qua, hãy chọn thời điểm sắp tới.')
            return
          }
          if (f.publish && f.cutoff && f.publish >= f.cutoff) {
            setFormError('Ngày giờ đăng bài phải trước hạn chốt đơn đặt trước.')
            return
          }
          // Thứ tự: đăng bài kêu gọi nhà vườn -> chốt góp hàng nhà vườn -> chốt đơn đặt trước
          if (f.farmCutoff && f.publish && f.farmCutoff <= f.publish) {
            setFormError('Hạn chốt góp hàng của nhà vườn phải sau ngày giờ đăng bài.')
            return
          }
          if (f.farmCutoff && f.cutoff && f.farmCutoff >= f.cutoff) {
            setFormError('Hạn chốt đơn đặt trước phải sau hạn chốt góp hàng của nhà vườn.')
            return
          }
          // Thứ tự: chốt đơn đặt trước -> bắt đầu (ngày sau đó) -> kết thúc
          if (f.start && f.cutoff && f.start <= f.cutoff.slice(0, 10)) {
            setFormError('Ngày chốt đơn đặt trước phải trước ngày bắt đầu mở điểm tập kết (ít nhất 1 ngày).')
            return
          }
          if (f.end && f.cutoff && f.end <= f.cutoff.slice(0, 10)) {
            setFormError('Ngày kết thúc mở điểm tập kết phải sau hạn chốt đơn đặt trước.')
            return
          }
          if (f.start && f.end && f.end < f.start) {
            setFormError('Ngày kết thúc mở điểm tập kết không được trước ngày bắt đầu mở điểm tập kết.')
            return
          }
          if (f.finish && f.end && f.finish < f.end) {
            setFormError('Ngày kết thúc chiến dịch (giao xong) không được trước ngày kết thúc mở điểm tập kết.')
            return
          }
          setFormError(null)
          create.mutate()
        }}>
          <TextField id="cd-title" label="Tên chiến dịch" value={f.title} onChange={set('title')} wide required />
          <TextField id="cd-product" label="Sản phẩm chính" value={f.product} onChange={set('product')} wide required />
          <div className="flex flex-col gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
            Ảnh bìa bài viết
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-[#eef5e7]">
                {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <Sprout size={24} className="absolute inset-0 m-auto text-[#326318]" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => coverRef.current?.click()} disabled={coverUploading} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-50">
                  {coverUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {cover ? 'Đổi ảnh' : 'Tải ảnh lên'}
                </button>
                {cover && (
                  <button type="button" onClick={() => setCover('')} className="rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Bỏ ảnh</button>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => onCover(e.target.files?.[0])} />
            </div>
            <span className="text-xs font-normal text-gray-500">Hiện ở đầu bài viết và ảnh nhỏ trong danh sách chiến dịch.</span>
          </div>
          <div className="flex flex-col gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
            Bài viết giới thiệu
            <Suspense fallback={<div className="flex h-56 items-center justify-center rounded-xl border border-gray-200 text-xs font-normal text-gray-500"><Loader2 size={16} className="mr-2 animate-spin" /> Đang tải trình soạn thảo…</div>}>
              <RichTextEditor value={f.description} onChange={set('description')} placeholder="Kể câu chuyện của vườn, vì sao cần giải cứu…" />
            </Suspense>
          </div>
          <NumField id="cd-target" label="Mục tiêu (kg)" value={f.target} onChange={set('target')} />
          <div className="flex flex-col gap-1.5 text-sm font-bold text-gray-700">
            Ngưỡng tối thiểu (tự tính)
            <p className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-black tabular-nums text-gray-900">
              {Number(f.target) > 0 ? formatKg(Number(f.target) / 2) : '—'}
            </p>
            <span className="text-xs font-normal text-gray-500">Bằng 50% tổng hàng. Nhà vườn góp nhiều hơn mục tiêu thì tổng hàng và ngưỡng tăng theo.</span>
          </div>
          <NumField id="cd-price" label="Giá giải cứu (đ/kg)" value={f.price} onChange={set('price')} />
          <NumField id="cd-deposit" label="Cọc (%)" value={f.deposit} onChange={set('deposit')} />
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#4a7c2f] sm:col-span-2">Phía nhà vườn góp hàng</p>
          <TextField id="cd-publish" label="Ngày giờ đăng bài kêu gọi nhà vườn" type="datetime-local" value={f.publish} onChange={set('publish')} required
            min={editing?.callPostedAt ? undefined : local(new Date()).slice(0, 16)}
            error={f.publish && !editing?.callPostedAt && new Date(f.publish).getTime() < Date.now() - 60000 ? 'Đã qua, hãy chọn thời điểm sắp tới' : undefined} />
          <TextField id="cd-farm-cutoff" label="Hạn chốt góp hàng (nhà vườn)" type="datetime-local" value={f.farmCutoff} onChange={set('farmCutoff')} required
            min={f.publish || undefined}
            error={f.farmCutoff && f.publish && f.farmCutoff <= f.publish ? 'Phải sau ngày giờ đăng bài' : undefined} />
          <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-[#4a7c2f] sm:col-span-2">Phía người mua đặt trước</p>
          <TextField id="cd-cutoff" label="Hạn chốt đơn đặt trước" type="datetime-local" value={f.cutoff} onChange={set('cutoff')} required wide
            min={f.farmCutoff || undefined}
            error={f.cutoff && f.farmCutoff && f.cutoff <= f.farmCutoff ? 'Phải sau hạn chốt góp hàng của nhà vườn' : undefined} />
          <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-[#4a7c2f] sm:col-span-2">Nhận hàng, giao hàng và kết thúc</p>
          <TextField id="cd-start" label="Ngày bắt đầu mở điểm tập kết" type="date" value={f.start} onChange={set('start')} required
            min={cutoffDay ? nextDay(cutoffDay) : undefined}
            error={f.start && cutoffDay && f.start <= cutoffDay ? `Phải sau hạn chốt đơn đặt trước (từ ${fmtYmd(nextDay(cutoffDay))})` : undefined} />
          <TextField id="cd-end" label="Ngày kết thúc mở điểm tập kết " type="date" value={f.end}
            onChange={(v) => setF((s) => withFinish({ ...s, end: v }))} required
            min={f.start || (cutoffDay ? nextDay(cutoffDay) : undefined)}
            error={f.end && cutoffDay && f.end <= cutoffDay ? 'Phải sau hạn chốt đơn đặt trước'
              : f.end && f.start && f.end < f.start ? 'Không được trước ngày bắt đầu mở điểm tập kết' : undefined} />
          <TextField id="cd-finish" label="Ngày kết thúc chiến dịch " type="date" value={f.finish} onChange={set('finish')}
            min={f.end || f.start || undefined}
            error={f.finish && f.end && f.finish < f.end ? 'Không được trước ngày kết thúc mở điểm tập kết' : undefined} />
          <TextField id="cd-season" label="Mùa vụ" value={f.season} onChange={set('season')} />
          <div className="sm:col-span-2">
            <PlaceSearch id="cd-site" label="Điểm tập kết" value={site} onChange={setSite} placeholder="Nhập địa chỉ điểm tập kết, vd: 20 Võ Văn Ngân, Thủ Đức" />
          </div>
          <fieldset className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-sm font-bold text-gray-700">Phí giao hàng</legend>
            <p className="text-xs text-gray-500 sm:col-span-2">
              Cố định theo tổng kg của đơn: dưới 30 kg thu 70.000đ · từ 30 kg thu 50.000đ · từ 50 kg miễn phí.
            </p>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 sm:col-span-2">
              <input type="checkbox" checked={pickupEnabled} onChange={(e) => setPickupEnabled(e.target.checked)} className="h-4 w-4 accent-[#326318]" />
              Cho phép người mua tự đến điểm tập kết lấy hàng (0đ)
            </label>
          </fieldset>
          {prefill && (
            <label htmlFor="cd-note" className="flex flex-col gap-1.5 text-sm font-bold text-gray-700 sm:col-span-2">
              Ghi chú gửi shop đề xuất (không bắt buộc)
              <input id="cd-note" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal" />
            </label>
          )}
          {formError && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{formError}</p>}
          {create.isError && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{getErrorMessage(create.error, editing ? 'Không lưu được thay đổi.' : 'Không tạo được chiến dịch.')}</p>}
          <button type="submit" disabled={create.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#326318] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
            {create.isPending ? <Loader2 size={16} className="animate-spin" /> : editing ? <Check size={16} /> : <Plus size={16} />} {editing ? 'Lưu thay đổi' : prefill ? 'Duyệt & tạo chiến dịch' : 'Tạo chiến dịch'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ─────────────────────────── Chi tiết đơn đăng ký của nhà vườn ─────────────────────────── */

const SHELF_LABEL: Record<string, string> = { DAYS_2_3: '2 – 3 ngày sau chốt', DAYS_3_4: '3 – 4 ngày sau chốt', DAYS_5_6: '5 – 6 ngày sau chốt' }
const REG_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Đã duyệt', tone: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Từ chối', tone: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Huỷ theo chiến dịch', tone: 'bg-gray-100 text-gray-600' },
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
            <Info label="Giá thu mua" value={r.effectivePricePerKg != null ? `${formatVnd(r.effectivePricePerKg)}/kg` : '—'} />
            <Info label="Cam kết" value={r.priceCommitted ? 'Đã cam kết' : 'Chưa cam kết'} />
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
    s === 'DRAFT' && called ? { label: 'Đang kêu gọi nhà vườn', tone: 'bg-lime-100 text-lime-800' } : STATUS[s]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone}`}>{label}</span>
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

// Ngày (yyyy-mm-dd) kế tiếp, tính theo UTC để không lệch múi giờ
/** Ngày kết thúc chiến dịch mặc định = kết thúc mở điểm tập kết + 3 ngày (thời gian giao xong); chỉnh lại nếu đang trống hoặc trước ngày kết thúc mở điểm tập kết */
function withFinish<T extends { end: string; finish: string }>(o: T): T {
  if (o.end && (!o.finish || o.finish < o.end)) {
    const d = new Date(o.end + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + 3)
    return { ...o, finish: d.toISOString().slice(0, 10) }
  }
  return o
}

function nextDay(day: string) {
  const d = new Date(day + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
const fmtYmd = (day: string) => day.split('-').reverse().join('/')

// Đổ dữ liệu chiến dịch đã lưu vào form sửa (ngày giờ dạng yyyy-MM-ddTHH:mm cho ô datetime-local)
function fieldsOf(c: CampaignResponse) {
  const num = (v?: number | null) => (v == null ? '' : String(v))
  return {
    title: c.title ?? '', product: c.productName ?? '', description: c.description ?? '', season: c.season ?? '',
    target: num(c.plannedTargetKg ?? c.targetVolumeKg), price: num(c.rescuePricePerKg),
    deposit: c.depositPercent != null ? String(Math.round(Number(c.depositPercent) * 100)) : '30',
    publish: c.publishAt ? c.publishAt.slice(0, 16) : '', farmCutoff: c.farmCutoffAt ? c.farmCutoffAt.slice(0, 16) : '', cutoff: c.cutoffAt ? c.cutoffAt.slice(0, 16) : '',
    start: c.startDate ?? '', end: c.endDate ?? '', finish: c.finishDate ?? '', site: c.collectionSiteName ?? '',
  }
}

function CoverThumb({ url }: { url?: string | null }) {
  return (
    <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-[#eef5e7]">
      {url ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Sprout size={18} className="absolute inset-0 m-auto text-[#326318]" />}
    </div>
  )
}

// Sapo cho đầu bài: lấy chữ thuần từ bài viết (HTML), cắt gọn khoảng 240 ký tự
function articleLead(html?: string | null) {
  if (!html) return ''
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  return text.length > 240 ? text.slice(0, 240).replace(/\s+\S*$/, '') + '…' : text
}

// "2026-11-26T00:05:00" -> { date: '26/11/2026', time: '00:05' }
function splitDateTime(v: string) {
  const d = new Date(v)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#f6faf2] px-3 py-2.5">
      <dt className="text-[11px] font-bold text-gray-500">{label}</dt>
      <dd className={`mt-0.5 truncate text-base font-black tabular-nums ${strong ? 'text-[#326318]' : 'text-gray-900'}`}>{value}</dd>
    </div>
  )
}

function TextField({ id, label, value, onChange, type = 'text', wide, required, min, error }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean; required?: boolean; min?: string; error?: string }) {
  return (
    <label htmlFor={id} className={`flex flex-col gap-1.5 text-sm font-bold text-gray-700 ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      <input id={id} type={type} required={required} min={min} value={value} onChange={(e) => onChange(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm font-normal ${error ? 'border-red-400' : 'border-gray-200'}`} />
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  )
}

function ErrorBox({ text }: { text: string }) {
  return <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{text}</div>
}
