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
  Lock,
  AlertTriangle,
} from 'lucide-react'
import type { PlanMealResponse, MealType, PlanStatus } from '@/services'
import {
  useToggleMealCompleted,
  useRegenerateMeal,
  useUpdateMealItemQuantity,
  useRemoveMealItem,
} from '../hooks/useMealPlanQueries'
import { useUiStore } from '@/stores/useUiStore'

interface PlanMealSlotProps {
  meal: PlanMealResponse
  planId: number
  isReadOnly?: boolean
  planStatus?: PlanStatus
  onOpenSwap?: (mealId: number, itemId: number, mealType?: MealType) => void
  onOpenAdd?: (mealId: number, mealType?: MealType) => void
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
  planStatus,
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

  const isConfirmed = planStatus === 'CONFIRMED'

  const handleToggle = async () => {
    if (isReadOnly || planStatus === 'ARCHIVED') {
      useUiStore.getState().showToast('Thực đơn đã lưu trữ vào lịch sử, không thể chỉnh sửa trạng thái bữa ăn.')
      return
    }

    if (!isConfirmed) {
      useUiStore.getState().showToast(
        '⚠️ Thực đơn đang ở trạng thái Nháp. Vui lòng bấm "Xác nhận thực đơn" ở phía trên để bắt đầu theo dõi và đánh dấu các bữa ăn hàng ngày!'
      )
      return
    }

    try {
      await toggleCompleted.mutateAsync({ mealId: meal.id, completed: !meal.completed })
      useUiStore.getState().showToast(
        !meal.completed ? '✓ Đã đánh dấu bữa ăn: Đã ăn' : 'Đã chuyển bữa ăn sang: Chưa ăn'
      )
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái bữa ăn'
      useUiStore.getState().showToast(msg)
    }
  }

  const handleRegenerate = async () => {
    if (isReadOnly || isRegenerating || planStatus === 'ARCHIVED') {
      useUiStore.getState().showToast('Thực đơn đã lưu trữ, không thể đổi gợi ý AI.')
      return
    }
    setIsRegenerating(true)
    useUiStore.getState().showToast('AI đang phân tích và tìm combo phù hợp thay thế...')
    try {
      await regenerateMeal.mutateAsync(meal.id)
      useUiStore.getState().showToast('✓ Đã đổi món bằng gợi ý AI mới!')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi khi AI đổi món'
      useUiStore.getState().showToast(msg)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (isReadOnly || planStatus === 'ARCHIVED' || newQty < 1) return
    try {
      await updateQuantity.mutateAsync({
        mealId: meal.id,
        itemId,
        quantity: newQty,
      })
    } catch (err: any) {
      useUiStore.getState().showToast(err?.response?.data?.message || 'Không thể cập nhật số lượng')
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    if (isReadOnly || planStatus === 'ARCHIVED') return
    if (window.confirm('Bạn có chắc muốn xóa món này khỏi bữa ăn?')) {
      try {
        await removeItem.mutateAsync({ mealId: meal.id, itemId })
        useUiStore.getState().showToast('Đã xóa món khỏi bữa ăn.')
      } catch (err: any) {
        useUiStore.getState().showToast(err?.response?.data?.message || 'Có lỗi khi xóa món')
      }
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
          {!isReadOnly && planStatus !== 'ARCHIVED' && (
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

          {/* Nút Đã ăn / Chưa ăn / Chưa kích hoạt */}
          <button
            onClick={handleToggle}
            disabled={toggleCompleted.isPending}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              !isConfirmed
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                : meal.completed
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={
              !isConfirmed
                ? 'Thực đơn chưa xác nhận: Bấm để xem hướng dẫn kích hoạt'
                : meal.completed
                ? 'Bấm để chuyển về Chưa ăn'
                : 'Bấm để đánh dấu Đã ăn'
            }
          >
            {!isConfirmed ? (
              <>
                <Lock size={12} className="text-amber-600" />
                <span>Chưa kích hoạt</span>
              </>
            ) : meal.completed ? (
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
          meal.planMealItems.map((item) => {
            const isOutOfStock = item.inStock === false || (item.remainingStock !== undefined && item.remainingStock <= 0) || (item.combo?.remainingStock !== undefined && item.combo.remainingStock <= 0)
            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-2.5 transition ${
                  meal.completed
                    ? 'border-slate-100 bg-white/40 opacity-75 line-through'
                    : isOutOfStock
                    ? 'border-rose-300 bg-rose-50/50 shadow-xs'
                    : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200/60">
                    {(item.imageUrl || item.combo?.imageUrl) ? (
                      <img
                        src={item.imageUrl || item.combo?.imageUrl}
                        alt={item.comboName || item.combo?.comboName || 'Combo'}
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {item.comboName || item.combo?.comboName || 'Combo dinh dưỡng'}
                      </span>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          <AlertTriangle size={10} className="text-rose-600" /> Hết hàng tại vườn
                        </span>
                      ) : item.isAiSuggested && !item.userOverride ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                          <Sparkles size={10} /> AI
                        </span>
                      ) : null}
                    </div>

                    {/* Region Badge & Combo Type */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {(item.regionDisplayName || item.region || item.combo?.regionDisplayName || item.combo?.region) && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200/80 shadow-2xs">
                          {item.regionDisplayName || item.combo?.regionDisplayName || item.region || item.combo?.region}
                        </span>
                      )}
                      {(item.comboType || item.combo?.type) && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-200/80 shadow-2xs">
                          🏷️ {item.comboType || item.combo?.type}
                        </span>
                      )}
                    </div>

                    {/* AI Explainability Reason Tag & Farm Info */}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {item.aiReasonTag && (
                        <span
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60"
                          title={item.aiDescription || 'Lý do gợi ý từ AI'}
                        >
                          <span>{item.aiReasonTag}</span>
                        </span>
                      )}
                      {item.combo?.shopName && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          🏡 {item.combo.shopName}
                        </span>
                      )}
                    </div>

                    {/* Chef's Cooking Pairing Suggestion (Nguyên liệu kèm ngoài sàn) */}
                    {(item.cookingSuggestion || item.combo?.cookingSuggestion) && (
                      <div className="mt-1.5 rounded-lg bg-orange-50/80 border border-orange-200/70 px-2 py-1.5 text-[11px] text-slate-700 leading-relaxed">
                        <span className="font-bold text-orange-900">💡 Gợi ý nấu kèm: </span>
                        <span>{item.cookingSuggestion || item.combo?.cookingSuggestion}</span>
                      </div>
                    )}

                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-emerald-700">
                        {(item.unitPriceSnapshot || 0).toLocaleString('vi-VN')}đ
                      </span>
                      {(item.calories || 0) > 0 ? (
                        <span className="text-amber-600 font-medium">
                          🔥 {item.calories} kcal
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Thao tác: Đổi món khẩn cấp nếu hết hàng, Số lượng, Đổi, Xóa */}
                {!isReadOnly && planStatus !== 'ARCHIVED' && (
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {/* Nút hành động nhanh: Đổi sang món tương tự còn hàng nếu combo hết hàng */}
                    {isOutOfStock && onOpenSwap && (
                      <button
                        type="button"
                        onClick={() => onOpenSwap(meal.id, item.id, meal.mealType)}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                        title="Combo này đã hết hàng tại nhà vườn. Bấm để đổi sang combo tương tự còn hàng"
                      >
                        <ArrowLeftRight size={12} />
                        <span>Đổi món còn hàng</span>
                      </button>
                    )}

                    {/* Stepper số lượng */}
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                      <button
                        type="button"
                        disabled={item.quantity <= 1 || updateQuantity.isPending}
                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
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
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Nút Đổi món bình thường */}
                    {!isOutOfStock && onOpenSwap && (
                      <button
                        type="button"
                        onClick={() => onOpenSwap(meal.id, item.id, meal.mealType)}
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
                      onClick={() => handleRemoveItem(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Xóa combo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        ) : null}

        {/* Nút thêm combo khi bữa ăn đã có món hoặc chưa có món */}
        {!isReadOnly && planStatus !== 'ARCHIVED' && onOpenAdd && (
          meal.planMealItems && meal.planMealItems.length > 0 ? (
            <button
              type="button"
              onClick={() => onOpenAdd(meal.id, meal.mealType)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-300/80 bg-emerald-50/40 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100/70 hover:border-emerald-400 transition"
            >
              <Plus size={13} />
              <span>+ Thêm combo vào bữa này</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
              <span className="text-xs">Chưa có món ăn trong bữa này</span>
              <button
                type="button"
                onClick={() => onOpenAdd(meal.id, meal.mealType)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <Plus size={13} /> Thêm món
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
