import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletService } from '@/services'

export const walletKeys = {
  all: ['wallet'] as const,
  adminOverview: () => [...walletKeys.all, 'admin-overview'] as const,
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
