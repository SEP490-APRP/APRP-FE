import React from 'react'
import { Plus, Gift } from 'lucide-react'
import type { FarmerVoucher } from './types'

interface VouchersProps {
  vouchers: FarmerVoucher[]
  onOpenCreateVoucher: () => void
  onInfo?: (msg: string) => void
}

export default function Vouchers({ vouchers, onOpenCreateVoucher }: VouchersProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">
            Mã Giảm Giá &amp; Khuyến Mãi Của Shop
          </h3>
          <p className="text-xs text-[#7e8779]">Tạo mã giảm giá kích cầu giải cứu nông sản</p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateVoucher}
          className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>Tạo Voucher Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map((vc) => (
          <div
            key={vc.id}
            className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#8a4e1d]/10 text-[#8a4e1d] flex items-center justify-center font-bold">
                <Gift size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1c2216]">{vc.code}</h4>
                <div className="text-xs font-bold text-[#8a4e1d]">
                  {vc.discount} ({vc.minOrder})
                </div>
                <span className="text-[10px] text-[#869080]">
                  Đã dùng: {vc.used} lượt · {vc.expiry}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
