import type { ApiResponse } from '@/types'
import type { CodPendingOrderResponse } from './codSettlement.types'
import type { BackendDateTime, OrderSettlementResponse } from './wallet.types'
import { parseBackendDate, walletApi } from './wallet.service'

export type * from './codSettlement.types'

export function isCodOrder(order: { paymentMethod?: string }): boolean {
  return (order.paymentMethod ?? '').toUpperCase() === 'COD'
}

export function getCodCollectAmount(order: {
  codCollectAmount?: number
  collectAmount?: number
  codAmount?: number
  totalAmount?: number
}): number {
  return order.codCollectAmount ?? order.collectAmount ?? order.codAmount ?? order.totalAmount ?? 0
}

export function getCodPrepaidAmount(order: {
  codPrepaidAmount?: number
  prepaidAmount?: number
  totalAmount?: number
}): number {
  return (
    order.codPrepaidAmount ??
    order.prepaidAmount ??
    (order.totalAmount ? Math.round(order.totalAmount * 0.8) : 0)
  )
}

function toIso(value: BackendDateTime): string | undefined {
  return parseBackendDate(value)?.toISOString()
}

/** Đổi bảng chia tiền của backend sang dạng dòng COD mà trang Đối soát COD đang dùng */
function toCodRow(s: OrderSettlementResponse): CodPendingOrderResponse {
  return {
    id: s.orderId,
    status: s.orderStatus,
    totalAmount: s.buyerPaid,
    shippingFee: s.shippingFee,
    codCollectAmount: s.codAmount ?? s.buyerPaid,
    codPrepaidAmount: 0,
    codPaymentStatus: s.codSettled ? 'SETTLED' : 'CONFIRMED',
    codPaymentOption: 'FULL_COD',
    deliveredAt: toIso(s.codCashCollectedAt),
    codSettled: !!s.codSettled,
    refundAmount: s.refundAmount ?? undefined,
    refundReason: s.refundReason ?? undefined,
    shipper: s.shipper?.userId ? { id: s.shipper.userId, fullName: s.shipper.name } : undefined,
    shop: s.shop?.userId ? { id: s.shop.userId, shopName: s.shop.name } : undefined,
    items: [],
  }
}

export const codSettlementService = {
  /** Đơn COD Shipper đã thu tiền mặt nhưng chưa nộp về sàn: GET /wallets/cod/pending */
  async getPendingCodOrders(): Promise<ApiResponse<CodPendingOrderResponse[]>> {
    const list = await walletApi.getPendingCod()
    return { code: 1000, result: list.map(toCodRow) }
  },

  /** Admin xác nhận Shipper đã nộp tiền mặt COD: POST /wallets/cod/{orderId}/settle */
  async settleCodOrder(orderId: number): Promise<ApiResponse<boolean>> {
    await walletApi.settleCod(orderId)
    return { code: 1000, result: true, message: 'Đối soát COD thành công' }
  },

  /** Luồng COD hiện tại: Shipper thu đủ tiền mặt, nộp về sàn 1 lần, nên xác nhận = đối soát */
  async confirmShipperCashPayment(orderId: number): Promise<ApiResponse<boolean>> {
    return this.settleCodOrder(orderId)
  },

  async refundCodPrepaymentToShipper(_orderId: number): Promise<ApiResponse<boolean>> {
    throw { status: 400, message: 'Backend chưa hỗ trợ ứng tiền COD trước cho shipper' }
  },
}
