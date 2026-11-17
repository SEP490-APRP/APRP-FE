import React from 'react'
import { Star, Clock } from 'lucide-react'
import type { FilterType } from '../review.constants'

interface ReviewStatsHeroProps {
  avgRating: number
  totalReviews: number
  fiveStars: number
  fourStars: number
  threeStars: number
  twoStars: number
  oneStars: number
  positivePercent: number
  unrepliedCount: number
  selectedFilter: FilterType
  onSelectFilter: (filter: FilterType) => void
}

export function ReviewStatsHero({
  avgRating,
  totalReviews,
  fiveStars,
  fourStars,
  threeStars,
  twoStars,
  oneStars,
  positivePercent,
  unrepliedCount,
  selectedFilter,
  onSelectFilter,
}: ReviewStatsHeroProps) {
  const getPercent = (count: number) =>
    totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0

  return (
    <div
      id="tour-reviews-stats"
      className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-white rounded-xl p-3.5 border border-[#e2e8dc] shadow-2xs"
    >
      {/* Khối Điểm số trung bình (4 Cột) */}
      <div className="lg:col-span-4 flex flex-col justify-between p-3.5 bg-[#fbfdfa] rounded-lg border border-[#e8ece3]">
        <div>
          <span className="text-[10px] font-bold text-[#7e8779] uppercase tracking-wider">
            Điểm Đánh Giá Gian Hàng
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-[#1c2216] tracking-tight">
              {avgRating > 0 ? avgRating.toFixed(1) : '5.0'}
            </span>
            <span className="text-xs font-bold text-[#8a9484]">/ 5.0</span>
          </div>

          {/* 5 Ngôi sao vàng */}
          <div className="flex items-center gap-0.5 text-amber-400 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.round(avgRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-neutral-200 fill-neutral-100'
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#edf2e8] flex items-center justify-between text-[11px]">
          <span className="text-[#525d4c]">
            Tổng <strong className="font-bold text-[#1c2216]">{totalReviews}</strong> đánh giá
          </span>
          <span className="font-bold text-[#326318]">
            {positivePercent}% Hài lòng
          </span>
        </div>
      </div>

      {/* Khối Phân bổ sao (5 Cột) */}
      <div className="lg:col-span-5 p-3.5 bg-[#fbfdfa] rounded-lg border border-[#e8ece3] flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#7e8779] uppercase tracking-wider">
            Phân Bổ Xếp Hạng Sao
          </span>
          <div className="mt-1.5 space-y-1">
            {[
              { star: 5, count: fiveStars, color: 'bg-emerald-500' },
              { star: 4, count: fourStars, color: 'bg-emerald-400' },
              { star: 3, count: threeStars, color: 'bg-amber-400' },
              { star: 2, count: twoStars, color: 'bg-orange-400' },
              { star: 1, count: oneStars, color: 'bg-rose-500' },
            ].map((item) => {
              const percent = getPercent(item.count)
              const isSelected = selectedFilter === item.star

              return (
                <button
                  key={item.star}
                  type="button"
                  onClick={() =>
                    onSelectFilter(selectedFilter === item.star ? 'ALL' : item.star)
                  }
                  className={`w-full flex items-center gap-2 text-[11px] py-0.5 px-1 rounded transition-all cursor-pointer hover:bg-neutral-100 ${
                    isSelected ? 'bg-neutral-200/70 font-bold' : ''
                  }`}
                >
                  <span className="w-6 text-left font-bold text-[#444d3f] flex items-center">
                    {item.star}★
                  </span>
                  <div className="flex-1 h-1.5 bg-neutral-200/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-[10px] text-[#7e8779]">
                    {percent}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Khối Tác vụ (3 Cột) */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-2">
        {/* Đánh giá 5 sao */}
        <div className="p-2.5 bg-[#fbfdfa] rounded-lg border border-[#e8ece3] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#7e8779] uppercase tracking-wider">
              Đánh Giá 5 Sao
            </span>
            <div className="text-base font-black text-emerald-700 mt-0.5">
              {fiveStars} <span className="text-[11px] font-semibold text-[#8a9484]">lượt</span>
            </div>
          </div>
          <div className="size-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            ★
          </div>
        </div>

        {/* Chưa phản hồi */}
        <div
          onClick={() => onSelectFilter('UNREPLIED')}
          className="p-2.5 bg-[#fbfdfa] rounded-lg border border-[#e8ece3] flex items-center justify-between cursor-pointer hover:border-rose-300 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-[#7e8779] uppercase tracking-wider">
              Chưa Phản Hồi
            </span>
            <div className="text-base font-black text-rose-600 mt-0.5">
              {unrepliedCount}{' '}
              <span className="text-[11px] font-semibold text-[#8a9484]">đánh giá</span>
            </div>
          </div>
          <div className="size-7 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center">
            <Clock size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}
