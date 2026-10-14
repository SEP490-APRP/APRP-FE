import { useState, useMemo, type FormEvent } from 'react'
import {
  Heart,
  MessageCircle,
  MapPin,
  Send,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Search,
  Sprout,
  X,
  Eye,
  Plus,
  Share2,
  Trash2,
  Calendar,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react'

import heroFarmerImg from '../assets/hero-farmer.jpg'
import freshFarmerBannerImg from '../assets/fresh-farmer-banner.jpg'
import farmerForumBanner from '../assets/farmer-forum-banner.jpg'

import {
  usePublicBlogs,
  useBlogDetail,
  useBlogComments,
  useAddBlogComment,
  useDeleteBlogComment,
  useToggleBlogLike,
  useCreateShopBlog,
} from '@/features/blog'
import type { BlogResponse } from '@/services'
import { BlogCategory, BlogCategoryLabel } from '@/types'
import { useAuth } from '@/stores'
import Pagination from '@/components/ui/Pagination'
import { globalShowAlert } from '@/components/common/Popup'

interface FarmerStoriesPageProps {
  onAdd?: (id: string) => void
  onInfo?: (msg: string) => void
}

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất cả bài viết' },
  { id: 'STORY', label: 'Chuyện nhà nông' },
  { id: 'NEW_PRODUCT', label: 'Mùa vụ & Nông sản mới' },
  { id: 'GUIDE', label: 'Cẩm nang & Mẹo vặt' },
  { id: 'PROMOTION', label: 'Khuyến mãi & Ưu đãi' },
  { id: 'SUC_KHOE', label: 'Sức khỏe dinh dưỡng' },
  { id: 'NONG_NGHIEP', label: 'Nông nghiệp sạch' },
]

const SAMPLE_COVERS = [
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

export default function FarmerStoriesPage({ onAdd, onInfo }: FarmerStoriesPageProps) {
  const { user } = useAuth()
  const isShopOrAdmin = useMemo(() => {
    const role = (user?.role || '').toUpperCase()
    return role === 'SHOP' || role === 'FARMER' || role === 'ADMIN'
  }, [user])

  // Filter & Pagination state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 9

  // Queries & Mutations
  const { data: pagedData, isLoading, isError } = usePublicBlogs({
    page,
    size: pageSize,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  })

  const toggleLikeMutation = useToggleBlogLike()
  const addCommentMutation = useAddBlogComment()
  const deleteCommentMutation = useDeleteBlogComment()
  const createBlogMutation = useCreateShopBlog()

  // Active Reading Blog Modal (Full Reader)
  const [readingBlogId, setReadingBlogId] = useState<number | null>(null)
  const { data: blogDetail, isLoading: isLoadingDetail } = useBlogDetail(readingBlogId)

  // Active Quick Comment Modal
  const [commentingBlog, setCommentingBlog] = useState<BlogResponse | null>(null)
  const activeCommentBlogId = commentingBlog?.blogId || commentingBlog?.id || readingBlogId
  const { data: commentsData } = useBlogComments(activeCommentBlogId)
  const [commentText, setCommentText] = useState('')

  // Create Blog Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<BlogCategory>(BlogCategory.STORY)
  const [newPictureUrl, setNewPictureUrl] = useState(SAMPLE_COVERS[0].url)
  const [newContent, setNewContent] = useState('')

  // Community Note Board State (Góc tri ân nông dân)
  const [notes, setNotes] = useState([
    {
      id: '1',
      sender: 'Chị Mai Lan (Quận 7, TP.HCM)',
      message:
        'Cà rốt 2 nhánh của chú Bảy ăn ngọt lịm và nhiều nước hơn hẳn hàng siêu thị. Cả nhà em làm nước ép ai cũng khen!',
      time: '15 phút trước',
    },
    {
      id: '2',
      sender: 'Anh Tuấn Kiệt (Cầu Giấy, Hà Nội)',
      message:
        'Mới nhận thùng bắp cải Cầu Đất, lá xanh cuộn chắc nịch. Cảm ơn các bác nông dân đã chăm sóc tận tâm dù thời tiết khắc nghiệt.',
      time: '1 giờ trước',
    },
    {
      id: '3',
      sender: 'Bác sĩ Thu Hằng (Bệnh viện ĐHYD)',
      message:
        'Rau củ xấu mã giữ trọn vẹn chất chống oxy hóa tự nhiên. Rất ủng hộ dự án CapNong vì nông sản sạch và bền vững.',
      time: '3 giờ trước',
    },
  ])
  const [newNoteSender, setNewNoteSender] = useState('')
  const [newNoteMessage, setNewNoteMessage] = useState('')
  const [noteNotice, setNoteNotice] = useState('')

  // Filter blogs locally for instantaneous search
  const blogs = useMemo(() => {
    const list = pagedData?.content || []
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.content.toLowerCase().includes(q) ||
        (b.shopName && b.shopName.toLowerCase().includes(q)) ||
        (b.authorName && b.authorName.toLowerCase().includes(q)),
    )
  }, [pagedData, searchQuery])

  // Featured Post (first post on page 0 if no search)
  const featuredBlog = useMemo(() => {
    if (page === 0 && !searchQuery && selectedCategory === 'all' && blogs.length > 0) {
      return blogs[0]
    }
    return null
  }, [page, searchQuery, selectedCategory, blogs])

  // Normal feed blogs
  const feedBlogs = useMemo(() => {
    if (featuredBlog) {
      return blogs.slice(1)
    }
    return blogs
  }, [featuredBlog, blogs])

  // Handlers
  const handleLike = (e: React.MouseEvent, blogId: number) => {
    e.stopPropagation()
    if (!user) {
      globalShowAlert('Vui lòng đăng nhập để thả tim và lưu bài viết yêu thích.', 'Thông báo', 'info')
      return
    }
    toggleLikeMutation.mutate(blogId)
  }

  const handleOpenComment = (e: React.MouseEvent, blog: BlogResponse) => {
    e.stopPropagation()
    setCommentingBlog(blog)
  }

  const handleSendComment = (e: FormEvent, blogId: number) => {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!user) {
      globalShowAlert('Vui lòng đăng nhập để gửi bình luận.', 'Yêu cầu đăng nhập', 'info')
      return
    }
    addCommentMutation.mutate(
      { blogId, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('')
        },
      },
    )
  }

  const handleDeleteComment = (blogId: number, commentId: number) => {
    deleteCommentMutation.mutate({ blogId, commentId })
  }

  const handleCopyShareLink = (blog: BlogResponse) => {
    const url = window.location.origin + `/cau-chuyen-nong-dan?blogId=${blog.blogId || blog.id}`
    navigator.clipboard?.writeText(url)
    if (onInfo) {
      onInfo('Đã sao chép liên kết bài viết!')
    } else {
      globalShowAlert('Đã sao chép liên kết bài viết vào clipboard.', 'Thành công', 'success')
    }
  }

  const handleCreateBlogSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      globalShowAlert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.', 'Lỗi', 'error')
      return
    }
    createBlogMutation.mutate(
      {
        title: newTitle.trim(),
        content: newContent.trim(),
        pictureUrl: newPictureUrl,
        category: newCategory,
        status: 'PUBLISHED',
      },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false)
          setNewTitle('')
          setNewContent('')
          globalShowAlert('Đã đăng câu chuyện nhà vườn thành công!', 'Chúc mừng', 'success')
        },
        onError: () => {
          globalShowAlert('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.', 'Lỗi', 'error')
        },
      },
    )
  }

  const handleSendNote = (e: FormEvent) => {
    e.preventDefault()
    if (!newNoteMessage.trim()) return

    const newNote = {
      id: Date.now().toString(),
      sender: newNoteSender.trim() || (user?.fullName ? `${user.fullName} (Khách mua)` : 'Khách mua CapNong'),
      message: newNoteMessage.trim(),
      time: 'Vừa xong',
    }

    setNotes([newNote, ...notes])
    setNewNoteSender('')
    setNewNoteMessage('')
    setNoteNotice('Lời nhắn của bạn đã được gửi lên bảng tin tri ân nông dân!')
    setTimeout(() => setNoteNotice(''), 4000)
  }

  const formatPublishDate = (dateStr?: string) => {
    if (!dateStr) return 'Mới đăng gần đây'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return 'Gần đây'
    }
  }

  const getCategoryBadge = (categoryKey?: string) => {
    if (!categoryKey) return 'Chuyện nhà nông'
    return BlogCategoryLabel[categoryKey] || categoryKey
  }

  return (
    <div className="w-full bg-[#fbf9f3] text-[#1e2518] min-h-screen">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER                                                            */}
      {/* ========================================================================= */}
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] overflow-hidden flex items-center justify-center text-center shadow-lg">
        <img
          src={farmerForumBanner}
          alt="Bà con nông dân vui mừng thu hoạch nông sản tươi xanh"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/35" />

        <div className="relative z-10 flex flex-col items-center gap-3.5 px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#ffea79] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sprout size={14} className="animate-bounce" />
            <span>Bản Tin &amp; Diễn Đàn Nông Nghiệp CapNong</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md leading-tight">
            Câu Chuyện Nông Dân
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/90 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow">
            Nơi sẻ chia những phóng sự mùa vụ chân thật, nhật ký cứu trợ nông sản và
            nhịp cầu tri ân giữa người tiêu dùng với những người đổ mồ hôi trên cánh đồng Việt.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs text-white/90 font-medium mt-1">
            <a href="/" className="hover:text-[#ffea79] transition-colors">
              Trang chủ
            </a>
            <span className="text-white/40">/</span>
            <span className="text-[#ffea79] font-bold">Chuyện Nông Dân</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* ========================================================================= */}
        {/* 2. MODERN MAGAZINE SUBNAV TOOLBAR (1 Hàng gọn gàng, không rớt dòng)      */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-[#e2dcd0] pb-3">
          {/* Category Tabs (Trượt ngang mượt mà, không rớt hàng) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1">
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.id)
                    setPage(0)
                  }}
                  className={`px-3.5 py-2 text-xs sm:text-[13px] whitespace-nowrap transition-all cursor-pointer rounded-xl font-bold flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#2e5d16] text-white shadow-sm'
                      : 'text-[#586151] hover:text-[#191f14] hover:bg-[#f0ebe0]'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Right Toolbar: Compact Search & Action Button */}
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f8878]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài viết, nhà vườn..."
                className="w-full pl-9 pr-8 py-2 rounded-full bg-white border border-[#d6cfbf] text-xs focus:border-[#2e5d16] focus:ring-2 focus:ring-[#2e5d16]/15 outline-none shadow-xs transition-all placeholder:text-[#9ea698]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ea698] hover:text-[#2e5d16]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isShopOrAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-2 rounded-full bg-[#2e5d16] hover:bg-[#254d12] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Viết bài mới</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SPOTLIGHT STORY BANNER (Bài viết nổi bật tinh gọn)                     */}
        {/* ========================================================================= */}
        {featuredBlog && (
          <div className="bg-white rounded-3xl border border-[#e4ded2] p-5 sm:p-6 lg:p-7 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
            {/* Left Image */}
            <div
              onClick={() => setReadingBlogId(featuredBlog.blogId || featuredBlog.id || 1)}
              className="w-full lg:w-1/2 aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden relative shadow-xs group shrink-0 cursor-pointer"
            >
              <img
                src={featuredBlog.pictureUrl || featuredBlog.imageUrl || freshFarmerBannerImg}
                alt={featuredBlog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3.5 left-3.5 bg-[#c82626] text-white font-extrabold text-[10px] px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Tiêu Điểm Nông Sản</span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-medium text-[11px] flex items-center gap-1">
                <Eye size={12} />
                <span>{featuredBlog.views || featuredBlog.viewCount || 0} lượt đọc</span>
              </div>
            </div>

            {/* Right Content */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs text-[#6e7668]">
                  <span className="font-extrabold text-[#2e5d16] uppercase tracking-wider text-[11px]">
                    {featuredBlog.shopName || featuredBlog.authorName || 'Nhà Vườn CapNong'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#8b5521] text-[11px]">
                    <Calendar size={12} />
                    {formatPublishDate(featuredBlog.createAt || featuredBlog.createdAt)}
                  </span>
                  <span>•</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f2eee3] text-[#555d4e] font-semibold text-[10px]">
                    {getCategoryBadge(featuredBlog.category)}
                  </span>
                </div>

                <h2
                  onClick={() => setReadingBlogId(featuredBlog.blogId || featuredBlog.id || 1)}
                  className="text-xl sm:text-2xl font-black text-[#191f14] tracking-tight leading-snug hover:text-[#2e5d16] transition-colors cursor-pointer"
                >
                  {featuredBlog.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#555d4e] leading-relaxed line-clamp-3">
                  {featuredBlog.content.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3.5 border-t border-[#ede7dc] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 text-xs text-[#5c6555]">
                  <button
                    type="button"
                    onClick={(e) => handleLike(e, featuredBlog.blogId || featuredBlog.id || 1)}
                    className="flex items-center gap-1.5 hover:text-[#c82626] font-bold transition-all cursor-pointer"
                  >
                    <Heart
                      size={16}
                      className={
                        featuredBlog.isLikedByCurrentUser
                          ? 'text-[#c82626] fill-[#c82626]'
                          : 'text-[#848c7e]'
                      }
                    />
                    <span>{featuredBlog.likeCount || 0} Cảm kích</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenComment(e, featuredBlog)}
                    className="flex items-center gap-1.5 hover:text-[#2e5d16] font-bold transition-all cursor-pointer"
                  >
                    <MessageCircle size={16} className="text-[#848c7e]" />
                    <span>{featuredBlog.commentCount || 0} Bình luận</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyShareLink(featuredBlog)}
                    className="text-[#848c7e] hover:text-[#2e5d16] transition-colors"
                    title="Chia sẻ"
                  >
                    <Share2 size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setReadingBlogId(featuredBlog.blogId || featuredBlog.id || 1)}
                  className="px-4 py-2 rounded-full bg-[#2e5d16] hover:bg-[#254d12] text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Đọc tiếp</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. FEED GRID                                                              */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-[#191f14] flex items-center gap-2">
              <BookOpen size={22} className="text-[#2e5d16]" />
              <span>Bản Tin Mùa Vụ &amp; Kinh Nghiệm ({pagedData?.totalElements || blogs.length})</span>
            </h2>
            <span className="text-xs text-[#717a6c] font-medium hidden sm:inline">
              Cập nhật trực tiếp từ hệ sinh thái nhà vườn CapNong
            </span>
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-[#e6dfd2] p-5 shadow-sm animate-pulse flex flex-col gap-4"
                >
                  <div className="h-6 bg-[#f0ebd9] rounded-full w-2/3" />
                  <div className="aspect-[16/10] bg-[#f0ebd9] rounded-2xl" />
                  <div className="h-4 bg-[#f0ebd9] rounded w-full" />
                  <div className="h-4 bg-[#f0ebd9] rounded w-4/5" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && feedBlogs.length === 0 && !featuredBlog && (
            <div className="bg-white rounded-3xl border border-[#e6dfd2] p-12 text-center flex flex-col items-center gap-3">
              <Sprout size={48} className="text-[#2e5d16]/40" />
              <h3 className="text-base font-bold text-[#191f14]">Chưa có bài viết phù hợp</h3>
              <p className="text-xs text-[#6e7668] max-w-sm">
                Hãy thử chọn danh mục khác hoặc xóa bộ lọc tìm kiếm để xem thêm câu chuyện ruộng vườn.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
                className="mt-2 px-5 py-2 rounded-full bg-[#2e5d16] text-white text-xs font-bold"
              >
                Xem tất cả bài viết
              </button>
            </div>
          )}

          {/* Cards Grid */}
          {!isLoading && feedBlogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {feedBlogs.map((blog) => {
                const blogId = blog.blogId || blog.id || 0
                const isLiked = blog.isLikedByCurrentUser
                const thumb = blog.pictureUrl || blog.imageUrl || heroFarmerImg

                return (
                  <div
                    key={blogId}
                    className="bg-white rounded-3xl border border-[#e6dfd2] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-4 group"
                  >
                    <div>
                      {/* Top Shop Bar */}
                      <div className="flex items-center justify-between mb-3.5 text-xs">
                        <div className="flex items-center gap-2.5">
                          {blog.shopAvatar ? (
                            <img
                              src={blog.shopAvatar}
                              alt={blog.shopName || 'Shop'}
                              className="w-8 h-8 rounded-full object-cover border border-[#e0dad0]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#2e5d16] text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                              {(blog.shopName || blog.authorName || 'C').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-[#191f14] leading-tight truncate max-w-[150px]">
                              {blog.shopName || blog.authorName || 'Nhà vườn CapNong'}
                            </div>
                            <div className="text-[10px] text-[#717a6c] flex items-center gap-1">
                              <Calendar size={10} />
                              <span>{formatPublishDate(blog.createAt || blog.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#f2eee3] text-[#555d4e]">
                          {getCategoryBadge(blog.category)}
                        </span>
                      </div>

                      {/* Thumbnail Image */}
                      <div
                        onClick={() => setReadingBlogId(blogId)}
                        className="aspect-[16/10] rounded-2xl overflow-hidden mb-3.5 relative cursor-pointer shadow-sm group-hover:shadow-md transition-shadow"
                      >
                        <img
                          src={thumb}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-medium text-[10px] flex items-center gap-1">
                          <Eye size={11} />
                          <span>{blog.views || blog.viewCount || 0}</span>
                        </div>
                      </div>

                      {/* Title & Preview */}
                      <h3
                        onClick={() => setReadingBlogId(blogId)}
                        className="font-black text-base text-[#191f14] leading-snug group-hover:text-[#2e5d16] transition-colors line-clamp-2 cursor-pointer mb-2"
                      >
                        {blog.title}
                      </h3>

                      <p className="text-xs text-[#555d4e] leading-relaxed line-clamp-3">
                        {blog.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>

                    {/* Bottom Interactive Bar */}
                    <div className="pt-3.5 border-t border-[#ede7dc] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => handleLike(e, blogId)}
                          className="flex items-center gap-1 font-bold transition-colors cursor-pointer"
                        >
                          <Heart
                            size={16}
                            className={
                              isLiked
                                ? 'text-[#c82626] fill-[#c82626]'
                                : 'text-[#848c7e] hover:text-[#c82626]'
                            }
                          />
                          <span className={isLiked ? 'text-[#c82626]' : 'text-[#666e60]'}>
                            {blog.likeCount || 0}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenComment(e, blog)}
                          className="flex items-center gap-1 text-[#666e60] hover:text-[#2e5d16] font-bold transition-colors cursor-pointer"
                        >
                          <MessageCircle size={16} />
                          <span>{blog.commentCount || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyShareLink(blog)}
                          className="text-[#848c7e] hover:text-[#2e5d16] transition-colors"
                          title="Sao chép liên kết"
                        >
                          <Share2 size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReadingBlogId(blogId)}
                        className="text-xs font-black text-[#2e5d16] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Đọc tiếp</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagedData && pagedData.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                pageInfo={{
                  page: pagedData.page,
                  size: pagedData.size,
                  totalElements: pagedData.totalElements,
                  totalPages: pagedData.totalPages,
                  first: pagedData.first,
                  last: pagedData.last,
                }}
                onPageChange={(newPage) => {
                  setPage(newPage)
                  window.scrollTo({ top: 350, behavior: 'smooth' })
                }}
              />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. COMMUNITY BOARD: GÓC TRI ÂN & ĐỘNG VIÊN NÔNG DÂN                       */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-[#244e18] via-[#1c3f13] to-[#11290b] text-white rounded-[36px] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-8">
            <div className="text-center flex flex-col items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ffea79]">
                <Heart size={14} className="fill-[#ffea79]" />
                <span>Góc Tri Ân &amp; Kết Nối Trực Tiếp</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                Gửi Lời Động Viên Đến Những Người Nông Dân
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Mỗi tin nhắn chân tình từ người tiêu dùng là động lực to lớn giúp bà con
                an tâm bám ruộng, giữ trọn cam kết canh tác sạch và nông sản an toàn.
              </p>
            </div>

            <form
              onSubmit={handleSendNote}
              className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/20 flex flex-col gap-3"
            >
              {noteNotice && (
                <div className="p-3 bg-[#eaf5e1] text-[#2c5f11] rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{noteNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newNoteSender}
                  onChange={(e) => setNewNoteSender(e.target.value)}
                  placeholder="Tên của bạn (VD: Chị Mai - TP.HCM)..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/70 text-xs focus:outline-none focus:bg-white/30"
                />

                <input
                  type="text"
                  required
                  value={newNoteMessage}
                  onChange={(e) => setNewNoteMessage(e.target.value)}
                  placeholder="Viết lời nhắn động viên bà con nông dân..."
                  className="w-full sm:col-span-2 px-4 py-2.5 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-white/70 text-xs focus:outline-none focus:bg-white/30"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#ffea79] hover:bg-[#ffe34f] text-[#331c00] font-black text-xs uppercase tracking-wide transition-all shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Gửi lời nhắn ngay</span>
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col justify-between gap-2 shadow-sm"
                >
                  <p className="text-xs text-white/90 leading-relaxed italic">"{note.message}"</p>
                  <div className="flex items-center justify-between text-[11px] text-white/75 pt-2 border-t border-white/15">
                    <strong className="text-[#ffea79]">{note.sender}</strong>
                    <span>{note.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: FULL ARTICLE READER                                                */}
      {/* ========================================================================= */}
      {readingBlogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 lg:p-10 shadow-2xl border border-[#ede8df] relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setReadingBlogId(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center transition-colors cursor-pointer z-10"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            {isLoadingDetail && (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-[#2e5d16]/30 border-t-[#2e5d16] rounded-full animate-spin" />
                <p className="text-xs text-[#717a6c] font-medium">Đang tải câu chuyện ruộng vườn...</p>
              </div>
            )}

            {blogDetail && (
              <div className="flex flex-col gap-5">
                {/* Meta Header */}
                <div className="flex items-center gap-3 text-xs text-[#6e7668]">
                  <span className="font-extrabold text-[#2e5d16]">
                    {blogDetail.shopName || blogDetail.authorName || 'Nhà vườn CapNong'}
                  </span>
                  <span>•</span>
                  <span>{formatPublishDate(blogDetail.createAt || blogDetail.createdAt)}</span>
                  <span>•</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f2eee3] text-[#555d4e] font-semibold text-[11px]">
                    {getCategoryBadge(blogDetail.category)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {blogDetail.views || blogDetail.viewCount || 0} lượt đọc
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#191f14] tracking-tight leading-snug">
                  {blogDetail.title}
                </h2>

                {/* Cover Image */}
                <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md my-1">
                  <img
                    src={blogDetail.pictureUrl || blogDetail.imageUrl || freshFarmerBannerImg}
                    alt={blogDetail.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content Body */}
                <div className="space-y-4 text-sm sm:text-base text-[#343d2f] leading-relaxed py-2">
                  {blogDetail.content.includes('<p') ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: blogDetail.content }}
                      className="prose max-w-none text-inherit"
                    />
                  ) : (
                    blogDetail.content.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))
                  )}
                </div>

                {/* Reader Appreciation Bar */}
                <div className="pt-6 border-t border-[#ede7dc] flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={(e) => handleLike(e, blogDetail.blogId || blogDetail.id || 1)}
                    className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                      blogDetail.isLikedByCurrentUser
                        ? 'bg-[#c82626] text-white'
                        : 'bg-[#faede8] text-[#c82626] hover:bg-[#c82626] hover:text-white'
                    }`}
                  >
                    <Heart
                      size={16}
                      className={blogDetail.isLikedByCurrentUser ? 'fill-white' : ''}
                    />
                    <span>{blogDetail.likeCount || 0} Người đã cảm kích</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyShareLink(blogDetail)}
                    className="px-4 py-2.5 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 size={14} />
                    <span>Chia sẻ bài viết</span>
                  </button>
                </div>

                {/* Inline Comments Section */}
                <div className="mt-6 pt-6 border-t border-[#ede7dc] flex flex-col gap-4">
                  <h3 className="font-black text-lg text-[#191f14] flex items-center gap-2">
                    <MessageCircle size={18} className="text-[#2e5d16]" />
                    <span>Bình luận &amp; Thảo luận ({commentsData?.totalElements || 0})</span>
                  </h3>

                  {/* Comment Form */}
                  <form
                    onSubmit={(e) => handleSendComment(e, blogDetail.blogId || blogDetail.id || 1)}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={
                        user
                          ? 'Viết lời nhắn động viên hoặc chia sẻ góc nhìn của bạn...'
                          : 'Vui lòng đăng nhập để gửi bình luận...'
                      }
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#f5f7f2] border border-[#e4e0d4] text-xs sm:text-sm outline-none focus:border-[#2e5d16]"
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending}
                      className="px-5 py-3 rounded-2xl bg-[#2e5d16] hover:bg-[#254d12] text-white font-bold text-xs shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {addCommentMutation.isPending ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-3 mt-2 max-h-72 overflow-y-auto pr-1">
                    {commentsData?.content && commentsData.content.length > 0 ? (
                      commentsData.content.map((cm) => (
                        <div
                          key={cm.commentId}
                          className="p-3.5 bg-[#fbf9f4] rounded-2xl border border-[#eee7db] flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {cm.userAvatar ? (
                                <img
                                  src={cm.userAvatar}
                                  alt={cm.userName}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#2e5d16] text-white text-[10px] font-bold flex items-center justify-center">
                                  {cm.userName.charAt(0)}
                                </div>
                              )}
                              <strong className="text-[#191f14]">{cm.userName}</strong>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#808879]">
                              <span>{formatPublishDate(cm.createAt)}</span>
                              {String(user?.id) === String(cm.userId) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteComment(
                                      blogDetail.blogId || blogDetail.id || 1,
                                      cm.commentId,
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700 p-0.5"
                                  title="Xóa bình luận"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-[#454d3f] pl-8">{cm.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#7f8877] italic text-center py-4">
                        Chưa có bình luận nào. Hãy là người đầu tiên để lại lời nhắn!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK COMMENT DRAWER                                               */}
      {/* ========================================================================= */}
      {commentingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#ede8df] relative max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#ede7dc]">
                <h3 className="font-black text-base text-[#191f14] flex items-center gap-2">
                  <MessageCircle size={18} className="text-[#2e5d16]" />
                  <span>Bình Luận Bài Viết</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setCommentingBlog(null)}
                  className="w-8 h-8 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs font-bold text-[#2e5d16] mt-3 mb-4 truncate">
                {commentingBlog.title}
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {commentsData?.content && commentsData.content.length > 0 ? (
                  commentsData.content.map((cm) => (
                    <div
                      key={cm.commentId}
                      className="p-3 bg-[#faf7f0] rounded-2xl border border-[#eee7da]"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <strong className="text-[#191f14]">{cm.userName}</strong>
                        <span className="text-[#889182]">{formatPublishDate(cm.createAt)}</span>
                      </div>
                      <p className="text-xs text-[#444c3e]">{cm.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#828c7b] italic text-center py-6">
                    Chưa có bình luận nào cho bài viết này.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Comment Form */}
            <form
              onSubmit={(e) =>
                handleSendComment(e, commentingBlog.blogId || commentingBlog.id || 1)
              }
              className="pt-4 border-t border-[#ede7dc] flex gap-2"
            >
              <input
                type="text"
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết lời động viên hoặc nhận xét..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#2e5d16] text-xs outline-none"
              />
              <button
                type="submit"
                disabled={addCommentMutation.isPending}
                className="px-5 py-2.5 rounded-2xl bg-[#2e5d16] hover:bg-[#254d12] text-white font-bold text-xs shadow-md shrink-0 cursor-pointer disabled:opacity-50"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SHOP BLOG (Dành cho Nhà Vườn / Shop)                         */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ede8df] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleCreateBlogSubmit} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#2e5d16] text-xs font-bold uppercase tracking-wide">
                <Sparkles size={16} />
                <span>Kênh Nhà Vườn CapNong</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#191f14]">
                Chia Sẻ Câu Chuyện Mùa Vụ &amp; Kinh Nghiệm
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-[#3a4234]">Tiêu đề bài viết *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Vụ cam sành Hàm Yên được mùa ngọt mọng nước..."
                  className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-[#3a4234]">Danh mục bài viết</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BlogCategory)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none bg-white font-medium"
                  >
                    <option value={BlogCategory.STORY}>📖 Chuyện nhà nông</option>
                    <option value={BlogCategory.NEW_PRODUCT}>🌱 Nông sản mới &amp; Mùa vụ</option>
                    <option value={BlogCategory.GUIDE}>💡 Cẩm nang &amp; Mẹo vặt</option>
                    <option value={BlogCategory.PROMOTION}>🎁 Khuyến mãi &amp; Ưu đãi</option>
                    <option value={BlogCategory.SUC_KHOE}>🥗 Sức khỏe dinh dưỡng</option>
                    <option value={BlogCategory.NONG_NGHIEP}>🚜 Nông nghiệp sạch</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-[#3a4234]">
                    Link ảnh bìa bài viết
                  </label>
                  <input
                    type="url"
                    value={newPictureUrl}
                    onChange={(e) => setNewPictureUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none"
                  />
                </div>
              </div>

              {/* Sample cover choices */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#6a7364]">
                  Hoặc chọn nhanh ảnh bìa mẫu:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_COVERS.map((sc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewPictureUrl(sc.url)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        newPictureUrl === sc.url
                          ? 'border-[#2e5d16] scale-105 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={sc.url} alt={sc.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        {sc.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-[#3a4234]">
                  Nội dung chi tiết câu chuyện *
                </label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Chia sẻ về quá trình gieo trồng, chăm sóc, thu hoạch hoặc những trăn trở, niềm vui của nhà vườn..."
                  className="w-full p-4 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#ede7dc]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createBlogMutation.isPending}
                  className="px-6 py-2.5 rounded-full bg-[#2e5d16] hover:bg-[#254d12] text-white text-xs font-black uppercase tracking-wide shadow-md cursor-pointer disabled:opacity-50"
                >
                  {createBlogMutation.isPending ? 'Đang xuất bản...' : 'Đăng câu chuyện ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
