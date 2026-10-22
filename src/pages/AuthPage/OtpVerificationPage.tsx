import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Mail, Edit2 } from 'lucide-react'

import { ROUTES } from '@/utils/constants'
import { authService } from '@/services'
import logoIcon from '@/assets/logo-icon.png'

export const OtpVerificationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Hỗ trợ email từ state hoặc từ URL query param ?email=...
  const queryEmail = new URLSearchParams(location.search).get('email') || ''
  const stateEmail = location.state?.email || ''
  const isShop = location.state?.isShop || false
  const isShipper = location.state?.isShipper || false

  const [email, setEmail] = useState<string>(stateEmail || queryEmail)
  const [isEditingEmail, setIsEditingEmail] = useState(!stateEmail && !queryEmail)
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState<number>(60)
  const [canResend, setCanResend] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: any = null
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [countdown])

  // Focus the first empty digit or first input on mount
  useEffect(() => {
    if (!isEditingEmail) {
      inputRefs.current[0]?.focus()
    }
  }, [isEditingEmail])

  const handleDigitChange = (index: number, val: string) => {
    // If user typed / pasted multiple digits
    const cleaned = val.replace(/[^0-9]/g, '')
    if (!cleaned) {
      const nextDigits = [...digits]
      nextDigits[index] = ''
      setDigits(nextDigits)
      return
    }

    if (cleaned.length > 1) {
      const nextDigits = [...digits]
      const chars = cleaned.split('')
      let targetIdx = index
      for (let i = 0; i < chars.length && targetIdx < 6; i++) {
        nextDigits[targetIdx] = chars[i]
        targetIdx++
      }
      setDigits(nextDigits)
      const nextFocus = Math.min(targetIdx, 5)
      inputRefs.current[nextFocus]?.focus()
      return
    }

    const nextDigits = [...digits]
    nextDigits[index] = cleaned[0]
    setDigits(nextDigits)

    // Auto-focus next input
    if (index < 5 && cleaned[0]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pastedData) return

    const nextDigits = [...digits]
    for (let i = 0; i < pastedData.length; i++) {
      nextDigits[i] = pastedData[i]
    }
    setDigits(nextDigits)
    const nextFocus = Math.min(pastedData.length, 5)
    inputRefs.current[nextFocus]?.focus()
  }

  const fullOtp = digits.join('')

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn')
      setIsEditingEmail(true)
      return
    }

    if (fullOtp.length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã OTP')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authService.verifyOtp({
        email: trimmedEmail,
        otp: parseInt(fullOtp, 10),
      })

      const user = response.result
      const isPendingApproval =
        user?.status === 'PENDING' || isShop || isShipper

      if (isPendingApproval) {
        setSuccessMsg(
          'Xác thực OTP thành công! Hồ sơ đăng ký của bạn đã được chuyển tới Ban Quản Trị để phê duyệt.',
        )
      } else {
        setSuccessMsg('Xác thực tài khoản thành công! Đang chuyển đến màn hình đăng nhập...')
      }

      setTimeout(() => {
        navigate(ROUTES.LOGIN, { state: { email: trimmedEmail } })
      }, 2000)
    } catch (err: any) {
      console.error('OTP verification failed:', err)
      const msg = err?.data?.message || err?.response?.data?.message || err?.message
      setErrorMsg(msg || 'Mã OTP không hợp lệ hoặc đã hết hạn.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend && countdown > 0) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập email trước khi yêu cầu gửi lại mã OTP')
      setIsEditingEmail(true)
      return
    }

    setErrorMsg('')
    setSuccessMsg('')
    setIsResending(true)
    try {
      await authService.resendOtp({ email: trimmedEmail })
      setSuccessMsg('Mã OTP mới đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.')
      setDigits(['', '', '', '', '', ''])
      setCountdown(60)
      setCanResend(false)
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      console.error('Resend OTP failed:', err)
      const msg = err?.data?.message || err?.response?.data?.message || err?.message
      setErrorMsg(msg || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#f5f8f2] via-[#edf3e8] to-[#f8fbf5] overflow-hidden">
      {/* Decorative background glow & organic blur circles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#8cb76c]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[#326318]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Main Card */}
        <div className="relative rounded-[32px] bg-white/95 backdrop-blur-sm px-7 py-9 sm:px-9 sm:py-10 shadow-[0_25px_60px_-15px_rgba(50,99,24,0.15)] border border-[#dce5d5]">
          
          {/* Header Back Button */}
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="group absolute top-6 left-6 text-[#727d6d] hover:text-[#1e2319] p-2 rounded-full hover:bg-[#edf3e8] transition-colors"
            title="Quay lại đăng nhập"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Logo Badge: Vòng tròn đồng tâm kết hợp Logo CapNong chính thức */}
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center w-28 h-28">
              {/* Vòng ngoài cùng nhấp nháy nhẹ */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#8cb76c]/50 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-1 rounded-full bg-[#eaf3e5] animate-pulse" />
              
              {/* Vòng trung tâm */}
              <div className="relative w-20 h-20 rounded-full border-[5px] border-[#326318] bg-white flex items-center justify-center shadow-lg shadow-[#326318]/15 overflow-hidden p-2.5">
                <img
                  src={logoIcon}
                  alt="CapNong"
                  className="w-full h-full object-contain drop-shadow-sm select-none"
                />
              </div>

              {/* Tag nhỏ nổi trên badge */}
              <div className="absolute -bottom-1 bg-[#326318] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md border-2 border-white">
                OTP
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-[#1c2417] tracking-tight">
              Xác Thực Tài Khoản
            </h1>
            
            <div className="mt-2 text-xs text-[#55634e] leading-relaxed">
              <span>Mã bảo mật 6 chữ số đã được gửi tới </span>
              {email ? (
                <div className="inline-flex items-center gap-1.5 font-bold text-[#1c2417] mt-1 bg-[#f3f7ee] border border-[#dce5d5] px-2.5 py-1 rounded-xl">
                  <span className="truncate max-w-[210px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(!isEditingEmail)}
                    className="text-[#326318] hover:text-[#1e3c0f] p-0.5"
                    title="Đổi email"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              ) : (
                <span className="font-bold text-[#1c2417]">địa chỉ email của bạn</span>
              )}
            </div>

            {/* Email Edit field khi người dùng bấm sửa */}
            {isEditingEmail && (
              <div className="mt-3 relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#889680]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f8faf6] border border-[#cfd6c7] focus:border-[#326318] focus:bg-white text-xs text-[#1c2417] outline-none"
                />
              </div>
            )}
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 rounded-2xl bg-[#fdeeed] border border-[#ea4335]/40 p-3 text-xs text-[#c5221f] flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 rounded-2xl bg-[#edf6e8] border border-[#326318]/40 p-3 text-xs text-[#26530e] flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6 Individual PIN Input Boxes (Tone CapNong) */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 transition-all duration-150 outline-none select-none ${
                    digit
                      ? 'border-[#326318] bg-[#f2f8ec] text-[#234c0e] shadow-sm'
                      : 'border-[#cfd8c7] hover:border-[#a1b098] focus:border-[#326318] bg-[#f9faf7] text-[#1c2417]'
                  } focus:ring-4 focus:ring-[#8cb76c]/30 focus:bg-white`}
                />
              ))}
            </div>

            {/* Resend OTP Row */}
            <div className="text-center text-xs text-[#6e7769]">
              <span>Bạn chưa nhận được mã? </span>
              {canResend || countdown === 0 ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="font-bold text-[#326318] hover:text-[#1e3c0f] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCw size={12} className={isResending ? 'animate-spin' : ''} />
                  <span>{isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}</span>
                </button>
              ) : (
                <span className="font-semibold text-[#8b9584]">
                  Gửi lại sau <strong className="text-[#326318] font-bold">{countdown}s</strong>
                </span>
              )}
            </div>

            {/* Submit Action Button (Tone xanh chủ đạo CapNong) */}
            <button
              type="submit"
              disabled={isSubmitting || fullOtp.length !== 6}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#326318] to-[#254b12] hover:from-[#2a5414] hover:to-[#1e3d0e] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#326318]/25 hover:shadow-xl hover:shadow-[#326318]/35 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>ĐANG XÁC NHẬN...</span>
                </>
              ) : (
                <span>XÁC THỰC KÍCH HOẠT</span>
              )}
            </button>
          </form>

          {/* Sub-footer logo / brand signature */}
          <div className="mt-8 pt-5 border-t border-[#edf2ea] flex items-center justify-center gap-2 text-[#8b9584] text-[11px] font-medium">
            <img src={logoIcon} alt="CapNong" className="h-4 w-auto object-contain opacity-80" />
            <span>CapNong · Nền tảng kết nối trực tiếp Nông dân & Người tiêu dùng</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OtpVerificationPage

