import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Store,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import { useCartOperations } from '../hooks/useCartOperations'
import { CartItemRow } from './CartItemRow'
import { money } from '@/mocks/catalog'

export const CartView: React.FC = () => {
  const navigate = useNavigate()
  const [confirmingShopId, setConfirmingShopId] = React.useState<number | null>(null)
  const [isConfirmingClearAll, setIsConfirmingClearAll] = React.useState(false)
  const {
    cart,
    isLoading,
    isError,
    refetch,
    selectedItemIds,
    toggleSelect,
    toggleSelectShop,
    toggleSelectAll,
    isAllMasterSelected,
    totalAmount,
    totalSelectedCount,
    totalAllCount,
    editingQuantities,
    isItemUpdating,
    isShopRemoving,
    handleRemoveShop,
    handleClearAllCart,
    handleQuantityChange,
    handleDirectQuantityChange,
    handleCommitQuantity,
    commitAllPendingQuantities,
    handleRemove,
    deletingItem,
    setDeletingItem,
    confirmDeleteItem,
    isRemoving,
    isUpdating,
  } = useCartOperations()

  const handleProceedToCheckout = () => {
    commitAllPendingQuantities()
    if (isUpdating || isRemoving) return
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

  const isEmpty =
    !cart?.shopCarts ||
    cart.shopCarts.length === 0 ||
    cart.shopCarts.every((s) => s.items.length === 0)

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
    <div className="max-w-5xl mx-auto px-4 py-5">
      {/* Tiêu đề & Chọn tất cả */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Giỏ hàng của bạn</h1>
          <span className="text-xs text-ink-muted">
            {totalAllCount} sản phẩm trong giỏ
          </span>
        </div>

        {totalAllCount > 0 && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-ink">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-[#326318] focus:ring-[#326318] border-stone-300 cursor-pointer"
                checked={isAllMasterSelected}
                onChange={toggleSelectAll}
              />
              <span>Chọn tất cả ({totalAllCount} món)</span>
            </label>

            <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
              {selectedItemIds.size > 0 && (
                <span className="text-xs text-[#326318] font-bold bg-[#e8f3de] px-2.5 py-0.5 rounded-full">
                  Đã chọn {totalSelectedCount} món
                </span>
              )}
              <span className="text-stone-200 select-none">|</span>
              {isConfirmingClearAll ? (
                <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg animate-fadeIn">
                  <span>Xác nhận xóa sạch toàn bộ giỏ?</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleClearAllCart()
                      setIsConfirmingClearAll(false)
                    }}
                    disabled={isRemoving}
                    className="font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
                  >
                    Xóa
                  </button>
                  <span className="text-red-300">|</span>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClearAll(false)}
                    className="text-stone-500 hover:text-stone-700 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingClearAll(true)}
                  disabled={isRemoving}
                  className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium disabled:opacity-40"
                  title="Xóa sạch toàn bộ sản phẩm trong giỏ hàng"
                >
                  <Trash2 size={14} />
                  <span>Xóa sạch toàn bộ</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Danh sách items phân nhóm theo shop */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Thông báo đa nhà vườn nếu có */}
          {cart.shopCarts.length > 1 && (
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-emerald-800 text-xs">
              <Store size={15} className="shrink-0 text-emerald-700" />
              <div className="flex-1 leading-snug">
                <span className="font-semibold">Đơn hàng gồm nông sản từ {cart.shopCarts.length} nhà vườn:</span>{' '}
                <span className="text-emerald-700">Từng nhà vườn sẽ đóng gói và giao kiện riêng để đảm bảo độ tươi mới.</span>
              </div>
            </div>
          )}

          {cart.shopCarts.map((shop) => {
            const availableItems = shop.items.filter(
              (i) => i.available !== false && (i as any).isAvailable !== false,
            )
            const isShopAllSelected =
              availableItems.length > 0 &&
              availableItems.every((i) => selectedItemIds.has(i.cartItemId))

            const shopSubtotal = shop.items.reduce(
              (sum, i) =>
                selectedItemIds.has(i.cartItemId) ? sum + i.unitPrice * i.quantity : sum,
              0,
            )

            return (
              <div
                key={shop.shopId}
                className="bg-white rounded-xl border border-line p-3.5 sm:p-4 shadow-xs space-y-3"
              >
                {/* Header nhà vườn */}
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-line">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isShopAllSelected}
                      onChange={() => toggleSelectShop(shop.items)}
                      className="w-4 h-4 rounded text-[#326318] focus:ring-[#326318] accent-[#326318] cursor-pointer shrink-0"
                      aria-label={`Chọn tất cả sản phẩm của ${shop.shopName}`}
                    />
                    <Link
                      to={`/cua-hang/${shop.shopId}`}
                      className="flex items-center gap-2 group cursor-pointer hover:underline min-w-0"
                      title={`Xem gian hàng ${shop.shopName}`}
                    >
                      <Store size={18} className="text-[#326318] group-hover:scale-110 transition-transform shrink-0" />
                      <span className="font-semibold text-ink text-sm group-hover:text-[#326318] transition-colors truncate">
                        {shop.shopName}
                      </span>
                      <ChevronRight size={15} className="text-stone-400 group-hover:text-[#326318] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                    <span className="text-xs text-ink-muted whitespace-nowrap">
                      {shop.items.length} món
                    </span>
                    <span className="text-stone-200 select-none">|</span>
                    {confirmingShopId === shop.shopId ? (
                      <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg animate-fadeIn whitespace-nowrap">
                        <span>Xác nhận xóa hết {shop.items.length} món?</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveShop(shop.items, shop.shopName)
                            setConfirmingShopId(null)
                          }}
                          disabled={isShopRemoving(shop.items)}
                          className="font-bold text-red-700 hover:text-red-900 underline cursor-pointer whitespace-nowrap"
                        >
                          Xóa
                        </button>
                        <span className="text-red-300">|</span>
                        <button
                          type="button"
                          onClick={() => setConfirmingShopId(null)}
                          className="text-stone-500 hover:text-stone-700 cursor-pointer whitespace-nowrap"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingShopId(shop.shopId)}
                        disabled={isRemoving || isShopRemoving(shop.items)}
                        className="text-stone-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-40 whitespace-nowrap"
                        title={`Xóa tất cả ${shop.items.length} món của ${shop.shopName}`}
                        aria-label={`Xóa tất cả sản phẩm của ${shop.shopName}`}
                      >
                        {isShopRemoving(shop.items) ? (
                          <Loader2 size={14} className="animate-spin text-red-500" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>Xóa toàn bộ shop</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Danh sách món của shop */}
                <div className="divide-y divide-line">
                  {shop.items.map((item) => (
                    <CartItemRow
                      key={item.cartItemId}
                      item={item}
                      compact={false}
                      isSelected={selectedItemIds.has(item.cartItemId)}
                      isUpdating={isItemUpdating(item.cartItemId)}
                      editingQuantity={editingQuantities[item.cartItemId]}
                      onToggleSelect={toggleSelect}
                      onQuantityChange={handleQuantityChange}
                      onDirectQuantityChange={handleDirectQuantityChange}
                      onCommitQuantity={handleCommitQuantity}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>

                {/* Tạm tính của từng shop */}
                {shopSubtotal > 0 && (
                  <div className="pt-2 border-t border-line flex justify-between items-center text-xs text-ink-muted">
                    <span>Tạm tính nhà vườn:</span>
                    <strong className="text-sm font-bold text-[#326318]">
                      {money(shopSubtotal)}
                    </strong>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Thanh tóm tắt thanh toán bên phải */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-line p-4 shadow-xs sticky top-20 space-y-3">
            <h3 className="font-bold text-sm text-ink pb-2.5 border-b border-line">
              Tóm tắt đơn hàng
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>Số lượng đã chọn:</span>
                <span className="font-semibold text-ink">{totalSelectedCount} món</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Tạm tính hàng:</span>
                <span className="font-semibold text-ink">{money(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-ink-muted text-[11px]">
                <span>Phí vận chuyển:</span>
                <span className="italic text-gray-400">Tính ở bước thanh toán</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-line flex justify-between items-baseline">
              <span className="font-bold text-xs text-ink">Tổng ước tính:</span>
              <span className="text-lg font-black text-[#326318]">
                {money(totalAmount)}
              </span>
            </div>

            <Button
              variant="primary"
              disabled={selectedItemIds.size === 0 || isUpdating || isRemoving}
              onClick={handleProceedToCheckout}
              className="w-full justify-center gap-1.5 py-2.5 bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
            >
              Tiến hành thanh toán ({money(totalAmount)})
              <ArrowRight size={14} />
            </Button>

            <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
              <ShieldCheck size={14} className="text-[#326318] shrink-0" />
              <span>Nông sản tươi từ vườn, cam kết hoàn tiền nếu hư hỏng.</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
