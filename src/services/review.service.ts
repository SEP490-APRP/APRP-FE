import axiosInstance from '@/services/api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  ReviewResponse,
  ReviewCreateRequest,
  ReviewReplyRequest,
  ReviewShopReport,
} from './review.types'

export type * from './review.types'

function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if (
      'data' in res &&
      (res as { data: unknown }).data &&
      typeof (res as { data: unknown }).data === 'object' &&
      'result' in (res as { data: { result: unknown } }).data
    ) {
      return (res as { data: ApiResponse<T> }).data.result as T
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result as T
    }
  }
  return res as T
}

export const reviewService = {
  async getByProductId(productId: number): Promise<ApiResponse<ReviewResponse[]>> {
    try {
      const res = await axiosInstance.get(`/reviews/product/${productId}`)
      const result = unwrap<ReviewResponse[]>(res)
      return { code: 200, result: Array.isArray(result) ? result : [] }
    } catch {
      return { code: 500, result: [] }
    }
  },

  async getByProductIdPaged(
    productId: number,
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get(`/reviews/product/${productId}/paged`, {
      params: { page, size },
    })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },

  async getByShopId(shopId: number): Promise<ApiResponse<ReviewResponse[]>> {
    try {
      const res = await axiosInstance.get(`/reviews/shop/${shopId}`)
      const result = unwrap<ReviewResponse[]>(res)
      return { code: 200, result: Array.isArray(result) ? result : [] }
    } catch {
      return { code: 500, result: [] }
    }
  },

  async getByShopIdPaged(
    shopId: number,
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get(`/reviews/shop/${shopId}/paged`, {
      params: { page, size },
    })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },

  async getMyShopReviewsPaged(
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get('/reviews/my-shop', { params: { page, size } })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },

  async getByMysteryBoxId(mysteryBoxId: number): Promise<ApiResponse<ReviewResponse[]>> {
    try {
      const res = await axiosInstance.get(`/reviews/mystery-box/${mysteryBoxId}`)
      const result = unwrap<ReviewResponse[]>(res)
      return { code: 200, result: Array.isArray(result) ? result : [] }
    } catch {
      return { code: 500, result: [] }
    }
  },

  async getMyReviews(): Promise<ApiResponse<ReviewResponse[]>> {
    const res = await axiosInstance.get('/reviews/my')
    const result = unwrap<ReviewResponse[]>(res)
    return { code: 200, result: Array.isArray(result) ? result : [] }
  },

  async getMyReviewsPaged(
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get('/reviews/my/paged', { params: { page, size } })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },

  async createReview(data: ReviewCreateRequest): Promise<ApiResponse<ReviewResponse>> {
    const res = await axiosInstance.post('/reviews', data)
    return { code: 200, result: unwrap<ReviewResponse>(res) }
  },

  async replyReview(
    reviewId: number,
    request: ReviewReplyRequest,
  ): Promise<ApiResponse<ReviewResponse>> {
    const res = await axiosInstance.post(`/reviews/${reviewId}/reply`, request)
    return { code: 200, result: unwrap<ReviewResponse>(res) }
  },

  async reactToReview(
    reviewId: number,
    reactionType: 'LIKE' | 'DISLIKE',
  ): Promise<ApiResponse<ReviewResponse>> {
    const res = await axiosInstance.post(`/reviews/${reviewId}/react`, { reactionType })
    return { code: 200, result: unwrap<ReviewResponse>(res) }
  },

  async getShopReport(shopId?: number): Promise<ApiResponse<ReviewShopReport>> {
    const url = shopId ? `/reviews/shop/${shopId}/report` : '/reviews/shop/report'
    const res = await axiosInstance.get(url)
    return { code: 200, result: unwrap<ReviewShopReport>(res) }
  },

  async getMyShopReport(): Promise<ApiResponse<ReviewShopReport>> {
    const res = await axiosInstance.get('/reviews/shop/report')
    return { code: 200, result: unwrap<ReviewShopReport>(res) }
  },

  async getAllReviewsAdmin(
    page = 0,
    size = 20,
  ): Promise<ApiResponse<PageResponse<ReviewResponse>>> {
    const res = await axiosInstance.get('/reviews/admin', { params: { page, size } })
    return { code: 200, result: unwrap<PageResponse<ReviewResponse>>(res) }
  },
}
