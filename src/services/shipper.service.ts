import axiosInstance from '@/services/api/axiosInstance'
import { unwrap } from '@/services/api/apiUtils'
import { uploadService } from '@/services/upload.service'
import type { ApiResponse, PageResponse } from '@/types'

export interface AvailableOrderResponse {
  orderId: number
  orderCode?: string
  shopName?: string
  shopAddress?: string
  shopPhone?: string
  shopLatitude?: number
  shopLongitude?: number
  recipientName?: string
  recipientPhone?: string
  shippingAddress?: string
  shippingLatitude?: number
  shippingLongitude?: number
  /** Quãng đường nhà vườn → khách (km) */
  distanceKm?: number
  /** Quãng đường từ vị trí shipper tới nhà vườn (km), chỉ có ở danh sách đơn mới */
  distanceToShopKm?: number | null
  totalAmount?: number
  /** Tiền mặt thu của khách (đơn COD) */
  codAmount?: number
  /** @deprecated Mô hình cũ "ứng COD". Giữ để tương thích UI cũ, luôn 0 */
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

export type ShipperOrderStatus = 'SHIPPING' | 'PICKED_UP' | 'DELIVERED' | 'FAILED' | 'CANCELLED' | 'COMPLETED'

export interface ShipperOrderResponse extends AvailableOrderResponse {
  status: ShipperOrderStatus
  /** @deprecated Bỏ lựa chọn trả tiền mặt; COD luôn ký quỹ bằng ví */
  codPaymentOption?: 'CASH' | 'WALLET'
  /** Số tiền COD đã ký quỹ trong ví khi nhận đơn */
  codReservedAmount?: number | null
  shippingDiscountAmount?: number
  refundAmount?: number
  refundReason?: string
  pickedUpAt?: string
  deliveredAt?: string
}

export interface ShipperStatusResponse {
  isOnline: boolean
  latitude?: number
  longitude?: number
  updatedAt?: string
}

/** Lý do giao thất bại, khớp enum DeliveryFailReason ở BE */
export type DeliveryFailReason = 'KHONG_LIEN_LAC_DUOC' | 'SAI_DIA_CHI' | 'KHACH_TU_CHOI' | 'KHAC'

export interface FailOrderRequest {
  reason: DeliveryFailReason
  note?: string
  callAttempts?: number
  proofImageUrls: string[]
}

/** Số cuộc gọi tối thiểu trước khi được báo "không liên lạc được" */
export const MIN_FAIL_CALL_ATTEMPTS = 3

/** Số ảnh bằng chứng tối đa mỗi lần xác nhận */
export const MAX_PROOF_IMAGES = 5

/** Đơn backend (OrderResponse) → dạng dùng ở màn shipper */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toShipperOrder(o: any): ShipperOrderResponse {
  return {
    orderId: o.orderId,
    orderCode: `ORDER-${o.orderId}`,
    status: o.status,
    shopName: o.shopName,
    shopAddress: o.shopAddress,
    shopPhone: o.shopPhone,
    shopLatitude: o.shopLatitude,
    shopLongitude: o.shopLongitude,
    recipientName: o.recipientName,
    recipientPhone: o.recipientPhone,
    shippingAddress: o.shippingAddress,
    shippingLatitude: o.shippingLatitude,
    shippingLongitude: o.shippingLongitude,
    distanceKm: o.distanceKm,
    distanceToShopKm: o.distanceToShopKm,
    totalAmount: o.totalAmount,
    // codAmount = 0 (chưa thu tiền) thì lấy tổng tiền đơn
    codAmount: o.paymentMethod === 'COD' ? o.codAmount || o.totalAmount || 0 : 0,
    codPrepaidAmount: 0,
    codReservedAmount: o.codReservedAmount,
    shippingFee: o.shippingFee,
    paymentMethod: o.paymentMethod,
    note: o.note,
    createdAt: o.createdAt,
    pickedUpAt: o.pickedUpAt,
    deliveredAt: o.deliveredAt,
    refundAmount: o.refundAmount,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (o.items || []).map((it: any) => ({
      productName: it.itemName,
      quantity: it.quantity,
      price: it.unitPrice,
    })),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPage<T>(data: any, map: (o: unknown) => T, page: number, size: number): PageResponse<T> {
  const content = (data?.content ?? []).map(map)
  return {
    page: data?.number ?? page,
    size: data?.size ?? size,
    totalElements: data?.totalElements ?? content.length,
    totalPages: data?.totalPages ?? 1,
    first: data?.first ?? true,
    last: data?.last ?? true,
    content,
  }
}

/**
 * Luồng giao hàng của Shipper. Mọi lỗi API được ném ra nguyên vẹn (ApiError có data.code)
 * để màn hình báo đúng lý do; không còn dữ liệu mock.
 */
export const shipperService = {
  /**
   * Đơn READY chưa có người nhận trong bán kính quanh shipper, gần nhất trước.
   * Bắt buộc đang trực tuyến (BE trả 7006 nếu chưa).
   */
  async getAvailableOrders(
    page = 0,
    size = 10,
    coords?: { lat: number; lng: number } | null,
  ): Promise<ApiResponse<PageResponse<AvailableOrderResponse>>> {
    const res = await axiosInstance.get('/orders/ready', {
      params: { page, size, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) },
    })
    return { code: 1000, result: toPage(unwrap(res), toShipperOrder, page, size) }
  },

  async getNearbyOrders(lat: number, lng: number): Promise<ApiResponse<AvailableOrderResponse[]>> {
    const res = await shipperService.getAvailableOrders(0, 20, { lat, lng })
    return { code: 1000, result: res.result?.content ?? [] }
  },

  /** Đơn đang giao của tôi (SHIPPING, PICKED_UP) */
  async getMyOrders(): Promise<ApiResponse<ShipperOrderResponse[]>> {
    const res = await axiosInstance.get('/orders/shipper/my', {
      params: { page: 0, size: 10, statuses: 'SHIPPING,PICKED_UP' },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = unwrap<any>(res)
    const list = data?.content ?? (Array.isArray(data) ? data : [])
    return { code: 1000, result: list.map(toShipperOrder) }
  },

  /**
   * Nhận đơn: READY → SHIPPING. Đơn COD giữ chỗ đủ tổng tiền trong ví.
   * Lỗi thường gặp: 7004, 7005, 7006, 16013 (result có required/available/missing), 16014.
   */
  async acceptOrder(orderId: number): Promise<ShipperOrderResponse> {
    return toShipperOrder(unwrap(await axiosInstance.put(`/orders/${orderId}/ship`)))
  },

  /** Đã lấy hàng tại nhà vườn: SHIPPING → PICKED_UP */
  async pickupOrder(orderId: number): Promise<ShipperOrderResponse> {
    return toShipperOrder(unwrap(await axiosInstance.put(`/orders/${orderId}/pickup`)))
  },

  /** Giao thành công, bắt buộc ít nhất 1 ảnh bằng chứng (đã upload) */
  async deliverOrder(orderId: number, proofImageUrls: string[]): Promise<ShipperOrderResponse> {
    return toShipperOrder(unwrap(await axiosInstance.put(`/orders/${orderId}/deliver`, { proofImageUrls })))
  },

  /** Báo giao thất bại: lý do, số cuộc gọi, ảnh bằng chứng */
  async failOrder(orderId: number, body: FailOrderRequest): Promise<ShipperOrderResponse> {
    return toShipperOrder(unwrap(await axiosInstance.put(`/orders/${orderId}/fail`, body)))
  },

  /** Upload ảnh bằng chứng giao hàng, trả về danh sách URL */
  async uploadProofImages(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files.slice(0, MAX_PROOF_IMAGES)) {
      const res = await uploadService.uploadImage(file, 'delivery-proofs')
      if (res.result?.url) urls.push(res.result.url)
    }
    return urls
  },

  /** Bật trực tuyến, cũng là heartbeat: gọi lại mỗi ~60s khi đang trực tuyến */
  async goOnline(coords: { latitude: number; longitude: number }): Promise<ApiResponse<void>> {
    await axiosInstance.post('/shippers/status/online', coords)
    return { code: 1000, message: 'Đã bật trực tuyến' }
  },

  async goOffline(): Promise<ApiResponse<void>> {
    await axiosInstance.post('/shippers/status/offline')
    return { code: 1000, message: 'Đã chuyển sang ngoại tuyến' }
  },

  async getOnlineStatus(): Promise<ApiResponse<ShipperStatusResponse>> {
    return { code: 1000, result: unwrap<ShipperStatusResponse>(await axiosInstance.get('/shippers/status')) }
  },
}

/** Khoảng cách gửi heartbeat khi đang trực tuyến (BE tự chuyển offline sau 5 phút không có tín hiệu) */
export const SHIPPER_HEARTBEAT_MS = 60_000

function errorData(err: unknown): { code?: number; message?: string; result?: unknown } | undefined {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data
    if (data && typeof data === 'object') return data as { code?: number; message?: string; result?: unknown }
  }
  return undefined
}

const vnd = (n: unknown) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + 'đ'

/** Mã lỗi của luồng giao hàng → câu dễ hiểu cho tài xế */
export function shipperErrorMessage(err: unknown, fallback: string): string {
  const data = errorData(err)
  switch (data?.code) {
    case 7002:
      return 'Đơn này vừa đổi trạng thái. Tải lại danh sách nhé.'
    case 7004:
      return 'Bạn đang có đơn chưa giao xong. Hoàn tất đơn đó rồi nhận thêm nhé.'
    case 7005:
      return 'Đơn này đã được tài xế khác nhận.'
    case 7006:
      return 'Bạn cần bật trực tuyến để xem và nhận đơn.'
    case 7007:
      return 'Cần chụp ít nhất 1 ảnh bằng chứng.'
    case 7009:
      return `Cần gọi khách tối thiểu ${MIN_FAIL_CALL_ATTEMPTS} cuộc trước khi báo không liên lạc được.`
    case 16013: {
      const r = (data.result ?? {}) as { required?: number; available?: number; missing?: number }
      return `Đơn COD cần ký quỹ ${vnd(r.required)} nhưng ví chỉ còn ${vnd(r.available)} khả dụng. Nạp thêm ${vnd(r.missing)} để nhận đơn.`
    }
    case 16014:
      return 'Ví đang âm do còn tiền COD chưa nộp về sàn. Nạp ví hoặc nộp tiền COD trước khi nhận đơn.'
  }
  // 9999 = lỗi chưa phân loại ở BE ("Uncategorized Error"): dùng câu dự phòng tiếng Việt
  if (data?.code === 9999) return fallback
  return data?.message?.trim() || fallback
}

/** Mã lỗi BE (nếu có) */
export function shipperErrorCode(err: unknown): number | undefined {
  return errorData(err)?.code
}
