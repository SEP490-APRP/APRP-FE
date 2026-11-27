import { Fragment, useMemo, type ReactNode } from 'react'
import { BadgeCheck, CheckCircle2, ChevronRight, ClipboardList, HandCoins, Package, ShoppingBag, Sprout, Truck, Undo2, Warehouse } from 'lucide-react'
import type { CampaignResponse, FarmRegistrationResponse, PreOrderResponse } from '@/services'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import CampaignSection, { ProgressBar } from './CampaignSection'

const ymd = (v?: string | null) => (v ? v.slice(0, 10) : null)
const fmtDay = (v?: string | null) => (v ? new Date(`${v.slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—')
const daysBetween = (from: string, to: string) => Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000)

/** Các chặng của đơn đặt trước theo thứ tự đi từ điểm tập kết tới người mua */
const STAGES = [
  { status: 'DEPOSIT_PAID', label: 'Chờ gói', Icon: ClipboardList },
  { status: 'PROCESSING', label: 'Đã gói', Icon: Package },
  { status: 'READY', label: 'Tại hub', Icon: Warehouse },
  { status: 'SHIPPING', label: 'Đang giao', Icon: Truck },
  { status: 'DELIVERED', label: 'Đã giao', Icon: CheckCircle2 },
] as const

/**
 * Tiến độ giao hàng bằng hình: đơn đang ở chặng nào, đã giải cứu được bao nhiêu so với mục tiêu, tiền và mốc ngày.
 * Chiến dịch hoàn tất thì là kết quả cuối.
 */
export default function CampaignResultPanel({ c, orders, regs }: { c: CampaignResponse; orders: PreOrderResponse[]; regs: FarmRegistrationResponse[] }) {
  const done = c.status === 'COMPLETED'
  const s = useMemo(() => {
    const approved = regs.filter((r) => r.status === 'APPROVED')
    // Đã chốt xe mà hàng chưa tới hub thì vẫn tính ở chặng "Đã gói"
    const stageOf = (o: PreOrderResponse) =>
      o.status === 'READY' && (o.hubStage === 'AT_SITE' || o.hubStage === 'ON_THE_WAY') ? 'PROCESSING' : o.status
    const of = (status: string) => orders.filter((o) => stageOf(o) === status)
    const sum = (xs: PreOrderResponse[], f: (o: PreOrderResponse) => number) => xs.reduce((n, o) => n + f(o), 0)
    const delivered = of('DELIVERED')
    const cancelled = of('CANCELLED').length
    return {
      stages: STAGES.map((st) => {
        const list = of(st.status)
        return { ...st, count: list.length, kg: sum(list, (o) => Number(o.totalKg ?? 0)) }
      }),
      rescuedKg: sum(delivered, (o) => Number(o.totalKg ?? 0)),
      rescuedValue: sum(delivered, (o) => Number(o.totalAmount ?? 0)),
      delivered: delivered.length,
      failed: of('FAILED').length,
      cancelled,
      total: orders.length - cancelled,
      refunded: sum(orders, (o) => Number(o.shortfallRefundAmount ?? 0) + Number(o.damageRefundTotal ?? 0)),
      payout: approved.reduce((n, r) => n + Number(r.payoutAmount ?? 0), 0),
      lastDelivered: delivered.map((o) => ymd(o.deliveredAt)).filter((d): d is string => !!d).sort().pop() ?? null,
    }
  }, [orders, regs])

  const target = Number(c.targetVolumeKg ?? 0)
  const pct = target > 0 ? Math.min(100, (s.rescuedKg / target) * 100) : 0
  const finish = ymd(c.finishDate)
  const lateDays = finish && s.lastDelivered ? daysBetween(finish, s.lastDelivered) : null
  const allDelivered = s.total > 0 && s.delivered === s.total

  return (
    <CampaignSection
      icon={done ? <BadgeCheck size={20} /> : <Truck size={20} />}
      title={done ? 'Kết quả chiến dịch' : 'Tiến độ giao hàng'}
      badge={`Đã giao ${s.delivered}/${s.total} đơn`}
      badgeTone={s.failed > 0 || (lateDays ?? 0) > 0 ? 'amber' : allDelivered ? 'green' : 'gray'}
    >
      <div className="flex flex-col gap-5 pt-4">
        {/* Đơn đang ở chặng nào */}
        <ol className="flex items-stretch gap-1 overflow-x-auto" aria-label="Số đơn theo chặng">
          {s.stages.map((st, i) => {
            const active = st.count > 0
            return (
              <Fragment key={st.status}>
                {i > 0 && <li aria-hidden="true" className="flex items-center text-gray-300"><ChevronRight size={16} /></li>}
                <li className={`flex min-w-[88px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-3 ${active ? 'bg-[#eef6e7]' : 'bg-gray-50'}`}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-[#326318] text-white' : 'bg-white text-gray-300'}`}>
                    <st.Icon size={18} />
                  </span>
                  <span className={`text-2xl font-black leading-none tabular-nums ${active ? 'text-gray-900' : 'text-gray-300'}`}>{st.count}</span>
                  <span className={`whitespace-nowrap text-xs font-bold ${active ? 'text-[#326318]' : 'text-gray-400'}`}>{st.label}</span>
                  <span className="text-[11px] tabular-nums text-gray-500">{active ? formatKg(st.kg) : ' '}</span>
                </li>
              </Fragment>
            )
          })}
        </ol>

        {(s.failed > 0 || s.cancelled > 0) && (
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {s.failed > 0 && <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{s.failed} đơn thất bại</span>}
            {s.cancelled > 0 && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{s.cancelled} đơn đã huỷ</span>}
          </div>
        )}

        {/* Giải cứu so với mục tiêu */}
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-bold text-gray-600"><Sprout size={16} className="text-[#326318]" /> Đã giải cứu</p>
            <p className="tabular-nums">
              <span className="text-2xl font-black text-[#326318]">{formatKg(s.rescuedKg)}</span>
              <span className="text-sm font-bold text-gray-400"> / {formatKg(target)}</span>
            </p>
          </div>
          <ProgressBar percent={pct} />
        </div>

        {/* Tiền */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Money icon={<ShoppingBag size={18} />} label="Hàng đã giao" value={formatVnd(s.rescuedValue)} tone="bg-[#eef6e7] text-[#326318]" />
          <Money icon={<HandCoins size={18} />} label="Trả nhà vườn" value={done ? formatVnd(s.payout) : 'Chờ hoàn tất'} tone="bg-amber-50 text-amber-700" />
          <Money icon={<Undo2 size={18} />} label="Hoàn người mua" value={formatVnd(s.refunded)} tone="bg-sky-50 text-sky-700" />
        </div>

        {/* Mốc ngày */}
        <ol className="grid grid-cols-3 rounded-2xl border border-gray-100 py-3" aria-label="Mốc ngày">
          <Milestone label="Đóng tập kết" value={fmtDay(c.endDate)} reached={!!c.endDate && new Date(`${c.endDate.slice(0, 10)}T23:59:59`).getTime() <= Date.now()} />
          <Milestone label="Hạn chiến dịch" value={fmtDay(c.finishDate)} reached={done} />
          <Milestone
            label={lateDays == null ? 'Giao xong' : lateDays > 0 ? `Trễ ${lateDays} ngày` : lateDays < 0 ? `Sớm ${-lateDays} ngày` : 'Đúng hạn'}
            value={allDelivered ? fmtDay(s.lastDelivered) : '—'}
            reached={allDelivered}
            late={(lateDays ?? 0) > 0}
          />
        </ol>
      </div>
    </CampaignSection>
  )
}

function Money({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-500">{label}</p>
        <p className="truncate text-lg font-black tabular-nums text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function Milestone({ label, value, reached, late }: { label: string; value: string; reached: boolean; late?: boolean }) {
  const dot = late ? 'border-red-600 bg-red-600' : reached ? 'border-[#326318] bg-[#326318]' : 'border-gray-300 bg-white'
  return (
    <li className="relative flex flex-col items-center gap-1 before:absolute before:left-0 before:right-0 before:top-[7px] before:h-0.5 before:bg-gray-200 first:before:left-1/2 last:before:right-1/2">
      <span className={`relative h-4 w-4 rounded-full border-2 ${dot}`} />
      <span className="text-base font-black tabular-nums text-gray-900">{value}</span>
      <span className={`text-center text-xs font-bold ${late ? 'text-red-600' : 'text-gray-500'}`}>{label}</span>
    </li>
  )
}
