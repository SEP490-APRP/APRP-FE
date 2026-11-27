import axiosInstance from '@/services/api/axiosInstance'
import type { AxiosResponse } from 'axios'
import { unwrap as unwrapRaw } from '@/services/api/apiUtils'
import type {
  CampaignPhase,
  FarmRegistrationRequest,
  FarmRegistrationResponse,
  CampaignResponse,
  CampaignPage, PreOrderCreateRequest, PreOrderResponse,
  CampaignIntakeRequest, CampaignUpsertRequest, CampaignBannerRequest, ShippingQuote, DispatchBoard, DamageClaim,
  CampaignShopRow, AdminFarmRegistrationRequest, AdminSupplementRequest, PackageTrace, HomeBannerConfig, DeliveryHub, DeliveryHubRequest, HubTrip, HubTripSyncRequest, HubFeeConfig, ShipperCallResult, ShipperCapacity, ShortfallPreview } from './campaign.types'

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
    if (/(At|Date|By|Deadline|Before)$/.test(k) && Array.isArray(val) && val.length >= 3 && val.every((x) => typeof x === 'number')) {
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
  /** Công khai: thông tin thùng hàng theo mã trên tem QR */
  async trace(token: string): Promise<PackageTrace> {
    // Thử trên điện thoại cùng Wi-Fi: trang mở bằng IP của máy mà API cấu hình localhost thì gọi API qua cùng IP đó
    const api = axiosInstance.defaults.baseURL ?? ''
    const page = window.location.hostname
    const baseURL = page !== 'localhost' && page !== '127.0.0.1' ? api.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, `//${page}`) : api
    return unwrap(await axiosInstance.get(`/trace/${encodeURIComponent(token)}`, { baseURL }))
  },
  /** Chiến dịch đang mở bán (công khai, không cần đăng nhập) */
  async getActiveCampaigns(page = 0, size = 10): Promise<CampaignPage<CampaignResponse>> {
    return campaignService.getCampaigns('ONGOING', page, size)
  },

  /** Danh sách công khai theo giai đoạn: sắp mở / đang diễn ra / đang giao / đã hoàn thành */
  async getCampaigns(phase: CampaignPhase, page = 0, size = 10): Promise<CampaignPage<CampaignResponse>> {
    const res = await axiosInstance.get('/campaigns', { params: { phase, page, size } })
    return unwrap<CampaignPage<CampaignResponse>>(res)
  },

  /** Banner đầu trang chủ do Admin chọn (chỉ chiến dịch người dùng đang xem được) */
  async getHomeBanners(): Promise<HomeBannerConfig> {
    return unwrap<HomeBannerConfig>(await axiosInstance.get('/campaigns/home-banners'))
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

  /** Đăng ký lô hàng (sản phẩm, số kg, ảnh, cam kết, thời gian bảo quản); giá theo chiến dịch */
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
  /** Banner đầu trang chủ: danh sách chiến dịch đang gắn + số giây tự chuyển */
  async homeBanners(): Promise<HomeBannerConfig> {
    return unwrap(await axiosInstance.get('/admin/campaigns/home-banners'))
  },
  async saveHomeBanners(intervalSeconds: number, campaignIds: number[]): Promise<HomeBannerConfig> {
    return unwrap(await axiosInstance.put('/admin/campaigns/home-banners', { intervalSeconds, campaignIds }))
  },
  async registrations(id: number): Promise<FarmRegistrationResponse[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/registrations`))
  },
  /** Shop đã xác minh quanh điểm tập kết của chiến dịch */
  async nearbyShops(id: number, radiusKm: number, sameCategory: boolean): Promise<CampaignShopRow[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/nearby-shops`, { params: { radiusKm, sameCategory } }))
  },
  /** Tìm shop theo tên / số điện thoại */
  async searchShops(id: number, q: string): Promise<CampaignShopRow[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/shop-search`, { params: { q } }))
  },
  /** Gửi lời mời góp hàng, trả số shop đã mời */
  async inviteShops(id: number, shopIds: number[], message?: string): Promise<number> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/invite-shops`, { shopIds, message }))
  },
  /** Nhập hộ lô hàng cho shop đã đồng ý góp (duyệt luôn) */
  async addRegistration(id: number, body: AdminFarmRegistrationRequest): Promise<FarmRegistrationResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/registrations`, body))
  },
  /** Các đơn đã đóng gói cần dán tem QR (máy chủ cấp mã tem nếu chưa có) */
  async packageLabels(id: number): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/package-labels`))
  },
  /** Nhận thêm hàng cho phần còn thiếu */
  async supplement(id: number, body: AdminSupplementRequest): Promise<FarmRegistrationResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/supplement`, body))
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
  async approve(registrationId: number, note?: string): Promise<FarmRegistrationResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/registrations/${registrationId}/approve`, { note }))
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
  /** Đưa đơn đã đóng gói ra hub; có shipperId thì giao thẳng cho shipper đó; hubId bỏ trống = hub gần khách nhất */
  async dispatch(id: number, preOrderIds: number[], shipperId?: number, hubId?: number, direct?: boolean): Promise<DispatchBoard> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/dispatch`, { preOrderIds, shipperId, hubId, direct }))
  },
  /** Gửi thông báo kêu gọi shipper nhận chuyến giao (ngày cần xe, số chuyến, chi tiết từng hub); trả số shipper đã báo */
  async callShippers(
    id: number,
    body: {
      pickupDate?: string
      vehiclesNeeded?: number
      totalKg?: number
      message?: string
      shipperIds?: number[]
      /** Gọi xe riêng cho một hub */
      hubName?: string
      /** Tổng số xe của cả kế hoạch (mọi hub) */
      totalVehicles?: number
      /** true = báo phân công xe cho tài xế đã chọn */
      assignment?: boolean
      vehicleKg?: number
      /** Sức chở tối thiểu của xe để nhận kêu gọi (chuyến nhỏ nhất); xe nhỏ hơn không được gửi */
      minVehicleKg?: number
    },
  ): Promise<ShipperCallResult> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/shipper-call`, body))
  },
  /** Thông số tính cước (xe ra hub, giao chặng cuối) để ước tính chi phí */
  async hubFeeConfig(): Promise<HubFeeConfig> {
    return unwrap(await axiosInstance.get('/admin/campaigns/hub-trip-fee-config'))
  },
  /** Đơn giao thất bại -> chờ chia lại */
  async retry(preOrderId: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/retry`))
  },
  /** Nhắc shipper tới nhận các đơn còn chờ tại một hub; trả số shipper đã báo */
  async notifyHubShippers(id: number, hubId: number, shipperIds: number[]): Promise<number> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/hub-orders/notify`, { hubId, shipperIds }))
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
  async pack(preOrderId: number, deliveryZone?: string, hubId?: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/pack`, { deliveryZone, hubId }))
  },
  /** Đánh dấu thùng đã đóng; đủ mọi thùng thì đơn đóng gói xong */
  async markCrates(preOrderId: number, crates: number[]): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/admin/campaigns/pre-orders/${preOrderId}/crates`, { crates }))
  },
  /** call | publish | start-fulfilling | complete | cancel */
  /** Đơn sẽ bị bớt thùng hoặc huỷ nếu chốt phần thiếu (chốt bằng action 'resolve-shortfall') */
  async previewShortfall(id: number): Promise<ShortfallPreview> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/shortfall-preview`))
  },
  async action(id: number, action: string, note?: string): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/${action}`, note ? { note } : undefined))
  },
}

/** Xe chở hàng ra hub của chiến dịch (admin): xem tài xế đã nhận, đồng bộ / chốt kế hoạch xe */
export const adminHubTripService = {
  async list(campaignId: number): Promise<HubTrip[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${campaignId}/hub-trips`))
  },
  async sync(campaignId: number, body: HubTripSyncRequest): Promise<HubTrip[]> {
    return unwrap(await axiosInstance.put(`/admin/campaigns/${campaignId}/hub-trips`, body))
  },
}

/** Tài xế nhận chuyến chở hàng ra hub: /shipper/hub-trips/* */
export const shipperHubTripService = {
  /** Chuyến chưa có tài xế (đang kêu gọi) */
  async open(): Promise<HubTrip[]> {
    return unwrap(await axiosInstance.get('/shipper/hub-trips/open'))
  },
  async mine(): Promise<HubTrip[]> {
    return unwrap(await axiosInstance.get('/shipper/hub-trips/my'))
  },
  async accept(id: number): Promise<HubTrip> {
    return unwrap(await axiosInstance.put(`/shipper/hub-trips/${id}/accept`))
  },
  /** Không nhận chuyến đang chờ (vẫn nhận lại được nếu chưa ai nhận) */
  async decline(id: number): Promise<HubTrip> {
    return unwrap(await axiosInstance.put(`/shipper/hub-trips/${id}/decline`))
  },
  /** Trả chuyến để người khác nhận (chỉ khi chưa lấy hàng) */
  async release(id: number): Promise<HubTrip> {
    return unwrap(await axiosInstance.put(`/shipper/hub-trips/${id}/release`))
  },
  /** Đánh dấu các thùng của một đơn đã nhận lên xe */
  async loadBoxes(id: number, orderId: number, loaded: number[]): Promise<HubTrip> {
    return unwrap(await axiosInstance.put(`/shipper/hub-trips/${id}/boxes`, { orderId, loaded }))
  },
  /** Đã lấy hàng tại điểm tập kết, bắt đầu chở ra hub */
  async start(id: number, photoUrl: string): Promise<HubTrip> {
    return unwrap(await axiosInstance.put(`/shipper/hub-trips/${id}/start`, { photoUrl }))
  },
  /** Đã giao hàng của một hub trên lộ trình */
  async arriveStop(id: number, hubId: number, photoUrl: string): Promise<HubTrip> {
    return unwrap(await axiosInstance.put(`/shipper/hub-trips/${id}/stops/${hubId}/arrive`, { photoUrl }))
  },
}

/** Điểm trung chuyển (hub): /admin/hubs (chỉ ROLE_ADMIN) */
export const adminHubService = {
  /** Hub xác nhận đã nhận hàng; trả về số đơn vừa xác nhận */
  async receive(hubId: number, preOrderIds: number[]): Promise<number> {
    return unwrap(await axiosInstance.put(`/admin/hubs/${hubId}/orders/receive`, { preOrderIds }))
  },
  async reportIssue(hubId: number, preOrderId: number, body: { crates: number; note: string }): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/admin/hubs/${hubId}/orders/${preOrderId}/issue`, body))
  },
  /** Hàng chiến dịch ở một hub kèm mã QR thùng */
  async orders(hubId: number): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.get(`/admin/hubs/${hubId}/orders`))
  },
  async list(activeOnly = false): Promise<DeliveryHub[]> {
    return unwrap(await axiosInstance.get('/admin/hubs', { params: { activeOnly } }))
  },
  async create(body: DeliveryHubRequest): Promise<DeliveryHub> {
    return unwrap(await axiosInstance.post('/admin/hubs', body))
  },
  async update(id: number, body: DeliveryHubRequest): Promise<DeliveryHub> {
    return unwrap(await axiosInstance.put(`/admin/hubs/${id}`, body))
  },
  /** Ngưng dùng hub (không xoá, đơn cũ vẫn trỏ tới) */
  async deactivate(id: number): Promise<DeliveryHub> {
    return unwrap(await axiosInstance.delete(`/admin/hubs/${id}`))
  },
}

/** Shipper nhận và giao đơn chiến dịch tại hub: /shipper/pre-orders/* */
export const shipperPreOrderService = {
  /** Xe chở được bao nhiêu, đang chở bao nhiêu, ví còn ký quỹ được bao nhiêu */
  async capacity(): Promise<ShipperCapacity> {
    return unwrap(await axiosInstance.get('/shipper/pre-orders/capacity'))
  },
  /** Nhận một lần nhiều đơn cùng hub thành chuyến giao */
  async acceptBatch(preOrderIds: number[]): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.put('/shipper/pre-orders/accept-batch', { preOrderIds }))
  },
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
  /** Đã kiểm đủ thùng tại hub, bắt đầu giao */
  async pickup(id: number, crates: number[]): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/pickup`, { crates }))
  },
  /** Bỏ nhận đơn chưa lấy khỏi hub */
  async release(id: number): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/release`))
  },
  async deliver(id: number, podImageUrl?: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/deliver`, { podImageUrl }))
  },
  async fail(id: number, reason: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.put(`/shipper/pre-orders/${id}/fail`, { reason }))
  },
}
