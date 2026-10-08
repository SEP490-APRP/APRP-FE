/**
 * React Query hooks cho Shop Order Processing
 *
 * Tại sao dùng React Query thay vì gọi service thẳng?
 * - Tự động cache, refetch, loading/error state
 * - invalidateQueries() để refresh list sau khi thực hiện action
 * - Không cần viết useEffect + useState thủ công
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as orderService from '@/services/order.service'
import type { FetchOrdersParams } from '@/types/order.types'

/** Query key — dùng để invalidate cache sau mutation */
export const SHOP_ORDERS_KEY = 'shop-orders'

/**
 * Hook lấy danh sách đơn hàng.
 * Tự động re-fetch khi page hoặc statuses thay đổi.
 */
export function useShopOrders(params: FetchOrdersParams = {}) {
  return useQuery({
    queryKey: [SHOP_ORDERS_KEY, params],
    queryFn: () => orderService.fetchShopOrders(params),
  })
}

/**
 * Hook xác nhận đơn: PENDING/PAID → CONFIRMED
 * Sau khi thành công tự refresh danh sách.
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number) => orderService.confirmOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHOP_ORDERS_KEY] })
    },
  })
}

/**
 * Hook đóng gói xong: CONFIRMED → READY
 * Sau khi thành công, đơn xuất hiện bên tab Shipper để shipper nhận.
 */
export function useReadyOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number) => orderService.readyOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHOP_ORDERS_KEY] })
    },
  })
}

/**
 * Hook hủy đơn.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: number) => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHOP_ORDERS_KEY] })
    },
  })
}
