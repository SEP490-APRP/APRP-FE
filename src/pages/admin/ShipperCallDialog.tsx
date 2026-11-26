import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, CalendarClock, Check, Package, PackageCheck, Truck, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminHubTripService, type CampaignResponse, type PreOrderResponse } from '@/services'
import { dispatchBlockedReason } from '@/features/campaign/deliveryPlan'
import CampaignDeliveryPlanner from './CampaignDeliveryPlanner'

/**
 * Popup "Kêu gọi xe chở hàng ra hub": kế hoạch xe chặng điểm tập kết -> hub trong một cửa sổ lớn.
 * Đầu popup là 4 bước nhỏ: Kêu gọi xe -> Gom & cân hàng -> Đóng gói -> Chốt xe ra hub.
 */
export default function ShipperCallDialog({
  c,
  orders,
  pendingIntake,
  onClose,
  onNotice,
  onPack,
}: {
  c: CampaignResponse
  orders: PreOrderResponse[]
  pendingIntake: number
  onClose: () => void
  onNotice: (n: { ok: boolean; text: string }) => void
  onPack?: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const collecting = c.status === 'FULFILLING'
  const blocked = dispatchBlockedReason(c.status, pendingIntake, Number(c.shortfallVolumeKg ?? 0))
  // Cùng khoá với màn xe nên bước tự cập nhật ngay sau khi gọi xe / chốt
  const trips = useQuery({ queryKey: ['admin-campaigns', 'hub-trips', c.campaignId], queryFn: () => adminHubTripService.list(c.campaignId) })
  const active = (trips.data ?? []).filter((t) => t.status !== 'CANCELLED')
  const driven = active.filter((t) => t.driverId != null).length
  const called = !!c.shipperCalledAt || driven > 0
  const trucksReady = active.length > 0 && driven === active.length
  const confirmed = active.length > 0 && active.every((t) => t.confirmed)
  const unpacked = orders.filter((o) => o.fulfillmentMethod !== 'PICKUP' && o.status === 'DEPOSIT_PAID').length
  const steps = [
    { icon: BellRing, label: 'Kêu gọi xe', done: trucksReady, hint: called ? `${driven}/${active.length} xe đã nhận` : 'Báo số xe dự kiến' },
    { icon: CalendarClock, label: 'Gom & cân hàng', open: active.length > 0, done: collecting && pendingIntake === 0, hint: collecting ? (pendingIntake ? `Còn ${pendingIntake} lô chưa cân` : 'Đã cân đủ') : active.length > 0 ? 'Sẵn sàng gom hàng' : 'Sau khi gọi xe' },
    { icon: Package, label: 'Đóng gói', done: collecting && pendingIntake === 0 && unpacked === 0, hint: !collecting || pendingIntake ? 'Sau khi cân đủ' : unpacked ? `Còn ${unpacked} đơn` : 'Đã đóng xong' },
    { icon: PackageCheck, label: 'Chốt xe ra hub', done: confirmed, hint: confirmed ? 'Đã chốt' : blocked ? 'Chờ bước trước' : 'Sẵn sàng chốt' },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/55 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipper-call-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-[#f6f8f3] shadow-2xl sm:rounded-3xl"
      >
        <header className="relative overflow-hidden bg-gradient-to-br from-[#254d12] via-[#326318] to-[#4a7c2f] px-6 pb-5 pt-5 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" aria-hidden />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#ffea79]">
                <Truck size={13} /> Dự toán và gọi xe chở hàng ra hub
              </p>
              <h2 id="shipper-call-title" className="mt-2 truncate text-xl font-black sm:text-2xl">{c.title}</h2>
              <p className="text-xs text-white/75">
                Điểm tập kết: {c.collectionSiteName || '—'}
                {c.deliveryDate ? ` · Giao dự kiến ${new Date(c.deliveryDate).toLocaleDateString('vi-VN')}` : ''}
              </p>
            </div>
            <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
              <X size={20} />
            </button>
          </div>
          <ol className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((s, i) => {
              const now = !s.done && (('open' in s && !!s.open) || steps.slice(0, i).every((x) => x.done))
              return (
                <li key={s.label} className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 ${s.done ? 'bg-white/20' : now ? 'bg-white text-[#254d12]' : 'bg-white/5 text-white/60'}`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${s.done ? 'bg-[#ffea79] text-[#254d12]' : now ? 'bg-[#326318] text-white' : 'border border-white/30'}`}>
                    {s.done ? <Check size={14} /> : <s.icon size={14} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black sm:text-sm">{s.label}</span>
                    <span className={`block truncate text-[11px] ${now ? 'text-gray-500' : 'opacity-80'}`}>{s.hint}</span>
                  </span>
                </li>
              )
            })}
          </ol>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          <CampaignDeliveryPlanner c={c} allOrders={orders} onNotice={onNotice} confirmBlockedReason={blocked} onDone={onClose} onPack={onPack} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
