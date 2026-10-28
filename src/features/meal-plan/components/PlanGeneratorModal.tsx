import { useState, useMemo, useEffect } from 'react'
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
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  Utensils,
  Lightbulb,
} from 'lucide-react'
import { useGenerateAiPlan, usePreCheckPlan, useHealthProfile } from '../hooks/useMealPlanQueries'
import { useUiStore } from '@/stores/useUiStore'
import type { MealType, PlanPreCheckResponse, PlanScenarioOption } from '@/services'

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
  const preCheckMutation = usePreCheckPlan()

  // Form State
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

  // Multi-step Flow State
  const [step, setStep] = useState<'INPUT' | 'ADVISORY'>('INPUT')
  const [preCheckData, setPreCheckData] = useState<PlanPreCheckResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null)
      setStep('INPUT')
    }
  }, [isOpen])

  const toggleMealType = (m: MealType) => {
    setErrorMessage(null)
    if (preferredMeals.includes(m)) {
      if (preferredMeals.length > 1) {
        setPreferredMeals(preferredMeals.filter((item) => item !== m))
      }
    } else {
      setPreferredMeals([...preferredMeals, m])
    }
  }

  const triggerGenerate = async (
    days: number,
    people: number,
    targetBudgetValue?: number,
    mealTypes?: MealType[],
  ) => {
    try {
      setErrorMessage(null)
      const selectedMeals = mealTypes || preferredMeals
      const newPlan = await generateMutation.mutateAsync({
        goal: selectedGoal,
        numberOfDays: days,
        numberOfPeople: people,
        targetBudget: targetBudgetValue && targetBudgetValue > 0 ? targetBudgetValue : undefined,
        preferredMealTypes: selectedMeals,
        mealTypes: selectedMeals,
        extraNotes: extraNotes.trim() || undefined,
      })

      useUiStore.getState().showToast('Đã tạo thực đơn dinh dưỡng thành công!', 'success')
      if (onSuccess) {
        onSuccess(newPlan.planId)
      }
      onClose()
    } catch (err: any) {
      console.error('Lỗi khi sinh thực đơn AI:', err)
      const rawMsg = err?.data?.message || err?.message || ''
      let userMsg = 'Kho nông sản hiện không có đủ combo rau củ còn hàng phù hợp với các tiêu chí bạn đã chọn.'

      if (rawMsg.includes('No suitable combos') || rawMsg.includes('không có đủ combo') || rawMsg.includes('hết hàng')) {
        userMsg = rawMsg.length > 30 && !rawMsg.includes('No suitable combos')
          ? rawMsg
          : 'Kho nông sản hiện không có đủ combo rau củ còn hàng phù hợp với các tiêu chí (ngân sách, khẩu phần hoặc loại bữa) bạn đã chọn. Vui lòng nới lỏng ngân sách, giảm số ngày ăn hoặc chọn bữa trưa/tối.'
      } else if (rawMsg) {
        userMsg = rawMsg
      }

      setErrorMessage(userMsg)
      useUiStore.getState().showToast(userMsg, 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const parsedBudget = budget ? parseInt(budget.replace(/\D/g, ''), 10) : undefined

    try {
      // Step 1: Pre-check feasibility with DB combos and serving sizes
      const checkRes = await preCheckMutation.mutateAsync({
        goal: selectedGoal,
        numberOfDays: numDays,
        numberOfPeople: numPeople,
        targetBudget: parsedBudget && parsedBudget > 0 ? parsedBudget : undefined,
        preferredMealTypes: preferredMeals,
        mealTypes: preferredMeals,
      })

      if (!checkRes.isFeasible || checkRes.hasPortionWarning || checkRes.hasBudgetWarning || checkRes.hasStockShortage) {
        setPreCheckData(checkRes)
        setStep('ADVISORY')
        return
      }

      // If perfectly feasible & no portion mismatch, generate directly
      await triggerGenerate(numDays, numPeople, parsedBudget, preferredMeals)
    } catch (err: any) {
      console.error('Precheck error, proceeding with generation:', err)
      // Fallback: if pre-check fails unexpectedly, proceed with generation
      await triggerGenerate(numDays, numPeople, parsedBudget, preferredMeals)
    }
  }

  // Computed scenarios list: reads from server (suggestedScenarios or scenarios) or provides resilient defaults
  const scenariosList: PlanScenarioOption[] = useMemo(() => {
    const fromServer = preCheckData?.scenarios || preCheckData?.suggestedScenarios
    if (fromServer && fromServer.length > 0) {
      return fromServer
    }

    const parsedBudget = budget ? parseInt(budget.replace(/\D/g, ''), 10) : 500000
    const stdCost = preCheckData?.estimatedStandardCost || 450000
    const optCost = Math.round(stdCost * (2 / 3))

    return [
      {
        scenarioId: 'OPTIMIZE_MEALS',
        scenarioKey: 'OPTIMIZE_MEALS',
        title: 'Tối ưu 2 bữa chính (Trưa & Tối)',
        description: 'Lên thực đơn cho bữa Trưa và Tối đầy đủ món canh/xào, bữa sáng gia đình tự túc nhẹ nhàng.',
        suggestedMealTypes: ['LUNCH', 'DINNER'] as MealType[],
        suggestedDays: numDays,
        suggestedBudget: optCost,
        estimatedCost: optCost,
      },
      {
        scenarioId: 'REDUCE_DAYS',
        scenarioKey: 'REDUCE_DAYS',
        title: `Rút ngắn còn ${Math.max(2, numDays - 1)} ngày trọn vẹn`,
        description: `Giữ trọn vẹn các bữa ăn đầy đủ chất nhưng gói gọn trong ${Math.max(2, numDays - 1)} ngày để vừa vặn ngân sách hiện tại.`,
        suggestedDays: Math.max(2, numDays - 1),
        suggestedMealTypes: preferredMeals,
        suggestedBudget: Math.max(parsedBudget, Math.round(stdCost * 0.7)),
        estimatedCost: Math.max(parsedBudget, Math.round(stdCost * 0.7)),
      },
      {
        scenarioId: 'REALISTIC_BUDGET',
        scenarioKey: 'REALISTIC_BUDGET',
        title: `Giữ đủ ${numDays} ngày theo chi phí thực tế`,
        description: `Điều chỉnh ngân sách lên ${stdCost.toLocaleString('vi-VN')}đ theo giá nông sản thực tế trong kho để cả nhà có thực đơn phong phú.`,
        suggestedDays: numDays,
        suggestedMealTypes: preferredMeals,
        suggestedBudget: stdCost,
        estimatedCost: stdCost,
      },
    ]
  }, [preCheckData, budget, numDays, preferredMeals])

  const handleApplyScenario = async (sc: PlanScenarioOption) => {
    setErrorMessage(null)
    const daysToUse = sc.suggestedDays || sc.adjustedDays || numDays
    const rawBudget = sc.suggestedBudget || sc.adjustedBudget
    // If rawBudget was passed as an inadequate number (lower than estimatedCost), prioritize realistic cost
    const budgetToUse = (sc.estimatedCost && (!rawBudget || rawBudget < sc.estimatedCost))
      ? Math.round(sc.estimatedCost)
      : (rawBudget || (sc.estimatedCost ? Math.round(sc.estimatedCost) : undefined))
    const rawMeals = sc.suggestedMealTypes || sc.adjustedMealTypes
    const mealsToUse = (rawMeals && rawMeals.length > 0)
      ? (rawMeals as MealType[])
      : preferredMeals

    // Sync state for consistency
    if (daysToUse) setNumDays(daysToUse)
    if (budgetToUse) setBudget(String(Math.round(budgetToUse)))
    if (mealsToUse) setPreferredMeals(mealsToUse)

    await triggerGenerate(daysToUse, numPeople, budgetToUse, mealsToUse)
  }

  const handleProceedAnyway = async () => {
    setErrorMessage(null)
    const parsedBudget = budget ? parseInt(budget.replace(/\D/g, ''), 10) : undefined
    await triggerGenerate(numDays, numPeople, parsedBudget, preferredMeals)
  }

  if (!isOpen) return null

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
                {step === 'ADVISORY' ? 'Trợ Lý AI Tư Vấn Khẩu Phần & Ngân Sách' : 'Lên Thực Đơn Dinh Dưỡng Bằng AI'}
              </h3>
              <p className="text-xs text-slate-500">
                {step === 'ADVISORY'
                  ? 'Phân tích tính khả thi từ kho combo thực tế trên sàn CapNong'
                  : 'Xếp thực đơn thông minh từ các combo nông sản thực tế trên sàn CapNong'}
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

        {/* STEP 1: FORM INPUT */}
        {step === 'INPUT' ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Alert nếu có lỗi tạo thực đơn */}
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/95 p-4 text-xs text-rose-900 shadow-xs">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-rose-900 text-sm">Không thể tạo thực đơn dinh dưỡng</div>
                  <p className="text-rose-800 leading-relaxed">{errorMessage}</p>
                  <div className="mt-2 text-[11px] text-rose-700 bg-white/80 rounded-xl p-2.5 border border-rose-200">
                    <span className="font-semibold block mb-1">💡 Hướng xử lý:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Thử giảm số ngày lên kế hoạch (ví dụ từ 7 ngày xuống 2–3 ngày)</li>
                      <li>Bỏ bớt bữa sáng hoặc chỉ chọn 2 bữa chính (Trưa & Tối)</li>
                      <li>Nới lỏng ngân sách dự kiến để AI tiếp cận nhiều combo nông sản hơn</li>
                      <li>Kiểm tra lại mục Dị ứng trong <strong>Hồ sơ sức khỏe</strong> nếu bộ lọc loại trừ quá nhiều món</li>
                    </ul>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            )}

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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Các bữa ăn trong ngày
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreferredMeals(['BREAKFAST', 'LUNCH', 'DINNER'])}
                      className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 underline"
                    >
                      3 bữa chuẩn
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreferredMeals(['LUNCH', 'DINNER'])
                        if (!extraNotes.includes('16:8')) {
                          setExtraNotes((prev) => (prev ? prev + ', ' : '') + 'Nhịn ăn gián đoạn 16:8 (chỉ Trưa + Tối)')
                        }
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline flex items-center gap-0.5"
                      title="Chế độ nhịn ăn gián đoạn 16:8: bỏ bữa sáng, dồn calo vào trưa và tối"
                    >
                      <span>⚡ Nhịn ăn 16:8</span>
                    </button>
                  </div>
                </div>
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
                disabled={preCheckMutation.isPending || generateMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/25 hover:opacity-95 disabled:opacity-50 transition"
              >
                {preCheckMutation.isPending || generateMutation.isPending ? (
                  <>
                    <RefreshCw size={18} className="animate-spin text-amber-300" />
                    <span>AI đang phân tích khẩu phần & kiểm tra tồn kho...</span>
                  </>
                ) : (
                  <>
                    <ChefHat size={18} className="text-amber-300" />
                    <span>Tiếp Tục & Phân Tích Thực Đơn</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: AI ADVISORY & SCENARIOS */
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Metrics Overview Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Quy mô</span>
                <span className="font-bold text-slate-800">{numDays} ngày • {numPeople} người</span>
              </div>
              <div>
                <span className="text-slate-500 block">Số bữa & combo</span>
                <span className="font-bold text-slate-800">
                  {preCheckData?.totalMeals} bữa ({preCheckData?.totalCombosNeeded} combo)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Chi phí tối thiểu</span>
                <span className="font-bold text-emerald-700">
                  {preCheckData?.estimatedMinCost ? `${(preCheckData.estimatedMinCost).toLocaleString('vi-VN')}đ` : '---'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Ngân sách bạn nhập</span>
                <span className={`font-bold ${preCheckData?.hasBudgetWarning ? 'text-rose-600' : 'text-slate-800'}`}>
                  {budget ? `${parseInt(budget.replace(/\D/g, ''), 10).toLocaleString('vi-VN')}đ` : 'Không giới hạn'}
                </span>
              </div>
            </div>

            {/* Warning: Stock Shortage Notice */}
            {preCheckData?.hasStockShortage && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-xs text-rose-950">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="font-bold text-rose-900 text-sm">
                    Cảnh báo tồn kho: Không đủ combo rau củ khả dụng
                  </div>
                  <p className="text-rose-800 leading-relaxed">
                    {preCheckData.stockShortageMessage ||
                      'Số lượng combo rau củ còn hàng hiện tại chưa đủ cho toàn bộ số ngày và số bữa ăn đã chọn. Vui lòng giảm số ngày hoặc áp dụng các phương án rút gọn bên dưới.'}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message when scenario generation fails */}
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/95 p-4 text-xs text-rose-900 shadow-xs">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-rose-900 text-sm">Chưa thể áp dụng phương án</div>
                  <p className="text-rose-800 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Warning 1: Portion Size Notice */}
            {preCheckData?.hasPortionWarning && (
              <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950">
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span>Lưu ý về khẩu phần Combo nông sản CapNong</span>
                    <span className="rounded-full bg-blue-200/80 px-2 py-0.2 text-[10px] font-semibold text-blue-800">
                      Chuẩn 3-4 người
                    </span>
                  </div>
                  <p className="text-blue-800 leading-relaxed">
                    {preCheckData.portionAdvice}
                  </p>
                </div>
              </div>
            )}

            {/* Warning 2: Budget Shortage Notice */}
            {preCheckData?.hasBudgetWarning && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-900">
                    Ngân sách thấp hơn chi phí tối thiểu từ kho nông sản
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    {preCheckData.budgetAdvice}
                  </p>
                </div>
              </div>
            )}

            {/* 3 AI Suggested Scenarios */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Lightbulb size={15} className="text-amber-500" />
                <span>AI Đề xuất các phương án tối ưu khả thi:</span>
              </div>

              <div className="space-y-3">
                {scenariosList.map((sc, idx) => {
                  const key = sc.scenarioKey || sc.scenarioId || `scenario-${idx}`
                  const isMealOpt = key === 'OPTIMIZE_MEALS'
                  const isDaysOpt = key === 'REDUCE_DAYS'
                  const isBudgetOpt = key === 'REALISTIC_BUDGET'
                  const estCost = sc.estimatedCost || sc.suggestedBudget || sc.adjustedBudget

                  return (
                    <div
                      key={key}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                        isMealOpt
                          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                          : isDaysOpt
                          ? 'border-teal-200 bg-teal-50/40 hover:bg-teal-50/70'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex flex-wrap items-center gap-2">
                          {isMealOpt && <Utensils size={15} className="text-emerald-700" />}
                          {isDaysOpt && <Calendar size={15} className="text-teal-700" />}
                          {isBudgetOpt && <DollarSign size={15} className="text-amber-600" />}
                          <span className="text-xs font-bold text-slate-900">{sc.title}</span>
                          {estCost ? (
                            <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-slate-200 shadow-2xs">
                              Chi phí ước tính: {estCost.toLocaleString('vi-VN')}đ
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {sc.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={generateMutation.isPending}
                        onClick={() => handleApplyScenario(sc)}
                        className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition shadow-xs"
                      >
                        {generateMutation.isPending ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <>
                            <span>Áp dụng phương án này</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft size={14} />
                <span>Quay lại chỉnh sửa</span>
              </button>

              <button
                type="button"
                disabled={generateMutation.isPending}
                onClick={handleProceedAnyway}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Vẫn tiếp tục tạo với cấu hình ban đầu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
