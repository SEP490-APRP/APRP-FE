import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services'
import { codSettlementService } from '@/services/codSettlement.service'
import { returnService } from '@/services/return.service'

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  codPending: () => [...orderKeys.all, 'cod-pending'] as const,
  disputes: () => [...orderKeys.all, 'disputes'] as const,
}

export function useAllOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: async () => (await orderService.getAllOrders()).result ?? [],
  })
}

// ---- Đối soát COD ----

export function useCodPendingOrders() {
  return useQuery({
    queryKey: orderKeys.codPending(),
    queryFn: async () => (await codSettlementService.getPendingCodOrders()).result ?? [],
  })
}

export type CodAction = 'settle' | 'confirm-cash' | 'refund-shipper'

const runCodAction = (action: CodAction, orderId: number) =>
  action === 'settle'
    ? codSettlementService.settleCodOrder(orderId)
    : action === 'confirm-cash'
      ? codSettlementService.confirmShipperCashPayment(orderId)
      : codSettlementService.refundCodPrepaymentToShipper(orderId)

/** Đối soát / xác nhận tiền mặt / hoàn tiền shipper cho một đơn COD. */
export function useCodAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, orderId }: { action: CodAction; orderId: number }) =>
      runCodAction(action, orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.codPending() }),
  })
}

// ---- Khiếu nại & hoàn tiền ----

export function useDisputes() {
  return useQuery({
    queryKey: orderKeys.disputes(),
    queryFn: async () => (await returnService.getDisputes()).result ?? [],
  })
}

export function useDisputeAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number
      accept: boolean
      response: string
      refundAmount: number
    }) => returnService.adminAction(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.disputes() }),
  })
}

export function useCheckDisputePayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => returnService.checkPayoutStatus(id),
    onSuccess: (res) => {
      if (res.result?.request?.status === 'COMPLETED') {
        void queryClient.invalidateQueries({ queryKey: orderKeys.disputes() })
      }
    },
  })
}
