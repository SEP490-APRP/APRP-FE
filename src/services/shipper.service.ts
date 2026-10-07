import type { ApiResponse, PageResponse } from '@/types'
import { freshResponses } from '@/mocks/fresh'

export interface AvailableOrderResponse {
  orderId: number
  orderCode?: string
  shopName?: string
  shopAddress?: string
  shopLatitude?: number
  shopLongitude?: number
  recipientName?: string
  recipientPhone?: string
  shippingAddress?: string
  shippingLatitude?: number
  shippingLongitude?: number
  distanceKm?: number
  totalAmount?: number
  codAmount?: number
  codPrepaidAmount?: number
  shippingFee?: number
  paymentMethod?: string
  note?: string
  createdAt: string
  items?: Array<{
    productName: string
    quantity: number
    unit?: string
    price: number
  }>
}

export interface ShipperOrderResponse extends AvailableOrderResponse {
  status: 'ASSIGNED' | 'SHIPPING' | 'DELIVERED' | 'FAILED' | 'CANCELLED'
  codPaymentOption?: 'CASH' | 'WALLET'
  shippingDiscountAmount?: number
  refundAmount?: number
  refundReason?: string
  pickedUpAt?: string
  deliveredAt?: string
}

const mockAvailableOrders: AvailableOrderResponse[] = [
  {
    orderId: 501,
    orderCode: 'CN-SHP-501',
    shopName: 'Nông Trại Hữu Cơ Cầu Đất',
    shopAddress: '128 Đường Xuân Thọ, Đà Lạt, Lâm Đồng',
    shopLatitude: 10.8456,
    shopLongitude: 106.7758,
    recipientName: 'Nguyễn Văn Minh',
    recipientPhone: '0912 345 678',
    shippingAddress: '45 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức',
    shippingLatitude: 10.8485,
    shippingLongitude: 106.7725,
    distanceKm: 2.3,
    totalAmount: 285000,
    codAmount: 285000,
    codPrepaidAmount: 228000,
    shippingFee: 25000,
    paymentMethod: 'COD',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    items: [
      { productName: 'Cà chua bi hữu cơ 1kg', quantity: 2, unit: 'kg', price: 65000 },
      { productName: 'Khoai tây Đà Lạt túi 2kg', quantity: 1, unit: 'túi', price: 80000 },
    ],
  },
  {
    orderId: 502,
    orderCode: 'CN-SHP-502',
    shopName: 'Vườn Cam Hữu Cơ Cao Phong',
    shopAddress: 'Khu công nghệ cao, TP. Thủ Đức',
    shopLatitude: 10.852,
    shopLongitude: 106.785,
    recipientName: 'Trần Thị Thu Thảo',
    recipientPhone: '0988 234 567',
    shippingAddress: '88 Man Thiện, Hiệp Phú, TP. Thủ Đức',
    shippingLatitude: 10.849,
    shippingLongitude: 106.78,
    distanceKm: 1.1,
    totalAmount: 195000,
    codAmount: 0,
    codPrepaidAmount: 0,
    shippingFee: 20000,
    paymentMethod: 'ONLINE_VNPAY',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    items: [
      { productName: 'Cam sành hữu cơ loại 2 (5kg)', quantity: 1, unit: 'thùng', price: 175000 },
    ],
  },
  {
    orderId: 503,
    orderCode: 'CN-SHP-503',
    shopName: 'HTX Rau Quả Bảo Lộc',
    shopAddress: 'Xa lộ Hà Nội, Phước Long B, TP. Thủ Đức',
    shopLatitude: 10.838,
    shopLongitude: 106.765,
    recipientName: 'Phạm Hoàng Nam',
    recipientPhone: '0903 888 999',
    shippingAddress: '12 Đỗ Xuân Hợp, Phước Long B, TP. Thủ Đức',
    shippingLatitude: 10.835,
    shippingLongitude: 106.762,
    distanceKm: 3.5,
    totalAmount: 420000,
    codAmount: 420000,
    codPrepaidAmount: 336000,
    shippingFee: 30000,
    paymentMethod: 'COD',
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    items: [
      { productName: 'Combo Túi Mù 5 Bữa Nấu', quantity: 1, unit: 'combo', price: 199000 },
      { productName: 'Dưa lưới VietGAP ruột cam', quantity: 2, unit: 'quả', price: 95000 },
    ],
  },
]

let myMockShippingOrders: ShipperOrderResponse[] = [
  {
    orderId: 499,
    orderCode: 'CN-SHP-499',
    status: 'SHIPPING',
    shopName: 'Nông Trại Cầu Đất Farm',
    shopAddress: '128 Đường Xuân Thọ, Đà Lạt',
    shopLatitude: 10.845,
    shopLongitude: 106.775,
    recipientName: 'Đặng Ngọc Hương',
    recipientPhone: '0918 777 666',
    shippingAddress: '23 Đình Phong Phú, Tăng Nhơn Phú B, TP. Thủ Đức',
    shippingLatitude: 10.839,
    shippingLongitude: 106.771,
    distanceKm: 1.8,
    totalAmount: 310000,
    codAmount: 310000,
    codPrepaidAmount: 248000,
    codPaymentOption: 'WALLET',
    shippingFee: 25000,
    paymentMethod: 'COD',
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    items: [
      { productName: 'Thùng rau quả dinh dưỡng 5kg', quantity: 1, unit: 'thùng', price: 285000 },
    ],
  },
]

export const shipperService = freshResponses({
  async getAvailableOrders(page = 0, size = 10): Promise<ApiResponse<PageResponse<AvailableOrderResponse>>> {
    await new Promise((r) => setTimeout(r, 200))
    const totalElements = mockAvailableOrders.length
    const totalPages = Math.ceil(totalElements / size) || 1
    const content = mockAvailableOrders.slice(page * size, (page + 1) * size)
    return {
      code: 200,
      result: {
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
        content,
      },
    }
  },

  async getNearbyOrders(_lat: number, _lng: number): Promise<ApiResponse<AvailableOrderResponse[]>> {
    await new Promise((r) => setTimeout(r, 250))
    return { code: 200, result: [...mockAvailableOrders] }
  },

  async getMyOrders(): Promise<ApiResponse<ShipperOrderResponse[]>> {
    await new Promise((r) => setTimeout(r, 200))
    return { code: 200, result: [...myMockShippingOrders] }
  },

  async acceptOrder(orderId: number, codPaymentOption?: 'CASH' | 'WALLET'): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 300))
    const idx = mockAvailableOrders.findIndex((o) => o.orderId === orderId)
    if (idx !== -1) {
      const order = mockAvailableOrders[idx]
      mockAvailableOrders.splice(idx, 1)
      myMockShippingOrders.unshift({
        ...order,
        status: 'SHIPPING',
        codPaymentOption: codPaymentOption ?? 'WALLET',
      })
    }
    return { code: 200, result: true, message: 'Nhận đơn thành công' }
  },

  async updateOrderStatus(
    orderId: number,
    payload: { status: 'DELIVERED' | 'FAILED'; note?: string },
    _files?: File[],
  ): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 400))
    const target = myMockShippingOrders.find((o) => o.orderId === orderId)
    if (target) {
      target.status = payload.status
      if (payload.note) target.note = payload.note
    }
    return { code: 200, result: true, message: 'Cập nhật đơn hàng thành công' }
  },
})
