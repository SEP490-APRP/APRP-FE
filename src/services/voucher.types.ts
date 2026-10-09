export type VoucherType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'

export interface VoucherResponse {
  voucherId: number
  voucherCode: string
  voucherType: VoucherType
  discountValue: number
  maxDiscount?: number | null
  minOrderValue?: number | null
  claimLimit?: number | null
  claimedCount?: number | null
  usedCount?: number | null
  perUserLimit?: number | null
  active?: boolean
  expiryDate: string
  createAt?: string
  creatorRole?: string
  shopId?: number | null
  isPublic?: boolean
}

export interface VoucherCreateRequest {
  voucherCode: string
  voucherType: VoucherType
  discountValue: number
  maxDiscount?: number
  minOrderValue?: number
  claimLimit: number
  perUserLimit: number
  expiryDate: string
  isPublic?: boolean
}
