import { Quote, Store } from 'lucide-react'
import { ProduceImage } from '@/features/product'

// Ảnh đang hotlink từ Google (lh3.googleusercontent.com): nên tải về src/assets để không phụ thuộc link ngoài.
// Khi link lỗi, ProduceImage hiện khung thay thế thay vì icon ảnh vỡ + alt text.
const FARMER_PHOTO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWmDYLHMU-if8AyjqhJhJIriYpvw2FXiNwP3cSdLRxHevu5R-xwJdvqHzoy6D0YKT52wYleFXIppEHLt46Q55nbZQtbymRQLlgXFtz4vbxjWLVEORrWfbpVlEkf0KTdfGY0ojyEkOb0_4sRFE1rvX1bCdLslhYz7Vn0knoYJPxRwbyK7BW0t86W1jAhBNdDBsSOr2HXYjz_z8CT5lXFi1RPUsCzva9eee5PmQdo5I7GUjdpspF_vMQ'

// Converted from the user-approved Stitch design with responsive enhancements.
export default function FarmerStory() {
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
              src={FARMER_PHOTO}
              alt="Chú Sáu - nông dân trồng thanh long và bắp cải tại Đơn Dương"
              className="absolute inset-0 object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/85 via-transparent to-transparent lg:hidden" />
            <div className="absolute bottom-4 left-4 right-4 p-3.5 sm:p-4 rounded-2xl bg-surface-bright/95 backdrop-blur-md text-on-surface flex items-center justify-between shadow-lg">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold">Chú Sáu (52 tuổi)</span>
                <span className="text-caption sm:text-xs text-on-surface-variant">
                  Chủ vườn thanh long &amp; bắp cải tại Đơn Dương
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-bold shrink-0">
                Đã bán 14 tấn
              </span>
            </div>
          </div>

          {/* Farmer Narrative & Vendor Callout */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/50 text-secondary w-fit">
                <Quote size={16} aria-hidden />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Câu chuyện từ luống cày
                </span>
              </div>
              <h2
                id="farmer-story-title"
                className="text-2xl sm:text-3xl lg:text-4xl text-on-surface font-extrabold leading-tight tracking-tight"
              >
                "Rau củ cong queo từng bị đổ đống hàng tấn mỗi vụ... Giờ đây chúng nuôi sống gia
                đình tôi."
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                "Trước đây khi lái buôn vào vườn, họ chỉ nhặt những trái thanh long thẳng đuột, bắp
                cải tròn vành vạnh. Những củ cà rốt chia nhánh hay quả dưa cong một chút là bị gạt
                lại, bán đổ bán tháo hoặc phải ủ làm phân. Nhờ CapNong, người tiêu dùng ở phố hiểu
                rằng vị ngọt của rau củ không nằm ở ngoại hình. Bà con chúng tôi mừng lắm, vừa có
                thu nhập ổn định vừa không thấy xót ruột nhìn nông sản bị vứt bỏ."
              </p>
            </div>

            {/* Vendor Registration CTA Box */}
            <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-outline-variant/30">
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold text-on-surface">
                  Bạn là nhà vườn hoặc hợp tác xã?
                </span>
                <span className="text-xs sm:text-sm text-on-surface-variant">
                  Mở gian hàng miễn phí, AI hỗ trợ đăng bán trong 30 giây.
                </span>
              </div>
              <a
                className="shrink-0 px-6 py-3 rounded-full bg-secondary hover:bg-on-surface text-on-secondary text-sm font-bold transition-colors shadow-md text-center min-h-[44px] flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                href="#/dang-ky?role=shop"
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
