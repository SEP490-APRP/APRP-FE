import React, { useState } from 'react'
import { RotateCcw, ShoppingCart, Store, Check, AlertCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReorderDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface ReorderCardProps {
  reorder: ReorderDto
}

export const ReorderCard: React.FC<ReorderCardProps> = ({ reorder }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const addMultipleToCart = useChatbotStore((s) => s.addMultipleToCart)
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)
  const [isReorderingAll, setIsReorderingAll] = useState(false)
  const [addedSuccess, setAddedSuccess] = useState(false)

  const formatPrice = (val?: number) => {
    if (!val) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
  }

  const items = reorder.items || []
  const availableItems = items.filter((i) => !i.isOutOfStock)
  const outOfStockItems = items.filter((i) => i.isOutOfStock)

  const handleReorderAvailable = async () => {
    if (availableItems.length === 0) return
    setIsReorderingAll(true)
    const addedCount = await addMultipleToCart(availableItems)
    setIsReorderingAll(false)
    if (addedCount === 0) return
    setAddedSuccess(true)
    setTimeout(() => setAddedSuccess(false), 3000)
  }

  const handleNavigateCatalog = () => {
    toggleOpen()
    navigate('/san-pham')
  }

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/95 to-orange-50/80 border border-amber-200/90 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-2xs shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-soil-900 truncate">
              {reorder.orderId > 0 ? `Đơn hàng #${reorder.orderId}` : 'Mua lại nhanh'}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-soil-500 truncate">
              <Store className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">{reorder.shopName || 'Nhà vườn'}</span>
              {reorder.orderDate && <span>• {reorder.orderDate}</span>}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-amber-900">
            {formatPrice(reorder.totalAmount)}
          </span>
          <div className="text-[9px] text-soil-400">Giá trị đơn cũ</div>
        </div>
      </div>

      {/* Warning banner if any items are out of stock or order status notice */}
      {reorder.stockWarning && (
        <div className="flex items-start gap-1.5 p-2 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900 text-[11px] leading-tight">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>{reorder.stockWarning}</span>
        </div>
      )}

      {/* Item List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
        {items.map((item) => {
          const isOutOfStock = Boolean(item.isOutOfStock)
          const qty = item.orderQuantity || 1

          return (
            <div
              key={`${item.itemType}-${item.itemId}`}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                isOutOfStock
                  ? 'bg-slate-50/80 border-slate-200 opacity-65'
                  : 'bg-white/95 border-amber-100 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-9 h-9 rounded-lg object-cover border border-sand-200 shrink-0 ${
                      isOutOfStock ? 'grayscale' : ''
                    }`}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                    {item.name.substring(0, 1)}
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p
                      className={`font-semibold truncate text-[11px] ${
                        isOutOfStock ? 'text-slate-500 line-through' : 'text-soil-900'
                      }`}
                    >
                      {item.name}
                    </p>
                    <span className="text-[10px] text-soil-400 font-medium shrink-0">
                      x{qty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold ${
                        isOutOfStock ? 'text-slate-400' : 'text-emerald-700'
                      }`}
                    >
                      {formatPrice(item.salePrice || item.price)}
                      {item.unit ? ` / ${item.unit}` : ''}
                    </span>

                    {isOutOfStock ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        Hết hàng
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Còn hàng
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Single add button */}
              {isOutOfStock ? (
                <span className="text-[10px] font-medium text-slate-400 px-2 py-1 bg-slate-100 rounded-md shrink-0">
                  Tạm hết
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => selectOption(item, qty)}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 active:scale-95 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                  title="Thêm lẻ món này vào giỏ"
                >
                  <ShoppingCart className="w-3 h-3 text-amber-700" />
                  <span>+ Thêm</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Footer */}
      {availableItems.length > 0 ? (
        <button
          type="button"
          onClick={handleReorderAvailable}
          disabled={isLoading || isReorderingAll}
          className="w-full py-2.5 px-3 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-[0.98] rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {addedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              Đã thêm {availableItems.length} món vào giỏ hàng!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {isReorderingAll
                ? 'Đang thêm vào giỏ...'
                : outOfStockItems.length > 0
                ? `Xác nhận thêm ${availableItems.length} món còn hàng vào giỏ`
                : `Xác nhận thêm cả ${items.length} món vào giỏ`}
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Tất cả nông sản trong đơn này hiện đã hết hàng hoặc hết mùa vụ.</span>
          </div>
          <button
            type="button"
            onClick={handleNavigateCatalog}
            className="w-full py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Khám phá nông sản tươi khác</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
