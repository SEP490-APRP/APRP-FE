import React, { useState } from 'react'
import { Package, ShoppingCart, Building2, ShoppingBag } from 'lucide-react'
import type { FarmerProduct, FarmerOrder } from './types'

interface DashboardProps {
  products: FarmerProduct[]
  orders: FarmerOrder[]
  onNavigate: (tab: string) => void
  onOpenAddProduct: () => void
}

export default function Dashboard({
  products,
  orders,
  onNavigate,
  onOpenAddProduct,
}: DashboardProps) {
  const [productTab, setProductTab] = useState<'NONG_SAN' | 'BLIND_BOX'>('NONG_SAN')

  const blindBoxes = products.filter((p) => p.category === 'Hộp mù')
  const freshProducts = products.filter((p) => p.category === 'Nông sản')

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 4 KPI Cards Grid */}
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
            <span className="text-3xl font-black text-[#1c2216]">{orders.length}</span>
            <p className="text-[11px] text-[#326318] font-bold mt-1">4 sản phẩm</p>
          </div>
        </div>

        {/* 2. Sản phẩm đang bán */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#7e8779] uppercase tracking-wider">
            SẢN PHẨM ĐANG BÁN
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#1c2216]">
              {freshProducts.length > 0 ? freshProducts.length : 4}
            </span>
            <p className="text-[11px] text-[#326318] font-bold mt-1">Đang hoạt động</p>
          </div>
        </div>

        {/* 3. Hộp mù (Blind Box) */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#7e8779] uppercase tracking-wider">
            HỘP MÙ (BLIND BOX)
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#1c2216]">
              {blindBoxes.length > 0 ? blindBoxes.length : 4}
            </span>
            <p className="text-[11px] text-[#326318] font-bold mt-1">Giải cứu nông sản</p>
          </div>
        </div>

        {/* 4. Chất lượng shop */}
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#7e8779] uppercase tracking-wider">
            CHẤT LƯỢNG SHOP
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#326318]">98%</span>
            <div className="w-full bg-[#e8ece3] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#326318] h-full w-[98%] rounded-full" />
            </div>
            <p className="text-[11px] text-[#326318] font-extrabold mt-1">Top 5% xuất sắc</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Products Table + Orders Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Quản Lý Sản Phẩm */}
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
                QUẢN LÝ SẢN PHẨM
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

          {/* Sub-tabs: NÔNG SẢN | HỘP MÙ */}
          <div className="flex items-center border-b border-[#e8ece3]">
            <button
              type="button"
              onClick={() => setProductTab('NONG_SAN')}
              className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                productTab === 'NONG_SAN'
                  ? 'border-[#326318] text-[#326318] bg-[#326318]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
              }`}
            >
              NÔNG SẢN ({freshProducts.length > 0 ? freshProducts.length : 4})
            </button>
            <button
              type="button"
              onClick={() => setProductTab('BLIND_BOX')}
              className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                productTab === 'BLIND_BOX'
                  ? 'border-[#326318] text-[#326318] bg-[#326318]/5'
                  : 'border-transparent text-[#7e8779] hover:text-[#1c2216]'
              }`}
            >
              HỘP MÙ ({blindBoxes.length > 0 ? blindBoxes.length : 4})
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-[10px] font-extrabold text-[#8a9484] uppercase tracking-wider px-3">
            <div className="col-span-5">SẢN PHẨM</div>
            <div className="col-span-3 text-center">GIÁ</div>
            <div className="col-span-2 text-center">DANH MỤC</div>
            <div className="col-span-2 text-right">TRẠNG THÁI</div>
          </div>

          {/* Table Rows */}
          {productTab === 'NONG_SAN' ? (
            <div className="space-y-3">
              {(freshProducts.length > 0 ? freshProducts : products).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center p-3 rounded-2xl bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-[#1c2216] line-clamp-1">
                        {item.name}
                      </div>
                      <span className="text-[10px] text-[#8c9686]">Nông sản vườn</span>
                    </div>
                  </div>

                  <div className="col-span-3 text-center">
                    {item.originalPrice !== item.price && (
                      <span className="text-[10px] text-gray-400 line-through mr-1">
                        {item.originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                    <span className="text-xs font-black text-[#326318]">
                      {item.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f1f6ed] text-[#326318] text-[10px] font-bold">
                      Nông sản
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#326318]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#326318]" />
                      <span>{item.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(blindBoxes.length > 0 ? blindBoxes : products).map((box) => (
                <div
                  key={box.id}
                  className="grid grid-cols-12 items-center p-3 rounded-2xl bg-[#fafcf9] hover:bg-[#f4f7f1] transition-colors border border-[#edf1e8]"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8a4e1d]/10 text-[#8a4e1d] flex items-center justify-center font-bold text-base shrink-0">
                      🎁
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#1c2216] line-clamp-1">
                        {box.name}
                      </div>
                      <span className="text-[10px] text-[#8c9686]">Túi mù may mắn</span>
                    </div>
                  </div>

                  <div className="col-span-3 text-center">
                    <span className="text-xs font-black text-[#8a4e1d]">
                      {box.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#fdf5eb] text-[#8a4e1d] text-[10px] font-bold">
                      Hộp mù
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#326318]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#326318]" />
                      <span>{box.status}</span>
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
              className="text-xs font-black text-[#326318] hover:underline uppercase tracking-wider cursor-pointer"
            >
              XEM CHI TIẾT TẤT CẢ ĐỐI TƯỢNG
            </button>
          </div>
        </div>

        {/* Right Column: Quản Lý Đơn Hàng */}
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
                QUẢN LÝ ĐƠN HÀNG
              </h3>
              <p className="text-[10px] text-[#889282]">Danh sách các đơn hàng mới nhất.</p>
            </div>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 3).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-2xl bg-[#fafcf9] border border-[#edf1e8] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#1c2216]">{ord.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eaf5e1] text-[#326318]">
                      {ord.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#4d5646] font-medium truncate">
                    {ord.customer}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-[#8c9686]">{ord.time}</span>
                    <span className="font-black text-[#326318]">
                      {ord.total.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              ))}
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
            <span>Xem Tất Cả Đơn Hàng</span>
          </button>
        </div>
      </div>

      {/* Bottom Card: Chi Tiết Tài Chính */}
      <div
        id="tour-overview-finance-cards"
        className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#326318]/10 flex items-center justify-center text-[#326318]">
              <Building2 size={18} />
            </div>
            <h3 className="text-base font-black text-[#1c2216] uppercase tracking-tight">
              CHI TIẾT TÀI CHÍNH
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('wallet')}
            className="text-xs font-bold text-[#326318] hover:underline cursor-pointer"
          >
            Xem ví tiền ›
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#f7faf5] border border-[#e2ebd9]">
            <span className="text-[11px] font-bold text-[#6f7869] uppercase">Số Dư Khả Dụng</span>
            <div className="text-2xl font-black text-[#326318] mt-1">14.280.000 đ</div>
            <span className="text-[10px] text-[#86927f]">Sẵn sàng rút về Vietcombank</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#f3e6cf]">
            <span className="text-[11px] font-bold text-[#8a4e1d] uppercase">
              Đang Chờ Quyết Toán
            </span>
            <div className="text-2xl font-black text-[#8a4e1d] mt-1">2.450.000 đ</div>
            <span className="text-[10px] text-[#86927f]">3 đơn hàng đang vận chuyển</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-[#d6e3f5]">
            <span className="text-[11px] font-bold text-[#2d5c99] uppercase">
              Tổng Doanh Thu Tháng
            </span>
            <div className="text-2xl font-black text-[#2d5c99] mt-1">38.920.000 đ</div>
            <span className="text-[10px] text-[#86927f]">Đã giải cứu 1.250 kg nông sản</span>
          </div>
        </div>
      </div>
    </div>
  )
}
