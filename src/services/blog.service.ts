import { axiosInstance } from './api/axiosInstance'
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getWebSocketUrl, TOKEN_KEY } from '@/services/api.config'
import { STORAGE_KEYS } from '@/utils'
import type { ApiResponse, PageResponse } from '@/types'
import type {
  BlogCommentRequest,
  BlogCommentResponse,
  BlogCreateRequest,
  BlogCreationRequest,
  BlogResponse,
  BlogUpdateRequest,
} from './blog.types'

export type * from './blog.types'

export type BlogSocketEvent =
  | {
      type: 'LIKE_UPDATED'
      blogId: number
      likeCount: number
      commentCount?: number
      userId?: number
      action?: 'LIKED' | 'UNLIKED'
    }
  | {
      type: 'COMMENT_ADDED'
      blogId: number
      comment: BlogCommentResponse
      commentCount: number
      likeCount?: number
    }
  | {
      type: 'COMMENT_DELETED'
      blogId: number
      commentId: number
      commentCount: number
      likeCount?: number
    }

export type BlogEventCallback = (event: BlogSocketEvent) => void

class BlogSocketManager {
  private client: Client | null = null
  private isConnecting: boolean = false
  private isConnected: boolean = false
  private currentToken: string | null = null

  private blogListeners = new Map<number, Set<BlogEventCallback>>()
  private feedListeners = new Set<BlogEventCallback>()

  private blogSubscriptions = new Map<number, StompSubscription>()
  private feedSubscription: StompSubscription | null = null

  private getAuthToken(): string | null {
    try {
      return (
        localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.TOKEN)
      )
    } catch {
      return null
    }
  }

  public connect(token?: string, onConnected?: () => void, onError?: (err: unknown) => void): void {
    const authToken = token || this.getAuthToken()

    if (this.isConnected && this.currentToken && authToken && this.currentToken !== authToken) {
      this.disconnect()
    }

    if (this.isConnected) {
      onConnected?.()
      return
    }

    if (this.isConnecting && this.client) {
      return
    }

    const wsUrl = getWebSocketUrl()
    this.isConnecting = true

    const stompClient = new Client({
      webSocketFactory: () => new (SockJS as unknown as { new (url: string): WebSocket })(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},

      onConnect: () => {
        this.isConnecting = false
        this.isConnected = true
        this.currentToken = authToken
        this.reapplySubscriptions()
        onConnected?.()
      },

      onDisconnect: () => {
        this.isConnecting = false
        this.isConnected = false
      },

      onStompError: (frame) => {
        this.isConnecting = false
        this.isConnected = false
        console.warn('[WS Blog] STOMP error:', frame.headers['message'])
        onError?.(frame)
      },

      onWebSocketError: (err) => {
        this.isConnecting = false
        this.isConnected = false
        console.warn('[WS Blog] WebSocket error:', err)
        onError?.(err)
      },
    })

    this.client = stompClient
    stompClient.activate()
  }

  public disconnect(): void {
    this.cleanupAllSubscriptions()
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (err) {
        console.warn('[WS Blog] Error deactivating client:', err)
      }
      this.client = null
    }
    this.isConnected = false
    this.isConnecting = false
    this.currentToken = null
  }

  public getIsConnected(): boolean {
    return this.isConnected
  }

  public subscribeBlog(blogId: number, callback: BlogEventCallback): () => void {
    if (!this.blogListeners.has(blogId)) {
      this.blogListeners.set(blogId, new Set())
    }
    this.blogListeners.get(blogId)!.add(callback)

    if (this.isConnected && this.client && !this.blogSubscriptions.has(blogId)) {
      this.subscribeStompTopicForBlog(blogId)
    } else if (!this.isConnected && !this.isConnecting) {
      this.connect()
    }

    return () => {
      const set = this.blogListeners.get(blogId)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          this.blogListeners.delete(blogId)
          const sub = this.blogSubscriptions.get(blogId)
          if (sub) {
            try {
              sub.unsubscribe()
            } catch {
              // ignore
            }
            this.blogSubscriptions.delete(blogId)
          }
        }
      }
    }
  }

  public subscribeBlogFeed(callback: BlogEventCallback): () => void {
    this.feedListeners.add(callback)

    if (this.isConnected && this.client && !this.feedSubscription) {
      this.subscribeStompTopicForFeed()
    } else if (!this.isConnected && !this.isConnecting) {
      this.connect()
    }

    return () => {
      this.feedListeners.delete(callback)
      if (this.feedListeners.size === 0 && this.feedSubscription) {
        try {
          this.feedSubscription.unsubscribe()
        } catch {
          // ignore
        }
        this.feedSubscription = null
      }
    }
  }

  private subscribeStompTopicForBlog(blogId: number): void {
    if (!this.client || !this.isConnected) return

    try {
      const sub = this.client.subscribe(`/topic/blogs.${blogId}`, (message: IMessage) => {
        try {
          const event: BlogSocketEvent = JSON.parse(message.body)
          const listeners = this.blogListeners.get(blogId)
          if (listeners) {
            listeners.forEach((fn) => fn(event))
          }
        } catch (e) {
          console.error('[WS Blog] Failed to parse blog message body:', e)
        }
      })
      this.blogSubscriptions.set(blogId, sub)
    } catch (err) {
      console.warn(`[WS Blog] Error subscribing to /topic/blogs.${blogId}:`, err)
    }
  }

  private subscribeStompTopicForFeed(): void {
    if (!this.client || !this.isConnected) return

    try {
      this.feedSubscription = this.client.subscribe('/topic/blogs', (message: IMessage) => {
        try {
          const event: BlogSocketEvent = JSON.parse(message.body)
          this.feedListeners.forEach((fn) => fn(event))
        } catch (e) {
          console.error('[WS Blog] Failed to parse feed message body:', e)
        }
      })
    } catch (err) {
      console.warn('[WS Blog] Error subscribing to /topic/blogs:', err)
    }
  }

  private reapplySubscriptions(): void {
    for (const blogId of this.blogListeners.keys()) {
      this.subscribeStompTopicForBlog(blogId)
    }
    if (this.feedListeners.size > 0) {
      this.subscribeStompTopicForFeed()
    }
  }

  private cleanupAllSubscriptions(): void {
    this.blogSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe()
      } catch {
        // ignore
      }
    })
    this.blogSubscriptions.clear()

    if (this.feedSubscription) {
      try {
        this.feedSubscription.unsubscribe()
      } catch {
        // ignore
      }
      this.feedSubscription = null
    }
  }
}

const blogSocketManager = new BlogSocketManager()

export const blogService = {
  // ==========================================
  // 1. PUBLIC BLOG APIs (/v1/public/blogs)
  // ==========================================

  /** Lấy danh sách bài viết công khai (hỗ trợ phân trang, lọc theo category, tìm kiếm) */
  async getPublicBlogs(params?: {
    page?: number
    size?: number
    category?: string
    search?: string
  }): Promise<PageResponse<BlogResponse>> {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<BlogResponse>>>(
        '/v1/public/blogs',
        {
          params: {
            page: params?.page ?? 0,
            size: params?.size ?? 10,
            ...(params?.category && params.category !== 'all' ? { category: params.category } : {}),
            ...(params?.search && params.search.trim() ? { search: params.search.trim() } : {}),
          },
        },
      )
      if (res.data?.result) {
        return res.data.result
      }
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài viết công khai:', error)
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    }
  },

  /** Xem chi tiết bài viết (tự động tăng views) */
  async getBlogDetail(blogId: number): Promise<BlogResponse> {
    const res = await axiosInstance.get<ApiResponse<BlogResponse>>(`/v1/public/blogs/${blogId}`)
    if (res.data?.result) return res.data.result
    throw new Error('Bài viết không tồn tại')
  },

  /** Toggle Like / Unlike bài viết (yêu cầu đăng nhập) */
  async toggleLike(blogId: number): Promise<{ message: string; isLiked: boolean }> {
    const res = await axiosInstance.post<ApiResponse<string>>(`/v1/public/blogs/${blogId}/like`)
    const msg = res.data?.result || ''
    const isLiked = msg.toUpperCase() === 'LIKED' || msg.includes('đã thích')
    return { message: msg, isLiked }
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
    } catch (error) {
      console.error(`Lỗi khi lấy bình luận cho bài viết ${blogId}:`, error)
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    }
  },

  /** Gửi bình luận cho bài viết (yêu cầu đăng nhập) */
  async addComment(blogId: number, content: string): Promise<BlogCommentResponse> {
    const req: BlogCommentRequest = { content }
    const res = await axiosInstance.post<ApiResponse<BlogCommentResponse>>(
      `/v1/public/blogs/${blogId}/comments`,
      req,
    )
    if (res.data?.result) return res.data.result
    throw new Error('Không thể thêm bình luận')
  },

  /** Xóa bình luận */
  async deleteComment(commentId: number): Promise<boolean> {
    await axiosInstance.delete(`/v1/public/blogs/comments/${commentId}`)
    return true
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
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài viết của shop:', error)
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    }
  },

  /** Shop tạo bài viết mới */
  async createShopBlog(data: BlogCreateRequest): Promise<BlogResponse> {
    const res = await axiosInstance.post<ApiResponse<BlogResponse>>('/v1/shop/blogs', data)
    if (res.data?.result) return res.data.result
    throw new Error('Không thể tạo bài viết')
  },

  /** Shop cập nhật bài viết */
  async updateShopBlog(blogId: number, data: BlogUpdateRequest): Promise<BlogResponse> {
    const res = await axiosInstance.put<ApiResponse<BlogResponse>>(
      `/v1/shop/blogs/${blogId}`,
      data,
    )
    if (res.data?.result) return res.data.result
    throw new Error('Không thể cập nhật bài viết')
  },

  /** Shop xóa bài viết */
  async deleteShopBlog(blogId: number): Promise<boolean> {
    await axiosInstance.delete(`/v1/shop/blogs/${blogId}`)
    return true
  },

  // ==========================================
  // 3. ADMIN & BACKWARD COMPATIBLE METHODS
  // ==========================================

  /** Admin lấy tất cả bài viết toàn sàn (mọi trạng thái, lọc, tìm kiếm) */
  async getAllBlogsForAdmin(params?: {
    page?: number
    size?: number
    status?: string
    category?: string
    search?: string
  }): Promise<PageResponse<BlogResponse>> {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<BlogResponse>>>(
        '/v1/admin/blogs',
        {
          params: {
            page: params?.page ?? 0,
            size: params?.size ?? 10,
            ...(params?.status && params.status !== 'all' ? { status: params.status } : {}),
            ...(params?.category && params.category !== 'all' ? { category: params.category } : {}),
            ...(params?.search && params.search.trim() ? { search: params.search.trim() } : {}),
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
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài viết quản trị:', error)
      return {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }
    }
  },

  /** Admin đổi trạng thái bài viết (PUBLISHED, HIDDEN, DRAFT) */
  async updateBlogStatus(
    blogId: number,
    status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT',
  ): Promise<BlogResponse> {
    const res = await axiosInstance.patch<ApiResponse<BlogResponse>>(
      `/v1/admin/blogs/${blogId}/status`,
      null,
      {
        params: { status },
      },
    )
    if (res.data?.result) return res.data.result
    throw new Error('Không thể cập nhật trạng thái bài viết')
  },

  async getAllBlogs(
    page: number = 0,
    size: number = 10,
    query?: string,
    category?: string,
    status?: string,
  ): Promise<ApiResponse<PageResponse<BlogResponse>>> {
    const paged = await this.getAllBlogsForAdmin({
      page,
      size,
      search: query,
      category,
      status,
    })
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
    status?: string,
  ): Promise<ApiResponse<PageResponse<BlogResponse>>> {
    return this.getAllBlogs(page, size, query, category, status)
  },

  async createBlog(data: BlogCreationRequest): Promise<ApiResponse<BlogResponse>> {
    const shopReq: BlogCreateRequest = {
      title: data.title,
      content: data.content,
      pictureUrl: data.pictureUrl || '',
      status: (data.status as 'PUBLISHED' | 'DRAFT') || 'PUBLISHED',
      category: data.category,
    }
    const created = await this.createShopBlog(shopReq)
    return { code: 200, result: created }
  },

  async updateBlog(id: number, data: Partial<BlogResponse>): Promise<ApiResponse<BlogResponse>> {
    const updated = await this.updateShopBlog(id, data as BlogUpdateRequest)
    return { code: 200, result: updated }
  },

  async deleteBlog(id: number): Promise<ApiResponse<boolean>> {
    await this.deleteShopBlog(id)
    return { code: 200, result: true }
  },

  // ==========================================
  // 5. REALTIME WEBSOCKET (STOMP / SockJS)
  // ==========================================

  /**
   * Kết nối WebSocket STOMP Broker
   */
  connectWebSocket(token?: string, onConnected?: () => void, onError?: (err: unknown) => void): void {
    blogSocketManager.connect(token, onConnected, onError)
  },

  /**
   * Ngắt kết nối WebSocket
   */
  disconnectWebSocket(): void {
    blogSocketManager.disconnect()
  },

  /**
   * Đăng ký lắng nghe sự kiện của một bài viết cụ thể (/topic/blogs.{blogId})
   */
  subscribeBlog(blogId: number, callback: BlogEventCallback): () => void {
    return blogSocketManager.subscribeBlog(blogId, callback)
  },

  /**
   * Đăng ký lắng nghe sự kiện trên bảng tin chung (/topic/blogs)
   */
  subscribeBlogFeed(callback: BlogEventCallback): () => void {
    return blogSocketManager.subscribeBlogFeed(callback)
  },
}

/** Alias để có thể dùng độc lập tương tự blogSocketService cũ */
export const blogSocketService = blogSocketManager

