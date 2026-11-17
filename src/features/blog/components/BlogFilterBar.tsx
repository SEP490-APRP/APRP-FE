import React, { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { BLOG_CATEGORY_OPTIONS, type BlogCategoryOption } from '../constants'

interface BlogFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  options?: BlogCategoryOption[]
}

export const BlogFilterBar: React.FC<BlogFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  options = BLOG_CATEGORY_OPTIONS,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentOption =
    options.find((c) => c.value === selectedCategory) || options[0]
  const CurrentIcon = currentOption.icon

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#e8ece3] shadow-xs flex flex-col sm:flex-row items-center gap-3">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 w-full">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9485]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tiêu đề bài viết, nội dung..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dfe4db] text-xs focus:border-[#326318] outline-none"
        />
      </div>

      {/* Dropdown danh mục */}
      <div className="relative w-full sm:w-64 shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[#dfe4db] hover:border-[#326318] bg-white text-xs font-bold text-[#353c2e] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2 truncate">
            <CurrentIcon size={15} className="text-[#326318] shrink-0" />
            <span className="truncate">{currentOption.label}</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-[#717a6c] transition-transform duration-200 shrink-0 ${
              isDropdownOpen ? 'rotate-180 text-[#326318]' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-full bg-white rounded-2xl border border-[#e5e9e0] shadow-xl p-1.5 z-30 animate-fadeIn">
            {options.map((opt) => {
              const Icon = opt.icon
              const isSelected = selectedCategory === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onCategoryChange(opt.value)
                    setIsDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#eaf3e5] text-[#2e5d16] font-bold'
                      : 'text-[#444d3d] hover:bg-[#f6f4ee] hover:text-[#1c2216]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon
                      size={15}
                      className={isSelected ? 'text-[#2e5d16]' : 'text-[#717a6c]'}
                    />
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-[#2e5d16] shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
