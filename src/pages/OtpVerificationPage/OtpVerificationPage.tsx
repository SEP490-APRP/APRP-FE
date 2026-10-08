import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, KeyRound, Mail } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/utils/constants'
import { authService } from '@/services'

export const OtpVerificationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Hỗ trợ email từ state hoặc từ URL query param ?email=...
  const queryEmail = new URLSearchParams(location.search).get('email') || ''
  const stateEmail = location.state?.email || ''
  const isShop = location.state?.isShop || false
  const isShipper = location.state?.isShipper || false

  const [email, setEmail] = useState<string>(stateEmail || queryEmail)
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn')
      return
    }

    if (otp.length !== 6) {
      setErrorMsg('Mã OTP phải gồm đúng 6 chữ số')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authService.verifyOtp({
        email: trimmedEmail,
        otp: parseInt(otp, 10),
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
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập email trước khi yêu cầu gửi lại mã OTP')
      return
    }

    setErrorMsg('')
    setSuccessMsg('')
    setIsResending(true)
    try {
      await authService.resendOtp({ email: trimmedEmail })
      setSuccessMsg('Mã OTP mới đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.')
    } catch (err: any) {
      console.error('Resend OTP failed:', err)
      const msg = err?.data?.message || err?.response?.data?.message || err?.message
      setErrorMsg(msg || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 bg-[#fbf9f4]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-[#326318]">
            CapNong · Giải Cứu Nông Sản
          </h1>
          <p className="mt-1 text-xs text-[#55634e]">
            Nền tảng kết nối trực tiếp nông dân & người tiêu dùng
          </p>
        </div>

        <div className="rounded-3xl border border-[#e5e0d3] bg-white p-7 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#eaf5e1] text-[#326318] mb-3">
              <KeyRound size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1c2216]">
              Xác thực tài khoản qua OTP
            </h2>
            <p className="mt-1.5 text-xs text-[#6e7769]">
              {email ? (
                <>
                  Mã OTP 6 chữ số đã được gửi đến email <strong className="text-[#1c2216]">{email}</strong>
                </>
              ) : (
                'Nhập địa chỉ email và mã OTP 6 chữ số để kích hoạt tài khoản'
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-2xl bg-[#fdeeed] border border-[#ea4335] p-3 text-xs text-[#c5221f] flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="rounded-2xl bg-[#eaf5e1] border border-[#326318] p-3 text-xs text-[#2c5f11] flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email field (nếu chưa có email sẵn) */}
            <div>
              <label className="block text-xs font-bold text-[#454d3e] mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa194]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#f4f6f1] border border-transparent focus:border-[#326318] focus:bg-white text-xs sm:text-sm text-[#1e2319] outline-none transition-all"
                />
              </div>
            </div>

            {/* OTP input */}
            <div>
              <label className="block text-xs font-bold text-[#454d3e] mb-1.5">
                Mã xác thực OTP (6 chữ số)
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="Nhập 6 số OTP (VD: 123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="text-center font-mono tracking-widest text-lg font-bold"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              className="py-3.5 rounded-2xl bg-[#326318] hover:bg-[#254b12] text-white font-extrabold text-sm uppercase tracking-wide shadow-md mt-2"
            >
              Xác Nhận Kích Hoạt
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="flex items-center gap-1 font-semibold text-[#6e7769] hover:text-[#1c2216]"
              >
                <ArrowLeft size={14} />
                <span>Về trang đăng nhập</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="flex items-center gap-1 font-bold text-[#326318] hover:underline disabled:opacity-50"
              >
                <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
                <span>{isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OtpVerificationPage
