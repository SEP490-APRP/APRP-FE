import { useQuery } from '@tanstack/react-query'
import { campaignService, type CampaignPhase } from '@/services'

export const campaignKeys = {
  all: ['campaigns'] as const,
  active: (page: number, size: number) => [...campaignKeys.all, 'active', page, size] as const,
  list: (phase: CampaignPhase, page: number, size: number) => [...campaignKeys.all, 'list', phase, page, size] as const,
  detail: (id: number) => [...campaignKeys.all, 'detail', id] as const,
}

/** Chiến dịch đang mở bán. Lỗi mạng / BE chưa chạy thì trả rỗng để giao diện dùng nội dung mặc định. */
export function useActiveCampaigns(page = 0, size = 10) {
  return useQuery({
    queryKey: campaignKeys.active(page, size),
    queryFn: () => campaignService.getActiveCampaigns(page, size),
    staleTime: 60_000,
    retry: 1,
  })
}

/** Danh sách chiến dịch theo giai đoạn (bộ lọc trên trang /chien-dich) */
export function useCampaignsByPhase(phase: CampaignPhase, page = 0, size = 9) {
  return useQuery({
    queryKey: campaignKeys.list(phase, page, size),
    queryFn: () => campaignService.getCampaigns(phase, page, size),
    staleTime: 60_000,
    retry: 1,
  })
}

/** Chi tiết một chiến dịch (trang bài viết /chien-dich/:id) */
export function useCampaign(campaignId: number | null) {
  return useQuery({
    queryKey: campaignKeys.detail(campaignId ?? 0),
    queryFn: () => campaignService.getCampaign(campaignId as number),
    enabled: !!campaignId,
    staleTime: 30_000,
    retry: 1,
  })
}
