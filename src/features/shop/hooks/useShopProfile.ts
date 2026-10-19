import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services'
import { useAuthStore } from '@/stores'
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

export function useUpdateShopProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await authService.updateMyInfo(data)
      return res.result
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(shopProfileKeys.me, updated)
      queryClient.invalidateQueries({ queryKey: shopProfileKeys.me })
      if (updated) {
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          useAuthStore.getState().setUser({
            ...currentUser,
            name: updated.fullName || currentUser.name,
            shopName: updated.shopName || currentUser.shopName,
            avatar: updated.logoUrl || currentUser.avatar,
            phone: updated.phoneNumber || currentUser.phone,
            address: updated.address || currentUser.address,
          })
        }
      }
    },
  })
}
