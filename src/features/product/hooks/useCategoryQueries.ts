import { useQuery } from '@tanstack/react-query'
import { categoryService, type CategoryResponse } from '@/services'

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: number) => [...categoryKeys.all, 'detail', id] as const,
}

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const res = await categoryService.getAll()
      return res.result ?? []
    },
    staleTime: 5 * 60 * 1000, // 5 phút vì danh mục ít khi thay đổi liên tục
  })
}
