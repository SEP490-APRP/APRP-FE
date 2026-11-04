import type { ApiResponse } from '@/types'
import axiosInstance from '@/services/api/axiosInstance'
import type {
  BackendDateTime,
  MyWalletResponse,
  OrderSettlementResponse,
  OverviewPeriod,
  PlatformOverviewResponse,
  RefundDueResponse,
  SpringPage,
  WalletResponse,
  WalletTransactionResponse,
  WalletTransactionType,
  WithdrawCreateRequest,
  WithdrawRequestResponse,
  WithdrawResponse,
  WithdrawStatus,
} from './wallet.types'
import { freshResponses } from '@/mocks/fresh'

export type * from './wallet.types'

async function getResult<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await axiosInstance.get<ApiResponse<T>>(url, { params })
  return (res as unknown as { data: ApiResponse<T> }).data.result as T
}

async function postResult<T>(url: string, body?: unknown): Promise<T> {
  const res = await axiosInstance.post<ApiResponse<T>>(url, body)
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
  getPlatformOverview: (period: OverviewPeriod = '30D') =>
    getResult<PlatformOverviewResponse>('/wallets/platform/overview', { period }),
  getPlatformTransactions: (page = 0, size = 20) =>
    getResult<SpringPage<WalletTransactionResponse>>('/wallets/platform/transactions', { page, size }),
  settleOrder: (orderId: number) => postResult<OrderSettlementResponse>(`/wallets/orders/${orderId}/settle`),
  getPendingCod: () => getResult<OrderSettlementResponse[]>('/wallets/cod/pending'),
  settleCod: (orderId: number) => postResult<OrderSettlementResponse>(`/wallets/cod/${orderId}/settle`),
  getRefundsDue: () => getResult<RefundDueResponse[]>('/wallets/refunds'),
  /** Shop / Shipper / Buyer gửi lệnh rút tiền; số dư bị trừ ngay, chờ Admin chuyển khoản */
  requestWithdraw: (body: WithdrawCreateRequest) => postResult<WithdrawResponse>('/wallets/withdrawals', body),
  getMyWithdrawals: () => getResult<WithdrawResponse[]>('/wallets/withdrawals/me'),
  /** Admin: danh sách lệnh rút (lọc theo trạng thái nếu có) */
  getWithdrawals: (status?: WithdrawStatus) =>
    getResult<WithdrawResponse[]>('/wallets/withdrawals', status ? { status } : undefined),
  approveWithdraw: (id: number, note?: string) =>
    postResult<WithdrawResponse>(`/wallets/withdrawals/${id}/approve`, { note }),
  rejectWithdraw: (id: number, note?: string) =>
    postResult<WithdrawResponse>(`/wallets/withdrawals/${id}/reject`, { note }),
}

/** Số tiền rút tối thiểu mỗi lần (khớp capnong.wallet.min-withdraw ở backend) */
export const MIN_WITHDRAW_AMOUNT = 50_000

/** Ngân hàng phổ biến; code dùng cho ảnh VietQR */
export const VN_BANKS: { code: string; name: string }[] = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'SEAB', name: 'SeABank' },
]

function bankCodeOf(bankName: string): string {
  const key = bankName.trim().toLowerCase()
  const hit = VN_BANKS.find((b) => b.name.toLowerCase() === key || b.code.toLowerCase() === key)
  return hit?.code ?? bankName.replace(/\s+/g, '')
}

export const WITHDRAW_STATUS_LABEL: Record<WithdrawStatus, string> = {
  PENDING: 'Chờ duyệt',
  COMPLETED: 'Đã chuyển khoản',
  REJECTED: 'Bị từ chối',
}

/** Thông báo lỗi tiếng Việt theo mã lỗi backend */
export function withdrawErrorMessage(err: unknown): string {
  const e = err as { data?: { code?: number }; response?: { data?: { code?: number } }; code?: number }
  const code = e?.data?.code ?? e?.response?.data?.code ?? e?.code
  switch (code) {
    case 16007: return `Số tiền rút tối thiểu là ${MIN_WITHDRAW_AMOUNT.toLocaleString('vi-VN')} đ`
    case 16008: return 'Số dư khả dụng không đủ để rút số tiền này'
    case 16009: return 'Thông tin ngân hàng chưa hợp lệ (STK 6–20 chữ số)'
    case 16010: return 'Không tìm thấy lệnh rút tiền'
    case 16011: return 'Lệnh rút tiền này đã được xử lý'
    default: return (err as { message?: string })?.message || 'Không gửi được yêu cầu rút tiền'
  }
}

/** Đổi lệnh rút backend sang dạng màn Admin đang dùng */
function toLegacyWithdraw(w: WithdrawResponse): WithdrawRequestResponse {
  return {
    id: w.id,
    amount: Number(w.amount),
    receiveAmount: Number(w.receiveAmount),
    status: w.status === 'COMPLETED' ? 'SUCCESS' : w.status,
    walletType: w.walletType === 'REFERRAL' ? 'BUYER' : (w.walletType as 'SHOP' | 'SHIPPER'),
    walletId: w.walletId,
    buyerId: w.walletType === 'REFERRAL' ? w.userId : undefined,
    shopOwnerId: w.walletType === 'SHOP' ? w.userId : undefined,
    shipperId: w.walletType === 'SHIPPER' ? w.userId : undefined,
    ownerName: w.ownerName,
    ownerEmail: w.ownerEmail,
    bankName: w.bankName,
    bankAccountNumber: w.bankAccountNumber,
    bankAccountName: w.bankAccountHolder,
    createdAt: parseBackendDate(w.createdAt)?.toISOString() ?? '',
    processedAt: parseBackendDate(w.processedAt)?.toISOString(),
    note: w.note ?? undefined,
    adminNote: w.adminNote ?? undefined,
  }
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
  WITHDRAW_REQUESTED: 'Rút tiền về ngân hàng',
  WITHDRAW_REFUNDED: 'Hoàn tiền (lệnh rút bị từ chối)',
}

export const walletService = freshResponses({
  async getAllPendingWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    const list = await walletApi.getWithdrawals('PENDING')
    return { code: 1000, result: (list ?? []).map(toLegacyWithdraw) }
  },

  async getAllWithdrawRequests(): Promise<ApiResponse<WithdrawRequestResponse[]>> {
    const list = await walletApi.getWithdrawals()
    return { code: 1000, result: (list ?? []).map(toLegacyWithdraw) }
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

  /** Admin đã chuyển khoản xong: chốt lệnh rút (COMPLETED) */
  async confirmTransfer(
    requestId: number,
    noteOrFiles?: string | File[],
    _files?: File[],
  ): Promise<ApiResponse<boolean>> {
    const note = typeof noteOrFiles === 'string' ? noteOrFiles : undefined
    await walletApi.approveWithdraw(requestId, note)
    return { code: 1000, result: true, message: 'Đã xác nhận chuyển khoản thành công' }
  },

  async confirmWithdrawSuccess(
    requestId: number,
    noteOrFiles?: string | File[],
    files?: File[],
  ): Promise<ApiResponse<boolean>> {
    return this.confirmTransfer(requestId, noteOrFiles, files)
  },

  /** Ảnh VietQR tới tài khoản ngân hàng người rút, để Admin quét chuyển khoản */
  async createWithdrawQr(
    requestId: number,
  ): Promise<ApiResponse<{ qrCodeUrl: string; checkoutUrl?: string }>> {
    const list = await walletApi.getWithdrawals('PENDING')
    const target = (list ?? []).find((r) => r.id === requestId)
    if (!target) throw new Error('Không tìm thấy lệnh rút tiền đang chờ')
    const params = new URLSearchParams({
      amount: String(Math.round(Number(target.receiveAmount))),
      addInfo: `CapNong RutTien ${requestId}`,
      accountName: target.bankAccountHolder,
    })
    const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankCodeOf(target.bankName))}-${encodeURIComponent(target.bankAccountNumber)}-compact2.png?${params}`
    return { code: 1000, result: { qrCodeUrl: qrUrl, checkoutUrl: qrUrl } }
  },

  /** Từ chối: backend hoàn tiền về ví người rút */
  async rejectWithdraw(
    requestId: number,
    note: string,
    _files?: File[],
  ): Promise<ApiResponse<boolean>> {
    await walletApi.rejectWithdraw(requestId, note)
    return { code: 1000, result: true, message: 'Đã từ chối lệnh rút tiền và hoàn tiền về ví' }
  },
})
