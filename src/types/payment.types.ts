export interface CreatePaymentRequest {
  orderId?: number
  batchId?: number
  paymentGateway?: string
  returnUrl?: string
  cancelUrl?: string
}

export interface PaymentResponse {
  paymentId: number
  orderId?: number
  batchId?: number
  amount: number
  paymentGateway: string
  status: string
  payosOrderCode: string
  checkoutUrl?: string
  qrCodeUrl?: string
  createdAt?: string
}
