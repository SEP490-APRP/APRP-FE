import { Link } from 'react-router-dom'
import {
  Truck,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import fullBannerImg from '@/assets/full-ecosystem-banner.jpg'

interface NewsletterProps {
  onInfo?: (title: string) => void
}

export default function Newsletter({ onInfo: _onInfo }: NewsletterProps) {
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

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            Chung Tay Giải Cứu Nông Sản Việt
          </h2>

          {/* Subheading */}
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
          {/* 1. Nông sản tươi sạch */}
          <div className="bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 hover:border-[#ffea79]/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div className="flex flex-col gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#ffea79] text-[#331c00] flex items-center justify-center font-bold shadow-md">
                <ShoppingBag size={24} />
              </div>
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-[#ffea79]">
                  01 · Nông Sản Tươi Lành
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Tiết Kiệm Mỗi Ngày</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Tiết kiệm 40% – 60% chi phí nông sản tươi hái sớm mỗi ngày trực tiếp từ nhà vườn,
                chung tay giảm thiểu lãng phí thực phẩm.
              </p>
            </div>

            <div className="pt-5 mt-3 border-t border-white/15">
              <Link
                to="/nong-san-tuoi"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#ffea79] group-hover:text-white transition-colors"
              >
                <span>Khám phá nông sản tươi</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 2. Minh Bạch & Bảo Chứng */}
          <div className="bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 hover:border-[#a4e876]/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div className="flex flex-col gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#a4e876] text-[#0f2e03] flex items-center justify-center font-bold shadow-md">
                <ShieldCheck size={24} />
              </div>
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-[#a4e876]">
                  02 · Nguồn Gốc Rõ Ràng
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Bảo Chứng Chất Lượng</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                100% nông sản có nhật ký canh tác từ nhà vườn thật, kiểm tra điểm độ tươi AI và chính
                sách hỗ trợ đổi trả an tâm tuyệt đối.
              </p>
            </div>

            <div className="pt-5 mt-3 border-t border-white/15">
              <Link
                to="/cau-chuyen-nong-dan"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#a4e876] group-hover:text-white transition-colors"
              >
                <span>Đọc nhật ký nhà vườn</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 3. Giao Tươi Thần Tốc */}
          <div className="bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 hover:border-[#ffba41]/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div className="flex flex-col gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#ffba41] text-[#3d2000] flex items-center justify-center font-bold shadow-md">
                <Truck size={24} />
              </div>
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-[#ffba41]">
                  03 · Giao Hàng Xanh
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Giao Nhanh 2–4 Giờ</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Giao hàng nhanh bằng thùng giấy tái chế giữ trọn độ ẩm và vị giòn ngọt của nông sản
                vừa thu hoạch sáng sớm.
              </p>
            </div>

            <div className="pt-5 mt-3 border-t border-white/15">
              <Link
                to="/nong-san-tuoi"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#ffba41] group-hover:text-white transition-colors"
              >
                <span>Đặt nông sản giao hôm nay</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
