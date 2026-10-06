import React from 'react'
import { Truck, Plus } from 'lucide-react'
import type { FarmerVehicle } from './types'

interface VehiclesProps {
  vehicles: FarmerVehicle[]
  onOpenAddVehicle: () => void
  onInfo?: (msg: string) => void
}

export default function Vehicles({ vehicles, onOpenAddVehicle, onInfo }: VehiclesProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-4 border-b border-[#f1f4ed]">
        <div>
          <h3 className="text-2xl font-black text-[#1c2216]">Đội Xe Vận Chuyển Nông Trại</h3>
          <p className="text-xs text-[#7e8779]">
            Quản lý xe máy thùng bảo ôn, xe ba gác và xe tải chuyển hàng tới kho CapNong
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddVehicle}
          className="px-5 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>Thêm Phương Tiện Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-3xl p-5 border border-[#e8ece3] shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#326318]/10 text-[#326318] flex items-center justify-center">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1c2216]">{v.number}</h4>
                <p className="text-xs text-[#70796b]">{v.type}</p>
                <span className="text-[11px] font-bold text-[#326318]">
                  Trọng tải: {v.capacity}
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#f1f6ed] text-[#326318] text-xs font-bold">
              {v.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
