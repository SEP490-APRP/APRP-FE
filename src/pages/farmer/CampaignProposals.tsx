import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  ImagePlus,
  Loader2,
  MapPin,
  Megaphone,
  Navigation,
  Pencil,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Tag,
  Timer,
  Undo2,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import {
  campaignProposalService,
  uploadService,
  type CampaignProposal,
  type CampaignProposalRequest,
  type NearbyShop,
  type ProposalMember,
  type ShelfLifeTier,
} from '@/services'
import { categoryService, type CategoryResponse } from '@/services/category.service'
import { useShopProfile, useUpdateShopProfile } from '@/features/shop/hooks/useShopProfile'
import { AddressPicker, composeAddress, EMPTY_ADDRESS, type AddressValue } from '@/components/common/AddressPicker'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'
import logoIcon from '@/assets/logo-icon.png'

// Độ bền tính từ ngày kết thúc (chốt) chiến dịch
const SHELF: { id: ShelfLifeTier; label: string; max: number }[] = [
  { id: 'DAYS_2_3', label: '2 – 3 ngày', max: 3 },
  { id: 'DAYS_3_4', label: '3 – 4 ngày', max: 4 },
  { id: 'DAYS_5_6', label: '5 – 6 ngày', max: 6 },
]

type FieldKey = 'categoryId' | 'productName' | 'story' | 'photoUrls' | 'shelfLifeTier' | 'harvestFrom' | 'harvestTo'
  | 'proposedOpenDate' | 'proposedCloseDate' | 'desiredPricePerKg' | 'siteName' | 'site'
type FieldErrors = Partial<Record<FieldKey, string>>

/** Lỗi theo từng ô BE trả về (result.fieldErrors) */
function fieldErrorsOf(err: unknown): FieldErrors {
  const data = (err as { data?: { result?: { fieldErrors?: FieldErrors } } } | null)?.data
  return data?.result?.fieldErrors ?? {}
}
const RADII = [5, 10, 20, 30, 50]
const MIN_LEAD_DAYS = 3

const STATUS: Record<CampaignProposal['status'], { label: string; tone: string }> = {
  DRAFT: { label: 'Nháp · đang rủ shop', tone: 'bg-[#f4f7f1] text-[#326318]' },
  SUBMITTED: { label: 'Đã gửi · chờ CapNong duyệt', tone: 'bg-amber-100 text-amber-800' },
  NEEDS_CHANGES: { label: 'Cần bổ sung', tone: 'bg-orange-100 text-orange-800' },
  APPROVED: { label: 'Đã duyệt thành chiến dịch', tone: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Bị từ chối', tone: 'bg-rose-100 text-rose-700' },
  WITHDRAWN: { label: 'Đã rút', tone: 'bg-neutral-100 text-neutral-600' },
}
const MEMBER: Record<ProposalMember['status'], { label: string; tone: string }> = {
  PENDING: { label: 'Chờ trả lời', tone: 'bg-amber-50 text-amber-700' },
  ACCEPTED: { label: 'Tham gia', tone: 'bg-emerald-50 text-emerald-700' },
  DECLINED: { label: 'Từ chối', tone: 'bg-neutral-100 text-neutral-600' },
  EXPIRED: { label: 'Hết hạn', tone: 'bg-neutral-100 text-neutral-500' },
  REMOVED: { label: 'Đã bỏ', tone: 'bg-neutral-100 text-neutral-500' },
}

const keys = {
  mine: ['campaign-proposals', 'mine'] as const,
  invites: ['campaign-proposals', 'invites'] as const,
}
const fmtDate = (v?: string | null) => (v ? new Date(v.length === 10 ? v + 'T00:00:00' : v).toLocaleDateString('vi-VN') : '—')
// Khoảng ngày ghi rõ "Từ ... đến ..." để không nhầm đâu là ngày bắt đầu
const fmtRange = (from?: string | null, to?: string | null) => `Từ ${fmtShort(from)} đến ${fmtShort(to)}`
const fmtShort = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v.length === 10 ? v + 'T00:00:00' : v)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
const isoFrom = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const isoIn = (days: number) => {
  const d = new Date(Date.now() + days * 86400000)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/**
 * Shop đề xuất mở chiến dịch giải cứu: soạn đơn, rủ shop lân cận đã xác minh, đủ 200 kg thì gửi CapNong duyệt.
 * Shop khởi xướng không có ưu đãi riêng; khi chiến dịch đăng lời kêu gọi, mọi shop (kể cả không được mời) đăng ký như thường.
 */
export default function CampaignProposals({ onInfo }: { onInfo?: (msg: string) => void }) {
  const qc = useQueryClient()
  const mine = useQuery({ queryKey: keys.mine, queryFn: () => campaignProposalService.getMine(), retry: 1 })
  const invites = useQuery({ queryKey: keys.invites, queryFn: () => campaignProposalService.getInvites(), retry: 1 })
  const profile = useShopProfile()
  const [editing, setEditing] = useState<CampaignProposal | 'new' | null>(null)
  const [editErrors, setEditErrors] = useState<FieldErrors | undefined>()
  const [inviting, setInviting] = useState<CampaignProposal | null>(null)
  const [pinning, setPinning] = useState(false)
  const refresh = () => {
    qc.invalidateQueries({ queryKey: keys.mine })
    qc.invalidateQueries({ queryKey: keys.invites })
  }

  const me = profile.data as (typeof profile.data & { shopLatitude?: number | null }) | undefined
  const hasPin = me?.shopLatitude != null
  const open = (mine.data ?? []).find((p) => ['DRAFT', 'SUBMITTED', 'NEEDS_CHANGES'].includes(p.status))
  const pendingInvites = (invites.data ?? []).filter((p) => p.myInvite?.status === 'PENDING')

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#e3ecd9] bg-[#f6faf2] p-5 sm:flex sm:items-start sm:justify-between sm:gap-6">
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-base font-black text-[#1c2216]">
            <Megaphone size={18} className="text-[#e8590c]" /> Vườn bạn đang dư hàng? Đề xuất CapNong mở chiến dịch
          </p>
          <ol className="list-decimal space-y-0.5 pl-5 text-xs leading-relaxed text-[#5d6657]">
            <li>Soạn đơn: nông sản, ảnh vườn, ngày thu hoạch, điểm tập kết dự kiến.</li>
            <li>Rủ các shop lân cận đã xác minh cùng góp hàng (không bắt buộc).</li>
            <li>Đủ tổng {formatKg(200)} dự kiến thì gửi CapNong duyệt. CapNong có thể gộp các đơn gần nhau thành 1 chiến dịch.</li>
            <li>Khi chiến dịch đăng lời kêu gọi, mọi shop đăng ký số kg như bình thường. Shop khởi xướng không có ưu đãi riêng.</li>
          </ol>
        </div>
        <button
          type="button"
          disabled={!!open}
          title={open ? 'Mỗi shop chỉ có 1 đơn đề xuất đang mở' : undefined}
          onClick={() => { setEditErrors(undefined); setEditing('new') }}
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-[#326318] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#254d12] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
        >
          <Pencil size={15} /> Tạo đề xuất
        </button>
      </div>

      {!profile.isLoading && !hasPin && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-amber-900">
            <b>Vườn của bạn chưa có vị trí trên bản đồ.</b> Ghim vị trí để shop lân cận tìm thấy và mời bạn cùng đề xuất.
          </p>
          <button type="button" onClick={() => setPinning(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700">
            <MapPin size={14} /> Ghim vị trí vườn
          </button>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <Section title="Lời mời đang chờ bạn" count={pendingInvites.length}>
          {pendingInvites.map((p) => (
            <InviteCard key={p.proposalId} p={p} onDone={(msg) => { refresh(); onInfo?.(msg) }} />
          ))}
        </Section>
      )}

      <Section title="Đề xuất của tôi" count={mine.data?.length}>
        {mine.isLoading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-[#f4f7f1]" />
        ) : mine.isError ? (
          <Empty text={getErrorMessage(mine.error, 'Chưa tải được đơn đề xuất.')} />
        ) : !mine.data?.length ? (
          <Empty text="Bạn chưa có đơn đề xuất nào. Bấm “Tạo đề xuất” khi vườn có hàng dư cần giải cứu." />
        ) : (
          mine.data.map((p) => (
            <ProposalCard
              key={p.proposalId}
              p={p}
              onEdit={(errs) => { setEditErrors(errs); setEditing(p) }}
              onInvite={() => setInviting(p)}
              onChanged={(msg) => { refresh(); if (msg) onInfo?.(msg) }}
            />
          ))
        )}
      </Section>

      {(invites.data ?? []).some((p) => p.myInvite?.status !== 'PENDING') && (
        <Section title="Đề xuất tôi đã trả lời">
          {(invites.data ?? []).filter((p) => p.myInvite?.status !== 'PENDING').map((p) => (
            <InviteCard key={p.proposalId} p={p} onDone={(msg) => { refresh(); onInfo?.(msg) }} />
          ))}
        </Section>
      )}

      {editing && (
        <ProposalForm
          p={editing === 'new' ? null : editing}
          initialErrors={editErrors}
          onClose={() => { setEditing(null); setEditErrors(undefined) }}
          onSaved={(saved, created) => {
            setEditing(null)
            refresh()
            onInfo?.(created ? 'Đã lưu đề xuất. Rủ shop lân cận hoặc gửi CapNong duyệt luôn.' : 'Đã lưu thay đổi.')
            if (created && saved.siteLatitude != null) setInviting(saved)
          }}
        />
      )}
      {inviting && <NearbyDialog p={inviting} onClose={() => setInviting(null)} onInvited={(n) => { setInviting(null); refresh(); onInfo?.(`Đã gửi lời mời tới ${n} shop.`) }}
        onSubmitted={() => { setInviting(null); refresh(); onInfo?.('Đã gửi đề xuất. CapNong sẽ xem xét và phản hồi.') }} />}
      {pinning && <PinDialog onClose={() => setPinning(false)} onSaved={() => { setPinning(false); onInfo?.('Đã ghim vị trí vườn.') }} />}
    </div>
  )
}

/* ─────────────────────────── Thẻ đơn của tôi ─────────────────────────── */

function ProposalCard({ p, onEdit, onInvite, onChanged }: {
  p: CampaignProposal
  onEdit: (errors?: FieldErrors) => void
  onInvite: () => void
  onChanged: (msg?: string) => void
}) {
  const st = STATUS[p.status]
  const editable = p.status === 'DRAFT' || p.status === 'NEEDS_CHANGES'
  const isOpen = editable || p.status === 'SUBMITTED'
  const minKg = Number(p.minSubmitKg || 200)
  const total = Number(p.totalEstimatedKg)
  const pct = Math.min(100, (total / minKg) * 100)
  const enough = total >= minKg
  const submit = useMutation({ mutationFn: () => campaignProposalService.submit(p.proposalId), onSuccess: () => onChanged('Đã gửi đề xuất. CapNong sẽ xem xét và phản hồi.') })
  const withdraw = useMutation({ mutationFn: () => campaignProposalService.withdraw(p.proposalId), onSuccess: () => onChanged('Đã rút đơn đề xuất.') })
  const remove = useMutation({ mutationFn: (shopId: number) => campaignProposalService.removeMember(p.proposalId, shopId), onSuccess: () => onChanged() })
  const err = submit.error || withdraw.error || remove.error
  const members = p.members.filter((m) => m.status !== 'REMOVED')

  // Tiến trình đơn: Soạn đơn → Rủ shop → Gửi duyệt → CapNong duyệt
  const stepAt = p.status === 'APPROVED' ? 4 : p.status === 'SUBMITTED' ? 3 : p.acceptedShopCount > 1 || p.pendingInviteCount > 0 ? 2 : 1
  const steps = ['Soạn đơn', 'Rủ shop', 'Gửi duyệt', 'CapNong duyệt']
  const closed = p.status === 'REJECTED' || p.status === 'WITHDRAWN'

  return (
    <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${closed ? 'border-[#eceee9] opacity-80' : 'border-[#e3ecd9]'}`}>
      <div className="grid sm:grid-cols-[200px_1fr]">
        <div className="relative h-44 bg-[#f7faf4] sm:h-auto">
          <img src={p.photoUrls[0] || logoIcon} alt="" className={`h-full w-full ${p.photoUrls[0] ? 'object-cover' : 'object-contain p-8'}`} />
          {p.photoUrls.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">+{p.photoUrls.length - 1} ảnh</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.tone}`}>{st.label}</span>
            {p.categoryName && <span className="rounded-full bg-[#f4f7f1] px-2.5 py-0.5 text-[11px] font-bold text-[#4a7c2f]">{p.categoryName}</span>}
            <span className="ml-auto font-mono text-[11px] text-[#9aa294]">{p.code}</span>
          </div>
          <h4 className="text-xl font-black leading-tight text-[#1c2216]">{p.productName || 'Chưa đặt tên nông sản'}</h4>
          <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <InfoTile icon={CalendarDays} label="Thu hoạch" value={fmtRange(p.harvestFrom, p.harvestTo)} />
            <InfoTile icon={CalendarRange} label="Mở bán chiến dịch" value={p.proposedOpenDate ? fmtRange(p.proposedOpenDate, p.proposedCloseDate) : 'Chưa chọn'} />
            <InfoTile icon={Tag} label="Giá mong muốn" value={p.desiredPricePerKg != null ? `${formatVnd(p.desiredPricePerKg)}/kg` : 'Chưa nhập'} />
            <InfoTile icon={Timer} label="Độ bền sau chốt" value={SHELF.find((s) => s.id === p.shelfLifeTier)?.label ?? 'Chưa chọn'} />
          </dl>
          <p className="flex items-start gap-1.5 text-xs text-[#5d6657]">
            <MapPin size={14} className="mt-px shrink-0 text-[#4a7c2f]" />
            {p.siteName ? <span><b className="text-[#1c2216]">{p.siteName}</b> · {p.siteAddress}</span> : 'Chưa chọn điểm tập kết'}
          </p>
        </div>
      </div>

      {!closed && (
        <ol className="grid grid-cols-4 gap-1 border-t border-[#f1f4ed] px-5 py-3">
          {steps.map((s, i) => {
            const done = i + 1 < stepAt || p.status === 'APPROVED'
            const now = i + 1 === stepAt && p.status !== 'APPROVED'
            return (
              <li key={s} className="flex flex-col gap-1.5">
                <span className={`h-1.5 rounded-full ${done ? 'bg-[#326318]' : now ? 'bg-[#9ed67d]' : 'bg-[#eef2ea]'}`} />
                <span className={`text-[11px] font-bold ${done || now ? 'text-[#2b5619]' : 'text-[#9aa294]'}`}>{done && '✓ '}{s}</span>
              </li>
            )
          })}
        </ol>
      )}

      {(p.status === 'NEEDS_CHANGES' || p.status === 'REJECTED') && p.adminNote && (
        <p className={`mx-5 mb-4 rounded-2xl px-4 py-3 text-sm ${p.status === 'REJECTED' ? 'bg-rose-50 text-rose-800' : 'bg-orange-50 text-orange-900'}`}>
          <b>CapNong ghi chú:</b> {p.adminNote}
        </p>
      )}
      {p.status === 'APPROVED' && (
        <p className="mx-5 mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Đã duyệt thành chiến dịch <b>{p.campaignCode}</b>. Khi CapNong đăng lời kêu gọi, bạn và các shop khác vào mục “Đang kêu gọi” để
          đăng ký số kg như bình thường.
        </p>
      )}

      <div className="border-t border-[#f1f4ed] bg-[#fafcf8] px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#7e8779]"><Users size={14} /> Shop cùng góp</p>
            <p className="mt-0.5 text-sm text-[#5d6657]">{p.acceptedShopCount} đã tham gia · {p.pendingInviteCount} đang chờ trả lời</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tabular-nums text-[#1c2216]">{formatKg(total)}<span className="text-sm font-bold text-[#9aa294]"> / {formatKg(minKg)}</span></p>
            <p className={`text-[11px] font-bold ${enough ? 'text-emerald-700' : 'text-amber-700'}`}>
              {enough ? 'Đủ số kg tối thiểu để gửi duyệt' : `Còn thiếu ${formatKg(minKg - total)} để gửi duyệt`}
            </p>
          </div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9efe4]">
          <div className={`h-full rounded-full ${enough ? 'bg-gradient-to-r from-[#4a7c2f] to-[#326318]' : 'bg-gradient-to-r from-[#c6e3b0] to-[#9ed67d]'}`} style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <MemberRow key={m.memberId} m={m} onRemove={editable && m.role === 'INVITED' ? () => remove.mutate(m.shopId) : undefined} />
          ))}
        </ul>
      </div>

      {err && (Object.keys(fieldErrorsOf(err)).length > 0 ? (
        <div className="mx-5 mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-[#7a1d16]">
          <p className="font-bold">Còn thiếu trước khi gửi duyệt:</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.values(fieldErrorsOf(err)).map((m) => <li key={m}>{m}</li>)}
          </ul>
          {editable && (
            <button type="button" onClick={() => onEdit(fieldErrorsOf(err))} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#326318] shadow-sm">
              <Pencil size={13} /> Sửa các ô này
            </button>
          )}
        </div>
      ) : (
        <p className="mx-5 mt-3 text-sm font-semibold text-[#b3261e]">{getErrorMessage(err, 'Thao tác chưa thành công.')}</p>
      ))}
      {isOpen && (
        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3">
          <button type="button" onClick={() => withdraw.mutate()} disabled={withdraw.isPending} className="mr-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-[#b3261e] hover:bg-rose-50">
            <Undo2 size={14} /> Rút đơn
          </button>
          {editable && (
            <>
              <button type="button" onClick={() => onEdit()} className="inline-flex items-center gap-1.5 rounded-full border border-[#d6e6c8] bg-white px-4 py-2 text-xs font-bold text-[#326318] hover:bg-[#eef6e7]">
                <Pencil size={14} /> Sửa
              </button>
              <button
                type="button"
                onClick={onInvite}
                disabled={p.siteLatitude == null}
                title={p.siteLatitude == null ? 'Chọn điểm tập kết trên bản đồ trước' : undefined}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d6e6c8] bg-white px-4 py-2 text-xs font-bold text-[#326318] hover:bg-[#eef6e7] disabled:opacity-50"
              >
                <UserPlus size={14} /> Rủ shop lân cận
              </button>
              <button
                type="button"
                onClick={() => submit.mutate()}
                disabled={!enough || submit.isPending}
                title={!enough ? `Cần tổng ít nhất ${formatKg(minKg)} dự kiến` : undefined}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#326318] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#254d12] disabled:opacity-50"
              >
                {submit.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Gửi CapNong duyệt
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7faf4] px-3 py-2">
      <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#7e8779]"><Icon size={12} /> {label}</dt>
      <dd className="mt-0.5 truncate text-sm font-bold text-[#1c2216]">{value}</dd>
    </div>
  )
}

function MemberRow({ m, onRemove }: { m: ProposalMember; onRemove?: () => void }) {
  const st = MEMBER[m.status]
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-[#eef2ea] bg-white px-3 py-2.5">
      <img src={m.logoUrl || logoIcon} alt="" className="h-10 w-10 shrink-0 rounded-full border border-[#e8ece3] bg-white object-cover" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[#1c2216]">
          <span className="truncate">{m.shopName}</span>
          {m.verified && <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="Đã xác minh" />}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#7e8779]">
          {m.role === 'INITIATOR' && <span className="rounded-full bg-[#326318] px-1.5 text-[10px] font-bold text-white">Khởi xướng</span>}
          {m.distanceKm != null && <span>~{m.distanceKm} km</span>}
          {m.ratingAverage != null && <span><Star size={10} className="inline -mt-0.5 fill-amber-400 text-amber-400" /> {m.ratingAverage.toFixed(1)}</span>}
          {m.phone && <span><Phone size={10} className="inline -mt-0.5" /> {m.phone}</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {m.estimatedKg != null && <span className="text-sm font-black tabular-nums text-[#1c2216]">{formatKg(m.estimatedKg)}</span>}
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.tone}`}>{st.label}</span>
      </div>
      {onRemove && (
        <button type="button" aria-label={`Bỏ ${m.shopName}`} onClick={onRemove} className="shrink-0 rounded-full p-1 text-[#9aa294] hover:bg-rose-50 hover:text-[#b3261e]">
          <X size={14} />
        </button>
      )}
    </li>
  )
}

/* ─────────────────────────── Lời mời nhận được ─────────────────────────── */

function InviteCard({ p, onDone }: { p: CampaignProposal; onDone: (msg: string) => void }) {
  const inv = p.myInvite!
  const [kg, setKg] = useState(inv.estimatedKg != null ? String(inv.estimatedKg) : '')
  const [zoom, setZoom] = useState<string | null>(null)
  const accept = useMutation({ mutationFn: () => campaignProposalService.acceptInvite(inv.memberId, Number(kg)), onSuccess: () => onDone('Đã nhận lời tham gia đề xuất.') })
  const decline = useMutation({ mutationFn: () => campaignProposalService.declineInvite(inv.memberId), onSuccess: () => onDone('Đã từ chối lời mời.') })
  const canReply = (p.status === 'DRAFT' || p.status === 'NEEDS_CHANGES') && (inv.status === 'PENDING' || inv.status === 'ACCEPTED' || inv.status === 'DECLINED')
  const hoursLeft = inv.expiresAt ? Math.max(0, Math.round((new Date(inv.expiresAt).getTime() - Date.now()) / 3600000)) : null
  const mapUrl = p.siteLatitude != null && p.siteLongitude != null ? `https://www.google.com/maps/search/?api=1&query=${p.siteLatitude},${p.siteLongitude}` : null
  const pending = inv.status === 'PENDING'
  return (
    <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${pending ? 'border-amber-300 ring-1 ring-amber-200' : 'border-[#e8ece3]'}`}>
      <div className="flex items-center gap-3 border-b border-[#f1f4ed] bg-[#fffaf0] px-5 py-3">
        <img src={p.initiatorLogoUrl || logoIcon} alt="" className="h-10 w-10 shrink-0 rounded-full border border-[#e8ece3] bg-white object-cover" />
        <p className="min-w-0 flex-1 text-sm text-[#5d6657]">
          <b className="text-[#1c2216]">{p.initiatorShopName}</b>{p.initiatorVerified && <ShieldCheck size={13} className="mx-1 inline -mt-0.5 text-emerald-600" />} rủ bạn cùng đề xuất CapNong mở chiến dịch
          {inv.distanceKm != null && <span className="text-[#7e8779]"> · cách vườn bạn ~{inv.distanceKm} km</span>}
        </p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MEMBER[inv.status].tone}`}>{MEMBER[inv.status].label}</span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_220px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {p.categoryName && <span className="rounded-full bg-[#f4f7f1] px-2.5 py-0.5 text-[11px] font-bold text-[#4a7c2f]">{p.categoryName}</span>}
            <span className="font-mono text-[11px] text-[#9aa294]">{p.code}</span>
          </div>
          <h4 className="text-xl font-black leading-tight text-[#1c2216]">Giải cứu {p.productName}</h4>
          {p.story && <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-[#3d4537]">{p.story}</p>}
          {inv.message && <p className="rounded-2xl bg-[#f6faf2] px-3 py-2 text-sm italic text-[#2b5619]">“{inv.message}”</p>}
          <dl className="grid grid-cols-2 gap-2">
            <InfoTile icon={CalendarDays} label="Thu hoạch" value={fmtRange(p.harvestFrom, p.harvestTo)} />
            <InfoTile icon={CalendarRange} label="Mở bán chiến dịch" value={p.proposedOpenDate ? fmtRange(p.proposedOpenDate, p.proposedCloseDate) : '—'} />
            <InfoTile icon={Tag} label="Giá mong muốn" value={p.desiredPricePerKg != null ? `${formatVnd(p.desiredPricePerKg)}/kg` : '—'} />
            <InfoTile icon={Timer} label="Độ bền sau chốt" value={SHELF.find((s) => s.id === p.shelfLifeTier)?.label ?? '—'} />
          </dl>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5d6657]">
            <MapPin size={14} className="shrink-0 text-[#4a7c2f]" />
            <span><b className="text-[#1c2216]">{p.siteName}</b> · {p.siteAddress}</span>
            {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#326318] hover:underline"><Navigation size={12} /> Xem bản đồ</a>}
          </p>
        </div>
        <div className="space-y-2">
          {p.photoUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-2">
              {p.photoUrls.slice(0, 4).map((u) => (
                <button key={u} type="button" onClick={() => setZoom(u)} className="aspect-square overflow-hidden rounded-xl">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="rounded-2xl bg-[#f7faf4] px-3 py-2.5 text-xs text-[#5d6657]">
            <p className="text-lg font-black text-[#1c2216]">{formatKg(p.totalEstimatedKg)}</p>
            dự kiến từ {p.acceptedShopCount} shop, cần tối thiểu {formatKg(p.minSubmitKg)} để gửi duyệt
          </div>
        </div>
      </div>

      {canReply && (
        <div className="flex flex-wrap items-end gap-2 border-t border-[#f1f4ed] bg-[#fafcf8] px-5 py-4">
          <label className="flex flex-col gap-1 text-xs font-bold text-[#5d6657]">
            Bạn góp khoảng bao nhiêu kg?
            <div className="relative">
              <input type="number" min={1} value={kg} onChange={(e) => setKg(e.target.value)} placeholder="vd 150" className="w-40 rounded-xl border border-[#d6dcce] bg-white px-3 py-2 pr-9 text-sm font-normal" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9aa294]">kg</span>
            </div>
          </label>
          <button type="button" disabled={!(Number(kg) > 0) || accept.isPending} onClick={() => accept.mutate()} className="inline-flex items-center gap-1.5 rounded-full bg-[#326318] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50">
            {accept.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {inv.status === 'ACCEPTED' ? 'Cập nhật số kg' : 'Tham gia'}
          </button>
          {inv.status !== 'DECLINED' && (
            <button type="button" disabled={decline.isPending} onClick={() => decline.mutate()} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-[#b3261e] hover:bg-rose-50">
              <XCircle size={14} /> Từ chối
            </button>
          )}
          {pending && hoursLeft != null && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><Clock size={12} /> Còn {hoursLeft} giờ để trả lời</span>
          )}
          <p className="w-full text-[11px] text-[#7e8779]">Số kg chỉ là dự kiến, không ràng buộc. Khi chiến dịch mở, bạn vẫn đăng ký lô hàng như mọi shop khác.</p>
        </div>
      )}
      {(accept.error || decline.error) && <p className="px-5 pb-3 text-sm font-semibold text-[#b3261e]">{getErrorMessage(accept.error || decline.error, 'Chưa trả lời được.')}</p>}
      {zoom && createPortal(
        <button type="button" aria-label="Đóng ảnh" onClick={() => setZoom(null)} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-6">
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-2xl" />
        </button>,
        document.body,
      )}
    </article>
  )
}

/* ─────────────────────────── Form đề xuất ─────────────────────────── */

function ProposalForm({ p, initialErrors, onClose, onSaved }: {
  p: CampaignProposal | null
  initialErrors?: FieldErrors
  onClose: () => void
  onSaved: (p: CampaignProposal, created: boolean) => void
}) {
  // Danh mục thật trong DB (bảng categories). Không dùng danh mục mẫu vì id mẫu không lưu được
  const categories = useQuery({ queryKey: ['categories', 'server'], queryFn: () => categoryService.getAllFromServer(), staleTime: 5 * 60 * 1000 })
  const myKg = p?.members.find((m) => m.role === 'INITIATOR')?.estimatedKg
  const [f, setF] = useState({
    categoryId: p?.categoryId ? String(p.categoryId) : '',
    productName: p?.productName ?? '',
    story: p?.story ?? '',
    estimatedKg: myKg != null ? String(myKg) : '',
    harvestFrom: p?.harvestFrom ?? isoIn(MIN_LEAD_DAYS + 2),
    harvestTo: p?.harvestTo ?? isoIn(MIN_LEAD_DAYS + 6),
    openDate: p?.proposedOpenDate ?? isoIn(MIN_LEAD_DAYS + 7),
    closeDate: p?.proposedCloseDate ?? isoIn(MIN_LEAD_DAYS + 10),
    shelf: (p?.shelfLifeTier ?? 'DAYS_3_4') as ShelfLifeTier,
    desired: p?.desiredPricePerKg != null ? String(p.desiredPricePerKg) : '',
    market: p?.marketPricePerKg != null ? String(p.marketPricePerKg) : '',
    siteName: p?.siteName ?? '',
  })
  const [photos, setPhotos] = useState<string[]>(p?.photoUrls ?? [])
  const [address, setAddress] = useState<AddressValue>(
    p?.siteAddress ? { ...EMPTY_ADDRESS, detail: p.siteAddress, lat: p.siteLatitude ?? undefined, lng: p.siteLongitude ?? undefined } : EMPTY_ADDRESS,
  )
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useEscape(onClose)
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const body: CampaignProposalRequest = {
        categoryId: f.categoryId ? Number(f.categoryId) : null,
        productName: f.productName,
        photoUrls: photos,
        story: f.story,
        estimatedKg: f.estimatedKg ? Number(f.estimatedKg) : null,
        harvestFrom: f.harvestFrom || null,
        harvestTo: f.harvestTo || null,
        proposedOpenDate: f.openDate || null,
        proposedCloseDate: f.closeDate || null,
        shelfLifeTier: f.shelf,
        desiredPricePerKg: f.desired ? Number(f.desired) : null,
        marketPricePerKg: f.market ? Number(f.market) : null,
        siteName: f.siteName,
        siteAddress: composeAddress(address),
        siteLatitude: address.lat ?? null,
        siteLongitude: address.lng ?? null,
      }
      return p ? campaignProposalService.update(p.proposalId, body) : campaignProposalService.create(body)
    },
    onSuccess: (saved) => onSaved(saved, !p),
  })

  // Kiểm tra trước, báo lỗi ngay dưới từng ô (cùng luật BE dùng khi gửi duyệt)
  const minHarvest = isoIn(MIN_LEAD_DAYS)
  const tomorrow = isoIn(1)
  const check: FieldErrors = {}
  if (!f.categoryId) check.categoryId = 'Chọn danh mục'
  if (!f.productName.trim()) check.productName = 'Nhập tên nông sản'
  if (!f.story.trim()) check.story = 'Kể ngắn vì sao cần giải cứu'
  if (photos.length === 0) check.photoUrls = 'Thêm ít nhất 1 ảnh'
  if (!f.harvestFrom) check.harvestFrom = 'Chọn ngày bắt đầu thu hoạch'
  else if (f.harvestFrom < minHarvest) check.harvestFrom = `Phải từ ${fmtDate(minHarvest)} (cách hôm nay ít nhất ${MIN_LEAD_DAYS} ngày)`
  if (!f.harvestTo) check.harvestTo = 'Chọn ngày thu hoạch xong'
  else if (f.harvestFrom && f.harvestTo < f.harvestFrom) check.harvestTo = 'Không được trước ngày bắt đầu thu hoạch'
  if (!f.openDate) check.proposedOpenDate = 'Chọn ngày mở chiến dịch'
  else if (f.openDate < tomorrow) check.proposedOpenDate = 'Ngày mở phải từ ngày mai trở đi'
  else if (f.harvestTo && f.openDate <= f.harvestTo) check.proposedOpenDate = `Phải sau ngày thu hoạch xong (${fmtDate(f.harvestTo)})`
  if (!f.closeDate) check.proposedCloseDate = 'Chọn ngày kết thúc chiến dịch'
  else if (f.openDate && f.closeDate <= f.openDate) check.proposedCloseDate = 'Phải sau ngày mở chiến dịch'
  else if (f.harvestTo && f.harvestTo > f.closeDate) check.proposedCloseDate = 'Không được trước ngày thu hoạch xong'
  if (!(Number(f.desired) > 0)) check.desiredPricePerKg = 'Nhập giá mong muốn'
  if (!f.siteName.trim()) check.siteName = 'Nhập tên điểm tập kết'
  if (address.lat == null || address.lng == null || !composeAddress(address)) check.site = 'Chọn địa chỉ và ghim điểm tập kết trên bản đồ'
  const [tried, setTried] = useState(!!initialErrors && Object.keys(initialErrors).length > 0)
  const serverErrors = fieldErrorsOf(save.error)
  // Lỗi BE (vd danh mục không còn) luôn hiện; thiếu thông tin chỉ hiện sau lần bấm lưu đầu tiên
  const errorOf = (k: FieldKey) => serverErrors[k] ?? (tried ? check[k] : undefined)
  const missing = Object.keys(check).length
  const shelfMax = SHELF.find((s) => s.id === f.shelf)?.max ?? 4
  const freshUntil = f.closeDate ? fmtDate(isoFrom(f.closeDate, shelfMax)) : null

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files).slice(0, 5 - photos.length)) {
        const url = (await uploadService.uploadImage(file, 'campaigns')).result?.url
        if (url) setPhotos((prev) => [...prev, url].slice(0, 5))
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Dialog title={p ? `Sửa đề xuất ${p.code}` : 'Đề xuất mở chiến dịch giải cứu'} onClose={onClose}>
      <form
        className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          // Còn ô thiếu: giữ form mở, cuộn tới ô lỗi đầu tiên; muốn lưu dở thì bấm "Vẫn lưu nháp"
          if (missing > 0) {
            requestAnimationFrame(() => e.currentTarget.querySelector('[data-field-error]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
            return
          }
          save.mutate()
        }}
      >
        <p className="rounded-2xl bg-[#f6faf2] px-4 py-3 text-xs text-[#2b5619] sm:col-span-2">
          Có thể lưu nháp khi chưa đủ thông tin. Muốn gửi duyệt cần đủ ảnh, câu chuyện, ngày thu hoạch (từ {fmtDate(minHarvest)}), giá mong muốn và điểm tập kết trên bản đồ.
        </p>
        <CategoryPicker
          list={categories.data}
          loading={categories.isPending}
          failed={categories.isError}
          value={f.categoryId}
          onChange={set('categoryId')}
          error={errorOf('categoryId')}
        />
        <Field label="Nông sản cần giải cứu" error={errorOf('productName')}>
          <input value={f.productName} onChange={(e) => set('productName')(e.target.value)} placeholder="vd Thanh long ruột đỏ" className={inputCls} />
        </Field>
        <Field label="Câu chuyện (vì sao cần giải cứu)" wide error={errorOf('story')}>
          <textarea value={f.story} onChange={(e) => set('story')(e.target.value)} rows={4} placeholder="Thương lái bỏ, giá rớt còn 3.000đ/kg, vườn sắp chín rộ…" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-bold text-[#5d6657]">Ảnh vườn / nông sản (1 – 5 ảnh)</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((u) => (
              <div key={u} className="relative">
                <img src={u} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <button type="button" aria-label="Xoá ảnh" onClick={() => setPhotos((s) => s.filter((x) => x !== u))} className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 shadow">
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#b9cfa8] text-[11px] font-bold text-[#4a7c2f]">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />} Thêm ảnh
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </div>
          {errorOf('photoUrls') && <p data-field-error className="mt-1 text-xs font-semibold text-[#b3261e]">{errorOf('photoUrls')}</p>}
        </div>
        <Field label="Vườn bạn dư khoảng (kg)">
          <input type="number" min={0} value={f.estimatedKg} onChange={(e) => set('estimatedKg')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Độ bền sau khi kết thúc chiến dịch" error={errorOf('shelfLifeTier')}
          hint={freshUntil ? `Hàng còn tươi tới khoảng ${freshUntil}` : undefined}>
          <select value={f.shelf} onChange={(e) => set('shelf')(e.target.value)} className={inputCls}>
            {SHELF.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Thu hoạch từ ngày" error={errorOf('harvestFrom')}>
          <input type="date" min={minHarvest} value={f.harvestFrom} onChange={(e) => set('harvestFrom')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Đến ngày" error={errorOf('harvestTo')}>
          <input type="date" min={f.harvestFrom || minHarvest} value={f.harvestTo} onChange={(e) => set('harvestTo')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Đề xuất ngày mở chiến dịch" error={errorOf('proposedOpenDate')} hint="Ngày bắt đầu nhận đặt trước, sau ngày thu hoạch xong">
          <input type="date" min={f.harvestTo ? isoFrom(f.harvestTo, 1) : tomorrow} value={f.openDate} onChange={(e) => set('openDate')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Đề xuất ngày kết thúc chiến dịch" error={errorOf('proposedCloseDate')} hint="Sau ngày mở chiến dịch">
          <input type="date" min={f.openDate ? isoFrom(f.openDate, 1) : tomorrow} value={f.closeDate} onChange={(e) => set('closeDate')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Giá mong muốn (đ/kg)" error={errorOf('desiredPricePerKg')}>
          <input type="number" min={0} value={f.desired} onChange={(e) => set('desired')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Giá thương lái đang trả (đ/kg)">
          <input type="number" min={0} value={f.market} onChange={(e) => set('market')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tên điểm tập kết dự kiến" wide error={errorOf('siteName')}>
          <input value={f.siteName} onChange={(e) => set('siteName')(e.target.value)} placeholder="vd Sân HTX Hàm Thuận Nam" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-bold text-[#5d6657]">Địa chỉ điểm tập kết (ghim trên bản đồ để tìm shop lân cận)</p>
          <AddressPicker value={address} onChange={setAddress} />
          {errorOf('site') && <p data-field-error className="mt-1 text-xs font-semibold text-[#b3261e]">{errorOf('site')}</p>}
        </div>
        {save.isError && Object.keys(serverErrors).length === 0 && (
          <p className="text-sm font-semibold text-[#b3261e] sm:col-span-2">{getErrorMessage(save.error, 'Chưa lưu được đề xuất.')}</p>
        )}
        {tried && missing > 0 && Object.keys(serverErrors).length === 0 && (
          <p className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs text-amber-900 sm:col-span-2">
            Còn {missing} ô cần bổ sung (đánh dấu đỏ ở trên). Đủ thông tin mới gửi duyệt được; muốn lưu dở thì{' '}
            <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="font-bold text-[#326318] underline">
              vẫn lưu nháp
            </button>.
          </p>
        )}
        <button type="submit" disabled={save.isPending || uploading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#326318] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
          {save.isPending && <Loader2 size={16} className="animate-spin" />} {p ? 'Lưu thay đổi' : 'Lưu và qua bước rủ shop'}
        </button>
      </form>
    </Dialog>
  )
}

/* ─────────────────────────── Tìm & mời shop lân cận ─────────────────────────── */

function NearbyDialog({ p, onClose, onInvited, onSubmitted }: { p: CampaignProposal; onClose: () => void; onInvited: (n: number) => void; onSubmitted: () => void }) {
  const [radius, setRadius] = useState(10)
  const [sameCategory, setSameCategory] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [message, setMessage] = useState(`Mình đang đề xuất CapNong mở chiến dịch giải cứu ${p.productName ?? ''}. Vườn bạn có hàng dư thì cùng góp nhé!`)
  useEscape(onClose)
  const q = useQuery({
    queryKey: ['campaign-proposals', p.proposalId, 'nearby', radius, sameCategory],
    queryFn: () => campaignProposalService.nearbyShops(p.proposalId, radius, sameCategory),
  })
  const invite = useMutation({ mutationFn: () => campaignProposalService.invite(p.proposalId, picked, message), onSuccess: () => onInvited(picked.length) })
  // Không bắt buộc rủ shop: đủ số kg tối thiểu thì gửi CapNong duyệt ngay từ bước này
  const submit = useMutation({ mutationFn: () => campaignProposalService.submit(p.proposalId), onSuccess: onSubmitted })
  const minKg = Number(p.minSubmitKg || 200)
  const enough = Number(p.totalEstimatedKg) >= minKg
  const toggle = (id: number) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const rows: NearbyShop[] = q.data ?? []

  return (
    <Dialog title="Rủ shop lân cận cùng góp hàng" onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f4ed] px-5 py-3">
        <span className="text-xs font-bold text-[#5d6657]">Bán kính quanh {p.siteName}:</span>
        {RADII.map((r) => (
          <button key={r} type="button" onClick={() => setRadius(r)} className={`rounded-full px-3 py-1 text-xs font-bold ${radius === r ? 'bg-[#326318] text-white' : 'bg-[#f4f7f1] text-[#326318]'}`}>
            {r} km
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs font-bold text-[#5d6657]">
          <input type="checkbox" checked={sameCategory} onChange={(e) => setSameCategory(e.target.checked)} className="accent-[#326318]" /> Chỉ shop cùng loại
        </label>
      </div>
      <div className="min-h-[200px] flex-1 overflow-y-auto px-5 py-3">
        {q.isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-[#f4f7f1]" />
        ) : q.isError ? (
          <p className="text-sm font-semibold text-[#b3261e]">{getErrorMessage(q.error, 'Chưa tải được shop lân cận.')}</p>
        ) : !rows.length ? (
          <p className="py-10 text-center text-sm text-[#7e8779]">Chưa có shop đã xác minh nào trong {radius} km. Thử mở rộng bán kính.</p>
        ) : (
          <ul className="divide-y divide-[#f1f4ed]">
            {rows.map((s) => {
              const already = s.inviteStatus && s.inviteStatus !== 'REMOVED'
              return (
                <li key={s.shopId}>
                  <label className={`flex items-center gap-3 py-3 ${already ? 'opacity-60' : 'cursor-pointer'}`}>
                    <input type="checkbox" disabled={!!already} checked={picked.includes(s.shopId)} onChange={() => toggle(s.shopId)} className="h-4 w-4 accent-[#326318]" />
                    <img src={s.logoUrl || logoIcon} alt="" className="h-10 w-10 rounded-full border border-[#e8ece3] object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-bold text-[#1c2216]">
                        {s.shopName} <ShieldCheck size={13} className="text-emerald-600" aria-label="Đã xác minh" />
                        {s.sameCategory && <span className="rounded-full bg-[#e7f3de] px-1.5 text-[10px] font-bold text-[#2b5619]">Cùng loại</span>}
                      </p>
                      <p className="truncate text-[11px] text-[#7e8779]">
                        {s.ratingAverage != null && `★ ${s.ratingAverage.toFixed(1)} · `}
                        {s.categories.length ? s.categories.join(', ') : 'Chưa đăng sản phẩm'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black tabular-nums text-[#326318]">~{s.distanceKm} km</span>
                    {already && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${MEMBER[s.inviteStatus!].tone}`}>{MEMBER[s.inviteStatus!].label}</span>}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="space-y-2 border-t border-[#f1f4ed] bg-[#fafcf9] px-5 py-4">
        <textarea value={message} maxLength={300} onChange={(e) => setMessage(e.target.value)} rows={2} className={inputCls} aria-label="Lời nhắn" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-[#7e8779]">Lời mời hết hạn sau 72 giờ. Tối đa 20 shop mỗi đơn, 30 lời mời mỗi ngày.</p>
          <button type="button" disabled={!picked.length || invite.isPending} onClick={() => invite.mutate()} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#326318] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {invite.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Mời {picked.length || ''} shop
          </button>
        </div>
        {invite.isError && <p className="text-sm font-semibold text-[#b3261e]">{getErrorMessage(invite.error, 'Chưa gửi được lời mời.')}</p>}
        <div className="flex flex-col gap-2 border-t border-dashed border-[#e3ecd9] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#5d6657]">
            Không cần rủ shop nào? Gửi đề xuất cho CapNong duyệt luôn.
            {!enough && <> Hiện có <b>{formatKg(Number(p.totalEstimatedKg))}</b>, cần ít nhất <b>{formatKg(minKg)}</b>.</>}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-3 py-2 text-xs font-bold text-[#5d6657] hover:bg-[#f4f7f1]">Để sau</button>
            <button
              type="button"
              disabled={!enough || submit.isPending}
              onClick={() => submit.mutate()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#326318] bg-white px-4 py-2 text-xs font-bold text-[#326318] hover:bg-[#eef6e7] disabled:opacity-50"
            >
              {submit.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Xác nhận gửi CapNong duyệt
            </button>
          </div>
        </div>
        {submit.isError && <p className="text-sm font-semibold text-[#b3261e]">{getErrorMessage(submit.error, 'Chưa gửi được đề xuất.')}</p>}
      </div>
    </Dialog>
  )
}

/* ─────────────────────────── Ghim vị trí vườn ─────────────────────────── */

function PinDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS)
  const update = useUpdateShopProfile()
  useEscape(onClose)
  return (
    <Dialog title="Ghim vị trí vườn / kho" onClose={onClose}>
      <div className="space-y-4 overflow-y-auto p-5">
        <p className="text-xs text-[#5d6657]">Vị trí chính xác không hiện cho shop khác, họ chỉ thấy khoảng cách làm tròn.</p>
        <AddressPicker value={address} onChange={setAddress} />
        {update.isError && <p className="text-sm font-semibold text-[#b3261e]">{getErrorMessage(update.error, 'Chưa lưu được vị trí.')}</p>}
        <button
          type="button"
          disabled={address.lat == null || update.isPending}
          onClick={() => update.mutate({ shopLatitude: address.lat, shopLongitude: address.lng, address: composeAddress(address) || undefined }, { onSuccess: onSaved })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#326318] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {update.isPending && <Loader2 size={16} className="animate-spin" />} Lưu vị trí
        </button>
      </div>
    </Dialog>
  )
}

/* ─────────────────────────── Mảnh nhỏ ─────────────────────────── */

const inputCls = 'w-full rounded-xl border border-[#d6dcce] bg-white px-3 py-2 text-sm font-normal text-[#1c2216] focus:border-[#4a7c2f] focus:outline-none'

/** Chọn danh mục (dropdown) từ bảng categories trong DB */
function CategoryPicker({ list, loading, failed, value, onChange, error }: {
  list?: CategoryResponse[]
  loading: boolean
  failed: boolean
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const stale = value !== '' && !!list && !list.some((c) => String(c.categoryId) === value)
  const empty = !loading && (failed || !list?.length)
  return (
    <Field
      label="Danh mục"
      error={stale ? 'Danh mục đã chọn trước đây không còn, hãy chọn lại' : error}
      hint={empty ? (failed ? 'Chưa tải được danh mục, thử mở lại form.' : 'Hệ thống chưa có danh mục nào, admin cần thêm danh mục trước.') : undefined}
    >
      <select value={stale ? '' : value} onChange={(e) => onChange(e.target.value)} disabled={loading || empty} className={inputCls}>
        <option value="">{loading ? 'Đang tải danh mục…' : 'Chọn danh mục'}</option>
        {(list ?? []).map((c) => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
      </select>
    </Field>
  )
}

function Field({ label, wide, error, hint, children }: { label: string; wide?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs font-bold text-[#5d6657] ${wide ? 'sm:col-span-2' : ''} ${error ? '[&_input]:border-[#e46a5e] [&_select]:border-[#e46a5e] [&_textarea]:border-[#e46a5e]' : ''}`}>
      {label}
      {children}
      {error ? <span data-field-error className="font-semibold text-[#b3261e]">{error}</span> : hint ? <span className="font-medium text-[#7e8779]">{hint}</span> : null}
    </label>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-black uppercase tracking-wide text-[#5d6657]">
        {title}
        {count != null && <span className="ml-1.5 text-[#9aa394]">{count}</span>}
      </h4>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#d6dcce] bg-white px-6 py-12 text-center">
      <img src={logoIcon} alt="CapNong" className="h-12 w-12 object-contain" />
      <p className="mt-3 max-w-md text-sm text-[#5d6657]">{text}</p>
    </div>
  )
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#f1f4ed] px-5 py-4">
          <h3 className="text-lg font-black text-[#1c2216]">{title}</h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-[#f4f7f1]"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function useEscape(onClose: () => void) {
  const ref = useRef(onClose)
  ref.current = onClose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ref.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

