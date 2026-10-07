import { QueryClient } from '@tanstack/react-query'

/**
 * Mặc định giữ hành vi cũ của các trang (tải khi mở trang, không tự tải lại khi
 * quay lại tab) và chỉ thử lại 1 lần khi lỗi.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
