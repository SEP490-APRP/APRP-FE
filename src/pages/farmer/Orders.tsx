import React, { useState } from 'react'
import { Download } from 'lucide-react'
import type { FarmerOrder } from './types'

interface OrdersProps {
  orders: FarmerOrder[]
  onOpenOrderPrep?: (orderId: string) => void
  onInfo?: (msg: string) => void
}

export default function Orders({ orders, onOpenOrderPrep, onInfo }: OrdersProps) {
  const [activeTab, setActiveTab] = useState('Tất cả')

  const tabs = ['Tất cả', 'Chờ xác nhận', 'Đang chuẩn bị', 'Đã tới kho', 'Đang giao', 'Đã giao']

  const filtered = orders.filter((o) => {
    if (activeTab === 'Tất cả') return true
    return o.status === activeTab
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Quản Lý Đơn Hàng Của Nhà Vườn</h3>
          <p className="text-xs text-[#7e8779]">
            Theo dõi trạng thái đóng gói, chuyển kho và giao tận tay người tiêu dùng
          </p>
        </div>

        <button
          type="button"
          onClick={() => onInfo?.('Đang xuất file Excel danh sách đơn hàng...')}
          className="px-4 py-2.5 rounded-full border border-[#d6dcce] hover:bg-white text-xs font-bold text-[#424a3c] flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Download size={15} />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div
        id="tour-orders-tabs"
        className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar"
      >
        {tabs.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setActiveTab(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === st
                ? 'bg-[#326318] text-white shadow-sm'
                : 'bg-white border border-[#e4ece0] text-[#646e5f] hover:bg-[#f3f7ef]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((ord, idx) => (
            <div
              key={ord.id}
              id={idx === 0 ? 'tour-orders-first-card' : undefined}
              className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-[#1c2216]">{ord.id}</span>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#f1f6ed] text-[#326318]">
                    {ord.status}
                  </span>
                </div>
                <span className="text-xs text-[#808a7b]">{ord.time}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#848e7f] block">Khách Hàng:</span>
                  <strong className="text-[#1c2216]">{ord.customer}</strong>
                </div>
                <div>
                  <span className="text-[#848e7f] block">Sản Phẩm Đặt:</span>
                  <span className="text-[#1c2216] font-semibold">{ord.items}</span>
                </div>
                <div className="md:text-right">
                  <span className="text-[#848e7f] block">Tổng Tiền:</span>
                  <strong className="text-base text-[#326318]">
                    {ord.total.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#6e7768]">Phương thức: {ord.payment}</span>
                <div
                  id={idx === 0 ? 'tour-orders-contact-btns' : undefined}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onOpenOrderPrep?.(ord.id)}
                    className="px-4 py-2 rounded-xl bg-[#f4f7f1] hover:bg-[#eaf0e6] text-[#326318] font-bold text-xs cursor-pointer"
                  >
                    Chuẩn Bị Đóng Gói
                  </button>
                  <button
                    type="button"
                    onClick={() => onInfo?.(`Đã xác nhận đóng gói cho đơn: ${ord.id}`)}
                    className="px-4 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Xác Nhận Xong
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-[#7e8779] border border-[#e8ece3]">
            Không có đơn hàng nào trong mục này.
          </div>
        )}
      </div>
    </div>
  )
}
