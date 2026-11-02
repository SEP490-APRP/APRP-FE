import React from 'react'
import { ChefHat, Clock, Plus, Sparkles } from 'lucide-react'
import type { RecipeSuggestionDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface RecipeCardProps {
  recipe: RecipeSuggestionDto
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)

  const formatPrice = (val?: number) => {
    if (!val) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/90 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500 text-white">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-soil-900">{recipe.dishName}</h4>
            <div className="text-[10px] text-orange-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Thời gian nấu: {recipe.cookTime || '15-20 phút'}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-soil-700 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-orange-100">
        {recipe.description}
      </p>

      {/* Missing ingredients to buy */}
      {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-orange-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-500" />
            <span>Nông sản tươi sạch có sẵn trên sàn để nấu kèm:</span>
          </div>
          <div className="space-y-1.5">
            {recipe.missingIngredients.map((item) => (
              <div
                key={`${item.itemType}-${item.itemId}`}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-orange-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-7 h-7 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="text-sm">🍄</span>
                  )}
                  <span className="font-medium text-soil-800 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-orange-700">
                    {formatPrice(item.salePrice || item.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectOption(item, 1)}
                    disabled={isLoading}
                    className="flex items-center gap-0.5 px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Lấy thêm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
