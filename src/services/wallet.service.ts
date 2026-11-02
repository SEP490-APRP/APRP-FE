import type { ApiResponse } from '@/types'
import axiosInstance from '@/services/api/axiosInstance'
import type {
  BackendDateTime,
  MyWalletResponse,
  OrderSettlementResponse,
  RefundDueResponse,
  SpringPage,
  WalletResponse,
  WalletTransactionResponse,
  WalletTransactionType,
  WithdrawRequestResponse,
} from './wallet.types'
import { mockWithdrawRequests } from '@/mocks/wallet.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './wallet.types'

async function getResult<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await axiosInstance.get<ApiResponse<T>>(url, { params })
  return (res as unknown as { data: ApiResponse<T> }).data.result as T
}

async function postResult<T>(url: string): Promise<T> {
  const res = await axiosInstance.post<ApiResponse<T>>(url)
  return (res as unknown as { data: ApiResponse<T> }).data.result as T
}

/** Ví và bảng chia tiền thật từ backend (WalletController) */
export const walletApi = {
  /** Ví của người đang đăng nhập: Shop, Shipper, hoặc ví sàn nếu là Admin */
  getMyWallet: () => getResult<MyWalletResponse>('/wallets/me'),
  getMyTransactions: (page = 0, size = 20) =>
    getResult<SpringPage<WalletTransactionResponse>>('/wallets/me/transactions', { page, size }),
  /** Shop / Shipper của đơn hoặc Admin. Đơn chưa COMPLETED trả số dự kiến (settled = false) */
  getOrderSettlement: (orderId: number) =>
    getResult<OrderSettlementResponse>(`/wallets/orders/${orderId}/settlement`),
  getPlatformWallet: () => getResult<MyWalletResponse>('/wallets/platform'),
  getPlatformTransactions: (page = 0, size = 20) =>
    getResult<SpringPage<WalletTransactionResponse>>('/wallets/platform/transactions', { page, size }),
  settleOrder: (orderId: number) => postResult<OrderSettlementResponse>(`/wallets/orders/${orderId}/settle`),
  getPendingCod: () => getResult<OrderSettlementResponse[]>('/wallets/cod/pending'),
  settleCod: (orderId: number) => postResult<OrderSettlementResponse>(`/wallets/cod/${orderId}/settle`),
  getRefundsDue: () => getResult<RefundDueResponse[]>('/wallets/refunds'),
}

/** Đổi ngày giờ backend (chuỗi ISO hoặc mảng Jackson) sang Date */
export function parseBackendDate(value: BackendDateTime): Date | null {
  if (!value) return null
  if (Array.isArray(value)) {
    const [y, m = 1, d = 1, h = 0, mi = 0, s = 0, ns = 0] = value
    return new Date(y, m - 1, d, h, mi, s, Math.floor(ns / 1_000_000))
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatBackendDate(value: BackendDateTime): string {
  const date = parseBackendDate(value)
  return date ? date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''
}

export function formatVnd(amount: number | null | undefined, withSign = false): string {
  const n = Number(amount ?? 0)
  const text = `${Math.abs(n).toLocaleString('vi-VN')} đ`
  if (n < 0) return `-${text}`
  return withSign && n > 0 ? `+${text}` : text
}

export const WALLET_TX_LABEL: Record<WalletTransactionType, string> = {
  SHOP_INCOME: 'Tiền hàng về ví',
  SHIPPER_INCOME: 'Cước giao hàng về ví',
  PLATFORM_FARMER_FEE: 'Phí dịch vụ nông dân',
  PLATFORM_SHIPPER_FEE: 'Phí dịch vụ shipper',
  PLATFORM_VOUCHER_SUBSIDY: 'Sàn bù voucher',
  PLATFORM_FREESHIP_SUBSIDY: 'Sàn bù freeship',
  COD_CASH_COLLECTED: 'Giữ tiền mặt COD',
  COD_CASH_REMITTED: 'Đã nộp tiền COD',
  SHOP_INCOME_HOLD: 'Tạm giữ tiền hàng',
  SHIPPER_INCOME_HOLD: 'Tạm giữ cước giao',
  PLATFORM_INCOME_HOLD: 'Tạm giữ phần sàn',
  HOLD_RELEASED: 'Mở tạm giữ (đơn hoàn tất)',
  HOLD_CANCELLED: 'Huỷ tạm giữ (đơn huỷ / thất bại)',
}

export const walletService = freshResponses({
  async getAllPendingWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: mockWithdrawRequests.filter((r) => r.status === 'PENDING') }
  },

  async getAllWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...mockWithdrawRequests] }
  },

  async getPlatformWallet(): Promise<ApiResponse<WalletResponse>> {
    const w = await walletApi.getPlatformWallet()
    return {
      code: 1000,
      result: {
        id: w.walletId,
        balance: w.balance,
        totalBalance: w.balance + (w.frozenBalance ?? 0),
        frozenBalance: w.frozenBalance ?? 0,
        totalWithdrawn: w.totalWithdrawn ?? 0,
        totalDeposited: w.totalRevenueAllTime ?? 0,
        commissionEarned: w.commissionEarned ?? 0,
      },
    }
  },

  async confirmTransfer(
    requestId: number,
    noteOrFiles?: any,
    files?: any,
  ): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 350))
    const target = mockWithdrawRequests.find((r) => r.id === requestId)
    if (target) {
      target.status = 'SUCCESS'
      if (typeof noteOrFiles === 'string') {
        target.adminNote = noteOrFiles
      }
      target.processedAt = new Date().toISOString()
    }
    return { code: 200, result: true, message: 'Đã giải ngân lệnh rút tiền thành công' }
  },

  async confirmWithdrawSuccess(
    requestId: number,
    noteOrFiles?: any,
    files?: any,
  ): Promise<ApiResponse<boolean>> {
    return this.confirmTransfer(requestId, noteOrFiles, files)
  },

  async createWithdrawQr(
    requestId: number,
  ): Promise<ApiResponse<{ qrCodeUrl: string; checkoutUrl?: string }>> {
    await new Promise((r) => setTimeout(r, 200))
    const target = mockWithdrawRequests.find((r) => r.id === requestId)
    const amount = target?.amount || 1000000
    const qrUrl = `https://img.vietqr.io/image/VCB-0011004321987-compact2.png?amount=${amount}&addInfo=CapNong%20RutTien%20${requestId}`
    return {
      code: 200,
      result: {
        qrCodeUrl: qrUrl,
        checkoutUrl: qrUrl,
      },
    }
  },

  async rejectWithdraw(
    requestId: number,
    note: string,
    _files?: File[],
  ): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 350))
    const target = mockWithdrawRequests.find((r) => r.id === requestId)
    if (target) {
      target.status = 'REJECTED'
      target.note = note
      target.adminNote = note
      target.processedAt = new Date().toISOString()
    }
    return { code: 200, result: true, message: 'Đã từ chối lệnh rút tiền' }
  },
})
