import React from 'react'
import { Search, X, ArrowUpDown, Image as ImageIcon } from 'lucide-react'
import type { FilterType, SortType } from '../review.constants'

interface ReviewFilterToolbarProps {
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  sortBy: SortType
  onSortChange: (sort: SortType) => void
  selectedFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  totalReviews: number
  unrepliedCount: number
}

export function ReviewFilterToolbar({
  searchKeyword,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedFilter,
  onFilterChange,
  totalReviews,
  unrepliedCount,
}: ReviewFilterToolbarProps) {
  return (
    <div className="bg-white rounded-xl p-3 border border-[#e8ece3] shadow-2xs space-y-2">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Input Search */}
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7e8779]"
          />
          <input
            type="text"
            placeholder="Tìm theo tên khách, sản phẩm, mã đơn..."
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[#f9faf7] border border-[#e2e8dc] rounded-lg text-xs text-[#1c2216] placeholder:text-[#8a9484] focus:outline-none focus:bg-white focus:border-[#326318] transition-all"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Sắp xếp */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-[#7e8779] flex items-center gap-1">
            <ArrowUpDown size={11} />
            Sắp xếp:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortType)}
            className="text-xs font-semibold text-[#1c2216] bg-[#f9faf7] border border-[#e2e8dc] rounded-lg px-2 py-1 focus:outline-none focus:border-[#326318] cursor-pointer"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="RATING_DESC">Sao cao nhất</option>
            <option value="RATING_ASC">Sao thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-[#f4f7f0]">
        <span className="text-[11px] font-bold text-[#7e8779] mr-1">Lọc:</span>

        {[
          { key: 'ALL' as const, label: `Tất cả (${totalReviews})` },
          {
            key: 'UNREPLIED' as const,
            label: `Chưa phản hồi (${unrepliedCount})`,
          },
          {
            key: 'HAS_IMAGE' as const,
            label: 'Có ảnh',
            icon: <ImageIcon size={11} />,
          },
          { key: 5, label: '5★' },
          { key: 4, label: '4★' },
          { key: 3, label: '3★' },
          { key: 2, label: '2★' },
          { key: 1, label: '1★' },
        ].map((tab) => {
          const isActive = selectedFilter === tab.key
          return (
            <button
              key={String(tab.key)}
              type="button"
              onClick={() => onFilterChange(tab.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#326318] text-white shadow-2xs'
                  : 'bg-[#f7f9f5] text-[#4b5444] border border-[#e8ece3] hover:bg-neutral-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          )
        })}

        {selectedFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => onFilterChange('ALL')}
            className="text-[11px] text-[#7e8779] hover:text-[#326318] underline ml-auto font-medium cursor-pointer"
          >
            Đặt lại
          </button>
        )}
      </div>
    </div>
  )
}
