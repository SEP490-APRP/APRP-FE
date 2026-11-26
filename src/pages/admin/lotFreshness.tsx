import type { CampaignResponse, FarmRegistrationResponse, PriorityLevel } from '@/services/campaign.types'

const PRIORITY: Record<PriorityLevel, { label: string; chip: string; dot: string }> = {
  URGENT: { label: 'Gấp', chip: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  HIGH: { label: 'Ưu tiên', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  NORMAL: { label: 'Thường', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
}

const MAX_DAYS: Record<string, number> = { DAYS_2_3: 3, DAYS_3_4: 4, DAYS_5_6: 6 }
const TIER_LABEL: Record<string, string> = { DAYS_2_3: '2–3 ngày', DAYS_3_4: '3–4 ngày', DAYS_5_6: '5–6 ngày' }

export const tierLabel = (t?: string | null) => (t ? TIER_LABEL[t] ?? t : 'chưa khai')

export const fmtDeadline = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'

/** Khớp BE (CampaignServiceImpl.withPriority): mốc tính tươi = ngày kết thúc chiến dịch (hoặc ngày chốt), lô thu hoạch muộn hơn thì tính từ ngày thu hoạch */
export function lotFreshness(c: CampaignResponse, r: Pick<FarmRegistrationResponse, 'shelfLifeTier' | 'harvestDate'>): {
  level: PriorityLevel
  reason: string
  deadline: Date
} | null {
  if (!r.shelfLifeTier) return null
  const base = (c.endDate ?? c.cutoffAt).slice(0, 10)
  const harvest = r.harvestDate?.slice(0, 10)
  const anchorIso = harvest && harvest > base ? harvest : base
  const deadline = new Date(anchorIso + 'T00:00:00')
  deadline.setDate(deadline.getDate() + (MAX_DAYS[r.shelfLifeTier] ?? 4))
  const hoursLeft = Math.floor((deadline.getTime() - Date.now()) / 3600000)
  if (r.shelfLifeTier === 'DAYS_2_3') return { level: 'URGENT', reason: 'Chỉ giữ tươi 2–3 ngày, giao gấp', deadline }
  if (hoursLeft <= 24) return { level: 'URGENT', reason: hoursLeft <= 0 ? 'Đã quá hạn tươi, giao ngay' : `Còn ${Math.max(hoursLeft, 1)}h tới hạn tươi`, deadline }
  if (hoursLeft <= 48) return { level: 'HIGH', reason: `Còn ${hoursLeft}h tới hạn tươi`, deadline }
  return { level: 'NORMAL', reason: `Còn ${Math.floor(hoursLeft / 24)} ngày tới hạn tươi`, deadline }
}

export function PriorityChip({ level }: { level: PriorityLevel }) {
  const p = PRIORITY[level]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />{p.label}</span>
}

/** Khối "Độ tươi" của một lô nhà vườn: bảo quản bao lâu, giao trước khi nào, mức gấp */
export function LotFreshnessBox({ c, r }: { c: CampaignResponse; r: FarmRegistrationResponse }) {
  const f = lotFreshness(c, r)
  if (!f) return <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">Lô này chưa khai độ bền sau thu hoạch.</p>
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700">
      <PriorityChip level={f.level} />
      <span>Giữ tươi <b>{tierLabel(r.shelfLifeTier)}</b></span>
      <span>Giao trước <b>{fmtDeadline(f.deadline)}</b></span>
      <span className="text-gray-500">{f.reason}</span>
    </div>
  )
}
