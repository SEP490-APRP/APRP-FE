import React, { useState, useMemo } from 'react'
import {
  Newspaper,
  Plus,
  Loader2,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  ChevronLeft,
  RefreshCcw,
  AlertCircle,
  Pin,
  FileText,
  Clock,
  RotateCcw,
  BookOpen,
  TrendingUp,
  X,
  Upload,
} from 'lucide-react'
import type { BlogCreationRequest, BlogResponse } from '@/services'
import { uploadService } from '@/services'
import {
  useAdminBlogs,
  useDeleteBlog,
  useSaveBlog,
  useSetBlogStatus,
} from '@/features/blog'
import { BlogCategory, BlogCategoryLabel } from '@/types'
import MyCKEditor from '@/components/common/MyCKEditor'
import { RichTextContent } from '@/components/common/RichTextEditor/RichTextContent'
import Pagination, { PageInfo } from '@/components/ui/Pagination'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300'
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'

const NewsManagement: React.FC = () => {
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Pagination state
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('Tất cả danh mục')
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái')
  const [pinnedBlogIds, setPinnedBlogIds] = useState<number[]>([])
  const [showGuideModal, setShowGuideModal] = useState(false)

  const blogsQuery = useAdminBlogs({
    page,
    size: pageSize,
    search: searchQuery.trim() || undefined,
    category:
      selectedFilterCategory !== 'Tất cả danh mục' ? selectedFilterCategory : undefined,
  })
  const saveBlog = useSaveBlog()
  const deleteBlog = useDeleteBlog()
  const setBlogStatus = useSetBlogStatus()

  const blogs = blogsQuery.data?.content ?? []
  const pageInfo: PageInfo | null = blogsQuery.data ?? null
  const loading = blogsQuery.isPending || blogsQuery.isPlaceholderData
  const error = blogsQuery.isError ? 'Không thể tải danh sách bài viết.' : null

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('PUBLISHED')
  const [category, setCategory] = useState(BlogCategory.NHA_NONG)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const submitting = saveBlog.isPending

  // View/Edit state
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<BlogResponse | null>(null)

  const clearForm = () => {
    setTitle('')
    setContent('')
    setCategory(BlogCategory.NHA_NONG)
    setStatus('PUBLISHED')
    setSelectedImage(null)
    setImagePreview(null)
    setIsEditing(false)
    setIsAddingNew(false)
    setSelectedBlog(null)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedFilterCategory('Tất cả danh mục')
    setSelectedStatus('Tất cả trạng thái')
  }

  // Filter blogs based on search, category and status
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const term = searchQuery.toLowerCase().trim()
      const matchesSearch =
        term === '' ||
        blog.title.toLowerCase().includes(term) ||
        (blog.adminName || blog.shopName || blog.authorName || '').toLowerCase().includes(term) ||
        String(blog.blogId || blog.id).includes(term)

      const matchesCategory =
        selectedFilterCategory === 'Tất cả danh mục' ||
        blog.category === selectedFilterCategory ||
        BlogCategoryLabel[blog.category as BlogCategory] === selectedFilterCategory

      let matchesStatus = true
      if (selectedStatus === 'PUBLISHED') matchesStatus = blog.status === 'PUBLISHED'
      else if (selectedStatus === 'DRAFT') matchesStatus = blog.status === 'DRAFT'
      else if (selectedStatus === 'HIDDEN') matchesStatus = blog.status === 'HIDDEN'

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [blogs, searchQuery, selectedFilterCategory, selectedStatus])

  // Statistics calculation
  const { totalBlogs, publishedCount, draftCount, totalViews, bestBlog, newBlogsThisMonth } = useMemo(() => {
    let pub = 0
    let draft = 0
    let views = 0
    let maxViews = -1
    let best: BlogResponse | null = null
    let thisMonth = 0

    const now = new Date()

    blogs.forEach((b) => {
      const isPub = b.status === 'PUBLISHED'
      if (isPub) pub++
      else draft++

      const v = b.views || b.viewCount || 0
      views += v

      if (v > maxViews) {
        maxViews = v
        best = b
      }

      const date = new Date(b.createAt || b.createdAt || Date.now())
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        thisMonth++
      }
    })

    return {
      totalBlogs: blogs.length,
      publishedCount: pub,
      draftCount: draft,
      totalViews: views,
      bestBlog: best as BlogResponse | null,
      newBlogsThisMonth: thisMonth,
    }
  }, [blogs])

  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K'
    }
    return count.toString()
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '16/10/2026 - 14:30'
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} - ${hours}:${minutes}`
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSaveBlog = async () => {
    if (!title.trim() || !content.trim()) {
      globalShowAlert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.', 'Lỗi', 'error')
      return
    }

    try {
      let pictureUrl = imagePreview || undefined
      if (selectedImage) {
        try {
          const uploadRes = await uploadService.uploadImage(selectedImage, 'blogs')
          if (uploadRes.result?.url) {
            pictureUrl = uploadRes.result.url
          }
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr)
          globalShowAlert('Tải ảnh bài viết thất bại, vui lòng thử lại.', 'Lỗi', 'error')
          return
        }
      }

      const request: BlogCreationRequest = {
        title,
        content,
        status,
        category,
        pictureUrl,
      }

      const editing = isEditing && selectedBlog
      const targetId = editing ? (selectedBlog.blogId || selectedBlog.id) : undefined
      const response = await saveBlog.mutateAsync({
        id: targetId,
        request,
      })
      if (response.result) {
        globalShowAlert(
          editing ? 'Cập nhật bài viết thành công!' : 'Đăng bài viết mới thành công!',
          'Thành công',
          'success',
        )
        clearForm()
        void blogsQuery.refetch()
      }
    } catch (err) {
      console.error('Failed to save blog', err)
      globalShowAlert('Lưu bài viết thất bại. Vui lòng thử lại.', 'Lỗi', 'error')
    }
  }

  const handleDeleteBlog = async (id: number) => {
    if (!(await globalShowConfirm('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bài viết này không?'))) {
      return
    }

    try {
      await deleteBlog.mutateAsync(id)
      globalShowAlert('Đã xóa bài viết thành công.', 'Thành công', 'success')
      void blogsQuery.refetch()
    } catch (err) {
      console.error('Failed to delete blog', err)
      globalShowAlert('Xóa bài viết thất bại.', 'Lỗi', 'error')
    }
  }

  const handleTogglePin = (id: number) => {
    setPinnedBlogIds((prev) => {
      const isPinned = prev.includes(id)
      if (isPinned) {
        globalShowAlert('Đã bỏ ghim bài viết.', 'Thông báo', 'info')
        return prev.filter((p) => p !== id)
      } else {
        globalShowAlert('Đã ghim bài viết lên đầu trang.', 'Thành công', 'success')
        return [...prev, id]
      }
    })
  }

  const handleEditBlog = (blog: BlogResponse) => {
    setSelectedBlog(blog)
    setTitle(blog.title)
    setContent(blog.content)
    setCategory(blog.category as unknown as BlogCategory)
    setStatus(blog.status)
    setImagePreview(blog.pictureUrl || blog.imageUrl || null)
    setIsEditing(true)
    setIsAddingNew(false)
    setIsViewing(false)
  }

  const handleViewBlog = (blog: BlogResponse) => {
    setSelectedBlog(blog)
    setIsViewing(true)
    setIsAddingNew(false)
    setIsEditing(false)
  }

  // View Form: Thêm mới hoặc Chỉnh sửa
  if (isAddingNew || isEditing) {
    return (
      <div className="flex flex-col gap-8 p-6 sm:p-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={clearForm}
              className="size-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                {isEditing ? 'Cập nhật bài viết' : 'Viết bài tin tức mới'}
              </h2>
              <p className="text-gray-500 font-medium text-xs mt-0.5">
                {isEditing ? 'Chỉnh sửa nội dung và danh mục bài viết.' : 'Sáng tạo nội dung nông sản hữu ích cho người dùng sàn CapNong.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearForm}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSaveBlog}
              disabled={submitting}
              className="px-6 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : isEditing ? 'Cập nhật ngay' : 'Đăng bài ngay'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                  Tiêu đề bài viết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Cách bảo quản trái cây tươi lâu sau thu hoạch..."
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#15803d]/20 focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <MyCKEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Viết nội dung bài viết chi tiết tại đây..."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 space-y-6">
              <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm">
                Thiết lập xuất bản
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Danh mục bài viết
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BlogCategory)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-[#15803d]/20 transition-all"
                >
                  <option value={BlogCategory.NHA_NONG}>Chuyện nhà nông</option>
                  <option value={BlogCategory.SUC_KHOE}>Sức khỏe dinh dưỡng</option>
                  <option value={BlogCategory.CAM_NANG}>Cẩm nang bảo quản</option>
                  <option value={BlogCategory.XU_HUONG}>Xu hướng nông sản</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Trạng thái đăng
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-[#15803d]/20 transition-all"
                >
                  <option value="PUBLISHED">Xuất bản ngay (ĐÃ ĐĂNG)</option>
                  <option value="DRAFT">Lưu nháp (BẢN NHÁP)</option>
                  <option value="HIDDEN">Tạm ẩn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Ảnh bìa đại diện
                </label>
                <div
                  className="aspect-video w-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-[#15803d]/50 hover:bg-emerald-50/20 cursor-pointer transition-all relative overflow-hidden group bg-gray-50"
                  onClick={() => document.getElementById('blog-image-upload')?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="preview"
                    />
                  ) : (
                    <>
                      <Upload className="size-6 text-gray-400 group-hover:text-[#15803d] transition-colors" />
                      <p className="text-xs font-bold text-gray-500 group-hover:text-[#15803d]">Bấm để tải ảnh lên</p>
                      <p className="text-[10px] text-gray-400">Định dạng JPG, PNG, WEBP</p>
                    </>
                  )}
                </div>
                <input
                  id="blog-image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // View Form: Xem chi tiết bài viết
  if (isViewing && selectedBlog) {
    return (
      <div className="flex flex-col gap-6 p-6 sm:p-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsViewing(false)}
              className="size-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Chi tiết bài viết</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Mã ID: #{selectedBlog.blogId || selectedBlog.id}</p>
            </div>
          </div>
          <button
            onClick={() => handleEditBlog(selectedBlog)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Edit3 className="size-4" /> Chỉnh sửa
          </button>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="aspect-[21/9] w-full relative">
            <img
              src={selectedBlog.pictureUrl || selectedBlog.imageUrl || DEFAULT_THUMBNAIL}
              className="w-full h-full object-cover"
              alt="cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = DEFAULT_THUMBNAIL
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-8 sm:p-12">
              <div className="max-w-3xl space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold text-white/90">
                  <span className="px-3 py-1 bg-[#15803d] rounded-lg">
                    {BlogCategoryLabel[selectedBlog.category as BlogCategory] ?? selectedBlog.category}
                  </span>
                  <span>{formatDateTime(selectedBlog.createAt || selectedBlog.createdAt)}</span>
                  <span>• Người viết: {selectedBlog.adminName || selectedBlog.shopName || selectedBlog.authorName || 'Admin'}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  {selectedBlog.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-14">
            <RichTextContent
              html={selectedBlog.content}
              className="text-base sm:text-lg text-gray-700 font-normal leading-relaxed"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* 1. Header chính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            QUẢN LÝ TIN TỨC
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Quản lý nội dung bài viết, cẩm nang và tin tức nông sản trên hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* 2 thẻ mini góc phải trên header */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2">
              <FileText className="size-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900">Tổng bài viết: <strong>{totalBlogs}</strong></span>
            </div>
            <div className="px-3.5 py-1.5 bg-amber-50/70 border border-amber-100 rounded-xl flex items-center gap-2">
              <Eye className="size-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900">Tổng lượt xem: <strong>{formatViewCount(totalViews)} lượt</strong></span>
            </div>
          </div>

          <button
            onClick={() => {
              clearForm()
              setIsAddingNew(true)
            }}
            className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="size-4" /> Viết bài mới
          </button>
        </div>
      </div>

      {/* 2. Bốn thẻ KPI thống kê nằm ngang chuẩn theo ảnh mẫu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
        {/* Tổng bài viết */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500">Tổng bài viết:</p>
            <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">{totalBlogs}</h4>
          </div>
        </div>

        {/* Đã xuất bản */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500">Đã xuất bản:</p>
            <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">{publishedCount}</h4>
          </div>
        </div>

        {/* Bản nháp */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            <Edit3 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-500">Bản nháp:</p>
            <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">{draftCount}</h4>
          </div>
        </div>

        {/* Tổng lượt xem kèm nút Tải lại */}
        <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Eye className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-500">Tổng lượt xem:</p>
              <h4 className="text-2xl font-black text-gray-900 font-display mt-0.5">
                {formatViewCount(totalViews)} <span className="text-xs font-semibold text-gray-400">lượt</span>
              </h4>
            </div>
          </div>
          <button
            onClick={() => void blogsQuery.refetch()}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors cursor-pointer shrink-0"
            title="Tải lại dữ liệu"
          >
            <RefreshCcw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 text-sm">
          <AlertCircle className="size-5" />
          {error}
        </div>
      )}

      {/* 3. Bảng Danh sách bài viết */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar: Tìm kiếm, Bộ lọc danh mục, Trạng thái, Nút làm mới */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            {/* Input tìm kiếm */}
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Danh mục */}
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option>Tất cả danh mục</option>
              <option value={BlogCategory.NHA_NONG}>Chuyện nhà nông</option>
              <option value={BlogCategory.SUC_KHOE}>Sức khỏe dinh dưỡng</option>
              <option value={BlogCategory.CAM_NANG}>Cẩm nang bảo quản</option>
              <option value={BlogCategory.XU_HUONG}>Xu hướng nông sản</option>
            </select>

            {/* Dropdown Trạng thái */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã đăng</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="HIDDEN">Đã ẩn</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={clearFilters}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Làm mới bộ lọc"
            >
              <RotateCcw className="size-3.5" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  BÀI VIẾT
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  DANH MỤC
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  NGƯỜI VIẾT
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">
                  LƯỢT XEM
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">
                  TRẠNG THÁI
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Loader2 className="size-8 animate-spin text-[#15803d] mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đang tải bài viết...</p>
                  </td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-bold text-sm">
                    {blogs.length === 0 ? 'Chưa có bài viết nào trong hệ thống.' : 'Không tìm thấy bài viết phù hợp.'}
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((art) => {
                  const blogId = art.blogId || art.id || 0
                  const isPinned = pinnedBlogIds.includes(blogId)

                  return (
                    <tr
                      key={blogId}
                      className={`hover:bg-gray-50/50 transition-colors group ${isPinned ? 'bg-amber-50/20' : ''}`}
                    >
                      {/* Mã ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-xs text-gray-500">
                          #{blogId}
                        </span>
                      </td>

                      {/* Bài viết: Thumbnail + Tiêu đề + Ngày đăng đầy đủ */}
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-center gap-3.5">
                          <div className="size-12 bg-gray-100 rounded-xl overflow-hidden shadow-2xs shrink-0 border border-gray-100">
                            <img
                              src={art.pictureUrl || art.imageUrl || DEFAULT_THUMBNAIL}
                              className="w-full h-full object-cover"
                              alt="thumb"
                              onError={(e) => {
                                ;(e.currentTarget as HTMLImageElement).src = DEFAULT_THUMBNAIL
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-xs font-bold text-gray-900 line-clamp-1 hover:text-[#15803d] transition-colors cursor-pointer"
                              title={art.title}
                              onClick={() => handleViewBlog(art)}
                            >
                              {art.title}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                              NGÀY ĐĂNG: {formatDateTime(art.createAt || art.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Danh mục */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-[#15803d] border border-emerald-100 text-[11px] font-black rounded-lg">
                          {BlogCategoryLabel[art.category as BlogCategory] ?? art.category}
                        </span>
                      </td>

                      {/* Người viết: Avatar + Tên */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={art.shopAvatar || DEFAULT_AVATAR}
                            className="size-7 rounded-full object-cover border border-gray-200"
                            alt="author"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR
                            }}
                          />
                          <span className="text-xs font-bold text-gray-700">
                            {art.adminName || art.shopName || art.authorName || 'Nguyễn Văn A'}
                          </span>
                        </div>
                      </td>

                      {/* Lượt xem */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-gray-600 font-bold text-xs">
                          <Eye className="size-3.5 text-gray-400" />
                          <span>{formatViewCount(art.views || art.viewCount || 0)} lượt</span>
                        </div>
                      </td>

                      {/* Trạng thái: ĐÃ ĐĂNG | BẢN NHÁP | ĐÃ ẨN */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            art.status === 'PUBLISHED'
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : art.status === 'HIDDEN'
                              ? 'text-amber-700 bg-amber-50 border border-amber-200'
                              : 'text-gray-600 bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {art.status === 'PUBLISHED'
                            ? 'ĐÃ ĐĂNG'
                            : art.status === 'HIDDEN'
                            ? 'ĐÃ ẨN'
                            : 'BẢN NHÁP'}
                        </span>
                      </td>

                      {/* Thao tác: Sửa, Xem, Ghim, Xóa */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Sửa */}
                          <button
                            title="Chỉnh sửa bài viết"
                            onClick={() => handleEditBlog(art)}
                            className="size-8 rounded-lg bg-blue-50/60 hover:bg-blue-100 text-blue-600 border border-blue-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="size-3.5" />
                          </button>

                          {/* Xem */}
                          <button
                            title="Xem chi tiết bài viết"
                            onClick={() => handleViewBlog(art)}
                            className="size-8 rounded-lg bg-emerald-50/60 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {/* Ghim */}
                          <button
                            title={isPinned ? 'Bỏ ghim' : 'Ghim bài viết'}
                            onClick={() => handleTogglePin(blogId)}
                            className={`size-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                              isPinned
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : 'bg-amber-50/60 hover:bg-amber-100 text-amber-600 border-amber-200/80'
                            }`}
                          >
                            <Pin className="size-3.5" />
                          </button>

                          {/* Xóa */}
                          <button
                            title="Xóa bài viết"
                            onClick={() => handleDeleteBlog(blogId)}
                            className="size-8 rounded-lg bg-rose-50/60 hover:bg-rose-100 text-rose-600 border border-rose-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pageInfo && (
          <div className="p-6 bg-white border-t border-gray-50 flex items-center justify-between">
            <Pagination pageInfo={pageInfo} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* 4. Ba khối chân trang (Cẩm nang, Bài viết nổi bật nhất, Thống kê tháng) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Khối Mẹo viết tiêu đề */}
        <div className="bg-[#1e3a1e] rounded-[28px] p-8 text-white flex flex-col justify-between shadow-sm min-h-[200px]">
          <div>
            <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="size-5 text-emerald-300" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight leading-snug">
              MẸO VIẾT TIÊU ĐỀ <br /> THU HÚT NGƯỜI ĐỌC
            </h4>
          </div>
          <button
            onClick={() => setShowGuideModal(true)}
            className="w-fit mt-4 px-4 py-2 bg-white text-[#1e3a1e] font-black text-xs rounded-xl hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
          >
            Xem cẩm nang
          </button>
        </div>

        {/* Khối Bài viết nổi bật nhất */}
        <div className="bg-white rounded-[28px] border border-gray-100 p-8 flex flex-col justify-between shadow-2xs min-h-[200px]">
          <div>
            <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">
              Bài viết nổi bật nhất
            </h4>
            {bestBlog ? (
              <div className="flex items-center gap-4 mt-4">
                <div className="size-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                  <img
                    src={bestBlog.pictureUrl || bestBlog.imageUrl || DEFAULT_THUMBNAIL}
                    className="w-full h-full object-cover"
                    alt="best"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = DEFAULT_THUMBNAIL
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-black text-gray-900 line-clamp-2 hover:text-[#15803d] cursor-pointer"
                    onClick={() => handleViewBlog(bestBlog)}
                  >
                    {bestBlog.title}
                  </p>
                  <p className="text-xs font-semibold text-[#15803d] mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3.5" />
                    Lượt xem cao nhất ({formatViewCount(bestBlog.views || bestBlog.viewCount || 0)} lượt)
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-4 font-medium">Chưa có bài viết nào nổi bật.</p>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Thống kê theo tổng tương tác bài viết</p>
        </div>

        {/* Khối Thống kê tháng */}
        <div className="bg-white rounded-[28px] border border-gray-100 p-8 flex flex-col justify-between shadow-2xs min-h-[200px]">
          <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">
            Thống kê tháng
          </h4>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-600">Bài mới trong tháng:</span>
              <span className="font-black text-base text-[#15803d]">{newBlogsThisMonth}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#15803d] rounded-full transition-all"
                style={{ width: `${Math.min((newBlogsThisMonth / 20) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-50">
              <span className="font-bold text-gray-600">Lượt xem tháng này:</span>
              <span className="font-black text-base text-gray-900">
                {formatViewCount(totalViews)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cẩm nang viết bài */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowGuideModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-emerald-50 text-[#15803d] rounded-xl flex items-center justify-center">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Cẩm nang viết tiêu đề thu hút</h3>
                  <p className="text-xs text-gray-500 font-medium">Bí quyết tăng lượt tương tác bài viết nông sản</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block mb-1">1. Đưa con số cụ thể vào tiêu đề</strong>
                <p className="text-gray-600">Ví dụ: "5 cách bảo quản bơ sáp không bị thâm đen", "Top 3 loại rau giải độc gan tốt nhất".</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block mb-1">2. Giải quyết nỗi đau của người nội trợ</strong>
                <p className="text-gray-600">Ví dụ: "Cách nhận biết sầu riêng chín cây không ngâm hóa chất", "Bí quyết chọn cam sành mọng nước".</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block mb-1">3. Khơi gợi sự tò mò và cảm xúc</strong>
                <p className="text-gray-600">Ví dụ: "Hành trình giải cứu 10 tấn thanh long của nông dân Bình Thuận".</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <strong className="text-gray-900 block mb-1">4. Giữ độ dài lý tưởng dưới 65 ký tự</strong>
                <p className="text-gray-600">Giúp tiêu đề hiển thị trọn vẹn trên thiết bị di động và công cụ tìm kiếm.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-[#15803d] text-white text-xs font-bold rounded-xl hover:bg-[#166534] transition-all"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsManagement
