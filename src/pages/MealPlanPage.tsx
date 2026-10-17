import { useState, useEffect } from 'react'
import {
  Sparkles,
  HeartPulse,
  ShoppingBag,
  Plus,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  Archive,
  Trash2,
  RefreshCw,
  ChefHat,
  ChevronDown,
} from 'lucide-react'
import {
  useMyPlans,
  useMealPlanDetail,
  useConfirmPlan,
  useArchivePlan,
  useDeletePlan,
  useReplaceMealItem,
  useHealthProfile,
  PlanDayView,
  NutritionalSummaryBar,
  HealthProfileModal,
  PlanGeneratorModal,
  ShoppingListModal,
  SwapComboModal,
} from '@/features/meal-plan'
import type { PlanStatus } from '@/services'

export default function MealPlanPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [isHealthProfileOpen, setIsHealthProfileOpen] = useState(false)
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)

  // Swap / Add Modal State
  const [swapTarget, setSwapTarget] = useState<{ mealId: number; itemId: number } | null>(null)

  const { data: plansPage, isLoading: isPlansLoading } = useMyPlans(undefined, 1, 20)
  const { data: activePlan, isLoading: isDetailLoading } = useMealPlanDetail(selectedPlanId)
  const { data: profile } = useHealthProfile()

  const confirmPlanMutation = useConfirmPlan()
  const archivePlanMutation = useArchivePlan()
  const deletePlanMutation = useDeletePlan()
  const replaceMealItemMutation = useReplaceMealItem(selectedPlanId || 0)

  // Tự động chọn plan đầu tiên khi load xong nếu chưa chọn
  useEffect(() => {
    if (!selectedPlanId && plansPage?.content && plansPage.content.length > 0) {
      setSelectedPlanId(plansPage.content[0].planId)
    }
  }, [plansPage, selectedPlanId])

  const handleOpenSwap = (mealId: number, itemId: number) => {
    setSwapTarget({ mealId, itemId })
  }

  const handleSelectNewCombo = async (newComboId: number) => {
    if (!swapTarget || !selectedPlanId) return
    try {
      await replaceMealItemMutation.mutateAsync({
        mealId: swapTarget.mealId,
        itemId: swapTarget.itemId,
        request: { newComboId },
      })
    } finally {
      setSwapTarget(null)
    }
  }

  const handleConfirmPlan = async () => {
    if (!selectedPlanId) return
    await confirmPlanMutation.mutateAsync(selectedPlanId)
  }

  const handleArchivePlan = async () => {
    if (!selectedPlanId) return
    await archivePlanMutation.mutateAsync(selectedPlanId)
  }

  const handleDeletePlan = async () => {
    if (!selectedPlanId) return
    if (window.confirm('Bạn có chắc chắn muốn xóa kế hoạch này?')) {
      await deletePlanMutation.mutateAsync(selectedPlanId)
      setSelectedPlanId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-10 text-white shadow-xl">
          {/* Background Decorative Pattern */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 right-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md border border-emerald-500/30">
                <Sparkles size={13} />
                <span>Công Nghệ AI Lên Thực Đơn Dinh Dưỡng</span>
              </div>
              <h1 className="text-2xl font-black sm:text-3xl lg:text-4xl tracking-tight">
                Kế Hoạch Ăn Uống & Đi Chợ 1 Chạm
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Tự động tối ưu chi phí từ kho combo giải cứu, tính toán chỉ số calo chính xác và bảo
                vệ bạn khỏi thành phần gây dị ứng.
              </p>
            </div>

            {/* Actions Quick Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsHealthProfileOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition shadow-xs"
              >
                <HeartPulse size={16} className="text-rose-400" />
                <span>Hồ Sơ Sức Khỏe</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGeneratorOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-xs font-black text-slate-950 hover:brightness-105 transition shadow-lg shadow-amber-500/30"
              >
                <Sparkles size={16} className="text-slate-950" />
                <span>Tạo Bằng AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Controller Bar & Switcher */}
        {plansPage?.content && plansPage.content.length > 0 ? (
          <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 sm:p-6 shadow-xs border border-slate-200/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              {/* Dropdown / Switcher danh sách Plans */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedPlanId || ''}
                    onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                    className="appearance-none rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-4 pr-10 text-sm font-bold text-slate-800 hover:border-emerald-500 focus:outline-hidden"
                  >
                    {plansPage.content.map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {p.planName} ({p.numberOfDays} ngày - {p.status})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-3.5 text-slate-400"
                  />
                </div>

                {/* Status Badge */}
                {activePlan && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      activePlan.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activePlan.status === 'AI_DRAFT'
                        ? 'bg-amber-100 text-amber-800'
                        : activePlan.status === 'ARCHIVED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {activePlan.status === 'CONFIRMED'
                      ? '✓ Đã xác nhận'
                      : activePlan.status === 'AI_DRAFT'
                      ? '⚡ Bản nháp AI'
                      : activePlan.status === 'ARCHIVED'
                      ? 'Lưu trữ'
                      : 'Đang soạn'}
                  </span>
                )}
              </div>

              {/* Action Buttons for Active Plan */}
              {activePlan && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Shopping List Button */}
                  <button
                    type="button"
                    onClick={() => setIsShoppingListOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200"
                  >
                    <ShoppingBag size={14} className="text-emerald-700" />
                    <span>Danh sách đi chợ</span>
                  </button>

                  {/* Confirm Plan Button (for AI_DRAFT) */}
                  {activePlan.status === 'AI_DRAFT' && (
                    <button
                      type="button"
                      disabled={confirmPlanMutation.isPending}
                      onClick={handleConfirmPlan}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Xác nhận thực đơn</span>
                    </button>
                  )}

                  {/* Archive Button */}
                  {activePlan.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      disabled={archivePlanMutation.isPending}
                      onClick={handleArchivePlan}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                      title="Lưu trữ sau khi đã hoàn thành kế hoạch"
                    >
                      <Archive size={14} />
                      <span className="hidden sm:inline">Lưu trữ</span>
                    </button>
                  )}

                  {/* Delete Button (for drafts) */}
                  {activePlan.status !== 'CONFIRMED' && (
                    <button
                      type="button"
                      disabled={deletePlanMutation.isPending}
                      onClick={handleDeletePlan}
                      className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Xóa kế hoạch"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Plan Meta Indicators */}
            {activePlan && (
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-700" />
                  <span>
                    Thời lượng: <b>{activePlan.numberOfDays} ngày</b>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-700" />
                  <span>
                    Khẩu phần: <b>{activePlan.numberOfPeople} người</b>
                  </span>
                </div>
                {activePlan.targetBudget ? (
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-700" />
                    <span>
                      Ngân sách: <b>{activePlan.targetBudget.toLocaleString('vi-VN')}đ</b>
                    </span>
                  </div>
                ) : null}
                {activePlan.totalEstimatedPrice ? (
                  <div className="flex items-center gap-1.5 ml-auto font-bold text-emerald-800">
                    <span>Tổng tiền ước tính:</span>
                    <span className="text-sm">
                      {activePlan.totalEstimatedPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {/* Content Body: Plan Days View */}
        {isDetailLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-3xl bg-white p-12 shadow-xs border border-slate-200">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <RefreshCw size={24} className="animate-spin text-emerald-700" />
              <span className="text-xs font-semibold">Đang tải chi tiết thực đơn...</span>
            </div>
          </div>
        ) : activePlan ? (
          <div className="space-y-6">
            <PlanDayView
              plan={activePlan}
              onOpenSwap={handleOpenSwap}
              onOpenAdd={() => setIsGeneratorOpen(true)}
            />
          </div>
        ) : !isPlansLoading ? (
          /* Empty State: Khi chưa có kế hoạch nào */
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-xs border border-slate-200 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ChefHat size={32} />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Bạn chưa có kế hoạch ăn uống nào
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hãy để Trợ lý AI thiết kế thực đơn hàng tuần chuẩn khoa học, tự động lọc dị ứng và gom
                đủ nguyên liệu tươi ngon nhất từ nhà vườn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsGeneratorOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/25 hover:bg-emerald-800 transition"
            >
              <Sparkles size={15} className="text-amber-300" />
              <span>Bắt Đầu Tạo Thực Đơn Bằng AI</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <HealthProfileModal
        isOpen={isHealthProfileOpen}
        onClose={() => setIsHealthProfileOpen(false)}
      />

      <PlanGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSuccess={(newId) => setSelectedPlanId(newId)}
      />

      <ShoppingListModal
        isOpen={isShoppingListOpen}
        onClose={() => setIsShoppingListOpen(false)}
        planId={selectedPlanId}
      />

      <SwapComboModal
        isOpen={!!swapTarget}
        onClose={() => setSwapTarget(null)}
        onSelectCombo={handleSelectNewCombo}
      />
    </div>
  )
}
