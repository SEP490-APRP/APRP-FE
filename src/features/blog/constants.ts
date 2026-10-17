import React from 'react'
import {
  Layers,
  Sprout,
  Calendar,
  BookOpen,
  Tag,
  Heart,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BlogCategory, BlogCategoryLabel } from '@/types'

export interface BlogCategoryOption {
  value: string
  label: string
  icon: React.ElementType
}

export const BLOG_CATEGORY_OPTIONS: BlogCategoryOption[] = [
  { value: 'all', label: 'Tất cả danh mục', icon: Layers },
  { value: BlogCategory.STORY, label: 'Chuyện nhà nông', icon: Sprout },
  { value: BlogCategory.NEW_PRODUCT, label: 'Nông sản mới & Mùa vụ', icon: Calendar },
  { value: BlogCategory.GUIDE, label: 'Cẩm nang & Mẹo vặt', icon: BookOpen },
  { value: BlogCategory.PROMOTION, label: 'Khuyến mãi & Ưu đãi', icon: Tag },
  { value: BlogCategory.SUC_KHOE, label: 'Sức khỏe dinh dưỡng', icon: Heart },
  { value: BlogCategory.NONG_NGHIEP, label: 'Nông nghiệp sạch', icon: ShieldCheck },
]

export const FARMER_STORIES_CATEGORIES: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Tất cả bài viết', icon: Sparkles },
  { id: 'STORY', label: 'Chuyện nhà nông', icon: Sprout },
  { id: 'NEW_PRODUCT', label: 'Mùa vụ & Nông sản mới', icon: Calendar },
  { id: 'GUIDE', label: 'Cẩm nang & Mẹo vặt', icon: BookOpen },
  { id: 'PROMOTION', label: 'Khuyến mãi & Ưu đãi', icon: Tag },
  { id: 'SUC_KHOE', label: 'Sức khỏe dinh dưỡng', icon: Heart },
  { id: 'NONG_NGHIEP', label: 'Nông nghiệp sạch', icon: ShieldCheck },
]

export function getCategoryBadge(categoryKey?: string): string {
  if (!categoryKey) return 'Chuyện nhà nông'
  return BlogCategoryLabel[categoryKey] || categoryKey
}

export const MODAL_BLOG_CATEGORY_OPTIONS: BlogCategoryOption[] =
  BLOG_CATEGORY_OPTIONS.filter((o) => o.value !== 'all')

export const POPULAR_FARMER_EMOJIS = [
  '🌱', '🌾', '🍎', '🥕', '🥦', '🌿', '🍅', '🥔',
  '🍓', '🌽', '🧺', '🚜', '☀️', '💚', '🏡', '⭐', '✨', '📌',
]

export const SAMPLE_BLOG_COVERS = [
  {
    title: 'Vườn rau hữu cơ',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Cà rốt mùa thu',
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Vườn cây ăn trái',
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Kho vận chuyển lạnh',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  },
]

/** Hàm chuẩn hóa hiển thị ngày đăng bài viết */
export function formatPublishDate(dateVal?: any): string {
  if (!dateVal) return 'Mới đây'
  try {
    let d: Date
    if (Array.isArray(dateVal) && dateVal.length >= 3) {
      d = new Date(
        dateVal[0],
        dateVal[1] - 1,
        dateVal[2],
        dateVal[3] || 0,
        dateVal[4] || 0,
        dateVal[5] || 0,
      )
    } else {
      d = new Date(dateVal)
    }

    if (isNaN(d.getTime())) {
      return 'Gần đây'
    }

    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return 'Gần đây'
  }
}
