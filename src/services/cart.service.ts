import type { ApiResponse } from '@/types'
import { freshResponses } from '@/mocks/fresh'

export const cartService = freshResponses({
  /**
   * Mock: chỉ trả thành công, KHÔNG ghi localStorage.
   * Giỏ hàng chỉ có một nơi ghi là useCartStore. Bản cũ ghi id backend ('701', 'box-3')
   * vào cùng key capnong-cart nhưng giỏ (theo id catalog như 'carrot') luôn ghi đè hoặc
   * loại bỏ chúng, nên sản phẩm thêm từ trang chi tiết/trang shop chưa bao giờ vào giỏ.
   * Cần ánh xạ id backend <-> id catalog (hoặc giỏ theo id backend) khi làm Checkout.
   */
  async addToCart(_payload: {
    productId?: number
    mysteryBoxId?: number
    quantity?: number
    quantityKg?: number
  }): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: true, message: 'Đã thêm vào giỏ hàng' }
  },
})
