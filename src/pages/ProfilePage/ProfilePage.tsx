import React, { useState, useEffect, useRef } from 'react'
import {
  User,
  MapPin,
  Shield,
  Key,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  Sprout,
  Award,
  Sparkles,
  Phone,
  Mail,
  Home,
  Building2,
  Check,
  Edit2,
  Loader2,
  X,
  ShoppingBag,
  Ticket,
  ChevronRight,
  HelpCircle,
  Info,
  Maximize2,
} from 'lucide-react'
import { authService, getSavedAddresses, createSavedAddress, updateSavedAddress, deleteSavedAddress, setDefaultSavedAddress } from '@/services'
import type { UserResponse } from '@/services/user.types'
import type { SavedAddress, SavedAddressRequest } from '@/types/address.types'
import { useAuth, useUiStore } from '@/stores'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'

type ActiveTab = 'account' | 'address' | 'security'

export default function ProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useAuth()
  const { showToast } = useUiStore()

  const [activeTab, setActiveTab] = useState<ActiveTab>('account')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserResponse | null>(null)

  // Tab 1: Account Form State
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [dietPreference, setDietPreference] = useState<'VEGETARIAN' | 'NON_VEGETARIAN' | 'VEGAN'>('NON_VEGETARIAN')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  // Tab 2: Address Book State
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [addrLabel, setAddrLabel] = useState('Nhà riêng')
  const [addrRecipient, setAddrRecipient] = useState('')
  const [addrPhone, setAddrPhone] = useState('')
  const [addrDetail, setAddrDetail] = useState('')
  const [addrIsDefault, setAddrIsDefault] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  // Tab 3: Security & Password State
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [isChangingPass, setIsChangingPass] = useState(false)

  // Modal: Rescue Program Info & Badge Tiers
  const [isTierModalOpen, setIsTierModalOpen] = useState(false)

  // Load user profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  // Load addresses when switching to address tab
  useEffect(() => {
    if (activeTab === 'address') {
      fetchAddresses()
    }
  }, [activeTab])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await authService.getMyInfo()
      if (res.result) {
        const u = res.result
        setProfile(u)
        setFullName(u.fullName || '')
        setPhoneNumber(u.phoneNumber || u.phone || '')
        setAddress(u.address || '')
        if (u.dietPreference) {
          setDietPreference(u.dietPreference)
        }
        const avatar = u.logoUrl || u.avatar
        if (authUser && avatar && authUser.avatar !== avatar) {
          setAuthUser({
            ...authUser,
            avatar,
          })
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin cá nhân:', err)
      showToast('Không thể tải thông tin tài khoản. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true)
    try {
      const list = await getSavedAddresses()
      setAddresses(list)
    } catch (err) {
      console.error('Lỗi khi tải sổ địa chỉ:', err)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      globalShowAlert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).', 'Ảnh không hợp lệ', 'warning')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      globalShowAlert('Kích thước ảnh tối đa cho phép là 5MB!', 'Ảnh quá lớn', 'warning')
      return
    }

    try {
      setIsUploadingAvatar(true)
      const res = await authService.updateAvatar(file)
      if (res.result) {
        setProfile(res.result)
        if (authUser) {
          setAuthUser({
            ...authUser,
            avatar: res.result.logoUrl || res.result.avatar,
          })
        }
        showToast('Cập nhật ảnh đại diện thành công!')
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể cập nhật ảnh đại diện.'
      globalShowAlert(msg, 'Thất bại', 'error')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  // Handle Update Profile info (Tab 1)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      globalShowAlert('Họ và tên không được để trống.', 'Cảnh báo', 'warning')
      return
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '')
    const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      globalShowAlert(
        'Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại Việt Nam hợp lệ (VD: 0912345678 hoặc +84912345678).',
        'Số điện thoại không hợp lệ',
        'warning'
      )
      return
    }

    try {
      setIsUpdatingProfile(true)
      const updateData = {
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        address: address.trim(),
        dietPreference,
      }
      const res = await authService.updateMyInfo(updateData)
      if (res.result) {
        setProfile(res.result)
        if (authUser) {
          setAuthUser({
            ...authUser,
            name: res.result.fullName,
            phone: res.result.phoneNumber,
          })
        }
        showToast('Cập nhật thông tin tài khoản thành công!')
      }
    } catch (err: any) {
      const rawMsg = err?.data?.message || err?.response?.data?.message || err?.message || ''
      let msg = 'Không thể lưu thay đổi.'
      if (rawMsg.includes('already registered') || rawMsg === 'PHONE_EXISTED' || rawMsg.includes('đã được sử dụng')) {
        msg = 'Số điện thoại này đã được sử dụng bởi một tài khoản khác. Vui lòng kiểm tra lại.'
      } else if (rawMsg.includes('format is invalid') || rawMsg === 'PHONE_NUMBER_INVALID') {
        msg = 'Số điện thoại không đúng định dạng hợp lệ.'
      } else if (rawMsg) {
        msg = rawMsg
      }
      globalShowAlert(msg, 'Thất bại', 'error')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle Open Address Modal (Tab 2)
  const handleOpenAddAddress = () => {
    setEditingAddress(null)
    setAddrLabel('Nhà riêng')
    setAddrRecipient(fullName || authUser?.name || '')
    setAddrPhone(phoneNumber || authUser?.phone || '')
    setAddrDetail('')
    setAddrIsDefault(addresses.length === 0)
    setIsAddressModalOpen(true)
  }

  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr)
    setAddrLabel(addr.label || 'Nhà riêng')
    setAddrRecipient(addr.recipientName)
    setAddrPhone(addr.phone)
    setAddrDetail(addr.address)
    setAddrIsDefault(addr.isDefault)
    setIsAddressModalOpen(true)
  }

  // Handle Save Address (Create or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addrRecipient.trim() || !addrPhone.trim() || !addrDetail.trim()) {
      globalShowAlert('Vui lòng điền đầy đủ thông tin địa chỉ.', 'Cảnh báo', 'warning')
      return
    }

    const cleanAddrPhone = addrPhone.trim().replace(/\s+/g, '')
    const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/
    if (!phoneRegex.test(cleanAddrPhone)) {
      globalShowAlert(
        'Số điện thoại người nhận không hợp lệ (phải gồm 10 chữ số).',
        'Số điện thoại không hợp lệ',
        'warning'
      )
      return
    }

    try {
      setIsSavingAddress(true)
      const payload: SavedAddressRequest = {
        label: addrLabel,
        recipientName: addrRecipient.trim(),
        phone: cleanAddrPhone,
        address: addrDetail.trim(),
        isDefault: addrIsDefault,
      }

      if (editingAddress) {
        await updateSavedAddress(editingAddress.id, payload)
        showToast('Đã cập nhật địa chỉ thành công!')
      } else {
        await createSavedAddress(payload)
        showToast('Đã thêm địa chỉ nhận hàng mới!')
      }

      setIsAddressModalOpen(false)
      await fetchAddresses()
    } catch (err: any) {
      const msg = err?.data?.message || err?.response?.data?.message || err?.message || 'Không thể lưu địa chỉ.'
      globalShowAlert(msg, 'Lỗi', 'error')
    } finally {
      setIsSavingAddress(false)
    }
  }

  // Handle Delete Address
  const handleDeleteAddress = async (addr: SavedAddress) => {
    const ok = await globalShowConfirm(
      'Xóa địa chỉ nhận hàng',
      `Bạn có chắc chắn muốn xóa địa chỉ "${addr.address}" không?`,
    )
    if (!ok) return

    try {
      await deleteSavedAddress(addr.id)
      showToast('Đã xóa địa chỉ thành công.')
      await fetchAddresses()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể xóa địa chỉ.'
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  // Handle Set Default Address
  const handleSetDefaultAddress = async (addrId: number) => {
    try {
      await setDefaultSavedAddress(addrId)
      showToast('Đã đặt làm địa chỉ giao hàng mặc định!')
      await fetchAddresses()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể đặt mặc định.'
      globalShowAlert(msg, 'Lỗi', 'error')
    }
  }

  // Handle Change Password (Tab 3)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword) {
      globalShowAlert('Vui lòng nhập mật khẩu hiện tại.', 'Cảnh báo', 'warning')
      return
    }
    if (newPassword.length < 8) {
      globalShowAlert('Mật khẩu mới phải có tối thiểu 8 ký tự.', 'Mật khẩu quá ngắn', 'warning')
      return
    }
    if (newPassword !== confirmPassword) {
      globalShowAlert('Mật khẩu xác nhận không khớp với mật khẩu mới.', 'Không trùng khớp', 'error')
      return
    }

    try {
      setIsChangingPass(true)
      await authService.updateMyInfo({
        oldPassword: oldPassword,
        password: newPassword,
      })
      globalShowAlert('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.', 'Thành công', 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ!'
      globalShowAlert(msg, 'Đổi mật khẩu thất bại', 'error')
    } finally {
      setIsChangingPass(false)
    }
  }

  // Helper Badge & rescued weight from Backend API (UserResponse.totalRescuedWeight)
  const rescuedKg =
    profile?.totalRescuedWeight !== undefined && profile?.totalRescuedWeight !== null
      ? Number(profile.totalRescuedWeight)
      : 0

  const getBadgeInfo = (kg: number) => {
    if (kg >= 50) {
      return {
        title: 'Đại Sứ Xanh CapNong 🌟',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        nextTier: 'Đã đạt cấp tối đa',
        progressPercent: 100,
      }
    }
    if (kg >= 20) {
      return {
        title: 'Hiệp Sĩ Nông Nghiệp 🎖️',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        nextTier: 'Đại Sứ Xanh (50kg)',
        progressPercent: Math.min(100, Math.round(((kg - 20) / 30) * 100)),
      }
    }
    if (kg >= 5) {
      return {
        title: 'Cứu Tinh Nông Sản 🌾',
        bg: 'bg-green-50 text-green-800 border-green-200',
        nextTier: 'Hiệp Sĩ Nông Nghiệp (20kg)',
        progressPercent: Math.min(100, Math.round(((kg - 5) / 15) * 100)),
      }
    }
    return {
      title: 'Người Gieo Mầm 🌱',
      bg: 'bg-lime-50 text-lime-800 border-lime-200',
      nextTier: 'Cứu Tinh Nông Sản (5kg)',
      progressPercent: Math.min(100, Math.round((kg / 5) * 100)),
    }
  }
  const badge = getBadgeInfo(rescuedKg)

  return (
    <div className="w-full bg-[#f8f6f0] min-h-screen py-6 sm:py-9 text-[#1c2317]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#757e6e] mb-6">
          <a href="/" className="hover:text-[#326318] transition-colors">Trang chủ</a>
          <ChevronRight size={14} className="text-[#a8b1a2]" />
          <span className="font-bold text-[#232a1e]">Tài khoản cá nhân</span>
        </div>

        {/* ============================================================== */}
        {/* MAIN 2-COLUMN LAYOUT (SIDEBAR + CONTENT CANVAS)                */}
        {/* ============================================================== */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ------------------------------------------------------------ */}
          {/* LEFT SIDEBAR: PROFILE SUMMARY & TABS NAVIGATION              */}
          {/* ------------------------------------------------------------ */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            
            {/* 1. Profile Mini Card */}
            <div className="bg-white rounded-2xl border border-[#e6e0d3] p-5 shadow-xs">
              <div className="flex items-center gap-3.5">
                {/* Avatar with zoom & upload trigger */}
                <div className="relative group shrink-0">
                  <div
                    onClick={() => {
                      if (profile?.logoUrl || profile?.avatar) {
                        setIsAvatarModalOpen(true)
                      } else {
                        avatarInputRef.current?.click()
                      }
                    }}
                    className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xs bg-[#326318] text-white flex items-center justify-center text-xl font-black cursor-pointer hover:ring-2 hover:ring-[#326318]/50 transition-all relative"
                    title={profile?.logoUrl || profile?.avatar ? 'Nhấn để mở to ảnh đại diện' : 'Nhấn để tải lên ảnh đại diện'}
                  >
                    {profile?.logoUrl || profile?.avatar ? (
                      <>
                        <img
                          src={profile.logoUrl || profile.avatar}
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 size={16} />
                        </div>
                      </>
                    ) : (
                      <span>{(fullName || authUser?.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Nút camera nhỏ ở góc dưới để đổi ảnh */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      avatarInputRef.current?.click()
                    }}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#326318] hover:bg-[#254b12] text-white flex items-center justify-center shadow-md ring-2 ring-white cursor-pointer disabled:opacity-50 transition-all"
                    title="Thay ảnh đại diện"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Camera size={12} />
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

                {/* Name & Role */}
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sm text-[#1b2216] truncate">
                    {fullName || authUser?.name || 'Thành viên CapNong'}
                  </div>
                  <div className="text-[11px] text-[#717b6a] truncate mt-0.5">
                    {profile?.email || authUser?.email || ''}
                  </div>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                    {badge.title}
                  </span>
                </div>
              </div>

              {/* Environmental Impact Mini Widget */}
              <div className="mt-4 pt-3.5 border-t border-[#ede7dc]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#646e5d] font-medium flex items-center gap-1">
                    <Sprout size={13} className="text-[#326318]" />
                    Đã giải cứu:
                  </span>
                  <span className="font-extrabold text-[#326318]">{rescuedKg.toLocaleString('vi-VN')} kg</span>
                </div>
                <div className="w-full bg-[#f0ecdf] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#488e23] h-full rounded-full transition-all duration-500"
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#818b7a] mt-1">
                  <span>Cấp tiếp theo: <strong>{badge.nextTier}</strong></span>
                  <span>{badge.progressPercent}%</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(true)}
                  className="mt-2.5 text-[10.5px] text-[#326318] hover:text-[#21430e] hover:underline font-bold flex items-center gap-1.5 cursor-pointer w-full justify-center pt-2 border-t border-[#ede7dc] transition-colors"
                >
                  <HelpCircle size={13} />
                  <span>Quy chế tích lũy &amp; Quyền lợi cấp bậc</span>
                </button>
              </div>
            </div>

            {/* 2. Vertical Navigation Menu */}
            <div className="bg-white rounded-2xl border border-[#e6e0d3] p-2 shadow-xs">
              <nav className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                    activeTab === 'account'
                      ? 'bg-[#326318] text-white shadow-xs'
                      : 'text-[#4e5845] hover:bg-[#f5f1e8] hover:text-[#1b2216]'
                  }`}
                >
                  <User size={16} />
                  <span className="flex-1">Thông tin tài khoản</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('address')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                    activeTab === 'address'
                      ? 'bg-[#326318] text-white shadow-xs'
                      : 'text-[#4e5845] hover:bg-[#f5f1e8] hover:text-[#1b2216]'
                  }`}
                >
                  <MapPin size={16} />
                  <span className="flex-1">Sổ địa chỉ nhận hàng</span>
                  {addresses.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === 'address' ? 'bg-white/20 text-white' : 'bg-[#ece6d9] text-[#4d5645]'
                      }`}
                    >
                      {addresses.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-[#326318] text-white shadow-xs'
                      : 'text-[#4e5845] hover:bg-[#f5f1e8] hover:text-[#1b2216]'
                  }`}
                >
                  <Key size={16} />
                  <span className="flex-1">Bảo mật & Đổi mật khẩu</span>
                </button>

                <hr className="my-1.5 border-[#eee8db]" />

                {/* Quick Link: Đơn hàng */}
                <a
                  href="/orders"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-[#4e5845] hover:bg-[#f5f1e8] hover:text-[#1b2216] transition-colors"
                >
                  <ShoppingBag size={16} className="text-[#326318]" />
                  <span className="flex-1">Đơn hàng của tôi</span>
                </a>

                {/* Quick Link: Kho Voucher */}
                <a
                  href="/my-vouchers"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-[#4e5845] hover:bg-[#f5f1e8] hover:text-[#1b2216] transition-colors"
                >
                  <Ticket size={16} className="text-amber-600" />
                  <span className="flex-1">Kho Voucher của tôi</span>
                </a>
              </nav>
            </div>

            {/* Support Hotline Widget */}
            <div className="bg-[#f2efe4] rounded-2xl p-4 text-xs text-[#636d5c]">
              <div className="font-bold text-[#232a1e] mb-1">Cần hỗ trợ tài khoản?</div>
              <p className="text-[11px] leading-relaxed mb-2">Đội ngũ CapNong luôn sẵn sàng hỗ trợ bạn:</p>
              <div className="font-bold text-[#326318] text-[11px]">Hotline: 1900 6868</div>
            </div>

          </aside>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT COLUMN: MAIN CONTENT CANVAS                           */}
          {/* ------------------------------------------------------------ */}
          <main className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-[#e6e0d3] p-6 sm:p-7 shadow-xs">
            
            {/* ========================================================== */}
            {/* TAB 1: THÔNG TIN TÀI KHOẢN                                 */}
            {/* ========================================================== */}
            {activeTab === 'account' && (
              <div>
                <div className="pb-4 mb-6 border-b border-[#eee8da]">
                  <h2 className="text-base sm:text-lg font-black text-[#1b2216]">Hồ sơ cá nhân</h2>
                  <p className="text-xs text-[#707967] mt-0.5">
                    Quản lý thông tin hồ sơ để bảo mật tài khoản và đặt hàng nông sản thuận tiện.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  
                  {/* 2-Column Grid for Primary Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#373f30] mb-1.5">Email tài khoản</label>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#f7f5ed] border border-[#e2dcd0] text-xs text-[#707968]">
                        <Mail size={14} className="text-[#889280] shrink-0" />
                        <input
                          type="email"
                          disabled
                          value={profile?.email || authUser?.email || ''}
                          className="w-full bg-transparent outline-none cursor-not-allowed text-xs text-[#707968]"
                        />
                      </div>
                      <span className="text-[10px] text-[#8e9887] mt-1 block">Email dùng để đăng nhập và không thể đổi.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#373f30] mb-1.5">Vai trò hệ thống</label>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#f7f5ed] border border-[#e2dcd0] text-xs text-[#707968]">
                        <Shield size={14} className="text-[#326318] shrink-0" />
                        <span className="uppercase font-bold text-[#232b1d]">{authUser?.role || 'Khách Mua'}</span>
                      </div>
                      <span className="text-[10px] text-[#8e9887] mt-1 block">Quyền hạn truy cập tài nguyên trên CapNong.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#373f30] mb-1.5">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên của bạn"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#d5cebf] focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-xs text-[#1c2317] outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#373f30] mb-1.5">Số điện thoại liên hệ</label>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#d5cebf] focus-within:border-[#326318] focus-within:ring-1 focus-within:ring-[#326318] transition-all">
                        <Phone size={14} className="text-[#838e7b] shrink-0" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full bg-transparent outline-none text-xs text-[#1c2317]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Địa chỉ mặc định */}
                  <div>
                    <label className="block text-xs font-bold text-[#373f30] mb-1.5">Địa chỉ mặc định nhận hàng</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#d5cebf] focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-xs text-[#1c2317] outline-none transition-all"
                    />
                  </div>

                  {/* Chế độ ăn uống ưu tiên */}
                  <div>
                    <label className="block text-xs font-bold text-[#373f30] mb-2">Chế độ dinh dưỡng ưu tiên</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setDietPreference('NON_VEGETARIAN')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          dietPreference === 'NON_VEGETARIAN'
                            ? 'border-[#326318] bg-[#f0f6ec] ring-1 ring-[#326318]'
                            : 'border-[#dfd8cb] hover:bg-[#faf7f0]'
                        }`}
                      >
                        <div className="text-lg mb-1">🥩</div>
                        <div className="text-xs font-bold text-[#1c2317]">Đa dạng</div>
                        <div className="text-[10px] text-[#717b69]">Ăn mặn & rau củ quả</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDietPreference('VEGETARIAN')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          dietPreference === 'VEGETARIAN'
                            ? 'border-[#326318] bg-[#f0f6ec] ring-1 ring-[#326318]'
                            : 'border-[#dfd8cb] hover:bg-[#faf7f0]'
                        }`}
                      >
                        <div className="text-lg mb-1">🥗</div>
                        <div className="text-xs font-bold text-[#1c2317]">Ăn Chay</div>
                        <div className="text-[10px] text-[#717b69]">Linh hoạt (trứng, sữa)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDietPreference('VEGAN')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          dietPreference === 'VEGAN'
                            ? 'border-[#326318] bg-[#f0f6ec] ring-1 ring-[#326318]'
                            : 'border-[#dfd8cb] hover:bg-[#faf7f0]'
                        }`}
                      >
                        <div className="text-lg mb-1">🌱</div>
                        <div className="text-xs font-bold text-[#1c2317]">Thuần Chay</div>
                        <div className="text-[10px] text-[#717b69]">100% Thực vật sạch</div>
                      </button>
                    </div>
                  </div>

                  {/* Form Action */}
                  <div className="pt-4 border-t border-[#eee8da] flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="px-6 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>Lưu thay đổi</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 2: SỔ ĐỊA CHỈ NHẬN HÀNG                               */}
            {/* ========================================================== */}
            {activeTab === 'address' && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#eee8da]">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#1b2216]">Sổ địa chỉ nhận hàng</h2>
                    <p className="text-xs text-[#707967] mt-0.5">
                      Quản lý danh sách địa chỉ nhận hàng để thanh toán nhanh chóng hơn.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="px-4 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={15} />
                    <span>Thêm địa chỉ mới</span>
                  </button>
                </div>

                {isLoadingAddresses ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={26} className="animate-spin text-[#326318]" />
                    <span className="text-xs text-[#707967]">Đang tải danh sách địa chỉ...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="py-14 text-center flex flex-col items-center justify-center gap-2.5">
                    <div className="w-12 h-12 rounded-full bg-[#f4f7f0] text-[#326318] flex items-center justify-center">
                      <MapPin size={22} />
                    </div>
                    <h3 className="font-bold text-sm text-[#1c2317]">Chưa có địa chỉ nào được lưu</h3>
                    <p className="text-xs text-[#7d8776] max-w-sm">
                      Thêm địa chỉ giao hàng để tiến hành thanh toán và nhận nông sản cứu trợ nhanh chóng hơn!
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="mt-2 px-4 py-1.5 rounded-xl border border-[#326318] text-[#326318] hover:bg-[#326318] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      + Thêm địa chỉ đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          addr.isDefault
                            ? 'border-[#326318] bg-[#f9fbf7] ring-1 ring-[#326318]'
                            : 'border-[#e4ded2] bg-white hover:border-[#c5bdab]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-[#f0ebd9] text-[#635a43] font-bold text-[10px] flex items-center gap-1">
                                {addr.label === 'Văn phòng' ? <Building2 size={11} /> : <Home size={11} />}
                                {addr.label || 'Địa chỉ'}
                              </span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 rounded-md bg-[#326318] text-white font-bold text-[10px] flex items-center gap-1">
                                  <Check size={11} />
                                  Mặc định
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAddress(addr)}
                                className="p-1.5 rounded-lg text-[#616c59] hover:text-[#326318] hover:bg-[#f2efe6] transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr)}
                                className="p-1.5 rounded-lg text-[#889280] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Xóa địa chỉ"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="font-extrabold text-xs text-[#1c2317] mb-0.5">
                            {addr.recipientName} · <span className="font-normal text-[#596252]">{addr.phone}</span>
                          </div>
                          <p className="text-xs text-[#525b4b] leading-relaxed">
                            {addr.address}
                          </p>
                        </div>

                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[11px] font-bold text-[#326318] hover:underline self-start pt-2 border-t border-[#ede7dc] w-full text-left cursor-pointer"
                          >
                            Thiết lập làm địa chỉ mặc định
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU                             */}
            {/* ========================================================== */}
            {activeTab === 'security' && (
              <div className="max-w-xl">
                <div className="pb-4 mb-6 border-b border-[#eee8da]">
                  <h2 className="text-base sm:text-lg font-black text-[#1b2216]">Đổi mật khẩu tài khoản</h2>
                  <p className="text-xs text-[#707967] mt-0.5">
                    Để bảo vệ tài khoản, vui lòng dùng mật khẩu mạnh và không chia sẻ cho người khác.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Mật khẩu cũ */}
                  <div>
                    <label className="block text-xs font-bold text-[#373f30] mb-1.5">Mật khẩu hiện tại *</label>
                    <div className="relative">
                      <input
                        type={showOldPass ? 'text' : 'password'}
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu bạn đang sử dụng"
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white border border-[#d5cebf] focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-xs text-[#1c2317] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-2.5 text-[#7a8373] hover:text-[#326318]"
                      >
                        {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-bold text-[#373f30] mb-1.5">Mật khẩu mới (tối thiểu 8 ký tự) *</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white border border-[#d5cebf] focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-xs text-[#1c2317] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-[#7a8373] hover:text-[#326318]"
                      >
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-bold text-[#373f30] mb-1.5">Xác nhận mật khẩu mới *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white border border-[#d5cebf] focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-xs text-[#1c2317] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-2.5 text-[#7a8373] hover:text-[#326318]"
                      >
                        {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Quy tắc bảo mật */}
                  <div className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#ede5d6] text-xs text-[#6e7766] space-y-1">
                    <div className="font-bold text-[#1c2317] flex items-center gap-1.5 text-xs">
                      <CheckCircle2 size={13} className="text-[#326318]" />
                      <span>Quy tắc bảo mật mật khẩu</span>
                    </div>
                    <p className="text-[11px]">• Tối thiểu 8 ký tự, khuyến nghị bao gồm cả chữ số và ký tự đặc biệt.</p>
                    <p className="text-[11px]">• Tránh dùng các mật khẩu dễ đoán như 12345678, ngày tháng năm sinh.</p>
                  </div>

                  <div className="pt-3 border-t border-[#eee8da] flex justify-end">
                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="px-6 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {isChangingPass ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Đang cập nhật...</span>
                        </>
                      ) : (
                        <>
                          <Key size={14} />
                          <span>Cập nhật mật khẩu</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT ADDRESS                                      */}
      {/* ============================================================== */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ede7dc]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede7dc] mb-4">
              <h3 className="font-extrabold text-base text-[#1c2317]">
                {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ nhận hàng'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#353d2d] mb-1.5">Loại địa chỉ</label>
                <div className="flex gap-2">
                  {['Nhà riêng', 'Văn phòng', 'Nhà bố mẹ'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddrLabel(lbl)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        addrLabel === lbl
                          ? 'border-[#326318] bg-[#f0f6ec] text-[#326318]'
                          : 'border-[#dfd8cb] hover:bg-[#faf7f0] text-[#555f4e]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#353d2d] mb-1">Tên người nhận *</label>
                <input
                  type="text"
                  required
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  placeholder="Họ và tên người nhận"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#d8d2c5] focus:border-[#326318] text-xs text-[#1c2317] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#353d2d] mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#d8d2c5] focus:border-[#326318] text-xs text-[#1c2317] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#353d2d] mb-1">Địa chỉ chi tiết nhận hàng *</label>
                <textarea
                  required
                  rows={3}
                  value={addrDetail}
                  onChange={(e) => setAddrDetail(e.target.value)}
                  placeholder="Số nhà, tên đường, tòa nhà, phường/xã, quận/huyện, tỉnh/thành phố..."
                  className="w-full p-3 rounded-xl bg-white border border-[#d8d2c5] focus:border-[#326318] text-xs text-[#1c2317] outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addrDefault"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="rounded text-[#326318] focus:ring-[#326318] cursor-pointer"
                />
                <label htmlFor="addrDefault" className="text-xs text-[#353d2d] font-semibold cursor-pointer select-none">
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div className="pt-3 border-t border-[#ede7dc] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl border border-[#d4cdbf] text-xs font-bold text-[#555f4e] hover:bg-[#faf7f0] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-4 py-1.5 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingAddress ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>Lưu địa chỉ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RESCUE PROGRAM INFO & BADGE TIERS                       */}
      {/* ============================================================== */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ede7dc] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede7dc] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#f2f7ec] text-[#326318] flex items-center justify-center shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1c2317]">
                    Chương Trình Giải Cứu Nông Sản
                  </h3>
                  <p className="text-[11px] text-[#707967]">Đồng hành chống lãng phí – Tiếp sức nông dân Việt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTierModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f4efe4] hover:bg-[#eae3d5] text-[#333a2e] flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#444c3c]">
              {/* Giới thiệu cách thức */}
              <div className="p-3.5 rounded-xl bg-[#f8faf6] border border-[#dce8d3] space-y-2">
                <div className="font-bold text-[#20271b] flex items-center gap-1.5 text-xs">
                  <Sprout size={14} className="text-[#326318]" />
                  <span>Cách tính số kg nông sản giải cứu</span>
                </div>
                <p className="text-[11px] text-[#55604e] leading-relaxed">
                  Mỗi khi bạn đặt và nhận hàng thành công các sản phẩm <strong>rau củ quả xấu mã hoặc combo nông sản</strong> trên sàn CapNong, tổng trọng lượng (kg) thực tế của đơn hàng sẽ được hệ thống <strong>tự động tích lũy</strong> vào hồ sơ tài khoản của bạn.
                </p>
              </div>

              {/* Bảng các cấp bậc & Đặc quyền */}
              <div>
                <h4 className="font-bold text-xs text-[#20271b] mb-2.5 flex items-center gap-1">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Các cấp bậc huy hiệu &amp; Đặc quyền</span>
                </h4>

                <div className="space-y-2.5">
                  {[
                    {
                      tier: 'Người Gieo Mầm',
                      icon: '🌱',
                      range: 'Dưới 5 kg',
                      color: 'border-lime-200 bg-lime-50/50 text-lime-900',
                      perk: 'Huy hiệu thành viên ban đầu, gợi ý combo rau củ quả phù hợp theo mùa vụ.',
                    },
                    {
                      tier: 'Cứu Tinh Nông Sản',
                      icon: '🌾',
                      range: '5 kg – 19.9 kg',
                      color: 'border-green-200 bg-green-50/50 text-green-900',
                      perk: 'Tặng voucher giảm 15k, gắn huy hiệu Cứu Tinh nổi bật khi đánh giá sản phẩm.',
                    },
                    {
                      tier: 'Hiệp Sĩ Nông Nghiệp',
                      icon: '🎖️',
                      range: '20 kg – 49.9 kg',
                      color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
                      perk: 'Ưu tiên tiếp cận Combo Túi Mù độc quyền, miễn phí vận chuyển 2 đơn/tháng.',
                    },
                    {
                      tier: 'Đại Sứ Xanh CapNong',
                      icon: '🌟',
                      range: 'Từ 50 kg trở lên',
                      color: 'border-amber-200 bg-amber-50/50 text-amber-900',
                      perk: 'Hạng danh dự cao nhất, voucher độc quyền 25k, nhận quà tri ân thường niên từ CapNong.',
                    },
                  ].map((item) => (
                    <div
                      key={item.tier}
                      className={`p-3 rounded-xl border ${item.color} flex items-start gap-2.5`}
                    >
                      <span className="text-xl shrink-0 leading-none">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-extrabold text-xs">{item.tier}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/80 border border-current">
                            {item.range}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">{item.perk}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông điệp ý nghĩa môi trường */}
              <div className="p-3 rounded-xl bg-[#faf7ef] border border-[#ede5d6] text-[11px] text-[#6a7463] leading-relaxed">
                💚 Mỗi kg nông sản bạn chung tay giải cứu không chỉ giúp người nông dân có thêm thu nhập xứng đáng mà còn giúp cắt giảm khí nhà kính (metan) từ nông sản bị chôn lấp lãng phí.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL PHÓNG TO ẢNH ĐẠI DIỆN (AVATAR LIGHTBOX)              */}
      {/* ========================================================== */}
      {isAvatarModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsAvatarModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm sm:max-w-md w-full border border-stone-200 p-6 text-center animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            {/* Tiêu đề & Thông tin */}
            <h3 className="text-base font-extrabold text-[#1c2e17] mb-1">
              Ảnh đại diện
            </h3>
            <p className="text-xs text-[#6e7766] mb-5">
              {fullName || authUser?.name} &bull; {profile?.email || authUser?.email}
            </p>

            {/* Khung hiển thị ảnh lớn */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-stone-100 relative">
              {profile?.logoUrl || profile?.avatar ? (
                <img
                  src={profile.logoUrl || profile.avatar}
                  alt={profile.fullName || 'Ảnh đại diện'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#326318] text-white flex items-center justify-center text-7xl font-black">
                  {(fullName || authUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Các nút hành động */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  avatarInputRef.current?.click()
                }}
                disabled={isUploadingAvatar}
                className="px-4 py-2.5 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Camera size={15} />
                )}
                <span>Thay đổi ảnh mới</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#d6cfbe] bg-white text-[#2a3520] font-bold text-xs hover:bg-[#f6f2e8] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
