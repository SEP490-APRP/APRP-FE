import React from 'react'
import {
  BookOpen,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ArrowRight,
  Sprout,
} from 'lucide-react'
import { BlogOptionsMenu } from '@/features/blog'
import { formatPublishDate, getCategoryBadge } from '@/features/blog/constants'
import type { BlogResponse } from '@/services'
import Pagination from '@/components/ui/Pagination'
import heroFarmerImg from '@/assets/hero-farmer.jpg'

interface FarmerStoriesFeedGridProps {
  feedBlogs: BlogResponse[]
  isLoading: boolean
  hasFeatured: boolean
  pagedData?: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
  }
  onPageChange: (newPage: number) => void
  currentUser: any
  onSelectBlog: (blogId: number) => void
  onLike: (e: React.MouseEvent, blogId: number) => void
  onOpenComment: (e: React.MouseEvent, blog: BlogResponse) => void
  onShare: (blog: BlogResponse) => void
  onEdit: (blog: BlogResponse) => void
  onDelete: (blog: BlogResponse) => void
  onToggleStatus: (blog: BlogResponse) => void
  onReport: (type: 'blog' | 'comment', id: number) => void
  onResetFilters: () => void
}

export const FarmerStoriesFeedGrid: React.FC<FarmerStoriesFeedGridProps> = ({
  feedBlogs,
  isLoading,
  hasFeatured,
  pagedData,
  onPageChange,
  currentUser,
  onSelectBlog,
  onLike,
  onOpenComment,
  onShare,
  onEdit,
  onDelete,
  onToggleStatus,
  onReport,
  onResetFilters,
}) => {
  if (!hasFeatured && feedBlogs.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e6dfd2] p-12 text-center flex flex-col items-center gap-3">
        <Sprout size={48} className="text-[#2e5d16]/40" />
        <h3 className="text-base font-bold text-[#191f14]">Chưa có bài viết phù hợp</h3>
        <p className="text-xs text-[#6e7668] max-w-sm">
          Hãy thử chọn danh mục khác hoặc xóa bộ lọc tìm kiếm để xem thêm câu chuyện ruộng vườn.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-2 px-5 py-2 rounded-full bg-[#2e5d16] text-white text-xs font-bold cursor-pointer hover:bg-[#254d12] transition-colors"
        >
          Xem tất cả bài viết
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black text-[#191f14] flex items-center gap-2">
          <BookOpen size={20} className="text-[#2e5d16]" />
          <span>
            {hasFeatured
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
              className="bg-white rounded-2xl border border-[#e6dfd2] p-4.5 sm:p-5 shadow-sm animate-pulse flex flex-col gap-4"
            >
              <div className="h-6 bg-[#f0ebd9] rounded-full w-2/3" />
              <div className="aspect-[16/10] bg-[#f0ebd9] rounded-xl" />
              <div className="h-4 bg-[#f0ebd9] rounded w-full" />
              <div className="h-4 bg-[#f0ebd9] rounded w-4/5" />
            </div>
          ))}
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
                className="bg-white rounded-2xl border border-[#e6dfd2] p-4.5 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-4 group"
              >
                <div>
                  {/* Top Shop Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3.5 text-xs min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {blog.shopAvatar ? (
                        <img
                          src={blog.shopAvatar}
                          alt={blog.shopName || 'Shop'}
                          className="w-8.5 h-8.5 rounded-full object-cover border border-[#e0dad0] shrink-0 aspect-square"
                        />
                      ) : (
                        <div className="w-8.5 h-8.5 rounded-full bg-[#2e5d16] text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0 aspect-square">
                          {(blog.shopName || blog.authorName || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-extrabold text-[#191f14] leading-tight truncate text-xs"
                          title={blog.shopName || blog.authorName || 'Nhà vườn CapNong'}
                        >
                          {blog.shopName || blog.authorName || 'Nhà vườn CapNong'}
                        </div>
                        <div className="text-[10px] text-[#717a6c] flex items-center gap-1 mt-0.5">
                          <Calendar size={10} className="shrink-0" />
                          <span className="truncate">
                            {formatPublishDate(blog.createAt || blog.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#f2eee3] text-[#555d4e] shrink-0 max-w-[125px] truncate whitespace-nowrap block"
                        title={getCategoryBadge(blog.category)}
                      >
                        {getCategoryBadge(blog.category)}
                      </span>
                      <BlogOptionsMenu
                        blog={blog}
                        currentUser={currentUser}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleStatus={onToggleStatus}
                        onShare={onShare}
                        onReport={(b) => onReport('blog', b.blogId || b.id || 0)}
                      />
                    </div>
                  </div>

                  {/* Thumbnail Image */}
                  <div
                    onClick={() => onSelectBlog(blogId)}
                    className="aspect-[16/10] rounded-xl overflow-hidden mb-3.5 relative cursor-pointer shadow-xs group-hover:shadow-md transition-shadow"
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
                    onClick={() => onSelectBlog(blogId)}
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
                      onClick={(e) => onLike(e, blogId)}
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
                      onClick={(e) => onOpenComment(e, blog)}
                      className="flex items-center gap-1 text-[#666e60] hover:text-[#2e5d16] font-bold transition-colors cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      <span>{blog.commentCount || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onShare(blog)}
                      className="text-[#848c7e] hover:text-[#2e5d16] transition-colors"
                      title="Sao chép liên kết"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectBlog(blogId)}
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
              onPageChange(newPage)
              window.scrollTo({ top: 350, behavior: 'smooth' })
            }}
          />
        </div>
      )}
    </div>
  )
}
