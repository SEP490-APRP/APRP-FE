/**
 * Types cho Shop Order Processing
 * Mapping với BE OrderController + OrderResponse
 */

/** Toàn bộ trạng thái đơn hàng BE có thể trả về */
export type OrderStatus =
  | 'PENDING'           // Buyer vừa đặt (COD) — chờ shop xác nhận
  | 'PAID'              // Buyer đã thanh toán QR — chờ shop xác nhận
  | 'CONFIRMED'         // Shop đã xác nhận, đang chuẩn bị hàng
  | 'READY'             // Shop đóng gói xong, shipper có thể đến lấy
  | 'SHIPPING'          // Shipper đang giao
  | 'DELIVERED'         // Đã giao thành công
  | 'CANCELLED'         // Đã hủy
  | 'FAILED'            // Giao thất bại

/** Một sản phẩm trong đơn hàng */
export interface OrderItem {
  orderDetailId?: number
  productId?: number
  mysteryBoxId?: number
  productName?: string
  mysteryBoxType?: string
  quantity: number
  quantityKg?: number
  unitPrice: number
  pricePerKg?: number
  imageUrl?: string
  itemType: 'PRODUCT' | 'MYSTERY_BOX'
}

/** Thông tin shop gắn trong đơn hàng */
export interface OrderShopInfo {
  id?: number
  shopName?: string
  logoUrl?: string
}

/** Response đầy đủ của 1 đơn hàng từ BE */
export interface OrderResponse {
  id: number
  status: OrderStatus
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  paymentMethod: string
  note?: string
  totalAmount: number
  shippingFee?: number
  createdAt: string
  items: OrderItem[]
  shopOwner?: OrderShopInfo
}

/** Response khi BE trả về dạng page */
export interface OrderPageResponse {
  content: OrderResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

/** Params để fetch danh sách đơn có filter */
export interface FetchOrdersParams {
  page?: number
  size?: number
  statuses?: OrderStatus[]
}

// ── BUYER: Checkout types ─────────────────────────────────────────────────────

/** Một item trong đơn khi tạo order */
export interface OrderItemRequest {
  productId?: number
  mysteryBoxId?: number
  quantity: number
  quantityKg?: number
}

/** Request xem trước đơn hàng (tính phí, voucher...) */
export interface CheckoutPreviewRequest {
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note?: string
  paymentMethod: 'COD' | 'TRANSFER'
  voucherCodes?: string[]
  items: OrderItemRequest[]
}

/** Response xem trước — BE tính toán phí */
export interface CheckoutPreviewResponse {
  subtotal: number
  shippingFee: number
  discount: number
  totalAmount: number
  estimatedDelivery?: string
}

/** Request tạo đơn hàng thật */
export interface CreateOrderRequest {
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  note?: string
  paymentMethod: 'COD' | 'TRANSFER'
  voucherCodes?: string[]
  items: OrderItemRequest[]
}
