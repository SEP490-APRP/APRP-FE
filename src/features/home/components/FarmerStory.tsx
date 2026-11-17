import { Quote, ShoppingBasket, ArrowRight, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProduceImage } from '@/features/product'
import { usePublicBlogs } from '@/features/blog'

export default function FarmerStory() {
  const { data: blogData, isLoading: isBlogLoading } = usePublicBlogs({
    page: 0,
    size: 1,
    category: 'STORY',
  })

  // Nếu chưa có bài viết thể loại STORY, tự động lấy bài viết mới nhất từ bất kỳ danh mục nào
  const needFallbackQuery = Boolean(blogData && blogData.content?.length === 0)
  const { data: latestBlogData, isLoading: isLatestLoading } = usePublicBlogs(
    needFallbackQuery ? { page: 0, size: 1 } : undefined,
  )

  const isLoading = isBlogLoading || (needFallbackQuery && isLatestLoading)
  const latestStory = blogData?.content?.[0] ?? latestBlogData?.content?.[0]

  const title = latestStory?.title || 'Câu chuyện từ nhà vườn CapNong'
  const rawContent = latestStory?.content ? latestStory.content.replace(/<[^>]*>?/gm, '').trim() : ''
  const content = rawContent.length > 360 ? rawContent.slice(0, 360) + '...' : rawContent
  const farmerName = latestStory?.shopName || 'Nhà vườn CapNong'
  const farmerRole = 'Nhà vườn đồng hành cùng nền tảng CapNong'
  const photoUrl = latestStory?.pictureUrl || ''

  return (
    <section
      className="w-full bg-surface-container-low py-12 md:py-16 lg:py-20"
      id="cau-chuyen-nong-dan"
      aria-labelledby="farmer-story-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-md border border-outline-variant/30 grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
          {isLoading ? (
            <div className="col-span-12 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-pulse">
              <div className="lg:col-span-5 h-[340px] bg-gray-200 rounded-2xl" />
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="h-6 bg-gray-200 rounded-full w-40" />
                <div className="h-8 bg-gray-300 rounded-lg w-4/5" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-16 bg-gray-100 rounded-2xl mt-4" />
              </div>
            </div>
          ) : !latestStory ? (
            <div className="col-span-12 p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4">
              <Quote size={40} className="text-[#2e5d16]" />
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c2216]">
                Câu chuyện mùa vụ đang được cập nhật
              </h3>
              <p className="text-sm sm:text-base text-[#525a4c] max-w-lg leading-relaxed">
                Bà con nông dân tại các vùng liên kết đang trong cao điểm thu hái mùa vụ. Hãy cùng đón
                đọc các dòng nhật ký canh tác và hình ảnh mới nhất tại chuyên mục Chuyện Nông Dân.
              </p>
              <Link
                to="/cau-chuyen-nong-dan"
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2e5d16] hover:bg-[#234910] text-white text-sm font-bold transition-all shadow-md"
              >
                <BookOpen size={16} />
                <span>Khám phá Chuyện Nông Dân</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              {/* Farmer Portrait Image Column */}
              <div className="lg:col-span-5 relative min-h-[300px] sm:min-h-[380px] lg:min-h-[480px] bg-leaf-100">
                {photoUrl ? (
                  <ProduceImage
                    src={photoUrl}
                    alt={farmerName}
                    className="absolute inset-0 object-cover w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#e4ede0] text-[#2e5d16]">
                    <BookOpen size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md text-[#1c2216] flex items-center justify-between shadow-lg">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs sm:text-sm font-bold truncate">{farmerName}</span>
                    <span className="text-[11px] text-[#636c5d] truncate">
                      {farmerRole}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#2e5d16]/10 text-[#2e5d16] text-xs font-bold shrink-0">
                    Nhà Vườn Thật
                  </span>
                </div>
              </div>

              {/* Farmer Narrative & Vendor Callout */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2e5d16]/10 text-[#2e5d16] w-fit">
                    <Quote size={16} aria-hidden />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Câu chuyện từ luống cày
                    </span>
                  </div>
                  <h2
                    id="farmer-story-title"
                    className="text-2xl sm:text-3xl lg:text-4xl text-[#1c2216] font-extrabold leading-tight tracking-tight"
                  >
                    {title}
                  </h2>
                  <p className="text-sm sm:text-base text-[#525a4c] leading-relaxed">
                    "{content}"
                  </p>

                  <div>
                    <Link
                      to="/cau-chuyen-nong-dan"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2e5d16] hover:underline"
                    >
                      <BookOpen size={16} />
                      <span>Khám phá thêm các câu chuyện mùa vụ khác</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Buyer Support CTA Box */}
                <div className="bg-[#f7faf4] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-[#e2e8dc]">
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-bold text-[#1c2216]">
                      Đồng hành cùng nhà vườn Việt Nam
                    </span>
                    <span className="text-xs sm:text-sm text-[#666f60]">
                      Mỗi đơn hàng giải cứu là một phần tiếp sức để người nông dân yên tâm canh tác sạch.
                    </span>
                  </div>
                  <Link
                    className="shrink-0 px-6 py-3 rounded-full bg-[#2e5d16] hover:bg-[#234910] text-white text-sm font-bold transition-colors shadow-md text-center min-h-[44px] flex items-center justify-center gap-2"
                    to="/nong-san-tuoi"
                  >
                    <ShoppingBasket size={16} aria-hidden />
                    Ủng hộ nông sản hôm nay
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
