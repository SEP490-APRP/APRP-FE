import React, { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react'
import { FARMER_STORIES_CATEGORIES } from '@/features/blog/constants'

interface FarmerStoriesOmniSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  isShopOrAdmin: boolean
  onOpenCreateModal: () => void
}

export const FarmerStoriesOmniSearch: React.FC<FarmerStoriesOmniSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isShopOrAdmin,
  onOpenCreateModal,
}) => {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentCategory =
    FARMER_STORIES_CATEGORIES.find((t) => t.id === selectedCategory) ||
    FARMER_STORIES_CATEGORIES[0]
  const CurrentCategoryIcon = currentCategory.icon

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        {/* Master Search Bar (Enterprise Standard Full Width) */}
        <div className="relative flex-1 w-full">
          <div className="flex items-center bg-white rounded-2xl border border-[#ded7c8] shadow-xs hover:border-[#2e5d16]/60 focus-within:border-[#2e5d16] focus-within:ring-4 focus-within:ring-[#2e5d16]/10 transition-all p-1.5 sm:p-2">
            {/* Integrated Category Dropdown Trigger */}
            <div className="relative shrink-0" ref={categoryMenuRef}>
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#f7f5ed] hover:bg-[#ede7d9] text-xs sm:text-sm font-bold text-[#2e5d16] transition-colors cursor-pointer border border-[#e8e2d4]"
              >
                <CurrentCategoryIcon size={16} className="text-[#2e5d16] shrink-0" />
                <span className="max-w-[140px] truncate">{currentCategory.label}</span>
                <ChevronDown
                  size={14}
                  className={`text-[#7f8878] transition-transform duration-200 ${
                    isCategoryMenuOpen ? 'rotate-180 text-[#2e5d16]' : ''
                  }`}
                />
              </button>

              {/* Popover Menu */}
              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl border border-[#e2dcd0] shadow-2xl p-1.5 z-40 animate-fadeIn">
                  <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#858f7e] border-b border-[#f0ebd9] mb-1">
                    Lọc theo chuyên mục bài viết
                  </div>
                  {FARMER_STORIES_CATEGORIES.map((tab) => {
                    const TabIcon = tab.icon
                    const isSelected = selectedCategory === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          onCategoryChange(tab.id)
                          setIsCategoryMenuOpen(false)
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#eaf3e5] text-[#2e5d16] font-bold'
                            : 'text-[#444d3d] hover:bg-[#f6f4ee] hover:text-[#1c2216]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <TabIcon
                            size={15}
                            className={isSelected ? 'text-[#2e5d16]' : 'text-[#7f8878]'}
                          />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {isSelected && <Check size={15} className="text-[#2e5d16] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-7 w-px bg-[#e4ded2] mx-2.5 hidden sm:block shrink-0" />

            {/* Search Text Input */}
            <div className="flex-1 flex items-center min-w-0 pr-2">
              <Search size={17} className="text-[#7f8878] ml-2 shrink-0 hidden sm:block" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, nhật ký canh tác, tên nông dân hoặc nhà vườn..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-[#191f14] placeholder:text-[#9ea698]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1.5 text-[#9ea698] hover:text-[#191f14] transition-colors shrink-0 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Search Action Button */}
            <div className="shrink-0 hidden sm:block">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-[#2e5d16] hover:bg-[#254d12] text-white text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search size={14} />
                <span>Tìm kiếm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create Blog Button for Farmer / Admin */}
        {isShopOrAdmin && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-3 rounded-2xl bg-[#2e5d16] hover:bg-[#254d12] text-white font-extrabold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Viết bài mới</span>
          </button>
        )}
      </div>

      {/* Active Filter Summary Bar */}
      {(searchQuery || selectedCategory !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#555d4e] pt-1">
          <span className="font-medium text-[#717a6c]">Đang lọc:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf3e5] text-[#244e18] font-bold border border-[#cbe1be]">
              <span>
                {FARMER_STORIES_CATEGORIES.find((t) => t.id === selectedCategory)?.label}
              </span>
              <button
                type="button"
                onClick={() => onCategoryChange('all')}
                className="hover:text-red-600 transition-colors cursor-pointer"
                title="Xóa danh mục này"
              >
                <X size={13} />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4eee4] text-[#3e4537] font-bold border border-[#ded7c8]">
              <span>Từ khóa: "{searchQuery}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-red-600 transition-colors cursor-pointer"
                title="Xóa từ khóa"
              >
                <X size={13} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              onCategoryChange('all')
              onSearchChange('')
            }}
            className="text-[11px] text-[#848c7e] hover:text-[#c82626] underline ml-1 cursor-pointer font-medium"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}
