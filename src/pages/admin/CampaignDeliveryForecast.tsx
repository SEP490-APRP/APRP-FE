import { TrendingDown, TrendingUp } from 'lucide-react'
import type { Forecast } from '@/features/campaign/deliveryPlan'
import { formatVnd } from '@/features/campaign/utils'
import type { HubFeeConfig } from '@/services'

/** Chênh lệch tiền: xanh khi tăng, đỏ khi giảm */
function Delta({ value, suffix }: { value: number; suffix: string }) {
  if (value === 0) return null
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${up ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
      <Icon size={13} /> {up ? '+' : '−'}{formatVnd(Math.abs(value))} {suffix}
    </span>
  )
}

/** Dự toán tiền sàn thu về của chiến dịch: hoa hồng và phí giao, trừ tiền xe ra hub và shipper */
export default function CampaignDeliveryForecast({
  fore,
  prevProfit,
  vehicleCount,
  cfg,
  note,
}: {
  fore: Forecast
  prevProfit: number | null
  vehicleCount: number
  cfg: HubFeeConfig
  /** Điều vừa làm số tiền đổi, vd hàng hụt sau khi cân */
  note?: string | null
}) {
  const rows = [
    { label: `Hoa hồng ${Math.round(cfg.farmerFeeRate * 100)}%`, note: `trên ${formatVnd(fore.goods)} tiền hàng`, value: fore.commission },
    { label: 'Phí giao người mua trả', note: 'cố định theo kg', value: fore.shipCollected },
    { label: 'Xe ra hub', note: `${vehicleCount} xe`, value: -fore.tripCost },
    { label: 'Shipper giao tới nhà', note: `${fore.deliveryCount} đơn`, value: -fore.lastMileCost },
  ]
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)))
  const loss = fore.profit < 0
  return (
    <section aria-label="Dự toán tiền thu về" className="grid gap-4 rounded-3xl border border-gray-200 bg-white p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className={`flex flex-col justify-center gap-2 rounded-2xl p-5 ${loss ? 'bg-red-50' : 'bg-[#eef6e7]'}`}>
        <p className="text-sm font-bold text-gray-600">Dự toán sàn còn lại</p>
        <p className={`text-4xl font-black tabular-nums ${loss ? 'text-red-700' : 'text-[#326318]'}`}>{formatVnd(fore.profit)}</p>
        {prevProfit != null && (
          <span className="w-fit"><Delta value={fore.profit - prevProfit} suffix="so với trước" /></span>
        )}
        <p className="text-xs text-gray-500" title={`Xe ra hub trả đủ cước theo bảng giá xe tải; shipper nhận cước sau phí dịch vụ ${Math.round(cfg.serviceFeeRate * 100)}%`}>
          {loss ? 'Đang lỗ, kiểm tra lại vị trí hub và cỡ xe.' : 'Ước tính theo đơn đã đặt cọc.'}
        </p>
        {note && <p className="text-xs font-bold text-amber-800">{note}</p>}
        {fore.skippedCount > 0 && <p className="text-xs font-bold text-amber-800">Chưa tính {fore.skippedCount} đơn chưa có hub gần.</p>}
      </div>
      <ul className="flex flex-col justify-center gap-3">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-bold text-gray-800">{r.label} <span className="text-xs font-normal text-gray-500">{r.note}</span></span>
              <b className={`shrink-0 tabular-nums ${r.value < 0 ? 'text-amber-700' : 'text-[#326318]'}`}>{r.value < 0 ? '−' : '+'}{formatVnd(Math.abs(r.value))}</b>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-gray-100">
              <span className={`block h-full rounded-full ${r.value < 0 ? 'bg-amber-400' : 'bg-[#326318]'}`} style={{ width: `${(Math.abs(r.value) / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
