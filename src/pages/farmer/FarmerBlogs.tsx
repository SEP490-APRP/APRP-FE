import React, { useState } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Heart,
  MessageCircle,
  Edit3,
  Trash2,
  ExternalLink,
  Sparkles,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react'
import {
  useMyBlogs,
  useCreateShopBlog,
  useUpdateShopBlog,
  useDeleteShopBlog,
} from '@/features/blog'
import { BlogCategory, BlogCategoryLabel } from '@/types'
import type { BlogResponse } from '@/services'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'

interface FarmerBlogsProps {
  onInfo?: (msg: string) => void
}

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

export const FarmerBlogs: React.FC<FarmerBlogsProps> = ({ onInfo }) => {
  const [page, setPage] = useState(0)
  const pageSize = 20
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const { data: pagedData, isLoading } = useMyBlogs({ page, size: pageSize })
  const createBlogMutation = useCreateShopBlog()
  const updateBlogMutation = useUpdateShopBlog()
  const deleteBlogMutation = useDeleteShopBlog()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogResponse | null>(null)
  const [title, setTitle] = useState('')
  const [category, setNewCategory] = useState<BlogCategory>(BlogCategory.STORY)
  const [pictureUrl, setPictureUrl] = useState(SAMPLE_COVERS[0].url)
  const [content, setContent] = useState('')

  const myBlogs = pagedData?.content || []

  // Filtered
  const filteredBlogs = myBlogs.filter((blog) => {
    const matchSearch =
      !searchQuery ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat =
      selectedCategory === 'all' ||
      String(blog.category).toUpperCase() === selectedCategory.toUpperCase()
    return matchSearch && matchCat
  })

  // Statistics
  const totalViews = myBlogs.reduce((acc, b) => acc + (b.views || b.viewCount || 0), 0)
  const totalLikes = myBlogs.reduce((acc, b) => acc + (b.likeCount || 0), 0)
  const totalComments = myBlogs.reduce((acc, b) => acc + (b.commentCount || 0), 0)

  const handleOpenCreate = () => {
    setEditingBlog(null)
    setTitle('')
    setNewCategory(BlogCategory.STORY)
    setPictureUrl(SAMPLE_COVERS[0].url)
    setContent('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (blog: BlogResponse) => {
    setEditingBlog(blog)
    setTitle(blog.title)
    setNewCategory(blog.category)
    setPictureUrl(blog.pictureUrl || blog.imageUrl || SAMPLE_COVERS[0].url)
    setContent(blog.content)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      globalShowAlert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.', 'Lỗi', 'error')
      return
    }

    if (editingBlog) {
      const blogId = editingBlog.blogId || editingBlog.id || 0
      updateBlogMutation.mutate(
        {
          blogId,
          data: {
            title: title.trim(),
            category,
            pictureUrl,
            content: content.trim(),
            status: 'PUBLISHED',
          },
        },
        {
          onSuccess: () => {
            setIsModalOpen(false)
            onInfo?.('Cập nhật bài viết thành công')
            globalShowAlert('Đã cập nhật bài viết thành công.', 'Thông báo', 'success')
          },
        },
      )
    } else {
      createBlogMutation.mutate(
        {
          title: title.trim(),
          category,
          pictureUrl,
          content: content.trim(),
          status: 'PUBLISHED',
        },
        {
          onSuccess: () => {
            setIsModalOpen(false)
            onInfo?.('Xuất bản bài viết thành công')
            globalShowAlert('Đã đăng bài viết mới thành công.', 'Thông báo', 'success')
          },
        },
      )
    }
  }

  const handleDelete = async (blog: BlogResponse) => {
    const blogId = blog.blogId || blog.id || 0
    const confirmed = await globalShowConfirm(
      'Xác nhận xóa bài viết',
      `Bạn có chắc chắn muốn xóa bài viết "${blog.title}" không? Thao tác này không thể hoàn tác.`,
    )
    if (confirmed) {
      deleteBlogMutation.mutate(blogId, {
        onSuccess: () => {
          onInfo?.('Đã xóa bài viết')
          globalShowAlert('Đã xóa bài viết thành công.', 'Thông báo', 'info')
        },
      })
    }
  }

  const formatPublishDate = (dateStr?: string) => {
    if (!dateStr) return 'Mới đây'
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

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8 max-w-7xl mx-auto w-full">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1c2216] flex items-center gap-2">
            <BookOpen className="text-[#326318]" size={26} />
            <span>Quản Lý Bài Viết &amp; Câu Chuyện Nhà Vườn</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#666f60] mt-1">
            Chia sẻ quá trình canh tác, nhật ký mùa vụ và kết nối tình cảm với hàng ngàn khách mua.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>Viết bài chia sẻ mới</span>
        </button>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#717a6c] uppercase">Tổng bài viết</span>
          <span className="text-2xl font-black text-[#1c2216]">{myBlogs.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#717a6c] uppercase">Lượt đọc tích lũy</span>
          <span className="text-2xl font-black text-[#2e5d16] flex items-center gap-1.5">
            <Eye size={20} />
            <span>{totalViews.toLocaleString('vi-VN')}</span>
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#717a6c] uppercase">Lượt cảm kích</span>
          <span className="text-2xl font-black text-[#c82626] flex items-center gap-1.5">
            <Heart size={20} className="fill-[#c82626]" />
            <span>{totalLikes.toLocaleString('vi-VN')}</span>
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#717a6c] uppercase">Bình luận từ khách</span>
          <span className="text-2xl font-black text-[#2e5d16] flex items-center gap-1.5">
            <MessageCircle size={20} />
            <span>{totalComments.toLocaleString('vi-VN')}</span>
          </span>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9485]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề bài viết, nội dung..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dfe4db] text-xs focus:border-[#326318] outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#dfe4db] text-xs font-bold text-[#353c2e] focus:border-[#326318] outline-none bg-white"
        >
          <option value="all">Tất cả danh mục</option>
          <option value={BlogCategory.STORY}>📖 Chuyện nhà nông</option>
          <option value={BlogCategory.NEW_PRODUCT}>🌱 Nông sản mới &amp; Mùa vụ</option>
          <option value={BlogCategory.GUIDE}>💡 Cẩm nang &amp; Mẹo vặt</option>
          <option value={BlogCategory.PROMOTION}>🎁 Khuyến mãi &amp; Ưu đãi</option>
          <option value={BlogCategory.SUC_KHOE}>🥗 Sức khỏe dinh dưỡng</option>
          <option value={BlogCategory.NONG_NGHIEP}>🚜 Nông nghiệp sạch</option>
        </select>
      </div>

      {/* 4. Table or Grid of Blogs */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#717a6c] flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-[#326318]/30 border-t-[#326318] rounded-full animate-spin" />
          <span>Đang tải danh sách bài viết...</span>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#e8ece3] p-12 text-center flex flex-col items-center gap-3">
          <BookOpen size={42} className="text-[#326318]/40" />
          <h3 className="text-base font-bold text-[#1c2216]">Chưa có bài viết nào</h3>
          <p className="text-xs text-[#6e7668] max-w-sm">
            Hãy bắt đầu chia sẻ câu chuyện đầu tiên về khu vườn và những nỗ lực làm nông của bạn!
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold shadow cursor-pointer"
          >
            + Viết bài ngay
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#e8ece3] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#333a2d]">
              <thead className="bg-[#f9faf7] border-b border-[#e8ece3] text-[#616a5b] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Bài viết</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4 text-center">Tương tác</th>
                  <th className="py-3.5 px-4">Ngày đăng</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3eb]">
                {filteredBlogs.map((b) => {
                  const bId = b.blogId || b.id || 0
                  const thumb = b.pictureUrl || b.imageUrl || SAMPLE_COVERS[0].url

                  return (
                    <tr key={bId} className="hover:bg-[#fafcf8] transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={b.title}
                            className="w-14 h-11 object-cover rounded-xl border border-[#e5eadd] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#1c2216] truncate text-xs hover:text-[#326318]">
                              {b.title}
                            </div>
                            <p className="text-[11px] text-[#717a6c] truncate max-w-xs mt-0.5">
                              {b.content.replace(/<[^>]*>?/gm, '')}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-[#f2eee3] text-[#555d4e] font-bold text-[10px]">
                          {BlogCategoryLabel[b.category] || b.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-3 text-[#626c5c] font-semibold text-[11px]">
                          <span className="flex items-center gap-1" title="Lượt đọc">
                            <Eye size={13} />
                            {b.views || b.viewCount || 0}
                          </span>
                          <span className="flex items-center gap-1 text-[#c82626]" title="Lượt thích">
                            <Heart size={13} className="fill-[#c82626]" />
                            {b.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Bình luận">
                            <MessageCircle size={13} />
                            {b.commentCount || 0}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#717a6c] font-medium text-[11px]">
                        {formatPublishDate(b.createAt || b.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`/cau-chuyen-nong-dan?blogId=${bId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-[#f0f4ed] text-[#326318] transition-colors"
                            title="Xem trên sàn"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg hover:bg-[#f0f4ed] text-[#326318] transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            title="Xóa bài viết"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ede8df] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#326318] text-xs font-bold uppercase tracking-wide">
                <Sparkles size={16} />
                <span>{editingBlog ? 'Cập Nhật Câu Chuyện' : 'Đăng Câu Chuyện Mới'}</span>
              </div>

              <h2 className="text-xl font-black text-[#1c2216]">
                {editingBlog ? 'Chỉnh Sửa Bài Viết' : 'Chia Sẻ Câu Chuyện Mùa Vụ'}
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-[#3a4234]">Tiêu đề bài viết *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề hấp dẫn về vườn nông sản của bạn..."
                  className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#326318] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-[#3a4234]">Danh mục</label>
                  <select
                    value={category}
                    onChange={(e) => setNewCategory(e.target.value as BlogCategory)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#326318] outline-none bg-white font-medium"
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
                  <label className="text-xs font-extrabold text-[#3a4234]">Link ảnh bìa</label>
                  <input
                    type="url"
                    value={pictureUrl}
                    onChange={(e) => setPictureUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#326318] outline-none"
                  />
                </div>
              </div>

              {/* Sample cover choices */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#6a7364]">Hoặc chọn ảnh bìa mẫu:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_COVERS.map((sc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPictureUrl(sc.url)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        pictureUrl === sc.url
                          ? 'border-[#326318] scale-105 shadow-md'
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
                <label className="text-xs font-extrabold text-[#3a4234]">Nội dung chi tiết *</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Kể về vụ mùa, sự tận tâm của người làm vườn, hay hướng dẫn bảo quản..."
                  className="w-full p-4 rounded-2xl border border-[#d8d3c5] text-xs sm:text-sm focus:border-[#326318] outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#ede7dc]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createBlogMutation.isPending || updateBlogMutation.isPending}
                  className="px-6 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white text-xs font-black uppercase tracking-wide shadow-md cursor-pointer disabled:opacity-50"
                >
                  {createBlogMutation.isPending || updateBlogMutation.isPending
                    ? 'Đang xử lý...'
                    : editingBlog
                      ? 'Lưu thay đổi'
                      : 'Đăng bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default FarmerBlogs
