import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { referralService } from '@/services'
import type { ReferralLinkCreateRequest } from '@/services/referral.types'

export const referralKeys = {
  all: ['referral'] as const,
  links: (params?: { page?: number; size?: number }) => [...referralKeys.all, 'links', params] as const,
  dashboard: () => [...referralKeys.all, 'dashboard'] as const,
  commissions: (params?: { page?: number; size?: number }) => [...referralKeys.all, 'commissions', params] as const,
}

export function useMyReferralLinks(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: referralKeys.links(params),
    queryFn: () => referralService.getMyLinks(params),
    placeholderData: keepPreviousData,
  })
}

export function useReferralDashboard() {
  return useQuery({
    queryKey: referralKeys.dashboard(),
    queryFn: () => referralService.getDashboard(),
  })
}

export function useMyReferralCommissions(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: referralKeys.commissions(params),
    queryFn: () => referralService.getMyCommissions(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateReferralLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReferralLinkCreateRequest) => referralService.getOrCreateLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.all })
    },
  })
}

