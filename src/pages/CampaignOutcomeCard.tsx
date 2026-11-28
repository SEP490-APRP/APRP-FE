import { BadgeCheck, PackageCheck, Sprout, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import SupplyStory, { supplyVerdict } from '@/features/campaign/components/SupplyStory'
import { formatKg } from '@/features/campaign/utils'
import type { CampaignResponse } from '@/services'

const fmtDay = (v?: string | null) =>
  v ? new Date(`${v.slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

/** Chiến dịch đã hoàn tất và máy chủ có trả số liệu kết quả */
export const hasOutcome = (c: CampaignResponse) => c.status === 'COMPLETED' && c.deliveredKg != null

/** Báo cáo tổng kết cho người xem: biểu đồ tròn mức giải cứu so mục tiêu và biểu đồ cột khối lượng qua các bước */
export default function CampaignOutcomeCard({ c }: { c: CampaignResponse }) {
  const target = Number(c.targetVolumeKg ?? 0)
  const delivered = Number(c.deliveredKg ?? 0)
  const pct = target > 0 ? Math.round((delivered / target) * 100) : 0
  const columns = [
    { label: 'Mục tiêu', kg: target, color: 'bg-[#cfc8b6]' },
    { label: 'Đặt trước', kg: Number(c.bookedVolumeKg ?? 0), color: 'bg-[#4a7c2f]' },
    { label: 'Vườn giao', kg: Number(c.acceptedVolumeKg ?? 0), color: 'bg-[#4a7c2f]' },
    { label: 'Tới người mua', kg: delivered, color: 'bg-[#4a7c2f]' },
  ]
  const max = Math.max(1, ...columns.map((x) => x.kg))
  const start = fmtDay(c.callPostedAt ?? c.publishedAt ?? c.createdAt)
  const end = fmtDay(c.finishDate ?? c.completedAt)
  const R = 52
  const circle = 2 * Math.PI * R

  return (
    <section aria-label="Báo cáo tổng kết" className="rounded-3xl border border-[#e4ddcc] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-black text-[#1c1c18]">Báo cáo tổng kết</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f9ed] px-2.5 py-1 text-xs font-extrabold text-[#2b5619]">
          <BadgeCheck size={14} /> Hoàn thành
        </span>
      </div>
      {start && end && <p className="mt-1 text-xs font-bold tabular-nums text-[#6b7363]">{start} – {end}</p>}

      {/* Biểu đồ tròn: đã giải cứu so với mục tiêu */}
      <figure className="mt-4 flex items-center gap-4">
        <svg viewBox="0 0 128 128" className="h-32 w-32 shrink-0" role="img" aria-label={`Đã giải cứu ${pct}% mục tiêu`}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="#ede8df" strokeWidth="14" />
          <circle cx="64" cy="64" r={R} fill="none" stroke="#4a7c2f" strokeWidth="14" strokeDasharray={`${(Math.min(100, pct) / 100) * circle} ${circle}`} transform="rotate(-90 64 64)" />
          <text x="64" y="66" textAnchor="middle" className="fill-[#1c1c18] text-[26px] font-black">{pct}%</text>
          <text x="64" y="83" textAnchor="middle" className="fill-[#6b7363] text-[11px] font-bold">mục tiêu</text>
        </svg>
        <figcaption>
          <p className="text-xs font-bold text-[#6b7363]">Đã giải cứu</p>
          <p className="text-2xl font-black tabular-nums text-[#2b5619]">{formatKg(delivered)}</p>
          <p className="text-xs text-[#6b7363]">trên {formatKg(target)}</p>
        </figcaption>
      </figure>

      {/* Biểu đồ cột: khối lượng qua các bước */}
      <figure className="mt-5">
        <figcaption className="text-xs font-bold text-[#6b7363]">Khối lượng qua các bước (kg)</figcaption>
        <ul className="mt-2 grid grid-cols-4 gap-2">
          {columns.map((x) => (
            <li key={x.label} title={`${x.label}: ${formatKg(x.kg)}`} className="flex flex-col items-center gap-1">
              <div className="flex h-32 w-full flex-col items-center justify-end border-b border-[#e4ddcc]">
                <span className="mb-1 text-xs font-black tabular-nums text-[#1c1c18]">{x.kg.toLocaleString('vi-VN')}</span>
                <div className={`w-8 rounded-t ${x.color}`} style={{ height: `${(x.kg / max) * 100}px` }} />
              </div>
              <span className="text-center text-[11px] font-bold leading-tight text-[#6b7363]">{x.label}</span>
            </li>
          ))}
        </ul>
      </figure>

      {/* Hàng tại điểm tập kết: hư hỏng, bổ sung, phần bớt khỏi đơn */}
      {c.supply && (
        <div className="mt-5 rounded-2xl border border-[#ede8df] p-3">
          <p className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#6b7363]">
            Hàng tại điểm tập kết
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${supplyVerdict(c.supply).tone === 'green' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {supplyVerdict(c.supply).text}
            </span>
          </p>
          <SupplyStory s={c.supply} />
        </div>
      )}

      <dl className="mt-5 grid grid-cols-3 divide-x divide-[#ede8df] rounded-2xl bg-[#faf7ef] py-3">
        <Stat icon={<PackageCheck size={16} />} value={`${c.deliveredOrderCount ?? 0}/${c.totalOrderCount ?? 0}`} label="Đơn đã giao" />
        <Stat icon={<Users size={16} />} value={String(c.buyerCount ?? 0)} label="Người mua" />
        <Stat icon={<Sprout size={16} />} value={String(c.approvedFarmCount ?? 0)} label="Nhà vườn" />
      </dl>
    </section>
  )
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1 text-center">
      <span className="text-[#4a7c2f]">{icon}</span>
      <dd className="text-base font-black tabular-nums text-[#1c1c18]">{value}</dd>
      <dt className="text-[11px] font-bold text-[#6b7363]">{label}</dt>
    </div>
  )
}
