import { netOf, tripFee, truckTier, type FleetVehicle } from '@/features/campaign/deliveryPlan'
import { formatKg, formatVnd } from '@/features/campaign/utils'
import type { HubFeeConfig } from '@/services'

/** Mốc km đổi đơn giá (khớp HubTripFeeCalculator ở BE) */
const FAR_KM = 20

const num = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })

/** Bảng cước xe tải trả tài xế (chiều đi), kèm cách tính cước của từng xe trong kế hoạch */
export default function TruckFeeTable({ cfg, vehicles }: { cfg: HubFeeConfig; vehicles: FleetVehicle[] }) {
  const usedBy = (label: string) => vehicles.filter((v) => truckTier(cfg, v.totalKg).label === label).map((v) => v.tripNo)
  return (
    <section aria-label="Bảng cước xe tải" className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div>
        <h4 className="text-sm font-black text-gray-900">Bảng cước xe tải trả tài xế</h4>
        <p className="text-xs text-gray-500">
          Chỉ tính chiều đi: điểm tập kết tới các hub theo thứ tự ghé. Loại xe tính theo số kg trên xe, ghé thêm hub chỉ tính thêm quãng đường, làm tròn 1.000đ.
          {cfg.hubServiceFeeRate > 0 ? ` Tài xế nhận sau phí dịch vụ ${Math.round(cfg.hubServiceFeeRate * 100)}%.` : ' Tài xế nhận đủ cước.'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 pr-3 font-bold">Loại xe</th>
              <th className="py-2 pr-3 font-bold">Trọng tải</th>
              <th className="py-2 pr-3 text-right font-bold">Mở cửa ({cfg.openKm} km đầu)</th>
              <th className="py-2 pr-3 text-right font-bold">Km {cfg.openKm + 1} - {FAR_KM}</th>
              <th className="py-2 pr-3 text-right font-bold">Trên {FAR_KM} km</th>
              <th className="py-2 font-bold">Đang áp dụng</th>
            </tr>
          </thead>
          <tbody>
            {cfg.tiers.map((t) => {
              const used = usedBy(t.label)
              return (
                <tr key={t.label} className={`border-b border-gray-100 tabular-nums ${used.length ? 'bg-[#eef6e7]' : ''}`}>
                  <th scope="row" className="py-2 pr-3 font-black text-gray-900">{t.label}</th>
                  <td className="py-2 pr-3">đến {num(t.maxKg / 1000)} tấn</td>
                  <td className="py-2 pr-3 text-right">{formatVnd(t.openFee)}</td>
                  <td className="py-2 pr-3 text-right">{formatVnd(t.perKm)}/km</td>
                  <td className="py-2 pr-3 text-right">{formatVnd(t.perKmOver20)}/km</td>
                  <td className="py-2 font-bold text-[#326318]">{used.length ? `Xe ${used.join(', ')}` : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {vehicles.length > 0 && (
        <ul aria-label="Cách tính cước từng xe" className="flex flex-col gap-1.5">
          {vehicles.map((v) => {
            const t = truckTier(cfg, v.totalKg)
            const km = v.routeKm ?? 0
            const mid = Math.max(0, Math.min(km, FAR_KM) - cfg.openKm)
            const far = Math.max(0, km - FAR_KM)
            const gross = tripFee(cfg, v.routeKm, v.totalKg)
            const parts = [
              formatVnd(t.openFee),
              mid > 0 && `${num(mid)} km × ${formatVnd(t.perKm)}`,
              far > 0 && `${num(far)} km × ${formatVnd(t.perKmOver20)}`,
            ].filter(Boolean)
            return (
              <li key={v.key} className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <b className="text-gray-900">Xe {v.tripNo}</b> · {t.label} · {formatKg(v.totalKg)} · {v.routeKm != null ? `${num(km)} km` : 'chưa có quãng đường, tính giá mở cửa'}
                <span className="block tabular-nums">
                  {parts.join(' + ')} = <b className="text-[#326318]">{formatVnd(gross)}</b>
                  {cfg.hubServiceFeeRate > 0 && ` · tài xế nhận ${formatVnd(netOf(gross, cfg.hubServiceFeeRate))}`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
