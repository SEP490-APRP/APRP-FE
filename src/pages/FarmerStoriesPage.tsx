import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react'
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
  Flame,
  ChevronDown,
  Check,
  Tag,
  ShieldCheck,
  UploadCloud,
  Loader2,
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Smile,
  Save,
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
  BlogRichTextToolbar,
} from '@/features/blog'
import { uploadService, type BlogResponse, type BlogStatus } from '@/services'
import { BlogCategory, BlogCategoryLabel } from '@/types'
import { useAuth } from '@/stores'
import Pagination from '@/components/ui/Pagination'
import { globalShowAlert } from '@/components/common/Popup'

interface FarmerStoriesPageProps {
  onAdd?: (id: string) => void
  onInfo?: (msg: string) => void
}

const CATEGORY_TABS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Tất cả bài viết', icon: Sparkles },
  { id: 'STORY', label: 'Chuyện nhà nông', icon: Sprout },
  { id: 'NEW_PRODUCT', label: 'Mùa vụ & Nông sản mới', icon: Calendar },
  { id: 'GUIDE', label: 'Cẩm nang & Mẹo vặt', icon: BookOpen },
  { id: 'PROMOTION', label: 'Khuyến mãi & Ưu đãi', icon: Tag },
  { id: 'SUC_KHOE', label: 'Sức khỏe dinh dưỡng', icon: Heart },
  { id: 'NONG_NGHIEP', label: 'Nông nghiệp sạch', icon: ShieldCheck },
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

  // Category dropdown inside search bar
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  // Modal category dropdown state
  const [isModalCategoryMenuOpen, setIsModalCategoryMenuOpen] = useState(false)
  const modalCategoryMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false)
      }
      if (
        modalCategoryMenuRef.current &&
        !modalCategoryMenuRef.current.contains(e.target as Node)
      ) {
        setIsModalCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
  const [newStatus, setNewStatus] = useState<BlogStatus>('PUBLISHED')
  const [isUploadingModalImage, setIsUploadingModalImage] = useState(false)
  const modalFileInputRef = useRef<HTMLInputElement>(null)
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Featured Post (first post on page 0 if no search & all category)
  const featuredBlog = useMemo(() => {
    if (page === 0 && !searchQuery && selectedCategory === 'all' && blogs.length > 0) {
      return blogs[0]
    }
    return null
  }, [page, searchQuery, selectedCategory, blogs])

  // Trending stories (next up to 3 posts on page 0)
  const trendingBlogs = useMemo(() => {
    if (featuredBlog && blogs.length > 1) {
      return blogs.slice(1, 4)
    }
    return []
  }, [featuredBlog, blogs])

  // Normal feed blogs
  const feedBlogs = useMemo(() => {
    if (featuredBlog) {
      return blogs.slice(1 + trendingBlogs.length)
    }
    return blogs
  }, [featuredBlog, trendingBlogs, blogs])

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

  const handleModalImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      globalShowAlert('Kích thước ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn.', 'Ảnh quá lớn', 'error')
      return
    }

    if (!file.type.startsWith('image/')) {
      globalShowAlert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP...).', 'Định dạng sai', 'error')
      return
    }

    try {
      setIsUploadingModalImage(true)
      const res = await uploadService.uploadImage(file, 'blogs')
      const uploadedUrl = res.result?.url
      if (uploadedUrl) {
        setNewPictureUrl(uploadedUrl)
      } else {
        throw new Error('Không nhận được liên kết ảnh sau khi tải lên')
      }
    } catch (err: any) {
      console.error('Failed to upload blog image:', err)
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
      globalShowAlert(msg, 'Tải ảnh thất bại', 'error')
    } finally {
      setIsUploadingModalImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleCreateBlogSubmitWithStatus = (e: FormEvent, targetStatus: BlogStatus = newStatus) => {
    e.preventDefault()
    if (isUploadingModalImage) {
      globalShowAlert('Vui lòng chờ tải ảnh lên hoàn tất trước khi lưu bài viết.', 'Đang tải ảnh', 'warning')
      return
    }
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
        status: targetStatus,
      },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false)
          setNewTitle('')
          setNewContent('')
          const msg =
            targetStatus === 'DRAFT'
              ? 'Đã lưu câu chuyện vào bản nháp thành công!'
              : 'Đã đăng câu chuyện nhà vườn thành công!'
          globalShowAlert(msg, 'Chúc mừng', 'success')
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

  const formatPublishDate = (dateVal?: any) => {
    if (!dateVal) return 'Mới đăng gần đây'
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

  const getCategoryBadge = (categoryKey?: string) => {
    if (!categoryKey) return 'Chuyện nhà nông'
    return BlogCategoryLabel[categoryKey] || categoryKey
  }

  return (
    <div className="w-full bg-[#fbf9f3] text-[#1e2518] min-h-screen">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER                                                            */}
      {/* ========================================================================= */}
      <div className="relative w-full h-56 sm:h-64 md:h-72 overflow-hidden flex items-center justify-center text-center shadow-md">
        <img
          src={farmerForumBanner}
          alt="Bà con nông dân vui mừng thu hoạch nông sản tươi xanh"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />

        <div className="relative z-10 flex flex-col items-center gap-3 px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#ffea79] text-[11px] font-bold uppercase tracking-wider shadow-xs">
            <Sprout size={13} className="animate-bounce" />
            <span>Bản Tin &amp; Diễn Đàn Nông Nghiệp CapNong</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md leading-tight">
            Câu Chuyện Nông Dân
          </h1>

          <p className="text-xs sm:text-sm text-white/90 font-normal max-w-xl mx-auto leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-none">
            Nơi sẻ chia những phóng sự mùa vụ chân thật, nhật ký cứu trợ nông sản và
            nhịp cầu tri ân giữa người tiêu dùng với những người nông dân Việt.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[11px] text-white/90 font-medium">
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
        {/* 2. MODERN FULL-WIDTH OMNI-SEARCH BAR (Enterprise Standard)                */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            {/* Master Search Bar (Kéo dài toàn chiều rộng, kích thước thoải mái) */}
            <div className="relative flex-1 w-full">
              <div className="flex items-center bg-white rounded-2xl border border-[#ded7c8] shadow-xs hover:border-[#2e5d16]/60 focus-within:border-[#2e5d16] focus-within:ring-4 focus-within:ring-[#2e5d16]/10 transition-all p-1.5 sm:p-2">
                {/* Integrated Category Dropdown Trigger */}
                <div className="relative shrink-0" ref={categoryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#f7f5ed] hover:bg-[#ede7d9] text-xs sm:text-sm font-bold text-[#2e5d16] transition-colors cursor-pointer border border-[#e8e2d4]"
                  >
                    {(() => {
                      const cur =
                        CATEGORY_TABS.find((t) => t.id === selectedCategory) || CATEGORY_TABS[0]
                      const CurIcon = cur.icon
                      return (
                        <>
                          <CurIcon size={16} className="text-[#2e5d16] shrink-0" />
                          <span className="max-w-[140px] truncate">{cur.label}</span>
                        </>
                      )
                    })()}
                    <ChevronDown
                      size={14}
                      className={`text-[#7f8878] transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180 text-[#2e5d16]' : ''
                        }`}
                    />
                  </button>

                  {/* Popover Menu */}
                  {isCategoryMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl border border-[#e2dcd0] shadow-2xl p-1.5 z-40 animate-fadeIn">
                      <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#858f7e] border-b border-[#f0ebd9] mb-1">
                        Lọc theo chuyên mục bài viết
                      </div>
                      {CATEGORY_TABS.map((tab) => {
                        const TabIcon = tab.icon
                        const isSelected = selectedCategory === tab.id
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(tab.id)
                              setPage(0)
                              setIsCategoryMenuOpen(false)
                            }}
                            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${isSelected
                              ? 'bg-[#eaf3e5] text-[#2e5d16] font-bold'
                              : 'text-[#444d3d] hover:bg-[#f6f4ee] hover:text-[#1c2216]'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <TabIcon
                                size={15}
                                className={isSelected ? 'text-[#2e5d16]' : 'text-[#7f8878]'}
                              />
                              <span className="truncate">{tab.label}</span>
                            </div>
                            {isSelected && <Check size={15} className="text-[#2e5d16] shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Vertical Divider */}
                <div className="h-7 w-px bg-[#e4ded2] mx-2.5 hidden sm:block shrink-0" />

                {/* Search Text Input */}
                <div className="flex-1 flex items-center min-w-0 pr-2">
                  <Search size={17} className="text-[#7f8878] ml-2 shrink-0 hidden sm:block" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tiêu đề, nhật ký canh tác, tên nông dân hoặc nhà vườn..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-[#191f14] placeholder:text-[#9ea698]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 text-[#9ea698] hover:text-[#191f14] transition-colors shrink-0 cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Quick Search Action Button */}
                <div className="shrink-0 hidden sm:block">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-[#2e5d16] hover:bg-[#254d12] text-white text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search size={14} />
                    <span>Tìm kiếm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Create Blog Button for Farmer / Admin */}
            {isShopOrAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-[#2e5d16] hover:bg-[#254d12] text-white font-extrabold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Viết bài mới</span>
              </button>
            )}
          </div>

          {/* Active Filter Summary Bar (Chỉ hiển thị khi có bộ lọc hoặc từ khóa) */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#555d4e] pt-1">
              <span className="font-medium text-[#717a6c]">Đang lọc:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf3e5] text-[#244e18] font-bold border border-[#cbe1be]">
                  <span>{CATEGORY_TABS.find((t) => t.id === selectedCategory)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="hover:text-red-600 transition-colors cursor-pointer"
                    title="Xóa danh mục này"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4eee4] text-[#3e4537] font-bold border border-[#ded7c8]">
                  <span>Từ khóa: "{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-red-600 transition-colors cursor-pointer"
                    title="Xóa từ khóa"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
                className="text-[11px] text-[#848c7e] hover:text-[#c82626] underline ml-1 cursor-pointer font-medium"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. EDITORIAL MAGAZINE 2-COLUMN SECTION (Tiêu điểm & Đang quan tâm)        */}
        {/* ========================================================================= */}
        {featuredBlog && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Cột Trái: Tiêu điểm mùa vụ */}
            <div
              className={`${trendingBlogs.length > 0
                ? 'lg:col-span-7 xl:col-span-8 flex flex-col justify-between gap-4'
                : 'lg:col-span-12'
                } bg-white rounded-3xl border border-[#e4ded2] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow`}
            >
              {trendingBlogs.length === 0 ? (
                // HORIZONTAL MAGAZINE LAYOUT WHEN ONLY 1 ARTICLE / NO TRENDING ARTICLES
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Image (gọn gàng, tỉ lệ chuẩn, không bao giờ bị phóng to bè) */}
                  <div
                    onClick={() => setReadingBlogId(featuredBlog.blogId || featuredBlog.id || 1)}
                    className="md:col-span-5 aspect-[16/10] sm:aspect-[4/3] max-h-72 rounded-2xl overflow-hidden relative shadow-xs group cursor-pointer"
                  >
                    <img
                      src={featuredBlog.pictureUrl || featuredBlog.imageUrl || freshFarmerBannerImg}
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-[#c82626] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>Tiêu Điểm Mùa Vụ</span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-medium text-[11px] flex items-center gap-1">
                      <Eye size={12} />
                      <span>{featuredBlog.views || featuredBlog.viewCount || 0} lượt đọc</span>
                    </div>
                  </div>

                  {/* Right Column: Metadata & Details */}
                  <div className="md:col-span-7 flex flex-col justify-between h-full py-1">
                    <div>
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e7668] mb-2.5">
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

                      {/* Title */}
                      <h2
                        onClick={() => setReadingBlogId(featuredBlog.blogId || featuredBlog.id || 1)}
                        className="text-lg sm:text-xl md:text-2xl font-black text-[#191f14] tracking-tight leading-snug hover:text-[#2e5d16] transition-colors cursor-pointer mb-2.5 line-clamp-2"
                      >
                        {featuredBlog.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-xs sm:text-sm text-[#555d4e] leading-relaxed line-clamp-3 mb-4">
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
                          <span>{featuredBlog.likeCount || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenComment(e, featuredBlog)}
                          className="flex items-center gap-1.5 hover:text-[#2e5d16] font-bold transition-all cursor-pointer"
                        >
                          <MessageCircle size={16} className="text-[#848c7e]" />
                          <span>{featuredBlog.commentCount || 0}</span>
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
                        <span>Đọc toàn bộ</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Original Stacked Layout when trendingBlogs exist alongside it
                <>
                  <div>
                    {/* Image Container with controlled height */}
                    <div
                      onClick={() => setReadingBlogId(featuredBlog.blogId || featuredBlog.id || 1)}
                      className="w-full aspect-[16/9] max-h-60 sm:max-h-72 rounded-2xl overflow-hidden relative shadow-xs group cursor-pointer mb-4"
                    >
                      <img
                        src={featuredBlog.pictureUrl || featuredBlog.imageUrl || freshFarmerBannerImg}
                        alt={featuredBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3 bg-[#c82626] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>Tiêu Điểm Mùa Vụ</span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-medium text-[11px] flex items-center gap-1">
                        <Eye size={12} />
                        <span>{featuredBlog.views || featuredBlog.viewCount || 0} lượt đọc</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e7668] mb-2.5">
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

                    {/* Title */}
                    <h2
                      onClick={() => setReadingBlogId(featuredBlog.blogId || featuredBlog.id || 1)}
                      className="text-lg sm:text-xl md:text-2xl font-black text-[#191f14] tracking-tight leading-snug hover:text-[#2e5d16] transition-colors cursor-pointer mb-2 line-clamp-2"
                    >
                      {featuredBlog.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-xs sm:text-sm text-[#555d4e] leading-relaxed line-clamp-2 sm:line-clamp-3">
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
                        <span>{featuredBlog.likeCount || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenComment(e, featuredBlog)}
                        className="flex items-center gap-1.5 hover:text-[#2e5d16] font-bold transition-all cursor-pointer"
                      >
                        <MessageCircle size={16} className="text-[#848c7e]" />
                        <span>{featuredBlog.commentCount || 0}</span>
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
                      <span>Đọc toàn bộ</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Cột Phải: Đang được quan tâm (Trending Stories) */}
            {trendingBlogs.length > 0 && (
              <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-[#e4ded2] p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between border-b border-[#f0ebd9] pb-3 mb-3">
                    <div className="flex items-center gap-2 font-black text-sm text-[#191f14] uppercase tracking-wider">
                      <Flame size={18} className="text-[#c82626]" />
                      <span>Đang được quan tâm</span>
                    </div>
                    <span className="text-[11px] text-[#717a6c] font-medium">Bản tin nóng</span>
                  </div>

                  <div className="flex flex-col divide-y divide-[#f0ebd9]">
                    {trendingBlogs.map((tb, idx) => {
                      const tbId = tb.blogId || tb.id || idx
                      const tbThumb = tb.pictureUrl || tb.imageUrl || heroFarmerImg
                      return (
                        <div
                          key={tbId}
                          onClick={() => setReadingBlogId(tbId)}
                          className="py-3 first:pt-0 last:pb-0 flex items-center gap-3.5 group cursor-pointer"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 relative bg-[#f5f1e8] border border-[#e6dfd2]">
                            <img
                              src={tbThumb}
                              alt={tb.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[10px] text-[#717a6c]">
                              <span className="font-bold text-[#2e5d16]">
                                {getCategoryBadge(tb.category)}
                              </span>
                              <span>•</span>
                              <span>{formatPublishDate(tb.createAt || tb.createdAt)}</span>
                            </div>
                            <h4 className="text-xs sm:text-[13px] font-bold text-[#191f14] leading-snug group-hover:text-[#2e5d16] transition-colors line-clamp-2">
                              {tb.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-[#848c7e] mt-0.5">
                              <span className="flex items-center gap-1">
                                <Eye size={11} />
                                <span>{tb.views || tb.viewCount || 0}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart size={11} />
                                <span>{tb.likeCount || 0}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Callout box at bottom of trending column */}
                <div className="p-3 rounded-2xl bg-[#f5f1e8] border border-[#e4ded2] flex items-center justify-between text-xs">
                  <span className="text-[#555d4e] font-medium text-[11px]">
                    Chia sẻ câu chuyện từ vườn nhà bạn?
                  </span>
                  {isShopOrAdmin ? (
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="text-[#2e5d16] font-black hover:underline cursor-pointer text-xs"
                    >
                      Đăng ngay
                    </button>
                  ) : (
                    <a
                      href="/dang-ky-ban-hang"
                      className="text-[#2e5d16] font-black hover:underline text-xs"
                    >
                      Mở shop
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. FEED GRID                                                              */}
        {/* ========================================================================= */}
        {(!featuredBlog || feedBlogs.length > 0) && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-[#191f14] flex items-center gap-2">
                <BookOpen size={20} className="text-[#2e5d16]" />
                <span>
                  {featuredBlog
                    ? 'Câu Chuyện Ruộng Vườn Khác'
                    : 'Bản Tin Mùa Vụ & Kinh Nghiệm'}{' '}
                  ({feedBlogs.length})
                </span>
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
        )}

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
                    className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm ${blogDetail.isLikedByCurrentUser
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

            <form onSubmit={(e) => handleCreateBlogSubmitWithStatus(e, newStatus)} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#2e5d16] text-xs font-bold uppercase tracking-wide">
                <Sparkles size={16} />
                <span>Kênh Nhà Vườn CapNong</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#191f14]">
                Chia Sẻ Câu Chuyện Mùa Vụ &amp; Kinh Nghiệm
              </h2>

              {/* 1. Tiêu đề */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#3a4234]">Tiêu đề bài viết *</label>
                  <span className="text-[11px] text-[#717a6c]">{newTitle.length}/255 ký tự</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Vụ cam sành Hàm Yên được mùa ngọt mọng nước..."
                  className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none"
                />
              </div>

              {/* 2. Danh mục & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative flex flex-col gap-1.5" ref={modalCategoryMenuRef}>
                  <label className="text-xs font-extrabold text-[#3a4234]">Danh mục bài viết</label>
                  <button
                    type="button"
                    onClick={() => setIsModalCategoryMenuOpen(!isModalCategoryMenuOpen)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-[#d8d3c5] hover:border-[#2e5d16] bg-white text-xs sm:text-sm font-semibold text-[#1c2216] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {(() => {
                        const cur =
                          CATEGORY_TABS.find((t) => t.id === newCategory) || CATEGORY_TABS[1]
                        const CurIcon = cur.icon
                        return (
                          <>
                            <CurIcon size={16} className="text-[#2e5d16] shrink-0" />
                            <span className="truncate">{cur.label}</span>
                          </>
                        )
                      })()}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-[#717a6c] transition-transform duration-200 shrink-0 ${isModalCategoryMenuOpen ? 'rotate-180 text-[#2e5d16]' : ''
                        }`}
                    />
                  </button>

                  {isModalCategoryMenuOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl border border-[#e5e9e0] shadow-2xl p-1.5 z-40 animate-fadeIn">
                      {CATEGORY_TABS.filter((t) => t.id !== 'all').map((tab) => {
                        const TabIcon = tab.icon
                        const isSelected = newCategory === tab.id
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setNewCategory(tab.id as BlogCategory)
                              setIsModalCategoryMenuOpen(false)
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${isSelected
                              ? 'bg-[#eaf3e5] text-[#2e5d16] font-bold'
                              : 'text-[#444d3d] hover:bg-[#f6f4ee] hover:text-[#1c2216]'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <TabIcon
                                size={15}
                                className={isSelected ? 'text-[#2e5d16]' : 'text-[#717a6c]'}
                              />
                              <span className="truncate">{tab.label}</span>
                            </div>
                            {isSelected && <Check size={16} className="text-[#2e5d16] shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-[#3a4234]">Trạng thái xuất bản</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4efe4] rounded-2xl border border-[#e2dcd0]">
                    <button
                      type="button"
                      onClick={() => setNewStatus('PUBLISHED')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${newStatus === 'PUBLISHED'
                        ? 'bg-white text-[#2e5d16] shadow-xs'
                        : 'text-[#646e5e] hover:text-[#1c2216]'
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">Công khai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStatus('DRAFT')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${newStatus === 'DRAFT'
                        ? 'bg-white text-amber-800 shadow-xs'
                        : 'text-[#646e5e] hover:text-[#1c2216]'
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="truncate">Bản nháp</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Ảnh bìa bài viết */}
              <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#faf7f0] border border-[#ebe4d6]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-[#2e5d16]" />
                    Ảnh bìa bài viết
                  </label>
                  <span className="text-[11px] text-[#717a6c]">Tỉ lệ khuyến nghị 16:9 (tối đa 5MB)</span>
                </div>

                {/* Upload Action Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={isUploadingModalImage}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#2e5d16] text-[#2e5d16] hover:bg-[#2e5d16] hover:text-white transition-all text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isUploadingModalImage ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-[#2e5d16]" />
                        <span>Đang tải ảnh lên...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Tải ảnh từ máy / điện thoại</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleModalImageFileChange}
                  />

                  <input
                    type="url"
                    value={newPictureUrl}
                    onChange={(e) => setNewPictureUrl(e.target.value)}
                    placeholder="Hoặc dán liên kết URL ảnh (https://...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d8d3c5] bg-white text-xs focus:border-[#2e5d16] outline-none"
                  />
                </div>

                {/* Preview Box */}
                {newPictureUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-[#dcd6c8] bg-stone-100 max-h-44 group">
                    <img
                      src={newPictureUrl}
                      alt="Ảnh bìa xem trước"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        ; (e.target as HTMLImageElement).src = SAMPLE_COVERS[0].url
                      }}
                    />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <UploadCloud size={14} /> Thay ảnh khác
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPictureUrl('')}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Trash2 size={14} /> Gỡ ảnh
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                      <Check size={12} className="text-emerald-400" /> Ảnh bìa đang chọn
                    </span>
                  </div>
                )}

                {/* Sample cover choices */}
                <div className="flex flex-col gap-1.5 mt-0.5">
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
                            ? 'border-[#2e5d16] scale-[1.02] shadow-md ring-2 ring-[#2e5d16]/25'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={sc.url} alt={sc.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                          {sc.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Nội dung chi tiết */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#3a4234]">
                    Nội dung chi tiết câu chuyện *
                  </label>
                  <span className="text-[11px] text-[#717a6c]">
                    {newContent.trim() ? `${newContent.trim().split(/\s+/).length} từ` : '0 từ'}
                  </span>
                </div>

                <BlogRichTextToolbar
                  textareaRef={modalTextareaRef}
                  content={newContent}
                  onChange={setNewContent}
                />

                <textarea
                  ref={modalTextareaRef}
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Chia sẻ về quá trình gieo trồng, chăm sóc, thu hoạch hoặc những trăn trở, niềm vui của nhà vườn..."
                  className="w-full p-4 rounded-b-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#2e5d16] outline-none leading-relaxed"
                />
                <p className="text-[11px] text-[#788272] italic">
                  💡 Gợi ý: Dùng các icon ở thanh công cụ trên để làm nổi bật câu chuyện, chèn biểu tượng nông sản 🌱 hoặc định dạng các bước canh tác rõ ràng.
                </p>
              </div>

              {/* 5. Nút bấm thao tác */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#ede7dc]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <X size={15} />
                  <span>Hủy bỏ</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={createBlogMutation.isPending || isUploadingModalImage}
                    className={`px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${newStatus === 'DRAFT'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#2e5d16] hover:bg-[#254d12]'
                      }`}
                  >
                    {createBlogMutation.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-white" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : newStatus === 'DRAFT' ? (
                      <>
                        <Save size={15} className="text-white" />
                        <span>Lưu vào bản nháp</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} className="text-white" />
                        <span>Đăng câu chuyện công khai</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
