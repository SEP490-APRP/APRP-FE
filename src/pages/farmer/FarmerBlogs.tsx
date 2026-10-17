import React, { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import {
  useMyBlogs,
  useDeleteShopBlog,
  BlogStatsCards,
  BlogFilterBar,
  BlogTable,
  BlogEditorModal,
} from '@/features/blog'
import { type BlogResponse } from '@/services'
import { globalShowConfirm, globalShowAlert } from '@/components/common/Popup'

interface FarmerBlogsProps {
  onInfo?: (msg: string) => void
}

export const FarmerBlogs: React.FC<FarmerBlogsProps> = ({ onInfo }) => {
  const [page] = useState(0)
  const pageSize = 20
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const { data: pagedData, isLoading } = useMyBlogs({ page, size: pageSize })
  const deleteBlogMutation = useDeleteShopBlog()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogResponse | null>(null)

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
    setIsModalOpen(true)
  }

  const handleOpenEdit = (blog: BlogResponse) => {
    setEditingBlog(blog)
    setIsModalOpen(true)
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

      {/* 2. Thống kê */}
      <BlogStatsCards
        totalBlogs={myBlogs.length}
        totalViews={totalViews}
        totalLikes={totalLikes}
        totalComments={totalComments}
      />

      {/* 3. Thanh tìm kiếm & lọc danh mục */}
      <BlogFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* 4. Bảng danh sách bài viết */}
      <BlogTable
        blogs={filteredBlogs}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onOpenCreate={handleOpenCreate}
      />

      {/* 5. Modal Soạn thảo / Chỉnh sửa bài viết */}
      <BlogEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingBlog={editingBlog}
        onSuccess={(msg) => onInfo?.(msg)}
      />
    </div>
  )
}

export default FarmerBlogs
