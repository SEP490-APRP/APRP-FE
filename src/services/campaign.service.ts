import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type {
  CampaignPhase,
  FarmRegistrationRequest,
  FarmRegistrationResponse,
  CampaignResponse,
  CampaignPage, PreOrderCreateRequest, PreOrderResponse,
  CampaignIntakeRequest, CampaignUpsertRequest } from './campaign.types'

export type * from './campaign.types'

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

  async cancelPreOrder(preOrderId: number): Promise<PreOrderResponse> {
    const res = await axiosInstance.post(`/pre-orders/${preOrderId}/cancel`)
    return unwrap<PreOrderResponse>(res)
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
  async registrations(id: number): Promise<FarmRegistrationResponse[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/registrations`))
  },
  async preOrders(id: number): Promise<PreOrderResponse[]> {
    return unwrap(await axiosInstance.get(`/admin/campaigns/${id}/pre-orders`))
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
  async pack(preOrderId: number, deliveryZone?: string): Promise<PreOrderResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/pre-orders/${preOrderId}/pack`, { deliveryZone }))
  },
  /** call | publish | start-fulfilling | resolve-shortfall | dispatch-to-hub | complete | cancel */
  async action(id: number, action: string, note?: string): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.post(`/admin/campaigns/${id}/${action}`, note ? { note } : undefined))
  },
}
