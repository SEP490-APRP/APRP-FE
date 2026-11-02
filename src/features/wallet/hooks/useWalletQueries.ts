import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletApi, walletService } from '@/services'

export const walletKeys = {
  all: ['wallet'] as const,
  adminOverview: () => [...walletKeys.all, 'admin-overview'] as const,
  me: () => [...walletKeys.all, 'me'] as const,
  myTransactions: (page: number, size: number) => [...walletKeys.all, 'me', 'tx', page, size] as const,
  platformTransactions: (page: number, size: number) => [...walletKeys.all, 'platform', 'tx', page, size] as const,
  settlement: (orderId: number) => [...walletKeys.all, 'settlement', orderId] as const,
  refunds: () => [...walletKeys.all, 'refunds'] as const,
}

/** Ví của người đang đăng nhập (Shop / Shipper; Admin nhận ví sàn) */
export function useMyWallet(enabled = true) {
  return useQuery({ queryKey: walletKeys.me(), queryFn: walletApi.getMyWallet, enabled })
}

export function useMyWalletTransactions(page = 0, size = 20, enabled = true) {
  return useQuery({
    queryKey: walletKeys.myTransactions(page, size),
    queryFn: () => walletApi.getMyTransactions(page, size),
    enabled,
  })
}

export function usePlatformWalletTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: walletKeys.platformTransactions(page, size),
    queryFn: () => walletApi.getPlatformTransactions(page, size),
  })
}

/** Bảng chia tiền của 1 đơn (Shop / Shipper của đơn hoặc Admin) */
export function useOrderSettlement(orderId: number | null | undefined) {
  return useQuery({
    queryKey: walletKeys.settlement(orderId ?? 0),
    queryFn: () => walletApi.getOrderSettlement(orderId as number),
    enabled: !!orderId,
    retry: false,
  })
}

export function useRefundsDue() {
  return useQuery({ queryKey: walletKeys.refunds(), queryFn: walletApi.getRefundsDue })
}

/** Yêu cầu rút tiền đang chờ, toàn bộ lịch sử và ví sàn (tải cùng lúc như trước). */
export function useAdminWalletOverview() {
  return useQuery({
    queryKey: walletKeys.adminOverview(),
    queryFn: async () => {
      const [pending, history, platform] = await Promise.all([
        walletService.getAllPendingWithdrawRequests(),
        walletService.getAllWithdrawRequests(),
        walletService.getPlatformWallet(),
      ])
      return {
        pending: pending.result ?? [],
        history: history.result ?? [],
        platformWallet: platform.result ?? null,
      }
    },
  })
}

/** Tạo QR chuyển khoản; chưa đổi trạng thái yêu cầu nên không cần tải lại. */
export function useCreateWithdrawQr() {
  return useMutation({
    mutationFn: (requestId: number) => walletService.createWithdrawQr(requestId),
  })
}

export function useConfirmWithdraw() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      note,
      files,
    }: {
      requestId: number
      note?: string
      files?: File[]
    }) => walletService.confirmWithdrawSuccess(requestId, note, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  })
}

export function useRejectWithdraw() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, note, files }: { requestId: number; note: string; files?: File[] }) =>
      walletService.rejectWithdraw(requestId, note, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  })
}
