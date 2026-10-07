import React from 'react'
import type { FarmerReview } from './types'

interface ReviewsProps {
  reviews: FarmerReview[]
}

export default function Reviews({ reviews }: ReviewsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">
            Đánh Giá &amp; Phản Hồi Từ Khách Hàng
          </h3>
          <p className="text-xs text-[#7e8779]">
            Nhận xét thực tế từ người tiêu dùng sau khi nhận nông sản
          </p>
        </div>
        <div id="tour-reviews-stats" className="text-right">
          <div className="text-2xl font-black text-[#e5a00d]">4.9 ⭐</div>
          <span className="text-[11px] text-[#788172]">248 lượt đánh giá</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((rev, idx) => (
          <div
            key={rev.id}
            id={idx === 0 ? 'tour-reviews-first-card' : undefined}
            className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <strong className="text-xs text-[#1c2216]">{rev.user}</strong>
                <span className="text-xs text-[#e5a00d]">★★★★★</span>
              </div>
              <span className="text-[11px] text-[#8a9484]">{rev.date}</span>
            </div>
            <div className="text-xs text-[#326318] font-bold">Sản phẩm: {rev.product}</div>
            <p className="text-xs text-[#4c5545] leading-relaxed italic">"{rev.comment}"</p>
          </div>
        ))}
      </div>
    </div>
  )
}
