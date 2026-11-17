import { Quote, Store, ArrowRight, BookOpen } from 'lucide-react'
import { ProduceImage } from '@/features/product'
import { usePublicBlogs } from '@/features/blog'

const DEFAULT_FARMER_PHOTO =
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'

export default function FarmerStory() {
  const { data: blogData } = usePublicBlogs({
    page: 0,
    size: 1,
    category: 'STORY',
  })

  const latestStory = blogData?.content?.[0]

  const title = latestStory?.title ||
    '"Rau củ cong queo từng bị đổ đống hàng tấn mỗi vụ... Giờ đây chúng nuôi sống gia đình tôi."'

  const content = latestStory
    ? latestStory.content.replace(/<[^>]*>?/gm, '').slice(0, 360) + '...'
    : '"Trước đây khi lái buôn vào vườn, họ chỉ nhặt những trái thanh long thẳng đuột, bắp cải tròn vành vạnh. Những củ cà rốt chia nhánh hay quả dưa cong một chút là bị gạt lại, bán đổ bán tháo hoặc phải ủ làm phân. Nhờ CapNong, người tiêu dùng ở phố hiểu rằng vị ngọt của rau củ không nằm ở ngoại hình. Bà con chúng tôi mừng lắm, vừa có thu nhập ổn định vừa không thấy xót ruột nhìn nông sản bị vứt bỏ."'

  const farmerName = latestStory?.shopName || latestStory?.authorName || 'Chú Sáu (52 tuổi)'
  const farmerRole = latestStory
    ? 'Nhà vườn đồng hành cùng nền tảng CapNong'
    : 'Chủ vườn thanh long & bắp cải tại Đơn Dương'
  const photoUrl = latestStory?.pictureUrl || latestStory?.imageUrl || DEFAULT_FARMER_PHOTO

  return (
    <section
      className="w-full bg-surface-container-low py-12 md:py-16 lg:py-20"
      id="cau-chuyen-nong-dan"
      aria-labelledby="farmer-story-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-md border border-outline-variant/30 grid grid-cols-1 lg:grid-cols-12">
          {/* Farmer Portrait Image Column */}
          <div className="lg:col-span-5 relative min-h-[300px] sm:min-h-[380px] lg:min-h-[480px] bg-leaf-100">
            <ProduceImage
              src={photoUrl}
              alt={farmerName}
              className="absolute inset-0 object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md text-[#1c2216] flex items-center justify-between shadow-lg">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold">{farmerName}</span>
                <span className="text-[11px] text-[#636c5d]">
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
                {content}
              </p>

              <div>
                <a
                  href="/cau-chuyen-nong-dan"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2e5d16] hover:underline"
                >
                  <BookOpen size={16} />
                  <span>Khám phá thêm các câu chuyện mùa vụ khác</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Vendor Registration CTA Box */}
            <div className="bg-[#f7faf4] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-[#e2e8dc]">
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold text-[#1c2216]">
                  Bạn là nhà vườn hoặc hợp tác xã?
                </span>
                <span className="text-xs sm:text-sm text-[#666f60]">
                  Mở gian hàng miễn phí, AI hỗ trợ đăng bán trong 30 giây.
                </span>
              </div>
              <a
                className="shrink-0 px-6 py-3 rounded-full bg-[#2e5d16] hover:bg-[#234910] text-white text-sm font-bold transition-colors shadow-md text-center min-h-[44px] flex items-center justify-center gap-2"
                href="/dang-ky?role=shop"
              >
                <Store size={16} aria-hidden />
                Đăng ký mở gian hàng
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
