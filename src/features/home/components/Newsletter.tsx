import { useState, type FormEvent } from 'react'
import {
  Mail,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Store,
  Gift,
} from 'lucide-react'
import fullBannerImg from '@/assets/full-ecosystem-banner.jpg'

interface NewsletterProps {
  onInfo?: (title: string) => void
}

export default function Newsletter({ onInfo }: NewsletterProps) {
  const [contactInput, setContactInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value = contactInput.trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
    const isPhone = /^(\+84|0)(3|5|7|8|9)\d{8}$/.test(value.replace(/[\s.-]/g, ''))
    if (!isEmail && !isPhone) {
      setError('Vui lòng nhập email hoặc số điện thoại Việt Nam hợp lệ (VD: 0912 345 678).')
      return
    }
    setError('')
    setSubmitted(true)
  }

  return (
    <section
      id="dang-ky-dong-hanh"
      className="w-full relative overflow-hidden bg-[#163310] text-white py-16 sm:py-20 lg:py-24"
    >
      {/* Full-width Panoramic Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={fullBannerImg}
          alt="Toàn cảnh nông trại CapNong Đà Lạt"
          className="w-full h-full object-cover object-center filter brightness-[0.72]"
        />
        {/* Deep cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e240a]/95 via-[#163310]/85 to-[#0e240a]/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
      </div>

      {/* Full Width Inner Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col gap-10 sm:gap-12">
        {/* Top Header Banner */}
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center gap-3.5">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#ffea79] text-xs font-extrabold uppercase tracking-wider shadow-lg">
            <Sparkles size={14} className="text-[#ffea79]" />
            <span>Đồng Hành Cùng Hệ Sinh Thái Nông Sản CapNong</span>
          </div>

          {/* Main Headline - No awkward line breaks or detached words */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            Chung Tay Giải Cứu Nông Sản Việt
          </h2>

          {/* Subheading in clean sans-serif with proper Vietnamese fonts */}
          <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#ffea79] tracking-tight">
            Ngon Lành · Tử Tế · Tiết Kiệm
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-2xl leading-relaxed mt-1">
            Mỗi đơn hàng tại CapNong là một hành động thiết thực giúp giảm lãng phí thực phẩm, tăng
            thu nhập cho nông dân và mang lại bữa ăn chuẩn tươi cho gia đình bạn.
          </p>
        </div>

        {/* 3 Pillars Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* 1. Khách Hàng (Buyer) */}
          <div className="bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 hover:border-[#ffea79]/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div className="flex flex-col gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#ffea79] text-[#331c00] flex items-center justify-center font-bold shadow-md">
                <ShoppingBag size={24} />
              </div>
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-[#ffea79]">
                  01 · Người Tiêu Dùng
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Khách Hàng (Buyer)</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Tiết kiệm 40% – 60% chi phí rau củ quả tươi hái sớm mỗi ngày, nhận ngay voucher
                50.000đ cho đơn đầu tiên.
              </p>
            </div>

            <div className="pt-5 mt-3 border-t border-white/15">
              <a
                href="#/dang-ky?role=buyer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#ffea79] group-hover:text-white transition-colors"
              >
                <span>Đăng ký mua nông sản</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* 2. Nhà Vườn (Shop) */}
          <div className="bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 hover:border-[#a4e876]/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div className="flex flex-col gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#a4e876] text-[#0f2e03] flex items-center justify-center font-bold shadow-md">
                <Store size={24} />
              </div>
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-[#a4e876]">
                  02 · Nông Dân &amp; HTX
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Nhà Vườn (Shop)</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Tiêu thụ 100% nông sản xấu mã với giá công bằng, miễn phí sàn 0% tháng đầu, thu gom
                tận ruộng 24h.
              </p>
            </div>

            <div className="pt-5 mt-3 border-t border-white/15">
              <a
                href="#/dang-ky?role=shop"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#a4e876] group-hover:text-white transition-colors"
              >
                <span>Mở gian hàng nhà vườn</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* 3. Tài Xế (Shipper) */}
          <div className="bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 hover:border-[#ffba41]/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div className="flex flex-col gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#ffba41] text-[#3d2000] flex items-center justify-center font-bold shadow-md">
                <Truck size={24} />
              </div>
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-[#ffba41]">
                  03 · Vận Chuyển Xanh
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Tài Xế (Shipper)</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Thu nhập linh hoạt 8 – 15 triệu/tháng, thuật toán AI tối ưu tuyến đường chặng ngắn,
                nhận đơn giao tươi liền tay.
              </p>
            </div>

            <div className="pt-5 mt-3 border-t border-white/15">
              <a
                href="#/dang-ky?role=shipper"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#ffba41] group-hover:text-white transition-colors"
              >
                <span>Tham gia đội tài xế</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Email / Phone Subscription & Benefit Bar */}
        <div className="bg-black/45 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto w-full shadow-2xl">
          {submitted ? (
            <div
              role="status"
              className="flex items-center justify-center gap-3 text-center py-2 text-[#a4e876] animate-fadeIn"
            >
              <CheckCircle2 size={24} className="shrink-0" />
              <div className="text-sm sm:text-base font-bold text-white">
                Cảm ơn bạn! CapNong đã ghi nhận thông tin. Đây là bản trải nghiệm nên chưa gửi
                voucher thật.
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <div className="relative flex-1 w-full">
                <label htmlFor="newsletter-contact" className="sr-only">
                  Email hoặc số điện thoại
                </label>
                <Mail
                  size={18}
                  className="absolute left-4 top-[1.6rem] -translate-y-1/2 text-white/70"
                  aria-hidden
                />
                <input
                  id="newsletter-contact"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={contactInput}
                  onChange={(e) => {
                    setContactInput(e.target.value)
                    if (error) setError('')
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'newsletter-error' : undefined}
                  placeholder="Email hoặc số điện thoại"
                  className="w-full h-[3.2rem] pl-11 pr-4 rounded-2xl bg-white/15 border border-white/30 text-white placeholder-white/70 text-sm focus:outline-none focus:bg-white/25 focus:border-[#ffea79] transition-all aria-[invalid=true]:border-[#ffb4ab]"
                />
                {error && (
                  <p
                    id="newsletter-error"
                    role="alert"
                    className="mt-2 text-caption font-semibold text-[#ffd6d0]"
                  >
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto h-[3.2rem] px-7 rounded-2xl bg-[#ffba41] hover:bg-[#ffce77] text-[#2c2416] font-extrabold text-xs sm:text-sm uppercase tracking-wide transition-all shadow-lg hover:shadow-xl shrink-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Nhận Voucher 50K</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Micro trust badges */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between text-caption text-white/75 gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#a4e876]" />
              Cam kết bảo mật thông tin 100%
            </span>
            <span className="flex items-center gap-1.5">
              <Gift size={14} className="text-[#ffea79]" />
              Tặng Voucher 50.000đ đơn đầu tiên
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#a4e876]" />
              Giao rau củ tươi trong ngày
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
