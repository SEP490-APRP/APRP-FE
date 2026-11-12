import React, { useState } from 'react'
import { Flame, ShoppingCart, Check, Zap } from 'lucide-react'
import type { FlashRescueDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface FlashRescueCardProps {
  rescue: FlashRescueDto
}

export const FlashRescueCard: React.FC<FlashRescueCardProps> = ({ rescue }) => {
  const addMultipleToCart = useChatbotStore((s) => s.addMultipleToCart)
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [addedAllSuccess, setAddedAllSuccess] = useState(false)

  const formatPrice = (val?: number) => {
    if (!val) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
  }

  const handleAddAll = async () => {
    if (!rescue.items || rescue.items.length === 0) return
    setIsAddingAll(true)
    const addedCount = await addMultipleToCart(rescue.items)
    setIsAddingAll(false)
    if (addedCount === 0) return
    setAddedAllSuccess(true)
    setTimeout(() => setAddedAllSuccess(false), 3000)
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-rose-50 via-red-50/70 to-amber-50/80 border border-rose-200 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-2xs animate-pulse">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-soil-900">{rescue.title}</h4>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center gap-0.5 shadow-2xs">
          <Zap className="w-3 h-3" />
          Giảm đến {rescue.discountRate}%
        </div>
      </div>

      <p className="text-xs text-soil-600 leading-relaxed">{rescue.description}</p>

      {/* Items List */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
        {rescue.items.map((item) => (
          <div
            key={`${item.itemType}-${item.itemId}`}
            className="flex items-center justify-between p-2 rounded-lg bg-white/95 border border-rose-100 text-xs shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-9 h-9 rounded-md object-cover border border-sand-200 flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-md bg-rose-100 flex items-center justify-center text-rose-700 text-xs font-bold flex-shrink-0">
                  {item.name.substring(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-soil-800 truncate text-[11px]">
                  {item.name}
                </p>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="font-bold text-rose-700">
                    {formatPrice(item.salePrice || item.price)}
                  </span>
                  {item.price && item.salePrice && item.salePrice < item.price && (
                    <span className="line-through text-soil-400 text-[9px]">
                      {formatPrice(item.price)}
                    </span>
                  )}
                  {item.unit && <span className="text-soil-500">/{item.unit}</span>}
                </div>
              </div>
            </div>

            <button
              onClick={() => selectOption(item, 1)}
              disabled={isLoading}
              className="px-2 py-1 text-[10px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              <ShoppingCart className="w-3 h-3" />
              Cứu
            </button>
          </div>
        ))}
      </div>

      {/* Add All */}
      {rescue.items && rescue.items.length > 1 && (
        <button
          onClick={handleAddAll}
          disabled={isLoading || isAddingAll}
          className="w-full py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {addedAllSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              Đã gom toàn bộ giỏ giải cứu!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {isAddingAll
                ? 'Đang thêm...'
                : `Giải cứu cả ${rescue.items.length} món này`}
            </>
          )}
        </button>
      )}
    </div>
  )
}
