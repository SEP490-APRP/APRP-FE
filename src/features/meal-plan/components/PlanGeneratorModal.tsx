import { useState } from 'react'
import {
  Sparkles,
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  X,
  RefreshCw,
  ChefHat,
  Check,
} from 'lucide-react'
import { useGenerateAiPlan, useHealthProfile } from '../hooks/useMealPlanQueries'
import type { MealType } from '@/services'

interface PlanGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (planId: number) => void
}

const GOALS = [
  {
    id: 'Cơm gia đình ấm cúng',
    title: '👨‍👩‍👧‍👦 Cơm Nhà Tiết Kiệm',
    desc: 'Mâm cơm đậm vị quê hương, tối ưu chi phí từ nông sản giải cứu',
  },
  {
    id: 'Ăn chay thanh tịnh',
    title: '🌿 Ăn Chay Thanh Đạm',
    desc: '100% rau củ quả thuần chay, giàu chất xơ và thanh lọc cơ thể',
  },
  {
    id: 'Eat clean giữ dáng',
    title: '🥗 Eat Clean & Giữ Dáng',
    desc: 'Cân bằng macro, giàu đạm thực vật, ít tinh bột xấu',
  },
  {
    id: 'Bồi bổ sức khỏe',
    title: '💪 Bồi Bổ Năng Lượng',
    desc: 'Thực đơn đầy đủ dinh dưỡng, tăng cường sức đề kháng cho cả nhà',
  },
]

export default function PlanGeneratorModal({
  isOpen,
  onClose,
  onSuccess,
}: PlanGeneratorModalProps) {
  const { data: profile } = useHealthProfile()
  const generateMutation = useGenerateAiPlan()

  const [selectedGoal, setSelectedGoal] = useState(GOALS[0].id)
  const [numDays, setNumDays] = useState(3)
  const [numPeople, setNumPeople] = useState(2)
  const [budget, setBudget] = useState('300000')
  const [preferredMeals, setPreferredMeals] = useState<MealType[]>([
    'BREAKFAST',
    'LUNCH',
    'DINNER',
  ])
  const [extraNotes, setExtraNotes] = useState('')

  if (!isOpen) return null

  const toggleMealType = (m: MealType) => {
    if (preferredMeals.includes(m)) {
      if (preferredMeals.length > 1) {
        setPreferredMeals(preferredMeals.filter((item) => item !== m))
      }
    } else {
      setPreferredMeals([...preferredMeals, m])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const parsedBudget = budget ? parseInt(budget.replace(/\D/g, ''), 10) : undefined
      const newPlan = await generateMutation.mutateAsync({
        goal: selectedGoal,
        numberOfDays: numDays,
        numberOfPeople: numPeople,
        targetBudget: parsedBudget && parsedBudget > 0 ? parsedBudget : undefined,
        preferredMealTypes: preferredMeals,
        extraNotes: extraNotes.trim() || undefined,
      })

      if (onSuccess) {
        onSuccess(newPlan.planId)
      }
      onClose()
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-emerald-50 via-amber-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
              <Sparkles size={20} className="text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Lên Thực Đơn Dinh Dưỡng Bằng AI
              </h3>
              <p className="text-xs text-slate-500">
                Xếp thực đơn thông minh từ các combo nông sản thực tế trên sàn CapNong
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner bảo vệ dị ứng */}
          {profile?.allergens && profile.allergens.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đã kích hoạt bộ lọc an toàn dị ứng: </span>
                <span>
                  AI cam kết loại trừ 100% các combo chứa{' '}
                  <span className="font-bold text-rose-700">
                    {profile.allergens.map((a) => a.name).join(', ')}
                  </span>
                  .
                </span>
              </div>
            </div>
          )}

          {/* 1. Chọn Mục tiêu / Phong cách ăn */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Chọn mục tiêu dinh dưỡng
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {GOALS.map((g) => {
                const isSelected = selectedGoal === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoal(g.id)}
                    className={`flex flex-col text-left rounded-2xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">{g.title}</span>
                      {isSelected && <Check size={16} className="text-emerald-700" />}
                    </div>
                    <span className="mt-1 text-xs text-slate-500 leading-relaxed">{g.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Số ngày & Số người */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Số ngày */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Calendar size={14} className="text-slate-500" />
                <span>Số ngày lên kế hoạch</span>
              </label>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-1">
                {[1, 3, 5, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setNumDays(days)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                      numDays === days
                        ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {days} ngày
                  </button>
                ))}
              </div>
            </div>

            {/* Số người */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Users size={14} className="text-slate-500" />
                <span>Số người ăn</span>
              </label>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-1">
                {[1, 2, 4, 6].map((people) => (
                  <button
                    key={people}
                    type="button"
                    onClick={() => setNumPeople(people)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                      numPeople === people
                        ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {people} người
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Ngân sách & Bữa trong ngày */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Ngân sách */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <DollarSign size={14} className="text-slate-500" />
                <span>Ngân sách tối đa (VND)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Ví dụ: 350000"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Bữa ăn cần lên lịch */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Các bữa ăn trong ngày
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'BREAKFAST' as MealType, label: 'Sáng' },
                  { id: 'LUNCH' as MealType, label: 'Trưa' },
                  { id: 'DINNER' as MealType, label: 'Tối' },
                ].map((m) => {
                  const isChecked = preferredMeals.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMealType(m.id)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-transparent'
                      }`}
                    >
                      {isChecked ? '✓ ' : ''}Bữa {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Ghi chú thêm cho AI */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Yêu cầu hoặc sở thích đặc biệt (Tùy chọn)
            </label>
            <input
              type="text"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Ví dụ: Ưu tiên canh rau thanh mát, hạn chế đồ cay nóng..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Nút Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/25 hover:opacity-95 disabled:opacity-50 transition"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-amber-300" />
                  <span>AI đang thiết kế thực đơn & kiểm tra tồn kho...</span>
                </>
              ) : (
                <>
                  <ChefHat size={18} className="text-amber-300" />
                  <span>Tạo Kế Hoạch Ăn Uống Bằng AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
