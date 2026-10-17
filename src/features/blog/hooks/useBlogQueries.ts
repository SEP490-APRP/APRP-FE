import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  blogService,
  type BlogCommentResponse,
  type BlogCreateRequest,
  type BlogCreationRequest,
  type BlogResponse,
  type BlogUpdateRequest,
} from '@/services'
import type { PageResponse } from '@/types'

export const blogKeys = {
  all: ['blogs'] as const,
  publicList: (params?: { page?: number; size?: number; category?: string; search?: string }) =>
    [...blogKeys.all, 'public', params] as const,
  adminList: (params?: { page?: number; size?: number; status?: string; category?: string; search?: string }) =>
    [...blogKeys.all, 'admin', params] as const,
  detail: (id: number) => [...blogKeys.all, 'detail', id] as const,
  comments: (id: number, params?: { page?: number; size?: number }) =>
    [...blogKeys.all, 'comments', id, params] as const,
  myBlogs: (params?: { page?: number; size?: number }) =>
    [...blogKeys.all, 'my-blogs', params] as const,
  paged: (page: number, size: number, params?: { search?: string; category?: string; status?: string }) =>
    [...blogKeys.all, 'paged', { page, size, ...params }] as const,
}

// ==========================================
// PUBLIC BLOG HOOKS
// ==========================================

/** Danh sách bài viết công khai (hỗ trợ phân trang, lọc theo danh mục, tìm kiếm) */
export function usePublicBlogs(params?: {
  page?: number
  size?: number
  category?: string
  search?: string
}) {
  return useQuery({
    queryKey: blogKeys.publicList(params),
    queryFn: () => blogService.getPublicBlogs(params),
    placeholderData: keepPreviousData,
  })
}

/** Chi tiết bài viết theo id */
export function useBlogDetail(blogId: number | null | undefined) {
  return useQuery({
    queryKey: blogKeys.detail(blogId ?? 0),
    queryFn: () => (blogId ? blogService.getBlogDetail(blogId) : Promise.reject('Invalid ID')),
    enabled: Boolean(blogId && blogId > 0),
  })
}

/** Toggle Like bài viết */
export function useToggleBlogLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (blogId: number) => blogService.toggleLike(blogId),
    onSuccess: (res, blogId) => {
      // Optimistic/cache update cho danh sách public
      queryClient.setQueriesData<PageResponse<BlogResponse>>(
        { queryKey: blogKeys.all },
        (old) => {
          if (!old) return old
          return {
            ...old,
            content: old.content.map((b) => {
              const currentId = b.blogId || b.id
              if (currentId === blogId) {
                const isLiked = res.isLiked
                const currentLikes = b.likeCount ?? 0
                return {
                  ...b,
                  isLikedByCurrentUser: isLiked,
                  likeCount: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
                }
              }
              return b
            }),
          }
        },
      )
      // Cập nhật cache của chi tiết
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(blogId) })
    },
  })
}

/** Danh sách bình luận của bài viết */
export function useBlogComments(
  blogId: number | null | undefined,
  params?: { page?: number; size?: number },
) {
  return useQuery({
    queryKey: blogKeys.comments(blogId ?? 0, params),
    queryFn: () => (blogId ? blogService.getBlogComments(blogId, params) : Promise.reject('Invalid ID')),
    enabled: Boolean(blogId && blogId > 0),
  })
}

/** Thêm bình luận */
export function useAddBlogComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ blogId, content }: { blogId: number; content: string }) =>
      blogService.addComment(blogId, content),
    onSuccess: (_newComment, { blogId }) => {
      // Tăng commentCount trong cache
      queryClient.setQueriesData<PageResponse<BlogResponse>>(
        { queryKey: blogKeys.all },
        (old) => {
          if (!old) return old
          return {
            ...old,
            content: old.content.map((b) => {
              const currentId = b.blogId || b.id
              if (currentId === blogId) {
                return {
                  ...b,
                  commentCount: (b.commentCount ?? 0) + 1,
                }
              }
              return b
            }),
          }
        },
      )
      // Invalidate comments
      queryClient.invalidateQueries({ queryKey: blogKeys.comments(blogId) })
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(blogId) })
    },
  })
}

/** Xóa bình luận */
export function useDeleteBlogComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ blogId, commentId }: { blogId: number; commentId: number }) =>
      blogService.deleteComment(commentId),
    onSuccess: (_res, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.comments(blogId) })
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(blogId) })
    },
  })
}

// ==========================================
// SHOP BLOG HOOKS
// ==========================================

/** Danh sách bài viết của Shop hiện tại */
export function useMyBlogs(params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: blogKeys.myBlogs(params),
    queryFn: () => blogService.getMyBlogs(params),
  })
}

/** Shop tạo bài viết mới */
export function useCreateShopBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BlogCreateRequest) => blogService.createShopBlog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}

/** Shop cập nhật bài viết */
export function useUpdateShopBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ blogId, data }: { blogId: number; data: BlogUpdateRequest }) =>
      blogService.updateShopBlog(blogId, data),
    onSuccess: (_res, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(blogId) })
    },
  })
}

/** Shop xóa bài viết */
export function useDeleteShopBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (blogId: number) => blogService.deleteShopBlog(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}

// ==========================================
// ADMIN & LEGACY COMPATIBLE HOOKS
// ==========================================

/** Danh sách tất cả bài viết cho Admin (toàn sàn, mọi trạng thái) */
export function useAdminBlogs(params?: {
  page?: number
  size?: number
  status?: string
  category?: string
  search?: string
}) {
  return useQuery({
    queryKey: blogKeys.adminList(params),
    queryFn: () => blogService.getAllBlogsForAdmin(params),
    placeholderData: keepPreviousData,
  })
}

export function useBlogsPaged(
  page: number,
  size: number,
  query?: string,
  category?: string,
  status?: string,
) {
  return useQuery({
    queryKey: blogKeys.paged(page, size, { search: query, category, status }),
    queryFn: async () =>
      (await blogService.getAllBlogsPaged(page, size, query, category, status)).result ?? null,
    placeholderData: keepPreviousData,
  })
}

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

export function useDeleteBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => blogService.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}

/** Admin cập nhật trạng thái bài viết (PUBLISHED, HIDDEN, DRAFT) */
export function useUpdateBlogStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      blogId,
      status,
    }: {
      blogId: number
      status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT'
    }) => blogService.updateBlogStatus(blogId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}

export function useSetBlogStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      blog,
      status,
    }: {
      blog: BlogResponse
      status: BlogResponse['status']
    }) => {
      const targetId = blog.blogId || blog.id || 0
      return blogService.updateBlogStatus(
        targetId,
        (status as 'PUBLISHED' | 'HIDDEN' | 'DRAFT') || 'PUBLISHED',
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}
