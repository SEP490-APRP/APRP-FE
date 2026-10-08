import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderService, paymentService } from '@/services'
import type { CheckoutPreviewRequest, CreateOrderRequest } from '@/types/order.types'
import type { CreatePaymentRequest } from '@/types/payment.types'
import { cartKeys } from '@/features/cart/hooks/useCartQueries'

export const buyerOrderKeys = {
  detail: (id: number) => ['orders', 'detail', id] as const,
  payment: (orderCode: string) => ['payments', orderCode] as const,
}

export function useCheckoutPreview() {
  return useMutation({
    mutationFn: (data: CheckoutPreviewRequest) => orderService.previewCheckout(data),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => orderService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}

export function useOrderDetails(orderId: number) {
  return useQuery({
    queryKey: buyerOrderKeys.detail(orderId),
    queryFn: () => orderService.getOrderById(orderId),
    enabled: orderId > 0,
  })
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentService.createPayosPayment(data),
  })
}

export function useConfirmPayment() {
  return useMutation({
    mutationFn: (orderCode: string) => paymentService.confirmPayment(orderCode),
  })
}
