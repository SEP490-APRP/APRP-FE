import { useState } from 'react'
import {
  Sparkles,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
  ShieldCheck,
  RefreshCw,
  Plus,
  Check,
  Info,
  Lightbulb,
} from 'lucide-react'
import {
  useHealthProfile,
  useExtractHealthProfile,
  useConfirmHealthProfile,
} from '../hooks/useMealPlanQueries'
import { useUiStore } from '@/stores/useUiStore'
import type { ProfileExtraction } from '@/services'

interface HealthProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HealthProfileModal({ isOpen, onClose }: HealthProfileModalProps) {
  const { data: profile, isLoading: isProfileLoading } = useHealthProfile()
  const extractMutation = useExtractHealthProfile()
  const confirmMutation = useConfirmHealthProfile()

  const [inputText, setInputText] = useState('')
  const [extractedRequestId, setExtractedRequestId] = useState<number | null>(null)
  const [extractedDiff, setExtractedDiff] = useState<ProfileExtraction | null>(null)
  const [selectedAddConditions, setSelectedAddConditions] = useState<string[]>([])
  const [selectedAddAllergies, setSelectedAddAllergies] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')
  const [customType, setCustomType] = useState<'condition' | 'allergy'>('condition')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isOpen) return null

  const handleExtract = async () => {
    if (!inputText.trim()) {
      useUiStore.getState().showToast('Vui lòng nhập mô tả hoặc câu hỏi cho AI trước khi bấm phân tích.')
      return
    }
    setSuccessMessage('')
    try {
      const res = await extractMutation.mutateAsync({ text: inputText.trim() })
      setExtractedRequestId(res.requestId)
      setExtractedDiff(res.diff)

      const diffObj = res.diff as any
      let toAdd: string[] = diffObj?.addConditions || diffObj?.add_conditions || []
      let toAddAllergies: string[] = diffObj?.addAllergies || diffObj?.add_allergies || []

      // Helper tách chuỗi nếu chứa dấu phẩy, chấm phẩy
      const splitItems = (arr: string[]) => {
        const out: string[] = []
        for (const item of arr) {
          if (!item) continue
          const parts = item.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
          for (const p of parts) {
            if (!out.some((x) => x.toLowerCase() === p.toLowerCase())) {
              out.push(p)
            }
          }
        }
        return out
      }

      toAdd = splitItems(toAdd)
      toAddAllergies = splitItems(toAddAllergies)

      const normInput = inputText.toLowerCase()
      // Nếu user đề cập rõ trào ngược dạ dày mà chưa có trong danh sách đề xuất:
      if (
        (normInput.includes('trào ngược') || normInput.includes('trao nguoc')) &&
        !toAdd.some((c) => c.toLowerCase().includes('trào ngược'))
      ) {
        toAdd = [...toAdd, 'Trào ngược dạ dày']
      }

      setSelectedAddConditions(toAdd)
      setSelectedAddAllergies(toAddAllergies)
    } catch (e: any) {
      console.error(e)
      const msg = e?.response?.data?.message || e?.message || 'Có lỗi khi phân tích bằng AI. Vui lòng thử lại!'
      useUiStore.getState().showToast(msg)
    }
  }

  const toggleSuggestedOption = (option: string) => {
    if (selectedAddConditions.includes(option)) {
      setSelectedAddConditions(selectedAddConditions.filter((c) => c !== option))
    } else {
      setSelectedAddConditions([...selectedAddConditions, option])
    }
  }

  const handleAddCustom = () => {
    if (!customInput.trim()) return
    // Tự động phân tách các mục ngăn cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng
    const rawTokens = customInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (rawTokens.length === 0) return

    if (customType === 'condition') {
      const next = [...selectedAddConditions]
      for (const t of rawTokens) {
        if (!next.some((x) => x.toLowerCase() === t.toLowerCase())) {
          next.push(t)
        }
      }
      setSelectedAddConditions(next)
    } else {
      const next = [...selectedAddAllergies]
      for (const t of rawTokens) {
        if (!next.some((x) => x.toLowerCase() === t.toLowerCase())) {
          next.push(t)
        }
      }
      setSelectedAddAllergies(next)
    }
    setCustomInput('')
  }

  const handleConfirm = async () => {
    if (!extractedRequestId || !extractedDiff) return
    if (!hasAnyChangesToSave) {
      useUiStore.getState().showToast('Chưa có thông tin mới nào được chọn để cập nhật vào CSDL.')
      return
    }
    try {
      const payloadDiff = {
        ...extractedDiff,
        addConditions: selectedAddConditions,
        add_conditions: selectedAddConditions,
        addAllergies: selectedAddAllergies,
        add_allergies: selectedAddAllergies,
      } as any
      await confirmMutation.mutateAsync({
        requestId: extractedRequestId,
        data: { diff: payloadDiff },
      })
      const itemsAdded = [...selectedAddConditions, ...selectedAddAllergies]
      const summaryText =
        itemsAdded.length > 0
          ? `Đã cập nhật thành công vào CSDL: ${itemsAdded.join(', ')}`
          : 'Hồ sơ sức khỏe của bạn đã được cập nhật thành công vào CSDL!'
      setSuccessMessage(summaryText)
      useUiStore.getState().showToast('✓ ' + summaryText)
      setExtractedDiff(null)
      setExtractedRequestId(null)
      setSelectedAddConditions([])
      setSelectedAddAllergies([])
      setInputText('')
    } catch (e: any) {
      console.error(e)
      const msg = e?.response?.data?.message || e?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ'
      useUiStore.getState().showToast(msg)
    }
  }

  const hasAnyChangesToSave =
    selectedAddConditions.length > 0 ||
    selectedAddAllergies.length > 0 ||
    (extractedDiff?.removeConditions && extractedDiff.removeConditions.length > 0) ||
    (extractedDiff?.removeAllergies && extractedDiff.removeAllergies.length > 0) ||
    !!extractedDiff?.dietPreference

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <HeartPulse size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Hồ Sơ Sức Khỏe & Dị Ứng Thông Minh
              </h3>
              <p className="text-xs text-slate-500">
                AI phân tích y khoa, tư vấn dinh dưỡng và tự động lưu vào hệ thống
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông báo thành công */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Hồ sơ hiện tại của người dùng */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hồ sơ đã lưu trên hệ thống
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                <ShieldCheck size={12} /> Đang bảo vệ
              </span>
            </div>

            {isProfileLoading ? (
              <div className="text-xs text-slate-400">Đang tải hồ sơ...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Chế độ ăn:</span>
                  <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-200">
                    {profile?.dietPreference === 'VEGETARIAN'
                      ? 'Ăn Chay (Vegetarian)'
                      : profile?.dietPreference === 'VEGAN'
                      ? 'Thuần Chay (Vegan)'
                      : 'Bình Thường (Non-vegetarian)'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Dị ứng:</span>
                  {(profile?.allergens || (profile as any)?.allergies)?.length > 0 ? (
                    (profile?.allergens || (profile as any)?.allergies).map((a: any) => (
                      <span
                        key={a.id}
                        className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200"
                      >
                        🚫 {a.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Chưa ghi nhận dị ứng</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Bệnh lý / Tình trạng:</span>
                  {(profile?.healthConditions || (profile as any)?.conditions)?.length > 0 ? (
                    (profile?.healthConditions || (profile as any)?.conditions).map((c: any) => (
                      <span
                        key={c.id}
                        className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200"
                      >
                        ⚠️ {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Không có bệnh lý nền</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form nhập câu hỏi / mô tả tự do cho AI */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Mô tả tình trạng sức khỏe mới hoặc đặt câu hỏi cho AI
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <Sparkles size={12} /> Trợ lý Gemini AI
              </span>
            </div>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                placeholder="Ví dụ: nếu tôi bị trào ngược dạ dày thì cần kiêng gì và lưu vào hồ sơ thế nào? Hoặc: tôi mới khỏi đau dạ dày, dạo này chuyển sang ăn chay..."
                className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition"
              />
            </div>

            <button
              type="button"
              onClick={handleExtract}
              disabled={!inputText.trim() || extractMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-md shadow-slate-900/10"
            >
              {extractMutation.isPending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>AI đang phân tích y khoa & chuẩn bị tư vấn...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Phân Tích & Tư Vấn Bằng AI</span>
                </>
              )}
            </button>
          </div>

          {/* Kết quả Phân Tích & Tư Vấn từ AI */}
          {extractedDiff && (
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>Phản Hồi & Đề Xuất Từ Bác Sĩ Dinh Dưỡng AI</span>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    hasAnyChangesToSave
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {hasAnyChangesToSave ? 'Cần bạn xác nhận cập nhật DB' : 'Đã phản hồi tư vấn'}
                </span>
              </div>

              {/* Lời khuyên tư vấn y khoa từ AI */}
              {(extractedDiff.advice || extractedDiff.notes) && (
                <div className="rounded-xl border border-emerald-200/60 bg-white p-3.5 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Lightbulb size={14} className="text-amber-500" />
                    <span>Lời Khuyên Dinh Dưỡng & Giải Thích:</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                    {extractedDiff.advice || extractedDiff.notes}
                  </p>
                </div>
              )}

              {/* Nếu không có thay đổi nhưng đã có sẵn trong hồ sơ */}
              {!hasAnyChangesToSave && (
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                  <Info size={15} className="text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      Hồ sơ của bạn đã được bảo vệ:
                    </span>{' '}
                    Hệ thống nhận thấy tình trạng bạn vừa đề cập đã được lưu hoặc đã tương thích với
                    hồ sơ hiện có. Nếu bạn muốn thêm riêng một mục mới, hãy chọn bên dưới.
                  </div>
                </div>
              )}

              {/* Danh sách các Option gợi ý để người dùng tích chọn */}
              {(extractedDiff.suggestedOptions || (extractedDiff as any).suggested_options)?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Gợi ý tùy chọn thêm vào hồ sơ (Nhấp để chọn / bỏ chọn):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(extractedDiff.suggestedOptions || (extractedDiff as any).suggested_options).map((opt: string, idx: number) => {
                      const isSelected = selectedAddConditions.includes(opt)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleSuggestedOption(opt)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                            isSelected
                              ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          {isSelected ? <Check size={12} className="text-amber-700" /> : <Plus size={12} />}
                          <span>{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Danh sách cập nhật chuẩn bị lưu vào CSDL */}
              <div className="space-y-3 pt-1">
                {extractedDiff.dietPreference && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-600">Chế độ ăn đề xuất:</span>
                    <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      {extractedDiff.dietPreference}
                    </span>
                  </div>
                )}

                {/* Dị ứng cần thêm */}
                {selectedAddAllergies.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-rose-700">Dị ứng sẽ thêm vào hồ sơ:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedAddAllergies.map((a, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800"
                        >
                          + {a}
                          <button
                            type="button"
                            onClick={() => setSelectedAddAllergies(selectedAddAllergies.filter((x) => x !== a))}
                            className="hover:text-rose-950"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bệnh lý cần thêm */}
                {selectedAddConditions.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-amber-700">Bệnh lý sẽ thêm vào hồ sơ:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedAddConditions.map((c, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900"
                        >
                          + {c}
                          <button
                            type="button"
                            onClick={() => setSelectedAddConditions(selectedAddConditions.filter((x) => x !== c))}
                            className="hover:text-amber-950"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mục cần xóa nếu có */}
                {((extractedDiff.removeConditions && extractedDiff.removeConditions.length > 0) ||
                  (extractedDiff.removeAllergies && extractedDiff.removeAllergies.length > 0)) && (
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-slate-500">Mục sẽ loại bỏ khỏi hồ sơ:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedDiff.removeConditions?.map((c, idx) => (
                        <span key={idx} className="rounded-md bg-slate-200 px-2 py-0.5 font-bold text-slate-700 line-through">
                          - {c}
                        </span>
                      ))}
                      {extractedDiff.removeAllergies?.map((a, idx) => (
                        <span key={idx} className="rounded-md bg-slate-200 px-2 py-0.5 font-bold text-slate-700 line-through">
                          - {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tự nhập thêm thủ công nhanh nếu muốn */}
              <div className="rounded-xl border border-slate-200/80 bg-white/70 p-2.5">
                <div className="flex items-center gap-2">
                  <select
                    value={customType}
                    onChange={(e: any) => setCustomType(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    <option value="condition">Bệnh lý / Tình trạng</option>
                    <option value="allergy">Dị ứng</option>
                  </select>
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={
                      customType === 'condition'
                        ? 'Nhập bệnh lý (VD: viêm xoang, trào ngược)...'
                        : 'Nhập dị ứng (VD: tôm, cua, đậu phộng)...'
                    }
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustom()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-white hover:bg-slate-700 transition"
                  >
                    + Thêm
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 italic flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-500 shrink-0" />
                  <span>
                    Mẹo: Có thể nhập nhiều mục cùng lúc, ngăn cách bởi dấu phẩy (<strong>,</strong>). Hệ thống sẽ tự động tách thành từng tag riêng.
                  </span>
                </p>
              </div>

              {/* Nút hành động */}
              {hasAnyChangesToSave ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition shadow-md shadow-emerald-700/20"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Đang cập nhật hồ sơ vào CSDL...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Xác Nhận & Cập Nhật Hồ Sơ Của Tôi (Lưu Vào CSDL)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setExtractedDiff(null)
                      setInputText('')
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hỏi Lại Câu Khác
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                  >
                    Đã Hiểu Lời Khuyên AI
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

