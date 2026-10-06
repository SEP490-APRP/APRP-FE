export interface VoucherResponse {
  id?: number
  voucherCode: string
  voucherType?: 'SHOP' | 'PLATFORM'
  shopId?: number
  discountValue: number
  maxDiscount?: number
  minOrderValue?: number
  expiryDate?: string
  claimedCount?: number
  usageLimit?: number
}
