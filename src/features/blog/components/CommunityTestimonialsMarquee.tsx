import React, { useState, useMemo, type FormEvent } from 'react'
import { Heart, Send, CheckCircle2, Star, Sprout, X } from 'lucide-react'

interface TestimonialNote {
  id: string
  tag: string
  tagStyle: string
  sender: string
  role: string
  message: string
  time: string
  avatarBg: string
  avatarText: string
}

const DEFAULT_NOTES: TestimonialNote[] = [
  {
    id: '1',
    tag: 'NÔNG SẢN TỬ TẾ',
    tagStyle: 'text-[#e11d48] bg-[#ffe4e6] border-[#fecdd3]',
    sender: 'Chị Mai Lan',
    role: 'Quận 7 · TP.HCM',
    message:
      'Cà rốt 2 nhánh của chú Bảy ăn ngọt lịm và nhiều nước hơn hẳn hàng siêu thị. Cả nhà em làm nước ép ai cũng khen!',
    time: '15 phút trước',
    avatarBg: 'bg-[#f43f5e]',
    avatarText: 'ML',
  },
  {
    id: '2',
    tag: 'CANH TÁC HỮU CƠ',
    tagStyle: 'text-[#16a34a] bg-[#dcfce7] border-[#bbf7d0]',
    sender: 'Anh Tuấn Kiệt',
    role: 'Cầu Giấy · Hà Nội',
    message:
      'Mới nhận thùng bắp cải Cầu Đất, lá xanh cuộn chắc nịch. Cảm ơn các bác nông dân đã chăm sóc tận tâm dù thời tiết khắc nghiệt.',
    time: '1 giờ trước',
    avatarBg: 'bg-[#10b981]',
    avatarText: 'TK',
  },
  {
    id: '3',
    tag: 'DINH DƯỠNG NGUYÊN BẢN',
    tagStyle: 'text-[#7c3aed] bg-[#ede9fe] border-[#ddd6fe]',
    sender: 'Bác sĩ Thu Hằng',
    role: 'Bệnh viện ĐHYD · TP.HCM',
    message:
      'Rau củ xấu mã giữ trọn vẹn chất chống oxy hóa tự nhiên. Rất ủng hộ dự án CapNong vì nông nghiệp bền vững.',
    time: '3 giờ trước',
    avatarBg: 'bg-[#8b5cf6]',
    avatarText: 'TH',
  },
  {
    id: '4',
    tag: 'ĐẶC SẢN CHÍNH GỐC',
    tagStyle: 'text-[#0284c7] bg-[#e0f2fe] border-[#bae6fd]',
    sender: 'Cô Thanh Thủy',
    role: 'Nội trợ gia đình · Đà Nẵng',
    message:
      'Bưởi da cám Bến Tre múi hồng đậm đà, tôm mọng nước róc rách. Mua trực tiếp từ nhà vườn cảm giác an tâm tuyệt đối!',
    time: '5 giờ trước',
    avatarBg: 'bg-[#0284c7]',
    avatarText: 'TT',
  },
  {
    id: '5',
    tag: 'VỊ NGỌT ĐẤT TRỜI',
    tagStyle: 'text-[#ea580c] bg-[#ffedd5] border-[#fed7aa]',
    sender: 'Bảo Châu',
    role: 'Gia đình 4 người · Bình Thạnh',
    message:
      'Dâu tây không dùng chất bảo quản thơm lừng mùi mộc mạc, các bé nhà mình mê tít. Chúc các cô chú luôn bội thu mùa vụ!',
    time: 'Hôm qua',
    avatarBg: 'bg-[#f97316]',
    avatarText: 'BC',
  },
  {
    id: '6',
    tag: 'KẾT NỐI TRỰC TIẾP',
    tagStyle: 'text-[#d97706] bg-[#fef3c7] border-[#fde68a]',
    sender: 'Quốc Hoàng',
    role: 'Nhân viên VP · Hà Nội',
    message:
      'Vừa tiết kiệm được 30% chi phí ăn uống mỗi tháng, vừa tiếp sức cho bà con nông dân không bị thương lái ép giá rẻ mạt.',
    time: 'Hôm qua',
    avatarBg: 'bg-[#f59e0b]',
    avatarText: 'QH',
  },
  {
    id: '7',
    tag: 'HƯƠNG VỊ QUÊ NHÀ',
    tagStyle: 'text-[#0d9488] bg-[#ccfbf1] border-[#99f6e4]',
    sender: 'Bác Minh Đức',
    role: 'Cán bộ hưu trí · Ba Đình',
    message:
      'Xoài cát rám vỏ nhưng thơm nức mũi, ngọt sắc từng thớ thịt. Mong CapNong kết nối thêm nhiều nhà vườn hơn nữa!',
    time: '2 ngày trước',
    avatarBg: 'bg-[#14b8a6]',
    avatarText: 'MĐ',
  },
  {
    id: '8',
    tag: 'TRÂN QUÝ MỒ HÔI',
    tagStyle: 'text-[#4f46e5] bg-[#e0e7ff] border-[#c7d2fe]',
    sender: 'Ngọc Lan',
    role: 'Gen Z Sống Xanh · Đà Nẵng',
    message:
      'Nhìn những giọt mồ hôi của người làm nông trên từng luống rau, ăn từng cọng cải thấy trân quý công sức vô cùng.',
    time: '2 ngày trước',
    avatarBg: 'bg-[#6366f1]',
    avatarText: 'NL',
  },
]

interface CommunityTestimonialsMarqueeProps {
  currentUser?: any
}

export const CommunityTestimonialsMarquee: React.FC<CommunityTestimonialsMarqueeProps> = ({
  currentUser,
}) => {
  const [notes, setNotes] = useState<TestimonialNote[]>(DEFAULT_NOTES)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [newNoteSender, setNewNoteSender] = useState('')
  const [newNoteMessage, setNewNoteMessage] = useState('')
  const [noteNotice, setNoteNotice] = useState('')

  const notesRow1 = useMemo(() => notes.slice(0, Math.ceil(notes.length / 2)), [notes])
  const notesRow2 = useMemo(() => notes.slice(Math.ceil(notes.length / 2)), [notes])

  const handleSendNote = (e: FormEvent) => {
    e.preventDefault()
    if (!newNoteMessage.trim()) return

    const rawSender =
      newNoteSender.trim() ||
      (currentUser?.fullName ? `${currentUser.fullName}` : 'Khách mua CapNong')
    const initials = (rawSender.replace(/[^a-zA-ZÀ-ỹ0-9]/g, '').slice(0, 2) || 'KN').toUpperCase()

    const newNote: TestimonialNote = {
      id: Date.now().toString(),
      tag: 'TRI ÂN MỚI',
      tagStyle: 'text-[#16a34a] bg-[#dcfce7] border-[#bbf7d0]',
      sender: rawSender,
      role: 'Khách mua thân thiết',
      message: newNoteMessage.trim(),
      time: 'Vừa xong',
      avatarBg: 'bg-[#2e5d16]',
      avatarText: initials,
    }

    setNotes([newNote, ...notes])
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
                <div className="w-8.5 h-8.5 rounded-full bg-[#f43f5e] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                  ML
                </div>
                <div className="w-8.5 h-8.5 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                  TK
                </div>
                <div className="w-8.5 h-8.5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                  TH
                </div>
                <div className="w-8.5 h-8.5 rounded-full bg-[#2e5d16] text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-xs">
                  +{notes.length + 120}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-extrabold text-[#1c1c17]">
                  {notes.length + 120}+ Lời nhắn tri ân
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
                            <Star key={i} size={11} fill="#ffb703" stroke="none" />
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
                            <Star key={i} size={11} fill="#ffb703" stroke="none" />
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
