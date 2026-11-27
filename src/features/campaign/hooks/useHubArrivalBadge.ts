import { useQuery } from '@tanstack/react-query'
import { adminHubService } from '@/services'

/** Số đơn xe tải đã giao tới hub mà chưa ai xác nhận nhận hàng; xác nhận xong thì số mất */
export function useHubArrivalBadge() {
  const hubs = useQuery({
    queryKey: ['admin-hubs'],
    queryFn: () => adminHubService.list(false),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
  const count = (hubs.data ?? []).reduce((s, h) => s + (h.unconfirmedOrders ?? 0), 0)
  return { hubs, count }
}
