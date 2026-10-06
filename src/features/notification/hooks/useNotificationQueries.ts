import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services'

export const notificationKeys = {
  all: ['notifications'] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => (await notificationService.getAllNotifications()).result ?? [],
  })
}

/** Gửi thông báo tới nhóm người dùng; chờ danh sách tải lại xong mới báo thành công. */
export function useSendNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof notificationService.adminSendToGroups>[0]) =>
      notificationService.adminSendToGroups(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
