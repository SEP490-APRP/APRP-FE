import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  productService,
  uploadService,
  type GetMyProductsParams,
  type ProductCreationRequest,
  type ProductImageCreationRequest,
  type ProductImageResponse,
  type ProductResponse,
  type ProductUpdateRequest,
} from '@/services'

/** Query key của sản phẩm; invalidate `productKeys.all` sau khi duyệt/từ chối/cập nhật. */
export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  forBuyer: () => [...productKeys.all, 'for-buyer'] as const,
  myShop: (params?: GetMyProductsParams) => [...productKeys.all, 'my-shop', params ?? {}] as const,
  detail: (idOrSlug: string) => [...productKeys.all, 'detail', idOrSlug] as const,
  pending: () => [...productKeys.all, 'pending'] as const,
  images: (productId: number) => [...productKeys.all, 'images', productId] as const,
}

const byDisplayOrder = (a: ProductImageResponse, b: ProductImageResponse) => {
  if (a.isPrimary) return -1
  if (b.isPrimary) return 1
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
}

export function useAllProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: async () => (await productService.getAll()).result ?? [],
  })
}

const fetchForBuyer = async () => (await productService.getForBuyer()).result ?? []

/** Sản phẩm đang bán của một shop. */
export function useShopProducts(shopId: number) {
  return useQuery({
    queryKey: productKeys.forBuyer(),
    queryFn: fetchForBuyer,
    select: (products) => products.filter((p) => p.shopOwnerId === shopId || p.shopId === shopId),
  })
}

// Slug catalog -> id trang chi tiết (giữ nguyên bảng của ProductDetail cũ).
const SLUG_TO_ID: Record<string, number> = {
  carrot: 702,
  tomato: 704,
  pomelo: 707,
  potato: 708,
  beetroot: 706,
  cabbage: 702,
  spinach: 702,
  pumpkin: 705,
}

export type ProductDetailData = { product: ProductResponse | null; related: ProductResponse[] }

/**
 * Chi tiết sản phẩm theo id số hoặc slug catalog, kèm gallery ảnh và tối đa 4 sản phẩm liên quan
 * (ưu tiên cùng shop). Không tìm thấy thì lấy sản phẩm đầu tiên, giống bản cũ.
 */
export function useProductDetail(idOrSlug: string) {
  return useQuery({
    queryKey: productKeys.detail(idOrSlug),
    enabled: idOrSlug !== '',
    queryFn: async (): Promise<ProductDetailData> => {
      const idNum = Number(idOrSlug)
      let found: ProductResponse | null = null

      if (!isNaN(idNum) && idNum > 0) {
        try {
          const res = await productService.getById(idNum)
          if (res.result) found = res.result
        } catch {
          /* fallback to list */
        }
      }

      const products = await fetchForBuyer()
      if (!found) {
        const targetId =
          !isNaN(idNum) && idNum > 0 ? idNum : SLUG_TO_ID[idOrSlug.toLowerCase()] || 701
        found = products.find((p) => p.id === targetId || String(p.id) === idOrSlug) ?? products[0]
      }
      if (!found) return { product: null, related: [] }

      let product = found
      try {
        if (!product.images || product.images.length === 0) {
          const images = (await productService.getImages(found.id)).result
          if (images && images.length > 0) product = { ...found, images }
        }
      } catch {
        /* không có gallery thì dùng ảnh chính */
      }

      const shopId = found.shopOwnerId || found.shopId
      const sameShop = products.filter(
        (p) => p.id !== idNum && (p.shopOwnerId === shopId || p.shopId === shopId),
      )
      const pool = sameShop.length >= 2 ? sameShop : products.filter((p) => p.id !== idNum)
      return { product, related: pool.slice(0, 4) }
    },
  })
}

export function usePendingProducts() {
  return useQuery({
    queryKey: productKeys.pending(),
    queryFn: async () => (await productService.getPendingProducts()).result ?? [],
  })
}

/** Lấy danh sách sản phẩm thuộc shop của nông dân đang đăng nhập */
export function useMyProducts(params: GetMyProductsParams = {}) {
  return useQuery({
    queryKey: productKeys.myShop(params),
    queryFn: async () => {
      const res = await productService.getMyProducts(params)
      return res.result
    },
  })
}

/** Tạo sản phẩm mới */
export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ProductCreationRequest) => productService.createProduct(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

/** Cập nhật sản phẩm */
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ProductUpdateRequest }) =>
      productService.updateProduct(id, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(String(variables.id)) })
    },
  })
}

/** Xóa sản phẩm */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

/** Ảnh của sản phẩm, ảnh chính lên đầu. Không gọi khi chưa chọn sản phẩm. */
export function useProductImages(productId: number | undefined) {
  return useQuery({
    queryKey: productKeys.images(productId ?? 0),
    queryFn: async () => (await productService.getImages(productId!)).result ?? [],
    enabled: productId != null && productId > 0,
    select: (images) => images.slice().sort(byDisplayOrder),
  })
}

/** Upload ảnh lên Cloudinary và gắn vào gallery của sản phẩm */
export function useUploadProductImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      file,
      isPrimary = false,
      displayOrder = 0,
    }: {
      productId: number
      file: File
      isPrimary?: boolean
      displayOrder?: number
    }) => {
      // 1. Tải ảnh lên Cloudinary qua Backend
      const uploadRes = await uploadService.uploadImage(file, 'products')
      const imageUrl = uploadRes.result?.url
      if (!imageUrl) throw new Error('Không nhận được URL ảnh từ server')

      // 2. Gắn URL vào sản phẩm và kích hoạt kiểm duyệt AI ngầm tại backend
      const imagePayload: ProductImageCreationRequest = {
        imageUrl,
        isPrimary,
        displayOrder,
      }
      return await productService.addImage(productId, imagePayload)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.images(variables.productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

/** Đặt ảnh làm ảnh đại diện chính */
export function useSetPrimaryProductImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: number; imageId: number }) =>
      productService.setPrimaryImage(productId, imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.images(variables.productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

/** Xóa ảnh khỏi gallery của sản phẩm */
export function useDeleteProductImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: number; imageId: number }) =>
      productService.deleteImage(productId, imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.images(variables.productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useApproveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: number) => productService.approveProduct(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useRejectProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, reason }: { productId: number; reason: string }) =>
      productService.rejectProduct(productId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}
