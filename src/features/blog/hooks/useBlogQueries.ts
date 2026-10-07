import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blogService, type BlogCreationRequest, type BlogResponse } from '@/services'
import type { PageResponse } from '@/types'

export const blogKeys = {
  all: ['blogs'] as const,
  paged: (page: number, size: number) => [...blogKeys.all, 'paged', { page, size }] as const,
}

/** Danh sách bài viết có phân trang; giữ trang cũ trong lúc tải trang mới. */
export function useBlogsPaged(page: number, size: number) {
  return useQuery({
    queryKey: blogKeys.paged(page, size),
    queryFn: async () => (await blogService.getAllBlogsPaged(page, size)).result ?? null,
    placeholderData: keepPreviousData,
  })
}

/** Tạo mới (không có id) hoặc cập nhật bài viết. */
export function useSaveBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id?: number; request: BlogCreationRequest }) =>
      id != null
        ? blogService.updateBlog(id, {
            ...request,
            status: request.status as BlogResponse['status'],
          })
        : blogService.createBlog(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: blogKeys.all }),
  })
}

/** Sửa một bài trong mọi trang đang cache. */
function patchCachedBlogs(
  queryClient: ReturnType<typeof useQueryClient>,
  fn: (blogs: BlogResponse[]) => BlogResponse[],
) {
  queryClient.setQueriesData<PageResponse<BlogResponse> | null>(
    { queryKey: blogKeys.all },
    (page) => page && { ...page, content: fn(page.content) },
  )
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => blogService.deleteBlog(id),
    onSuccess: (_res, id) => {
      patchCachedBlogs(queryClient, (blogs) => blogs.filter((b) => b.id !== id))
      void queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}

/** Đăng / gỡ bài (PUBLISHED <-> DRAFT). */
export function useSetBlogStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ blog, status }: { blog: BlogResponse; status: BlogResponse['status'] }) =>
      blogService.updateBlog(blog.id, {
        title: blog.title,
        content: blog.content,
        status,
        category: blog.category,
      }),
    onSuccess: (_res, { blog, status }) => {
      patchCachedBlogs(queryClient, (blogs) =>
        blogs.map((b) => (b.id === blog.id ? { ...b, status } : b)),
      )
      void queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}
