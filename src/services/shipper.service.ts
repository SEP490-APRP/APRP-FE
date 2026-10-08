import axiosInstance from '@/services/api/axiosInstance'
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


function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object') {
    if ('data' in res && (res as { data: unknown }).data && typeof (res as { data: unknown }).data === 'object' && 'result' in (res as { data: { result: unknown } }).data) {
      return ((res as { data: ApiResponse<T> }).data).result as T
    }
    if ('result' in res) {
      return (res as ApiResponse<T>).result as T
    }
  }
  return res as T
}

export const shipperService = freshResponses({
  async getAvailableOrders(page = 0, size = 10): Promise<ApiResponse<PageResponse<AvailableOrderResponse>>> {
    try {
      const res = await axiosInstance.get('/orders/ready', { params: { page, size } })
      const data = unwrap<any>(res)
      if (data && data.content) {
        const content: AvailableOrderResponse[] = data.content.map((o: any) => ({
          orderId: o.orderId,
          orderCode: `ORDER-${o.orderId}`,
          shopName: o.shopName,
          shopAddress: o.shopAddress || 'Khu công nghệ cao, TP. Thủ Đức',
          shopLatitude: o.shopLatitude ?? 10.845,
          shopLongitude: o.shopLongitude ?? 106.775,
          recipientName: o.recipientName,
          recipientPhone: o.recipientPhone,
          shippingAddress: o.shippingAddress,
          shippingLatitude: o.shippingLatitude ?? 10.848,
          shippingLongitude: o.shippingLongitude ?? 106.772,
          totalAmount: o.totalAmount,
          codAmount: o.codAmount ?? (o.paymentMethod === 'COD' ? o.totalAmount : 0),
          codPrepaidAmount: o.codPrepaidAmount ?? 0,
          shippingFee: o.shippingFee,
          paymentMethod: o.paymentMethod,
          note: o.note,
          createdAt: o.createdAt,
          items: (o.items || []).map((it: any) => ({
            productName: it.itemName,
            quantity: it.quantity,
            price: it.unitPrice,
          })),
        }))
        return {
          code: 200,
          result: {
            page: data.number ?? page,
            size: data.size ?? size,
            totalElements: data.totalElements ?? content.length,
            totalPages: data.totalPages ?? 1,
            first: data.first ?? true,
            last: data.last ?? true,
            content,
          },
        }
      }
    } catch (err) {
      console.warn('Backend /orders/ready unreachable, fallback to mock data:', err)
    }

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
    try {
      const res = await axiosInstance.get('/orders/ready', { params: { page: 0, size: 20 } })
      const data = unwrap<any>(res)
      if (data && data.content && data.content.length > 0) {
        const content: AvailableOrderResponse[] = data.content.map((o: any) => ({
          orderId: o.orderId,
          orderCode: `ORDER-${o.orderId}`,
          shopName: o.shopName,
          shopAddress: o.shopAddress || 'Khu công nghệ cao, TP. Thủ Đức',
          recipientName: o.recipientName,
          recipientPhone: o.recipientPhone,
          shippingAddress: o.shippingAddress,
          totalAmount: o.totalAmount,
          codAmount: o.codAmount ?? (o.paymentMethod === 'COD' ? o.totalAmount : 0),
          shippingFee: o.shippingFee,
          paymentMethod: o.paymentMethod,
          createdAt: o.createdAt,
          items: (o.items || []).map((it: any) => ({
            productName: it.itemName,
            quantity: it.quantity,
            price: it.unitPrice,
          })),
        }))
        return { code: 200, result: content }
      }
    } catch (err) {
      console.warn('Fallback to mock nearby orders:', err)
    }
    return { code: 200, result: [...mockAvailableOrders] }
  },

  async getMyOrders(): Promise<ApiResponse<ShipperOrderResponse[]>> {
    try {
      const res = await axiosInstance.get('/orders/shipper/my')
      const data = unwrap<any>(res)
      const list = data?.content ?? (Array.isArray(data) ? data : null)
      if (list) {
        const result: ShipperOrderResponse[] = list.map((o: any) => ({
          orderId: o.orderId,
          orderCode: `ORDER-${o.orderId}`,
          status: o.status,
          shopName: o.shopName,
          shopAddress: o.shopAddress || 'Khu công nghệ cao, TP. Thủ Đức',
          recipientName: o.recipientName,
          recipientPhone: o.recipientPhone,
          shippingAddress: o.shippingAddress,
          totalAmount: o.totalAmount,
          codAmount: o.codAmount ?? (o.paymentMethod === 'COD' ? o.totalAmount : 0),
          shippingFee: o.shippingFee,
          paymentMethod: o.paymentMethod,
          note: o.note,
          createdAt: o.createdAt,
          items: (o.items || []).map((it: any) => ({
            productName: it.itemName,
            quantity: it.quantity,
            price: it.unitPrice,
          })),
        }))
        return { code: 200, result }
      }
    } catch (err) {
      console.warn('Backend /orders/shipper/my unreachable, fallback to mock:', err)
    }
    return { code: 200, result: [...myMockShippingOrders] }
  },

  async acceptOrder(orderId: number, codPaymentOption?: 'CASH' | 'WALLET'): Promise<ApiResponse<boolean>> {
    try {
      await axiosInstance.put(`/orders/${orderId}/ship`)
      return { code: 200, result: true, message: 'Nhận đơn thành công' }
    } catch (err) {
      console.warn('Backend /orders/:id/ship failed, using local update:', err)
    }
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
    try {
      if (payload.status === 'DELIVERED') {
        await axiosInstance.put(`/orders/${orderId}/deliver`)
      } else if (payload.status === 'FAILED') {
        await axiosInstance.put(`/orders/${orderId}/fail`)
      }
      return { code: 200, result: true, message: 'Cập nhật đơn hàng thành công' }
    } catch (err) {
      console.warn('Backend deliver/fail failed, using local update:', err)
    }
    const target = myMockShippingOrders.find((o) => o.orderId === orderId)
    if (target) {
      target.status = payload.status
      if (payload.note) target.note = payload.note
    }
    return { code: 200, result: true, message: 'Cập nhật đơn hàng thành công' }
  },
})
