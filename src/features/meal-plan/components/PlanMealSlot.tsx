import { useState } from 'react'
import {
  Sunrise,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  Circle,
  RefreshCw,
  Sparkles,
  ArrowLeftRight,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react'
import type { PlanMealResponse, MealType } from '@/services'
import {
  useToggleMealCompleted,
  useRegenerateMeal,
  useUpdateMealItemQuantity,
  useRemoveMealItem,
} from '../hooks/useMealPlanQueries'

interface PlanMealSlotProps {
  meal: PlanMealResponse
  planId: number
  isReadOnly?: boolean
  onOpenSwap?: (mealId: number, itemId: number) => void
  onOpenAdd?: (mealId: number) => void
}

const MEAL_CONFIG: Record<
  MealType,
  { label: string; icon: typeof Sun; bg: string; text: string; border: string }
> = {
  BREAKFAST: {
    label: 'Bữa Sáng',
    icon: Sunrise,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  LUNCH: {
    label: 'Bữa Trưa',
    icon: Sun,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  DINNER: {
    label: 'Bữa Tối',
    icon: Moon,
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  SNACK: {
    label: 'Bữa Phụ',
    icon: Coffee,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
}

export default function PlanMealSlot({
  meal,
  planId,
  isReadOnly = false,
  onOpenSwap,
  onOpenAdd,
}: PlanMealSlotProps) {
  const toggleCompleted = useToggleMealCompleted(planId)
  const regenerateMeal = useRegenerateMeal(planId)
  const updateQuantity = useUpdateMealItemQuantity(planId)
  const removeItem = useRemoveMealItem(planId)

  const [isRegenerating, setIsRegenerating] = useState(false)

  const config = MEAL_CONFIG[meal.mealType] || MEAL_CONFIG.LUNCH
  const Icon = config.icon

  const handleToggle = () => {
    if (isReadOnly) return
    toggleCompleted.mutate({ mealId: meal.id, completed: !meal.completed })
  }

  const handleRegenerate = async () => {
    if (isReadOnly || isRegenerating) return
    setIsRegenerating(true)
    try {
      await regenerateMeal.mutateAsync(meal.id)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border transition-all duration-200 ${
        meal.completed
          ? 'border-emerald-200/80 bg-emerald-50/20 shadow-2xs'
          : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs'
      }`}
    >
      {/* Header Slot */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bg} ${config.text}`}>
            <Icon size={16} />
          </div>
          <span className="text-sm font-semibold text-slate-800">{config.label}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút sinh lại bằng AI */}
          {!isReadOnly && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating || regenerateMeal.isPending}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition"
              title="Sinh lại món ăn khác phù hợp dị ứng/sở thích"
            >
              <RefreshCw
                size={13}
                className={isRegenerating || regenerateMeal.isPending ? 'animate-spin text-emerald-600' : ''}
              />
              <span className="hidden sm:inline">Đổi gợi ý AI</span>
            </button>
          )}

          {/* Checkbox hoàn thành */}
          <button
            onClick={handleToggle}
            disabled={toggleCompleted.isPending}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              meal.completed
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {meal.completed ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600 fill-emerald-600" />
                <span>Đã ăn</span>
              </>
            ) : (
              <>
                <Circle size={14} className="text-slate-400" />
                <span>Chưa ăn</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Danh sách Combos trong bữa */}
      <div className="flex-1 p-3 space-y-2.5">
        {meal.planMealItems && meal.planMealItems.length > 0 ? (
          meal.planMealItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                meal.completed
                  ? 'border-slate-100 bg-white/40 opacity-75 line-through'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200/60">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.comboName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <Sun size={20} />
                  </div>
                )}
              </div>

              {/* Combo Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-slate-800">
                    {item.comboName}
                  </span>
                  {item.isAiSuggested && !item.userOverride && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                      <Sparkles size={10} /> AI
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-700">
                    {(item.unitPriceSnapshot || 0).toLocaleString('vi-VN')}đ
                  </span>
                  {item.calories ? (
                    <span>{item.calories} kcal</span>
                  ) : null}
                </div>
              </div>

              {/* Thao tác: Số lượng, Đổi, Xóa */}
              {!isReadOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Stepper số lượng */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                    <button
                      type="button"
                      disabled={item.quantity <= 1 || updateQuantity.isPending}
                      onClick={() =>
                        updateQuantity.mutate({
                          mealId: meal.id,
                          itemId: item.id,
                          quantity: item.quantity - 1,
                        })
                      }
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-1.5 text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={updateQuantity.isPending}
                      onClick={() =>
                        updateQuantity.mutate({
                          mealId: meal.id,
                          itemId: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                      className="p-1 text-slate-500 hover:text-slate-800"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Nút Đổi món */}
                  {onOpenSwap && (
                    <button
                      type="button"
                      onClick={() => onOpenSwap(meal.id, item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Chọn combo khác cho bữa này"
                    >
                      <ArrowLeftRight size={14} />
                    </button>
                  )}

                  {/* Nút Xóa món */}
                  <button
                    type="button"
                    disabled={removeItem.isPending}
                    onClick={() => removeItem.mutate({ mealId: meal.id, itemId: item.id })}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Xóa combo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
            <span className="text-xs">Chưa có món ăn trong bữa này</span>
            {!isReadOnly && onOpenAdd && (
              <button
                type="button"
                onClick={() => onOpenAdd(meal.id)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <Plus size={13} /> Thêm món
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
