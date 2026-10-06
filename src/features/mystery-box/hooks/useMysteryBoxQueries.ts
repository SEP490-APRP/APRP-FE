import { useQuery } from '@tanstack/react-query'
import { mysteryBoxService } from '@/services'

export const mysteryBoxKeys = {
  all: ['mystery-boxes'] as const,
  forBuyer: () => [...mysteryBoxKeys.all, 'for-buyer'] as const,
}

/** Túi mù đang bán của một shop. */
export function useShopMysteryBoxes(shopId: number) {
  return useQuery({
    queryKey: mysteryBoxKeys.forBuyer(),
    queryFn: async () => (await mysteryBoxService.getForBuyer()).result ?? [],
    select: (boxes) => boxes.filter((b) => b.shopOwnerId === shopId || b.shopId === shopId),
  })
}
