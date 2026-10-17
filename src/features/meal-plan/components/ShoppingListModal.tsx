import { useState } from 'react'
import {
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertTriangle,
  X,
  ShoppingCart,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { useShoppingList, useAddPlanToCart } from '../hooks/useMealPlanQueries'

interface ShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  planId: number | null
}

export default function ShoppingListModal({ isOpen, onClose, planId }: ShoppingListModalProps) {
  const { data: shoppingList, isLoading } = useShoppingList(planId)
  const addToCartMutation = useAddPlanToCart()
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen || !planId) return null

  const handleAddToCart = async () => {
    setSuccessMsg('')
    try {
      await addToCartMutation.mutateAsync(planId)
      setSuccessMsg('Đã thêm toàn bộ combo còn hàng vào giỏ hàng của bạn!')
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Danh Sách Đi Chợ (Shopping List)
              </h3>
              <p className="text-xs text-slate-500">
                Tổng hợp nguyên liệu & combo cho kế hoạch "{shoppingList?.planName || 'Ăn uống'}"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMsg && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <RefreshCw size={24} className="animate-spin text-emerald-600" />
              <span className="text-xs">Đang kiểm tra tồn kho tại các nhà vườn...</span>
            </div>
          ) : shoppingList ? (
            <>
              {/* Tình trạng tồn kho tổng thể */}
              <div
                className={`flex items-center gap-2 rounded-2xl p-3 text-xs font-semibold border ${
                  shoppingList.allInStock
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                {shoppingList.allInStock ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Toàn bộ {shoppingList.totalCombosCount} combo đều còn hàng sẵn sàng giao.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <span>Một số combo tạm thời thiếu hàng tại nhà vườn. Vui lòng kiểm tra bên dưới.</span>
                  </>
                )}
              </div>

              {/* Danh sách các Combo cần mua */}
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                {shoppingList.items.map((item) => (
                  <div
                    key={item.comboId}
                    className="flex items-center gap-3.5 p-3.5 bg-white hover:bg-slate-50/50 transition"
                  >
                    {/* Ảnh */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.comboName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ShoppingBag size={18} />
                        </div>
                      )}
                    </div>

                    {/* Chi tiết */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-slate-800">
                          {item.comboName}
                        </span>
                        {item.inStock ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                            Còn hàng ({item.stockAvailable})
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-100 px-2 py-0.2 text-[10px] font-bold text-rose-800">
                            Hết hàng
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                        {item.shopName && (
                          <span className="inline-flex items-center gap-1">
                            <Store size={12} /> {item.shopName}
                          </span>
                        )}
                        <span>Số lượng: <b className="text-slate-700">{item.totalQuantity}</b></span>
                      </div>
                    </div>

                    {/* Giá tiền */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-800">
                        {(item.subtotal || 0).toLocaleString('vi-VN')}đ
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {(item.unitPrice || 0).toLocaleString('vi-VN')}đ / combo
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tổng cộng */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">Tổng chi phí ước tính</span>
                  <div className="text-lg font-black text-slate-900">
                    {(shoppingList.totalEstimatedPrice || 0).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending || !shoppingList.items.some((i) => i.inStock)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 disabled:opacity-50 transition"
                >
                  {addToCartMutation.isPending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Đang thêm giỏ hàng...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={15} />
                      <span>Thêm Vào Giỏ Hàng</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
