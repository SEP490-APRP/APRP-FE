import type { BlogCategory } from '@/types'
import type { BlogResponse } from '@/services/blog.types'

export const mockBlogs: BlogResponse[] = [
  {
    blogId: 1,
    id: 1,
    title: 'Tại sao nông sản xấu mã lại giữ trọn vị ngọt tự nhiên?',
    content:
      'Nông sản xấu mã không dùng hóa chất kích thích tăng trưởng hay thuốc bóng vỏ giữ được hàm lượng chất dinh dưỡng và hương vị tự nhiên nguyên bản. Củ quả tuy có vết sạm ngoài vỏ do nắng gió hay kích thước không đồng đều, nhưng bên trong ruột đặc và chứa nồng độ đường tự nhiên cao hơn.',
    category: 'SUC_KHOE' as BlogCategory,
    imageUrl:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    pictureUrl:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    status: 'PUBLISHED',
    createdAt: '2026-03-15T09:00:00Z',
    createAt: '2026-03-15T09:00:00Z',
    authorName: 'Ban Biên Tập CapNong',
    adminName: 'Ban Biên Tập CapNong',
    shopName: 'Nông Trại Hữu Cơ Đà Lạt',
    shopAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    viewCount: 1240,
    views: 1240,
    likeCount: 185,
    commentCount: 24,
    isLikedByCurrentUser: false,
  },
  {
    blogId: 2,
    id: 2,
    title: 'Hành Trình 3 Ngày Giải Cứu 12 Tấn Bắp Cải Cầu Đất Trước Mùa Sương Muối',
    content:
      'Đợt rét đậm bất ngờ khiến hàng vạn búp bắp cải bị sạm lớp lá bẹ ngoài. Nhờ CapNong phân loại bằng AI và kết nối khách hàng, 12 tấn rau đã đến tay người tiêu dùng nguyên vẹn, giữ nụ cười cho bà con nông dân sau bao ngày chăm sóc.',
    category: 'STORY' as BlogCategory,
    imageUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    pictureUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    status: 'PUBLISHED',
    createdAt: '2026-03-18T10:15:00Z',
    createAt: '2026-03-18T10:15:00Z',
    authorName: 'Chú Bảy Cầu Đất',
    adminName: 'Chú Bảy Cầu Đất',
    shopName: 'HTX Nông Nghiệp Cầu Đất',
    shopAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    viewCount: 3210,
    views: 3210,
    likeCount: 420,
    commentCount: 56,
    isLikedByCurrentUser: true,
  },
  {
    blogId: 3,
    id: 3,
    title: 'Mô hình logistics ghép chuyến giúp nông dân giảm 40% chi phí vận chuyển',
    content:
      'Ứng dụng thuật toán ghép chuyến thông minh giúp bà con nông dân gom chung chuyến xe lạnh về kho trung chuyển. Giải pháp vừa tiết kiệm nhiên liệu, giảm phát thải carbon, vừa đảm bảo nông sản được bảo quản tươi ngon nhất.',
    category: 'NONG_NGHIEP' as BlogCategory,
    imageUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    pictureUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    status: 'PUBLISHED',
    createdAt: '2026-03-20T14:30:00Z',
    createAt: '2026-03-20T14:30:00Z',
    authorName: 'Ks. Nông Nghiệp Minh Hoàng',
    adminName: 'Ks. Nông Nghiệp Minh Hoàng',
    shopName: 'Kho Lạnh Thông Minh Cáp Nông',
    shopAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    viewCount: 890,
    views: 890,
    likeCount: 96,
    commentCount: 12,
    isLikedByCurrentUser: false,
  },
  {
    blogId: 4,
    id: 4,
    title: 'Vườn Bưởi Da Xanh Bến Tre: Xấu mã rám nắng nhưng tép mọng nước 100%',
    content:
      'Cây bưởi cho trái tự nhiên đón nắng gió nên vỏ ngoài rám sần. Nhưng chính những trái bưởi này lại có vị ngọt thanh đậm đà và tép mọng nước nhất. Người tiêu dùng ngày nay đã hiểu và trân trọng sự tự nhiên ấy.',
    category: 'STORY' as BlogCategory,
    imageUrl:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    pictureUrl:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    status: 'PUBLISHED',
    createdAt: '2026-03-22T08:00:00Z',
    createAt: '2026-03-22T08:00:00Z',
    authorName: 'Cô Ba Út',
    adminName: 'Cô Ba Út',
    shopName: 'Vườn Trái Cây Bến Tre',
    shopAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    viewCount: 1540,
    views: 1540,
    likeCount: 230,
    commentCount: 31,
    isLikedByCurrentUser: false,
  },
]
