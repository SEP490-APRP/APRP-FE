import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Utensils, Store, Sparkles, AlertCircle } from 'lucide-react'
import { comboService, type BuildCombo, type MealType } from '@/services'
import { useUiStore } from '@/stores/useUiStore'

interface SwapComboModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCombo: (comboId: number) => void
  targetMealType?: MealType
  isSubmitting?: boolean
  title?: string
}

const MEAL_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả bữa' },
  { key: 'BREAKFAST', label: 'Bữa Sáng' },
  { key: 'LUNCH', label: 'Bữa Trưa' },
  { key: 'DINNER', label: 'Bữa Tối' },
]

const REGION_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả vùng miền' },
  { key: 'MIEN_NAM', label: '🌴 Nam Bộ' },
  { key: 'MIEN_BAC', label: '🏮 Bắc Bộ' },
  { key: 'MIEN_TRUNG', label: '🌶️ Miền Trung' },
  { key: 'DA_LAT', label: '🍓 Đà Lạt' },
  { key: 'MIEN_TAY', label: '🌾 Miền Tây' },
]

export default function SwapComboModal({
  isOpen,
  onClose,
  onSelectCombo,
  targetMealType,
  isSubmitting = false,
  title = 'Chọn Combo Thay Thế Cho Bữa Ăn',
}: SwapComboModalProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>(targetMealType || 'ALL')
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL')

  // Tự động chuyển tab filter theo targetMealType của bữa ăn đang đổi
  useEffect(() => {
    if (isOpen) {
      setSelectedFilter(targetMealType || 'ALL')
      setSelectedRegion('ALL')
      setKeyword('')
    }
  }, [isOpen, targetMealType])

  const { data: combosPage, isLoading } = useQuery({
    queryKey: ['combos', 'active', keyword],
    queryFn: () => comboService.getCombos({ status: 'ACTIVE', keyword: keyword || undefined, size: 50 }),
    enabled: isOpen,
  })

  // Lọc theo loại bữa ăn và vùng miền
  const filteredCombos = useMemo(() => {
    if (!combosPage?.content) return []
    let list = combosPage.content

    if (selectedFilter !== 'ALL') {
      list = list.filter((c: BuildCombo) => c.mealType === selectedFilter)
    }

    if (selectedRegion !== 'ALL') {
      list = list.filter((c: BuildCombo) => c.region === selectedRegion)
    }

    return list
  }, [combosPage, selectedFilter, selectedRegion])

  // Kiểm tra tính tương thích loại bữa ăn
  const checkCompatibility = (comboMealType?: string, target?: string) => {
    if (!target || !comboMealType) return { ok: true, reason: '' }
    if (comboMealType === target) return { ok: true, reason: '' }
    // Bữa Trưa và Bữa Tối có thể linh hoạt dùng chung mâm cơm gia đình
    if (
      (target === 'LUNCH' && comboMealType === 'DINNER') ||
      (target === 'DINNER' && comboMealType === 'LUNCH')
    ) {
      return { ok: true, reason: '' }
    }
    if (target === 'BREAKFAST') {
      return {
        ok: false,
        reason: 'Vì là bữa sáng nên bạn cần chọn combo ở bữa sáng (món nhẹ, súp, cháo, sinh tố) để đảm bảo dinh dưỡng và tiêu hóa!',
      }
    }
    return {
      ok: false,
      reason: `Bữa ${target === 'LUNCH' ? 'trưa' : 'tối'} là bữa chính, không thể chọn combo của bữa sáng!`,
    }
  }

  const handleChooseCombo = (combo: BuildCombo) => {
    const check = checkCompatibility(combo.mealType, targetMealType)
    if (!check.ok) {
      useUiStore.getState().showToast(check.reason)
      return
    }
    onSelectCombo(combo.comboId)
  }

  if (!isOpen) return null

  const targetLabel =
    targetMealType === 'BREAKFAST'
      ? 'Bữa Sáng'
      : targetMealType === 'LUNCH'
      ? 'Bữa Trưa'
      : targetMealType === 'DINNER'
      ? 'Bữa Tối'
      : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Sparkles size={16} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                {targetLabel && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {targetLabel}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Lựa chọn combo nông sản trực tiếp từ danh mục để điều chỉnh theo sở thích riêng
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

        {/* Search & Filter Bar */}
        <div className="border-b border-slate-100 p-4 space-y-3 bg-slate-50/50">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên combo hoặc thành phần (canh, rau, xào, chay...)"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Meal Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {MEAL_FILTERS.map((f) => {
              const active = selectedFilter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSelectedFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Regional Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {REGION_FILTERS.map((rf) => {
              const active = selectedRegion === rf.key
              return (
                <button
                  key={rf.key}
                  type="button"
                  onClick={() => setSelectedRegion(rf.key)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-amber-900 border border-amber-200/80 hover:bg-amber-50'
                  }`}
                >
                  {rf.label}
                </button>
              )
            })}
          </div>

          {/* Quick Dietary Guidance */}
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-2.5 text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
            <Sparkles size={14} className="shrink-0 text-emerald-700 mt-0.5" />
            <div>
              <b>Lưu ý chọn món:</b> Bữa sáng chỉ nên chọn các combo bữa sáng nhẹ (cháo, súp, sinh tố...). Bữa trưa và Bữa tối có thể linh hoạt chọn các mâm cơm gia đình dùng chung.
            </div>
          </div>
        </div>

        {/* List Combos */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Đang tải danh mục combo nông sản...
            </div>
          ) : filteredCombos.length > 0 ? (
            filteredCombos.map((combo: BuildCombo) => {
              const total = combo.totalQuantity ?? 0
              const sold = combo.soldQuantity ?? 0
              const stock = Math.max(0, total - sold)
              const comp = checkCompatibility(combo.mealType, targetMealType)

              return (
                <div
                  key={combo.comboId}
                  className="flex items-start sm:items-center justify-between gap-3 py-3.5 hover:bg-slate-50/80 rounded-2xl px-3 transition"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                      {combo.imageUrl ? (
                        <img
                          src={combo.imageUrl}
                          alt={combo.comboName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Utensils size={18} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {combo.comboName}
                        </span>
                        {combo.mealType && (
                          <span className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold border ${
                            combo.mealType === 'BREAKFAST'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : combo.mealType === 'LUNCH'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}>
                            {combo.mealType === 'BREAKFAST'
                              ? 'Sáng'
                              : combo.mealType === 'LUNCH'
                              ? 'Trưa'
                              : 'Tối'}
                          </span>
                        )}
                        {!comp.ok && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            <AlertCircle size={10} /> Khác bữa
                          </span>
                        )}
                      </div>

                      {/* Region Badge & Combo Type */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(combo.regionDisplayName || combo.region) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200/80">
                            {combo.regionDisplayName || (
                              combo.region === 'MIEN_BAC' ? '🏮 Miền Bắc' :
                              combo.region === 'MIEN_TRUNG' ? '🌶️ Miền Trung' :
                              combo.region === 'MIEN_NAM' ? '🌴 Nam Bộ' :
                              combo.region === 'MIEN_TAY' ? '🌾 Miền Tây' :
                              combo.region === 'DA_LAT' ? '🍓 Đà Lạt' : combo.region
                            )}
                          </span>
                        )}
                        {combo.type && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-200/80">
                            🏷️ {combo.type}
                          </span>
                        )}
                      </div>

                      {combo.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {combo.description}
                        </p>
                      )}

                      {combo.cookingSuggestion && (
                        <div className="rounded-md bg-orange-50/80 border border-orange-200/70 px-2 py-1 text-[11px] text-slate-700 leading-snug">
                          <span className="font-bold text-orange-900">💡 Gợi ý nấu kèm: </span>
                          <span>{combo.cookingSuggestion}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="font-bold text-emerald-700">
                          {(combo.price || 0).toLocaleString('vi-VN')}đ
                        </span>
                        {combo.shop?.shopName && (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Store size={11} /> {combo.shop.shopName}
                          </span>
                        )}
                        <span className={stock > 0 ? 'text-slate-400' : 'text-rose-500 font-semibold'}>
                          {stock > 0 ? `Còn ${stock} combo` : 'Tạm hết'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={stock <= 0 || isSubmitting}
                    onClick={() => handleChooseCombo(combo)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                      !comp.ok
                        ? 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40'
                    }`}
                  >
                    {isSubmitting ? 'Đang đổi...' : comp.ok ? 'Chọn combo' : 'Xem lưu ý'}
                  </button>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Không tìm thấy combo phù hợp với tiêu chí lọc
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
