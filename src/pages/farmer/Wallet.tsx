import React, { useState } from 'react'
import {
  Wallet as WalletIcon,
  Building2,
  ArrowDownRight,
  ArrowUpRight,
  History,
} from 'lucide-react'

interface WalletProps {
  onOpenWithdraw: () => void
  onInfo?: (msg: string) => void
}

export default function Wallet({ onOpenWithdraw, onInfo }: WalletProps) {
  const [history] = useState([
    {
      id: 'TXN-9021',
      title: 'Quyết toán tự động đơn hàng #DH-8902',
      amount: '+79.000 đ',
      type: 'in',
      date: 'Hôm nay · 08:30',
    },
    {
      id: 'TXN-9018',
      title: 'Rút tiền về Vietcombank (STK: 1029384756)',
      amount: '-5.000.000 đ',
      type: 'out',
      date: 'Hôm qua',
    },
    {
      id: 'TXN-9005',
      title: 'Quyết toán tự động 5 đơn hàng giao thành công',
      amount: '+2.350.000 đ',
      type: 'in',
      date: '3 ngày trước',
    },
  ])

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Ví Tiền &amp; Quyết Toán Nhà Vườn</h3>
          <p className="text-xs text-[#7e8779]">
            Doanh thu bán nông sản được tự động giải ngân sau 24h khi khách nhận hàng
          </p>
        </div>

        <button
          id="tour-wallet-withdraw-btn"
          type="button"
          onClick={onOpenWithdraw}
          className="px-6 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer"
        >
          Rút Tiền Về Ngân Hàng
        </button>
      </div>

      {/* Wallet Summary Cards */}
      <div id="tour-wallet-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#326318] to-[#1f420e] text-white rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span>SỐ DƯ KHẢ DỤNG</span>
            <WalletIcon size={20} />
          </div>
          <div className="text-3xl font-black">14.280.000 đ</div>
          <div className="text-xs opacity-80">Liên kết: Vietcombank · STK *** 756</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4">
          <span className="text-xs font-bold text-[#7c8676]">TÀI KHOẢN THỤ HƯỞNG</span>
          <div className="flex items-center gap-3">
            <Building2 size={24} className="text-[#326318]" />
            <div>
              <div className="text-sm font-black text-[#1c2216]">Vietcombank - CN Lâm Đồng</div>
              <div className="text-xs text-[#6e7767]">STK: 1029384756 · NGUYEN VAN BAY</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions History */}
      <div
        id="tour-wallet-history"
        className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#326318]" />
            <h4 className="text-base font-black text-[#1c2216]">Lịch Sử Giao Dịch Gần Đây</h4>
          </div>
        </div>

        <div className="divide-y divide-[#f1f4ed]">
          {history.map((tx) => (
            <div key={tx.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    tx.type === 'in' ? 'bg-[#eaf5e1] text-[#326318]' : 'bg-[#fdeeed] text-[#c5221f]'
                  }`}
                >
                  {tx.type === 'in' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#1c2216]">{tx.title}</h5>
                  <span className="text-[10px] text-[#858f7e]">{tx.date}</span>
                </div>
              </div>

              <div
                className={`text-sm font-black ${
                  tx.type === 'in' ? 'text-[#326318]' : 'text-[#c5221f]'
                }`}
              >
                {tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
