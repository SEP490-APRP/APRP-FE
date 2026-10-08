import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import {
  useMyCart,
  useUpdateCartItem,
  useRemoveCartItems,
} from '../hooks/useCartQueries'
import type { CartItemResponse } from '@/types/cart.types'

export const CartView: React.FC = () => {
  const navigate = useNavigate()
  const { data: cart, isLoading, isError, refetch } = useMyCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItems()

  // Lưu trữ danh sách cartItemId được chọn để thanh toán
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())

  // Tự động chọn tất cả các món khả dụng khi giỏ hàng load lần đầu
  React.useEffect(() => {
    if (cart?.shopCarts) {
      const allIds = new Set<number>()
      cart.shopCarts.forEach((shop) => {
        shop.items.forEach((item) => {
          if (item.available) {
            allIds.add(item.cartItemId)
          }
        })
      })
      setSelectedItemIds(allIds)
    }
  }, [cart])

  const toggleSelect = (cartItemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(cartItemId)) next.delete(cartItemId)
      else next.add(cartItemId)
      return next
    })
  }

  const toggleSelectShop = (shopItems: CartItemResponse[]) => {
    const availableItems = shopItems.filter((i) => i.available)
    const isAllSelected = availableItems.every((i) => selectedItemIds.has(i.cartItemId))

    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      availableItems.forEach((i) => {
        if (isAllSelected) next.delete(i.cartItemId)
        else next.add(i.cartItemId)
      })
      return next
    })
  }

  const handleQuantityChange = (item: CartItemResponse, delta: number) => {
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      removeMutation.mutate({ cartItemIds: [item.cartItemId] })
    } else {
      updateMutation.mutate({ cartItemId: item.cartItemId, quantity: newQty })
    }
  }

  const handleRemove = (cartItemId: number) => {
    removeMutation.mutate({ cartItemIds: [cartItemId] })
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      next.delete(cartItemId)
      return next
    })
  }

  // Tính tổng tiền các món được tick chọn
  const { totalAmount, totalCount } = useMemo(() => {
    if (!cart?.shopCarts) return { totalAmount: 0, totalCount: 0 }
    let sum = 0
    let count = 0
    cart.shopCarts.forEach((shop) => {
      shop.items.forEach((item) => {
        if (selectedItemIds.has(item.cartItemId)) {
          sum += item.unitPrice * item.quantity
          count += item.quantity
        }
      })
    })
    return { totalAmount: sum, totalCount: count }
  }, [cart, selectedItemIds])

  const handleProceedToCheckout = () => {
    if (selectedItemIds.size === 0) return
    navigate('/checkout', {
      state: { selectedCartItemIds: Array.from(selectedItemIds) },
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <ErrorState onRetry={() => refetch()} />
      </div>
    )
  }

  const isEmpty = !cart?.shopCarts || cart.shopCarts.length === 0 || cart.shopCarts.every((s) => s.items.length === 0)

  if (isEmpty) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag size={48} className="text-gray-400" />}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy khám phá nông sản tươi ngon từ các nhà vườn và thêm vào giỏ hàng nhé."
          action={
            <Button variant="primary" onClick={() => navigate('/nong-san-tuoi')}>
              Khám phá nông sản
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Giỏ hàng của bạn</h1>
        <span className="text-sm text-ink-muted">
          {cart.shopCarts.reduce((acc, s) => acc + s.items.length, 0)} sản phẩm
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Danh sách items phân nhóm theo shop */}
        <div className="lg:col-span-2 space-y-6">
          {cart.shopCarts.map((shop) => {
            const availableItems = shop.items.filter((i) => i.available)
            const isShopAllSelected =
              availableItems.length > 0 &&
              availableItems.every((i) => selectedItemIds.has(i.cartItemId))

            return (
              <div
                key={shop.shopId}
                className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4"
              >
                {/* Header nhà vườn */}
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isShopAllSelected}
                      onChange={() => toggleSelectShop(shop.items)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Store size={18} className="text-emerald-600" />
                      <span className="font-semibold text-ink text-sm">
                        {shop.shopName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Danh sách món của shop */}
                <div className="divide-y divide-line">
                  {shop.items.map((item) => {
                    const isSelected = selectedItemIds.has(item.cartItemId)

                    return (
                      <div
                        key={item.cartItemId}
                        className={`py-3.5 flex items-center gap-3.5 ${
                          !item.available ? 'opacity-60 bg-gray-50/50 p-2 rounded-xl' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!item.available}
                          checked={isSelected}
                          onChange={() => toggleSelect(item.cartItemId)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer shrink-0"
                        />

                        {/* Hình ảnh */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-line">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              Ảnh
                            </div>
                          )}
                        </div>

                        {/* Thông tin món */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-ink truncate">
                            {item.itemName}
                          </h4>
                          <div className="text-xs text-ink-muted mt-0.5">
                            {item.itemType}
                          </div>
                          <div className="text-sm font-semibold text-emerald-700 mt-1">
                            {item.unitPrice.toLocaleString('vi-VN')} đ
                          </div>
                          {!item.available && (
                            <span className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-medium">
                              <AlertCircle size={12} /> Hết hàng hoặc tạm ngừng
                            </span>
                          )}
                        </div>

                        {/* Bộ chỉnh số lượng */}
                        <div className="flex items-center gap-1 border border-line rounded-lg p-0.5 bg-gray-50 shrink-0">
                          <button
                            type="button"
                            disabled={updateMutation.isPending || item.quantity <= 1}
                            onClick={() => handleQuantityChange(item, -1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white rounded cursor-pointer disabled:opacity-40 transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-ink">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={updateMutation.isPending || !item.available}
                            onClick={() => handleQuantityChange(item, 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white rounded cursor-pointer disabled:opacity-40 transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Thành tiền & Nút xóa */}
                        <div className="text-right shrink-0 min-w-20">
                          <div className="text-sm font-bold text-ink">
                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.cartItemId)}
                            className="text-xs text-gray-400 hover:text-red-500 mt-1.5 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Thanh tóm tắt thanh toán bên phải */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs sticky top-20 space-y-4">
            <h3 className="font-bold text-base text-ink pb-3 border-b border-line">
              Tóm tắt đơn hàng
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Số lượng đã chọn:</span>
                <span className="font-semibold text-ink">{totalCount} món</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Tạm tính hàng:</span>
                <span className="font-semibold text-ink">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-ink-muted text-xs">
                <span>Phí vận chuyển:</span>
                <span className="italic text-gray-400">Tính ở bước thanh toán</span>
              </div>
            </div>

            <div className="pt-3 border-t border-line flex justify-between items-baseline">
              <span className="font-bold text-ink">Tổng ước tính:</span>
              <span className="text-xl font-black text-emerald-700">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <Button
              variant="primary"
              disabled={selectedItemIds.size === 0}
              onClick={handleProceedToCheckout}
              className="w-full justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
            >
              Tiến hành thanh toán
              <ArrowRight size={16} />
            </Button>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Nông sản tươi từ vườn, cam kết chất lượng & hoàn tiền nếu hư hỏng.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
