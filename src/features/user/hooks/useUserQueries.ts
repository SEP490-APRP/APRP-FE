import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { userService, type UserResponse } from '@/services'
import type { PageResponse } from '@/types'

/** Query key của user; invalidate `userKeys.all` sau mọi thay đổi trạng thái user. */
export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  report: (params: UserReportParams) => [...userKeys.all, 'report', params] as const,
  byRole: (roles: string[], status: string | null, page: number, size: number) =>
    [...userKeys.all, 'by-role', { roles, status, page, size }] as const,
}

/** Báo cáo theo mốc (week/month/year/all) hoặc theo khoảng ngày tự chọn. */
export type UserReportParams = { type: string } | { from: string; to: string }

export function useUserReport(params: UserReportParams | null) {
  return useQuery({
    queryKey: userKeys.report(params ?? { type: 'none' }),
    queryFn: async () => (await userService.generateAdminUserReport(params!)).result ?? null,
    enabled: params != null,
    placeholderData: keepPreviousData,
  })
}

export function useAllUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => (await userService.getAllUsers()).result ?? [],
  })
}

/** Danh sách user theo role/trạng thái, có phân trang. Giữ trang cũ trong lúc tải trang mới. */
export function useUsersByRole(roles: string[], status: string | null, page: number, size: number) {
  return useQuery({
    queryKey: userKeys.byRole(roles, status, page, size),
    queryFn: async () => {
      const res = await userService.getUsersByRolePaged(roles, status, page, size)
      return res.result ?? null
    },
    placeholderData: keepPreviousData,
  })
}

/** Hồ sơ một user (VD chủ shop). */
export function useUser(id: number | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: userKeys.detail(id ?? 0),
    queryFn: async () => (await userService.getUserById(id!)).result ?? null,
    enabled: id != null && (options.enabled ?? true),
  })
}

/**
 * Hàm lấy hồ sơ một user khi bấm "Xem" (dùng cache nếu vừa xem).
 * Trả về promise để trang tự xử lý loading/thông báo lỗi như trước.
 */
export function useFetchUser() {
  const queryClient = useQueryClient()
  return (id: number) =>
    queryClient.fetchQuery({
      queryKey: userKeys.detail(id),
      queryFn: async () => (await userService.getUserById(id)).result ?? null,
    })
}

type UserListData = UserResponse[] | PageResponse<UserResponse> | UserResponse | null | undefined

/** Sửa một user trong mọi danh sách đang cache (mảng, trang phân trang, chi tiết). */
function patchCachedUser(queryClient: QueryClient, userId: number, patch: Partial<UserResponse>) {
  const apply = (u: UserResponse) => (u.id === userId ? { ...u, ...patch } : u)
  queryClient.setQueriesData<UserListData>({ queryKey: userKeys.all }, (data) => {
    if (!data) return data
    if (Array.isArray(data)) return data.map(apply)
    if ('content' in data) return { ...data, content: data.content.map(apply) }
    return apply(data)
  })
}

/** Duyệt hồ sơ KYC của Shop hoặc Shipper. */
export function useApproveKyc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleName }: { userId: number; roleName: string }) =>
      roleName === 'SHOP_OWNER'
        ? userService.approveShopOwner(userId)
        : userService.approveShipper(userId),
    onSuccess: (_res, { userId }) => {
      patchCachedUser(queryClient, userId, { status: 'ACTIVE', kycStatus: 'APPROVED' })
      return queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

/** Khóa (active=false) hoặc mở khóa tài khoản. Cập nhật ngay rồi tải lại để đồng bộ. */
export function useSetUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) =>
      active ? userService.activateUser(userId) : userService.deactivateUser(userId),
    onSuccess: (_res, { userId, active }) => {
      patchCachedUser(
        queryClient,
        userId,
        active ? { status: 'ACTIVE', lockedAt: undefined } : { status: 'INACTIVE' },
      )
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
