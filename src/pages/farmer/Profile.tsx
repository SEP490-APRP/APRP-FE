import React, { useState, useRef } from 'react'
import {
  ShieldCheck,
  Edit3,
  Mail,
  Phone,
  MapPin,
  User,
  CreditCard,
  Award,
  FileText,
  Star,
  Calendar,
  Sparkles,
  Camera,
  Quote,
  Loader2,
} from 'lucide-react'
import type { AuthUser } from '@/features/auth'
import type { UserResponse } from '@/services/user.types'
import { useUpdateShopProfile, EditShopProfileModal } from '@/features/shop'
import { uploadService } from '@/services'
import { globalShowAlert } from '@/components/common/Popup'

interface ProfileProps {
  user?: AuthUser | null
  shopProfile?: UserResponse | null
  onInfo?: (msg: string) => void
}

export default function Profile({ user, shopProfile, onInfo }: ProfileProps) {
  const updateProfileMutation = useUpdateShopProfile()

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Current values combining backend profile and session
  const shopName =
    shopProfile?.shopName ||
    user?.shopName ||
    shopProfile?.fullName ||
    user?.name ||
    'Gian Hàng Nông Sản'

  const ownerName = shopProfile?.fullName || user?.name || 'Chủ Vườn Đại Diện'
  const email = shopProfile?.email || user?.email || 'Chưa cập nhật'
  const phone = shopProfile?.phoneNumber || (shopProfile as any)?.phone || user?.phone || 'Chưa cập nhật'
  const address = shopProfile?.address || user?.address || 'Chưa cập nhật địa chỉ kho xuất hàng'
  const logoUrl = shopProfile?.logoUrl || user?.avatar
  const description = shopProfile?.description || ''
  const achievement = shopProfile?.achievement || ''
  const license = shopProfile?.license || ''
  const licenseImageUrl = shopProfile?.licenseImageUrl || ''

  // Rating Display
  const rawRating = shopProfile?.ratingAverage ?? (shopProfile as any)?.rating
  const hasRating = rawRating != null && Number(rawRating) > 0
  const ratingText = hasRating ? `${Number(rawRating).toFixed(1)} / 5.0` : 'Chưa có đánh giá'

  const bankName = shopProfile?.bankName || ''
  const bankAccount = shopProfile?.bankAccount || (shopProfile as any)?.bankAccountNumber || ''
  const bankAccountHolder =
    shopProfile?.bankAccountHolder ||
    (shopProfile as any)?.bankAccountName ||
    shopProfile?.fullName ||
    ''

  const isApproved = shopProfile?.status === 'ACTIVE' || user?.kycStatus === 'APPROVED'

  // Format Join Date (Supports Jackson LocalDateTime array [year, month, day] or ISO string)
  const joinDate = (() => {
    const raw = (shopProfile as any)?.createAt || (shopProfile as any)?.createdAt
    if (!raw) return 'Gần đây'
    try {
      if (Array.isArray(raw)) {
        const [year, month] = raw
        return `Tháng ${String(month).padStart(2, '0')}/${year}`
      }
      const d = new Date(raw)
      return isNaN(d.getTime())
        ? 'Gần đây'
        : d.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
    } catch {
      return 'Gần đây'
    }
  })()

  // Quick avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      globalShowAlert('Vui lòng chọn tệp định dạng hình ảnh.', 'Tệp không hợp lệ', 'warning')
      return
    }

    try {
      setIsUploadingAvatar(true)
      const res = await uploadService.uploadImage(file, 'shops')
      const uploadedUrl = res.result?.url
      if (uploadedUrl) {
        await updateProfileMutation.mutateAsync({ logoUrl: uploadedUrl })
        globalShowAlert('Đã cập nhật ảnh đại diện gian hàng thành công!', 'Thông báo', 'success')
      }
    } catch (err) {
      console.error('Failed to upload logo:', err)
      globalShowAlert('Không thể tải ảnh lên. Vui lòng thử lại.', 'Lỗi', 'error')
    } finally {
      setIsUploadingAvatar(false)
      if (e.target) e.target.value = ''
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      {/* 1. Header Banner & Profile Hero */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#326318] text-white flex items-center justify-center text-2xl font-black shadow-md overflow-hidden border-2 border-white ring-2 ring-[#e2ebd9]">
              {logoUrl ? (
                <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
              ) : (
                <span>{shopName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              {isUploadingAvatar ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Camera size={18} />
                  <span>Đổi ảnh</span>
                </>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#1c2216]">{shopName}</h2>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Verification Badge */}
              <span
                className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 border ${
                  isApproved
                    ? 'bg-[#eaf5e1] text-[#2e5d16] border-[#b8e19c]'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <ShieldCheck size={13} />
                <span>{isApproved ? 'ĐÃ XÁC THỰC GIAN HÀNG' : 'ĐANG CHỜ DUYỆT'}</span>
              </span>

              {/* Rating Badge */}
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
                <Star
                  size={13}
                  className={hasRating ? 'text-amber-500 fill-amber-500' : 'text-amber-400'}
                />
                <span>{ratingText}</span>
              </span>

              {/* Member Since */}
              <span className="px-2.5 py-1 rounded-full bg-[#f4efe4] text-[#636c5d] font-semibold flex items-center gap-1">
                <Calendar size={13} />
                <span>Đồng hành từ {joinDate}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="px-6 py-3 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs sm:text-sm cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Edit3 size={16} />
          <span>Cập Nhật Hồ Sơ</span>
        </button>
      </div>

      {/* 2. Structured Information Grid - 3 Cột Ngang Hàng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Thông tin liên hệ & Đại diện */}
        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#326318] font-bold text-xs uppercase tracking-wide border-b border-[#f0f4ec] pb-3">
              <User size={16} />
              <span>Thông Tin Đại Diện &amp; Liên Hệ</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
                <span className="text-[#7c8676] block mb-1 font-medium">Chủ Vườn Đại Diện:</span>
                <strong className="text-sm text-[#1c2216]">{ownerName}</strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
                <span className="text-[#7c8676] block mb-1 font-medium flex items-center gap-1">
                  <Phone size={13} />
                  Số Điện Thoại:
                </span>
                <strong className="text-sm text-[#1c2216]">{phone}</strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
                <span className="text-[#7c8676] block mb-1 font-medium flex items-center gap-1">
                  <Mail size={13} />
                  Email Tài Khoản:
                </span>
                <strong className="text-sm text-[#1c2216] truncate block" title={email}>
                  {email}
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
                <span className="text-[#7c8676] block mb-1 font-medium flex items-center gap-1">
                  <MapPin size={13} />
                  Địa Chỉ Kho / Vườn Xuất Hàng:
                </span>
                <strong className="text-sm text-[#1c2216] leading-relaxed block">{address}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Chứng nhận & Hồ sơ pháp lý */}
        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#2e5d16] font-bold text-xs uppercase tracking-wide border-b border-[#f0f4ec] pb-3">
              <Award size={16} />
              <span>Uy Tín &amp; Pháp Lý Nông Nghiệp</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Achievement / Standards */}
              <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
                <span className="text-[#7c8676] block mb-1 font-medium flex items-center gap-1">
                  <Sparkles size={13} className="text-emerald-600" />
                  Chứng Nhận &amp; Danh Hiệu:
                </span>
                <div className="text-sm text-[#1c2216] font-bold">
                  {achievement ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#eaf5e1] text-[#2e5d16] border border-[#c1e6a7]">
                      🌱 {achievement}
                    </span>
                  ) : (
                    <span className="text-[#96a090] italic font-normal">Chưa cập nhật danh hiệu</span>
                  )}
                </div>
              </div>

              {/* Business License */}
              <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
                <span className="text-[#7c8676] block mb-1 font-medium flex items-center gap-1">
                  <FileText size={13} />
                  Mã Số Giấy Phép / ĐKKD:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm text-[#1c2216]">
                    {license || (
                      <span className="text-[#96a090] italic font-normal">Chưa có mã giấy phép</span>
                    )}
                  </strong>
                  {licenseImageUrl && (
                    <a
                      href={licenseImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#d8d3c5] text-[11px] font-bold text-[#326318] hover:bg-[#326318] hover:text-white transition-all shadow-2xs"
                    >
                      Xem giấy tờ
                    </a>
                  )}
                </div>
              </div>

              {/* License image thumbnail if available */}
              <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
                <span className="text-[#7c8676] block mb-1 font-medium flex items-center gap-1">
                  <ShieldCheck size={13} className="text-[#326318]" />
                  Ảnh Chụp Giấy Phép / Chứng Chỉ:
                </span>
                {licenseImageUrl ? (
                  <div className="mt-1 relative rounded-xl overflow-hidden border border-[#d8d3c5] h-28 bg-gray-50 group">
                    <img
                      src={licenseImageUrl}
                      alt="Giấy phép kinh doanh"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <a
                      href={licenseImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                    >
                      Mở xem ảnh gốc ↗
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-[#96a090] italic py-3 text-center">
                    Chưa tải ảnh giấy phép. Bấm &quot;Cập Nhật Hồ Sơ&quot; để bổ sung giấy phép.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Thông tin Ngân hàng Quyết toán - ĐƯỢC ĐƯA LÊN BÊN PHẢI */}
        <div className="bg-white rounded-3xl p-6 border border-[#e8ece3] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#8a4e1d] font-bold text-xs uppercase tracking-wide border-b border-[#f9ede1] pb-3">
              <CreditCard size={16} />
              <span>Tài Khoản Quyết Toán Doanh Thu</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#f3e3cd] space-y-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#8a4e1d] uppercase tracking-wide">
                    Ngân Hàng Thụ Hưởng:
                  </span>
                  <div className="text-base font-black text-[#1c2216]">
                    {bankName ? bankName : <span className="text-[#8c7e6c] font-medium text-sm">Chưa liên kết</span>}
                  </div>
                </div>

                <div className="space-y-1 border-t border-[#f3e3cd] pt-2">
                  <span className="text-[11px] font-bold text-[#8a4e1d] uppercase tracking-wide">
                    Số Tài Khoản:
                  </span>
                  <div className="text-base font-black text-[#1c2216] tracking-wider">
                    {bankAccount || (
                      <span className="text-[#8c7e6c] font-medium text-sm tracking-normal">
                        Chưa cập nhật
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 border-t border-[#f3e3cd] pt-2">
                  <span className="text-[11px] font-bold text-[#8a4e1d] uppercase tracking-wide">
                    Chủ Tài Khoản:
                  </span>
                  <div className="text-sm font-black text-[#1c2216] uppercase">
                    {bankAccountHolder || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3] flex items-center gap-2.5 text-xs text-[#5a6b52] font-semibold">
            <span className="text-lg">💰</span>
            <span className="leading-relaxed">
              Tự động đối soát &amp; chuyển khoản giải ngân sau khi đơn hàng hoàn tất.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Khung Giới Thiệu Câu Chuyện Nhà Vườn & Cam Kết (Full Width Banner) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ece3] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0f4ec] pb-3">
          <div className="flex items-center gap-2 text-[#326318] font-bold text-xs uppercase tracking-wide">
            <Quote size={16} />
            <span>Câu Chuyện Nhà Vườn &amp; Triết Lý Canh Tác</span>
          </div>
          <span className="text-xs text-[#7c8676] italic">
            Hiển thị nổi bật trên trang thông tin gian hàng gửi tới khách hàng
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3]">
          {description ? (
            <p className="text-sm text-[#333e2f] leading-relaxed italic">
              &ldquo;{description}&rdquo;
            </p>
          ) : (
            <div className="text-xs text-[#7c8676] space-y-1">
              <p className="font-semibold text-[#326318]">Chưa có lời giới thiệu câu chuyện vườn.</p>
              <p>
                Hãy bấm &quot;Cập Nhật Hồ Sơ&quot; để chia sẻ về quy trình trồng trọt tự nhiên, nguồn
                gốc nông sản và thông điệp nông sản xanh tới người tiêu dùng.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#f4f8f1] border border-[#dbebd2] text-[#2c5316] font-bold flex items-center gap-2.5">
            <span className="text-base">🌱</span>
            <span>100% Nông sản canh tác tự nhiên, chuẩn nguồn gốc</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#fdfaf3] border border-[#f3e3cd] text-[#8a4e1d] font-bold flex items-center gap-2.5">
            <span className="text-base">📦</span>
            <span>Thu hoạch tươi trong ngày, bao gói bảo quản an toàn</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#f0f7f8] border border-[#d2eaed] text-[#195962] font-bold flex items-center gap-2.5">
            <span className="text-base">🤝</span>
            <span>Đồng hành giải cứu nông sản &amp; tránh lãng phí thực phẩm</span>
          </div>
        </div>
      </div>

      {/* 4. Modal Chỉnh Sửa Hồ Sơ Gian Hàng Độc Lập */}
      <EditShopProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        shopProfile={shopProfile}
        user={user}
        onSuccess={(msg) => onInfo?.(msg)}
      />
    </div>
  )
}
