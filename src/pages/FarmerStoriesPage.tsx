import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  usePublicBlogs,
  useToggleBlogLike,
  useDeleteBlog,
  useUpdateBlogStatus,
  useBlogFeedRealtime,
  BlogEditorModal,
  BlogArticleReaderModal,
  BlogCreateModal,
  FarmerStoriesHero,
  FarmerStoriesOmniSearch,
  FarmerStoriesFeaturedMagazine,
  FarmerStoriesFeedGrid,
  CommunityTestimonialsMarquee,
} from '@/features/blog'
import type { BlogResponse } from '@/services'
import { useAuth } from '@/stores'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'

interface FarmerStoriesPageProps {
  onAdd?: (id: string) => void
  onInfo?: (msg: string) => void
}

export default function FarmerStoriesPage({ onInfo }: FarmerStoriesPageProps) {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  // Lắng nghe cập nhật realtime lượt Like & Bình luận toàn sàn
  useBlogFeedRealtime()

  const isShopOrAdmin = useMemo(() => {
    const role = (user?.role || '').toUpperCase()
    return role === 'SHOP' || role === 'FARMER' || role === 'ADMIN'
  }, [user])

  // Filter & Pagination state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 9

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Public blogs query
  const { data: pagedData, isLoading } = usePublicBlogs({
    page,
    size: pageSize,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: debouncedSearch || undefined,
  })

  // Mutations
  const toggleLikeMutation = useToggleBlogLike()
  const deleteBlogMutation = useDeleteBlog()
  const updateBlogStatusMutation = useUpdateBlogStatus()

  // Modal states
  const [readingBlogId, setReadingBlogId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false)
  const [editingBlogData, setEditingBlogData] = useState<BlogResponse | null>(null)

  // Auto-open blog reader modal if blogId is in URL query params
  useEffect(() => {
    const paramId = searchParams.get('blogId')
    if (paramId && !isNaN(Number(paramId))) {
      setReadingBlogId(Number(paramId))
    }
  }, [searchParams])

  // Blog categorization for editorial magazine
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

  // Interaction handlers
  const handleLike = (e: React.MouseEvent, blogId: number) => {
    e.stopPropagation()
    if (toggleLikeMutation.isPending) return
    if (!user) {
      globalShowAlert(
        'Vui lòng đăng nhập để thả tim và lưu bài viết yêu thích.',
        'Thông báo',
        'info',
      )
      return
    }
    toggleLikeMutation.mutate(blogId)
  }

  const handleOpenComment = (e: React.MouseEvent, blog: BlogResponse) => {
    e.stopPropagation()
    setReadingBlogId(blog.blogId || blog.id || 0)
  }

  const handleCopyShareLink = (blog: BlogResponse) => {
    const url = `${window.location.origin}/cau-chuyen-nong-dan?blogId=${blog.blogId || blog.id}`
    navigator.clipboard?.writeText(url)
    if (onInfo) {
      onInfo('Đã sao chép liên kết bài viết!')
    } else {
      globalShowAlert('Đã sao chép liên kết bài viết vào clipboard.', 'Thành công', 'success')
    }
  }

  const handleEditBlog = (blog: BlogResponse) => {
    setEditingBlogData(blog)
    setIsEditorModalOpen(true)
  }

  const handleDeleteBlog = async (blog: BlogResponse) => {
    const blogId = blog.blogId || blog.id || 0
    const confirmed = await globalShowConfirm(
      'Xác nhận xóa bài viết',
      `Bạn có chắc chắn muốn xóa bài viết "${blog.title}" không? Thao tác này không thể hoàn tác.`,
    )
    if (confirmed) {
      deleteBlogMutation.mutate(blogId, {
        onSuccess: () => {
          if (readingBlogId === blogId) setReadingBlogId(null)
          globalShowAlert('Đã xóa bài viết thành công.', 'Thành công', 'success')
        },
        onError: () => {
          globalShowAlert('Không thể xóa bài viết. Vui lòng thử lại.', 'Lỗi', 'error')
        },
      })
    }
  }

  const handleToggleBlogStatus = async (blog: BlogResponse) => {
    const blogId = blog.blogId || blog.id || 0
    const newStatus = blog.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED'
    const statusLabel = newStatus === 'PUBLISHED' ? 'Công khai' : 'Tạm ẩn'
    const confirmed = await globalShowConfirm(
      'Xác nhận đổi trạng thái',
      `Bạn có muốn chuyển bài viết sang trạng thái "${statusLabel}" không?`,
    )
    if (confirmed) {
      updateBlogStatusMutation.mutate(
        { blogId, status: newStatus },
        {
          onSuccess: () => {
            globalShowAlert(
              `Đã chuyển bài viết sang trạng thái ${statusLabel}.`,
              'Thành công',
              'success',
            )
          },
          onError: () => {
            globalShowAlert('Không thể đổi trạng thái bài viết.', 'Lỗi', 'error')
          },
        },
      )
    }
  }

  const handleReport = (_type: 'blog' | 'comment', _id: number) => {
    globalShowAlert(
      'Cảm ơn bạn đã gửi phản hồi. Ban quản trị CapNong sẽ kiểm duyệt nội dung này trong thời gian sớm nhất.',
      'Đã ghi nhận báo cáo',
      'success',
    )
  }

  return (
    <div className="w-full bg-[#fbf9f3] text-[#1e2518] min-h-screen">
      {/* 1. Hero Banner */}
      <FarmerStoriesHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* 2. Full-Width Omni Search & Category Filter */}
        <FarmerStoriesOmniSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => {
            setSelectedCategory(cat)
            setPage(0)
          }}
          isShopOrAdmin={isShopOrAdmin}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* 3. Featured & Trending Editorial Magazine */}
        {featuredBlog && (
          <FarmerStoriesFeaturedMagazine
            featuredBlog={featuredBlog}
            trendingBlogs={trendingBlogs}
            currentUser={user}
            onSelectBlog={(id) => setReadingBlogId(id)}
            onLike={handleLike}
            onOpenComment={handleOpenComment}
            onShare={handleCopyShareLink}
            onEdit={handleEditBlog}
            onDelete={handleDeleteBlog}
            onToggleStatus={handleToggleBlogStatus}
            onReport={handleReport}
            isShopOrAdmin={isShopOrAdmin}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {/* 4. Stories Feed Grid with Pagination & Empty State */}
        {(!featuredBlog || feedBlogs.length > 0) && (
          <FarmerStoriesFeedGrid
            feedBlogs={feedBlogs}
            isLoading={isLoading}
            hasFeatured={Boolean(featuredBlog)}
            pagedData={pagedData}
            onPageChange={setPage}
            currentUser={user}
            onSelectBlog={(id) => setReadingBlogId(id)}
            onLike={handleLike}
            onOpenComment={handleOpenComment}
            onShare={handleCopyShareLink}
            onEdit={handleEditBlog}
            onDelete={handleDeleteBlog}
            onToggleStatus={handleToggleBlogStatus}
            onReport={handleReport}
            onResetFilters={() => {
              setSelectedCategory('all')
              setSearchQuery('')
            }}
          />
        )}

        {/* 5. Community Testimonials Marquee */}
        <CommunityTestimonialsMarquee currentUser={user} />
      </div>

      {/* Modal: Full Article Reader */}
      <BlogArticleReaderModal
        blogId={readingBlogId}
        onClose={() => setReadingBlogId(null)}
        currentUser={user}
        onEdit={(b) => {
          setReadingBlogId(null)
          handleEditBlog(b)
        }}
        onDelete={handleDeleteBlog}
        onToggleStatus={handleToggleBlogStatus}
        onShare={handleCopyShareLink}
        onReport={handleReport}
      />

      {/* Modal: Create Shop Blog */}
      <BlogCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(msg) => {
          if (onInfo) onInfo(msg)
          else globalShowAlert(msg, 'Thành công', 'success')
        }}
      />

      {/* Modal: Edit Blog from 3-dots */}
      <BlogEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => {
          setIsEditorModalOpen(false)
          setEditingBlogData(null)
        }}
        editingBlog={editingBlogData}
        onSuccess={(msg) => {
          if (onInfo) onInfo(msg)
          else globalShowAlert(msg, 'Thành công', 'success')
        }}
      />
    </div>
  )
}
