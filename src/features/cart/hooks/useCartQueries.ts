import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartService } from '@/services'
import type { CartAddRequest, CartRemoveRequest, CartUpdateRequest } from '@/types/cart.types'

export const cartKeys = {
  all: ['cart'] as const,
}

export function useMyCart() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: () => cartService.getMyCart(),
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CartAddRequest) => cartService.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
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
