import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/stores'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeDollarSign, CalendarDays, Combine, MessageCircle, Eye, Loader2, MapPin, MessageSquareWarning, Quote, ShieldCheck, Store, Users, X, XCircle, type LucideIcon } from 'lucide-react'
import { campaignProposalService, type CampaignProposal, type ProposalMember } from '@/services'
import type { AddressValue } from '@/components/common/AddressPicker'
import { EMPTY_ADDRESS } from '@/components/common/AddressPicker'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import { getErrorMessage } from '@/utils'
import logoIcon from '@/assets/logo-icon.png'

/** Dữ liệu điền sẵn cho form tạo chiến dịch khi duyệt / gộp đề xuất */
export interface ApprovePrefill {
  proposalIds: number[]
  fields: Partial<Record<'title' | 'product' | 'description' | 'season' | 'target' | 'price' | 'site' | 'farmCutoff' | 'cutoff' | 'start' | 'end', string>>
  address: AddressValue
  categoryId?: number
  coverImageUrl?: string
  /** Đơn gốc của shop, hiện ở popup bên trái để admin đối soát khi soạn bài đăng */
  proposals?: CampaignProposal[]
}

const STATUS: Record<CampaignProposal['status'], { label: string; tone: string }> = {
  DRAFT: { label: 'Nháp', tone: 'bg-gray-100 text-gray-600' },
  SUBMITTED: { label: 'Chờ duyệt', tone: 'bg-amber-100 text-amber-800' },
  NEEDS_CHANGES: { label: 'Đã trả về', tone: 'bg-orange-100 text-orange-800' },
  APPROVED: { label: 'Đã duyệt', tone: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Từ chối', tone: 'bg-rose-100 text-rose-700' },
  WITHDRAWN: { label: 'Shop đã rút', tone: 'bg-gray-100 text-gray-500' },
}
// Trạng thái từng shop trong đơn (BE trả mã tiếng Anh)
const MEMBER_STATUS: Record<ProposalMember['status'], { label: string; tone: string }> = {
  PENDING: { label: 'Chờ trả lời', tone: 'bg-amber-100 text-amber-800' },
  ACCEPTED: { label: 'Đã tham gia', tone: 'bg-emerald-100 text-emerald-800' },
  DECLINED: { label: 'Từ chối', tone: 'bg-rose-100 text-rose-700' },
  EXPIRED: { label: 'Hết hạn', tone: 'bg-gray-100 text-gray-500' },
  REMOVED: { label: 'Đã bỏ khỏi đơn', tone: 'bg-gray-100 text-gray-500' },
}
const FILTERS = [
  { id: 'SUBMITTED', label: 'Chờ duyệt' },
  { id: 'NEEDS_CHANGES', label: 'Đã trả về' },
  { id: 'APPROVED', label: 'Đã duyệt' },
  { id: 'REJECTED', label: 'Từ chối' },
  { id: '', label: 'Tất cả' },
]
const MERGE_WARN_KM = 30
const fmtDate = (v?: string | null) => (v ? new Date(v.length === 10 ? v + 'T00:00:00' : v).toLocaleDateString('vi-VN') : '—')
const escapeHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function haversine(a: CampaignProposal, b: CampaignProposal) {
  if (a.siteLatitude == null || b.siteLatitude == null || a.siteLongitude == null || b.siteLongitude == null) return null
  const r = (x: number) => (x * Math.PI) / 180
  const dLat = r(b.siteLatitude - a.siteLatitude)
  const dLng = r(b.siteLongitude - a.siteLongitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.siteLatitude)) * Math.cos(r(b.siteLatitude)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Dựng dữ liệu form chiến dịch từ 1 hoặc nhiều đề xuất: tổng kg, giá trung bình, câu chuyện, điểm tập kết của đơn lớn nhất */
/** Ngày BE trả về có thể là 'yyyy-MM-dd', 'yyyy-MM-ddTHH:mm:ss' hoặc mảng [y, m, d]: đưa về 'yyyy-MM-dd' */
function isoDay(v: unknown): string | undefined {
  if (Array.isArray(v) && v.length >= 3) return `${v[0]}-${String(v[1]).padStart(2, '0')}-${String(v[2]).padStart(2, '0')}`
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  return undefined
}

export function buildPrefill(list: CampaignProposal[]): ApprovePrefill {
  const main = [...list].sort((a, b) => Number(b.totalEstimatedKg) - Number(a.totalEstimatedKg))[0]
  const total = list.reduce((s, p) => s + Number(p.totalEstimatedKg || 0), 0)
  const prices = list.map((p) => Number(p.desiredPricePerKg)).filter((n) => n > 0)
  const price = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length / 100) * 100 : undefined
  const latestHarvest = list.map((p) => isoDay(p.harvestFrom)).filter(Boolean).sort()[0]
  // Ưu tiên ngày kết thúc shop đề xuất (sớm nhất trong các đơn gộp), không có thì lấy ngày thu hoạch
  const proposedClose = list.map((p) => isoDay(p.proposedCloseDate)).filter(Boolean).sort()[0]
  const openDate = list.map((p) => isoDay(p.proposedOpenDate)).filter(Boolean).sort()[0] ?? undefined
  // Chốt đơn đặt trước 1 ngày trước ngày mở chiến dịch shop đề xuất (đủ người đặt mới mở)
  const dayBefore = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    const t = new Date(Date.UTC(y, m - 1, d - 1))
    return Number.isNaN(t.getTime()) ? undefined : t.toISOString().slice(0, 10)
  }
  const cutoffDay = openDate ? dayBefore(openDate) : latestHarvest
  const cutoff = cutoffDay ? `${cutoffDay}T18:00` : undefined
  // Chốt góp hàng nhà vườn: 1 ngày trước hạn chốt đơn đặt trước
  const farmCutoffDay = cutoffDay ? dayBefore(cutoffDay) : undefined
  const farmCutoff = farmCutoffDay ? `${farmCutoffDay}T18:00` : undefined
  const story = list
    .map((p) => `<p><strong>${escapeHtml(p.initiatorShopName)}</strong> (${p.acceptedShopCount} shop · ~${Math.round(Number(p.totalEstimatedKg))} kg): ${escapeHtml(p.story ?? '')}</p>`)
    .join('')
  const product = main.productName ?? 'nông sản'
  return {
    proposalIds: list.map((p) => p.proposalId),
    fields: {
      title: `Giải cứu ${product}${main.siteName ? ` – ${main.siteName}` : ''}`,
      product: main.productName ?? '',
      description: story,
      // Ngưỡng tối thiểu = tổng kg các shop đã đồng ý góp; mục tiêu để admin tự điền
      target: String(Math.round(total)),
      price: price != null ? String(price) : '',
      site: main.siteName ?? '',
      ...(cutoff ? { cutoff } : {}),
      ...(farmCutoff ? { farmCutoff } : {}),
      ...(openDate ? { start: openDate } : {}),
      ...(proposedClose ? { end: proposedClose } : {}),
    },
    address: { ...EMPTY_ADDRESS, detail: main.siteAddress ?? '', lat: main.siteLatitude ?? undefined, lng: main.siteLongitude ?? undefined },
    categoryId: main.categoryId ?? undefined,
    coverImageUrl: main.photoUrls[0],
    proposals: list,
  }
}

/** Admin › Chiến dịch › Đề xuất từ shop: hàng chờ duyệt, chọn nhiều đơn gần nhau để gộp thành 1 chiến dịch */
export default function AdminCampaignProposals({ onApprove, onOpenCampaign }: {
  onApprove: (prefill: ApprovePrefill) => void
  onOpenCampaign: (campaignId: number) => void
}) {
  const [filter, setFilter] = useState('SUBMITTED')
  const [picked, setPicked] = useState<number[]>([])
  const [viewing, setViewing] = useState<CampaignProposal | null>(null)
  const q = useQuery({ queryKey: ['admin-campaign-proposals', filter], queryFn: () => campaignProposalService.adminList(filter || undefined) })
  const rows = q.data ?? []
  useEffect(() => setPicked([]), [filter])

  const pickedRows = rows.filter((r) => picked.includes(r.proposalId))
  const spread = useMemo(() => {
    let max = 0
    for (const a of pickedRows) for (const b of pickedRows) max = Math.max(max, haversine(a, b) ?? 0)
    return max
  }, [pickedRows])
  const toggle = (id: number) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-black uppercase text-gray-900 sm:text-3xl">Đề xuất từ shop</h2>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Shop đề xuất mở chiến dịch kèm các shop lân cận. Chọn nhiều đơn gần nhau để gộp thành 1 chiến dịch. Khi đăng lời kêu gọi, mọi shop đều đăng ký như bình thường.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc đề xuất">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${filter === f.id ? 'border-[#326318] bg-[#326318] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#9ed67d]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {picked.length > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[#cfe3bf] bg-[#f3f9ee] px-4 py-3 shadow-sm">
          <p className="text-sm font-bold text-[#2b5619]">
            Đã chọn {picked.length} đơn · {formatKg(pickedRows.reduce((s, p) => s + Number(p.totalEstimatedKg || 0), 0))}
            {picked.length > 1 && <span className="font-medium text-gray-600"> · cách nhau tối đa ~{Math.round(spread)} km</span>}
          </p>
          {spread > MERGE_WARN_KM && <span className="text-xs font-semibold text-amber-700">Các điểm khá xa nhau, cân nhắc trước khi gộp.</span>}
          <button type="button" onClick={() => onApprove(buildPrefill(pickedRows))}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#326318] px-4 py-2 text-sm font-bold text-white hover:bg-[#254d12]">
            <Combine size={16} /> {picked.length > 1 ? `Gộp ${picked.length} đơn thành 1 chiến dịch` : 'Duyệt thành chiến dịch'}
          </button>
        </div>
      )}

      {q.isPending ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      ) : q.isError ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{getErrorMessage(q.error, 'Không tải được đề xuất.')}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">Không có đề xuất nào.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((p) => {
            const st = STATUS[p.status]
            const canPick = p.status === 'SUBMITTED'
            return (
              <article key={p.proposalId} className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm ${picked.includes(p.proposalId) ? 'border-[#326318] ring-2 ring-[#9ed67d]' : 'border-gray-200'}`}>
                {canPick && (
                  <input type="checkbox" aria-label={`Chọn ${p.code}`} checked={picked.includes(p.proposalId)} onChange={() => toggle(p.proposalId)} className="mt-1 h-4 w-4 shrink-0 accent-[#326318]" />
                )}
                <img src={p.photoUrls[0] || logoIcon} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-gray-50 object-cover" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.tone}`}>{st.label}</span>
                    <span className="font-mono text-[11px] text-gray-500">{p.code}</span>
                  </div>
                  <p className="truncate font-bold text-gray-900">{p.productName} <span className="font-medium text-gray-500">· {p.categoryName}</span></p>
                  <p className="flex items-center gap-1 truncate text-xs text-gray-600"><MapPin size={12} className="shrink-0" /> {p.siteName} · {p.siteAddress}</p>
                  <p className="text-xs text-gray-600">
                    <b className="text-gray-900">{formatKg(p.totalEstimatedKg)}</b> từ {p.acceptedShopCount} shop · thu hoạch từ {fmtDate(p.harvestFrom)} đến {fmtDate(p.harvestTo)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button type="button" onClick={() => setViewing(p)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-[#326318] hover:border-[#326318]">
                      <Eye size={13} /> Xem chi tiết
                    </button>
                    {p.campaignId != null && (
                      <button type="button" onClick={() => onOpenCampaign(p.campaignId!)} className="rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                        Chiến dịch {p.campaignCode} →
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {viewing && (
        <DetailDialog
          p={viewing}
          onClose={() => setViewing(null)}
          onApprove={() => { setViewing(null); onApprove(buildPrefill([viewing])) }}
        />
      )}
    </div>
  )
}

function DetailDialog({ p, onClose, onApprove }: { p: CampaignProposal; onClose: () => void; onApprove: () => void }) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [zoom, setZoom] = useState<string | null>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (zoom ? setZoom(null) : onClose())
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, zoom])
  const done = () => { qc.invalidateQueries({ queryKey: ['admin-campaign-proposals'] }); onClose() }
  const changes = useMutation({ mutationFn: () => campaignProposalService.requestChanges(p.proposalId, note.trim()), onSuccess: done })
  const reject = useMutation({ mutationFn: () => campaignProposalService.reject(p.proposalId, note.trim()), onSuccess: done })
  // Từ chối / trả về cần lý do: bấm khi chưa ghi thì báo và đưa con trỏ vào ô ghi chú
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const [needNote, setNeedNote] = useState<'reject' | 'changes' | null>(null)
  const requireNote = (kind: 'reject' | 'changes', run: () => void) => {
    if (!note.trim()) { setNeedNote(kind); noteRef.current?.focus(); return }
    setNeedNote(null)
    run()
  }
  // Liên hệ shop: mở hội thoại với shop khởi xướng rồi chuyển sang trang Tin nhắn hỗ trợ
  const navigate = useNavigate()
  const startChatWithUser = useChatStore((s) => s.startChatWithUser)
  const [contacting, setContacting] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)
  const contactShop = async () => {
    setContacting(true)
    setContactError(null)
    try {
      await startChatWithUser(p.initiatorShopId)
      onClose()
      navigate('/admin/messages')
    } catch (e) {
      setContactError(getErrorMessage(e, 'Chưa mở được cuộc trò chuyện với shop.'))
    } finally {
      setContacting(false)
    }
  }
  const pending = p.status === 'SUBMITTED'
  const gap = p.marketPricePerKg && p.desiredPricePerKg ? Number(p.desiredPricePerKg) - Number(p.marketPricePerKg) : null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Đề xuất ${p.code}`} onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">{p.productName}</h3>
            <p className="text-xs text-gray-500">{p.code} · gửi {fmtDate(p.submittedAt)}</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            {p.photoUrls.map((u) => (
              <button key={u} type="button" onClick={() => setZoom(u)}><img src={u} alt="" className="h-24 w-24 rounded-xl object-cover" /></button>
            ))}
          </div>
          {/* Chia 3 nhóm màu: shop (xanh lá), thời gian (xanh dương), giá (vàng) để dễ phân biệt */}
          <div className="grid gap-3 md:grid-cols-3">
            <InfoGroup title="Shop khởi xướng" icon={Store} tone="green">
              <InfoRow label="Tên shop">
                <span className="inline-flex items-start gap-1">
                  {p.initiatorShopName}
                  {p.initiatorVerified && <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Đã xác minh" />}
                </span>
              </InfoRow>
              <InfoRow label="Đã từng tham gia">{p.initiatorPastRegistrations ?? 0} lô chiến dịch</InfoRow>
              <InfoRow label="Danh mục">{p.categoryName ?? '—'}</InfoRow>
            </InfoGroup>
            <InfoGroup title="Thời gian" icon={CalendarDays} tone="blue">
              <InfoRow label="Thu hoạch">Từ {fmtDate(p.harvestFrom)} đến {fmtDate(p.harvestTo)}</InfoRow>
              <InfoRow label="Đề xuất mở chiến dịch">{fmtDate(p.proposedOpenDate)}</InfoRow>
              <InfoRow label="Đề xuất kết thúc">{fmtDate(p.proposedCloseDate)}</InfoRow>
            </InfoGroup>
            <InfoGroup title="Giá" icon={BadgeDollarSign} tone="amber">
              <InfoRow label="Giá mong muốn">{p.desiredPricePerKg ? `${formatVnd(p.desiredPricePerKg)}/kg` : '—'}</InfoRow>
              <InfoRow label="Giá thương lái">{p.marketPricePerKg ? `${formatVnd(p.marketPricePerKg)}/kg` : '—'}</InfoRow>
              {gap != null && (
                <InfoRow label="Chênh lệch">
                  <span className={gap > 0 ? 'text-emerald-700' : gap < 0 ? 'text-rose-700' : undefined}>
                    {gap > 0 ? '+' : gap < 0 ? '−' : ''}{formatVnd(Math.abs(gap))}/kg {gap > 0 ? 'cao hơn thương lái' : gap < 0 ? 'thấp hơn thương lái' : 'bằng giá thương lái'}
                  </span>
                </InfoRow>
              )}
            </InfoGroup>
          </div>
          <div className="rounded-2xl border border-[#e9dfc9] bg-[#fffaf0] p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-[#7a5a12]"><Quote size={15} /> Câu chuyện của shop</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-800">{p.story || 'Shop chưa viết câu chuyện'}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900"><MapPin size={15} /> {p.siteName}</p>
            <p className="text-xs text-gray-600">{p.siteAddress}</p>
            {p.siteLatitude != null && (
              <iframe title="Điểm tập kết" loading="lazy" className="mt-3 h-48 w-full rounded-xl border-0"
                src={`https://maps.google.com/maps?q=${p.siteLatitude},${p.siteLongitude}&z=13&hl=vi&output=embed`} />
            )}
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900"><Users size={15} /> {p.acceptedShopCount} shop · {formatKg(p.totalEstimatedKg)} dự kiến</p>
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase text-gray-500"><tr><th className="py-1.5">Shop</th><th>Trạng thái</th><th className="text-right">Khoảng cách</th><th className="text-right">Kg dự kiến</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {p.members.map((m) => (
                  <tr key={m.memberId}>
                    <td className="py-2">
                      <span className="font-bold text-gray-900">{m.shopName}</span>
                      {m.verified && <ShieldCheck size={12} className="ml-1 inline text-emerald-600" />}
                      {m.role === 'INITIATOR' && <span className="ml-1.5 rounded-full bg-[#326318] px-1.5 text-[10px] font-bold text-white">Khởi xướng</span>}
                      {m.phone && <span className="block text-[11px] text-gray-500">{m.phone}</span>}
                    </td>
                    <td>
                      <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${MEMBER_STATUS[m.status]?.tone ?? 'bg-gray-100 text-gray-600'}`}>
                        {MEMBER_STATUS[m.status]?.label ?? m.status}
                      </span>
                    </td>
                    <td className="text-right text-xs tabular-nums text-gray-600">{m.distanceKm != null ? `~${m.distanceKm} km` : '—'}</td>
                    <td className="text-right font-bold tabular-nums">{m.estimatedKg != null ? formatKg(m.estimatedKg) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {p.adminNote && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><b>Ghi chú đã gửi:</b> {p.adminNote}</p>}
        </div>
        {pending && (
          <div className="space-y-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
            <label className="block text-xs font-bold text-gray-600">
              Lý do / ghi chú cho shop <span className="font-normal text-gray-500">(bắt buộc khi từ chối hoặc trả về bổ sung)</span>
              <textarea
                ref={noteRef}
                value={note}
                rows={2}
                onChange={(e) => { setNote(e.target.value); if (e.target.value.trim()) setNeedNote(null) }}
                placeholder="Vd: Ảnh chưa rõ vườn, giá mong muốn cao hơn thị trường…"
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal ${needNote ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`}
              />
            </label>
            {needNote && <p className="text-sm font-semibold text-red-600">Nhập lý do trước khi {needNote === 'reject' ? 'từ chối' : 'trả về bổ sung'}</p>}
            {(changes.error || reject.error) && <p className="text-sm font-semibold text-red-600">{getErrorMessage(changes.error || reject.error, 'Thao tác chưa thành công.')}</p>}
            {contactError && <p className="text-sm font-semibold text-red-600">{contactError}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={contacting} onClick={contactShop} className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-[#cfe0f3] bg-[#f1f7fd] px-4 py-2 text-sm font-bold text-[#1d4f84] hover:bg-[#e4effb] disabled:opacity-50">
                {contacting ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />} Liên hệ shop
              </button>
              <button type="button" disabled={reject.isPending} onClick={() => requireNote('reject', () => reject.mutate())} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                {reject.isPending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Từ chối
              </button>
              <button type="button" disabled={changes.isPending} onClick={() => requireNote('changes', () => changes.mutate())} className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-50">
                {changes.isPending ? <Loader2 size={15} className="animate-spin" /> : <MessageSquareWarning size={15} />} Trả về bổ sung
              </button>
              <button type="button" onClick={onApprove} className="inline-flex items-center gap-1.5 rounded-xl bg-[#326318] px-4 py-2 text-sm font-bold text-white hover:bg-[#254d12]">
                <Combine size={15} /> Duyệt thành chiến dịch
              </button>
            </div>
          </div>
        )}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/80 p-6" onClick={(e) => { e.stopPropagation(); setZoom(null) }}>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </div>,
    document.body,
  )
}

/** Popup bên trái khi duyệt: thông tin gốc shop đã gửi (chỉ đọc) để đối chiếu với bài đăng */
export function ProposalSourcePanel({ proposals }: { proposals: CampaignProposal[] }) {
  return (
    <div className="space-y-6">
      {proposals.map((p) => {
        const gap = p.marketPricePerKg && p.desiredPricePerKg ? Number(p.desiredPricePerKg) - Number(p.marketPricePerKg) : null
        return (
          <article key={p.proposalId} className="space-y-3">
            <div>
              <p className="text-base font-black text-gray-900">{p.productName}</p>
              <p className="text-xs text-gray-500">{p.code} · gửi {fmtDate(p.submittedAt)}</p>
            </div>
            {p.photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {p.photoUrls.map((u) => <img key={u} src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />)}
              </div>
            )}
            <InfoGroup title="Shop khởi xướng" icon={Store} tone="green">
              <InfoRow label="Tên shop">
                <span className="inline-flex items-start gap-1">
                  {p.initiatorShopName}
                  {p.initiatorVerified && <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Đã xác minh" />}
                </span>
              </InfoRow>
              <InfoRow label="Danh mục">{p.categoryName ?? '—'}</InfoRow>
              <InfoRow label="Số shop · kg dự kiến">{p.acceptedShopCount} shop · {formatKg(p.totalEstimatedKg)}</InfoRow>
            </InfoGroup>
            <InfoGroup title="Thời gian" icon={CalendarDays} tone="blue">
              <InfoRow label="Thu hoạch">Từ {fmtDate(p.harvestFrom)} đến {fmtDate(p.harvestTo)}</InfoRow>
              <InfoRow label="Đề xuất mở chiến dịch">{fmtDate(p.proposedOpenDate)}</InfoRow>
              <InfoRow label="Đề xuất kết thúc">{fmtDate(p.proposedCloseDate)}</InfoRow>
            </InfoGroup>
            <InfoGroup title="Giá" icon={BadgeDollarSign} tone="amber">
              <InfoRow label="Giá mong muốn">{p.desiredPricePerKg ? `${formatVnd(p.desiredPricePerKg)}/kg` : '—'}</InfoRow>
              <InfoRow label="Giá thương lái">{p.marketPricePerKg ? `${formatVnd(p.marketPricePerKg)}/kg` : '—'}</InfoRow>
              {gap != null && (
                <InfoRow label="Chênh lệch">
                  <span className={gap > 0 ? 'text-emerald-700' : gap < 0 ? 'text-rose-700' : undefined}>
                    {gap > 0 ? '+' : gap < 0 ? '−' : ''}{formatVnd(Math.abs(gap))}/kg
                  </span>
                </InfoRow>
              )}
            </InfoGroup>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900"><MapPin size={15} /> {p.siteName || 'Chưa có điểm tập kết'}</p>
              {p.siteAddress && <p className="mt-0.5 text-xs text-gray-600">{p.siteAddress}</p>}
            </div>
            <div className="rounded-2xl border border-[#e9dfc9] bg-[#fffaf0] p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-[#7a5a12]"><Quote size={15} /> Câu chuyện của shop</p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-800">{p.story || 'Shop chưa viết câu chuyện'}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

const GROUP_TONE = {
  green: { box: 'border-[#d6e8c6] bg-[#f3f9ee]', head: 'text-[#2b5619]', icon: 'bg-[#326318] text-white', line: 'divide-[#e1eed6]' },
  blue: { box: 'border-[#cfe0f3] bg-[#f1f7fd]', head: 'text-[#1d4f84]', icon: 'bg-[#2f6db3] text-white', line: 'divide-[#dbe8f6]' },
  amber: { box: 'border-[#f0dc9c] bg-[#fffbea]', head: 'text-[#7a5a00]', icon: 'bg-[#e0a800] text-white', line: 'divide-[#f4e7b8]' },
} as const

function InfoGroup({ title, icon: Icon, tone, children }: { title: string; icon: LucideIcon; tone: keyof typeof GROUP_TONE; children: React.ReactNode }) {
  const t = GROUP_TONE[tone]
  return (
    <section className={`min-w-0 rounded-2xl border p-4 ${t.box}`}>
      <p className={`flex items-center gap-2 text-sm font-bold ${t.head}`}>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.icon}`}><Icon size={15} /></span>
        {title}
      </p>
      <dl className={`mt-3 divide-y ${t.line}`}>{children}</dl>
    </section>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-bold text-gray-900">{children}</dd>
    </div>
  )
}
