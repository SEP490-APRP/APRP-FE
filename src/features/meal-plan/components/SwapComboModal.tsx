import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Check, Utensils } from 'lucide-react'
import { comboService, type BuildCombo } from '@/services'

interface SwapComboModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCombo: (comboId: number) => void
  title?: string
}

export default function SwapComboModal({
  isOpen,
  onClose,
  onSelectCombo,
  title = 'Chọn Combo Thay Thế',
}: SwapComboModalProps) {
  const [keyword, setKeyword] = useState('')

  const { data: combosPage, isLoading } = useQuery({
    queryKey: ['combos', 'active', keyword],
    queryFn: () => comboService.getCombos({ status: 'ACTIVE', keyword: keyword || undefined, size: 30 }),
    enabled: isOpen,
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm combo nông sản..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* List Combos */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách combo...</div>
          ) : combosPage?.content && combosPage.content.length > 0 ? (
            combosPage.content.map((combo: BuildCombo) => (
              <div
                key={combo.comboId}
                className="flex items-center gap-3 py-3 hover:bg-slate-50 rounded-xl px-2 transition"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                  {combo.imageUrl ? (
                    <img src={combo.imageUrl} alt={combo.comboName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Utensils size={18} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{combo.comboName}</div>
                  <div className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                    {(combo.price || 0).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCombo(combo.comboId)
                    onClose()
                  }}
                  className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition"
                >
                  Chọn
                </button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">Không tìm thấy combo phù hợp</div>
          )}
        </div>
      </div>
    </div>
  )
}
