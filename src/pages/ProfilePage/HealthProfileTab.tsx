import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Save,
  Loader2,
  Check,
  Plus,
  X,
  Apple,
  Salad,
  Flame,
  Scale,
  Send,
  Info,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react'
import {
  healthProfileService,
  type Allergen,
  type HealthCondition,
  type UserHealthProfile,
  type ManualHealthProfileUpdateRequest,
} from '@/services/healthProfile.service'
import { useUiStore } from '@/stores/useUiStore'
import { globalShowAlert } from '@/components/common/Popup'

// Default fallback catalogs matching backend sep.sql seeding in case DB is being initialized
const DEFAULT_ALLERGENS: Allergen[] = [
  { id: 1, name: 'Đậu phộng / Lạc' },
  { id: 2, name: 'Phấn hoa thực vật' },
  { id: 3, name: 'Đậu nành' },
  { id: 4, name: 'Gluten / Lúa mì' },
  { id: 5, name: 'Hải sản / Tôm cua' },
  { id: 6, name: 'Trứng gà' },
  { id: 7, name: 'Sữa bò / Lactose' },
  { id: 8, name: 'Mè / Vừng' },
  { id: 9, name: 'Cà rốt' },
  { id: 10, name: 'Dưa leo' },
  { id: 11, name: 'Nấm các loại' },
  { id: 12, name: 'Cá biển' },
]

const DEFAULT_CONDITIONS: HealthCondition[] = [
  { id: 1, name: 'Tiểu đường type 2 (Cần giảm đường bột)' },
  { id: 2, name: 'Huyết áp cao (Ăn nhạt, nhiều kali)' },
  { id: 3, name: 'Đau dạ dày / Tiêu hóa nhạy cảm' },
  { id: 4, name: 'Ăn kiêng giảm cân (Keto / Low-carb)' },
  { id: 5, name: 'Trào ngược dạ dày thực quản (GERD)' },
  { id: 6, name: 'Gout / Tăng acid uric máu' },
  { id: 7, name: 'Mỡ máu cao / Tim mạch' },
  { id: 8, name: 'Suy thận nhẹ (Hạn chế kali, đạm cao)' },
  { id: 9, name: 'Viêm xoang / Hạn chế đồ lạnh' },
  { id: 10, name: 'Hội chứng ruột kích thích (IBS)' },
]

interface DietOption {
  key: string
  backendPref: 'NON_VEGETARIAN' | 'VEGETARIAN' | 'VEGAN'
  title: string
  subtitle: string
  icon: React.ReactNode
}

const DIET_OPTIONS: DietOption[] = [
  {
    key: 'OMNIVORE',
    backendPref: 'NON_VEGETARIAN',
    title: 'Ăn Đa Dạng (Omnivore)',
    subtitle: 'Không kiêng khem, ăn đầy đủ rau củ, thịt, cá & ngũ cốc',
    icon: <Apple className="size-5 text-emerald-600" />,
  },
  {
    key: 'VEGETARIAN',
    backendPref: 'VEGETARIAN',
    title: 'Ăn Chay (Vegetarian)',
    subtitle: 'Thực phẩm gốc thực vật, có thể dùng trứng, sữa & mật ong',
    icon: <Salad className="size-5 text-[#326318]" />,
  },
  {
    key: 'VEGAN',
    backendPref: 'VEGAN',
    title: 'Thuần Chay (Vegan)',
    subtitle: '100% nguồn gốc thực vật, không sử dụng phụ phẩm động vật',
    icon: <Salad className="size-5 text-green-600" />,
  },
  {
    key: 'KETO',
    backendPref: 'NON_VEGETARIAN',
    title: 'Keto / Low-Carb',
    subtitle: 'Cắt giảm tối đa tinh bột và đường, ưu tiên chất béo tốt',
    icon: <Flame className="size-5 text-amber-600" />,
  },
  {
    key: 'BALANCED',
    backendPref: 'NON_VEGETARIAN',
    title: 'Cân Bằng / Eat Clean',
    subtitle: 'Kiểm soát calo, giảm chế biến công nghiệp, giàu chất xơ',
    icon: <Scale className="size-5 text-teal-600" />,
  },
]

export default function HealthProfileTab() {
  const navigate = useNavigate()
  const { showToast } = useUiStore()

  // Data Catalogs
  const [allergensList, setAllergensList] = useState<Allergen[]>(DEFAULT_ALLERGENS)
  const [conditionsList, setConditionsList] = useState<HealthCondition[]>(DEFAULT_CONDITIONS)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Current Selections
  const [dietKey, setDietKey] = useState<string>('OMNIVORE')
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<number[]>([])
  const [selectedConditionIds, setSelectedConditionIds] = useState<number[]>([])

  // Search / Quick Add
  const [allergenSearch, setAllergenSearch] = useState('')
  const [conditionSearch, setConditionSearch] = useState('')
  const [customAllergenName, setCustomAllergenName] = useState('')
  const [customConditionName, setCustomConditionName] = useState('')

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<string | null>(null)
  const [isAiBoxOpen, setIsAiBoxOpen] = useState(false)

  // Load user profile & catalogs
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch catalogs (with fallback)
      const [fetchedAllergens, fetchedConditions, userProfile] = await Promise.all([
        healthProfileService.getAllergens().catch(() => DEFAULT_ALLERGENS),
        healthProfileService.getHealthConditions().catch(() => DEFAULT_CONDITIONS),
        healthProfileService.getMyProfile().catch(() => null),
      ])

      if (fetchedAllergens && fetchedAllergens.length > 0) {
        setAllergensList(fetchedAllergens)
      }
      if (fetchedConditions && fetchedConditions.length > 0) {
        setConditionsList(fetchedConditions)
      }

      // 2. Hydrate user selection if exists
      if (userProfile) {
        // Map diet preference
        const rawPref = userProfile.dietPreference || 'NON_VEGETARIAN'
        if (rawPref === 'VEGAN') setDietKey('VEGAN')
        else if (rawPref === 'VEGETARIAN') setDietKey('VEGETARIAN')
        else setDietKey('OMNIVORE')

        if (Array.isArray(userProfile.allergens)) {
          setSelectedAllergenIds(userProfile.allergens.map((a) => a.id))
        }
        if (Array.isArray(userProfile.healthConditions)) {
          setSelectedConditionIds(userProfile.healthConditions.map((c) => c.id))
        }
      }
    } catch (err) {
      console.error('Error loading health profile data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Toggle selection
  const toggleAllergen = (id: number) => {
    setSelectedAllergenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toggleCondition = (id: number) => {
    setSelectedConditionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Quick Add Custom
  const handleAddCustomAllergen = () => {
    const trimmed = customAllergenName.trim()
    if (!trimmed) return

    // Check if already in list
    const existing = allergensList.find((a) => a.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      if (!selectedAllergenIds.includes(existing.id)) {
        setSelectedAllergenIds((prev) => [...prev, existing.id])
      }
      setCustomAllergenName('')
      return
    }

    // Create a client-side temporary item with negative ID
    const newId = -Math.floor(Date.now() % 100000)
    const newItem: Allergen = { id: newId, name: trimmed }
    setAllergensList((prev) => [...prev, newItem])
    setSelectedAllergenIds((prev) => [...prev, newId])
    setCustomAllergenName('')
  }

  const handleAddCustomCondition = () => {
    const trimmed = customConditionName.trim()
    if (!trimmed) return

    const existing = conditionsList.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      if (!selectedConditionIds.includes(existing.id)) {
        setSelectedConditionIds((prev) => [...prev, existing.id])
      }
      setCustomConditionName('')
      return
    }

    const newId = -Math.floor(Date.now() % 100000)
    const newItem: HealthCondition = { id: newId, name: trimmed }
    setConditionsList((prev) => [...prev, newItem])
    setSelectedConditionIds((prev) => [...prev, newId])
    setCustomConditionName('')
  }

  // AI Extraction Helper
  const handleAiAnalyze = async () => {
    if (!aiPrompt.trim()) {
      showToast('Vui lòng nhập mô tả triệu chứng hoặc câu hỏi trước khi phân tích.')
      return
    }

    setIsAiAnalyzing(true)
    setAiAdvice(null)
    try {
      const res = await healthProfileService.extractProfile({ text: aiPrompt.trim() })
      if (res?.diff) {
        const diff = res.diff
        if (diff.advice || diff.notes) {
          setAiAdvice(diff.advice || diff.notes || '')
        }

        // Auto select matched allergens from catalog
        const toAddAllergies = diff.addAllergies || []
        const matchedAllergenIds = allergensList
          .filter((a) =>
            toAddAllergies.some((tag) => a.name.toLowerCase().includes(tag.toLowerCase())),
          )
          .map((a) => a.id)

        // Auto select matched conditions
        const toAddConditions = diff.addConditions || []
        const matchedConditionIds = conditionsList
          .filter((c) =>
            toAddConditions.some((tag) => c.name.toLowerCase().includes(tag.toLowerCase())),
          )
          .map((c) => c.id)

        if (matchedAllergenIds.length > 0) {
          setSelectedAllergenIds((prev) => Array.from(new Set([...prev, ...matchedAllergenIds])))
        }
        if (matchedConditionIds.length > 0) {
          setSelectedConditionIds((prev) => Array.from(new Set([...prev, ...matchedConditionIds])))
        }

        if (diff.dietPreference) {
          const norm = diff.dietPreference.toUpperCase()
          if (norm.includes('VEGAN')) setDietKey('VEGAN')
          else if (norm.includes('VEGETARIAN') || norm.includes('CHAY')) setDietKey('VEGETARIAN')
          else if (norm.includes('KETO')) setDietKey('KETO')
        }

        showToast('AI đã phân tích và tự động gắn các tag dinh dưỡng phù hợp!')
      }
    } catch (err: any) {
      console.error('Error analyzing health profile via AI:', err)
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi khi phân tích bằng AI.'
      globalShowAlert(msg, 'Phân tích AI', 'error')
    } finally {
      setIsAiAnalyzing(false)
    }
  }

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const selectedDietOption = DIET_OPTIONS.find((d) => d.key === dietKey)
      const backendPref = selectedDietOption?.backendPref || 'NON_VEGETARIAN'

      // Filter out negative temp IDs before sending to backend API
      const validAllergenIds = selectedAllergenIds.filter((id) => id > 0)
      const validConditionIds = selectedConditionIds.filter((id) => id > 0)

      const payload: ManualHealthProfileUpdateRequest = {
        dietPreference: backendPref,
        allergenIds: validAllergenIds,
        conditionIds: validConditionIds,
      }

      await healthProfileService.updateMyProfile(payload)
      globalShowAlert(
        'Hồ sơ dinh dưỡng & dị ứng của bạn đã được cập nhật thành công! CapNong sẽ tự động kích hoạt cảnh báo an toàn trên các sản phẩm phù hợp.',
        'Đã lưu thành công',
        'success',
      )
      showToast('Đã lưu hồ sơ sức khỏe thành công!')
    } catch (err: any) {
      console.error('Error saving health profile:', err)
      const msg = err?.response?.data?.message || err?.message || 'Không thể lưu hồ sơ sức khỏe.'
      globalShowAlert(msg, 'Lỗi cập nhật', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Filtered lists for search
  const filteredAllergens = useMemo(() => {
    if (!allergenSearch.trim()) return allergensList
    const query = allergenSearch.toLowerCase()
    return allergensList.filter((a) => a.name.toLowerCase().includes(query))
  }, [allergensList, allergenSearch])

  const filteredConditions = useMemo(() => {
    if (!conditionSearch.trim()) return conditionsList
    const query = conditionSearch.toLowerCase()
    return conditionsList.filter((c) => c.name.toLowerCase().includes(query))
  }, [conditionsList, conditionSearch])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-[#e6e0d3] p-12 text-center shadow-xs">
        <Loader2 className="size-10 animate-spin text-[#326318] mx-auto mb-3" />
        <p className="text-sm font-bold text-stone-600">
          Đang tải hồ sơ dinh dưỡng & dị ứng cá nhân...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-br from-[#f4faee] via-white to-[#edf7e7] rounded-3xl border border-[#d6ebd0] p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#326318] text-white flex items-center justify-center shrink-0 shadow-sm">
              <HeartPulse size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-[#1b2216] tracking-tight">
                  Hồ Sơ Dinh Dưỡng &amp; Dị Ứng
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck size={14} className="text-emerald-700" />
                  <span>Đang bảo vệ an toàn</span>
                </span>
              </div>
              <p className="text-xs text-[#5c6853] mt-1.5 max-w-2xl leading-relaxed">
                Khai báo dị ứng thực phẩm và tình trạng sức khỏe để hệ thống tự động cảnh báo nguy cơ
                khi xem nông sản, combo và công thức món ăn.
              </p>
            </div>
          </div>

          {/* Quick link button to AI Meal Plan */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/ke-hoach-an-uong')}
              className="py-2.5 px-4.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Lên Kế Hoạch Ăn Uống (AI)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 size-48 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Dietary Preference (Chế độ ăn uống ưu tiên) */}
      <div className="bg-white rounded-3xl border border-[#e6e0d3] p-6 shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-black text-[#1b2216] uppercase tracking-wide flex items-center gap-2">
            <Apple size={17} className="text-[#326318]" />
            <span>1. Chế độ ăn uống ưu tiên (Dietary Preference)</span>
          </h4>
          <p className="text-xs text-[#717b6a] mt-0.5">
            Lựa chọn phong cách dinh dưỡng chủ đạo để CapNong ưu tiên gợi ý thực đơn phù hợp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DIET_OPTIONS.map((opt) => {
            const isSelected = dietKey === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDietKey(opt.key)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-[#326318] bg-[#f5faef] ring-2 ring-[#326318]/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-[#326318]/40 hover:bg-[#faf8f4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
                    {opt.icon}
                  </div>
                  <div
                    className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#326318] bg-[#326318] text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-[#1b2216]">{opt.title}</h5>
                  <p className="text-[11px] text-[#6d7765] mt-1 leading-snug">{opt.subtitle}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Known Allergens (Dị ứng thực phẩm đã biết) */}
      <div className="bg-white rounded-3xl border border-[#e6e0d3] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#f0ece2]">
          <div>
            <h4 className="text-sm font-black text-rose-800 uppercase tracking-wide flex items-center gap-2">
              <span className="text-rose-600">🚫</span>
              <span>2. Dị ứng thực phẩm (Known Food Allergens)</span>
              {selectedAllergenIds.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold ml-1">
                  Đã chọn {selectedAllergenIds.length}
                </span>
              )}
            </h4>
            <p className="text-xs text-[#717b6a] mt-0.5">
              Hệ thống sẽ dán nhãn cảnh báo đỏ nguy hiểm nếu nông sản/món ăn có chứa thành phần này.
            </p>
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-60">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm nhanh dị ứng..."
              value={allergenSearch}
              onChange={(e) => setAllergenSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:border-rose-400 focus:ring-1 focus:ring-rose-400 bg-stone-50/50"
            />
          </div>
        </div>

        {/* Selected allergens pill display */}
        {selectedAllergenIds.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-rose-600" />
              <span>Các thực phẩm bạn ĐANG BỊ DỊ ỨNG (Click để bỏ chọn):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergensList
                .filter((a) => selectedAllergenIds.includes(a.id))
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAllergen(a.id)}
                    className="px-3 py-1.5 rounded-xl bg-white text-rose-700 border border-rose-300 font-extrabold text-xs shadow-2xs hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🚫 {a.name}</span>
                    <X size={13} className="text-rose-500 hover:text-rose-800" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Catalog tags list */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Danh mục dị ứng phổ biến:
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredAllergens.map((a) => {
              const isSelected = selectedAllergenIds.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAllergen(a.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-stone-50 text-stone-700 border border-stone-200/90 hover:border-rose-300 hover:bg-rose-50/40'
                  }`}
                >
                  <span>{isSelected ? '🚫' : '+'}</span>
                  <span>{a.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom allergen input */}
        <div className="pt-2 flex items-center gap-2 max-w-md">
          <input
            type="text"
            placeholder="Thêm dị ứng khác (VD: Bột ngọt, Mù tạt...)"
            value={customAllergenName}
            onChange={(e) => setCustomAllergenName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomAllergen()
              }
            }}
            className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
          />
          <button
            type="button"
            onClick={handleAddCustomAllergen}
            disabled={!customAllergenName.trim()}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-40 transition-all cursor-pointer"
          >
            <Plus size={14} className="inline mr-1" />
            Thêm
          </button>
        </div>
      </div>

      {/* 4. Health Conditions & Diseases (Tình trạng sức khỏe & Bệnh lý) */}
      <div className="bg-white rounded-3xl border border-[#e6e0d3] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#f0ece2]">
          <div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <span>3. Tình trạng sức khỏe &amp; Bệnh lý (Health Conditions)</span>
              {selectedConditionIds.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold ml-1">
                  Đã chọn {selectedConditionIds.length}
                </span>
              )}
            </h4>
            <p className="text-xs text-[#717b6a] mt-0.5">
              Hệ thống sẽ đề xuất nhóm dinh dưỡng lành tính và cảnh báo nông sản có nguy cơ kích ứng
              bệnh lý.
            </p>
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-60">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm bệnh lý..."
              value={conditionSearch}
              onChange={(e) => setConditionSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-stone-50/50"
            />
          </div>
        </div>

        {/* Selected conditions pill display */}
        {selectedConditionIds.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
              <Info size={13} className="text-amber-700" />
              <span>Tình trạng sức khỏe ĐANG THEO DÕI (Click để bỏ chọn):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {conditionsList
                .filter((c) => selectedConditionIds.includes(c.id))
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCondition(c.id)}
                    className="px-3 py-1.5 rounded-xl bg-white text-amber-900 border border-amber-300 font-extrabold text-xs shadow-2xs hover:bg-amber-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>⚠️ {c.name}</span>
                    <X size={13} className="text-amber-600 hover:text-amber-900" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Catalog condition tags */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Danh mục tình trạng sức khỏe:
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredConditions.map((c) => {
              const isSelected = selectedConditionIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCondition(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-stone-50 text-stone-700 border border-stone-200/90 hover:border-amber-300 hover:bg-amber-50/40'
                  }`}
                >
                  <span>{isSelected ? '⚠️' : '+'}</span>
                  <span>{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom condition input */}
        <div className="pt-2 flex items-center gap-2 max-w-md">
          <input
            type="text"
            placeholder="Thêm tình trạng khác (VD: Thiếu máu, Đau khớp...)"
            value={customConditionName}
            onChange={(e) => setCustomConditionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomCondition()
              }
            }}
            className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={handleAddCustomCondition}
            disabled={!customConditionName.trim()}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-40 transition-all cursor-pointer"
          >
            <Plus size={14} className="inline mr-1" />
            Thêm
          </button>
        </div>
      </div>

      {/* 5. Interactive Gemini AI Companion Card */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white rounded-3xl border border-purple-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-2xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
                <span>Trợ Lý Gemini AI Phân Tích &amp; Tư Vấn Y Khoa</span>
              </h4>
              <p className="text-[11px] text-purple-700">
                Nhập triệu chứng tự nhiên, AI sẽ tư vấn thực phẩm kiêng cữ và tự động đánh dấu tag
                cho bạn.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAiBoxOpen((prev) => !prev)}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-100/50 transition-colors cursor-pointer"
          >
            {isAiBoxOpen ? 'Thu gọn' : 'Mở trợ lý AI'}
          </button>
        </div>

        {isAiBoxOpen && (
          <div className="space-y-3 pt-2 border-t border-purple-100">
            <textarea
              rows={3}
              placeholder="VD: Dạo này tôi hay bị ợ chua, trào ngược dạ dày khi ăn đồ cay nóng, dị ứng với đậu phộng và muốn chuyển sang ăn chay eat clean thì cần kiêng những gì?"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-purple-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-purple-400 bg-white shadow-inner resize-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-stone-500 font-medium">Gợi ý câu hỏi:</span>
                <button
                  type="button"
                  onClick={() =>
                    setAiPrompt(
                      'Tôi bị đau dạ dày và dị ứng đậu nành, cần kiêng gì khi đi chợ CapNong?',
                    )
                  }
                  className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-purple-200 text-purple-800 hover:bg-purple-100/70 font-semibold cursor-pointer"
                >
                  Đau dạ dày &amp; đậu nành
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAiPrompt('Tôi bị huyết áp cao và muốn ăn nhạt, nhiều kali để hạ áp.')
                  }
                  className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-purple-200 text-purple-800 hover:bg-purple-100/70 font-semibold cursor-pointer"
                >
                  Huyết áp cao
                </button>
              </div>

              <button
                type="button"
                disabled={isAiAnalyzing || !aiPrompt.trim()}
                onClick={handleAiAnalyze}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                {isAiAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang phân tích y khoa...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Phân Tích Bằng AI</span>
                  </>
                )}
              </button>
            </div>

            {aiAdvice && (
              <div className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-2xs space-y-2 text-xs text-stone-700 leading-relaxed">
                <div className="font-extrabold text-purple-900 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Lời khuyên từ Trợ lý Dinh Dưỡng Gemini:</span>
                </div>
                <p className="whitespace-pre-line text-stone-600">{aiAdvice}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Footer Actions & Save Bar */}
      <div className="bg-white rounded-3xl border border-[#e6e0d3] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-[#626e5a] flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#326318] shrink-0" />
          <span>
            Dữ liệu sức khỏe được mã hóa an toàn và chỉ sử dụng để bảo vệ trải nghiệm mua sắm của
            bạn.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isSaving}
            className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} />
            <span>Khôi phục</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="py-2.5 px-6 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Lưu Hồ Sơ Sức Khỏe</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
