import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertTriangle,
  X,
  ShoppingCart,
  RefreshCw,
  Plus,
  Minus,
  Check,
  ArrowRight,
} from 'lucide-react'
import { useShoppingList } from '../hooks/useMealPlanQueries'
import { cartService } from '@/services'
import { useUiStore } from '@/stores/useUiStore'
import { useQueryClient } from '@tanstack/react-query'

interface ShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  planId: number | null
}

export default function ShoppingListModal({ isOpen, onClose, planId }: ShoppingListModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: shoppingList, isLoading } = useShoppingList(planId)

  // Local state for interactive quantity customization
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Sync state whenever shoppingList is loaded
  useEffect(() => {
    if (shoppingList?.items) {
      const initQty: Record<number, number> = {}
      const initSelected = new Set<number>()

      shoppingList.items.forEach((item) => {
        initQty[item.comboId] = item.totalQuantity
        if (item.inStock) {
          initSelected.add(item.comboId)
        }
      })

      setQuantities(initQty)
      setSelectedIds(initSelected)
    }
  }, [shoppingList])

  // Toggle item selection
  const toggleSelect = (comboId: number) => {
    const next = new Set(selectedIds)
    if (next.has(comboId)) {
      next.delete(comboId)
    } else {
      next.add(comboId)
    }
    setSelectedIds(next)
  }

  // Adjust quantity
  const handleQuantityChange = (comboId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[comboId] || 1
      const nextVal = Math.max(1, current + delta)
      return { ...prev, [comboId]: nextVal }
    })
  }

  // Group items by shop for Farm Clustering optimization
  const groupedByShop = useMemo(() => {
    if (!shoppingList?.items) return {}
    const groups: Record<string, typeof shoppingList.items> = {}
    shoppingList.items.forEach((item) => {
      const shop = item.shopName || 'Nhà vườn CapNong'
      if (!groups[shop]) groups[shop] = []
      groups[shop].push(item)
    })
    return groups
  }, [shoppingList])

  // Calculate customized total
  const { customizedTotal, selectedCount } = useMemo(() => {
    if (!shoppingList?.items) return { customizedTotal: 0, selectedCount: 0 }

    let total = 0
    let count = 0

    shoppingList.items.forEach((item) => {
      if (selectedIds.has(item.comboId)) {
        const qty = quantities[item.comboId] ?? item.totalQuantity
        total += (item.unitPrice || 0) * qty
        count += qty
      }
    })

    return { customizedTotal: total, selectedCount: count }
  }, [shoppingList, selectedIds, quantities])

  if (!isOpen || !planId) return null

  const handleAddToCart = async () => {
    if (!shoppingList?.items || selectedIds.size === 0) return

    setSuccessMsg('')
    setIsAdding(true)

    try {
      const itemsToAdd = shoppingList.items.filter((item) => selectedIds.has(item.comboId) && item.inStock)

      await Promise.all(
        itemsToAdd.map((item) =>
          cartService.addToCart({
            itemType: 'BUILD_COMBO',
            itemId: item.comboId,
            quantity: quantities[item.comboId] ?? item.totalQuantity,
          })
        )
      )

      queryClient.invalidateQueries({ queryKey: ['cart'] })
      setSuccessMsg(`Đã thêm ${itemsToAdd.length} combo vào giỏ hàng thành công!`)
      useUiStore.getState().showToast(`Đã thêm ${itemsToAdd.length} combo vào giỏ hàng!`)
    } catch (e: any) {
      console.error(e)
      useUiStore.getState().showToast(e?.message || 'Có lỗi khi thêm vào giỏ hàng')
    } finally {
      setIsAdding(false)
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
                Tự do tăng/giảm số lượng hoặc bỏ chọn combo đã có sẵn ở nhà trước khi mua
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-900 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate('/cart')
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 transition shadow-sm shrink-0"
              >
                <ShoppingCart size={14} />
                <span>Đến Giỏ Hàng & Thanh Toán Ngay</span>
                <ArrowRight size={13} />
              </button>
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
                    <span>Một số combo tạm thời thiếu hàng tại nhà vườn (đã tự động bỏ chọn). Vui lòng kiểm tra bên dưới.</span>
                  </>
                )}
              </div>

              {/* Case 8: Farm Clustering Optimization Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-teal-50/70 border border-teal-200/80 px-4 py-2.5 text-xs text-teal-950">
                <div className="flex items-center gap-2">
                  <Store size={15} className="text-teal-700 shrink-0" />
                  <span>
                    Gom đơn từ: <b>{Object.keys(groupedByShop).length} nhà vườn</b>
                  </span>
                </div>
                {Object.keys(groupedByShop).length <= 2 ? (
                  <span className="rounded-full bg-emerald-600 text-white font-bold px-2.5 py-0.5 text-[10px] shadow-xs">
                    🌾 Gom 1-2 kiện nông sản: Tiết kiệm ~70% phí ship!
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">
                    Đóng gói theo từng nhà vườn riêng biệt
                  </span>
                )}
              </div>

              {/* Danh sách các Combo cần mua phân nhóm theo Nhà Vườn */}
              <div className="space-y-4">
                {Object.entries(groupedByShop).map(([shopName, items]) => (
                  <div key={shopName} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                    {/* Header Nhà Vườn */}
                    <div className="flex items-center justify-between bg-slate-50/90 px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Store size={14} className="text-emerald-700" />
                        <span className="text-slate-900">{shopName}</span>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        {items.length} combo
                      </span>
                    </div>

                    {/* Danh sách combo thuộc nhà vườn này */}
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const isChecked = selectedIds.has(item.comboId)
                        const qty = quantities[item.comboId] ?? item.totalQuantity
                        const itemSubtotal = (item.unitPrice || 0) * qty

                        return (
                          <div
                            key={item.comboId}
                            className={`flex items-center gap-3.5 p-3.5 transition ${
                              isChecked ? 'bg-white' : 'bg-slate-50/60 opacity-60'
                            }`}
                          >
                            {/* Checkbox chọn mua */}
                            <button
                              type="button"
                              disabled={!item.inStock}
                              onClick={() => toggleSelect(item.comboId)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                isChecked
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300 bg-white hover:border-slate-400'
                              } disabled:opacity-40`}
                            >
                              {isChecked && <Check size={13} strokeWidth={3} />}
                            </button>

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
                                    Còn {item.stockAvailable}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.2 text-[10px] font-bold text-rose-800 border border-rose-200">
                                    <AlertTriangle size={10} /> Hết hàng
                                  </span>
                                )}
                              </div>

                              {/* Region & Type */}
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                {(item.regionDisplayName || item.region) && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 border border-amber-200/80">
                                    {item.regionDisplayName || item.region}
                                  </span>
                                )}
                                {item.comboType && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.2 text-[10px] font-semibold text-sky-800 border border-sky-200/80">
                                    🏷️ {item.comboType}
                                  </span>
                                )}
                              </div>

                              {/* Gợi ý nấu kèm ngoài sàn */}
                              {item.cookingSuggestion && (
                                <div className="mt-1 rounded-md bg-orange-50/70 border border-orange-200/60 px-2 py-1 text-[11px] text-slate-700 leading-snug">
                                  <span className="font-bold text-orange-900">💡 Gợi ý nấu kèm: </span>
                                  <span>{item.cookingSuggestion}</span>
                                </div>
                              )}

                              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                <span>
                                  Đơn giá: <b className="text-slate-700">{(item.unitPrice || 0).toLocaleString('vi-VN')}đ</b>
                                </span>
                              </div>
                            </div>

                            {/* Stepper điều chỉnh số lượng */}
                            {item.inStock && isChecked && (
                              <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs shrink-0">
                                <button
                                  type="button"
                                  disabled={qty <= 1}
                                  onClick={() => handleQuantityChange(item.comboId, -1)}
                                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-1.5 text-xs font-bold text-slate-800">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  disabled={qty >= item.stockAvailable}
                                  onClick={() => handleQuantityChange(item.comboId, 1)}
                                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            )}

                            {/* Thành tiền */}
                            <div className="text-right shrink-0 min-w-[80px]">
                              <div className="text-sm font-bold text-emerald-800">
                                {itemSubtotal.toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tổng cộng & Nút Thêm Giỏ Hàng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">
                    Tổng chi phí ({selectedCount} combo được chọn)
                  </span>
                  <div className="text-lg font-black text-slate-900">
                    {customizedTotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                {successMsg ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isAdding || selectedIds.size === 0}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
                    >
                      <RefreshCw size={13} className={isAdding ? 'animate-spin' : ''} />
                      <span>{isAdding ? 'Đang thêm...' : 'Thêm Lại'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate('/cart')
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-3 text-xs font-black text-white shadow-md shadow-emerald-700/25 hover:brightness-105 transition"
                    >
                      <ShoppingCart size={15} />
                      <span>Đi Đến Giỏ Hàng Thanh Toán</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAdding || selectedIds.size === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 disabled:opacity-50 transition"
                  >
                    {isAdding ? (
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
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
