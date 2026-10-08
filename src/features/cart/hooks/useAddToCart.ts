import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartService } from '@/services'
import { cartKeys } from './useCartQueries'

/**
 * Thêm sản phẩm/túi mù (id backend) vào giỏ qua API.
 * Tự động làm mới cache ['cart'] để cập nhật số lượng và danh sách giỏ hàng ngay lập tức.
 */
export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof cartService.addToCart>[0]) =>
      cartService.addToCart(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
