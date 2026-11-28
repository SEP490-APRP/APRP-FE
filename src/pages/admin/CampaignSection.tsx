import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

const BADGE = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
}

/** Mục thu gọn trong trang chiến dịch: dòng tiêu đề kèm con số chính, bấm mới sổ chi tiết */
export default function CampaignSection({
  icon,
  title,
  badge,
  badgeTone = 'gray',
  children,
}: {
  icon: ReactNode
  title: string
  badge: string
  badgeTone?: keyof typeof BADGE
  children: ReactNode
}) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm open:border-[#b9dba8]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6e7] text-[#326318]">{icon}</span>
        <h3 className="min-w-0 flex-1 text-sm font-black text-gray-900">{title}</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums ${BADGE[badgeTone]}`}>{badge}</span>
        <ChevronDown size={18} className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-gray-100 px-4 pb-4">{children}</div>
    </details>
  )
}

/** Một dòng số liệu: nhãn bên trái, giá trị bên phải */
export function InfoRow({ label, value, hint, tone = 'text-gray-900' }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-2.5 last:border-b-0">
      <dt className="text-sm text-gray-600">
        {label}
        {hint && <span className="ml-2 text-xs text-gray-400">{hint}</span>}
      </dt>
      <dd className={`shrink-0 text-base font-black tabular-nums ${tone}`}>{value}</dd>
    </div>
  )
}

export function ProgressBar({ percent, tone = 'bg-[#326318]' }: { percent: number; tone?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  )
}
