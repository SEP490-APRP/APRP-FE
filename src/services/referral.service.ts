import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import type { PageResponse } from '@/types'
import type {
  ReferralCommissionResponse,
  ReferralLinkCreateRequest,
  ReferralLinkResponse,
  ReferralResolveResponse,
  ReferralStatsResponse,
} from './referral.types'

export type * from './referral.types'

export const referralService = {
  /** Tạo mới hoặc lấy link tiếp thị cho sản phẩm hoặc shop */
  async getOrCreateLink(data: ReferralLinkCreateRequest): Promise<ReferralLinkResponse> {
    const res = await axiosInstance.post('/referrals/links', data)
    return unwrap<ReferralLinkResponse>(res)
  },

  /** Danh sách link đã tạo của Buyer (0-based) */
  async getMyLinks(params?: { page?: number; size?: number }): Promise<PageResponse<ReferralLinkResponse>> {
    const res = await axiosInstance.get('/referrals/links/my', { params })
    return unwrap<PageResponse<ReferralLinkResponse>>(res)
  },

  /** Phân giải thông tin link referral công khai */
  async resolveLink(code: string): Promise<ReferralResolveResponse> {
    const res = await axiosInstance.get(`/referrals/resolve/${encodeURIComponent(code)}`)
    return unwrap<ReferralResolveResponse>(res)
  },

  /** Ghi nhận click từ client JS (public) */
  async trackClick(code: string): Promise<void> {
    await axiosInstance.post('/referrals/clicks', { referralCode: code })
  },

  /** Gắn mã pending của khách vào tài khoản sau login */
  async claimReferral(code: string): Promise<void> {
    await axiosInstance.post('/referrals/claim', { referralCode: code })
  },

  /** Thống kê hoa hồng của tôi */
  async getDashboard(): Promise<ReferralStatsResponse> {
    const res = await axiosInstance.get('/referrals/dashboard')
    return unwrap<ReferralStatsResponse>(res)
  },

  /** Lịch sử hoa hồng chi tiết (0-based) */
  async getMyCommissions(params?: { page?: number; size?: number }): Promise<PageResponse<ReferralCommissionResponse>> {
    const res = await axiosInstance.get('/referrals/commissions', { params })
    return unwrap<PageResponse<ReferralCommissionResponse>>(res)
  },
}

