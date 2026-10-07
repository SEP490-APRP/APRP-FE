import React from 'react'
import { ChefHat } from 'lucide-react'

interface TripJoinRequestsProps {
  onInfo?: (msg: string) => void
}

export default function TripJoinRequests({ onInfo }: TripJoinRequestsProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-[#e8ece3] shadow-sm space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center">
          <ChefHat size={26} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Mạng Lưới Ghép Chuyến Nông Dân</h3>
          <p className="text-xs text-[#7e8779]">
            Cùng chia sẻ thùng xe tải lạnh với các nông hộ lân cận, tiết kiệm tới 40% cước phí
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#f8faf6] border border-[#e3ebdc] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-[#1c2216]">
            Chuyến Xe Đà Lạt ➔ TP.HCM (Khởi hành 20:00 tối nay)
          </h4>
          <p className="text-xs text-[#6e7768] mt-1">
            Còn trống 650 kg tải trọng lạnh. HTX Nông Sản Đà Lạt đang mở ghép đơn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onInfo?.('Đã gửi yêu cầu ghép hàng thành công')}
          className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm shrink-0"
        >
          Gửi Hàng Ghép Chuyến
        </button>
      </div>
    </div>
  )
}
