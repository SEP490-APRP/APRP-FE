import { useMutation } from '@tanstack/react-query'
import { cartService } from '@/services'

/**
 * Thêm sản phẩm/túi mù (id backend) vào giỏ qua API.
 * Lưu ý: giỏ trên giao diện (useCartStore) đang theo id catalog, chưa nhận các mục này.
 */
export function useAddToCart() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof cartService.addToCart>[0]) =>
      cartService.addToCart(payload),
  })
}
