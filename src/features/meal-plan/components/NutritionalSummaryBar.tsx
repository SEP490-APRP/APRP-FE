import { Flame, Beef, Wheat, Droplets } from 'lucide-react'

interface NutritionalSummaryBarProps {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  label?: string
}

export default function NutritionalSummaryBar({
  calories = 0,
  protein = 0,
  carbs = 0,
  fat = 0,
  label = 'Chỉ số dinh dưỡng ước tính',
}: NutritionalSummaryBarProps) {
  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
          {label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
          <Flame size={13} className="text-amber-500 fill-amber-500" />
          {calories.toLocaleString('vi-VN')} kcal
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Protein */}
        <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-slate-100 shadow-2xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <Beef size={16} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Đạm (Protein)</div>
            <div className="text-sm font-bold text-slate-800">{protein.toFixed(1)}g</div>
          </div>
        </div>

        {/* Carbs */}
        <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-slate-100 shadow-2xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Wheat size={16} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Đường bột (Carbs)</div>
            <div className="text-sm font-bold text-slate-800">{carbs.toFixed(1)}g</div>
          </div>
        </div>

        {/* Fat */}
        <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-slate-100 shadow-2xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Droplets size={16} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Chất béo (Fat)</div>
            <div className="text-sm font-bold text-slate-800">{fat.toFixed(1)}g</div>
          </div>
        </div>
      </div>
    </div>
  )
}
