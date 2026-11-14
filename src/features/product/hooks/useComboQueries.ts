import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { comboService, type BuildComboCreationRequest, type BuildComboUpdateRequest } from '@/services'

export const comboKeys = {
  all: ['combos'] as const,
  list: (params?: any) => [...comboKeys.all, 'list', params] as const,
  shop: (shopId: number) => [...comboKeys.all, 'shop', shopId] as const,
  myShop: (params?: any) => [...comboKeys.all, 'my-shop', params] as const,
  detail: (id: number) => [...comboKeys.all, 'detail', id] as const,
}

export function useCombos(params?: any) {
  return useQuery({
    queryKey: comboKeys.list(params),
    queryFn: async () => (await comboService.getCombos(params)).result,
  })
}

/** Danh sách combo của một nhà vườn cụ thể */
export function useShopCombos(shopId: number) {
  return useQuery({
    queryKey: comboKeys.shop(shopId),
    queryFn: async () => {
      const page = await comboService.getCombos({ shopId, status: 'ACTIVE', size: 50 })
      const rawList = page?.content ?? (page as any)?.result?.content ?? []
      return rawList.map((c: any) => ({
        ...c,
        id: c.comboId ?? c.id,
        comboId: c.comboId ?? c.id,
      }))
    },
    select: (combos) =>
      combos.filter((c: any) =>
        c.shop?.id ? c.shop.id === shopId : (c.shopId ? c.shopId === shopId : true),
      ),
  })
}

export function useMyCombos(params?: { status?: string; mealType?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: comboKeys.myShop(params),
    queryFn: async () => (await comboService.getMyCombos(params)).result,
  })
}

export function useCreateCombo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BuildComboCreationRequest) => comboService.createCombo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comboKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateCombo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BuildComboUpdateRequest }) =>
      comboService.updateCombo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comboKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteCombo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => comboService.deleteCombo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comboKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

