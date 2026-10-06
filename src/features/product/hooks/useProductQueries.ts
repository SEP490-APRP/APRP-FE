import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productService, type ProductImageResponse, type ProductResponse } from '@/services'

/** Query key của sản phẩm; invalidate `productKeys.all` sau khi duyệt/từ chối. */
export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  forBuyer: () => [...productKeys.all, 'for-buyer'] as const,
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
      const products = await fetchForBuyer()
      const idNum = Number(idOrSlug)
      const targetId =
        !isNaN(idNum) && idNum > 0 ? idNum : SLUG_TO_ID[idOrSlug.toLowerCase()] || 701
      const found =
        products.find((p) => p.id === targetId || String(p.id) === idOrSlug) ?? products[0]
      if (!found) return { product: null, related: [] }

      let product = found
      try {
        const images = (await productService.getImages(found.id)).result
        if (images && images.length > 0) product = { ...found, images }
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

/** Ảnh của sản phẩm, ảnh chính lên đầu. Không gọi khi chưa chọn sản phẩm. */
export function useProductImages(productId: number | undefined) {
  return useQuery({
    queryKey: productKeys.images(productId ?? 0),
    queryFn: async () => (await productService.getImages(productId!)).result ?? [],
    enabled: productId != null,
    select: (images) => images.slice().sort(byDisplayOrder),
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
