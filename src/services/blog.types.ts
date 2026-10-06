import type { BlogCategory } from '@/types'

export interface BlogResponse {
  id: number
  title: string
  content: string
  category: BlogCategory
  imageUrl?: string
  pictureUrl?: string
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  createdAt?: string
  createAt?: string
  authorName?: string
  adminName?: string
  viewCount?: number
  views?: number
}

export interface BlogCreationRequest {
  title: string
  content: string
  category: BlogCategory
  status: string
  image?: File | null
}
