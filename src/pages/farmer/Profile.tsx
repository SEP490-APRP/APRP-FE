import React from 'react'
import { ShieldCheck } from 'lucide-react'
import type { AuthUser } from '@/features/auth'
import type { UserResponse } from '@/services/user.types'

interface ProfileProps {
  user?: AuthUser | null
  shopProfile?: UserResponse | null
  onInfo?: (msg: string) => void
}

export default function Profile({ user, shopProfile, onInfo }: ProfileProps) {
  const shopName =
    shopProfile?.shopName ||
    user?.shopName ||
    shopProfile?.fullName ||
    user?.name ||
    'Gian Hàng Nông Sản'

  const ownerName = shopProfile?.fullName || user?.name || 'Chủ Vườn Đại Diện'
  const phone = shopProfile?.phoneNumber || shopProfile?.phone || user?.phone || 'Chưa cập nhật'
  const address = shopProfile?.address || user?.address || 'Chưa cập nhật địa chỉ kho xuất hàng'
  const logoUrl = shopProfile?.logoUrl || user?.avatar

  const bankInfo =
    shopProfile?.bankName && shopProfile?.bankAccount
      ? `${shopProfile.bankName} · STK: ${shopProfile.bankAccount} (${
          shopProfile.bankAccountHolder || shopProfile.fullName || 'CHỦ TÀI KHOẢN'
        })`
      : 'Chưa liên kết tài khoản ngân hàng'

  const isApproved = shopProfile?.status === 'ACTIVE' || user?.kycStatus === 'APPROVED'

  return (
    <div className="bg-white rounded-3xl p-8 border border-[#e8ece3] shadow-sm space-y-6 animate-fadeIn max-w-3xl">
      <div
        id="tour-profile-stats"
        className="flex items-center gap-4 pb-6 border-b border-[#f1f4ed]"
      >
        <div className="w-16 h-16 rounded-full bg-[#326318] text-white flex items-center justify-center text-xl font-bold shadow-sm overflow-hidden shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
          ) : (
            <span>{shopName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h3 className="text-xl font-black text-[#1c2216]">{shopName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${
                isApproved
                  ? 'bg-[#eaf5e1] text-[#326318] border-[#b8e19c]'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <ShieldCheck size={13} />
              <span>{isApproved ? 'ĐÃ XÁC THỰC GIAN HÀNG' : 'ĐANG CHỜ DUYỆT'}</span>
            </span>
          </div>
        </div>
      </div>

      <div id="tour-profile-form" className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
          <span className="text-[#7c8676] block mb-1">Chủ Vườn Đại Diện:</span>
          <strong className="text-sm text-[#1c2216]">{ownerName}</strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
          <span className="text-[#7c8676] block mb-1">Số Điện Thoại:</span>
          <strong className="text-sm text-[#1c2216]">{phone}</strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#fafcf9] border border-[#e8efe3] md:col-span-2">
          <span className="text-[#7c8676] block mb-1">Địa Chỉ Kho / Vườn Xuất Hàng:</span>
          <strong className="text-sm text-[#1c2216]">{address}</strong>
        </div>

        <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#f3e3cd] md:col-span-2">
          <span className="text-[#8a4e1d] font-bold block mb-1">
            Tài Khoản Quyết Toán Ngân Hàng:
          </span>
          <div className="text-sm text-[#1c2216] font-bold">{bankInfo}</div>
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
