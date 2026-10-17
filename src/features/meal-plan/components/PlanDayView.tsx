import { useState, useMemo } from 'react'
import { Calendar, CheckCircle2 } from 'lucide-react'
import type { BuildPlanResponse } from '@/services'
import PlanMealSlot from './PlanMealSlot'
import NutritionalSummaryBar from './NutritionalSummaryBar'

interface PlanDayViewProps {
  plan: BuildPlanResponse
  onOpenSwap?: (mealId: number, itemId: number) => void
  onOpenAdd?: (mealId: number) => void
}

export default function PlanDayView({ plan, onOpenSwap, onOpenAdd }: PlanDayViewProps) {
  const [activeDayIndex, setActiveDayIndex] = useState<number>(1)

  const activeDay = useMemo(() => {
    return plan.planDays?.find((d) => d.dayIndex === activeDayIndex) || plan.planDays?.[0]
  }, [plan.planDays, activeDayIndex])

  // Tính macro cho ngày đang chọn
  const dayNutrition = useMemo(() => {
    let cal = 0
    let pro = 0
    let carb = 0
    let fat = 0

    if (activeDay?.planMeals) {
      for (const meal of activeDay.planMeals) {
        if (meal.planMealItems) {
          for (const item of meal.planMealItems) {
            const qty = item.quantity || 1
            cal += (item.calories || 0) * qty
            pro += (item.protein || 0) * qty
            carb += (item.carbs || 0) * qty
            fat += (item.fat || 0) * qty
          }
        }
      }
    }

    return { cal, pro, carb, fat }
  }, [activeDay])

  const isReadOnly = plan.status === 'ARCHIVED'

  return (
    <div className="space-y-6">
      {/* Thanh chọn ngày (Day Selector Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {plan.planDays?.map((day) => {
          const isSelected = day.dayIndex === (activeDay?.dayIndex || 1)
          const isAllCompleted =
            day.planMeals &&
            day.planMeals.length > 0 &&
            day.planMeals.every((m) => m.completed)

          return (
            <button
              key={day.id || day.dayIndex}
              onClick={() => setActiveDayIndex(day.dayIndex)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-[1.02]'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              <Calendar size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
              <span>Ngày {day.dayIndex}</span>
              {isAllCompleted && (
                <CheckCircle2
                  size={14}
                  className={isSelected ? 'text-emerald-200 fill-emerald-200' : 'text-emerald-600'}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tóm tắt dinh dưỡng ngày đang chọn */}
      <NutritionalSummaryBar
        calories={dayNutrition.cal}
        protein={dayNutrition.pro}
        carbs={dayNutrition.carb}
        fat={dayNutrition.fat}
        label={`Dinh dưỡng Ngày ${activeDay?.dayIndex || 1}`}
      />

      {/* Danh sách các bữa ăn trong ngày */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {activeDay?.planMeals && activeDay.planMeals.length > 0 ? (
          activeDay.planMeals.map((meal) => (
            <PlanMealSlot
              key={meal.id}
              meal={meal}
              planId={plan.planId}
              isReadOnly={isReadOnly}
              onOpenSwap={onOpenSwap}
              onOpenAdd={onOpenAdd}
            />
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            Chưa có bữa ăn nào được lên lịch cho ngày này.
          </div>
        )}
      </div>
    </div>
  )
}
