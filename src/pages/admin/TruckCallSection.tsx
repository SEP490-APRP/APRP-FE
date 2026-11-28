import { useQuery } from '@tanstack/react-query'
import { Truck } from 'lucide-react'
import { adminHubTripService, type CampaignResponse, type PreOrderResponse } from '@/services'
import { dispatchBlockedReason } from '@/features/campaign/deliveryPlan'
import CampaignDeliveryPlanner from './CampaignDeliveryPlanner'
import CampaignSection from './CampaignSection'

/** Mục thu gọn "Kêu gọi xe" trên trang chiến dịch: gọi xe, xe bị từ chối, gửi lại thông báo, gọi điện và gắn tài xế */
export default function TruckCallSection({
  c,
  orders,
  pendingIntake,
  onNotice,
  onPack,
}: {
  c: CampaignResponse
  orders: PreOrderResponse[]
  pendingIntake: number
  onNotice: (n: { ok: boolean; text: string }) => void
  onPack?: () => void
}) {
  const trips = useQuery({ queryKey: ['admin-campaigns', 'hub-trips', c.campaignId], queryFn: () => adminHubTripService.list(c.campaignId), refetchInterval: 30_000 })
  const active = (trips.data ?? []).filter((t) => t.status !== 'CANCELLED')
  const accepted = active.filter((t) => t.driverId != null).length
  const declined = active.filter((t) => t.driverId == null && (t.declinedDriverIds?.length ?? 0) > 0).length
  return (
    <CampaignSection
      icon={<Truck size={20} />}
      title="Kêu gọi xe"
      badge={!active.length ? 'Chưa gọi xe' : declined ? `${declined} xe bị từ chối · ${accepted}/${active.length} đã nhận` : `${accepted}/${active.length} xe đã nhận`}
      badgeTone={!active.length ? 'gray' : declined ? 'red' : accepted === active.length ? 'green' : 'amber'}
    >
      <CampaignDeliveryPlanner mode="calls" c={c} allOrders={orders} onNotice={onNotice} onPack={onPack} confirmBlockedReason={dispatchBlockedReason(c.status, pendingIntake, Number(c.shortfallVolumeKg ?? 0))} />
    </CampaignSection>
  )
}
