import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mysteryBoxService, type MysteryBoxCreationRequest, type MysteryBoxUpdateRequest } from '@/services'

export const mysteryBoxKeys = {
  all: ['mystery-boxes'] as const,
  forBuyer: () => [...mysteryBoxKeys.all, 'for-buyer'] as const,
  shop: (shopId: number) => [...mysteryBoxKeys.all, 'shop', shopId] as const,
  myShop: (page = 1, size = 10) => [...mysteryBoxKeys.all, 'my-shop', page, size] as const,
}

/** Túi mù đang bán của một shop. */
export function useShopMysteryBoxes(shopId: number) {
  return useQuery({
    queryKey: mysteryBoxKeys.shop(shopId),
    queryFn: async () => {
      const page = await mysteryBoxService.getForBuyer({ shopId, size: 50 })
      const rawList = page?.content ?? (page as any)?.result?.content ?? []
      return rawList.map((box: any) => ({
        ...box,
        id: box.mysteryId ?? box.id,
        mysteryId: box.mysteryId ?? box.id,
      }))
    },
    select: (boxes) =>
      boxes.filter((b: any) =>
        b.shopId ? b.shopId === shopId : (b.shopOwnerId ? b.shopOwnerId === shopId : (b.shop?.id ? b.shop.id === shopId : true)),
      ),
  })
}

/** Danh sách túi mù của shop hiện tại (Nhà vườn) */
export function useMyMysteryBoxes(page = 1, size = 10) {
  return useQuery({
    queryKey: mysteryBoxKeys.myShop(page, size),
    queryFn: async () => (await mysteryBoxService.getMyMysteryBoxes(page, size)).result,
  })
}

/** Mutation tạo mới Túi Mù (gọi API thật BE POST /mystery-boxes) */
export function useCreateMysteryBox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MysteryBoxCreationRequest) => mysteryBoxService.createMysteryBox(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mysteryBoxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/** Mutation cập nhật Túi Mù (gọi API thật BE PUT /mystery-boxes/{id}) */
export function useUpdateMysteryBox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MysteryBoxUpdateRequest }) =>
      mysteryBoxService.updateMysteryBox(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mysteryBoxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/** Mutation bật/tắt Túi Mù (gọi API thật BE PATCH /mystery-boxes/{id}/status) */
export function useToggleMysteryBoxStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      mysteryBoxService.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mysteryBoxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/** Mutation xóa Túi Mù (gọi API thật BE DELETE /mystery-boxes/{id}) */
export function useDeleteMysteryBox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mysteryBoxService.deleteMysteryBox(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mysteryBoxKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

