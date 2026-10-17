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
} from 'lucide-react'
import {
  useHealthProfile,
  useExtractHealthProfile,
  useConfirmHealthProfile,
} from '../hooks/useMealPlanQueries'
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
  const [successMessage, setSuccessMessage] = useState('')

  if (!isOpen) return null

  const handleExtract = async () => {
    if (!inputText.trim()) return
    setSuccessMessage('')
    try {
      const res = await extractMutation.mutateAsync({ text: inputText.trim() })
      setExtractedRequestId(res.requestId)
      setExtractedDiff(res.diff)
    } catch (e: any) {
      console.error(e)
    }
  }

  const handleConfirm = async () => {
    if (!extractedRequestId || !extractedDiff) return
    try {
      await confirmMutation.mutateAsync({
        requestId: extractedRequestId,
        data: { diff: extractedDiff },
      })
      setSuccessMessage('Hồ sơ sức khỏe đã được cập nhật thành công!')
      setExtractedDiff(null)
      setExtractedRequestId(null)
      setInputText('')
    } catch (e: any) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
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
                AI phân tích mô tả tự do để tự động loại trừ thực phẩm gây dị ứng
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
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
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
                  {profile?.allergens && profile.allergens.length > 0 ? (
                    profile.allergens.map((a) => (
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
                  {profile?.healthConditions && profile.healthConditions.length > 0 ? (
                    profile.healthConditions.map((c) => (
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

          {/* Form nhập văn bản tự do cho AI trích xuất */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Mô tả tình trạng sức khỏe mới (Tiếng Việt tự do)
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
                placeholder="Ví dụ: Tôi bị đau dạ dày và dị ứng đậu phộng, tôm cua. Dạo này tôi muốn chuyển sang ăn chay..."
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
                  <span>AI đang phân tích y khoa...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Phân Tích Bằng AI</span>
                </>
              )}
            </button>
          </div>

          {/* Bảng diff kết quả AI trích xuất (Gatekeeper Preview) */}
          {extractedDiff && (
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/30 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>Kết Quả Đề Xuất Cập Nhật Từ AI</span>
                </div>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Cần bạn xác nhận
                </span>
              </div>

              {extractedDiff.notes && (
                <p className="text-xs italic text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                  "{extractedDiff.notes}"
                </p>
              )}

              <div className="space-y-2 text-xs">
                {extractedDiff.dietPreference && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Chế độ ăn đề xuất:</span>
                    <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      {extractedDiff.dietPreference}
                    </span>
                  </div>
                )}

                {extractedDiff.addAllergies && extractedDiff.addAllergies.length > 0 && (
                  <div>
                    <span className="font-semibold text-rose-700">Dị ứng cần thêm mới:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {extractedDiff.addAllergies.map((a, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-rose-100 px-2 py-0.5 font-bold text-rose-800"
                        >
                          + {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {extractedDiff.addConditions && extractedDiff.addConditions.length > 0 && (
                  <div>
                    <span className="font-semibold text-amber-700">Bệnh lý / Tình trạng cần thêm:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {extractedDiff.addConditions.map((c, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-900"
                        >
                          + {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition shadow-md shadow-emerald-700/20"
              >
                {confirmMutation.isPending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang cập nhật hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Xác Nhận & Cập Nhật Hồ Sơ Của Tôi</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
