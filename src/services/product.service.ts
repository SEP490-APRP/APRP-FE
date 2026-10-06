import type { ApiResponse } from '@/types'
import type { ProductImageResponse, ProductResponse } from './product.types'
import { mockBuyerProducts, mockPendingProducts } from '@/mocks/product.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './product.types'

export const productService = freshResponses({
  async getAll(): Promise<ApiResponse<ProductResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...mockBuyerProducts] }
  },

  async getAllProducts(): Promise<ApiResponse<ProductResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...mockBuyerProducts] }
  },

  async getForBuyer(): Promise<ApiResponse<ProductResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...mockBuyerProducts] }
  },

  async getById(id: number): Promise<ApiResponse<ProductResponse | null>> {
    await new Promise((r) => setTimeout(r, 150))
    const found = mockBuyerProducts.find((p) => p.id === id)
    return { code: 200, result: found || null }
  },

  async getPendingProducts(): Promise<ApiResponse<ProductResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: mockPendingProducts.filter((p) => p.status === 'PENDING') }
  },

  async getImages(productId: number): Promise<ApiResponse<ProductImageResponse[]>> {
    await new Promise((r) => setTimeout(r, 100))
    const found = mockBuyerProducts.find((p) => p.id === productId)
    if (found?.images && found.images.length > 0) {
      return { code: 200, result: found.images }
    }
    return {
      code: 200,
      result: [
        {
          id: 1,
          imageUrl:
            found?.imageUrl ||
            'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80',
          isPrimary: true,
          displayOrder: 1,
        },
      ],
    }
  },

  async approveProduct(productId: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    const p = mockPendingProducts.find((item) => item.id === productId)
    if (p) p.status = 'APPROVED'
    return { code: 200, result: true, message: 'Duyệt sản phẩm thành công' }
  },

  async rejectProduct(productId: number, reason: string): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    const p = mockPendingProducts.find((item) => item.id === productId)
    if (p) {
      p.status = 'REJECTED'
      p.defectReason = reason
    }
    return { code: 200, result: true, message: 'Đã từ chối duyệt sản phẩm' }
  },
})
