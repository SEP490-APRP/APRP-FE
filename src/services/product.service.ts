import type { ApiResponse, PageResponse } from '@/types'
import type {
  AiDescriptionSuggestionRequest,
  AiDescriptionSuggestionResponse,
  GetMyProductsParams,
  ImageSearchResponse,
  ProductCreationRequest,
  ProductImageCreationRequest,
  ProductImageResponse,
  ProductResponse,
  ProductUpdateRequest,
} from './product.types'
import { axiosInstance } from './api/axiosInstance'

export type * from './product.types'

/** Chuẩn hóa định dạng ngày từ Backend (mảng Jackson [YYYY, MM, DD], chuỗi YYYY-MM-DD, chuỗi nén YYYYMMDD) thành YYYY-MM-DD */
export function normalizeExpiryDate(val: any): string | undefined {
  if (!val) return undefined
  if (Array.isArray(val) && val.length >= 3) {
    const y = String(val[0]).padStart(4, '0')
    const m = String(val[1]).padStart(2, '0')
    const d = String(val[2]).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'number') {
    const numStr = String(val)
    if (numStr.length === 8 && /^\d{8}$/.test(numStr)) {
      return `${numStr.substring(0, 4)}-${numStr.substring(4, 6)}-${numStr.substring(6, 8)}`
    }
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',')
      if (parts.length >= 3) {
        return `${parts[0].trim().padStart(4, '0')}-${parts[1].trim().padStart(2, '0')}-${parts[2].trim().padStart(2, '0')}`
      }
    }
    if (trimmed.length === 8 && /^\d{8}$/.test(trimmed)) {
      return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`
    }
    return trimmed.split('T')[0]
  }
  return undefined
}

/** Chuẩn hóa ProductResponse từ BE để tương thích 100% với UI FE cũ và mới */
function normalizeProduct(p: any): ProductResponse {
  const id = Number(p.productId ?? p.id)
  const price = Number(p.sellingPrice ?? p.price ?? 0)
  const stock = Number(p.stockQuantity ?? p.stock ?? 0)
  const name = p.productName ?? p.name ?? 'Nông sản'
  const primaryImg = p.images?.find((img: any) => img.isPrimary)?.imageUrl
  const firstImg = p.images?.[0]?.imageUrl
  const imageUrl = primaryImg ?? firstImg ?? p.imageUrl ?? p.image ?? ''
  const shopId = Number(p.shop?.id ?? p.shopId ?? p.shopOwnerId ?? 0)
  const shopName = p.shop?.shopName ?? p.shop?.fullName ?? p.shopName ?? ''
  const expiryDate = normalizeExpiryDate(p.expiryDate)

  return {
    ...p,
    id,
    productId: id,
    name,
    productName: name,
    price,
    sellingPrice: price,
    stock,
    stockQuantity: stock,
    imageUrl,
    image: imageUrl,
    primaryImageUrl: primaryImg ?? imageUrl,
    shopId,
    shopOwnerId: shopId,
    shopName,
    expiryDate,
  }
}

export const productService = {
  async getAll(params?: { categoryId?: number; keyword?: string; shopId?: number; page?: number; size?: number }): Promise<ApiResponse<ProductResponse[]>> {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>('/products', {
        params: { status: 'ACTIVE', page: params?.page ?? 1, size: params?.size ?? 100, ...params },
      })
      const items = (res.data.result?.content ?? []).map(normalizeProduct)
      return { code: 1000, result: items }
    } catch (e) {
      console.warn('Cannot fetch products from backend API:', e)
      return { code: 1000, result: [] }
    }
  },

  async getAllProducts(): Promise<ApiResponse<ProductResponse[]>> {
    return this.getAll()
  },

  async getForBuyer(): Promise<ApiResponse<ProductResponse[]>> {
    return this.getAll()
  },

  async getById(id: number): Promise<ApiResponse<ProductResponse | null>> {
    try {
      const res = await axiosInstance.get<ApiResponse<any>>(`/products/${id}`)
      if (res.data.result) {
        return {
          code: 1000,
          result: normalizeProduct(res.data.result),
        }
      }
    } catch (e) {
      console.warn(`Cannot fetch product id ${id} from backend API:`, e)
    }
    return { code: 1000, result: null }
  },

  /** Lấy danh sách sản phẩm của nông dân/gian hàng hiện tại (hỗ trợ lọc status, phân trang) */
  async getMyProducts(
    params: GetMyProductsParams = {},
  ): Promise<ApiResponse<PageResponse<ProductResponse>>> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>('/products/my-shop', {
      params: {
        status: params.status && params.status !== 'ALL' ? params.status : undefined,
        categoryId: params.categoryId && params.categoryId > 0 ? params.categoryId : undefined,
        keyword: params.keyword && params.keyword.trim() !== '' ? params.keyword.trim() : undefined,
        page: params.page ?? 1,
        size: params.size ?? 20,
      },
    })

    const rawPage = res.data.result
    return {
      code: res.data.code ?? 1000,
      message: res.data.message,
      result: {
        page: rawPage?.page ?? 1,
        size: rawPage?.size ?? 20,
        totalElements: rawPage?.totalElements ?? 0,
        totalPages: rawPage?.totalPages ?? 1,
        first: rawPage?.first ?? true,
        last: rawPage?.last ?? true,
        content: (rawPage?.content ?? []).map(normalizeProduct),
      },
    }
  },

  /** Nông dân tạo mới nông sản */
  async createProduct(request: ProductCreationRequest): Promise<ApiResponse<ProductResponse>> {
    const res = await axiosInstance.post<ApiResponse<any>>('/products', request)
    return {
      code: res.data.code ?? 1000,
      message: res.data.message,
      result: normalizeProduct(res.data.result),
    }
  },

  /** Nông dân cập nhật nông sản */
  async updateProduct(
    id: number,
    request: ProductUpdateRequest,
  ): Promise<ApiResponse<ProductResponse>> {
    const res = await axiosInstance.put<ApiResponse<any>>(`/products/${id}`, request)
    return {
      code: res.data.code ?? 1000,
      message: res.data.message,
      result: normalizeProduct(res.data.result),
    }
  },

  /** Nông dân xóa/tạm ngưng nông sản */
  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete<ApiResponse<void>>(`/products/${id}`)
    return res.data
  },

  /** Lấy danh sách ảnh trong gallery của sản phẩm */
  async getImages(productId: number): Promise<ApiResponse<ProductImageResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ProductImageResponse[]>>(
      `/products/${productId}/images`,
    )
    return res.data
  },

  /** Thêm ảnh vào sản phẩm (kích hoạt AI Google Cloud Vision ngầm tại backend) */
  async addImage(
    productId: number,
    request: ProductImageCreationRequest,
  ): Promise<ApiResponse<ProductImageResponse>> {
    const res = await axiosInstance.post<ApiResponse<ProductImageResponse>>(
      `/products/${productId}/images`,
      request,
    )
    return res.data
  },

  /** Đặt ảnh làm ảnh đại diện chính */
  async setPrimaryImage(
    productId: number,
    imageId: number,
  ): Promise<ApiResponse<ProductImageResponse>> {
    const res = await axiosInstance.patch<ApiResponse<ProductImageResponse>>(
      `/products/${productId}/images/${imageId}/primary`,
    )
    return res.data
  },

  /** Xóa ảnh khỏi gallery sản phẩm */
  async deleteImage(productId: number, imageId: number): Promise<ApiResponse<void>> {
    const res = await axiosInstance.delete<ApiResponse<void>>(
      `/products/${productId}/images/${imageId}`,
    )
    return res.data
  },

  async getPendingProducts(): Promise<ApiResponse<ProductResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<PageResponse<any>>>('/products', {
      params: { status: 'PENDING', page: 1, size: 50 },
    })
    return {
      code: 1000,
      result: (res.data.result?.content ?? []).map(normalizeProduct),
    }
  },

  async approveProduct(productId: number): Promise<ApiResponse<ProductResponse>> {
    const res = await axiosInstance.patch<ApiResponse<any>>(`/products/${productId}/approve`)
    return {
      code: 1000,
      result: normalizeProduct(res.data.result),
      message: 'Duyệt sản phẩm thành công',
    }
  },

  async rejectProduct(productId: number, reason: string): Promise<ApiResponse<ProductResponse>> {
    const res = await axiosInstance.patch<ApiResponse<any>>(`/products/${productId}/reject`, {
      reason,
    })
    return {
      code: 1000,
      result: normalizeProduct(res.data.result),
      message: 'Đã từ chối duyệt sản phẩm',
    }
  },

  /** Admin phê duyệt riêng lẻ 1 ảnh phụ bị gắn cờ */
  async approveImage(
    productId: number,
    imageId: number,
  ): Promise<ApiResponse<ProductImageResponse>> {
    const res = await axiosInstance.patch<ApiResponse<ProductImageResponse>>(
      `/products/${productId}/images/${imageId}/approve`,
    )
    return res.data
  },

  /** Trợ lý AI gợi ý mô tả nông sản (Google Gemini 1.5 Flash) */
  async suggestDescription(
    request: AiDescriptionSuggestionRequest,
  ): Promise<ApiResponse<AiDescriptionSuggestionResponse>> {
    const res = await axiosInstance.post<ApiResponse<AiDescriptionSuggestionResponse>>(
      '/products/ai-suggest-description',
      request,
    )
    return res.data
  },

  /** Tìm kiếm nông sản bằng hình ảnh AI (Google Cloud Vision) */
  async searchByImage(file: File): Promise<ApiResponse<ImageSearchResponse>> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await axiosInstance.post<ApiResponse<ImageSearchResponse>>(
      '/products/search-by-image',
      formData,
      {
        timeout: 60_000, // Cho phép 60s đối với upload và xử lý ảnh AI độ phân giải cao (tới 10MB)
      }
    )
    return res.data
  },
}
