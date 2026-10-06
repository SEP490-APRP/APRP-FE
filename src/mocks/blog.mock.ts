import type { BlogCategory } from '@/types'
import type { BlogResponse } from '@/services/blog.types'

export const mockBlogs: BlogResponse[] = [
  {
    id: 1,
    title: 'Tại sao nông sản xấu mã lại giữ trọn vị ngọt tự nhiên?',
    content:
      'Nông sản xấu mã không dùng hóa chất kích thích tăng trưởng hay thuốc bóng vỏ giữ được hàm lượng chất dinh dưỡng và hương vị tự nhiên nguyên bản...',
    category: 'SUC_KHOE' as BlogCategory,
    imageUrl:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    pictureUrl:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    status: 'PUBLISHED',
    createdAt: '2026-03-15T09:00:00Z',
    createAt: '2026-03-15T09:00:00Z',
    authorName: 'Ban Biên Tập CapNong',
    adminName: 'Ban Biên Tập CapNong',
    viewCount: 1240,
    views: 1240,
  },
  {
    id: 2,
    title: 'Mô hình logistics ghép chuyến giúp nông dân giảm 40% chi phí vận chuyển',
    content:
      'Ứng dụng thuật toán ghép chuyến thông minh giúp bà con nông dân gom chung chuyến xe lạnh về kho trung chuyển...',
    category: 'NONG_NGHIEP' as BlogCategory,
    imageUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    pictureUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    status: 'PUBLISHED',
    createdAt: '2026-03-20T14:30:00Z',
    createAt: '2026-03-20T14:30:00Z',
    authorName: 'Ks. Nông Nghiệp Minh Hoàng',
    adminName: 'Ks. Nông Nghiệp Minh Hoàng',
    viewCount: 890,
    views: 890,
  },
]
