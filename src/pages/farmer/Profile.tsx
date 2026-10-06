import React from 'react'
import { ShieldCheck } from 'lucide-react'
import type { AuthUser } from '@/features/auth'

interface ProfileProps {
  user?: AuthUser | null
  onInfo?: (msg: string) => void
}

export default function Profile({ user, onInfo }: ProfileProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-[#e8ece3] shadow-sm space-y-6 animate-fadeIn max-w-3xl">
      <div
        id="tour-profile-stats"
        className="flex items-center gap-4 pb-6 border-b border-[#f1f4ed]"
      >
        <div className="w-16 h-16 rounded-full bg-[#326318] text-white flex items-center justify-center text-2xl font-bold shadow-sm">
          🌾
        </div>
        <div>
          <h3 className="text-xl font-black text-[#1c2216]">
            {user?.shopName || 'Hợp Tác Xã Nông Sản Cầu Đất'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-0.5 rounded-full bg-[#eaf5e1] text-[#326318] text-xs font-bold flex items-center gap-1 border border-[#b8e19c]">
              <ShieldCheck size={13} />
              <span>ĐÃ DUYỆT KYC VIETGAP</span>
            </span>
          </div>
        </div>
      </div>

      <div id="tour-profile-form" className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
          <span className="text-[#7c8676] block mb-1">Chủ Vườn Đại Diện:</span>
          <strong className="text-sm text-[#1c2216]">
            {user?.name || 'Nguyễn Văn Bảy (Chú Bảy)'}
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
          <span className="text-[#7c8676] block mb-1">Số Điện Thoại:</span>
          <strong className="text-sm text-[#1c2216]">{user?.phone || '0988 123 456'}</strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e8efe3] md:col-span-2">
          <span className="text-[#7c8676] block mb-1">Địa Chỉ Kho / Vườn Xuất Hàng:</span>
          <strong className="text-sm text-[#1c2216]">
            Cầu Đất, Xã Xuân Trường, TP. Đà Lạt, Tỉnh Lâm Đồng
          </strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#f3e3cd] md:col-span-2">
          <span className="text-[#8a4e1d] font-bold block mb-1">
            Tài Khoản Quyết Toán Ngân Hàng:
          </span>
          <div className="text-sm text-[#1c2216] font-bold">
            Vietcombank · STK: 1029384756 (NGUYEN VAN BAY)
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onInfo?.('Chức năng chỉnh sửa hồ sơ đang mở')}
          className="px-6 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs cursor-pointer shadow-sm"
        >
          Cập Nhật Hồ Sơ
        </button>
      </div>
    </div>
  )
}
