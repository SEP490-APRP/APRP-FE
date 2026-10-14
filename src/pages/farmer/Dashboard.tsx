import React, { useState } from 'react'
import {
  Package,
  ShoppingCart,
  Building2,
  ShoppingBag,
  ShieldCheck,
  Clock,
  Sparkles,
  UtensilsCrossed,
  Gift,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { useShopOrders, useShopProfile } from '@/features/shop'
import { useMyProducts, useMyCombos } from '@/features/product'
import { useMyMysteryBoxes } from '@/features/mystery-box'
import type { FarmerProduct, FarmerOrder } from './types'

interface DashboardProps {
  products?: FarmerProduct[]
  orders?: FarmerOrder[]
  onNavigate: (tab: string) => void
  onOpenAddProduct: () => void
}

export default function Dashboard({ onNavigate, onOpenAddProduct }: DashboardProps) {
  const [productTab, setProductTab] = useState<'NONG_SAN' | 'COMBO' | 'BLIND_BOX'>('NONG_SAN')

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

  // KYC and rating
  const isKycApproved = shopProfile?.status === 'ACTIVE'

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-800 border-amber-200' }
      case 'PAID':
        return { label: 'Đã thanh toán', color: 'bg-blue-50 text-blue-800 border-blue-200' }
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
      case 'READY':
        return { label: 'Đang chuẩn bị', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
      case 'SHIPPING':
        return { label: 'Đang giao', color: 'bg-sky-50 text-sky-800 border-sky-200' }
      case 'DELIVERED':
      case 'COMPLETED':
        return { label: 'Đã giao', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
      case 'CANCELLED':
        return { label: 'Đã hủy', color: 'bg-rose-50 text-rose-800 border-rose-200' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
    }
  }

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
    <div className="space-y-8 animate-fadeIn">
      {/* 4 KPI Cards Grid (Dữ liệu thực từ API) */}
      <div
        id="tour-overview-stats"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* 1. Tổng đơn hàng */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#7e8779] uppercase tracking-wider">
            TỔNG ĐƠN HÀNG
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#1c2216]">
              {isLoadingOrders ? '...' : totalOrdersCount}
            </span>
            <p className="text-[11px] text-[#326318] font-bold mt-1">
              {pendingOrdersCount > 0 ? `${pendingOrdersCount} đơn cần xử lý ngay` : 'Tất cả đơn đã được xử lý'}
            </p>
          </div>
        </div>

        {/* 2. Nông sản đang bán */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#7e8779] uppercase tracking-wider">
            SẢN PHẨM ĐANG BÁN
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#1c2216]">
              {isLoadingProducts ? '...' : activeFreshCount}
            </span>
            <p className="text-[11px] text-[#326318] font-bold mt-1">
              {freshProducts.length} nông sản trong kho
            </p>
          </div>
        </div>

        {/* 3. Combo & Túi mù */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#7e8779] uppercase tracking-wider">
            COMBO &amp; TÚI MÙ
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#1c2216]">
              {isLoadingCombos || isLoadingBoxes ? '...' : combos.length + blindBoxes.length}
            </span>
            <p className="text-[11px] text-[#8a4e1d] font-bold mt-1">
              {blindBoxes.length} túi mù · {combos.length} combo
            </p>
          </div>
        </div>

        {/* 4. Chất lượng shop / Xác thực VietGAP */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#7e8779] uppercase tracking-wider">
            CHẤT LƯỢNG GIAN HÀNG
          </div>
          <div className="my-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-[#326318]">
                {isKycApproved ? '100%' : 'Chờ duyệt'}
              </span>
              {isKycApproved && <ShieldCheck size={24} className="text-[#326318]" />}
            </div>
            <div className="w-full bg-[#e8ece3] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#326318] h-full rounded-full transition-all duration-500"
                style={{ width: isKycApproved ? '100%' : '40%' }}
              />
            </div>
            <p className="text-[11px] text-[#326318] font-extrabold mt-1">
              {isKycApproved ? 'Đã xác thực KYC VietGAP' : 'Hồ sơ đang chờ xác thực'}
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Products Table + Orders Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Quản Lý Sản Phẩm Thực Tế */}
        <div
          id="tour-overview-products"
          className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#326318]/10 flex items-center justify-center text-[#326318]">
                <Package size={18} />
              </div>
              <h3 className="text-base font-black text-[#1c2216] uppercase tracking-tight">
                QUẢN LÝ SẢN PHẨM ({totalItemsCount})
              </h3>
            </div>

            <button
              type="button"
              onClick={onOpenAddProduct}
              className="text-xs font-bold text-[#326318] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Thêm nông sản</span>
            </button>
          </div>

          {/* Sub-tabs: NÔNG SẢN | COMBO | HỘP MÙ */}
          <div className="flex items-center border-b border-[#e8ece3] gap-1">
            <button
              type="button"
              onClick={() => setProductTab('NONG_SAN')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                productTab === 'NONG_SAN'
                  ? 'border-[#326318] text-[#326318] bg-[#326318]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
              }`}
            >
              Nông sản ({freshProducts.length})
            </button>

            <button
              type="button"
              onClick={() => setProductTab('COMBO')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                productTab === 'COMBO'
                  ? 'border-[#195962] text-[#195962] bg-[#195962]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
              }`}
            >
              Combo ({combos.length})
            </button>

            <button
              type="button"
              onClick={() => setProductTab('BLIND_BOX')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                productTab === 'BLIND_BOX'
                  ? 'border-[#8a4e1d] text-[#8a4e1d] bg-[#8a4e1d]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
              }`}
            >
              Hộp Mù ({blindBoxes.length})
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-[10px] font-extrabold text-[#8a9484] uppercase tracking-wider px-3">
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
              <div className="py-10 text-center text-gray-400 text-xs bg-[#fafcf9] rounded-2xl border border-dashed border-[#e2e8dc]">
                Chưa có nông sản nào trong kho. Hãy bấm &quot;+ Thêm nông sản&quot; để đăng bán!
              </div>
            ) : (
              <div className="space-y-2.5">
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
                      className="grid grid-cols-12 items-center p-3 rounded-2xl bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <img
                          src={primaryImg}
                          alt={pName}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#1c2216] truncate">
                            {pName}
                          </div>
                          <span className="text-[10px] text-[#8c9686]">
                            {typeof item.category === 'object' && item.category !== null
                              ? item.category.name
                              : 'Nông sản vườn'}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-3 text-center">
                        <span className="text-xs font-black text-[#326318]">
                          {pPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <div className="col-span-2 text-center text-xs font-bold text-[#1c2216]">
                        {pStock} {pUnit}
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
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
              <div className="py-10 text-center text-gray-400 text-xs bg-[#fafcf9] rounded-2xl border border-dashed border-[#e2e8dc]">
                Chưa có combo nào. Hãy vào Quản lý sản phẩm để tạo combo món ăn tiện lợi!
              </div>
            ) : (
              <div className="space-y-2.5">
                {combos.slice(0, 5).map((combo) => {
                  const statusBadge = getProductStatusBadge(combo.status)
                  return (
                    <div
                      key={combo.comboId}
                      className="grid grid-cols-12 items-center p-3 rounded-2xl bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        {combo.imageUrl ? (
                          <img
                            src={combo.imageUrl}
                            alt={combo.comboName}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#195962]/10 text-[#195962] flex items-center justify-center font-bold shrink-0">
                            <UtensilsCrossed size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#1c2216] truncate">
                            {combo.comboName}
                          </div>
                          <span className="text-[10px] text-[#8c9686]">
                            {combo.mealType || 'Set món ăn'}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-3 text-center">
                        <span className="text-xs font-black text-[#195962]">
                          {combo.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <div className="col-span-2 text-center text-xs font-bold text-[#1c2216]">
                        {combo.totalQuantity} combo
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
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
            <div className="py-10 text-center text-gray-400 text-xs bg-[#fafcf9] rounded-2xl border border-dashed border-[#e2e8dc]">
              Chưa có túi mù nào. Hãy bấm tạo Túi Mù Blind Box để giải cứu nhanh cuối ngày!
            </div>
          ) : (
            <div className="space-y-2.5">
              {blindBoxes.slice(0, 5).map((box) => (
                <div
                  key={box.mysteryId || box.id}
                  className="grid grid-cols-12 items-center p-3 rounded-2xl bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8a4e1d]/10 text-[#8a4e1d] flex items-center justify-center font-bold text-base shrink-0">
                      🎁
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#1c2216] truncate">
                        {box.boxType}
                      </div>
                      <span className="text-[10px] text-[#8c9686]">Túi mù giải cứu</span>
                    </div>
                  </div>

                  <div className="col-span-3 text-center">
                    <span className="text-xs font-black text-[#8a4e1d]">
                      {box.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="col-span-2 text-center text-xs font-bold text-[#1c2216]">
                    {box.totalQuantity || 0} hộp
                  </div>

                  <div className="col-span-2 flex items-center justify-end">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        box.isActive
                          ? 'bg-[#eaf5e1] text-[#326318] border-[#b8e19c]'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
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
              className="text-xs font-black text-[#326318] hover:underline uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 mx-auto"
            >
              <span>Xem Toàn Bộ Sản Phẩm Trong Kho ({totalItemsCount})</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Quản Lý Đơn Hàng Thực Tế */}
        <div
          id="tour-overview-orders"
          className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-[#f1f4ed]">
            <div className="w-8 h-8 rounded-xl bg-[#326318]/10 flex items-center justify-center text-[#326318]">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1c2216] uppercase tracking-tight">
                ĐƠN HÀNG MỚI NHẤT
              </h3>
              <p className="text-[10px] text-[#889282]">
                {pendingOrdersCount > 0
                  ? `Có ${pendingOrdersCount} đơn cần xác nhận & đóng gói`
                  : 'Cập nhật từ hệ thống'}
              </p>
            </div>
          </div>

          {isLoadingOrders ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 size={24} className="animate-spin text-[#326318]" />
              <span className="text-xs font-medium">Đang tải đơn hàng...</span>
            </div>
          ) : realOrders.length > 0 ? (
            <div className="space-y-3">
              {realOrders.slice(0, 4).map((ord) => {
                const ordId = (ord as any).orderId ?? ord.id
                const recipient = (ord as any).recipientName || ord.buyerName || 'Khách hàng'
                const statusBadge = getOrderStatusBadge(ord.status)
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
                    className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#edf1e8] space-y-1.5 hover:border-[#326318]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[#1c2216]">#{ordId}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#4d5646] font-semibold truncate">
                      {recipient}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#8c9686] text-[10px] flex items-center gap-1">
                        <Clock size={11} />
                        <span>{formattedTime}</span>
                      </span>
                      <span className="font-black text-[#326318]">
                        {Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 px-4 rounded-2xl bg-[#fafcf9] border border-dashed border-[#dce2d6] text-center flex flex-col items-center justify-center gap-2">
              <ShoppingBag size={28} className="text-[#a4ad9f]" />
              <p className="text-xs font-bold text-[#717a6c]">Chưa có đơn hàng nào.</p>
              <span className="text-[10px] text-[#9ba495]">Đơn mới sẽ xuất hiện tại đây</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wide shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span>Xem Tất Cả Đơn Hàng ({totalOrdersCount})</span>
          </button>
        </div>
      </div>

      {/* Bottom Card: Chi Tiết Tài Chính Thực Tế (Tính từ đơn hàng) */}
      <div
        id="tour-overview-finance-cards"
        className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#326318]/10 flex items-center justify-center text-[#326318]">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1c2216] uppercase tracking-tight">
                TỔNG QUAN TÀI CHÍNH GIAN HÀNG
              </h3>
              <p className="text-[10px] text-[#889282]">
                Dòng tiền thực tế tính toán từ các đơn hàng của gian hàng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('wallet')}
            className="text-xs font-bold text-[#326318] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Chi tiết ví &amp; rút tiền</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#f7faf5] border border-[#e2ebd9]">
            <span className="text-[11px] font-bold text-[#6f7869] uppercase">
              Doanh Thu Đã Hoàn Thành
            </span>
            <div className="text-2xl font-black text-[#326318] mt-1">
              {completedRevenue.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-[10px] text-[#86927f]">
              Từ {completedOrders.length} đơn hàng đã giao thành công
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#f3e6cf]">
            <span className="text-[11px] font-bold text-[#8a4e1d] uppercase">
              Đang Chờ Quyết Toán
            </span>
            <div className="text-2xl font-black text-[#8a4e1d] mt-1">
              {pendingSettlementRevenue.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-[10px] text-[#86927f]">
              Từ {shippingOrPendingOrders.length} đơn hàng đang xử lý / vận chuyển
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-[#d6e3f5]">
            <span className="text-[11px] font-bold text-[#2d5c99] uppercase">
              Tổng Giá Trị Đơn Hàng
            </span>
            <div className="text-2xl font-black text-[#2d5c99] mt-1">
              {totalSalesRevenue.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-[10px] text-[#86927f]">
              Tổng doanh số tích lũy của gian hàng
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
