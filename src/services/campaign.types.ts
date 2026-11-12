/** Kiểu dữ liệu chiến dịch giải cứu (khớp DTO BE_CapNong: CampaignResponse, PreOrderResponse) */

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'THRESHOLD_MET' | 'FULFILLING' | 'COMPLETED' | 'CANCELLED'

/** Giai đoạn hiển thị công khai (tham số ?phase= của GET /campaigns) */
export type CampaignPhase = 'UPCOMING' | 'ONGOING' | 'DELIVERING' | 'DONE'

export type CrateSize = 'KG_10' | 'KG_20' | 'KG_50'

export interface CampaignResponse {
  campaignId: number
  code: string
  title: string
  description?: string | null
  categoryId?: number | null
  categoryName?: string | null
  season?: string | null
  coverImageUrl?: string | null
  targetVolumeKg: number
  minThresholdKg: number
  rescuePricePerKg: number
  /** 0-1, vd 0.3 = 30% */
  depositPercent: number
  cutoffAt: string
  deliveryDate?: string | null
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
  collectionSiteLatitude?: number | null
  collectionSiteLongitude?: number | null
  status: CampaignStatus
  bookedVolumeKg: number
  remainingVolumeKg: number
  /** 0-100 */
  progressPercent: number
  approvedSurplusKg: number
  approvedFarmCount: number
  /** Số lô đã duyệt (một nhà vườn có thể góp nhiều lô) */
  approvedLotCount?: number
  pendingFarmCount: number
  /** Cung - cầu khi gom hàng (có từ THRESHOLD_MET) */
  soldVolumeKg?: number | null
  acceptedVolumeKg?: number | null
  packedVolumeKg?: number | null
  shortfallVolumeKg?: number | null
  intakePendingCount?: number
  evaluatedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  publishedAt?: string | null
  callPostedAt?: string | null
  createdAt?: string | null
}

export interface CampaignPage<T> {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  content: T[]
}

export interface PreOrderCreateRequest {
  crateSize: CrateSize
  crateQuantity: number
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  shippingLatitude?: number
  shippingLongitude?: number
  note?: string
}

export interface PreOrderResponse {
  preOrderId: number
  code: string
  campaignId: number
  campaignTitle: string
  campaignStatus: CampaignStatus
  crateSize: CrateSize
  crateKg: number
  crateQuantity: number
  totalKg: number
  unitPrice: number
  totalAmount: number
  depositAmount: number
  remainingAmount: number
  buyerName?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  shippingAddress?: string | null
  deliveryZone?: string | null
  qrCode?: string | null
  shipperName?: string | null
  cancelReason?: string | null
  failReason?: string | null
  /** Số thùng ban đầu, chỉ có khi đơn bị giảm thùng do thiếu hàng */
  originalCrateQuantity?: number | null
  /** Tiền cọc đã hoàn do thiếu hàng */
  shortfallRefundAmount?: number | null
  depositPaidAt?: string | null
  status: 'PENDING' | 'DEPOSIT_PAID' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'FAILED'
  depositStatus?: 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED_TO_FARMER' | 'REFUNDED' | 'CANCELLED' | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  createdAt?: string | null
}

/* ─────────────── Nhà vườn (shop) đăng ký lô hàng vào chiến dịch ─────────────── */

/** Thời gian bảo quản lô hàng sau thu hoạch */
export type ShelfLifeTier = 'DAYS_1_2' | 'DAYS_3_4' | 'DAYS_5_6'

export type FarmRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface FarmRegistrationRequest {
  surplusVolumeKg: number
  /** yyyy-MM-dd */
  harvestDate: string
  note?: string
  productId?: number
  productName: string
  productImageUrls: string[]
  proposedPricePerKg: number
  priceCommitted: boolean
  shelfLifeTier: ShelfLifeTier
}

export interface FarmRegistrationResponse {
  registrationId: number
  campaignId: number
  campaignTitle: string
  campaignStatus: CampaignStatus
  campaignCutoffAt: string
  collectionSiteName?: string | null
  collectionSiteAddress?: string | null
  deliveryDate?: string | null
  shopId: number
  shopName?: string | null
  shopPhone?: string | null
  surplusVolumeKg: number
  harvestDate: string
  note?: string | null
  productId?: number | null
  productName?: string | null
  productImageUrls: string[]
  proposedPricePerKg?: number | null
  agreedPricePerKg?: number | null
  effectivePricePerKg?: number | null
  campaignPricePerKg?: number | null
  priceCommitted?: boolean | null
  shelfLifeTier?: ShelfLifeTier | null
  status: FarmRegistrationStatus
  reviewNote?: string | null
  reviewedAt?: string | null
  allocatedVolumeKg?: number | null
  receivedWeightKg?: number | null
  /** Kg hư hỏng bị loại khi kiểm */
  rejectedWeightKg?: number | null
  /** Kg đạt chuẩn = cân - hư */
  acceptedWeightKg?: number | null
  /** Kg được tính tiền = min(đạt chuẩn, phân bổ) */
  countedWeightKg?: number | null
  /** Kg thiếu so với phân bổ */
  shortfallKg?: number | null
  qualityPassed?: boolean | null
  intakePhotoUrls: string[]
  intakeNote?: string | null
  intakeAt?: string | null
  payoutAmount?: number | null
  paidOutAt?: string | null
  createdAt?: string | null
}

/* ─────────────── Admin vận hành chiến dịch ─────────────── */

export interface CampaignUpsertRequest {
  title: string
  description?: string
  season?: string
  coverImageUrl?: string
  targetVolumeKg: number
  minThresholdKg: number
  rescuePricePerKg: number
  depositPercent: number
  /** yyyy-MM-ddTHH:mm:ss */
  cutoffAt: string
  deliveryDate?: string
  collectionSiteName?: string
  collectionSiteAddress?: string
  collectionSiteLatitude?: number
  collectionSiteLongitude?: number
}

export interface CampaignIntakeRequest {
  /** Tổng kg cân thực tế */
  receivedWeightKg: number
  /** Kg hư hỏng bị loại */
  rejectedWeightKg?: number
  qualityPassed?: boolean
  photoUrls?: string[]
  note?: string
}
