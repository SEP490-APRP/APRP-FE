import React, { useState } from 'react'
import {
  Package,
  Boxes,
  ShoppingCart,
  Building2,
  ShoppingBag,
  ChevronRight,
  AlertTriangle,
  Plus,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  UtensilsCrossed,
  RotateCcw,
} from 'lucide-react'
import {
  ShopPageHeader,
  getOrderStatusConfig,
  useShopOrders,
  useShopProfile,
  useConfirmOrder,
  useReadyOrder,
  useCancelOrder,
} from '@/features/shop'
import { useMyProducts, useMyCombos } from '@/features/product'
import { useMyMysteryBoxes } from '@/features/mystery-box'
import { formatMealType } from '@/services/combo.types'
import { globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage } from '@/utils'
import type { FarmerProduct, FarmerOrder } from './types'

interface DashboardProps {
  products?: FarmerProduct[]
  orders?: FarmerOrder[]
  onNavigate: (tab: string) => void
  onOpenAddProduct: () => void
  onInfo?: (msg: string) => void
}

export default function Dashboard({ onNavigate, onOpenAddProduct, onInfo }: DashboardProps) {
  const [productTab, setProductTab] = useState<'NONG_SAN' | 'COMBO' | 'BLIND_BOX'>('NONG_SAN')
  const [actionOrderId, setActionOrderId] = useState<number | null>(null)

  const confirmMutation = useConfirmOrder()
  const readyMutation = useReadyOrder()
  const cancelMutation = useCancelOrder()

  const handleQuickConfirm = async (orderId: number) => {
    setActionOrderId(orderId)
    try {
      await confirmMutation.mutateAsync(orderId)
      onInfo?.(`Đã nhận và xác nhận đơn hàng #${orderId}!`)
    } catch (err: unknown) {
      onInfo?.(getErrorMessage(err, 'Có lỗi khi xác nhận đơn hàng.'))
    } finally {
      setActionOrderId(null)
    }
  }

  const handleQuickReady = async (orderId: number) => {
    setActionOrderId(orderId)
    try {
      await readyMutation.mutateAsync(orderId)
      onInfo?.(`Đơn hàng #${orderId} đã chuyển sang Sẵn sàng giao! Shipper đã có thể nhận đơn.`)
    } catch (err: unknown) {
      onInfo?.(getErrorMessage(err, 'Có lỗi khi cập nhật trạng thái sẵn sàng giao.'))
    } finally {
      setActionOrderId(null)
    }
  }

  const handleQuickCancel = async (orderId: number) => {
    const confirmed = await globalShowConfirm(
      'Xác nhận hủy đơn',
      `Bạn có chắc chắn muốn hủy đơn hàng #${orderId}? Số lượng nông sản sẽ được hoàn lại kho.`,
      { confirmText: 'Hủy đơn', cancelText: 'Quay lại', danger: true },
    )
    if (!confirmed) return
    setActionOrderId(orderId)
    try {
      await cancelMutation.mutateAsync(orderId)
      onInfo?.(`Đã hủy đơn hàng #${orderId}.`)
    } catch (err: unknown) {
      onInfo?.(getErrorMessage(err, 'Có lỗi khi hủy đơn hàng.'))
    } finally {
      setActionOrderId(null)
    }
  }

  // Real data queries from API
  const { data: shopOrdersData, isLoading: isLoadingOrders } = useShopOrders({ page: 0, size: 50 })
  const { data: myProductsData, isLoading: isLoadingProducts } = useMyProducts({ size: 100 })
  const { data: myCombosData, isLoading: isLoadingCombos } = useMyCombos({ page: 1, size: 100 })
  const { data: myBoxesData, isLoading: isLoadingBoxes } = useMyMysteryBoxes(1, 100)
  const { data: shopProfile } = useShopProfile()

  // Real orders list (filter out AWAITING_PAYMENT)
  const realOrders = (shopOrdersData?.content || []).filter((o) => o.status !== 'AWAITING_PAYMENT')
  const totalOrdersCount = shopOrdersData?.totalElements ?? realOrders.length
  const pendingOrdersCount = realOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PAID',
  ).length

  // Sắp xếp đơn hàng: Đơn cần nhận (PENDING/PAID) -> đang chuẩn bị (CONFIRMED) -> mới nhất lên trước
  const sortedOrders = [...realOrders].sort((a, b) => {
    const rank = (s?: string) => (s === 'PENDING' || s === 'PAID' ? 0 : s === 'CONFIRMED' ? 1 : 2)
    const diff = rank(a.status) - rank(b.status)
    if (diff !== 0) return diff
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return timeB - timeA
  })

  // Real products, combos, blind boxes
  const freshProducts = myProductsData?.content || []
  const combos = myCombosData?.content || []
  const blindBoxes = myBoxesData?.content || []

  const activeFreshCount = freshProducts.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'APPROVED',
  ).length
  const totalItemsCount = freshProducts.length + combos.length + blindBoxes.length

  // Financial calculations from real orders
  const completedOrders = realOrders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED',
  )
  const completedRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  const shippingOrPendingOrders = realOrders.filter(
    (o) =>
      o.status === 'SHIPPING' ||
      o.status === 'READY' ||
      o.status === 'CONFIRMED' ||
      o.status === 'PAID',
  )
  const pendingSettlementRevenue = shippingOrPendingOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0,
  )

  const totalSalesRevenue = realOrders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  const getProductStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'APPROVED':
        return { label: 'Đang bán', color: 'bg-[#eaf5e1] text-[#326318] border-[#b8e19c]' }
      case 'PENDING':
        return { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-800 border-amber-200' }
      case 'REJECTED':
        return { label: 'Bị từ chối', color: 'bg-rose-50 text-rose-800 border-rose-200' }
      default:
        return { label: 'Tạm dừng', color: 'bg-gray-100 text-gray-600 border-gray-200' }
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <ShopPageHeader
        title="Tổng Quan Gian Hàng"
        subtitle="Theo dõi nhanh đơn hàng cần xử lý, nông sản đang bán và đánh giá của nhà vườn hôm nay"
      />

      {/* Cảnh báo Cờ rủi ro chất lượng cho Shop */}
      {shopProfile?.activeRiskFlags !== undefined && shopProfile.activeRiskFlags >= 3 && (
        <div className="p-5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="shrink-0 text-rose-600 mt-1" size={22} />
          <div className="flex-1 text-sm">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-base">
              <span>Cảnh báo chất lượng: Gian hàng đang tích lũy {shopProfile.activeRiskFlags} Cờ Rủi Ro</span>
              <span className="text-xs bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-extrabold uppercase">
                Bị áp dụng hình phạt
              </span>
            </div>
            <p className="mt-1 text-rose-700 leading-relaxed">
              Gian hàng của bạn đã có từ 3 khiếu nại giao hàng hỏng được Admin xác nhận. Hệ thống đã <strong>tự động trừ 1.0 sao</strong> trên điểm đánh giá công khai (hiện còn {shopProfile.ratingAverage || 0} sao) và <strong>giảm độ ưu tiên hiển thị sản phẩm</strong> của gian hàng trên sàn.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => onNavigate('disputes')}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                Xem chi tiết khiếu nại &amp; Thu hồi hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {shopProfile?.activeRiskFlags !== undefined && shopProfile.activeRiskFlags > 0 && shopProfile.activeRiskFlags < 3 && (
        <div className="p-5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="shrink-0 text-amber-600 mt-1" size={22} />
          <div className="flex-1 text-sm">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-base">
              <span>Cảnh báo vi phạm giao hàng hỏng ({shopProfile.activeRiskFlags}/3 Cờ Rủi Ro)</span>
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold uppercase">
                Cảnh báo chất lượng
              </span>
            </div>
            <p className="mt-1 text-amber-700 leading-relaxed">
              Gian hàng vừa có khiếu nại về hàng dập nát/hỏng được Admin phê duyệt (gắn 1 Risk Flag). Nếu tích lũy đủ 3 cờ rủi ro, gian hàng sẽ bị trừ 1 sao đánh giá công khai và giảm độ ưu tiên hiển thị trên sàn. Vui lòng đóng gói cẩn thận nông sản khi bàn giao shipper.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => onNavigate('disputes')}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                Kiểm tra mục khiếu nại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 KPI Cards Grid (Dữ liệu thực từ API) */}
      <div
        id="tour-overview-stats"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* 1. Tổng đơn hàng (Clickable card dẫn sang tab đơn hàng) */}
        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="bg-white rounded-lg p-5 border border-[#e8ece3] shadow-2xs flex flex-col justify-between text-left hover:border-[#326318] hover:shadow-xs transition-all cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
              TỔNG ĐƠN HÀNG
            </span>
            <ChevronRight size={16} className="text-[#9ca3af] group-hover:text-[#326318] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="my-3">
            <span className="text-3xl sm:text-4xl font-black text-[#1c2216]">
              {isLoadingOrders ? '...' : totalOrdersCount}
            </span>
            {pendingOrdersCount > 0 ? (
              <p className="text-xs sm:text-sm text-[#b45309] font-black mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>{pendingOrdersCount} đơn cần xử lý ngay →</span>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-[#326318] font-bold mt-1.5">
                Tất cả đơn đã được xử lý
              </p>
            )}
          </div>
        </button>

        {/* 2. Nông sản đang bán (Clickable card) */}
        <button
          type="button"
          onClick={() => onNavigate('products')}
          className="bg-white rounded-lg p-5 border border-[#e8ece3] shadow-2xs flex flex-col justify-between text-left hover:border-[#326318] hover:shadow-xs transition-all cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
              SẢN PHẨM ĐANG BÁN
            </span>
            <ChevronRight size={16} className="text-[#9ca3af] group-hover:text-[#326318] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="my-3">
            <span className="text-3xl sm:text-4xl font-black text-[#1c2216]">
              {isLoadingProducts ? '...' : activeFreshCount}
            </span>
            <p className="text-xs sm:text-sm text-[#326318] font-bold mt-1.5">
              {freshProducts.length} nông sản trong kho
            </p>
          </div>
        </button>

        {/* 3. Combo & Túi mù (Clickable card) */}
        <button
          type="button"
          onClick={() => onNavigate('combos')}
          className="bg-white rounded-lg p-5 border border-[#e8ece3] shadow-2xs flex flex-col justify-between text-left hover:border-[#8a4e1d] hover:shadow-xs transition-all cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
              COMBO &amp; TÚI MÙ
            </span>
            <ChevronRight size={16} className="text-[#9ca3af] group-hover:text-[#8a4e1d] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="my-3">
            <span className="text-3xl sm:text-4xl font-black text-[#1c2216]">
              {isLoadingCombos || isLoadingBoxes ? '...' : combos.length + blindBoxes.length}
            </span>
            <p className="text-xs sm:text-sm text-[#8a4e1d] font-bold mt-1.5">
              {blindBoxes.length} túi mù · {combos.length} combo
            </p>
          </div>
        </button>

        {/* 4. Đánh giá từ khách (Thay thế vị trí thông tin tĩnh bằng chỉ số uy tín thiết thực) */}
        <button
          type="button"
          onClick={() => onNavigate('reviews')}
          className="bg-white rounded-lg p-5 border border-[#e8ece3] shadow-2xs flex flex-col justify-between text-left hover:border-[#ca8a04] hover:shadow-xs transition-all cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
              ĐÁNH GIÁ TỪ KHÁCH
            </span>
            <ChevronRight size={16} className="text-[#9ca3af] group-hover:text-[#ca8a04] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="my-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#ca8a04]">
                {Number(shopProfile?.rating || 4.8).toFixed(1)}
              </span>
              <Star size={24} className="text-[#eab308] fill-[#eab308]" />
              <span className="text-sm font-bold text-[#6b7280]">/ 5.0</span>
            </div>
            <p className="text-xs sm:text-sm text-[#4b5563] font-bold mt-1.5">
              Được tin chọn bởi khách mua
            </p>
          </div>
        </button>
      </div>

      {/* Main 2-Column Grid: Products Table + Orders Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Quản Lý Sản Phẩm Thực Tế */}
        <div
          id="tour-overview-products"
          className="lg:col-span-2 bg-white rounded-lg p-5 sm:p-6 border border-[#e8ece3] shadow-2xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1f4ed]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#326318]/10 flex items-center justify-center text-[#326318]">
                <Package size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#1c2216] uppercase tracking-tight">
                QUẢN LÝ SẢN PHẨM ({totalItemsCount})
              </h3>
            </div>

            {/* Nút Đăng Bán Nông Sản Mới to bản, nổi bật, dễ bấm cho người lớn tuổi */}
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="bg-[#2b5619] hover:bg-[#1e3d12] text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={16} className="text-[#ffea79]" />
              <span> ĐĂNG BÁN NÔNG SẢN MỚI</span>
            </button>
          </div>

          {/* Sub-tabs: NÔNG SẢN | COMBO | HỘP MÙ */}
          <div className="flex items-center border-b border-[#e8ece3] gap-1">
            <button
              type="button"
              onClick={() => setProductTab('NONG_SAN')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${productTab === 'NONG_SAN'
                  ? 'border-[#326318] text-[#326318] bg-[#326318]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
                }`}
            >
              Nông sản ({freshProducts.length})
            </button>

            <button
              type="button"
              onClick={() => setProductTab('COMBO')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${productTab === 'COMBO'
                  ? 'border-[#195962] text-[#195962] bg-[#195962]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
                }`}
            >
              Combo ({combos.length})
            </button>

            <button
              type="button"
              onClick={() => setProductTab('BLIND_BOX')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${productTab === 'BLIND_BOX'
                  ? 'border-[#8a4e1d] text-[#8a4e1d] bg-[#8a4e1d]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
                }`}
            >
              Túi Mù ({blindBoxes.length})
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-xs font-bold text-[#4B5563] uppercase tracking-wider px-3 py-1.5 bg-[#f4f7f1] rounded-lg mb-1">
            <div className="col-span-5">SẢN PHẨM</div>
            <div className="col-span-3 text-center">GIÁ BÁN</div>
            <div className="col-span-2 text-center">TỒN KHO</div>
            <div className="col-span-2 text-right">TRẠNG THÁI</div>
          </div>

          {/* Table Rows */}
          {isLoadingProducts || isLoadingCombos || isLoadingBoxes ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 size={24} className="animate-spin text-[#326318]" />
              <span className="text-xs font-medium">Đang tải danh sách mặt hàng...</span>
            </div>
          ) : productTab === 'NONG_SAN' ? (
            freshProducts.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs bg-[#fafcf9] rounded-lg border border-dashed border-[#e2e8dc]">
                Chưa có nông sản nào trong kho. Hãy bấm &quot;+ ĐĂNG BÁN NÔNG SẢN MỚI&quot; để đăng bán!
              </div>
            ) : (
              <div className="space-y-2">
                {freshProducts.slice(0, 5).map((item) => {
                  const pId = item.productId || item.id
                  const pName = item.productName || item.name || 'Nông sản'
                  const pPrice = Number(item.sellingPrice || item.price || 0)
                  const pStock = Number(item.stockQuantity || item.stock || 0)
                  const pUnit = item.unit || 'kg'
                  const primaryImg =
                    item.images?.find((img) => img.isPrimary)?.imageUrl ||
                    item.images?.[0]?.imageUrl ||
                    item.imageUrl ||
                    item.image ||
                    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=150&q=80'
                  const statusBadge = getProductStatusBadge(item.status)

                  return (
                    <div
                      key={pId}
                      className="grid grid-cols-12 items-center p-3 sm:p-3.5 rounded-lg bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                    >
                      <div className="col-span-5 flex items-center gap-2.5">
                        <img
                          src={primaryImg}
                          alt={pName}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-gray-200"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#1c2216] truncate">
                            {pName}
                          </div>
                          <span className="text-xs font-semibold text-[#4B5563]">
                            {typeof item.category === 'object' && item.category !== null
                              ? item.category.name
                              : 'Nông sản vườn'}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-3 text-center">
                        <span className="text-sm sm:text-base font-black text-[#2b5619]">
                          {pPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <div className="col-span-2 text-center text-xs sm:text-sm font-bold text-[#1c2216]">
                        {pStock} {pUnit}
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
                        >
                          <span>{statusBadge.label}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : productTab === 'COMBO' ? (
            combos.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs bg-[#fafcf9] rounded-lg border border-dashed border-[#e2e8dc]">
                Chưa có combo nào. Hãy vào Quản lý sản phẩm để tạo combo món ăn tiện lợi!
              </div>
            ) : (
              <div className="space-y-2">
                {combos.slice(0, 5).map((combo) => {
                  const statusBadge = getProductStatusBadge(combo.status)
                  return (
                    <div
                      key={combo.comboId}
                      className="grid grid-cols-12 items-center p-3 sm:p-3.5 rounded-lg bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        {combo.imageUrl ? (
                          <img
                            src={combo.imageUrl}
                            alt={combo.comboName}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#195962]/10 text-[#195962] flex items-center justify-center font-bold shrink-0">
                            <UtensilsCrossed size={20} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold text-[#1c2216] truncate">
                            {combo.comboName}
                          </div>
                          <div className="mt-0.5">
                            <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded bg-[#e8ede4] text-[#2b5619]">
                              {formatMealType(combo.mealType || combo.type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-3 text-center">
                        <span className="text-sm sm:text-base font-black text-[#195962]">
                          {combo.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <div className="col-span-2 text-center text-xs sm:text-sm font-bold text-[#1c2216]">
                        {combo.totalQuantity} combo
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${statusBadge.color}`}
                        >
                          <span>{statusBadge.label}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : blindBoxes.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs bg-[#fafcf9] rounded-lg border border-dashed border-[#e2e8dc]">
              Chưa có túi mù nào. Hãy bấm tạo Túi Mù để giải cứu nhanh cuối ngày!
            </div>
          ) : (
            <div className="space-y-2">
              {blindBoxes.slice(0, 5).map((box) => (
                <div
                  key={box.mysteryId || box.id}
                  className="grid grid-cols-12 items-center p-3 sm:p-3.5 rounded-lg bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                >
                  <div className="col-span-5 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-[#8a4e1d]/10 text-[#8a4e1d] flex items-center justify-center font-bold text-base shrink-0">
                      🎁
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#1c2216] truncate">
                        {box.boxType}
                      </div>
                      <span className="text-xs font-semibold text-[#4B5563]">Túi mù giải cứu</span>
                    </div>
                  </div>

                  <div className="col-span-3 text-center">
                    <span className="text-sm sm:text-base font-black text-[#8a4e1d]">
                      {box.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="col-span-2 text-center text-xs sm:text-sm font-bold text-[#1c2216]">
                    {box.totalQuantity || 0} hộp
                  </div>

                  <div className="col-span-2 flex items-center justify-end">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                        box.isActive
                          ? 'bg-[#eaf5e1] text-[#326318] border-[#b8e19c]'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                    >
                      <span>{box.isActive ? 'Đang mở' : 'Tạm dừng'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs sm:text-sm font-black text-[#2b5619] hover:underline uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 mx-auto py-2"
            >
              <span>Xem Toàn Bộ Sản Phẩm Trong Kho ({totalItemsCount})</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column: Quản Lý Đơn Hàng Thực Tế */}
        <div
          id="tour-overview-orders"
          className="bg-white rounded-lg p-5 sm:p-6 border border-[#e8ece3] shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-[#f1f4ed]">
            <div className="w-8 h-8 rounded-lg bg-[#2b5619]/10 flex items-center justify-center text-[#2b5619]">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1c2216] uppercase tracking-tight">
                ĐƠN HÀNG MỚI NHẤT
              </h3>
              <p className="text-xs font-semibold text-[#4B5563]">
                {pendingOrdersCount > 0
                  ? `Có ${pendingOrdersCount} đơn cần xác nhận & đóng gói`
                  : 'Cập nhật từ hệ thống'}
              </p>
            </div>
          </div>

          {isLoadingOrders ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 size={24} className="animate-spin text-[#2b5619]" />
              <span className="text-xs font-medium">Đang tải đơn hàng...</span>
            </div>
          ) : sortedOrders.length > 0 ? (
            <div className="space-y-2.5">
              {sortedOrders.slice(0, 4).map((ord) => {
                const ordId = Number((ord as any).orderId ?? ord.id)
                const recipient = (ord as any).recipientName || ord.buyerName || 'Khách hàng'
                const statusBadge = getOrderStatusConfig(ord.status)
                const isNeedsAction = ord.status === 'PENDING' || ord.status === 'PAID'
                const isConfirmed = ord.status === 'CONFIRMED'
                const isRefundRequested = ord.status === 'REFUND_REQUESTED'
                const isActingOnThis = actionOrderId === ordId
                const formattedTime = ord.createdAt
                  ? new Date(ord.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) +
                  ' · ' +
                  new Date(ord.createdAt).toLocaleDateString('vi-VN')
                  : 'Vừa xong'

                return (
                  <div
                    key={ordId}
                    className={`p-3.5 rounded-lg border transition-all space-y-2 ${
                      isNeedsAction
                        ? 'border-amber-300 bg-amber-50/50 shadow-2xs ring-1 ring-amber-300/60'
                        : isConfirmed
                          ? 'border-[#b8e19c] bg-[#f7faf5] shadow-2xs'
                          : 'border-[#edf1e8] bg-[#fafcf9] hover:border-[#2b5619]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-[#1c2216]">#{ordId}</span>
                        {isNeedsAction && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>Cần nhận</span>
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-[#1c2216] font-bold truncate">
                      {recipient}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-[#4B5563] text-xs font-medium flex items-center gap-1.5">
                        <Clock size={13} className="text-[#6b7280]" />
                        <span>{formattedTime}</span>
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#2b5619]">
                        {Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {/* Quick Action Buttons cho đơn cần xác nhận (PENDING / PAID) */}
                    {isNeedsAction && (
                      <div className="pt-2 flex items-center gap-2 border-t border-[#f0f3eb] mt-1">
                        <button
                          type="button"
                          disabled={isActingOnThis}
                          onClick={() => handleQuickConfirm(ordId)}
                          className="flex-1 bg-[#2b5619] hover:bg-[#1e3d12] text-white font-black text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {isActingOnThis && confirmMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                          <span>Nhận đơn</span>
                        </button>
                        <button
                          type="button"
                          disabled={isActingOnThis}
                          onClick={() => handleQuickCancel(ordId)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50 transition-all"
                          title="Từ chối đơn hàng"
                        >
                          {isActingOnThis && cancelMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <XCircle size={15} />
                          )}
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}

                    {/* Quick Action Buttons cho đơn đang chuẩn bị (CONFIRMED -> READY) */}
                    {isConfirmed && (
                      <div className="pt-2 flex items-center gap-2 border-t border-[#e5efe0] mt-1">
                        <button
                          type="button"
                          disabled={isActingOnThis}
                          onClick={() => handleQuickReady(ordId)}
                          className="flex-1 bg-[#2b5619] hover:bg-[#1e3d12] text-white font-black text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {isActingOnThis && readyMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Boxes size={15} />
                          )}
                          <span>Sẵn sàng giao</span>
                        </button>
                        <button
                          type="button"
                          disabled={isActingOnThis}
                          onClick={() => handleQuickCancel(ordId)}
                          className="px-3 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50 transition-all"
                          title="Hủy đơn hàng"
                        >
                          {isActingOnThis && cancelMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <XCircle size={15} />
                          )}
                          <span>Hủy</span>
                        </button>
                      </div>
                    )}

                    {/* Shortcut xử lý yêu cầu trả hàng / hoàn tiền */}
                    {isRefundRequested && (
                      <div className="pt-2 border-t border-amber-200/70 mt-1">
                        <button
                          type="button"
                          onClick={() => onNavigate('disputes')}
                          className="w-full py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>Xử lý yêu cầu trả hàng</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 px-4 rounded-lg bg-[#fafcf9] border border-dashed border-[#dce2d6] text-center flex flex-col items-center justify-center gap-2">
              <ShoppingBag size={28} className="text-[#a4ad9f]" />
              <p className="text-xs font-bold text-[#717a6c]">Chưa có đơn hàng nào.</p>
              <span className="text-xs text-[#9ba495]">Đơn mới sẽ xuất hiện tại đây</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="w-full py-3.5 rounded-lg bg-[#2b5619] hover:bg-[#1e3d12] text-white font-black text-xs sm:text-sm uppercase tracking-wide shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingCart size={16} />
            <span>Xem Tất Cả Đơn Hàng ({totalOrdersCount})</span>
          </button>
        </div>
      </div>

      {/* Bottom Card: Chi Tiết Tài Chính Thực Tế (Tính từ đơn hàng) */}
      <div
        id="tour-overview-finance-cards"
        className="bg-white rounded-lg p-5 sm:p-6 border border-[#e8ece3] shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2b5619]/10 flex items-center justify-center text-[#2b5619]">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1c2216] uppercase tracking-tight">
                TỔNG QUAN TÀI CHÍNH GIAN HÀNG
              </h3>
              <p className="text-xs font-semibold text-[#4B5563]">
                Dòng tiền thực tế tính toán từ các đơn hàng của gian hàng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('wallet')}
            className="text-xs sm:text-sm font-bold text-[#2b5619] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Chi tiết ví &amp; rút tiền</span>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 sm:p-5 rounded-lg bg-[#f7faf5] border border-[#e2ebd9]">
            <span className="text-xs sm:text-sm font-bold text-[#4B5563] uppercase tracking-wide">
              Doanh Thu Đã Hoàn Thành
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#2b5619] mt-1.5 whitespace-nowrap">
              {completedRevenue.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-xs text-[#4B5563] font-semibold mt-1 block">
              Từ {completedOrders.length} đơn hàng đã giao thành công
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-lg bg-[#fdfaf3] border border-[#f3e6cf]">
            <span className="text-xs sm:text-sm font-bold text-[#8a4e1d] uppercase tracking-wide">
              Tiền Sắp Về Ví
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#8a4e1d] mt-1.5 whitespace-nowrap">
              {pendingSettlementRevenue.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-xs text-[#4B5563] font-semibold mt-1 block">
              Từ {shippingOrPendingOrders.length} đơn hàng đang xử lý / vận chuyển
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-lg bg-[#f5f8fc] border border-[#d6e3f5]">
            <span className="text-xs sm:text-sm font-bold text-[#2d5c99] uppercase tracking-wide">
              Tổng Giá Trị Đơn Hàng
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#2d5c99] mt-1.5 whitespace-nowrap">
              {totalSalesRevenue.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-xs text-[#4B5563] font-semibold mt-1 block">
              Tổng doanh số tích lũy của gian hàng
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
