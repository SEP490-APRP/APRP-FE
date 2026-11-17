import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services'

export const notificationKeys = {
  all: ['notifications'] as const,
  paged: (page: number, size: number, role?: string, keyword?: string) =>
    ['notifications', 'paged', page, size, role ?? '', keyword ?? ''] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => (await notificationService.getAllNotifications()).result ?? [],
  })
}

export function useNotificationsPaged(
  page = 0,
  size = 5,
  role?: string,
  keyword?: string,
) {
  return useQuery({
    queryKey: notificationKeys.paged(page, size, role, keyword),
    queryFn: async () => {
      try {
        const res = await notificationService.getAllNotificationsPaged(page, size, role, keyword)
        return res.result ?? null
      } catch {
        // Fallback client-side filtering nếu BE chưa cập nhật endpoint paged
        const res = await notificationService.getAllNotifications()
        let all = res.result ?? []
        if (role && role !== 'all') {
          all = all.filter((n) => (n.receiverType || '').toUpperCase().includes(role.toUpperCase()))
        }
        if (keyword?.trim()) {
          const kw = keyword.trim().toLowerCase()
          all = all.filter(
            (n) =>
              (n.title && n.title.toLowerCase().includes(kw)) ||
              (n.message && n.message.toLowerCase().includes(kw)),
          )
        }
        const totalElements = all.length
        const totalPages = Math.max(1, Math.ceil(totalElements / size))
        const content = all.slice(page * size, (page + 1) * size)
        return {
          page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page >= totalPages - 1,
          content,
        }
      }
    },
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
