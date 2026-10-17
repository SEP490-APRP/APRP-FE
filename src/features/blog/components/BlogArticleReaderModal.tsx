import React, { useState, useRef, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  Share2,
  X,
  Eye,
  Clock,
  Store,
  ShieldCheck,
  Send,
  Sprout,
  ArrowRight,
} from 'lucide-react'
import {
  useBlogDetail,
  useBlogComments,
  useAddBlogComment,
  useDeleteBlogComment,
  useToggleBlogLike,
  BlogOptionsMenu,
  CommentOptionsMenu,
} from '@/features/blog'
import { formatPublishDate } from '@/features/blog/constants'
import { BlogCategoryLabel } from '@/types'
import type { BlogResponse } from '@/services'
import freshFarmerBannerImg from '@/assets/fresh-farmer-banner.jpg'
import { globalShowAlert } from '@/components/common/Popup'

interface BlogArticleReaderModalProps {
  blogId: number | null
  onClose: () => void
  currentUser: any
  onEdit?: (blog: BlogResponse) => void
  onDelete?: (blog: BlogResponse) => void
  onToggleStatus?: (blog: BlogResponse) => void
  onShare?: (blog: BlogResponse) => void
  onReport?: (type: 'blog' | 'comment', id: number) => void
}

export const BlogArticleReaderModal: React.FC<BlogArticleReaderModalProps> = ({
  blogId,
  onClose,
  currentUser,
  onEdit,
  onDelete,
  onToggleStatus,
  onShare,
  onReport,
}) => {
  const navigate = useNavigate()
  const { data: blogDetail, isLoading: isLoadingDetail } = useBlogDetail(blogId)
  const { data: commentsData } = useBlogComments(blogId)

  const toggleLikeMutation = useToggleBlogLike()
  const addCommentMutation = useAddBlogComment()
  const deleteCommentMutation = useDeleteBlogComment()

  const [commentText, setCommentText] = useState('')
  const commentsSectionRef = useRef<HTMLDivElement>(null)

  const readingMinutes = useMemo(() => {
    if (!blogDetail?.content) return 2
    const cleanText = blogDetail.content.replace(/<[^>]*>/g, ' ')
    const words = cleanText.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 180))
  }, [blogDetail?.content])

  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!blogId) return
    if (!currentUser) {
      globalShowAlert('Vui lòng đăng nhập để thả tim bài viết!', 'Yêu cầu đăng nhập', 'warning')
      return
    }
    toggleLikeMutation.mutate(blogId)
  }

  const handleSendComment = (e: FormEvent) => {
    e.preventDefault()
    if (!blogId || !commentText.trim()) return
    if (!currentUser) {
      globalShowAlert('Vui lòng đăng nhập để gửi bình luận!', 'Yêu cầu đăng nhập', 'warning')
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

  const handleDeleteComment = (commentId: number) => {
    if (!blogId) return
    deleteCommentMutation.mutate({ blogId, commentId })
  }

  const handleCopyComment = (text: string) => {
    navigator.clipboard.writeText(text)
    globalShowAlert('Đã sao chép nội dung bình luận!', 'Thành công', 'success')
  }

  const handleCopyShare = (blog: BlogResponse) => {
    if (onShare) {
      onShare(blog)
    } else {
      const url = `${window.location.origin}/cau-chuyen-nong-dan?blogId=${blog.blogId || blog.id}`
      navigator.clipboard.writeText(url)
      globalShowAlert('Đã sao chép liên kết bài viết!', 'Thành công', 'success')
    }
  }

  const getCategoryBadge = (categoryKey?: string) => {
    if (!categoryKey) return 'Bài viết'
    return BlogCategoryLabel[categoryKey] || categoryKey
  }

  if (!blogId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-[#ede8df] flex flex-col max-h-[92vh] overflow-hidden">
        {/* STICKY TOP BAR */}
        <div className="sticky top-0 z-30 px-5 sm:px-7 py-3 bg-white/95 backdrop-blur-md border-b border-[#ede7dc] flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f2eee3] text-[#2e5d16] font-bold text-xs">
              <Sprout size={13} className="text-[#2e5d16]" />
              {blogDetail ? getCategoryBadge(blogDetail.category) : 'Bài viết'}
            </span>
            {blogDetail && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#7e8777]">
                <Clock size={12} />
                ~{readingMinutes} phút đọc
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {blogDetail && (
              <>
                <button
                  type="button"
                  onClick={() => handleCopyShare(blogDetail)}
                  className="w-8.5 h-8.5 rounded-lg bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center transition-colors cursor-pointer"
                  title="Sao chép liên kết bài viết"
                >
                  <Share2 size={15} />
                </button>
                <BlogOptionsMenu
                  blog={blogDetail}
                  currentUser={currentUser}
                  onEdit={(b) => {
                    onClose()
                    if (onEdit) onEdit(b)
                  }}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  onShare={handleCopyShare}
                  onReport={(b) => onReport && onReport('blog', b.blogId || b.id || 0)}
                  buttonClassName="w-8.5 h-8.5 rounded-lg bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center transition-colors cursor-pointer"
                />
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8.5 h-8.5 rounded-lg bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng bài viết"
              title="Đóng bài viết"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE ARTICLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7 lg:px-10 lg:py-8 space-y-5 scroll-smooth">
          {isLoadingDetail && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#2e5d16]/20 border-t-[#2e5d16] rounded-full animate-spin" />
              <p className="text-sm text-[#717a6c] font-medium">Đang tải câu chuyện ruộng vườn...</p>
            </div>
          )}

          {blogDetail && (
            <div className="flex flex-col gap-5">
              {/* TOP HERO: SPLIT 2 CỘT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center pb-5 border-b border-[#ede7dc]">
                {/* Left Column: Title + Author Showcase */}
                <div className="md:col-span-7 flex flex-col justify-center gap-3.5">
                  <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] font-black text-[#141a10] tracking-tight leading-[1.3]">
                    {blogDetail.title}
                  </h1>

                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-[#faf7f0] border border-[#ede7dc]">
                    <div className="flex items-center gap-3">
                      {blogDetail.shopAvatar ? (
                        <img
                          src={blogDetail.shopAvatar}
                          alt={blogDetail.shopName || blogDetail.authorName || 'Nhà vườn'}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-[#2e5d16]/30 shadow-xs shrink-0 aspect-square"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2e5d16] to-[#477a28] text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0 aspect-square">
                          {(blogDetail.shopName || blogDetail.authorName || 'N').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-[#191f14]">
                            {blogDetail.shopName || blogDetail.authorName || 'Nhà vườn CapNong'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e8f2e1] text-[#2e5d16] text-[10px] font-bold">
                            <ShieldCheck size={11} className="text-[#2e5d16]" />
                            Nhà Vườn Xanh
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-[#757e6e] mt-0.5">
                          <span>{formatPublishDate(blogDetail.createAt || blogDetail.createdAt)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {blogDetail.views || blogDetail.viewCount || 0} lượt đọc
                          </span>
                        </div>
                      </div>
                    </div>

                    {blogDetail.shopId && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          navigate(`/cua-hang/${blogDetail.shopId}`)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-[#2e5d16] text-[#2e5d16] hover:text-white border border-[#2e5d16]/30 font-bold text-xs shadow-xs transition-all cursor-pointer group shrink-0"
                      >
                        <Store size={13} className="group-hover:scale-110 transition-transform" />
                        <span>Ghé gian hàng</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Thumbnail */}
                <div className="md:col-span-5 h-44 sm:h-48 md:h-52 w-full rounded-xl overflow-hidden shadow-xs border border-[#ede8df] bg-[#f5f1e8] relative shrink-0">
                  <img
                    src={blogDetail.pictureUrl || blogDetail.imageUrl || freshFarmerBannerImg}
                    alt={blogDetail.title}
                    className="w-full h-full object-cover object-center hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Editorial Content Body */}
              <div className="space-y-4 text-[15px] sm:text-[16px] leading-[1.8] text-[#2d3629] font-normal py-1 border-b border-[#ede7dc] pb-6">
                {blogDetail.content.includes('<p') ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: blogDetail.content }}
                    className="prose max-w-none text-inherit prose-headings:font-bold prose-headings:text-[#191f14] prose-a:text-[#2e5d16] prose-img:rounded-xl"
                  />
                ) : (
                  blogDetail.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))
                )}
              </div>

              {/* Interactive Bar */}
              <div className="py-1 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleLike}
                    className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      blogDetail.isLikedByCurrentUser
                        ? 'bg-[#c82626] text-white ring-2 ring-[#c82626]/20'
                        : 'bg-[#faede8] text-[#c82626] hover:bg-[#c82626] hover:text-white'
                    }`}
                  >
                    <Heart
                      size={15}
                      className={blogDetail.isLikedByCurrentUser ? 'fill-white' : ''}
                    />
                    <span>{blogDetail.likeCount || 0} Cảm kích</span>
                  </button>

                  <button
                    type="button"
                    onClick={scrollToComments}
                    className="px-3.5 py-2 rounded-xl bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle size={15} className="text-[#2e5d16]" />
                    <span>{commentsData?.totalElements || blogDetail.commentCount || 0} Bình luận</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyShare(blogDetail)}
                  className="px-3.5 py-2 rounded-xl bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                >
                  <Share2 size={14} />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {/* Farm Spotlight Card */}
              {blogDetail.shopId && (
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#f2f8ed] to-[#f8fbf5] border border-[#d6e5cd] flex flex-col sm:flex-row items-center justify-between gap-3.5">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-[#2e5d16] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Store size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-[#191f14]">
                        Yêu thích nông sản của {blogDetail.shopName || 'nhà vườn này'}?
                      </h4>
                      <p className="text-xs text-[#5d6854] mt-0.5">
                        Khám phá các loại nông sản tươi ngon, an toàn được thu hoạch trực tiếp tại vườn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/cua-hang/${blogDetail.shopId}`)
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2e5d16] hover:bg-[#254d12] text-white font-bold text-xs sm:text-sm shadow-xs transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Xem gian hàng nông sản</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Comments Section */}
              <div ref={commentsSectionRef} className="pt-2 flex flex-col gap-3.5">
                <h3 className="font-extrabold text-base sm:text-lg text-[#191f14] flex items-center gap-2">
                  <MessageCircle size={18} className="text-[#2e5d16]" />
                  <span>Bình luận &amp; Thảo luận ({commentsData?.totalElements || commentsData?.content?.length || 0})</span>
                </h3>

                {/* Comment Form */}
                <form
                  onSubmit={handleSendComment}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#faf7f0] border border-[#ede7dc]"
                >
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName || 'User'}
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2e5d16] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {currentUser ? (currentUser.fullName || currentUser.email || 'U').charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={
                        currentUser
                          ? 'Chia sẻ cảm nhận, đặt câu hỏi cho nhà vườn...'
                          : 'Vui lòng đăng nhập để gửi bình luận...'
                      }
                      className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-[#e4ded0] text-xs sm:text-sm outline-none focus:border-[#2e5d16] text-[#191f14] placeholder:text-[#979f8f]"
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || !commentText.trim()}
                      className="px-4 py-2 rounded-lg bg-[#2e5d16] hover:bg-[#254d12] text-white font-bold text-xs sm:text-sm shadow-xs shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send size={13} />
                      <span>{addCommentMutation.isPending ? 'Đang gửi...' : 'Gửi'}</span>
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 mt-1 pb-10">
                  {commentsData?.content && commentsData.content.length > 0 ? (
                    commentsData.content.map((cm) => {
                      const commenterName = cm.userName || 'Người dùng'
                      const isShopOwnerComment = blogDetail.shopId && cm.userId === blogDetail.shopId
                      return (
                        <div
                          key={cm.commentId}
                          className="p-3.5 bg-[#fbf9f4] hover:bg-[#f8f5ee] rounded-xl border border-[#ede7dc] flex flex-col gap-1.5 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {cm.userAvatar ? (
                                <img
                                  src={cm.userAvatar}
                                  alt={commenterName}
                                  className="w-7 h-7 rounded-full object-cover ring-1 ring-black/5"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#2e5d16]/90 text-white text-xs font-bold flex items-center justify-center">
                                  {commenterName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <strong className="text-xs sm:text-sm text-[#191f14]">{commenterName}</strong>
                                {isShopOwnerComment && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#e8f2e1] text-[#2e5d16] text-[10px] font-extrabold flex items-center gap-1">
                                    <Sprout size={10} />
                                    Chủ Vườn 🌱
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#808879]">
                              <span>{formatPublishDate(cm.createAt)}</span>
                              <CommentOptionsMenu
                                comment={cm}
                                blog={blogDetail}
                                currentUser={currentUser}
                                onDelete={(cId) => handleDeleteComment(cId)}
                                onCopy={handleCopyComment}
                                onReport={(cId) => onReport && onReport('comment', cId)}
                              />
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-[#454d3f] leading-relaxed pl-9 whitespace-pre-line">
                            {cm.content}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-6 px-4 rounded-xl bg-[#faf7f0]/60 border border-dashed border-[#e4ded0]">
                      <p className="text-xs text-[#7f8877] italic">
                        Chưa có bình luận nào. Hãy là người đầu tiên để lại lời nhắn động viên cho nhà vườn!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
