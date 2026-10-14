import { useQuery } from '@tanstack/react-query'
import { authService } from '@/services'
import type { UserResponse } from '@/services/user.types'

export const shopProfileKeys = {
  me: ['users', 'me'] as const,
}

export function useShopProfile() {
  return useQuery({
    queryKey: shopProfileKeys.me,
    queryFn: async () => {
      try {
        const res = await authService.getMyInfo()
        return res.result as UserResponse | undefined
      } catch (err) {
        console.warn('Lỗi khi lấy thông tin shop /users/me:', err)
        return undefined
      }
    },
    staleTime: 60 * 1000,
  })
}
