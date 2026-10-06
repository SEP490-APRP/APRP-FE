import type { ApiResponse } from '@/types'
import type { CodPendingOrderResponse } from './codSettlement.types'
import { mockCodOrders } from '@/mocks/codSettlement.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './codSettlement.types'

export function getCodCollectAmount(order: CodPendingOrderResponse): number {
  return order.codCollectAmount ?? order.collectAmount ?? order.totalAmount ?? 0
}

export function getCodPrepaidAmount(order: CodPendingOrderResponse): number {
  return (
    order.codPrepaidAmount ??
    order.prepaidAmount ??
    (order.totalAmount ? Math.round(order.totalAmount * 0.8) : 0)
  )
}

export const codSettlementService = freshResponses({
  async getPendingCodOrders(): Promise<ApiResponse<CodPendingOrderResponse[]>> {
    await new Promise((r) => setTimeout(r, 400))
    return { code: 200, result: [...mockCodOrders] }
  },

  async settleCodOrder(orderId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 400))
    const idx = mockCodOrders.findIndex((o) => o.id === orderId)
    if (idx !== -1) {
      mockCodOrders.splice(idx, 1)
    }
    return { code: 200, result: true, message: 'Đối soát COD thành công' }
  },

  async confirmShipperCashPayment(orderId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 400))
    const target = mockCodOrders.find((o) => o.id === orderId)
    if (target) {
      target.codPaymentStatus = 'PAID'
    }
    return { code: 200, result: true, message: 'Đã xác nhận tiền mặt COD' }
  },

  async refundCodPrepaymentToShipper(orderId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 400))
    const target = mockCodOrders.find((o) => o.id === orderId)
    if (target) {
      target.codPaymentStatus = 'REFUNDED'
    }
    return { code: 200, result: true, message: 'Đã hoàn tiền COD cho shipper' }
  },
})
