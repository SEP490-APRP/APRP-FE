import type { ApiResponse, PageResponse } from '@/types'
import type { BlogCreationRequest, BlogResponse } from './blog.types'
import { mockBlogs } from '@/mocks/blog.mock'
import { freshResponses } from '@/mocks/fresh'

export type * from './blog.types'

export const blogService = freshResponses({
  async getAllBlogs(
    page: number = 0,
    size: number = 10,
    _query?: string,
    _category?: string,
  ): Promise<ApiResponse<PageResponse<BlogResponse>>> {
    await new Promise((r) => setTimeout(r, 200))
    const totalElements = mockBlogs.length
    const totalPages = Math.ceil(totalElements / size) || 1
    return {
      code: 200,
      result: {
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
        content: [...mockBlogs],
      },
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
    await new Promise((r) => setTimeout(r, 300))
    const newBlog: BlogResponse = {
      id: Date.now(),
      title: data.title,
      content: data.content,
      category: data.category,
      status: (data.status as 'PUBLISHED' | 'DRAFT') || 'DRAFT',
      createdAt: new Date().toISOString(),
      createAt: new Date().toISOString(),
      authorName: 'Admin CapNong',
      adminName: 'Admin CapNong',
      imageUrl:
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      pictureUrl:
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      viewCount: 0,
      views: 0,
    }
    mockBlogs.unshift(newBlog)
    return { code: 200, result: newBlog }
  },

  async updateBlog(id: number, data: Partial<BlogResponse>): Promise<ApiResponse<BlogResponse>> {
    await new Promise((r) => setTimeout(r, 300))
    const target = mockBlogs.find((b) => b.id === id)
    if (target) {
      Object.assign(target, data)
    }
    return { code: 200, result: target || mockBlogs[0] }
  },

  async deleteBlog(id: number): Promise<ApiResponse<boolean>> {
    await new Promise((r) => setTimeout(r, 250))
    const index = mockBlogs.findIndex((b) => b.id === id)
    if (index !== -1) mockBlogs.splice(index, 1)
    return { code: 200, result: true }
  },
})
