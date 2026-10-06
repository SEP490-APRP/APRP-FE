import { PlayCircle, ShoppingBasket } from 'lucide-react'
import heroFarmerImg from '@/assets/hero-farmer.jpg'

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative w-full overflow-hidden bg-surface-container-low min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] xl:min-h-[680px] flex items-center"
    >
      {/* Hero Image Background with Ambient Dark-to-Warm Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Hai cô chú nông dân Việt Nam tươi cười rạng rỡ với nông sản tươi ngon thu hoạch từ vườn"
          className="w-full h-full object-cover object-[center_top] lg:object-right-top"
          src={heroFarmerImg}
          fetchPriority="high"
          decoding="async"
        />
        {/* Responsive gradient overlay: full dark scrim on mobile, smooth right-fade on tablet/desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/95 via-on-surface/80 to-on-surface/50 lg:hidden" />
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-on-surface/95 via-on-surface/75 to-transparent w-[62%] xl:w-[55%]" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl flex flex-col gap-4 sm:gap-6 text-surface-bright">
          {/* Live AI Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-surface-bright/20 backdrop-blur-md w-fit border border-white/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse shrink-0" />
            <span className="text-caption text-tertiary-fixed font-bold tracking-wide uppercase">
              AI Dinh Dưỡng Kiểm Định 100%
            </span>
          </div>

          {/* Headline */}
          <h1
            id="hero-title"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl text-surface-bright font-extrabold tracking-tight leading-[1.18] sm:leading-[1.15]"
          >
            Nông sản xấu mã – <br />
            <span className="text-tertiary-fixed-dim inline-block">Ngon thật, rẻ thật.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base lg:text-lg text-surface-container-high leading-relaxed max-w-xl">
            Cứu rau củ lỡ "mất dáng" khỏi bãi rác, bảo vệ túi tiền của bạn và giúp nông dân Việt Nam
            bán được trọn vẹn mùa vụ. Tươi ngon, an lành và giao thần tốc mỗi ngày.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
            <a
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-primary-container hover:bg-primary text-white font-bold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary-container/30 min-h-[46px]"
              href="#/giai-cuu-hom-nay"
            >
              <ShoppingBasket size={20} aria-hidden />
              <span>Mua ngay hôm nay</span>
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-surface-bright border border-white/25 backdrop-blur-md font-bold text-sm sm:text-base transition-all min-h-[46px]"
              href="#/cong-nghe-ai"
            >
              <PlayCircle size={20} aria-hidden />
              <span>Xem cách hoạt động</span>
            </a>
          </div>

          {/* Trust Stats Banner */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-5 mt-2 sm:mt-4 border-t border-white/20">
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl lg:text-3xl text-tertiary-fixed-dim font-extrabold tracking-tight">
                12.000+
              </span>
              <span className="text-caption sm:text-sm text-surface-container-highest mt-0.5">
                Đơn giải cứu
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl lg:text-3xl text-primary-fixed font-extrabold tracking-tight">
                500+
              </span>
              <span className="text-caption sm:text-sm text-surface-container-highest mt-0.5">
                Nông dân liên kết
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl lg:text-3xl text-surface-bright font-extrabold tracking-tight">
                30 Tấn
              </span>
              <span className="text-caption sm:text-sm text-surface-container-highest mt-0.5">
                Tránh lãng phí
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
