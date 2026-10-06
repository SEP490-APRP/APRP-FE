import {
  Star,
  Heart,
  Zap,
  Award,
  Target,
  Sprout,
  Gift,
  ShieldCheck,
  Compass,
  type LucideIcon,
} from 'lucide-react'

interface TestimonialCard {
  id: string
  tag: string
  tagIcon: LucideIcon
  tagStyle: string
  quote: string
  author: string
  role: string
  avatarBg: string
  avatarText: string
}

const ROW_1: TestimonialCard[] = [
  {
    id: 't1',
    tag: 'TIN CẬY 100%',
    tagIcon: Heart,
    tagStyle: 'text-[#e11d48] bg-[#ffe4e6] border-[#fecdd3]',
    quote:
      'Từ ngày mua ở CapNong, tiền chợ nhà mình giảm hẳn 30% mà bữa nào cũng đầy ắp rau củ sạch. Củ quả xấu mã một xíu nhưng ăn giòn ngọt tự nhiên, rất an tâm.',
    author: 'Thu Trang',
    role: 'Mẹ bé Bắp · Hà Nội',
    avatarBg: 'bg-[#f43f5e]',
    avatarText: 'TT',
  },
  {
    id: 't2',
    tag: 'TIỆN LỢI & SIÊU NHANH',
    tagIcon: Zap,
    tagStyle: 'text-[#0284c7] bg-[#e0f2fe] border-[#bae6fd]',
    quote:
      'Hệ thống gợi ý combo tuần rất thông minh. Đặt buổi sáng là trưa shipper xanh giao tận cửa. Cà chua bi cực kỳ đậm vị, thơm ngon vô cùng.',
    author: 'Minh Tuấn',
    role: 'Bếp trưởng Cơm Chay · TP.HCM',
    avatarBg: 'bg-[#0284c7]',
    avatarText: 'MT',
  },
  {
    id: 't3',
    tag: 'CHẤT LƯỢNG 5 SAO',
    tagIcon: Award,
    tagStyle: 'text-[#7c3aed] bg-[#ede9fe] border-[#ddd6fe]',
    quote:
      'Các đánh giá và điểm độ tươi AI trên nền tảng rất chân thực. Mua bưởi da xanh vỏ rám nhưng ruột hồng mọng nước, ăn ngọt lịm!',
    author: 'Ngọc Lan',
    role: 'Gen Z Sống Xanh · Đà Nẵng',
    avatarBg: 'bg-[#8b5cf6]',
    avatarText: 'NL',
  },
  {
    id: 't4',
    tag: 'MINH BẠCH GIÁ GỐC',
    tagIcon: Target,
    tagStyle: 'text-[#d97706] bg-[#fef3c7] border-[#fde68a]',
    quote:
      'Giá cả công khai minh bạch từ nhà vườn, không qua nhiều tầng trung gian. Cảm giác vừa tiết kiệm vừa giúp ích được bà con nông dân.',
    author: 'Quốc Hưng',
    role: 'Dân văn phòng · Cầu Giấy',
    avatarBg: 'bg-[#f59e0b]',
    avatarText: 'QH',
  },
]

const ROW_2: TestimonialCard[] = [
  {
    id: 't5',
    tag: 'TÚI MÙ BẤT NGỜ',
    tagIcon: Gift,
    tagStyle: 'text-[#ea580c] bg-[#ffedd5] border-[#fed7aa]',
    quote:
      'Túi Mù 79k mở ra đủ 5kg rau lá và củ quả tươi roi rói thu hoạch sáng sớm. Khui hộp như mở quà bí mật, cả nhà ai cũng thích thú!',
    author: 'Bảo Châu',
    role: 'Gia đình 4 người · Bình Thạnh',
    avatarBg: 'bg-[#f97316]',
    avatarText: 'BC',
  },
  {
    id: 't6',
    tag: 'ỦNG HỘ NHÀ VƯỜN',
    tagIcon: Sprout,
    tagStyle: 'text-[#16a34a] bg-[#dcfce7] border-[#bbf7d0]',
    quote:
      'Biết rõ từng bó rau xuất xứ từ vườn nào ở Đơn Dương hay Gia Lai. Nông sản thật, người thật, mua sắm rất có ý nghĩa xã hội.',
    author: 'Bác Hoàng Nam',
    role: 'Cán bộ hưu trí · Ba Đình',
    avatarBg: 'bg-[#10b981]',
    avatarText: 'HN',
  },
  {
    id: 't7',
    tag: 'AI QUÉT ĐỘ TƯƠI',
    tagIcon: Compass,
    tagStyle: 'text-[#0d9488] bg-[#ccfbf1] border-[#99f6e4]',
    quote:
      'Tính năng quét ảnh AI nhận diện khuyết tật và độ tươi cực đỉnh! Tự động lên thực đơn tuần cân đối dinh dưỡng cho cả gia đình.',
    author: 'Thanh Thảo',
    role: 'Food Blogger · TP.HCM',
    avatarBg: 'bg-[#14b8a6]',
    avatarText: 'TT',
  },
  {
    id: 't8',
    tag: 'ĐỔI TRẢ TẬN TÂM',
    tagIcon: ShieldCheck,
    tagStyle: 'text-[#4f46e5] bg-[#e0e7ff] border-[#c7d2fe]',
    quote:
      'Có 1 lần củ dền bị cấn nhẹ trong lúc ship, gửi video là được hoàn tiền bù ngay trong 1 giờ. Dịch vụ chăm sóc khách hàng 10/10.',
    author: 'Văn Đức',
    role: 'Kỹ sư phần mềm · Hà Nội',
    avatarBg: 'bg-[#6366f1]',
    avatarText: 'VĐ',
  },
]

export default function Testimonials() {
  return (
    <section
      id="cong-dong-tieu-dung"
      className="w-full bg-[#f8f6f0] py-12 md:py-16 lg:py-20 relative overflow-hidden border-b border-[#ede8df]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Column: Homogeneous Section Header matching Homepage */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Heart size={15} className="text-[#e11d48]" />
              <span>Cộng đồng tiêu dùng tử tế</span>
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#1c1c17] font-extrabold tracking-tight mt-1">
              Phản hồi từ người dùng CapNong
            </h2>
          </div>

          <p className="text-xs sm:text-sm lg:text-base text-[#52594d] leading-relaxed">
            Kết nối yêu thương, chung tay giảm lãng phí thực phẩm. Khám phá lý do hàng ngàn gia đình
            luôn tin tưởng và lựa chọn CapNong mỗi ngày.
          </p>

          {/* Avatar Stack + Counter */}
          <div className="flex items-center gap-3.5 pt-3 border-t border-[#ede8df]">
            <div className="flex items-center -space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f43f5e] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                TT
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                MT
              </div>
              <div className="w-9 h-9 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                NL
              </div>
              <div className="w-9 h-9 rounded-full bg-[#2e7d32] text-white flex items-center justify-center font-bold text-caption ring-2 ring-white shadow-sm">
                +12k
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-extrabold text-[#1c1c17]">
                12.000+ Lượt giải cứu
              </span>
              <span className="text-caption text-[#71766b]">
                Hài lòng &amp; ủng hộ bà con nông dân
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 2 Continuous Scrolling Rows */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 overflow-hidden relative py-2">
          {/* Gradient Masks on Left and Right for Smooth Fade */}
          <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-[#f8f6f0] to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-[#f8f6f0] to-transparent z-20 pointer-events-none" />

          {/* Row 1: Continuous Marquee Left */}
          <div className="overflow-hidden w-full">
            <div className="marquee-track-left">
              {[...ROW_1, ...ROW_1].map((item, idx, all) => {
                const ROWLEN = all.length / 2
                const TagIcon = item.tagIcon
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    aria-hidden={idx >= ROWLEN || undefined}
                    className="w-[300px] sm:w-[340px] shrink-0 bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e2da] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3.5"
                  >
                    {/* Top Tag */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 text-caption font-bold px-2.5 py-0.5 rounded-full border ${item.tagStyle}`}
                      >
                        <TagIcon size={11} />
                        <span>{item.tag}</span>
                      </span>

                      {/* 5 Stars */}
                      <div className="flex items-center text-[#ffb703]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill="#ffb703" stroke="none" />
                        ))}
                      </div>
                    </div>

                    {/* Quote Text */}
                    <p className="text-sm text-[#374151] leading-relaxed line-clamp-4">
                      "{item.quote}"
                    </p>

                    {/* Author Row */}
                    <div className="flex items-center gap-2.5 pt-2 border-t border-[#f1f5f9]">
                      <div
                        className={`w-8 h-8 rounded-full ${item.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                      >
                        {item.avatarText}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#1e293b] truncate">
                          {item.author}
                        </span>
                        <span className="text-caption text-[#64748b] truncate">{item.role}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Row 2: Continuous Marquee Right */}
          <div className="overflow-hidden w-full">
            <div className="marquee-track-right">
              {[...ROW_2, ...ROW_2].map((item, idx, all) => {
                const ROWLEN = all.length / 2
                const TagIcon = item.tagIcon
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    aria-hidden={idx >= ROWLEN || undefined}
                    className="w-[300px] sm:w-[340px] shrink-0 bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e2da] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3.5"
                  >
                    {/* Top Tag */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 text-caption font-bold px-2.5 py-0.5 rounded-full border ${item.tagStyle}`}
                      >
                        <TagIcon size={11} />
                        <span>{item.tag}</span>
                      </span>

                      {/* 5 Stars */}
                      <div className="flex items-center text-[#ffb703]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill="#ffb703" stroke="none" />
                        ))}
                      </div>
                    </div>

                    {/* Quote Text */}
                    <p className="text-sm text-[#374151] leading-relaxed line-clamp-4">
                      "{item.quote}"
                    </p>

                    {/* Author Row */}
                    <div className="flex items-center gap-2.5 pt-2 border-t border-[#f1f5f9]">
                      <div
                        className={`w-8 h-8 rounded-full ${item.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                      >
                        {item.avatarText}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#1e293b] truncate">
                          {item.author}
                        </span>
                        <span className="text-caption text-[#64748b] truncate">{item.role}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
