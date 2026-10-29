import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Store,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import { useCartOperations } from '../hooks/useCartOperations'
import { CartItemRow } from './CartItemRow'
import { CartDeleteModal } from './CartDeleteModal'
import { money } from '@/mocks/catalog'

export const CartView: React.FC = () => {
  const navigate = useNavigate()
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Tiêu đề & Chọn tất cả */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Giỏ hàng của bạn</h1>
          <span className="text-sm text-ink-muted">
            {totalAllCount} sản phẩm trong giỏ
          </span>
        </div>

        {totalAllCount > 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-ink">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-[#326318] focus:ring-[#326318] border-stone-300 cursor-pointer"
              checked={isAllMasterSelected}
              onChange={toggleSelectAll}
            />
            <span>Chọn tất cả ({totalAllCount} món)</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Danh sách items phân nhóm theo shop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông báo đa nhà vườn nếu có */}
          {cart.shopCarts.length > 1 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-800 text-xs">
              <Store size={18} className="shrink-0 mt-0.5 text-emerald-700" />
              <div>
                <strong className="block text-sm font-semibold mb-0.5">
                  Đơn hàng gồm nông sản từ {cart.shopCarts.length} nhà vườn khác nhau
                </strong>
                <p className="text-emerald-700 leading-relaxed">
                  Để đảm bảo nông sản luôn tươi mới tận tay bạn, từng nhà vườn sẽ đóng gói và bàn giao cho shipper vận chuyển theo các kiện riêng biệt.
                </p>
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
                className="bg-white rounded-2xl border border-line p-5 shadow-xs space-y-4"
              >
                {/* Header nhà vườn */}
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isShopAllSelected}
                      onChange={() => toggleSelectShop(shop.items)}
                      className="w-4 h-4 rounded text-[#326318] focus:ring-[#326318] accent-[#326318] cursor-pointer"
                      aria-label={`Chọn tất cả sản phẩm của ${shop.shopName}`}
                    />
                    <Link
                      to={`/cua-hang/${shop.shopId}`}
                      className="flex items-center gap-2 group cursor-pointer hover:underline"
                      title={`Xem gian hàng ${shop.shopName}`}
                    >
                      <Store size={18} className="text-[#326318] group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-ink text-sm group-hover:text-[#326318] transition-colors">
                        {shop.shopName}
                      </span>
                      <ChevronRight size={15} className="text-stone-400 group-hover:text-[#326318] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>
                  <span className="text-xs text-ink-muted">
                    {shop.items.length} món
                  </span>
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
          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs sticky top-20 space-y-4">
            <h3 className="font-bold text-base text-ink pb-3 border-b border-line">
              Tóm tắt đơn hàng
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Số lượng đã chọn:</span>
                <span className="font-semibold text-ink">{totalSelectedCount} món</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Tạm tính hàng:</span>
                <span className="font-semibold text-ink">{money(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-ink-muted text-xs">
                <span>Phí vận chuyển:</span>
                <span className="italic text-gray-400">Tính ở bước thanh toán</span>
              </div>
            </div>

            <div className="pt-3 border-t border-line flex justify-between items-baseline">
              <span className="font-bold text-ink">Tổng ước tính:</span>
              <span className="text-xl font-black text-[#326318]">
                {money(totalAmount)}
              </span>
            </div>

            <Button
              variant="primary"
              disabled={selectedItemIds.size === 0 || isUpdating || isRemoving}
              onClick={handleProceedToCheckout}
              className="w-full justify-center gap-2 py-3 bg-[#326318] hover:bg-[#254b12] text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
            >
              Tiến hành thanh toán ({money(totalAmount)})
              <ArrowRight size={16} />
            </Button>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
              <ShieldCheck size={16} className="text-[#326318] shrink-0" />
              <span>Nông sản tươi từ vườn, cam kết chất lượng & hoàn tiền nếu hư hỏng.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa sản phẩm */}
      <CartDeleteModal
        item={deletingItem}
        isDeleting={isRemoving}
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}
