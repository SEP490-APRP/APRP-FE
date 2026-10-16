import React from 'react'
import {
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ArrowRight,
  Flame,
} from 'lucide-react'
import { BlogOptionsMenu } from '@/features/blog'
import { formatPublishDate, getCategoryBadge } from '@/features/blog/constants'
import type { BlogResponse } from '@/services'
import freshFarmerBannerImg from '@/assets/fresh-farmer-banner.jpg'
import heroFarmerImg from '@/assets/hero-farmer.jpg'

interface FarmerStoriesFeaturedMagazineProps {
  featuredBlog: BlogResponse
  trendingBlogs: BlogResponse[]
  currentUser: any
  onSelectBlog: (blogId: number) => void
  onLike: (e: React.MouseEvent, blogId: number) => void
  onOpenComment: (e: React.MouseEvent, blog: BlogResponse) => void
  onShare: (blog: BlogResponse) => void
  onEdit: (blog: BlogResponse) => void
  onDelete: (blog: BlogResponse) => void
  onToggleStatus: (blog: BlogResponse) => void
  onReport: (type: 'blog' | 'comment', id: number) => void
  isShopOrAdmin: boolean
  onOpenCreateModal: () => void
}

export const FarmerStoriesFeaturedMagazine: React.FC<FarmerStoriesFeaturedMagazineProps> = ({
  featuredBlog,
  trendingBlogs,
  currentUser,
  onSelectBlog,
  onLike,
  onOpenComment,
  onShare,
  onEdit,
  onDelete,
  onToggleStatus,
  onReport,
  isShopOrAdmin,
  onOpenCreateModal,
}) => {
  const featuredId = featuredBlog.blogId || featuredBlog.id || 1
  const featuredThumb =
    featuredBlog.pictureUrl || featuredBlog.imageUrl || freshFarmerBannerImg

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Cột Trái: Tiêu điểm mùa vụ */}
      <div
        className={`${
          trendingBlogs.length > 0
            ? 'lg:col-span-7 xl:col-span-8 flex flex-col justify-between gap-4'
            : 'lg:col-span-12'
        } bg-white rounded-2xl border border-[#e4ded2] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow`}
      >
        {trendingBlogs.length === 0 ? (
          // HORIZONTAL MAGAZINE LAYOUT WHEN ONLY 1 ARTICLE / NO TRENDING ARTICLES
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Column: Image */}
            <div
              onClick={() => onSelectBlog(featuredId)}
              className="md:col-span-5 aspect-[16/10] sm:aspect-[4/3] max-h-72 rounded-xl overflow-hidden relative shadow-xs group cursor-pointer"
            >
              <img
                src={featuredThumb}
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
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e7668]">
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

                  <BlogOptionsMenu
                    blog={featuredBlog}
                    currentUser={currentUser}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    onShare={onShare}
                    onReport={(b) => onReport('blog', b.blogId || b.id || 0)}
                  />
                </div>

                <h2
                  onClick={() => onSelectBlog(featuredId)}
                  className="text-lg sm:text-xl md:text-2xl font-black text-[#191f14] tracking-tight leading-snug hover:text-[#2e5d16] transition-colors cursor-pointer mb-2.5 line-clamp-2"
                >
                  {featuredBlog.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#555d4e] leading-relaxed line-clamp-3 mb-4">
                  {featuredBlog.content.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>

              <div className="pt-3.5 border-t border-[#ede7dc] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 text-xs text-[#5c6555]">
                  <button
                    type="button"
                    onClick={(e) => onLike(e, featuredId)}
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
                    onClick={(e) => onOpenComment(e, featuredBlog)}
                    className="flex items-center gap-1.5 hover:text-[#2e5d16] font-bold transition-all cursor-pointer"
                  >
                    <MessageCircle size={16} className="text-[#848c7e]" />
                    <span>{featuredBlog.commentCount || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShare(featuredBlog)}
                    className="text-[#848c7e] hover:text-[#2e5d16] transition-colors"
                    title="Chia sẻ"
                  >
                    <Share2 size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectBlog(featuredId)}
                  className="px-4 py-2 rounded-full bg-[#2e5d16] hover:bg-[#254d12] text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Đọc toàn bộ</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // STACKED LAYOUT WHEN TRENDING STORIES COEXIST
          <>
            <div>
              <div
                onClick={() => onSelectBlog(featuredId)}
                className="w-full aspect-[16/9] max-h-60 sm:max-h-72 rounded-xl overflow-hidden relative shadow-xs group cursor-pointer mb-4"
              >
                <img
                  src={featuredThumb}
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

              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e7668]">
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

                <BlogOptionsMenu
                  blog={featuredBlog}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  onShare={onShare}
                  onReport={(b) => onReport('blog', b.blogId || b.id || 0)}
                />
              </div>

              <h2
                onClick={() => onSelectBlog(featuredId)}
                className="text-lg sm:text-xl md:text-2xl font-black text-[#191f14] tracking-tight leading-snug hover:text-[#2e5d16] transition-colors cursor-pointer mb-2 line-clamp-2"
              >
                {featuredBlog.title}
              </h2>

              <p className="text-xs sm:text-sm text-[#555d4e] leading-relaxed line-clamp-2 sm:line-clamp-3">
                {featuredBlog.content.replace(/<[^>]*>?/gm, '')}
              </p>
            </div>

            <div className="pt-3.5 border-t border-[#ede7dc] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 text-xs text-[#5c6555]">
                <button
                  type="button"
                  onClick={(e) => onLike(e, featuredId)}
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
                  onClick={(e) => onOpenComment(e, featuredBlog)}
                  className="flex items-center gap-1.5 hover:text-[#2e5d16] font-bold transition-all cursor-pointer"
                >
                  <MessageCircle size={16} className="text-[#848c7e]" />
                  <span>{featuredBlog.commentCount || 0}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onShare(featuredBlog)}
                  className="text-[#848c7e] hover:text-[#2e5d16] transition-colors"
                  title="Chia sẻ"
                >
                  <Share2 size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelectBlog(featuredId)}
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
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#e4ded2] p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
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
                    onClick={() => onSelectBlog(tbId)}
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
                      <div className="flex items-center justify-between gap-1 text-[10px] text-[#717a6c]">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-[#2e5d16]">
                            {getCategoryBadge(tb.category)}
                          </span>
                          <span>•</span>
                          <span>{formatPublishDate(tb.createAt || tb.createdAt)}</span>
                        </div>
                        <BlogOptionsMenu
                          blog={tb}
                          currentUser={currentUser}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onToggleStatus={onToggleStatus}
                          onShare={onShare}
                          onReport={(b) => onReport('blog', b.blogId || b.id || 0)}
                        />
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
          <div className="p-3 rounded-xl bg-[#f5f1e8] border border-[#e4ded2] flex items-center justify-between text-xs">
            <span className="text-[#555d4e] font-medium text-[11px]">
              Chia sẻ câu chuyện từ vườn nhà bạn?
            </span>
            {isShopOrAdmin ? (
              <button
                type="button"
                onClick={onOpenCreateModal}
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
  )
}
