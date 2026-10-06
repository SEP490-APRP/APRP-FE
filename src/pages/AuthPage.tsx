import { useState, useEffect, type FormEvent } from 'react'
import {
  Leaf,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Store,
  Phone,
  User,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Hourglass,
  Home,
  Upload,
  CreditCard,
  FileText,
  Sparkles,
  X,
  Check,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import authBannerImg from '../assets/auth-shelf-banner.jpg'
import {
  loginSchema,
  memberRegisterSchema,
  REGISTER_DEFAULTS,
  shopAccountSchema,
  shopKycSchema,
  type AuthUser,
  type LoginValues,
  type RegisterValues,
} from '@/features/auth'
import { validate } from '@/utils'

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'kyc_pending'
  initialRole?: 'buyer' | 'shop' | 'shipper'
  onLoginSuccess?: (user: AuthUser) => void
  onInfo?: (msg: string) => void
}

export default function AuthPage({
  initialMode = 'login',
  initialRole = 'buyer',
  onLoginSuccess,
  onInfo,
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'kyc_pending'>(initialMode)
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'shop' | 'shipper'>(initialRole)
  const [shopRegisterStep, setShopRegisterStep] = useState<1 | 2>(1)
  const [showReviewKycModal, setShowReviewKycModal] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  // Form đăng nhập / đăng ký: React Hook Form giữ giá trị, schema Zod (features/auth) kiểm tra.
  // Một form đăng ký chung cho mọi vai trò để không mất dữ liệu khi đổi vai trò hoặc bước.
  const loginForm = useForm<LoginValues>({ defaultValues: { identifier: '', password: '' } })
  const registerForm = useForm<RegisterValues>({ defaultValues: REGISTER_DEFAULTS })
  const {
    fullName: regFullName,
    phone: regPhone,
    email: regEmail,
    shopName,
    shopAddress,
    shopRegion,
    shopFarmingType,
    shopBankName,
    shopBankAccount,
    shopBankHolder,
  } = useWatch({ control: registerForm.control })
  const [shopLogoPreview, setShopLogoPreview] = useState<string>('')
  const [shopCertPreview, setShopCertPreview] = useState<string>('')

  // Sync with URL Hash changes
  useEffect(() => {
    const hash = window.location.hash.toLowerCase()
    if (hash.includes('dang-ky') || hash.includes('register')) {
      setMode('register')
    } else if (hash.includes('dang-nhap') || hash.includes('login')) {
      setMode('login')
    } else if (hash.includes('kyc') || hash.includes('cho-duyet')) {
      setMode('kyc_pending')
    }

    if (hash.includes('role=shop') || hash.includes('ban-nong-san') || hash.includes('nha-vuon')) {
      setSelectedRole('shop')
    } else if (hash.includes('role=shipper') || hash.includes('giao-hang')) {
      setSelectedRole('shipper')
    } else if (hash.includes('role=buyer')) {
      setSelectedRole('buyer')
    }
  }, [])

  // Standard Login Submit
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const result = validate(loginSchema, loginForm.getValues())
    if (!result.ok) {
      setError(result.error)
      return
    }
    const loginEmail = result.data.identifier

    // Detect if logging in as shop
    const isShopAccount =
      loginEmail.toLowerCase().includes('shop') ||
      loginEmail.toLowerCase().includes('vuon') ||
      loginEmail.toLowerCase().includes('farmer')

    const isEmail = loginEmail.includes('@')
    const user: AuthUser = {
      name: isShopAccount
        ? 'Nông Trại Cầu Đất Farm'
        : isEmail
          ? loginEmail.split('@')[0]
          : 'Thành viên CapNong',
      email: isEmail ? loginEmail : `${loginEmail}@capnong.vn`,
      phone: isEmail ? '0912 345 678' : loginEmail,
      role: isShopAccount ? 'shop' : 'buyer',
      detail: isShopAccount ? 'Chủ gian hàng nông sản' : 'Thành viên đang hoạt động',
      shopName: isShopAccount ? 'Nông Trại Cầu Đất' : undefined,
      kycStatus: isShopAccount ? 'APPROVED' : undefined,
    }

    setSuccessNotice(
      isShopAccount
        ? 'Đăng nhập Gian Hàng thành công! Đang chuyển đến bảng quản lý...'
        : 'Đăng nhập thành công! Đang chuyển hướng...',
    )

    if (onLoginSuccess) {
      setTimeout(() => {
        onLoginSuccess(user)
      }, 600)
    }
  }

  // Quick Demo Login for Shop
  const handleQuickShopLogin = () => {
    const shopUser: AuthUser = {
      name: 'Nông Trại Cầu Đất Đà Lạt',
      email: 'caudat.farm@capnong.vn',
      phone: '0988 123 456',
      role: 'shop',
      shopName: 'HTX Nông Sản Cầu Đất',
      detail: 'Đà Lạt · VietGAP & Hữu cơ',
      kycStatus: 'APPROVED',
    }
    setSuccessNotice('Đăng nhập nhanh với tài khoản Nhà Vườn thành công!')
    if (onLoginSuccess) {
      setTimeout(() => {
        onLoginSuccess(shopUser)
      }, 500)
    }
  }

  // Quick Demo Login for Admin
  const handleQuickAdminLogin = () => {
    const adminUser: AuthUser = {
      name: 'Quản Trị Viên Hệ Thống',
      email: 'admin@capnong.vn',
      phone: '0901 234 567',
      role: 'admin',
      detail: 'Ban Quản Trị Trung Tâm CapNong',
      kycStatus: 'APPROVED',
    }
    setSuccessNotice('Đăng nhập Quản Trị Viên thành công! Đang chuyển tới Admin Portal...')
    if (onLoginSuccess) {
      setTimeout(() => {
        onLoginSuccess(adminUser)
      }, 500)
    }
  }

  // Google Login
  const handleGoogleLogin = () => {
    const googleUser: AuthUser = {
      name: selectedRole === 'shop' ? 'Nông Hộ Xanh Organic' : 'Nguyễn Thu Trang',
      email: 'thutrang.capnong@gmail.com',
      phone: '0912 345 678',
      role: selectedRole,
      detail:
        selectedRole === 'shop' ? 'Đăng ký qua Google · Chờ xác thực' : 'Đăng nhập qua Google',
      kycStatus: selectedRole === 'shop' ? 'PENDING' : undefined,
    }
    setSuccessNotice('Đăng nhập thành công qua Google!')
    if (onLoginSuccess) {
      setTimeout(() => {
        onLoginSuccess(googleUser)
      }, 500)
    }
  }

  // Step 1 to Step 2 validation for Shop
  const handleProceedShopStep2 = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const result = validate(shopAccountSchema, registerForm.getValues())
    if (!result.ok) {
      setError(result.error)
      return
    }

    setShopRegisterStep(2)
  }

  // Final Register Submit
  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const values = registerForm.getValues()

    if (selectedRole === 'shop') {
      const result = validate(shopKycSchema, values)
      if (!result.ok) {
        setError(result.error)
        return
      }

      // Transition to KYC Pending Screen for Shop
      setMode('kyc_pending')
      setSuccessNotice('Hồ sơ gian hàng đã nộp thành công! Hệ thống đang chờ phê duyệt.')
      return
    }

    // Buyer & Shipper
    const result = validate(memberRegisterSchema, values)
    if (!result.ok) {
      setError(result.error)
      return
    }

    const newUser: AuthUser = {
      name: values.fullName,
      email: values.email || `${values.phone}@capnong.vn`,
      phone: values.phone || '0900 000 000',
      role: selectedRole,
      detail: selectedRole === 'buyer' ? 'Khách hàng mới' : `Tài xế · ${values.shipperVehicle}`,
    }

    setSuccessNotice(`Đăng ký tài khoản ${getRoleLabel(selectedRole)} thành công!`)
    if (onLoginSuccess) {
      setTimeout(() => {
        onLoginSuccess(newUser)
      }, 700)
    }
  }

  function getRoleLabel(role: 'buyer' | 'shop' | 'shipper'): string {
    switch (role) {
      case 'buyer':
        return 'Người mua (Buyer)'
      case 'shop':
        return 'Nhà vườn / Cửa hàng (Shop)'
      case 'shipper':
        return 'Tài xế giao hàng (Shipper)'
    }
  }

  // Mock Upload Handler
  const handleFakeUpload = (type: 'logo' | 'cert') => {
    if (type === 'logo') {
      setShopLogoPreview(
        'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=400&q=80',
      )
      onInfo?.('Đã tải lên Logo nông trại')
    } else {
      setShopCertPreview(
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
      )
      onInfo?.('Đã tải lên Chứng nhận VietGAP/Hữu cơ')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      {/* Background Image with Dark/Warm Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={authBannerImg}
          alt="CapNong Farm Produce Background"
          className="w-full h-full object-cover object-center filter brightness-[0.92]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/35 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 min-h-[580px]">
        {/* ========================================================================= */}
        {/* LEFT SIDE: BRAND LOGO & INSPIRATIONAL CALLOUT                             */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between self-stretch py-4 text-white">
          <div>
            <a
              href="#/"
              className="inline-flex items-center gap-2 bg-[#326318] hover:bg-[#254b12] text-white px-4 py-2 rounded-full font-bold text-sm sm:text-base shadow-lg transition-all hover:scale-105 border border-white/20"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Leaf size={14} className="text-white fill-white" />
              </div>
              <span className="tracking-wide">CapNong</span>
            </a>
          </div>

          <div className="mt-10 lg:mt-24 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#ffea79] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles size={13} />
              <span>Nền tảng kết nối Nông sản &amp; Người dùng</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
              Ngon lành,
              <br />
              <span className="font-serif italic font-normal text-[#ffea79]">tử tế &amp;</span>
              <br />
              tiết kiệm.
            </h1>

            <p className="mt-4 text-white/90 text-sm sm:text-base font-normal leading-relaxed max-w-md drop-shadow-sm">
              Giải cứu nông sản "kém sắc" nhưng vẹn nguyên dinh dưỡng, đồng hành cùng hàng nghìn nhà
              vườn và nông dân Việt.
            </p>

            {/* Quick Benefits Pills */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90">
                🌿 Tiết kiệm tới 60%
              </span>
              <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90">
                🏡 Quyết toán 24h cho nhà vườn
              </span>
              <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90">
                ⚡ Camera AI kiểm định 0.5s
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDE: FLOATING AUTH CARD                                            */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[500px] shrink-0">
          <div className="bg-white/95 backdrop-blur-md rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 shadow-2xl border border-white/60 text-[#1f241a] transition-all">
            {/* Feedback Alerts */}
            {successNotice && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#eaf5e1] border border-[#326318] text-[#2c5f11] flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-fadeIn">
                <CheckCircle2 size={18} className="shrink-0 text-[#326318]" />
                <span>{successNotice}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#fdeeed] border border-[#ea4335] text-[#c5221f] flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-fadeIn">
                <AlertCircle size={18} className="shrink-0 text-[#c5221f]" />
                <span>{error}</span>
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW A: ĐĂNG NHẬP (LOGIN)                                          */}
            {/* =================================================================== */}
            {mode === 'login' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#1c2216] tracking-tight">
                    Chào mừng!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#757d70] mt-1">
                    Đăng nhập để tiếp tục cùng CapNong
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email / Username Input */}
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa194]"
                    />
                    <input
                      type="text"
                      required
                      {...loginForm.register('identifier')}
                      placeholder="Email hoặc Số điện thoại (VD: lienhe@capnong.vn)"
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white focus:ring-1 focus:ring-[#326318] text-xs sm:text-sm text-[#1e2319] placeholder-[#949c8e] outline-none transition-all"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa194]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      {...loginForm.register('password')}
                      placeholder="Mật khẩu"
                      className="w-full pl-11 pr-11 py-3 sm:py-3.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white focus:ring-1 focus:ring-[#326318] text-xs sm:text-sm text-[#1e2319] placeholder-[#949c8e] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa194] hover:text-[#2c3325]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-[#636c5f] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded w-4 h-4 text-[#326318] focus:ring-[#326318] accent-[#326318]"
                      />
                      <span>Ghi nhớ tôi</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => onInfo?.('Khôi phục mật khẩu qua Email/SMS')}
                      className="font-bold text-[#326318] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {/* Primary Login Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-sm uppercase tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.99] mt-2 cursor-pointer"
                  >
                    ĐĂNG NHẬP NGAY
                  </button>

                  {/* Quick Role Demo Login Box */}
                  <div className="p-3 rounded-2xl bg-[#fbf5ee] border border-[#f3e3ce] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-left">
                        <Store size={18} className="text-[#8a4e1d] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#5e310d]">
                            Nhà Vườn / Cửa hàng
                          </div>
                          <div className="text-[10px] text-[#8c6b4e]">
                            Đăng nhập gian hàng & duyệt KYC
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickShopLogin}
                        className="px-3 py-1.5 rounded-xl bg-[#8a4e1d] hover:bg-[#6c3911] text-white text-[11px] font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        Demo Nhà Vườn
                      </button>
                    </div>

                    <div className="border-t border-[#f0dfcc] pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-left">
                        <ShieldCheck size={18} className="text-[#326318] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#1e3a10]">
                            Quản Trị Viên (Admin)
                          </div>
                          <div className="text-[10px] text-[#55694a]">
                            Duyệt hồ sơ, nông sản & đối soát
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickAdminLogin}
                        className="px-3 py-1.5 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white text-[11px] font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        Demo Admin
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t border-[#e8ece3] w-full" />
                    <span className="bg-white px-3 text-[11px] text-[#8c9486] uppercase font-bold absolute">
                      Hoặc
                    </span>
                  </div>

                  {/* Google Login Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 rounded-2xl bg-white border border-[#dce0d8] hover:bg-[#f9faf8] text-xs font-bold text-[#343b2f] flex items-center justify-center gap-2.5 shadow-sm transition-all hover:border-[#b8c2b0] cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Đăng nhập với Google</span>
                  </button>
                </form>

                {/* Switch to Register */}
                <div className="mt-6 text-center text-xs text-[#6e7769]">
                  Mới biết đến CapNong?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register')
                      setError('')
                    }}
                    className="font-extrabold text-[#326318] hover:underline cursor-pointer"
                  >
                    Đăng ký tài khoản ngay
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW B: ĐĂNG KÝ (REGISTER)                                         */}
            {/* =================================================================== */}
            {mode === 'register' && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#1c2216] tracking-tight">
                    Tạo tài khoản mới
                  </h2>
                  <p className="text-xs sm:text-sm text-[#757d70] mt-0.5">
                    {selectedRole === 'shop'
                      ? `Đăng ký Nhà Vườn (Bước ${shopRegisterStep}/2)`
                      : 'Chọn vai trò tham gia cùng hệ sinh thái CapNong'}
                  </p>
                </div>

                {/* Role Selector: 1. Buyer, 2. Shop, 3. Shipper */}
                <div className="mb-4">
                  <label className="block text-xs font-extrabold text-[#31392c] mb-1.5">
                    Chọn vai trò của bạn: <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1. Buyer */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('buyer')
                        setShopRegisterStep(1)
                      }}
                      className={`p-2 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedRole === 'buyer'
                          ? 'border-[#326318] bg-[#f1faea] shadow-sm'
                          : 'border-[#e4e7e0] bg-[#f8faf6] hover:border-[#ccd4c6]'
                      }`}
                    >
                      <span className="text-base">🛒</span>
                      <div className="font-extrabold text-[11px] text-[#21291d]">1. Khách Mua</div>
                      <span className="text-[9px] text-[#697263]">(Buyer)</span>
                    </button>

                    {/* 2. Shop */}
                    <button
                      type="button"
                      onClick={() => setSelectedRole('shop')}
                      className={`p-2 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedRole === 'shop'
                          ? 'border-[#8a4e1d] bg-[#fdf5eb] shadow-sm'
                          : 'border-[#e4e7e0] bg-[#f8faf6] hover:border-[#ccd4c6]'
                      }`}
                    >
                      <span className="text-base">🌾</span>
                      <div className="font-extrabold text-[11px] text-[#21291d]">2. Nhà Vườn</div>
                      <span className="text-[9px] text-[#697263]">(Shop)</span>
                    </button>

                    {/* 3. Shipper */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('shipper')
                        setShopRegisterStep(1)
                      }}
                      className={`p-2 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedRole === 'shipper'
                          ? 'border-[#2d6f78] bg-[#eef7f8] shadow-sm'
                          : 'border-[#e4e7e0] bg-[#f8faf6] hover:border-[#ccd4c6]'
                      }`}
                    >
                      <span className="text-base">🚚</span>
                      <div className="font-extrabold text-[11px] text-[#21291d]">3. Tài Xế</div>
                      <span className="text-[9px] text-[#697263]">(Shipper)</span>
                    </button>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* SHOP REGISTRATION: STEP 1 (Credentials)             */}
                {/* ---------------------------------------------------- */}
                {selectedRole === 'shop' && shopRegisterStep === 1 && (
                  <form onSubmit={handleProceedShopStep2} className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-[#fdf5eb] border border-[#f5ddbd] text-[11px] text-[#8a4e1d] font-semibold flex items-center gap-2">
                      <User size={15} className="shrink-0" />
                      <span>Bước 1: Thông tin chủ nông trại / người đại diện pháp lý</span>
                    </div>

                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa194]"
                      />
                      <input
                        type="text"
                        required
                        {...registerForm.register('fullName')}
                        placeholder="Họ và tên chủ vườn / người đại diện *"
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs sm:text-sm text-[#1e2319] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type="tel"
                          required
                          {...registerForm.register('phone')}
                          placeholder="Số điện thoại *"
                          className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type="email"
                          {...registerForm.register('email')}
                          placeholder="Email nhận đơn"
                          className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          {...registerForm.register('password')}
                          placeholder="Mật khẩu *"
                          className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          {...registerForm.register('confirmPassword')}
                          placeholder="Xác nhận MK *"
                          className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-[#8a4e1d] hover:bg-[#6c3911] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Tiếp Tục: Thiết Lập Gian Hàng &amp; KYC</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                {/* ---------------------------------------------------- */}
                {/* SHOP REGISTRATION: STEP 2 (Shop KYC & Farm Details) */}
                {/* ---------------------------------------------------- */}
                {selectedRole === 'shop' && shopRegisterStep === 2 && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-[#fdf5eb] border border-[#f5ddbd] text-[11px] text-[#8a4e1d] font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store size={15} className="shrink-0" />
                        <span>Bước 2: Xác thực Nông Trại &amp; Hồ Sơ Gian Hàng</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShopRegisterStep(1)}
                        className="text-xs font-bold text-[#8a4e1d] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft size={13} />
                        <span>Quay lại</span>
                      </button>
                    </div>

                    {/* Shop Name */}
                    <div className="relative">
                      <Store
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa194]"
                      />
                      <input
                        type="text"
                        required
                        {...registerForm.register('shopName')}
                        placeholder="Tên Nông Trại / Hợp Tác Xã / Cửa Hàng *"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs sm:text-sm text-[#1e2319] outline-none"
                      />
                    </div>

                    {/* Address & Region */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <MapPin
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type="text"
                          required
                          {...registerForm.register('shopAddress')}
                          placeholder="Địa chỉ vườn / Kho *"
                          className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                      <select
                        {...registerForm.register('shopRegion')}
                        className="w-full px-3 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#8a4e1d] focus:bg-white text-xs font-semibold text-[#1e2319] outline-none"
                      >
                        <option value="Đà Lạt & Lâm Đồng">Đà Lạt &amp; Lâm Đồng</option>
                        <option value="Miền Tây Nam Bộ">Miền Tây Nam Bộ</option>
                        <option value="Tây Nguyên">Tây Nguyên</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      </select>
                    </div>

                    {/* Farming Type */}
                    <div className="p-2 bg-[#f4f6f1] rounded-2xl">
                      <label className="block text-[10px] font-bold text-[#697263] mb-1">
                        Phương thức canh tác chính:
                      </label>
                      <select
                        {...registerForm.register('shopFarmingType')}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#dce0d8] text-xs font-bold text-[#1e2319] outline-none"
                      >
                        <option value="Hữu cơ Organic">
                          Hữu cơ Organic (Không phân thuốc hóa học)
                        </option>
                        <option value="VietGAP">Tiêu chuẩn VietGAP / GlobalGAP</option>
                        <option value="Vườn tự nhiên">
                          Thu hoạch tự nhiên (Rau củ xấu mã lành tính)
                        </option>
                        <option value="Thủy canh">Thủy canh công nghệ cao</option>
                      </select>
                    </div>

                    {/* Bank Account */}
                    <div className="p-2.5 bg-[#fbf5ee] rounded-2xl border border-[#eeddc7] space-y-2">
                      <div className="text-[11px] font-bold text-[#8a4e1d] flex items-center gap-1.5">
                        <CreditCard size={14} />
                        <span>Tài khoản ngân hàng nhận quyết toán:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          {...registerForm.register('shopBankAccount')}
                          placeholder="Số tài khoản ngân hàng *"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8c3aa] text-xs text-[#1e2319] outline-none"
                        />
                        <input
                          type="text"
                          {...registerForm.register('shopBankHolder')}
                          placeholder="Chủ tài khoản"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8c3aa] text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                    </div>

                    {/* Image Upload Previews */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleFakeUpload('logo')}
                        className={`p-2.5 rounded-2xl border-2 border-dashed text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          shopLogoPreview
                            ? 'border-[#326318] bg-[#f1faea] text-[#326318]'
                            : 'border-[#d0d6c9] hover:border-[#8a4e1d] bg-white text-[#636c5f]'
                        }`}
                      >
                        <Upload size={16} />
                        <span className="text-[11px] font-bold">
                          {shopLogoPreview ? '✓ Đã có Logo vườn' : '+ Tải Logo Vườn'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFakeUpload('cert')}
                        className={`p-2.5 rounded-2xl border-2 border-dashed text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          shopCertPreview
                            ? 'border-[#326318] bg-[#f1faea] text-[#326318]'
                            : 'border-[#d0d6c9] hover:border-[#8a4e1d] bg-white text-[#636c5f]'
                        }`}
                      >
                        <FileText size={16} />
                        <span className="text-[11px] font-bold">
                          {shopCertPreview ? '✓ Đã có Chứng nhận' : '+ Tải Chứng Nhận VietGAP'}
                        </span>
                      </button>
                    </div>

                    {/* Final Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#8a4e1d] hover:bg-[#6c3911] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.99] mt-2 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck size={18} />
                      <span>NỘP HỒ SƠ XÉT DUYỆT GIAN HÀNG</span>
                    </button>
                  </form>
                )}

                {/* ---------------------------------------------------- */}
                {/* BUYER / SHIPPER REGISTRATION FORM                   */}
                {/* ---------------------------------------------------- */}
                {selectedRole !== 'shop' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa194]"
                      />
                      <input
                        type="text"
                        required
                        {...registerForm.register('fullName')}
                        placeholder="Họ và tên của bạn *"
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs sm:text-sm text-[#1e2319] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="relative">
                        <Phone
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type="tel"
                          required
                          {...registerForm.register('phone')}
                          placeholder="Số điện thoại *"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                      <div className="relative">
                        <Mail
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type="email"
                          {...registerForm.register('email')}
                          placeholder="Email (không bắt buộc)"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                    </div>

                    {selectedRole === 'buyer' && (
                      <div className="relative">
                        <MapPin
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type="text"
                          {...registerForm.register('buyerAddress')}
                          placeholder="Địa chỉ nhận hàng (Quận/Huyện, Tỉnh/TP...)"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                    )}

                    {selectedRole === 'shipper' && (
                      <div className="p-3 bg-[#eef7f8] rounded-2xl border border-[#c4e0f0] space-y-2">
                        <div className="text-[11px] font-bold text-[#2d6f78]">
                          Phương Tiện &amp; Khu Vực Giao Hàng:
                        </div>
                        <select
                          {...registerForm.register('shipperVehicle')}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#bad4e5] text-xs text-[#1e2319] outline-none"
                        >
                          <option value="Xe máy kèm thùng bảo ôn">
                            Xe máy (Có thùng bảo ôn giữ tươi)
                          </option>
                          <option value="Xe ba gác nông sản">Xe ba gác chở hàng nông trại</option>
                          <option value="Xe tải 500kg - 1.5 tấn">Xe tải nhỏ 500kg - 1.5 tấn</option>
                        </select>
                        <input
                          type="text"
                          {...registerForm.register('shipperArea')}
                          placeholder="Khu vực hoạt động ưu tiên (VD: Quận 7, TP.HCM)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#bad4e5] text-xs text-[#1e2319] outline-none"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="relative">
                        <Lock
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          {...registerForm.register('password')}
                          placeholder="Mật khẩu *"
                          className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa194]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      <div className="relative">
                        <Lock
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]"
                        />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          {...registerForm.register('confirmPassword')}
                          placeholder="Nhập lại mật khẩu *"
                          className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs text-[#1e2319] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa194]"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-sm uppercase tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.99] mt-2 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>HOÀN TẤT ĐĂNG KÝ ({getRoleLabel(selectedRole).split(' ')[0]})</span>
                    </button>
                  </form>
                )}

                {/* Switch back to Login */}
                <div className="mt-4 text-center text-xs text-[#6e7769]">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError('')
                    }}
                    className="font-extrabold text-[#326318] hover:underline cursor-pointer"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW C: TRẠNG THÁI XÉT DUYỆT GIAN HÀNG (SHOP KYC PENDING STATUS)   */}
            {/* =================================================================== */}
            {mode === 'kyc_pending' && (
              <div className="text-center py-3 animate-fadeIn">
                {/* Status Animated Icon */}
                <div className="w-20 h-20 bg-[#fdf3e7] border-4 border-[#fae2c8] rounded-full flex items-center justify-center mx-auto mb-5 relative shadow-inner">
                  <Hourglass className="w-10 h-10 text-[#8a4e1d] animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#326318] border-2 border-white rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[#1c2216] mb-2 tracking-tight">
                  Hồ Sơ Gian Hàng Đang Chờ Duyệt!
                </h3>

                <p className="text-xs sm:text-sm text-[#5f6859] max-w-sm mx-auto mb-6 leading-relaxed">
                  Cảm ơn bạn đã nộp hồ sơ năng lực nhà vườn. Đội ngũ thẩm định chất lượng{' '}
                  <strong className="text-[#326318]">CapNong</strong> sẽ kiểm tra và kích hoạt gian
                  hàng trong vòng <strong className="text-[#1c2216]">24h – 48h</strong> làm việc.
                </p>

                {/* Progress Mini Cards */}
                <div className="grid grid-cols-2 gap-3 text-left mb-6">
                  <div className="p-3.5 rounded-2xl bg-[#f4f8f0] border border-[#d6ebd0] flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-[#326318] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-[#1f291a]">Thông tin chủ vườn</div>
                      <div className="text-[10px] text-[#326318] font-bold">Đã tiếp nhận</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#fdf5eb] border border-[#f3ddc0] flex items-start gap-2.5">
                    <Hourglass size={18} className="text-[#8a4e1d] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-[#1f291a]">Xác thực Gian hàng</div>
                      <div className="text-[10px] text-[#8a4e1d] font-bold">Đang thẩm định</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowReviewKycModal(true)}
                    className="w-full py-3 rounded-2xl bg-white border border-[#d4d9ce] hover:bg-[#f6f8f4] text-xs font-bold text-[#353c2e] transition-all cursor-pointer shadow-sm"
                  >
                    Xem lại hồ sơ đã gửi
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const shopUser: AuthUser = {
                        name: shopName || 'Nhà Vườn Đang Chờ Duyệt',
                        email: regEmail || `${regPhone}@capnong.vn`,
                        phone: regPhone || '0900 000 000',
                        role: 'shop',
                        shopName: shopName || 'Gian Hàng Nhà Vườn',
                        detail: `${shopRegion} · Hồ sơ đang thẩm định`,
                        kycStatus: 'PENDING',
                      }
                      if (onLoginSuccess) onLoginSuccess(shopUser)
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-md transition-all cursor-pointer"
                  >
                    Truy cập Gian hàng (Chế độ xem trước)
                  </button>

                  <a
                    href="#/"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#6a7364] hover:text-[#326318] pt-2"
                  >
                    <Home size={14} />
                    <span>Quay về trang chủ</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: XEM LẠI HỒ SƠ KYC ĐÃ NỘP (REVIEW SUBMITTED SHOP KYC PROFILE)        */}
      {/* ========================================================================= */}
      {showReviewKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2dcce] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowReviewKycModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#fdf5eb] border border-[#f5ddbd] flex items-center justify-center text-[#8a4e1d]">
                <Store size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1c2216]">Hồ Sơ Nông Trại Đã Gửi</h3>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fdf5eb] text-[#8a4e1d] text-[10px] font-bold uppercase mt-0.5">
                  <Hourglass size={11} /> Đang chờ ban quản trị duyệt
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#f8faf6] border border-[#e5ece0] space-y-2">
                <div className="font-extrabold text-[#326318] uppercase tracking-wider text-[10px]">
                  1. Thông tin Chủ Vườn &amp; Liên Hệ
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#3b4334]">
                  <div>
                    <strong>Họ tên:</strong> {regFullName || 'Nguyễn Văn Nông Dân'}
                  </div>
                  <div>
                    <strong>Số điện thoại:</strong> {regPhone || '0988 123 456'}
                  </div>
                  <div className="col-span-2">
                    <strong>Email:</strong> {regEmail || 'caudat.farm@capnong.vn'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fdfaf3] border border-[#eeddc7] space-y-2">
                <div className="font-extrabold text-[#8a4e1d] uppercase tracking-wider text-[10px]">
                  2. Thông tin Gian Hàng &amp; Vùng Canh Tác
                </div>
                <div className="space-y-1 text-[#3b4334]">
                  <div>
                    <strong>Tên gian hàng:</strong> {shopName || 'HTX Nông Sản Sạch Cầu Đất'}
                  </div>
                  <div>
                    <strong>Địa chỉ kho / vườn:</strong>{' '}
                    {shopAddress || 'Cầu Đất, TP. Đà Lạt, Lâm Đồng'}
                  </div>
                  <div>
                    <strong>Khu vực:</strong> {shopRegion}
                  </div>
                  <div>
                    <strong>Phương thức canh tác:</strong> {shopFarmingType}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8faf6] border border-[#e5ece0] space-y-2">
                <div className="font-extrabold text-[#2d6f78] uppercase tracking-wider text-[10px]">
                  3. Tài Khoản Quyết Toán
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#3b4334]">
                  <div>
                    <strong>Ngân hàng:</strong> {shopBankName}
                  </div>
                  <div>
                    <strong>Số tài khoản:</strong> {shopBankAccount || '1029384756'}
                  </div>
                  <div className="col-span-2">
                    <strong>Chủ tài khoản:</strong>{' '}
                    {shopBankHolder || regFullName || 'NGUYEN VAN A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReviewKycModal(false)}
                className="w-full py-3 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-xs uppercase tracking-wide transition-all shadow-md"
              >
                Đã hiểu &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
