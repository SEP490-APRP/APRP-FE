import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock,
  ImagePlus,
  Loader2,
  MapPin,
  Megaphone,
  Pencil,
  Phone,
  Send,
  ShieldCheck,
  Star,
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
import { useCategories } from '@/features/product/hooks/useCategoryQueries'
import { useShopProfile, useUpdateShopProfile } from '@/features/shop/hooks/useShopProfile'
import { AddressPicker, composeAddress, EMPTY_ADDRESS, type AddressValue } from '@/components/common/AddressPicker'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'
import logoIcon from '@/assets/logo-icon.png'

const SHELF: { id: ShelfLifeTier; label: string }[] = [
  { id: 'DAYS_2_3', label: 'Mức 1 · 2 – 3 ngày (rau lá, quả mềm)' },
  { id: 'DAYS_3_4', label: 'Mức 2 · 3 – 4 ngày (cà chua, dưa leo, bắp)' },
  { id: 'DAYS_5_6', label: 'Mức 3 · 5 – 6 ngày (củ, quả vỏ dày)' },
]
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
          onClick={() => setEditing('new')}
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
              onEdit={() => setEditing(p)}
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
          onClose={() => setEditing(null)}
          onSaved={(saved, created) => {
            setEditing(null)
            refresh()
            onInfo?.(created ? 'Đã lưu nháp. Giờ bạn có thể rủ shop lân cận cùng góp hàng.' : 'Đã lưu thay đổi.')
            if (created && saved.siteLatitude != null) setInviting(saved)
          }}
        />
      )}
      {inviting && <NearbyDialog p={inviting} onClose={() => setInviting(null)} onInvited={(n) => { setInviting(null); refresh(); onInfo?.(`Đã gửi lời mời tới ${n} shop.`) }} />}
      {pinning && <PinDialog onClose={() => setPinning(false)} onSaved={() => { setPinning(false); onInfo?.('Đã ghim vị trí vườn.') }} />}
    </div>
  )
}

/* ─────────────────────────── Thẻ đơn của tôi ─────────────────────────── */

function ProposalCard({ p, onEdit, onInvite, onChanged }: {
  p: CampaignProposal
  onEdit: () => void
  onInvite: () => void
  onChanged: (msg?: string) => void
}) {
  const st = STATUS[p.status]
  const editable = p.status === 'DRAFT' || p.status === 'NEEDS_CHANGES'
  const isOpen = editable || p.status === 'SUBMITTED'
  const pct = Math.min(100, (Number(p.totalEstimatedKg) / Number(p.minSubmitKg || 200)) * 100)
  const enough = Number(p.totalEstimatedKg) >= Number(p.minSubmitKg || 200)
  const submit = useMutation({ mutationFn: () => campaignProposalService.submit(p.proposalId), onSuccess: () => onChanged('Đã gửi đề xuất. CapNong sẽ xem xét và phản hồi.') })
  const withdraw = useMutation({ mutationFn: () => campaignProposalService.withdraw(p.proposalId), onSuccess: () => onChanged('Đã rút đơn đề xuất.') })
  const remove = useMutation({ mutationFn: (shopId: number) => campaignProposalService.removeMember(p.proposalId, shopId), onSuccess: () => onChanged() })
  const err = submit.error || withdraw.error || remove.error

  return (
    <article className="overflow-hidden rounded-3xl border border-[#e8ece3] bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <img src={p.photoUrls[0] || logoIcon} alt="" className="h-24 w-full shrink-0 rounded-2xl bg-[#f7faf4] object-cover sm:w-32" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.tone}`}>{st.label}</span>
            <span className="font-mono text-xs text-[#7e8779]">{p.code}</span>
          </div>
          <h4 className="text-lg font-black text-[#1c2216]">{p.productName || 'Chưa đặt tên nông sản'}</h4>
          <p className="text-xs text-[#5d6657]">
            {p.categoryName || 'Chưa chọn danh mục'} · thu hoạch {fmtDate(p.harvestFrom)} – {fmtDate(p.harvestTo)}
            {p.desiredPricePerKg != null && ` · mong muốn ${formatVnd(p.desiredPricePerKg)}/kg`}
          </p>
          <p className="flex items-start gap-1.5 text-xs text-[#5d6657]">
            <MapPin size={13} className="mt-0.5 shrink-0 text-[#4a7c2f]" />
            {p.siteName ? `${p.siteName} · ${p.siteAddress ?? ''}` : 'Chưa chọn điểm tập kết'}
          </p>
        </div>
      </div>

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

      <div className="border-t border-[#f1f4ed] px-5 py-4">
        <div className="flex items-baseline justify-between text-xs font-bold text-[#5d6657]">
          <span className="flex items-center gap-1.5"><Users size={14} /> {p.acceptedShopCount} shop tham gia · {p.pendingInviteCount} đang chờ</span>
          <span className={enough ? 'text-emerald-700' : 'text-[#7e8779]'}>
            {formatKg(p.totalEstimatedKg)} / tối thiểu {formatKg(p.minSubmitKg)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2ea]">
          <div className={`h-full rounded-full ${enough ? 'bg-emerald-600' : 'bg-[#9ed67d]'}`} style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-3 divide-y divide-[#f1f4ed]">
          {p.members.map((m) => (
            <MemberRow key={m.memberId} m={m} onRemove={editable && m.role === 'INVITED' && m.status !== 'REMOVED' ? () => remove.mutate(m.shopId) : undefined} />
          ))}
        </ul>
      </div>

      {err && <p className="mx-5 mb-3 text-sm font-semibold text-[#b3261e]">{getErrorMessage(err, 'Thao tác chưa thành công.')}</p>}
      {isOpen && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#f1f4ed] bg-[#fafcf9] px-5 py-3">
          <button type="button" onClick={() => withdraw.mutate()} disabled={withdraw.isPending} className="mr-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-[#b3261e] hover:bg-rose-50">
            <Undo2 size={14} /> Rút đơn
          </button>
          {editable && (
            <>
              <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full border border-[#d6e6c8] bg-white px-4 py-2 text-xs font-bold text-[#326318] hover:bg-[#eef6e7]">
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
                title={!enough ? `Cần tổng ít nhất ${formatKg(p.minSubmitKg)} dự kiến` : undefined}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#326318] px-4 py-2 text-xs font-bold text-white hover:bg-[#254d12] disabled:opacity-50"
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

function MemberRow({ m, onRemove }: { m: ProposalMember; onRemove?: () => void }) {
  const st = MEMBER[m.status]
  return (
    <li className="flex items-center gap-3 py-2.5">
      <img src={m.logoUrl || logoIcon} alt="" className="h-9 w-9 shrink-0 rounded-full border border-[#e8ece3] bg-white object-cover" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-bold text-[#1c2216]">
          {m.shopName}
          {m.role === 'INITIATOR' && <span className="rounded-full bg-[#326318] px-1.5 text-[10px] font-bold text-white">Khởi xướng</span>}
          {m.verified && <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="Đã xác minh" />}
        </p>
        <p className="text-[11px] text-[#7e8779]">
          {m.distanceKm != null && `~${m.distanceKm} km · `}
          {m.ratingAverage != null && <><Star size={10} className="inline -mt-0.5 fill-amber-400 text-amber-400" /> {m.ratingAverage.toFixed(1)} · </>}
          {m.phone && <><Phone size={10} className="inline -mt-0.5" /> {m.phone}</>}
        </p>
      </div>
      <span className="text-sm font-black tabular-nums text-[#1c2216]">{m.estimatedKg != null ? formatKg(m.estimatedKg) : ''}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.tone}`}>{st.label}</span>
      {onRemove && (
        <button type="button" aria-label={`Bỏ ${m.shopName}`} onClick={onRemove} className="rounded-full p-1 text-[#7e8779] hover:bg-rose-50 hover:text-[#b3261e]">
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
  const accept = useMutation({ mutationFn: () => campaignProposalService.acceptInvite(inv.memberId, Number(kg)), onSuccess: () => onDone('Đã nhận lời tham gia đề xuất.') })
  const decline = useMutation({ mutationFn: () => campaignProposalService.declineInvite(inv.memberId), onSuccess: () => onDone('Đã từ chối lời mời.') })
  const canReply = (p.status === 'DRAFT' || p.status === 'NEEDS_CHANGES') && (inv.status === 'PENDING' || inv.status === 'ACCEPTED' || inv.status === 'DECLINED')
  const hoursLeft = inv.expiresAt ? Math.max(0, Math.round((new Date(inv.expiresAt).getTime() - Date.now()) / 3600000)) : null
  return (
    <article className="rounded-3xl border border-[#e8ece3] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <img src={p.initiatorLogoUrl || logoIcon} alt="" className="h-11 w-11 shrink-0 rounded-full border border-[#e8ece3] object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#5d6657]">
            <b className="text-[#1c2216]">{p.initiatorShopName}</b> rủ bạn cùng đề xuất giải cứu
          </p>
          <h4 className="text-base font-black text-[#1c2216]">{p.productName}</h4>
          <p className="text-xs text-[#7e8779]">
            Thu hoạch {fmtDate(p.harvestFrom)} – {fmtDate(p.harvestTo)} · tập kết tại {p.siteName}
            {inv.distanceKm != null && ` (~${inv.distanceKm} km từ vườn bạn)`}
          </p>
          {inv.message && <p className="mt-2 rounded-xl bg-[#f6faf2] px-3 py-2 text-sm italic text-[#2b5619]">“{inv.message}”</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${MEMBER[inv.status].tone}`}>{MEMBER[inv.status].label}</span>
      </div>
      <p className="mt-3 text-xs text-[#7e8779]">
        Tổng dự kiến hiện tại {formatKg(p.totalEstimatedKg)} từ {p.acceptedShopCount} shop. Số kg chỉ là dự kiến, không ràng buộc. Khi chiến dịch mở bạn vẫn
        đăng ký như mọi shop khác.
      </p>
      {canReply && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-bold text-[#5d6657]">
            Bạn góp khoảng bao nhiêu kg?
            <input type="number" min={1} value={kg} onChange={(e) => setKg(e.target.value)} placeholder="vd 150" className="w-36 rounded-xl border border-[#d6dcce] px-3 py-2 text-sm font-normal" />
          </label>
          <button type="button" disabled={!(Number(kg) > 0) || accept.isPending} onClick={() => accept.mutate()} className="inline-flex items-center gap-1.5 rounded-full bg-[#326318] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {accept.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {inv.status === 'ACCEPTED' ? 'Cập nhật số kg' : 'Tham gia'}
          </button>
          {inv.status !== 'DECLINED' && (
            <button type="button" disabled={decline.isPending} onClick={() => decline.mutate()} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-[#b3261e] hover:bg-rose-50">
              <XCircle size={14} /> Từ chối
            </button>
          )}
          {inv.status === 'PENDING' && hoursLeft != null && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><Clock size={12} /> Còn {hoursLeft} giờ để trả lời</span>
          )}
        </div>
      )}
      {(accept.error || decline.error) && <p className="mt-2 text-sm font-semibold text-[#b3261e]">{getErrorMessage(accept.error || decline.error, 'Chưa trả lời được.')}</p>}
    </article>
  )
}

/* ─────────────────────────── Form đề xuất ─────────────────────────── */

function ProposalForm({ p, onClose, onSaved }: { p: CampaignProposal | null; onClose: () => void; onSaved: (p: CampaignProposal, created: boolean) => void }) {
  const categories = useCategories()
  const myKg = p?.members.find((m) => m.role === 'INITIATOR')?.estimatedKg
  const [f, setF] = useState({
    categoryId: p?.categoryId ? String(p.categoryId) : '',
    productName: p?.productName ?? '',
    story: p?.story ?? '',
    estimatedKg: myKg != null ? String(myKg) : '',
    harvestFrom: p?.harvestFrom ?? isoIn(MIN_LEAD_DAYS + 2),
    harvestTo: p?.harvestTo ?? isoIn(MIN_LEAD_DAYS + 6),
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

  const minHarvest = isoIn(MIN_LEAD_DAYS)
  return (
    <Dialog title={p ? `Sửa đề xuất ${p.code}` : 'Đề xuất mở chiến dịch giải cứu'} onClose={onClose}>
      <form className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
        <p className="rounded-2xl bg-[#f6faf2] px-4 py-3 text-xs text-[#2b5619] sm:col-span-2">
          Có thể lưu nháp khi chưa đủ thông tin. Muốn gửi duyệt cần đủ ảnh, câu chuyện, ngày thu hoạch (từ {fmtDate(minHarvest)}), giá mong muốn và điểm tập kết trên bản đồ.
        </p>
        <Field label="Danh mục">
          <select value={f.categoryId} onChange={(e) => set('categoryId')(e.target.value)} className={inputCls}>
            <option value="">Chọn danh mục</option>
            {(categories.data ?? []).map((c) => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Nông sản cần giải cứu">
          <input value={f.productName} onChange={(e) => set('productName')(e.target.value)} placeholder="vd Thanh long ruột đỏ" className={inputCls} />
        </Field>
        <Field label="Câu chuyện (vì sao cần giải cứu)" wide>
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
        </div>
        <Field label="Vườn bạn dư khoảng (kg)">
          <input type="number" min={0} value={f.estimatedKg} onChange={(e) => set('estimatedKg')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Độ bền sau thu hoạch">
          <select value={f.shelf} onChange={(e) => set('shelf')(e.target.value)} className={inputCls}>
            {SHELF.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Thu hoạch từ ngày">
          <input type="date" min={minHarvest} value={f.harvestFrom} onChange={(e) => set('harvestFrom')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Đến ngày">
          <input type="date" min={f.harvestFrom || minHarvest} value={f.harvestTo} onChange={(e) => set('harvestTo')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Giá mong muốn (đ/kg)">
          <input type="number" min={0} value={f.desired} onChange={(e) => set('desired')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Giá thương lái đang trả (đ/kg)">
          <input type="number" min={0} value={f.market} onChange={(e) => set('market')(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tên điểm tập kết dự kiến" wide>
          <input value={f.siteName} onChange={(e) => set('siteName')(e.target.value)} placeholder="vd Sân HTX Hàm Thuận Nam" className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-bold text-[#5d6657]">Địa chỉ điểm tập kết (ghim trên bản đồ để tìm shop lân cận)</p>
          <AddressPicker value={address} onChange={setAddress} />
        </div>
        {save.isError && <p className="text-sm font-semibold text-[#b3261e] sm:col-span-2">{getErrorMessage(save.error, 'Chưa lưu được đề xuất.')}</p>}
        <button type="submit" disabled={save.isPending || uploading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#326318] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
          {save.isPending && <Loader2 size={16} className="animate-spin" />} {p ? 'Lưu thay đổi' : 'Lưu nháp'}
        </button>
      </form>
    </Dialog>
  )
}

/* ─────────────────────────── Tìm & mời shop lân cận ─────────────────────────── */

function NearbyDialog({ p, onClose, onInvited }: { p: CampaignProposal; onClose: () => void; onInvited: (n: number) => void }) {
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

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs font-bold text-[#5d6657] ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      {children}
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

