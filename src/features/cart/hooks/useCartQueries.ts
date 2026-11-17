import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartService } from '@/services'
import { useUiStore, useAuthStore } from '@/stores'
import type { CartAddRequest, CartRemoveRequest, CartUpdateRequest } from '@/types/cart.types'

export const cartKeys = {
  all: ['cart'] as const,
}

export function useMyCart() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: () => cartService.getMyCart(),
    enabled: !!token,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CartAddRequest) => cartService.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể thêm sản phẩm vào giỏ hàng'
      useUiStore.getState().showToast(msg)
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CartUpdateRequest) => cartService.updateCartItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Số lượng trong kho không đủ để cập nhật'
      useUiStore.getState().showToast(msg)
    },
  })
}

export function useRemoveCartItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CartRemoveRequest) => cartService.removeCartItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
