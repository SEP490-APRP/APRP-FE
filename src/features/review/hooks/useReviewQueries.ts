import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewService, type ReviewResponse } from '@/services'

export const reviewKeys = {
  all: ['reviews'] as const,
  product: (productId: number) => [...reviewKeys.all, 'product', productId] as const,
  shop: (shopId: number) => [...reviewKeys.all, 'shop', shopId] as const,
}

export function useProductReviews(productId: number | undefined) {
  return useQuery({
    queryKey: reviewKeys.product(productId ?? 0),
    queryFn: async () => (await reviewService.getByProductId(productId!)).result ?? [],
    enabled: productId != null,
  })
}

export function useShopReviews(shopId: number | undefined) {
  return useQuery({
    queryKey: reviewKeys.shop(shopId ?? 0),
    queryFn: async () => (await reviewService.getByShopId(shopId!)).result ?? [],
    enabled: shopId != null,
  })
}

/** Thích / không thích một đánh giá; thay review đó trong mọi danh sách đang cache. */
export function useReactToReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, reaction }: { reviewId: number; reaction: 'LIKE' | 'DISLIKE' }) =>
      reviewService.reactToReview(reviewId, reaction),
    onSuccess: (res, { reviewId }) => {
      const updated = res.result
      if (!updated) return
      queryClient.setQueriesData<ReviewResponse[]>({ queryKey: reviewKeys.all }, (list) =>
        list?.map((r) => (r.id === reviewId ? updated : r)),
      )
    },
  })
}
