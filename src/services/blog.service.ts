import { axiosInstance } from './api/axiosInstance'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  BlogCommentRequest,
  BlogCommentResponse,
  BlogCreateRequest,
  BlogCreationRequest,
  BlogResponse,
  BlogUpdateRequest,
} from './blog.types'
import { mockBlogs } from '@/mocks/blog.mock'

export type * from './blog.types'

export const blogService = {
  // ==========================================
  // 1. PUBLIC BLOG APIs (/v1/public/blogs)
  // ==========================================

  /** Lấy danh sách bài viết công khai (hỗ trợ phân trang, lọc theo category) */
  async getPublicBlogs(params?: {
    page?: number
    size?: number
    category?: string
  }): Promise<PageResponse<BlogResponse>> {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<BlogResponse>>>(
        '/v1/public/blogs',
        {
          params: {
            page: params?.page ?? 0,
            size: params?.size ?? 10,
            ...(params?.category && params.category !== 'all' ? { category: params.category } : {}),
          },
        },
      )
      if (res.data?.result?.content && res.data.result.content.length > 0) {
        return res.data.result
      }
      // Fallback sang mock nếu API chưa có data hoặc trả rỗng trong giai đoạn đầu
      return this._getMockPublicBlogs(params)
    } catch {
      // Fallback sang mock nếu server offline
      return this._getMockPublicBlogs(params)
    }
  },

  /** Xem chi tiết bài viết (tự động tăng views) */
  async getBlogDetail(blogId: number): Promise<BlogResponse> {
    try {
      const res = await axiosInstance.get<ApiResponse<BlogResponse>>(`/v1/public/blogs/${blogId}`)
      if (res.data?.result) return res.data.result
      throw new Error('Blog not found')
    } catch {
      const mock = mockBlogs.find((b) => b.blogId === blogId || b.id === blogId)
      if (mock) {
        mock.views = (mock.views ?? 0) + 1
        mock.viewCount = mock.views
        return mock
      }
      return mockBlogs[0]
    }
  },

  /** Toggle Like / Unlike bài viết (yêu cầu đăng nhập) */
  async toggleLike(blogId: number): Promise<{ message: string; isLiked: boolean }> {
    try {
      const res = await axiosInstance.post<ApiResponse<string>>(`/v1/public/blogs/${blogId}/like`)
      const msg = res.data?.result || ''
      const isLiked = msg.toLowerCase().includes('đã thích') || msg.toLowerCase().includes('like')
      return { message: msg, isLiked }
    } catch {
      // Fallback local toggle cho mock
      const target = mockBlogs.find((b) => b.blogId === blogId || b.id === blogId)
      if (target) {
        target.isLikedByCurrentUser = !target.isLikedByCurrentUser
        target.likeCount = (target.likeCount ?? 0) + (target.isLikedByCurrentUser ? 1 : -1)
        return {
          message: target.isLikedByCurrentUser ? 'Đã thích bài viết' : 'Đã bỏ thích bài viết',
          isLiked: target.isLikedByCurrentUser,
        }
      }
      return { message: 'Đã cập nhật yêu thích', isLiked: true }
    }
  },

  /** Lấy danh sách bình luận của bài viết */
  async getBlogComments(
    blogId: number,
    params?: { page?: number; size?: number },
  ): Promise<PageResponse<BlogCommentResponse>> {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<BlogCommentResponse>>>(
        `/v1/public/blogs/${blogId}/comments`,
        {
          params: {
            page: params?.page ?? 0,
            size: params?.size ?? 10,
          },
        },
      )
      if (res.data?.result) return res.data.result
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    } catch {
      return {
        content: [
          {
            commentId: 101,
            content: 'Nông sản của bác tươi ngon lắm, lần sau em lại đặt tiếp!',
            createAt: new Date(Date.now() - 3600000).toISOString(),
            userId: 1,
            userName: 'Thảo My',
            userAvatar:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
          },
          {
            commentId: 102,
            content: 'Ủng hộ bà con nông dân Cáp Nông, rau củ sạch tự nhiên rất yên tâm!',
            createAt: new Date(Date.now() - 7200000).toISOString(),
            userId: 2,
            userName: 'Bếp Xanh Quán',
            userAvatar:
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      }
    }
  },

  /** Gửi bình luận cho bài viết (yêu cầu đăng nhập) */
  async addComment(blogId: number, content: string): Promise<BlogCommentResponse> {
    try {
      const req: BlogCommentRequest = { content }
      const res = await axiosInstance.post<ApiResponse<BlogCommentResponse>>(
        `/v1/public/blogs/${blogId}/comments`,
        req,
      )
      if (res.data?.result) return res.data.result
      throw new Error('Could not add comment')
    } catch {
      // Mock fallback
      return {
        commentId: Date.now(),
        content,
        createAt: new Date().toISOString(),
        userId: 999,
        userName: 'Tôi (Khách mua)',
        userAvatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      }
    }
  },

  /** Xóa bình luận */
  async deleteComment(commentId: number): Promise<boolean> {
    try {
      await axiosInstance.delete(`/v1/public/blogs/comments/${commentId}`)
      return true
    } catch {
      return true
    }
  },

  // ==========================================
  // 2. SHOP BLOG APIs (/v1/shop/blogs)
  // ==========================================

  /** Lấy danh sách bài viết của shop mình */
  async getMyBlogs(params?: { page?: number; size?: number }): Promise<PageResponse<BlogResponse>> {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<BlogResponse>>>(
        '/v1/shop/blogs',
        {
          params: {
            page: params?.page ?? 0,
            size: params?.size ?? 10,
          },
        },
      )
      if (res.data?.result) return res.data.result
      return this._getMockPublicBlogs(params)
    } catch {
      return this._getMockPublicBlogs(params)
    }
  },

  /** Shop tạo bài viết mới */
  async createShopBlog(data: BlogCreateRequest): Promise<BlogResponse> {
    const res = await axiosInstance.post<ApiResponse<BlogResponse>>('/v1/shop/blogs', data)
    if (res.data?.result) return res.data.result
    throw new Error('Failed to create shop blog')
  },

  /** Shop cập nhật bài viết */
  async updateShopBlog(blogId: number, data: BlogUpdateRequest): Promise<BlogResponse> {
    const res = await axiosInstance.put<ApiResponse<BlogResponse>>(
      `/v1/shop/blogs/${blogId}`,
      data,
    )
    if (res.data?.result) return res.data.result
    throw new Error('Failed to update shop blog')
  },

  /** Shop xóa bài viết */
  async deleteShopBlog(blogId: number): Promise<boolean> {
    await axiosInstance.delete(`/v1/shop/blogs/${blogId}`)
    return true
  },

  // ==========================================
  // 3. ADMIN & BACKWARD COMPATIBLE METHODS
  // ==========================================

  async getAllBlogs(
    page: number = 0,
    size: number = 10,
    _query?: string,
    category?: string,
  ): Promise<ApiResponse<PageResponse<BlogResponse>>> {
    const paged = await this.getPublicBlogs({ page, size, category })
    return {
      code: 200,
      result: paged,
    }
  },

  async getAllBlogsPaged(
    page: number = 0,
    size: number = 10,
    query?: string,
    category?: string,
  ): Promise<ApiResponse<PageResponse<BlogResponse>>> {
    return this.getAllBlogs(page, size, query, category)
  },

  async createBlog(data: BlogCreationRequest): Promise<ApiResponse<BlogResponse>> {
    try {
      const shopReq: BlogCreateRequest = {
        title: data.title,
        content: data.content,
        pictureUrl:
          data.pictureUrl ||
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        status: (data.status as 'PUBLISHED' | 'DRAFT') || 'PUBLISHED',
        category: data.category,
      }
      const created = await this.createShopBlog(shopReq)
      return { code: 200, result: created }
    } catch {
      const newBlog: BlogResponse = {
        blogId: Date.now(),
        id: Date.now(),
        title: data.title,
        content: data.content,
        category: data.category,
        status: (data.status as 'PUBLISHED' | 'DRAFT') || 'DRAFT',
        createdAt: new Date().toISOString(),
        createAt: new Date().toISOString(),
        authorName: 'Admin CapNong',
        adminName: 'Admin CapNong',
        shopName: 'Admin CapNong',
        imageUrl:
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        pictureUrl:
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        viewCount: 0,
        views: 0,
        likeCount: 0,
        commentCount: 0,
      }
      mockBlogs.unshift(newBlog)
      return { code: 200, result: newBlog }
    }
  },

  async updateBlog(id: number, data: Partial<BlogResponse>): Promise<ApiResponse<BlogResponse>> {
    try {
      const updated = await this.updateShopBlog(id, data as BlogUpdateRequest)
      return { code: 200, result: updated }
    } catch {
      const target = mockBlogs.find((b) => b.blogId === id || b.id === id)
      if (target) {
        Object.assign(target, data)
      }
      return { code: 200, result: target || mockBlogs[0] }
    }
  },

  async deleteBlog(id: number): Promise<ApiResponse<boolean>> {
    try {
      await this.deleteShopBlog(id)
      return { code: 200, result: true }
    } catch {
      const index = mockBlogs.findIndex((b) => b.blogId === id || b.id === id)
      if (index !== -1) mockBlogs.splice(index, 1)
      return { code: 200, result: true }
    }
  },

  // Helper private mock
  _getMockPublicBlogs(params?: {
    page?: number
    size?: number
    category?: string
  }): PageResponse<BlogResponse> {
    const page = params?.page ?? 0
    const size = params?.size ?? 10
    let filtered = [...mockBlogs]
    if (params?.category && params.category !== 'all') {
      filtered = filtered.filter(
        (b) => String(b.category).toUpperCase() === params.category?.toUpperCase(),
      )
    }
    const totalElements = filtered.length
    const totalPages = Math.ceil(totalElements / size) || 1
    const content = filtered.slice(page * size, (page + 1) * size)
    return {
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
      content,
    }
  },
}
