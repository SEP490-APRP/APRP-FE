export interface WithdrawRequestResponse {
  id: number
  amount: number
  receiveAmount?: number
  status: 'PENDING' | 'SUCCESS' | 'REJECTED'
  walletType?: 'MEMBER' | 'SHIPPER' | 'SHOP' | 'BUYER'
  walletId?: number
  buyerId?: number
  shopOwnerId?: number
  shipperId?: number
  ownerName?: string | null
  ownerEmail?: string | null
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  createdAt: string
  processedAt?: string
  note?: string
  adminNote?: string
}

export interface WalletResponse {
  id: number
  balance: number
  totalBalance?: number
  frozenBalance: number
  totalWithdrawn: number
  totalDeposited: number
  commissionEarned: number
}

// ── Ví thật từ backend (/wallets) ────────────────────────────────────────────

/** Ngày giờ backend có thể trả dạng chuỗi ISO hoặc mảng [y, m, d, h, mi, s, ns] */
export type BackendDateTime = string | number[] | null | undefined

export type WalletType = 'SHOP' | 'SHIPPER' | 'PLATFORM' | 'REFERRAL'

export interface MyWalletResponse {
  walletId: number
  type: WalletType
  userId: number
  ownerName?: string
  status?: string
  /** Số dư hiện tại. Ví Shipper có thể âm khi đang giữ tiền mặt COD chưa nộp */
  balance: number
  frozenBalance: number
  totalRevenueAllTime: number
  totalWithdrawn: number
  /** Chỉ ví sàn */
  commissionEarned?: number | null
  /** Chỉ ví Shipper */
  codCashHolding?: number | null
  updatedAt?: BackendDateTime
}

export type WalletTransactionType =
  | 'SHOP_INCOME'
  | 'SHIPPER_INCOME'
  | 'PLATFORM_FARMER_FEE'
  | 'PLATFORM_SHIPPER_FEE'
  | 'PLATFORM_VOUCHER_SUBSIDY'
  | 'PLATFORM_FREESHIP_SUBSIDY'
  | 'COD_CASH_COLLECTED'
  | 'COD_CASH_REMITTED'
  | 'SHOP_INCOME_HOLD'
  | 'SHIPPER_INCOME_HOLD'
  | 'PLATFORM_INCOME_HOLD'
  | 'HOLD_RELEASED'
  | 'HOLD_CANCELLED'
  | 'WITHDRAW_REQUESTED'
  | 'WITHDRAW_REFUNDED'

export interface WalletTransactionResponse {
  id: number
  walletId: number
  walletType: WalletType
  orderId?: number | null
  type: WalletTransactionType
  /** Có dấu: dương = cộng ví, âm = trừ ví */
  amount: number
  /** Số dư rút được sau bút toán */
  balanceAfter: number
  /** Tiền tạm giữ sau bút toán */
  frozenAfter?: number | null
  /** true = bút toán tiền tạm giữ, không đổi số dư rút được */
  hold?: boolean
  description?: string
  createdAt?: BackendDateTime
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SettlementParty {
  userId?: number
  name?: string
}

/** Bảng chia tiền của 1 đơn: buyerPaid = shopReceive + shipperReceive + platformReceive */
export interface OrderSettlementResponse {
  orderId: number
  orderStatus?: string
  paymentMethod?: string
  settled: boolean
  settledAt?: BackendDateTime
  goodsAmount: number
  shippingFee: number
  shopVoucherDiscount: number
  platformVoucherDiscount: number
  platformFreeshipDiscount: number
  buyerPaid: number
  farmerFeeRate: number
  farmerFee: number
  shipperFeeRate: number
  shipperFee: number
  shop?: SettlementParty | null
  shopReceive: number
  shipper?: SettlementParty | null
  shipperReceive: number
  platformReceive: number
  codAmount?: number | null
  codCashCollectedAt?: BackendDateTime
  codSettled?: boolean | null
  codSettledAt?: BackendDateTime
  refundAmount?: number | null
  refundReason?: string | null
  transactions: WalletTransactionResponse[]
}

export interface RefundDueResponse {
  orderId: number
  buyerId?: number
  buyerName?: string
  buyerEmail?: string
  orderStatus?: string
  paymentMethod?: string
  totalAmount: number
  refundAmount: number
  refundReason?: string
  createdAt?: BackendDateTime
}

export type OverviewPeriod = 'TODAY' | '7D' | '30D' | 'ALL'

export interface PlatformOverviewPartner {
  userId: number
  walletId: number
  name: string
  role: 'SHOP' | 'SHIPPER'
  held: number
  balance: number
  pendingOrders: number
  codHolding?: number | null
}

/** GET /wallets/platform/overview */
export interface PlatformOverviewResponse {
  period: OverviewPeriod
  from?: BackendDateTime
  shopHeld: number
  shipperHeld: number
  shopHeldOrders: number
  shipperHeldOrders: number
  heldOrders: number
  farmerFee: number
  shipperFee: number
  commissionTotal: number
  platformBalance: number
  platformHeld: number
  voucherSubsidy: number
  freeshipSubsidy: number
  codPendingAmount: number
  codPendingOrders: number
  codPendingShippers: number
  codOldestCollectedAt?: BackendDateTime
  refundAmount: number
  refundOrders: number
  shopAvailable: number
  shipperAvailable: number
  settledGmv: number
  settledOrders: number
  partners: PlatformOverviewPartner[]
}

/** Trạng thái lệnh rút tiền ở backend */
export type WithdrawStatus = 'PENDING' | 'COMPLETED' | 'REJECTED'

/** Lệnh rút tiền thật từ backend (/wallets/withdrawals) */
export interface WithdrawResponse {
  id: number
  walletId: number
  walletType: WalletType
  userId: number
  ownerName?: string | null
  ownerEmail?: string | null
  amount: number
  fee: number
  receiveAmount: number
  status: WithdrawStatus
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  note?: string | null
  adminNote?: string | null
  adminName?: string | null
  createdAt: BackendDateTime
  processedAt?: BackendDateTime
}

export interface WithdrawCreateRequest {
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  amount: number
  note?: string
}
