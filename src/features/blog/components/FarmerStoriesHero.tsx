import React from 'react'
import { Sprout } from 'lucide-react'
import farmerForumBanner from '@/assets/farmer-forum-banner.jpg'

export const FarmerStoriesHero: React.FC = () => {
  return (
    <div className="relative w-full h-56 sm:h-64 md:h-72 overflow-hidden flex items-center justify-center text-center shadow-md">
      <img
        src={farmerForumBanner}
        alt="Bà con nông dân thu hoạch nông sản tươi sạch"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />

      <div className="relative z-10 flex flex-col items-center gap-3 px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#ffea79] text-[11px] font-bold uppercase tracking-wider shadow-xs">
          <Sprout size={13} className="animate-bounce" />
          <span>Bản Tin &amp; Diễn Đàn Nông Nghiệp CapNong</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md leading-tight">
          Câu Chuyện Nông Dân
        </h1>

        <p className="text-xs sm:text-sm text-white/90 font-normal max-w-xl mx-auto leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-none">
          Nơi sẻ chia những phóng sự mùa vụ chân thật, nhật ký cứu trợ nông sản và
          nhịp cầu tri ấn giữa người tiêu dùng với những người nông dân Việt.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[11px] text-white/90 font-medium">
          <a href="/" className="hover:text-[#ffea79] transition-colors">
            Trang chủ
          </a>
          <span className="text-white/40">/</span>
          <span className="text-[#ffea79] font-bold">Chuyện Nông Dân</span>
        </div>
      </div>
    </div>
  )
}
