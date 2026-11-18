import React, { useState, useMemo, type FormEvent } from 'react'
import { Heart, Send, CheckCircle2, Star, Sprout, X } from 'lucide-react'
import { useFeaturedReviews } from '@/features/review/hooks/useReviewQueries'
import type { ReviewResponse } from '@/services'

interface TestimonialNote {
  id: string
  tag: string
  tagStyle: string
  sender: string
  role: string
  message: string
  rating: number
  avatarBg: string
  avatarText: string
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

function resolveTag(review: ReviewResponse): { tag: string; tagStyle: string } {
  const comment = (review.comment ?? '').toLowerCase()
  const rating = Number(review.ratingStar ?? 5)

  if (rating >= 5) {
    return { tag: 'CHẤT LƯỢNG 5 SAO', tagStyle: 'text-[#7c3aed] bg-[#ede9fe] border-[#ddd6fe]' }
  }
  if (comment.includes('nhanh') || comment.includes('ship') || comment.includes('giao')) {
    return { tag: 'GIAO NHANH CHUẨN XANH', tagStyle: 'text-[#0284c7] bg-[#e0f2fe] border-[#bae6fd]' }
  }
  if (comment.includes('túi mù') || comment.includes('bất ngờ') || comment.includes('combo')) {
    return { tag: 'TÚI MÙ BẤT NGỜ', tagStyle: 'text-[#ea580c] bg-[#ffedd5] border-[#fed7aa]' }
  }
  if (comment.includes('tươi') || comment.includes('ngon') || comment.includes('sạch')) {
    return { tag: 'TƯƠI NGON CHUẨN VỊ', tagStyle: 'text-[#e11d48] bg-[#ffe4e6] border-[#fecdd3]' }
  }
  return { tag: 'ĐÁNH GIÁ THỰC TẾ', tagStyle: 'text-[#16a34a] bg-[#dcfce7] border-[#bbf7d0]' }
}

function mapReviewToNote(review: ReviewResponse, index: number): TestimonialNote {
  const { tag, tagStyle } = resolveTag(review)
  const sender = review.fullName || review.buyerName || 'Khách hàng CapNong'
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
    tagStyle,
    sender,
    role,
    message: review.comment || 'Nông sản rất tươi ngon và giao hàng chu đáo!',
    rating,
    avatarBg: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    avatarText: getInitials(sender),
  }
}

interface CommunityTestimonialsMarqueeProps {
  currentUser?: any
}

export const CommunityTestimonialsMarquee: React.FC<CommunityTestimonialsMarqueeProps> = ({
  currentUser,
}) => {
  const { data: featuredData, isLoading } = useFeaturedReviews(12)
  const [localNotes, setLocalNotes] = useState<TestimonialNote[]>([])
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [newNoteSender, setNewNoteSender] = useState('')
  const [newNoteMessage, setNewNoteMessage] = useState('')
  const [noteNotice, setNoteNotice] = useState('')

  const apiReviews = featuredData?.reviews ?? []
  const totalReviewsCount = featuredData?.platformTotalReviews ?? (apiReviews.length + localNotes.length)

  const allNotes = useMemo(() => {
    const apiNotes = apiReviews.map((r, i) => mapReviewToNote(r, i))
    return [...localNotes, ...apiNotes]
  }, [localNotes, apiReviews])

  const { notesRow1, notesRow2 } = useMemo(() => {
    if (allNotes.length === 0) return { notesRow1: [], notesRow2: [] }
    let list = [...allNotes]
    while (list.length < 6) {
      list = [...list, ...allNotes]
    }
    const mid = Math.ceil(list.length / 2)
    return {
      notesRow1: list.slice(0, mid),
      notesRow2: list.slice(mid),
    }
  }, [allNotes])

  const handleSendNote = (e: FormEvent) => {
    e.preventDefault()
    if (!newNoteMessage.trim()) return

    const rawSender =
      newNoteSender.trim() ||
      (currentUser?.fullName ? `${currentUser.fullName}` : 'Khách mua CapNong')

    const newNote: TestimonialNote = {
      id: Date.now().toString(),
      tag: 'TRI ÂN MỚI',
      tagStyle: 'text-[#16a34a] bg-[#dcfce7] border-[#bbf7d0]',
      sender: rawSender,
      role: 'Khách mua thân thiết',
      message: newNoteMessage.trim(),
      rating: 5,
      avatarBg: 'bg-[#2e5d16]',
      avatarText: getInitials(rawSender),
    }

    setLocalNotes((prev) => [newNote, ...prev])
    setNewNoteSender('')
    setNewNoteMessage('')
    setIsNoteModalOpen(false)
    setNoteNotice('Lời nhắn của bạn đã được đăng lên bảng tin tri ân nông dân!')
    setTimeout(() => setNoteNotice(''), 4000)
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-[#e8e2d5] shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Cột Trái: Tiêu đề + Nút Gửi động viên */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2e5d16]">
                <Heart size={14} className="text-[#c82626] fill-[#c82626]" />
                <span>Góc Tri Ân &amp; Kết Nối Tử Tế</span>
              </span>
              <h2 className="text-2xl sm:text-3xl text-[#1c1c17] font-extrabold tracking-tight mt-1 leading-snug">
                Lời Động Viên Gửi Đến Bà Con Nông Dân
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#52594d] leading-relaxed">
              Mỗi lời nhắn chân tình là động lực to lớn giúp các cô chú nông dân an tâm bám ruộng, giữ trọn cam kết canh tác sạch và nông sản an toàn.
            </p>

            {/* Avatar Stack + Counter */}
            <div className="flex items-center gap-3.5 pt-3 border-t border-[#ede8df]">
              <div className="flex items-center -space-x-2.5">
                {allNotes.slice(0, 3).map((n, i) => (
                  <div
                    key={`av-${i}`}
                    className={`w-8.5 h-8.5 rounded-full ${n.avatarBg} text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs`}
                  >
                    {n.avatarText}
                  </div>
                ))}
                {allNotes.length === 0 && (
                  <div className="w-8.5 h-8.5 rounded-full bg-[#2e5d16] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                    CN
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-extrabold text-[#1c1c17]">
                  {totalReviewsCount > 0
                    ? `${totalReviewsCount} Lời nhắn & Đánh giá`
                    : 'Gửi lời tri ân đầu tiên'}
                </span>
                <span className="text-[11px] text-[#71766b]">
                  Đồng hành cùng bà con nhà vườn
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2e5d16] hover:bg-[#254d12] text-white font-extrabold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <Send size={13} />
                <span>Gửi lời động viên của bạn</span>
              </button>
            </div>

            {noteNotice && (
              <div className="p-2.5 bg-[#eaf5e1] text-[#2c5f11] rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn border border-[#cbe4bc]">
                <CheckCircle2 size={15} />
                <span>{noteNotice}</span>
              </div>
            )}
          </div>

          {/* Cột Phải: 2 hàng Marquee chạy ngược chiều nhau như trang chủ */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3.5 overflow-hidden relative py-1">
            {/* Gradient Masks on Left and Right for Smooth Fade */}
            <div className="absolute top-0 bottom-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-6 h-6 border-2 border-[#2e5d16] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#71766b]">Đang tải đánh giá từ cộng đồng...</span>
              </div>
            ) : allNotes.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center p-6 bg-[#faf8f4] rounded-2xl border border-[#e8e2d5]">
                <Heart size={32} className="text-[#c82626] mb-2" />
                <p className="text-sm font-bold text-[#1c1c17]">Chưa có lời nhắn cộng đồng nào</p>
                <p className="text-xs text-[#71766b] mt-1">Hãy là người đầu tiên gửi lời động viên ấm áp đến các cô chú nông dân!</p>
              </div>
            ) : (
              <>
                {/* Row 1: Marquee Track Left */}
                <div className="overflow-hidden w-full">
                  <div className="marquee-track-left">
                    {[...notesRow1, ...notesRow1].map((item, idx, all) => {
                      const ROWLEN = all.length / 2
                      return (
                        <div
                          key={`${item.id}-r1-${idx}`}
                          aria-hidden={idx >= ROWLEN || undefined}
                          className="w-[280px] sm:w-[320px] shrink-0 bg-[#faf8f4] hover:bg-white rounded-2xl p-4 border border-[#e8e2d5] shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.tagStyle}`}
                            >
                              <Heart size={10} className="fill-current" />
                              <span>{item.tag}</span>
                            </span>
                            <div className="flex items-center text-[#ffb703]">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  fill={i < item.rating ? '#ffb703' : 'none'}
                                  stroke={i < item.rating ? '#ffb703' : '#cbd5e1'}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-[#374151] leading-relaxed line-clamp-3 italic">
                            "{item.message}"
                          </p>

                          <div className="flex items-center gap-2.5 pt-2 border-t border-[#ede8df]">
                            <div
                              className={`w-7.5 h-7.5 rounded-full ${item.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                            >
                              {item.avatarText}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#1e293b] truncate">
                                {item.sender}
                              </span>
                              <span className="text-[10px] text-[#71766b] truncate">
                                {item.role}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Row 2: Marquee Track Right */}
                <div className="overflow-hidden w-full">
                  <div className="marquee-track-right">
                    {[...notesRow2, ...notesRow2].map((item, idx, all) => {
                      const ROWLEN = all.length / 2
                      return (
                        <div
                          key={`${item.id}-r2-${idx}`}
                          aria-hidden={idx >= ROWLEN || undefined}
                          className="w-[280px] sm:w-[320px] shrink-0 bg-[#faf8f4] hover:bg-white rounded-2xl p-4 border border-[#e8e2d5] shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.tagStyle}`}
                            >
                              <Sprout size={10} />
                              <span>{item.tag}</span>
                            </span>
                            <div className="flex items-center text-[#ffb703]">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  fill={i < item.rating ? '#ffb703' : 'none'}
                                  stroke={i < item.rating ? '#ffb703' : '#cbd5e1'}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-[#374151] leading-relaxed line-clamp-3 italic">
                            "{item.message}"
                          </p>

                          <div className="flex items-center gap-2.5 pt-2 border-t border-[#ede8df]">
                            <div
                              className={`w-7.5 h-7.5 rounded-full ${item.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                            >
                              {item.avatarText}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#1e293b] truncate">
                                {item.sender}
                              </span>
                              <span className="text-[10px] text-[#71766b] truncate">
                                {item.role}
                              </span>
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
      </div>

      {/* MODAL: GỬI LỜI ĐỘNG VIÊN NHÀ VƯỜN */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#ede8df] flex flex-col gap-4 relative animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0ebd9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#e8f2e1] text-[#2e5d16] flex items-center justify-center">
                  <Heart size={16} className="text-[#c82626] fill-[#c82626]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#191f14]">Gửi Lời Động Viên</h3>
                  <p className="text-[11px] text-[#717a6c]">
                    Trao gửi yêu thương tới bà con nông dân
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[#f0ebd9] text-[#717a6c] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNote} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#191f14]">Tên hoặc địa chỉ của bạn</label>
                <input
                  type="text"
                  value={newNoteSender}
                  onChange={(e) => setNewNoteSender(e.target.value)}
                  placeholder="VD: Chị Mai (Quận 7, TP.HCM)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7f0] border border-[#ded7c8] text-[#191f14] placeholder-[#8a9284] text-xs focus:outline-none focus:border-[#2e5d16] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#191f14]">
                  Lời nhắn gửi đến bà con <span className="text-[#c82626]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newNoteMessage}
                  onChange={(e) => setNewNoteMessage(e.target.value)}
                  placeholder="Viết lời động viên, cảm nhận về nông sản sạch..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7f0] border border-[#ded7c8] text-[#191f14] placeholder-[#8a9284] text-xs focus:outline-none focus:border-[#2e5d16] focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0ebd9]">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#ded7c8] text-[#555d4e] font-bold text-xs hover:bg-[#f5f1e8] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2e5d16] hover:bg-[#254d12] text-white font-extrabold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Gửi lời động viên</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
