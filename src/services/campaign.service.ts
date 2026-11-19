import axiosInstance from '@/services/api/axiosInstance'
import type { AxiosResponse } from 'axios'
import { unwrap as unwrapRaw } from '@/services/api/apiUtils'
import type {
  CampaignPhase,
  FarmRegistrationRequest,
  FarmRegistrationResponse,
  CampaignResponse,
  CampaignPage, PreOrderCreateRequest, PreOrderResponse,
  CampaignIntakeRequest, CampaignUpsertRequest, CampaignBannerRequest, ShippingQuote, DispatchBoard, DamageClaim } from './campaign.types'

export type * from './campaign.types'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * BE (ObjectMapper tự khai báo) trả LocalDate/LocalDateTime dạng mảng [yyyy, M, d, H, m, s, nano].
 * Chuẩn hoá về chuỗi ISO local để `new Date()` / `Date.parse()` ở mọi màn chiến dịch hiểu đúng.
 */
function normalizeDates<T>(v: T): T {
  if (Array.isArray(v)) return v.map(normalizeDates) as T
  if (!v || typeof v !== 'object') return v
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (/(At|Date|By|Deadline)$/.test(k) && Array.isArray(val) && val.length >= 3 && val.every((x) => typeof x === 'number')) {
      const [y, mo, d, h, mi, se = 0] = val as number[]
      out[k] = h == null ? `${y}-${pad(mo)}-${pad(d)}` : `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi ?? 0)}:${pad(se)}`
    } else {
      out[k] = normalizeDates(val)
    }
  }
  return out as T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = <T,>(res: AxiosResponse<any>): T => normalizeDates(unwrapRaw<T>(res))

export const campaignService = {
  /** Chiến dịch đang mở bán (công khai, không cần đăng nhập) */
  async getActiveCampaigns(page = 0, size = 10): Promise<CampaignPage<CampaignResponse>> {
    return campaignService.getCampaigns('ONGOING', page, size)
  },

  /** Danh sách công khai theo giai đoạn: sắp mở / đang diễn ra / đang giao / đã hoàn thành */
  async getCampaigns(phase: CampaignPhase, page = 0, size = 10): Promise<CampaignPage<CampaignResponse>> {
    const res = await axiosInstance.get('/campaigns', { params: { phase, page, size } })
    return unwrap<CampaignPage<CampaignResponse>>(res)
  },

  async getCampaign(campaignId: number): Promise<CampaignResponse> {
    const res = await axiosInstance.get(`/campaigns/${campaignId}`)
    return unwrap<CampaignResponse>(res)
  },

  /** Người mua đặt thùng + nhận link cọc PayOS (checkoutUrl) */
  async createPreOrder(campaignId: number, body: PreOrderCreateRequest): Promise<PreOrderResponse> {
    const res = await axiosInstance.post(`/campaigns/${campaignId}/pre-orders`, body)
    return unwrap<PreOrderResponse>(res)
  },

  async getMyPreOrders(page = 0, size = 10): Promise<CampaignPage<PreOrderResponse>> {
    const res = await axiosInstance.get('/pre-orders/my', { params: { page, size } })
    return unwrap<CampaignPage<PreOrderResponse>>(res)
  },

  /** Báo hàng hư: số kg tự cân + ảnh cân / ảnh hàng (không cần hoàn hàng) */
  async reportDamage(preOrderId: number, body: { claimedKg: number; photoUrls: string[]; reason?: string }): Promise<DamageClaim> {
    return normalizeDates(unwrap<DamageClaim>(await axiosInstance.post(`/pre-orders/${preOrderId}/damage-claims`, body)))
  },

  async myDamageClaims(preOrderId: number): Promise<DamageClaim[]> {
    return normalizeDates(unwrap<DamageClaim[]>(await axiosInstance.get(`/pre-orders/${preOrderId}/damage-claims`)))
  },

  async cancelPreOrder(preOrderId: number): Promise<PreOrderResponse> {
    const res = await axiosInstance.post(`/pre-orders/${preOrderId}/cancel`)
    return unwrap<PreOrderResponse>(res)
  },

  /** Báo giá phí giao trước khi đặt (công khai) */
  async quoteShipping(
    campaignId: number,
    params: { totalKg: number; method: 'DELIVERY' | 'PICKUP'; lat?: number; lng?: number; address?: string },
  ): Promise<ShippingQuote> {
    const res = await axiosInstance.get(`/campaigns/${campaignId}/shipping-quote`, { params })
    return unwrap<ShippingQuote>(res)
  },

  async confirmDepositPayment(preOrderId: number): Promise<PreOrderResponse> {
    const res = await axiosInstance.post(`/pre-orders/${preOrderId}/confirm-payment`)
    return unwrap<PreOrderResponse>(res)
  },

  /* ───── Nhà vườn (shop) ───── */

  /** Chiến dịch đang kêu gọi nhà vườn góp hàng */
  async getOpenFarmCalls(): Promise<CampaignResponse[]> {
    const res = await axiosInstance.get('/shop/campaigns/calls')
    return unwrap<CampaignResponse[]>(res)
  },

  /** Đăng ký lô hàng (sản phẩm, số kg, ảnh, giá đề xuất, cam kết, thời gian bảo quản) */
  async registerFarm(campaignId: number, body: FarmRegistrationRequest): Promise<FarmRegistrationResponse> {
    const res = await axiosInstance.post(`/shop/campaigns/${campaignId}/register`, body)
    return unwrap<FarmRegistrationResponse>(res)
  },

  async getMyRegistrations(): Promise<FarmRegistrationResponse[]> {
    const res = await axiosInstance.get('/shop/campaigns/my')
    return unwrap<FarmRegistrationResponse[]>(res)
  },
}

/** Admin vận hành chiến dịch: /admin/campaigns/* (chỉ ROLE_ADMIN) */
export const adminCampaignService = {
  async list(status?: string, page = 0, size = 50): Promise<CampaignPage<CampaignResponse>> {
    const res = await axiosInstance.get('/admin/campaigns', { params: { status: status || undefined, page, size } })
    return unwrap(res)
  },
  async get(id: number): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}`))
  },
  async create(body: CampaignUpsertRequest): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.post('/admin/campaigns', body))
  },
  /** Sửa chiến dịch (BE chỉ cho sửa khi còn ở trạng thái Chuẩn bị) */
  async update(id: number, body: CampaignUpsertRequest): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.put(`/admin/campaigns/${id}`, body))
  },
  async registrations(id: number): Promise<FarmRegistrationResponse[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/registrations`))
  },
  async preOrders(id: number): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/pre-orders`))
  },
  async damageClaims(id: number): Promise<DamageClaim[]> {
    return normalizeDates(unwrap<DamageClaim[]>(await axiosInstance.get(`/admin/campaigns/${id}/damage-claims`)))
  },
  async approveDamage(claimId: number, approvedKg?: number, note?: string): Promise<DamageClaim> {
    return normalizeDates(unwrap<DamageClaim>(await axiosInstance.post(`/admin/campaigns/damage-claims/${claimId}/approve`, { approvedKg, note })))
  },
  async rejectDamage(claimId: number, note: string): Promise<DamageClaim> {
    return normalizeDates(unwrap<DamageClaim>(await axiosInstance.post(`/admin/campaigns/damage-claims/${claimId}/reject`, { note })))
  },
  async approve(registrationId: number, agreedPricePerKg?: number, note?: string): Promise<FarmRegistrationResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/registrations/${registrationId}/approve`, { agreedPricePerKg, note }))
  },
  async reject(registrationId: number, note?: string): Promise<FarmRegistrationResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/registrations/${registrationId}/reject`, { note }))
  },
  async intake(registrationId: number, body: CampaignIntakeRequest): Promise<FarmRegistrationResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/registrations/${registrationId}/intake`, body))
  },
  /** Bảng chia đơn giao theo phường, xếp theo độ gấp */
  async dispatchBoard(id: number): Promise<DispatchBoard> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/dispatch-board`))
  },
  /** Đưa đơn đã đóng gói ra hub; có shipperId thì giao thẳng cho shipper đó */
  async dispatch(id: number, preOrderIds: number[], shipperId?: number): Promise<DispatchBoard> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/dispatch`, { preOrderIds, shipperId }))
  },
  /** Đơn giao thất bại -> chờ chia lại */
  async retry(preOrderId: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/retry`))
  },
  /** Khách tự đến điểm tập kết đã nhận hàng */
  async confirmPickup(preOrderId: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/picked-up`))
  },
  /** Tuỳ chỉnh banner trang chủ của chiến dịch */
  async updateBanner(id: number, body: CampaignBannerRequest): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.put(`/admin/campaigns/${id}/banner`, body))
  },
  /** Gửi thông báo nhắc khách tự đến lấy (đơn đã đóng gói) */
  async remindPickup(preOrderId: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/remind-pickup`))
  },
  /** Khách không đến lấy sau khi đã nhắc: đơn thất bại, mất cọc */
  async pickupNoShow(preOrderId: number, note?: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/pickup-no-show`, { note }))
  },
  async pack(preOrderId: number, deliveryZone?: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/pack`, { deliveryZone }))
  },
  /** call | publish | start-fulfilling | resolve-shortfall | dispatch-to-hub | complete | cancel */
  async action(id: number, action: string, note?: string): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/${action}`, note ? { note } : undefined))
  },
}

/** Shipper nhận và giao đơn chiến dịch tại hub: /shipper/pre-orders/* */
export const shipperPreOrderService = {
  /** Đơn tại hub chưa có ai nhận (xếp theo độ gấp) */
  async ready(): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.get('/shipper/pre-orders/ready'))
  },
  /** Đơn đã giao cho tôi / tôi đang giao */
  async mine(): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.get('/shipper/pre-orders/my'))
  },
  async accept(id: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/accept`))
  },
  async deliver(id: number, podImageUrl?: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/deliver`, { podImageUrl }))
  },
  async fail(id: number, reason: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/fail`, { reason }))
  },
}
