/**
 * Test cases cho Review Service (Frontend)
 * Chạy: npm run test:run -- src/services/review.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reviewService } from './review.service'

vi.mock('@/services/api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

import axiosInstance from '@/services/api/axiosInstance'

const mockAxios = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
}

const mockReview = {
  reviewId: 101,
  ratingStar: 5,
  comment: 'Sản phẩm rau củ rất tươi ngon!',
  evidence: 'https://res.cloudinary.com/demo/image1.jpg',
  replyFromShop: 'Cảm ơn bạn đã mua hàng',
  createdAt: '2026-10-24T08:00:00',
  likeCount: 3,
  dislikeCount: 0,
  currentUserReaction: 'LIKE' as const,
  buyerName: 'Nguyễn Văn A',
  productName: 'Cà chua VietGAP',
  shopName: 'Nông Trại Xanh',
}

describe('Review Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. getByProductId
  describe('getByProductId', () => {
    it('gọi đúng GET /reviews/product/:id và trả về mảng danh sách review', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          code: 1000,
          result: [mockReview],
        },
      })

      const res = await reviewService.getByProductId(50)
      expect(mockAxios.get).toHaveBeenCalledWith('/reviews/product/50')
      expect(res.code).toBe(200)
      expect(res.result).toHaveLength(1)
      expect(res.result[0].reviewId).toBe(101)
    })

    it('bắt lỗi và trả về mảng rỗng khi API bị lỗi', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      const res = await reviewService.getByProductId(50)
      expect(res.code).toBe(500)
      expect(res.result).toEqual([])
    })
  })

  // 2. getByProductIdPaged
  describe('getByProductIdPaged', () => {
    it('gọi GET /reviews/product/:id/paged với query params page và size', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          code: 1000,
          result: {
            content: [mockReview],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
          },
        },
      })

      const res = await reviewService.getByProductIdPaged(50, 0, 10)
      expect(mockAxios.get).toHaveBeenCalledWith('/reviews/product/50/paged', {
        params: { page: 0, size: 10 },
      })
      expect(res.result.content).toHaveLength(1)
      expect(res.result.totalElements).toBe(1)
    })
  })

  // 3. getByShopId & getMyShopReviewsPaged
  describe('Shop Reviews', () => {
    it('getByShopId gọi GET /reviews/shop/:shopId', async () => {
      mockAxios.get.mockResolvedValue({
        data: { code: 1000, result: [mockReview] },
      })

      const res = await reviewService.getByShopId(12)
      expect(mockAxios.get).toHaveBeenCalledWith('/reviews/shop/12')
      expect(res.result).toHaveLength(1)
    })

    it('getMyShopReviewsPaged gọi GET /reviews/my-shop với phân trang', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          code: 1000,
          result: { content: [mockReview], totalElements: 1 },
        },
      })

      const res = await reviewService.getMyShopReviewsPaged(1, 15)
      expect(mockAxios.get).toHaveBeenCalledWith('/reviews/my-shop', {
        params: { page: 1, size: 15 },
      })
      expect(res.result.content).toHaveLength(1)
    })
  })

  // 4. createReview
  describe('createReview', () => {
    it('gửi POST /reviews với body tạo review hợp lệ', async () => {
      const payload = {
        orderDetailId: 300,
        ratingStar: 5,
        comment: 'Tuyệt vời',
        imageUrls: ['https://example.com/img1.jpg'],
      }

      mockAxios.post.mockResolvedValue({
        data: { code: 1000, result: mockReview },
      })

      const res = await reviewService.createReview(payload)
      expect(mockAxios.post).toHaveBeenCalledWith('/reviews', payload)
      expect(res.code).toBe(200)
      expect(res.result.reviewId).toBe(101)
    })
  })

  // 5. replyReview
  describe('replyReview', () => {
    it('gửi POST /reviews/:id/reply khi Shop phản hồi khách hàng', async () => {
      const replyData = { replyFromShop: 'Cảm ơn quý khách đã tin tưởng nhà vườn!' }

      mockAxios.post.mockResolvedValue({
        data: {
          code: 1000,
          result: { ...mockReview, replyFromShop: replyData.replyFromShop },
        },
      })

      const res = await reviewService.replyReview(101, replyData)
      expect(mockAxios.post).toHaveBeenCalledWith('/reviews/101/reply', replyData)
      expect(res.code).toBe(200)
      expect(res.result.replyFromShop).toBe('Cảm ơn quý khách đã tin tưởng nhà vườn!')
    })
  })

  // 6. reactToReview
  describe('reactToReview', () => {
    it('gửi POST /reviews/:id/react với loại cảm xúc LIKE', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          code: 1000,
          result: { ...mockReview, currentUserReaction: 'LIKE', likeCount: 4 },
        },
      })

      const res = await reviewService.reactToReview(101, 'LIKE')
      expect(mockAxios.post).toHaveBeenCalledWith('/reviews/101/react', { reactionType: 'LIKE' })
      expect(res.result.currentUserReaction).toBe('LIKE')
      expect(res.result.likeCount).toBe(4)
    })
  })

  // 7. getShopReport
  describe('getShopReport', () => {
    it('gọi GET /reviews/shop/report khi không truyền shopId (lấy report của my-shop)', async () => {
      const mockReport = {
        averageRating: 4.8,
        totalReviewers: 50,
        fiveStarNumber: 40,
        fourStarNumber: 8,
        threeStarNumber: 2,
        twoStarNumber: 0,
        oneStarNumber: 0,
      }

      mockAxios.get.mockResolvedValue({
        data: { code: 1000, result: mockReport },
      })

      const res = await reviewService.getShopReport()
      expect(mockAxios.get).toHaveBeenCalledWith('/reviews/shop/report')
      expect(res.result.averageRating).toBe(4.8)
      expect(res.result.fiveStarNumber).toBe(40)
    })

    it('gọi GET /reviews/shop/:id/report khi truyền shopId cụ thể', async () => {
      const mockReport = {
        averageRating: 4.2,
        totalReviewers: 25,
        fiveStarNumber: 15,
        fourStarNumber: 5,
        threeStarNumber: 3,
        twoStarNumber: 1,
        oneStarNumber: 1,
      }

      mockAxios.get.mockResolvedValue({
        data: { code: 1000, result: mockReport },
      })

      const res = await reviewService.getShopReport(25)
      expect(mockAxios.get).toHaveBeenCalledWith('/reviews/shop/25/report')
      expect(res.result.averageRating).toBe(4.2)
    })
  })

  // 8. getAllReviewsAdmin
  describe('getAllReviewsAdmin', () => {
    it('gọi GET /reviews/admin với pagination cho chế độ giám sát của Admin', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          code: 1000,
          result: {
            content: [mockReview],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
          },
        },
      })

      const res = await reviewService.getAllReviewsAdmin(0, 20)
      expect(mockAxios.get).toHaveBeenCalledWith('/reviews/admin', {
        params: { page: 0, size: 20 },
      })
      expect(res.result.content).toHaveLength(1)
    })
  })
})
