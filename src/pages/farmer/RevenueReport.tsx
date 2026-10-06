import React, { useState } from 'react'
import { Coins, ShoppingCart, Star, Leaf } from 'lucide-react'

export default function RevenueReport() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Báo Cáo Doanh Thu &amp; Mùa Vụ</h3>
          <p className="text-xs text-[#7e8779]">
            Thống kê dòng tiền, số lượng giải cứu và hiệu quả kinh doanh của nhà vườn
          </p>
        </div>

        <div
          id="tour-revenue-filter"
          className="flex items-center gap-1 bg-[#f0f4ec] p-1 rounded-2xl"
        >
          {(['week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                period === p
                  ? 'bg-white text-[#326318] shadow-sm'
                  : 'text-[#677261] hover:text-[#1c2216]'
              }`}
            >
              {p === 'week' ? 'Tuần Này' : p === 'month' ? 'Tháng Này' : '6 Tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div id="tour-revenue-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7e8779] uppercase">DOANH THU</span>
            <Coins size={20} className="text-[#326318]" />
          </div>
          <div className="text-2xl font-black text-[#1c2216] mt-2">14.280.000 đ</div>
          <p className="text-[10px] text-[#326318] font-bold mt-1">↗ +18% so với tuần trước</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7e8779] uppercase">ĐƠN HOÀN THÀNH</span>
            <ShoppingCart size={20} className="text-[#2d5c99]" />
          </div>
          <div className="text-2xl font-black text-[#1c2216] mt-2">128 Đơn</div>
          <p className="text-[10px] text-[#2d5c99] font-bold mt-1">100% tỷ lệ giao thành công</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7e8779] uppercase">ĐÁNH GIÁ SHOP</span>
            <Star size={20} className="text-[#e5a00d] fill-[#e5a00d]" />
          </div>
          <div className="text-2xl font-black text-[#1c2216] mt-2">4.9 / 5.0 ⭐</div>
          <p className="text-[10px] text-[#e5a00d] font-bold mt-1">Từ 248 khách mua</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7e8779] uppercase">
              NÔNG SẢN GIẢI CỨU
            </span>
            <Leaf size={20} className="text-[#326318]" />
          </div>
          <div className="text-2xl font-black text-[#1c2216] mt-2">1,250 kg</div>
          <p className="text-[10px] text-[#326318] font-bold mt-1">Giảm thất thoát 95%</p>
        </div>
      </div>

      {/* Chart simulation */}
      <div
        id="tour-revenue-chart"
        className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4"
      >
        <h4 className="text-base font-black text-[#1c2216]">
          Biểu Đồ Doanh Số Theo Ngày Trong Tuần
        </h4>
        <div className="h-48 flex items-end justify-between gap-3 pt-6 px-4 border-b border-[#f1f4ed]">
          {[
            { day: 'T2', val: 65, amount: '2.1 tr' },
            { day: 'T3', val: 80, amount: '2.8 tr' },
            { day: 'T4', val: 45, amount: '1.5 tr' },
            { day: 'T5', val: 95, amount: '3.4 tr' },
            { day: 'T6', val: 110, amount: '4.2 tr' },
            { day: 'T7', val: 140, amount: '5.6 tr' },
            { day: 'CN', val: 120, amount: '4.8 tr' },
          ].map((bar, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-extrabold text-[#326318] opacity-0 group-hover:opacity-100 transition-opacity">
                {bar.amount}
              </span>
              <div
                style={{ height: `${bar.val}%` }}
                className="w-full bg-[#326318] rounded-t-xl hover:bg-[#254b12] transition-all cursor-pointer shadow-sm"
              />
              <span className="text-xs font-bold text-[#6d7667]">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
