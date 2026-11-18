import { useMemo } from 'react'
import {
  Star,
  Heart,
  Zap,
  Award,
  Gift,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFeaturedReviews } from '@/features/review/hooks/useReviewQueries'
import type { ReviewResponse } from '@/services'

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
  rating: number
}

const AVATAR_PALETTE = [
  'bg-[#f43f5e]',
  'bg-[#0284c7]',
  'bg-[#8b5cf6]',
  'bg-[#f59e0b]',
  'bg-[#f97316]',
  'bg-[#10b981]',
  'bg-[#14b8a6]',
  'bg-[#6366f1]',
]

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'KH'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function resolveTag(review: ReviewResponse): {
  tag: string
  tagIcon: LucideIcon
  tagStyle: string
} {
  const comment = (review.comment ?? '').toLowerCase()
  const rating = Number(review.ratingStar ?? 5)

  if (rating >= 5) {
    return {
      tag: 'CHẤT LƯỢNG 5 SAO',
      tagIcon: Award,
      tagStyle: 'text-[#7c3aed] bg-[#ede9fe] border-[#ddd6fe]',
    }
  }
  if (comment.includes('nhanh') || comment.includes('ship') || comment.includes('giao')) {
    return {
      tag: 'GIAO NHANH CHUẨN XANH',
      tagIcon: Zap,
      tagStyle: 'text-[#0284c7] bg-[#e0f2fe] border-[#bae6fd]',
    }
  }
  if (comment.includes('túi mù') || comment.includes('bất ngờ') || comment.includes('combo')) {
    return {
      tag: 'TÚI MÙ BẤT NGỜ',
      tagIcon: Gift,
      tagStyle: 'text-[#ea580c] bg-[#ffedd5] border-[#fed7aa]',
    }
  }
  if (comment.includes('tươi') || comment.includes('ngon') || comment.includes('sạch')) {
    return {
      tag: 'TƯƠI NGON CHUẨN VỊ',
      tagIcon: Heart,
      tagStyle: 'text-[#e11d48] bg-[#ffe4e6] border-[#fecdd3]',
    }
  }
  return {
    tag: 'ĐÁNH GIÁ THỰC TẾ',
    tagIcon: ShieldCheck,
    tagStyle: 'text-[#16a34a] bg-[#dcfce7] border-[#bbf7d0]',
  }
}

function mapReviewToCard(review: ReviewResponse, index: number): TestimonialCard {
  const { tag, tagIcon, tagStyle } = resolveTag(review)
  const author = review.fullName || review.buyerName || 'Khách hàng CapNong'
  const rating = Math.max(1, Math.min(5, Math.round(Number(review.ratingStar ?? 5))))

  let role = 'Khách hàng đã xác thực'
  if (review.productName) {
    role = `Đã mua ${review.productName}`
  } else if (review.boxType) {
    role = `Trải nghiệm ${review.boxType}`
  } else if (review.comboName) {
    role = `Đã mua ${review.comboName}`
  } else if (review.shopName) {
    role = `Mua tại ${review.shopName}`
  }

  return {
    id: String(review.id || review.reviewId || `r-${index}`),
    tag,
    tagIcon,
    tagStyle,
    quote: review.comment || 'Nông sản rất tươi ngon và giao hàng nhanh chóng!',
    author,
    role,
    avatarBg: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    avatarText: getInitials(author),
    rating,
  }
}

export default function Testimonials() {
  const { data, isLoading } = useFeaturedReviews(12)

  const reviews = data?.reviews ?? []
  const avgRating = data?.platformAverageRating ?? 5.0
  const totalReviews = data?.platformTotalReviews ?? reviews.length

  const { row1, row2 } = useMemo(() => {
    if (reviews.length === 0) {
      return { row1: [], row2: [] }
    }

    const cards = reviews.map((r, i) => mapReviewToCard(r, i))

    // Đảm bảo mỗi hàng có tối thiểu 4 cards để animation chạy mượt mà
    let filledCards = [...cards]
    while (filledCards.length < 8) {
      filledCards = [...filledCards, ...cards]
    }

    const mid = Math.ceil(filledCards.length / 2)
    return {
      row1: filledCards.slice(0, mid),
      row2: filledCards.slice(mid),
    }
  }, [reviews])

  const topAvatars = useMemo(() => {
    return reviews.slice(0, 3).map((r, i) => ({
      text: getInitials(r.fullName || r.buyerName),
      bg: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
    }))
  }, [reviews])

  return (
    <section
      id="cong-dong-tieu-dung"
      className="w-full bg-[#f8f6f0] py-12 md:py-16 lg:py-20 relative overflow-hidden border-b border-[#ede8df]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Column: Section Header */}
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
              {topAvatars.map((av, idx) => (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-full ${av.bg} text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm`}
                >
                  {av.text}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full bg-[#2e7d32] text-white flex items-center justify-center font-bold text-caption ring-2 ring-white shadow-sm">
                ★ {avgRating.toFixed(1)}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-extrabold text-[#1c1c17]">
                {totalReviews > 0 ? `${totalReviews} Đánh giá thực tế` : 'Đánh giá 5 sao từ người mua'}
              </span>
              <span className="text-caption text-[#71766b]">
                Hài lòng &amp; ủng hộ bà con nông dân
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 2 Continuous Scrolling Rows or Empty State */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 overflow-hidden relative py-2">
          {/* Gradient Masks on Left and Right for Smooth Fade */}
          <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-[#f8f6f0] to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-[#f8f6f0] to-transparent z-20 pointer-events-none" />

          {isLoading ? (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[300px] h-40 bg-white/60 rounded-2xl shrink-0 border border-[#e5e2da]" />
                ))}
              </div>
            </div>
          ) : row1.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#e5e2da] shadow-sm flex flex-col items-center justify-center text-center gap-3">
              <MessageSquare size={36} className="text-[#326318]" />
              <h3 className="text-base font-bold text-[#1c1c17]">Hãy là người đầu tiên để lại đánh giá!</h3>
              <p className="text-xs text-[#52594d] max-w-md">
                Mỗi đơn hàng giải cứu hoàn tất đều có thể gửi lại cảm nghĩ để lan tỏa tình yêu thương đến bà con nhà vườn.
              </p>
              <Link
                to="/nong-san-tuoi"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-all mt-1"
              >
                <span>Khám phá nông sản tươi</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              {/* Row 1: Continuous Marquee Left */}
              <div className="overflow-hidden w-full">
                <div className="marquee-track-left">
                  {[...row1, ...row1].map((item, idx, all) => {
                    const ROWLEN = all.length / 2
                    const TagIcon = item.tagIcon
                    return (
                      <div
                        key={`${item.id}-r1-${idx}`}
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

                          {/* Stars */}
                          <div className="flex items-center text-[#ffb703]">
                            {[...Array(item.rating)].map((_, i) => (
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
                  {[...row2, ...row2].map((item, idx, all) => {
                    const ROWLEN = all.length / 2
                    const TagIcon = item.tagIcon
                    return (
                      <div
                        key={`${item.id}-r2-${idx}`}
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

                          {/* Stars */}
                          <div className="flex items-center text-[#ffb703]">
                            {[...Array(item.rating)].map((_, i) => (
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
            </>
          )}
        </div>
      </div>
    </section>
  )
}
