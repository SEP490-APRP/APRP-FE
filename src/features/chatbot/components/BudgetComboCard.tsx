import React, { useState } from 'react'
import { Wallet, ShoppingCart, Eye, Plus, ArrowRight, Sparkles, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { BudgetComboDto, AiItemOption } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface BudgetComboCardProps {
  combo: BudgetComboDto
}

export const BudgetComboCard: React.FC<BudgetComboCardProps> = ({ combo }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const addMultipleToCart = useChatbotStore((s) => s.addMultipleToCart)
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const [isAddingAll, setIsAddingAll] = useState(false)

  const isComboList =
    combo.items &&
    combo.items.some((it) => it.itemType === 'COMBO' || it.itemType === 'BUILD_COMBO')

  const formatPrice = (val?: number) => {
    if (!val) return '0\u00A0đ'
    return new Intl.NumberFormat('vi-VN').format(val) + '\u00A0đ'
  }

  const handleViewDetail = (e: React.MouseEvent, item: AiItemOption) => {
    e.stopPropagation()
    toggleOpen()
    if (item.itemType === 'COMBO' || item.itemType === 'BUILD_COMBO' || item.itemType === 'MYSTERY_BOX') {
      navigate('/combo-tui-mu')
    } else {
      navigate(`/san-pham/${item.itemId}`)
    }
  }

  const handleAddAll = async () => {
    if (!combo.items || combo.items.length === 0) return
    setIsAddingAll(true)
    await addMultipleToCart(combo.items)
    setIsAddingAll(false)
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200/90 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#326318] text-white shadow-2xs">
            {isComboList ? <Layers className="w-4 h-4 text-[#ffea79]" /> : <Wallet className="w-4 h-4 text-[#ffea79]" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1c2216] leading-tight">{combo.title}</h4>
            <span className="text-[10px] text-emerald-800 font-semibold">
              Ngân sách: {formatPrice(combo.targetBudget)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-[#326318]">
            {isComboList ? 'Đóng gói sẵn' : formatPrice(combo.actualTotal)}
          </span>
        </div>
      </div>

      <p className="text-xs text-[#5f6b57] leading-relaxed">{combo.description}</p>

      {/* Item List: Hỗ trợ cả danh sách Combo đóng gói sẵn hoặc Mâm rau củ */}
      <div className="space-y-2">
        {combo.items.map((item) => {
          const isItemCombo = item.itemType === 'COMBO' || item.itemType === 'BUILD_COMBO'

          return (
            <div
              key={`${item.itemType}-${item.itemId}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/95 border border-emerald-100/80 hover:border-emerald-300 transition-all text-xs shadow-2xs gap-2"
            >
              {/* Ảnh & Thông tin */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-emerald-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-base">
                      {isItemCombo ? '🍱' : '🥬'}
                    </div>
                  )}
                  {isItemCombo && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#326318] text-white text-[8px] font-bold px-1 py-0.2 rounded-full shadow-2xs">
                      COMBO
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h5
                    className="font-bold text-[#1c2216] truncate text-xs leading-snug hover:text-[#326318] cursor-pointer"
                    onClick={(e) => handleViewDetail(e, item)}
                    title={item.name}
                  >
                    {item.name}
                  </h5>
                  {item.description && (
                    <p className="text-[10px] text-[#5f6b57] truncate mt-0.5" title={item.description}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-emerald-800 text-xs">
                      {formatPrice(item.salePrice || item.price)}
                    </span>
                    {item.unit && (
                      <span className="text-[10px] text-[#71717a]">/{item.unit}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút thao tác: Chọn & Chi tiết */}
              <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => selectOption(item, 1)}
                  className="py-1 px-2.5 rounded-lg bg-[#326318] hover:bg-[#254b12] text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  title="Chọn combo / sản phẩm này vào giỏ hàng"
                >
                  <Plus className="w-3 h-3" />
                  <span>Chọn</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleViewDetail(e, item)}
                  className="text-[10px] text-[#326318] hover:text-[#1e3b0e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer py-0.5 whitespace-nowrap"
                  title="Xem chi tiết sản phẩm / combo"
                >
                  <Eye className="w-3 h-3" />
                  <span>Chi tiết</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Action */}
      {isComboList ? (
        <button
          type="button"
          onClick={() => {
            toggleOpen()
            navigate('/combo-tui-mu')
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 active:scale-[0.98] text-[#326318] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#326318]" />
          <span>Khám phá thêm kho Combo & Túi mù</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAddAll}
          disabled={isLoading || isAddingAll}
          className="w-full py-2.5 px-3 rounded-xl bg-[#326318] hover:bg-[#254b12] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
        >
          <ShoppingCart className="w-4 h-4 text-[#ffea79]" />
          <span>
            {isAddingAll
              ? 'Đang thêm toàn bộ vào giỏ...'
              : `Thêm toàn bộ combo (${formatPrice(combo.actualTotal)})`}
          </span>
        </button>
      )}
    </div>
  )
}

export default BudgetComboCard
