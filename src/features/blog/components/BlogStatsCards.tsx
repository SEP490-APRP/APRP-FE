import React from 'react'
import { Eye, Heart, MessageCircle } from 'lucide-react'

interface BlogStatsCardsProps {
  totalBlogs: number
  totalViews: number
  totalLikes: number
  totalComments: number
}

export const BlogStatsCards: React.FC<BlogStatsCardsProps> = ({
  totalBlogs,
  totalViews,
  totalLikes,
  totalComments,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
        <span className="text-[11px] font-bold text-[#717a6c] uppercase">Tổng bài viết</span>
        <span className="text-2xl font-black text-[#1c2216]">{totalBlogs}</span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
        <span className="text-[11px] font-bold text-[#717a6c] uppercase">Lượt đọc tích lũy</span>
        <span className="text-2xl font-black text-[#2e5d16] flex items-center gap-1.5">
          <Eye size={20} />
          <span>{totalViews.toLocaleString('vi-VN')}</span>
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
        <span className="text-[11px] font-bold text-[#717a6c] uppercase">Lượt cảm kích</span>
        <span className="text-2xl font-black text-[#c82626] flex items-center gap-1.5">
          <Heart size={20} className="fill-[#c82626]" />
          <span>{totalLikes.toLocaleString('vi-VN')}</span>
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col gap-1">
        <span className="text-[11px] font-bold text-[#717a6c] uppercase">Bình luận từ khách</span>
        <span className="text-2xl font-black text-[#2e5d16] flex items-center gap-1.5">
          <MessageCircle size={20} />
          <span>{totalComments.toLocaleString('vi-VN')}</span>
        </span>
      </div>
    </div>
  )
}
