import axiosInstance from '@/services/api/axiosInstance'
import type { AxiosResponse } from 'axios'
import { unwrap as unwrapRaw } from '@/services/api/apiUtils'
import type { CampaignResponse, CampaignUpsertRequest } from './campaign.types'
import type { CampaignProposal, CampaignProposalRequest, NearbyShop } from './campaignProposal.types'

export type * from './campaignProposal.types'

const pad = (n: number) => String(n).padStart(2, '0')

/** BE trả LocalDate/LocalDateTime dạng mảng [yyyy, M, d, H, m, s] -> chuỗi ISO local */
function normalizeDates<T>(v: T): T {
  if (Array.isArray(v)) return v.map(normalizeDates) as T
  if (!v || typeof v !== 'object') return v
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (/(At|From|To)$/.test(k) && Array.isArray(val) && val.length >= 3 && val.every((x) => typeof x === 'number')) {
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

const SHOP = '/shop/campaign-proposals'
const ADMIN = '/admin/campaign-proposals'

/** Shop đề xuất mở chiến dịch giải cứu, mời shop lân cận; admin duyệt / gộp thành 1 chiến dịch */
export const campaignProposalService = {
  async create(body: CampaignProposalRequest): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(SHOP, body))
  },
  async update(id: number, body: CampaignProposalRequest): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.put(`${SHOP}/${id}`, body))
  },
  async get(id: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.get(`${SHOP}/${id}`))
  },
  async getMine(): Promise<CampaignProposal[]> {
    return unwrap(await axiosInstance.get(`${SHOP}/my`))
  },
  async getInvites(): Promise<CampaignProposal[]> {
    return unwrap(await axiosInstance.get(`${SHOP}/invites`))
  },
  async nearbyShops(id: number, radiusKm: number, sameCategory = false): Promise<NearbyShop[]> {
    return unwrap(await axiosInstance.get(`${SHOP}/${id}/nearby-shops`, { params: { radiusKm, sameCategory } }))
  },
  async invite(id: number, shopIds: number[], message?: string): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/${id}/invites`, { shopIds, message }))
  },
  async removeMember(id: number, shopId: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.delete(`${SHOP}/${id}/members/${shopId}`))
  },
  async submit(id: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/${id}/submit`))
  },
  async withdraw(id: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/${id}/withdraw`))
  },
  async acceptInvite(memberId: number, estimatedKg: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/invites/${memberId}/accept`, { estimatedKg }))
  },
  async declineInvite(memberId: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${SHOP}/invites/${memberId}/decline`))
  },

  // ── Admin ──
  async adminList(status?: string): Promise<CampaignProposal[]> {
    return unwrap(await axiosInstance.get(ADMIN, { params: status ? { status } : {} }))
  },
  async adminGet(id: number): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.get(`${ADMIN}/${id}`))
  },
  /** Duyệt 1 đơn hoặc gộp nhiều đơn gần nhau thành 1 chiến dịch nháp */
  async approve(proposalIds: number[], campaign: CampaignUpsertRequest, note?: string): Promise<CampaignResponse> {
    return unwrap(await axiosInstance.post(`${ADMIN}/approve`, { proposalIds, campaign, note }))
  },
  async requestChanges(id: number, note: string): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${ADMIN}/${id}/request-changes`, { note }))
  },
  async reject(id: number, note: string): Promise<CampaignProposal> {
    return unwrap(await axiosInstance.post(`${ADMIN}/${id}/reject`, { note }))
  },
}
