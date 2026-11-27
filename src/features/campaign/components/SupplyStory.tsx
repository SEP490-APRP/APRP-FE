import type { ReactNode } from 'react'
import { CheckCircle2, MinusCircle, PlusCircle, Sprout, Users, XCircle } from 'lucide-react'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import type { SupplySummary } from '@/services'

const num = (v?: number | null) => Number(v ?? 0)

/** Câu ngắn nói chiến dịch kết thúc việc gom hàng ra sao */
export function supplyVerdict(s: SupplySummary): { text: string; tone: 'green' | 'amber' | 'red' } {
  if (num(s.remainingShortKg) > 0) return { text: `Còn thiếu ${formatKg(s.remainingShortKg)}`, tone: 'red' }
  if (num(s.cutKg) > 0) return { text: `Đã chốt thiếu ${formatKg(s.cutKg)}`, tone: 'amber' }
  if (num(s.supplementKg) > 0) return { text: `Đủ hàng (bổ sung ${formatKg(s.supplementKg)})`, tone: 'green' }
  return { text: 'Đủ hàng', tone: 'green' }
}

/**
 * Hàng tại điểm tập kết: người mua đặt bao nhiêu, vườn giao, hư bao nhiêu, thiếu rồi được bổ sung hay bớt đơn ra sao.
 * showMoney: hiện tiền hoàn cọc (trang quản trị).
 */
export default function SupplyStory({ s, showMoney = false }: { s: SupplySummary; showMoney?: boolean }) {
  const ordered = num(s.orderedKg)
  const short = num(s.shortAfterWeighingKg)
  const delivered = Math.max(0, ordered - num(s.cutKg) - num(s.remainingShortKg))
  // Thanh chia phần đã đặt: đợt đầu, bổ sung, bị bớt, còn thiếu
  const parts = [
    { label: 'Vườn giao đạt chuẩn', kg: Math.min(ordered, num(s.firstAcceptedKg)), cls: 'bg-[#326318]' },
    { label: 'Bổ sung thêm', kg: Math.min(short, num(s.supplementKg)), cls: 'bg-sky-500' },
    { label: 'Bớt khỏi đơn', kg: num(s.cutKg), cls: 'bg-amber-400' },
    { label: 'Còn thiếu', kg: num(s.remainingShortKg), cls: 'bg-red-500' },
  ].filter((p) => p.kg > 0)

  return (
    <div className="flex flex-col gap-3">
      {ordered > 0 && (
        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-100" role="img" aria-label={parts.map((p) => `${p.label} ${formatKg(p.kg)}`).join(', ')}>
            {parts.map((p) => (
              <span key={p.label} className={p.cls} style={{ width: `${(p.kg / ordered) * 100}%` }} title={`${p.label}: ${formatKg(p.kg)}`} />
            ))}
          </div>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {parts.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                <span className={`h-2.5 w-2.5 rounded-full ${p.cls}`} /> {p.label} {formatKg(p.kg)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="divide-y divide-gray-100 text-sm">
        <Row icon={<Users size={15} />} label="Người mua đã đặt" value={formatKg(ordered)} />
        <Row icon={<Sprout size={15} />} label="Nhà vườn giao đợt đầu" value={formatKg(s.deliveredByFarmsKg)} />
        <Row icon={<XCircle size={15} />} label="Hư hỏng, bị loại" value={formatKg(s.rejectedKg)} tone={num(s.rejectedKg) > 0 ? 'text-red-600' : undefined} />
        <Row icon={<MinusCircle size={15} />} label="Thiếu sau khi cân" value={formatKg(short)} tone={short > 0 ? 'text-amber-700' : undefined} />
        {num(s.supplementKg) > 0 && (
          <Row icon={<PlusCircle size={15} />} label="Bổ sung thêm" value={`+${formatKg(s.supplementKg)}`} tone="text-sky-700"
            hint={s.supplements.map((x) => `${x.shopName} ${formatKg(x.kg)}`).join(', ')} />
        )}
        {num(s.cutKg) > 0 && (
          <Row icon={<MinusCircle size={15} />} label="Không bù được, bớt khỏi đơn" value={`−${formatKg(s.cutKg)}`} tone="text-amber-700"
            hint={[
              s.reducedOrderCount ? `${s.reducedOrderCount} đơn giảm thùng` : '',
              s.cancelledOrderCount ? `${s.cancelledOrderCount} đơn huỷ` : '',
              showMoney ? `hoàn cọc ${formatVnd(s.refundAmount)}` : 'đã hoàn cọc phần dư',
            ].filter(Boolean).join(' · ')} />
        )}
        <Row icon={<CheckCircle2 size={15} />} label="Hàng giao cho người mua" value={formatKg(delivered)} tone="text-[#326318]" />
      </dl>
    </div>
  )
}

function Row({ icon, label, value, hint, tone = 'text-gray-900' }: { icon: ReactNode; label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="flex min-w-0 items-start gap-2 text-gray-600">
        <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
        <span className="min-w-0">
          {label}
          {hint && <span className="block text-xs text-gray-500">{hint}</span>}
        </span>
      </dt>
      <dd className={`shrink-0 font-black tabular-nums ${tone}`}>{value}</dd>
    </div>
  )
}
