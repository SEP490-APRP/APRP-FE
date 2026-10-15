import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Save,
  Loader2,
  UploadCloud,
  Building2,
  User,
  Phone,
  MapPin,
  Sparkles,
  Award,
  FileText,
  CreditCard,
} from 'lucide-react'
import type { AuthUser } from '@/features/auth'
import type { UserResponse } from '@/services/user.types'
import { useUpdateShopProfile } from '../hooks/useShopProfile'
import { uploadService } from '@/services'
import { globalShowAlert } from '@/components/common/Popup'

export interface EditShopProfileModalProps {
  isOpen: boolean
  onClose: () => void
  shopProfile?: UserResponse | null
  user?: AuthUser | null
  onSuccess?: (msg: string) => void
}

export function EditShopProfileModal({
  isOpen,
  onClose,
  shopProfile,
  user,
  onSuccess,
}: EditShopProfileModalProps) {
  const updateProfileMutation = useUpdateShopProfile()
  const [isUploadingLicense, setIsUploadingLicense] = useState(false)
  const licenseInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    shopName: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    description: '',
    achievement: '',
    license: '',
    licenseImageUrl: '',
    logoUrl: '',
    bankName: '',
    bankAccount: '',
    bankAccountHolder: '',
  })

  // Synchronize initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        shopName: shopProfile?.shopName || user?.shopName || '',
        fullName: shopProfile?.fullName || user?.name || '',
        phoneNumber: shopProfile?.phoneNumber || (shopProfile as any)?.phone || user?.phone || '',
        address: shopProfile?.address || user?.address || '',
        description: shopProfile?.description || '',
        achievement: shopProfile?.achievement || '',
        license: shopProfile?.license || '',
        licenseImageUrl: shopProfile?.licenseImageUrl || '',
        logoUrl: shopProfile?.logoUrl || user?.avatar || '',
        bankName: shopProfile?.bankName || '',
        bankAccount: shopProfile?.bankAccount || (shopProfile as any)?.bankAccountNumber || '',
        bankAccountHolder:
          shopProfile?.bankAccountHolder ||
          (shopProfile as any)?.bankAccountName ||
          shopProfile?.fullName ||
          '',
      })
    }
  }, [isOpen, shopProfile, user])

  if (!isOpen) return null

  // Handle license image upload to Cloudinary
  const handleLicenseImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      globalShowAlert('Vui lòng chọn tệp hình ảnh hợp lệ.', 'Tệp không hợp lệ', 'warning')
      return
    }

    try {
      setIsUploadingLicense(true)
      const res = await uploadService.uploadImage(file, 'licenses')
      const uploadedUrl = res.result?.url
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, licenseImageUrl: uploadedUrl }))
      }
    } catch (err) {
      console.error('Failed to upload license image:', err)
      globalShowAlert('Không thể tải ảnh chứng nhận lên. Vui lòng thử lại.', 'Lỗi', 'error')
    } finally {
      setIsUploadingLicense(false)
      if (e.target) e.target.value = ''
    }
  }

  // Handle Profile Update Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.shopName.trim() || !formData.fullName.trim()) {
      globalShowAlert(
        'Vui lòng điền tên gian hàng và họ tên chủ vườn đại diện.',
        'Thiếu thông tin',
        'warning',
      )
      return
    }

    try {
      await updateProfileMutation.mutateAsync(formData)
      const successMsg = 'Cập nhật hồ sơ nhà vườn thành công!'
      onSuccess?.(successMsg)
      globalShowAlert(successMsg, 'Thành công', 'success')
      onClose()
    } catch (err: any) {
      console.error('Lỗi khi cập nhật hồ sơ:', err)
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu thông tin.'
      globalShowAlert(msg, 'Cập nhật thất bại', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ede8df] relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer transition-colors"
          title="Đóng cửa sổ"
        >
          <X size={18} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2 text-[#326318] text-xs font-bold uppercase tracking-wide">
            <Sparkles size={16} />
            <span>Cập Nhật Thông Tin Nhà Vườn</span>
          </div>

          <h2 className="text-xl font-black text-[#1c2216]">Hồ Sơ Gian Hàng &amp; Pháp Nhân</h2>

          {/* 1. Tên gian hàng & Chủ vườn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1">
                <Building2 size={13} /> Tên Gian Hàng / Nhà Vườn *
              </label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="VD: Nông Sản Xấu Mã - Vườn Đà Lạt"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:border-[#326318] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1">
                <User size={13} /> Chủ Vườn Đại Diện *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Họ và tên chủ vườn..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:border-[#326318] outline-none"
              />
            </div>
          </div>

          {/* 2. Số điện thoại & Địa chỉ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1">
                <Phone size={13} /> Số Điện Thoại Liên Hệ *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="VD: 0933333333"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:border-[#326318] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1">
                <MapPin size={13} /> Địa Chỉ Kho / Vườn Xuất Hàng *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Địa chỉ xuất nông sản cho shipper..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:border-[#326318] outline-none"
              />
            </div>
          </div>

          {/* 3. Giới thiệu câu chuyện vườn */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#3a4234]">
              Giới Thiệu Câu Chuyện Nhà Vườn
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chia sẻ về quy trình trồng trọt tự nhiên, triết lý canh tác xanh hoặc nguồn gốc nông sản..."
              className="w-full p-3 rounded-xl border border-[#d8d3c5] text-xs focus:border-[#326318] outline-none leading-relaxed"
            />
          </div>

          {/* 4. Chứng nhận nông sản & Mã số GPKD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1">
                <Award size={13} /> Chứng Nhận Nông Nghiệp
              </label>
              <input
                type="text"
                value={formData.achievement}
                onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                placeholder="VD: Chuẩn VietGAP, Hữu cơ PGS, OCOP..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:border-[#326318] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#3a4234] flex items-center gap-1">
                <FileText size={13} /> Mã Số GPKD / ĐKKD
              </label>
              <input
                type="text"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                placeholder="VD: 0312345678"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d8d3c5] text-xs focus:border-[#326318] outline-none"
              />
            </div>
          </div>

          {/* 5. Ảnh giấy phép / Chứng chỉ pháp lý */}
          <div className="p-3.5 rounded-2xl bg-[#fafcf9] border border-[#e8efe3] space-y-2">
            <label className="text-xs font-extrabold text-[#3a4234] block">
              Ảnh Chụp Giấy Chứng Nhận / Đăng Ký Kinh Doanh
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => licenseInputRef.current?.click()}
                disabled={isUploadingLicense}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#326318] text-[#326318] text-xs font-bold hover:bg-[#326318] hover:text-white transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isUploadingLicense ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UploadCloud size={14} />
                )}
                <span>Tải ảnh chứng nhận</span>
              </button>
              <input
                ref={licenseInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLicenseImageChange}
              />

              <input
                type="url"
                value={formData.licenseImageUrl}
                onChange={(e) => setFormData({ ...formData, licenseImageUrl: e.target.value })}
                placeholder="Hoặc dán liên kết URL ảnh giấy phép (https://...)"
                className="flex-1 px-3 py-2 rounded-xl border border-[#d8d3c5] bg-white text-xs focus:border-[#326318] outline-none"
              />
            </div>

            {formData.licenseImageUrl && (
              <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#d8d3c5] mt-1">
                <img
                  src={formData.licenseImageUrl}
                  alt="Giấy phép"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, licenseImageUrl: '' })}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* 6. Tài khoản ngân hàng quyết toán */}
          <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#f3e3cd] space-y-3">
            <span className="text-xs font-black text-[#8a4e1d] flex items-center gap-1.5 uppercase">
              <CreditCard size={14} /> Thông Tin Ngân Hàng Nhận Quyết Toán
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d5b4a]">Tên Ngân Hàng</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="VD: Vietcombank"
                  className="w-full px-3 py-2 rounded-xl border border-[#e5d2bc] bg-white text-xs focus:border-[#8a4e1d] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d5b4a]">Số Tài Khoản</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  placeholder="VD: 0071000123456"
                  className="w-full px-3 py-2 rounded-xl border border-[#e5d2bc] bg-white text-xs focus:border-[#8a4e1d] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6d5b4a]">Tên Chủ Tài Khoản</label>
                <input
                  type="text"
                  value={formData.bankAccountHolder}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccountHolder: e.target.value.toUpperCase() })
                  }
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full px-3 py-2 rounded-xl border border-[#e5d2bc] bg-white text-xs focus:border-[#8a4e1d] outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#ede7dc]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <X size={15} />
              <span>Hủy bỏ</span>
            </button>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending || isUploadingLicense}
              className="px-6 py-2.5 rounded-full bg-[#326318] hover:bg-[#254b12] text-white text-xs font-black uppercase tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Lưu Hồ Sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
