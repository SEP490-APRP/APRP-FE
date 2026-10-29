import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { voucherService, type VoucherResponse } from '@/services'

export type ShopVoucherPage = {
  vouchers: VoucherResponse[]
  totalPages: number
  /** voucherCode -> người dùng hiện tại còn nhận được không */
  canReceive: Record<string, boolean>
}

export const voucherKeys = {
  all: ['vouchers'] as const,
  mine: () => [...voucherKeys.all, 'mine'] as const,
  shop: (shopId: number, page: number, size: number, signedIn: boolean) =>
    [...voucherKeys.all, 'shop', { shopId, page, size, signedIn }] as const,
}

/** Lỗi tải thì query ở trạng thái lỗi; trang tự hiện danh sách rỗng hoặc thông báo lỗi. */
async function fetchShopVouchers(
  shopId: number,
  page: number,
  size: number,
  signedIn: boolean,
): Promise<ShopVoucherPage> {
  const result = (await voucherService.getBuyerShopVouchers(shopId, page, size)).result
  // API có thể trả mảng hoặc trang phân trang.
  const content: VoucherResponse[] = Array.isArray(result) ? result : (result?.content ?? [])
  const totalPages = Array.isArray(result) ? 1 : (result?.totalPages ?? 0)
  const vouchers = content.filter((v) => Number(v.shopId) === Number(shopId))
  if (!signedIn || vouchers.length === 0) return { vouchers, totalPages, canReceive: {} }

  try {
    const myVouchers = await voucherService.getMyVouchers()
    const ownedCodes = new Set(
      (myVouchers || []).map((v) => v.voucherCode?.trim().toUpperCase()),
    )
    const canReceive = Object.fromEntries(
      vouchers.map((v) => [
        v.voucherCode,
        !ownedCodes.has(v.voucherCode?.trim().toUpperCase()),
      ]),
    )
    return { vouchers, totalPages, canReceive }
  } catch {
    const canReceive = Object.fromEntries(vouchers.map((v) => [v.voucherCode, true]))
    return { vouchers, totalPages, canReceive }
  }
}

/** Voucher của một shop (chỉ loại SHOP), kèm trạng thái "còn nhận được" khi đã đăng nhập. */
export function useShopVouchers(shopId: number, page: number, size: number, signedIn: boolean) {
  return useQuery({
    queryKey: voucherKeys.shop(shopId, page, size, signedIn),
    queryFn: () => fetchShopVouchers(shopId, page, size, signedIn),
    enabled: Number.isFinite(shopId) && shopId > 0,
  })
}

/** Danh sách voucher trong ví của người mua (đã nhận / sở hữu) */
export function useMyVouchers(enabled = true) {
  return useQuery({
    queryKey: voucherKeys.mine(),
    queryFn: () => voucherService.getMyVouchers(),
    enabled,
  })
}

/** Nhận voucher; cập nhật ngay danh sách đang xem và ví voucher */
export function useReceiveVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherCode: string) => voucherService.receiveVoucher(voucherCode),
    onSuccess: (_res, voucherCode) => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.mine() })
      queryClient.setQueriesData<ShopVoucherPage>(
        { queryKey: voucherKeys.all },
        (old) =>
          old && {
            vouchers: old.vouchers.map((v) =>
              v.voucherCode === voucherCode ? { ...v, claimedCount: (v.claimedCount ?? 0) + 1 } : v,
            ),
            totalPages: old.totalPages,
            canReceive: { ...old.canReceive, [voucherCode]: false },
          },
      )
    },
  })
}
