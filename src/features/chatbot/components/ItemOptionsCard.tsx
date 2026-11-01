import React from 'react'
import { Plus, Sparkles, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AiItemOption } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface ItemOptionsCardProps {
  items: AiItemOption[]
}

export const ItemOptionsCard: React.FC<ItemOptionsCardProps> = ({ items }) => {
  const navigate = useNavigate()
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)

  if (!items || items.length === 0) return null

  const formatPrice = (val?: number) => {
    if (!val) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
  }

  const handleViewDetail = (e: React.MouseEvent, item: AiItemOption) => {
    e.stopPropagation()
    if (item.itemType === 'MYSTERY_BOX' || item.itemType === 'BUILD_COMBO') {
      navigate('/combo-tui-mu')
    } else {
      navigate(`/san-pham/${item.itemId}`)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-bold text-[#326318] flex items-center gap-1.5 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-[#ffba41]" />
        <span>Nông sản tươi đề xuất cho bạn:</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => {
          const hasDiscount =
            item.salePrice && item.price && item.salePrice < item.price
          const isMystery = item.itemType === 'MYSTERY_BOX'
          const isCombo = item.itemType === 'BUILD_COMBO' || item.itemType === 'COMBO'

          return (
            <div
              key={`${item.itemType}-${item.itemId}`}
              onClick={(e) => handleViewDetail(e, item)}
              className="group flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#e2e6dc] hover:border-[#326318] hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f4f7f1] flex-shrink-0 border border-[#e5e2da]">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    {isMystery ? '🎁' : isCombo ? '🍱' : '🥬'}
                  </div>
                )}
                {isMystery && (
                  <span className="absolute top-0 right-0 bg-[#8a4e1d] text-white text-[9px] font-bold px-1 rounded-bl">
                    BOX
                  </span>
                )}
                {isCombo && (
                  <span className="absolute top-0 right-0 bg-[#2f5c1b] text-white text-[9px] font-bold px-1 rounded-bl">
                    COMBO
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <h4
                  className="text-xs sm:text-sm font-semibold text-[#1c2216] line-clamp-2 group-hover:text-[#326318] transition-colors leading-snug"
                  title={item.name}
                >
                  {item.name}
                </h4>
                <div className="flex items-baseline gap-1 mt-1 whitespace-nowrap overflow-hidden">
                  <span className="text-xs sm:text-sm font-bold text-[#d32f2f] whitespace-nowrap">
                    {formatPrice(item.salePrice || item.price)}
                  </span>
                  {item.unit && (
                    <span className="text-[11px] text-[#5f6b57] whitespace-nowrap">
                      /{item.unit}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-[10px] text-[#6b7563] line-through ml-1 whitespace-nowrap">
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>

                {item.availableQuantity !== undefined && (
                  <span className="text-[10px] text-[#5f6b57] block mt-0.5">
                    Còn {item.availableQuantity} {item.unit || 'phần'}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    selectOption(item, 1)
                  }}
                  className="py-1 px-3 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  title="Chọn mua sản phẩm này"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Chọn</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleViewDetail(e, item)}
                  className="text-[10px] text-[#326318] hover:text-[#1e3b0e] hover:underline font-medium flex items-center gap-0.5 cursor-pointer py-0.5 whitespace-nowrap"
                  title="Xem chi tiết sản phẩm"
                >
                  <Eye className="w-3 h-3" />
                  <span>Chi tiết</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ItemOptionsCard
