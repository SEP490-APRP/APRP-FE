import { useState, useEffect, useMemo } from 'react'
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
  AlertTriangle,
  Store,
  ArrowLeftRight,
  ShieldAlert,
} from 'lucide-react'
import {
  useMyPlans,
  useMealPlanDetail,
  useConfirmPlan,
  useArchivePlan,
  useDeletePlan,
  useReplaceMealItem,
  useAddMealItem,
  useHealthProfile,
  PlanDayView,
  NutritionalSummaryBar,
  HealthProfileModal,
  PlanGeneratorModal,
  ShoppingListModal,
  SwapComboModal,
  PlanAiCopilotDrawer,
} from '@/features/meal-plan'
import type { PlanStatus, MealType } from '@/services'
import { useUiStore } from '@/stores/useUiStore'

export default function MealPlanPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [isHealthProfileOpen, setIsHealthProfileOpen] = useState(false)
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)

  // Swap / Add Modal State
  const [modalMode, setModalMode] = useState<'swap' | 'add'>('swap')
  const [swapTarget, setSwapTarget] = useState<{ mealId: number; itemId: number; mealType?: MealType } | null>(null)

  const { data: plansPage, isLoading: isPlansLoading } = useMyPlans(undefined, 1, 20)
  const { data: activePlan, isLoading: isDetailLoading } = useMealPlanDetail(selectedPlanId)
  const { data: profile } = useHealthProfile()

  const confirmPlanMutation = useConfirmPlan()
  const archivePlanMutation = useArchivePlan()
  const deletePlanMutation = useDeletePlan()
  const replaceMealItemMutation = useReplaceMealItem(selectedPlanId || 0)
  const addMealItemMutation = useAddMealItem(selectedPlanId || 0)

  // Tự động chọn plan đầu tiên khi load xong nếu chưa chọn
  useEffect(() => {
    if (!selectedPlanId && plansPage?.content && plansPage.content.length > 0) {
      setSelectedPlanId(plansPage.content[0].planId)
    }
  }, [plansPage, selectedPlanId])

  // Case 1: Kiểm tra xung đột giữa Dị ứng của Buyer và các Combo trong plan (Re-sync Conflict Check)
  const allergenConflicts = useMemo(() => {
    if (!activePlan || activePlan.status !== 'AI_DRAFT' || !profile?.allergens || profile.allergens.length === 0) {
      return []
    }
    const foundConflicts = new Set<string>()
    const strip = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')

    for (const day of activePlan.planDays || []) {
      for (const meal of day.planMeals || []) {
        for (const item of meal.planMealItems || []) {
          const comboText = strip(
            `${item.comboName || ''} ${item.aiDescription || ''} ${item.combo?.description || ''}`
          )
          for (const a of profile.allergens) {
            const rawTokens = a.name
              .split(/[,;/]+/)
              .map((t) => strip(t.trim()))
              .filter(Boolean)
            for (const token of rawTokens) {
              if (token.length > 2 && comboText.includes(token)) {
                foundConflicts.add(a.name)
              }
            }
          }
        }
      }
    }
    return Array.from(foundConflicts)
  }, [activePlan, profile])

  // Case 4: Kiểm tra vượt ngân sách mục tiêu (Budget Overrun Check)
  const budgetOverrun = useMemo(() => {
    if (!activePlan?.targetBudget || activePlan.targetBudget <= 0) return null
    let totalCost = 0
    for (const day of activePlan.planDays || []) {
      for (const meal of day.planMeals || []) {
        for (const item of meal.planMealItems || []) {
          const qty = item.quantity || 1
          const price = item.unitPriceSnapshot || (item.combo as any)?.price || 0
          totalCost += Number(price) * qty
        }
      }
    }
    const diff = totalCost - activePlan.targetBudget
    return diff > 0 ? { totalCost, target: activePlan.targetBudget, excess: diff } : null
  }, [activePlan])

  // Case 7: Kiểm tra combo hết hàng khi mở lại kế hoạch cũ (Stock Depletion Check)
  const outOfStockItems = useMemo(() => {
    if (!activePlan?.planDays) return []
    const depleted: { dayIndex: number; mealId: number; itemId: number; comboId: number; comboName: string; mealType?: MealType }[] = []
    for (const day of activePlan.planDays) {
      for (const meal of day.planMeals || []) {
        for (const item of meal.planMealItems || []) {
          const isOut =
            item.inStock === false ||
            (item.remainingStock !== undefined && item.remainingStock <= 0) ||
            (item.combo?.remainingStock !== undefined && item.combo.remainingStock <= 0)
          if (isOut) {
            depleted.push({
              dayIndex: day.dayIndex,
              mealId: meal.id,
              itemId: item.id,
              comboId: item.comboId,
              comboName: item.comboName || item.combo?.comboName || 'Combo',
              mealType: meal.mealType,
            })
          }
        }
      }
    }
    return depleted
  }, [activePlan])

  // Case 8: Thống kê gom cụm nhà vườn tối ưu phí ship (Farm Clustering Summary)
  const farmClustering = useMemo(() => {
    if (!activePlan?.planDays) return { farmCount: 0, farmNames: [] as string[] }
    const farms = new Set<string>()
    for (const day of activePlan.planDays) {
      for (const meal of day.planMeals || []) {
        for (const item of meal.planMealItems || []) {
          if (item.combo?.shopName) {
            farms.add(item.combo.shopName)
          }
        }
      }
    }
    return { farmCount: farms.size, farmNames: Array.from(farms) }
  }, [activePlan])

  const handleOpenSwap = (mealId: number, itemId: number, mealType?: MealType) => {
    setModalMode('swap')
    setSwapTarget({ mealId, itemId, mealType })
  }

  const handleOpenAdd = (mealId: number, mealType?: MealType) => {
    setModalMode('add')
    setSwapTarget({ mealId, itemId: 0, mealType })
  }

  const handleSelectNewCombo = async (newComboId: number) => {
    if (!swapTarget || !selectedPlanId) return
    try {
      if (modalMode === 'add') {
        await addMealItemMutation.mutateAsync({
          mealId: swapTarget.mealId,
          request: { comboId: newComboId, quantity: 1 },
        })
        useUiStore.getState().showToast('Đã thêm combo vào bữa ăn thành công!')
      } else {
        await replaceMealItemMutation.mutateAsync({
          mealId: swapTarget.mealId,
          itemId: swapTarget.itemId,
          request: { newComboId },
        })
        useUiStore.getState().showToast('Đã đổi combo cho bữa ăn thành công!')
      }
      setSwapTarget(null)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật combo cho bữa ăn'
      useUiStore.getState().showToast(msg)
    }
  }

  const handleConfirmPlan = async () => {
    if (!selectedPlanId) return
    try {
      await confirmPlanMutation.mutateAsync(selectedPlanId)
      useUiStore.getState().showToast(
        '✓ Đã xác nhận thực đơn! Bây giờ bạn có thể bắt đầu theo dõi và đánh dấu các bữa ăn hàng ngày.'
      )
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi khi xác nhận thực đơn'
      useUiStore.getState().showToast(msg)
    }
  }

  const handleArchivePlan = async () => {
    if (!selectedPlanId) return
    if (
      window.confirm(
        'Bạn có chắc muốn lưu trữ thực đơn này? Sau khi lưu trữ, thực đơn sẽ hoàn tất và không thể chỉnh sửa tiếp.'
      )
    ) {
      try {
        await archivePlanMutation.mutateAsync(selectedPlanId)
        useUiStore.getState().showToast('✓ Đã lưu trữ thực đơn vào lịch sử thành công.')
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Có lỗi khi lưu trữ thực đơn'
        useUiStore.getState().showToast(msg)
      }
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlanId) return
    if (window.confirm('Bạn có chắc chắn muốn xóa bản nháp thực đơn này?')) {
      try {
        await deletePlanMutation.mutateAsync(selectedPlanId)
        useUiStore.getState().showToast('✓ Đã xóa bản nháp thực đơn.')
        setSelectedPlanId(null)
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Có lỗi khi xóa thực đơn'
        useUiStore.getState().showToast(msg)
      }
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

              {activePlan && (
                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(true)}
                  className="flex items-center gap-2 rounded-2xl bg-teal-500/20 px-4 py-3 text-xs font-bold text-teal-200 backdrop-blur-md border border-teal-400/30 hover:bg-teal-500/30 transition shadow-xs"
                >
                  <Sparkles size={16} className="text-amber-300" />
                  <span>AI Đồng Hành</span>
                </button>
              )}

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
                {farmClustering.farmCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Store size={14} className="text-emerald-700" />
                    <span>
                      Đóng gói: <b>{farmClustering.farmCount} nhà vườn</b>
                      {farmClustering.farmCount <= 2 && (
                        <span className="ml-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px]">
                          🌾 Tối ưu ship
                        </span>
                      )}
                    </span>
                  </div>
                )}
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

        {/* Case 11: Thông báo Persona mặc định khi người dùng mới chưa cấu hình Hồ sơ Sức khỏe (Cold Start Notice) */}
        {(!profile || (!profile.dietPreference && (!profile.allergens || profile.allergens.length === 0))) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-teal-50/90 border border-teal-200/80 p-4 text-xs text-teal-950 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-sm shadow-xs">
                🌱
              </span>
              <div className="space-y-0.5">
                <h4 className="font-bold text-teal-900 text-sm">
                  Chế độ dinh dưỡng chuẩn mặc định (2.000 kcal/ngày)
                </h4>
                <p className="text-xs text-teal-800 leading-relaxed">
                  Bạn đang sử dụng định mức khuyến nghị chuẩn của Viện Dinh Dưỡng Quốc Gia. Cập nhật thêm tình trạng sức khỏe/dị ứng để AI cá nhân hóa chính xác hơn!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsHealthProfileOpen(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs"
            >
              Cập nhật hồ sơ sức khỏe
            </button>
          </div>
        )}

        {/* Case 7: Banner cảnh báo combo hết hàng tại nhà vườn khi mở lại kế hoạch cũ */}
        {outOfStockItems.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-rose-50 border border-rose-300 p-4 text-xs text-rose-950 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xs">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-rose-900 text-sm">
                  Cảnh báo Hết Hàng: Có {outOfStockItems.length} combo trong thực đơn đã hết hàng tại nhà vườn!
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Món: <span className="font-bold underline">{outOfStockItems.map((i) => i.comboName).join(', ')}</span> hiện đã hết hàng. Vui lòng đổi sang combo tương tự còn hàng để chuẩn bị đặt đi chợ.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const first = outOfStockItems[0]
                handleOpenSwap(first.mealId, first.itemId, first.mealType)
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-800 transition shadow-xs"
            >
              <ArrowLeftRight size={14} />
              <span>Đổi món hết hàng ngay</span>
            </button>
          </div>
        )}

        {/* Case 1: Banner cảnh báo xung đột Dị ứng khi vừa đổi Hồ sơ sức khỏe */}
        {allergenConflicts.length > 0 && activePlan?.status === 'AI_DRAFT' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-950 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xs">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-rose-900 text-sm">
                  Cảnh báo an toàn: Phát hiện món ăn chứa dị ứng của bạn
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Hồ sơ sức khỏe của bạn có ghi nhận dị ứng{' '}
                  <span className="font-bold text-rose-950 underline">{allergenConflicts.join(', ')}</span>.
                  Thực đơn nháp hiện tại đang chứa combo có thành phần này!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-800 transition shadow-xs"
            >
              <Sparkles size={14} />
              <span>Nhờ AI Quét & Đổi Món An Toàn</span>
            </button>
          </div>
        )}

        {/* Case 4: Banner cảnh báo vượt ngân sách mục tiêu */}
        {budgetOverrun && activePlan?.status === 'AI_DRAFT' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-amber-50/90 border border-amber-300 p-4 text-xs text-amber-950 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-xs">
                <DollarSign size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-amber-950 text-sm">
                  Cảnh báo ngân sách: Chi phí thực đơn vượt mức mục tiêu
                </h4>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Tổng chi phí các combo hiện tại (
                  <strong>{budgetOverrun.totalCost.toLocaleString('vi-VN')}đ</strong>) đang vượt ngân sách mục tiêu (
                  <strong>{budgetOverrun.target.toLocaleString('vi-VN')}đ</strong>) khoảng{' '}
                  <strong className="text-rose-700 font-black">+{budgetOverrun.excess.toLocaleString('vi-VN')}đ</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-900 transition shadow-xs"
            >
              <Sparkles size={14} />
              <span>Nhờ AI Cân Đối Tiết Kiệm</span>
            </button>
          </div>
        )}

        {/* Banner hướng dẫn chi tiết cho trạng thái Nháp (AI_DRAFT / DRAFT) */}
        {activePlan && (activePlan.status === 'AI_DRAFT' || activePlan.status === 'DRAFT') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-amber-50/90 border border-amber-200/80 p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                <Sparkles size={20} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-amber-950">
                  Thực đơn đang ở giai đoạn Soạn thảo (Bản nháp AI)
                </h4>
                <p className="text-xs text-amber-800/90 leading-relaxed max-w-3xl">
                  Bạn có thể đổi món bằng nút <span className="font-bold text-emerald-800">"Đổi gợi ý AI"</span> hoặc biểu tượng <span className="font-bold">⇄</span>. Sau khi đã hài lòng với các món ăn, hãy bấm <span className="font-bold text-emerald-900 underline">"Xác nhận thực đơn"</span> để kích hoạt tính năng theo dõi và đánh dấu bữa ăn hàng ngày!
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={confirmPlanMutation.isPending}
              onClick={handleConfirmPlan}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 transition disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{confirmPlanMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận thực đơn ngay'}</span>
            </button>
          </div>
        )}

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
              onOpenAdd={handleOpenAdd}
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

        {/* Case 9: Medical & Nutritional Disclaimer Footer */}
        <div className="pt-8 border-t border-slate-200/80 text-center text-xs text-slate-500 space-y-1.5 pb-6">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
            <ShieldAlert size={15} className="text-emerald-700 shrink-0" />
            <span>Tuyên Bố Miễn Trừ Trách Nhiệm Dinh Dưỡng & An Toàn Y Tế (Medical Disclaimer)</span>
          </div>
          <p className="max-w-2xl mx-auto leading-relaxed text-[11px] text-slate-500">
            Kế hoạch dinh dưỡng và khẩu phần ăn được tính toán bởi Trợ lý AI dựa trên nhu cầu khuyến nghị (RDA) chuẩn của Viện Dinh Dưỡng Quốc Gia Việt Nam và thành phần nông sản thực tế trên sàn Cấp Nông. Gợi ý này không thay thế chẩn đoán y khoa, phác đồ điều trị hoặc lời khuyên của bác sĩ chuyên khoa đối với các bệnh lý mãn tính nghiêm trọng.
          </p>
        </div>
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
        targetMealType={swapTarget?.mealType}
        title={modalMode === 'add' ? 'Chọn Combo Thêm Vào Bữa Ăn' : 'Chọn Combo Thay Thế Cho Bữa Ăn'}
        isSubmitting={modalMode === 'add' ? addMealItemMutation.isPending : replaceMealItemMutation.isPending}
      />

      {/* Floating AI Co-pilot Trigger Button */}
      {activePlan && (
        <button
          type="button"
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-4 py-3 text-xs font-black text-white shadow-xl shadow-emerald-950/25 hover:scale-105 hover:shadow-2xl transition border border-emerald-400/30 group"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold shadow-xs group-hover:rotate-12 transition">
            <Sparkles size={14} />
          </div>
          <span className="tracking-wide">AI Đồng Hành</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
        </button>
      )}

      {/* AI Co-pilot Drawer */}
      <PlanAiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        plan={activePlan || null}
      />
    </div>
  )
}
