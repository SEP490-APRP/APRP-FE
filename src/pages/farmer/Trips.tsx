import React from 'react'
import { Plus } from 'lucide-react'
import type { FarmerTrip } from './types'

interface TripsProps {
  trips: FarmerTrip[]
  onOpenCreateTrip: () => void
  onInfo?: (msg: string) => void
}

export default function Trips({ trips, onOpenCreateTrip, onInfo }: TripsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">
            Chuyến Xe Chở Nông Sản Tới Kho Tổng
          </h3>
          <p className="text-xs text-[#7e8779]">
            Lên lịch chuyến vận chuyển rau củ về kho tập kết kiểm định AI
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateTrip}
          className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>Tạo Chuyến Xe Mới</span>
        </button>
      </div>

      <div className="space-y-4">
        {trips.map((tr) => (
          <div
            key={tr.id}
            className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f4ed]">
              <div className="flex items-center gap-3">
                <span className="font-black text-sm text-[#1c2216]">{tr.id}</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#fdf5eb] text-[#8a4e1d]">
                  {tr.status}
                </span>
              </div>
              <span className="text-xs font-bold text-[#326318]">
                Khởi hành: {tr.departureTime}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#7c8677] block">Tuyến Đường:</span>
                <strong className="text-[#1c2216]">
                  {tr.origin} ➔ {tr.destination}
                </strong>
              </div>
              <div>
                <span className="text-[#7c8677] block">Phương Tiện &amp; Tải Trọng:</span>
                <strong className="text-[#1c2216]">
                  {tr.vehicle} ({tr.weight})
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
