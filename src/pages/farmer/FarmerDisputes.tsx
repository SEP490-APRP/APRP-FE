import React from 'react'
import { Gavel, AlertTriangle } from 'lucide-react'

export default function FarmerDisputes() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-[#e8ece3] shadow-sm space-y-4 animate-fadeIn max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#8a4e1d]/10 text-[#8a4e1d] flex items-center justify-center">
          <Gavel size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-[#1c2216]">Trung Tâm Trợ Giúp &amp; Khiếu Nại</h3>
          <p className="text-xs text-[#7e8779]">
            Giải quyết vướng mắc về vận chuyển, đơn hàng và chất lượng
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#fafcf9] border border-[#e5edd9] text-center space-y-2">
        <AlertTriangle size={28} className="text-[#326318] mx-auto" />
        <div className="text-sm font-bold text-[#1c2216]">Hiện không có khiếu nại nào</div>
        <p className="text-xs text-[#717b6b]">
          Gian hàng của bạn đang duy trì chỉ số uy tín và chất lượng 98% (Top 5% xuất sắc).
        </p>
      </div>
    </div>
  )
}
