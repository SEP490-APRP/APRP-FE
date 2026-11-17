import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  reviewService,
  type ReviewResponse,
  type ReviewCreateRequest,
  type ReviewReplyRequest,
} from '@/services'

export const reviewKeys = {
  all: ['reviews'] as const,
  product: (productId: number) => [...reviewKeys.all, 'product', productId] as const,
  shop: (shopId: number) => [...reviewKeys.all, 'shop', shopId] as const,
  myShop: (page: number, size: number) => [...reviewKeys.all, 'my-shop', page, size] as const,
  shopReport: (shopId?: number) => [...reviewKeys.all, 'shop-report', shopId ?? 0] as const,
  my: ['reviews', 'my'] as const,
  admin: (page: number, size: number) => [...reviewKeys.all, 'admin', page, size] as const,
}

export function useProductReviews(productId: number | undefined) {
  return useQuery({
    queryKey: reviewKeys.product(productId ?? 0),
    queryFn: async () => (await reviewService.getByProductId(productId!)).result ?? [],
    enabled: productId != null && productId > 0,
  })
}

export function useShopReviews(shopId: number | undefined) {
  return useQuery({
    queryKey: reviewKeys.shop(shopId ?? 0),
    queryFn: async () => (await reviewService.getByShopId(shopId!)).result ?? [],
    enabled: shopId != null && shopId > 0,
  })
}

export function useMyShopReviews(page = 0, size = 10) {
  return useQuery({
    queryKey: reviewKeys.myShop(page, size),
    queryFn: async () => (await reviewService.getMyShopReviewsPaged(page, size)).result,
  })
}

export function useShopReport(shopId?: number) {
  return useQuery({
    queryKey: reviewKeys.shopReport(shopId),
    queryFn: async () => (await reviewService.getShopReport(shopId)).result,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReviewCreateRequest) => reviewService.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useReplyReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reviewId,
      request,
    }: {
      reviewId: number
      request: ReviewReplyRequest
    }) => reviewService.replyReview(reviewId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
  })
}

/** Thích / không thích một đánh giá; thay review đó trong mọi danh sách đang cache. */
export function useReactToReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reviewId,
      reaction,
    }: {
      reviewId: number
      reaction: 'LIKE' | 'DISLIKE'
    }) => reviewService.reactToReview(reviewId, reaction),
    onSuccess: (res, { reviewId }) => {
      const updated = res.result
      if (!updated) return
      queryClient.setQueriesData<ReviewResponse[]>({ queryKey: reviewKeys.all }, (list) =>
        list?.map((r) => (r.id === reviewId ? updated : r)),
      )
    },
  })
}
