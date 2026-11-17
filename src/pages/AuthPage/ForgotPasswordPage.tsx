import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/utils/constants'
import { authService } from '@/services'
import logoIcon from '@/assets/logo-icon.png'

/* ===== Validation Schemas ===== */
const emailSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
})

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Mã OTP phải có đúng 6 chữ số')
    .regex(/^\d+$/, 'Mã OTP chỉ bao gồm các chữ số'),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type EmailFormData = z.infer<typeof emailSchema>
type OtpFormData = z.infer<typeof otpSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

/* ===== Forgot Password Page ===== */
export const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Step 1 Form: Email
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  // Step 2 Form: OTP
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  // Step 3 Form: New Password
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onEmailSubmit = async (data: EmailFormData) => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await authService.forgotPassword({ email: data.email.trim() })
      setEmail(data.email.trim())
      setSuccessMsg('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.')
      setStep(2)
    } catch (err: any) {
      console.error('Lỗi khi gửi OTP quên mật khẩu:', err)
      const msg = err?.data?.message || err?.response?.data?.message || err?.message
      setErrorMsg(msg || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.')
    }
  }

  const onOtpSubmit = async (data: OtpFormData) => {
    setErrorMsg('')
    setSuccessMsg('')
    setOtp(data.otp.trim())
    setStep(3)
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await authService.resetPassword({
        email,
        otp: parseInt(otp, 10),
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      })
      setSuccessMsg('Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...')
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { state: { email } })
      }, 1500)
    } catch (err: any) {
      console.error('Lỗi khi đặt lại mật khẩu:', err)
      const msg = err?.data?.message || err?.response?.data?.message || err?.message
      setErrorMsg(msg || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.')
    }
  }

  const handleResendOtp = async () => {
    if (!email) return
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await authService.forgotPassword({ email })
      setSuccessMsg('Mã OTP mới đã được gửi lại tới email của bạn.')
    } catch (err: any) {
      const msg = err?.data?.message || err?.response?.data?.message || err?.message
      setErrorMsg(msg || 'Không thể gửi lại mã OTP.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="mb-8 text-center flex flex-col items-center">
          <img src={logoIcon} alt="CapNong" className="h-16 w-auto object-contain mb-2 drop-shadow-sm" />
          <h1 className="text-3xl font-extrabold text-[#326318]">CapNong · Giải Cứu Nông Sản</h1>
          <p className="mt-1 text-xs text-[#55634e]">
            Cùng chung tay vì nông sản Việt
          </p>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-text-primary">
            Quên mật khẩu
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Bước {step} / 3: {step === 1 ? 'Xác thực Email' : step === 2 ? 'Nhập mã OTP' : 'Tạo mật khẩu mới'}
          </p>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="rounded-2xl border border-border bg-surface p-8 shadow-sm"
          >
            <p className="mb-5 text-sm text-text-secondary text-center">
              Nhập địa chỉ email tài khoản của bạn để nhận mã xác thực đặt lại mật khẩu.
            </p>
            <div className="flex flex-col gap-5">
              <Input
                label="Email"
                type="email"
                placeholder="Nhập email của bạn"
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />
              <Button
                type="submit"
                fullWidth
                isLoading={emailForm.formState.isSubmitting}
                className="mt-2"
              >
                Gửi mã OTP
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form
            onSubmit={otpForm.handleSubmit(onOtpSubmit)}
            className="rounded-2xl border border-border bg-surface p-8 shadow-sm"
          >
            <p className="mb-4 text-sm text-text-secondary text-center">
              Mã xác thực OTP gồm 6 chữ số đã được gửi tới email <strong className="text-primary">{email}</strong>.
            </p>
            <div className="flex flex-col gap-5">
              <Input
                label="Mã OTP"
                type="text"
                placeholder="Ví dụ: 123456"
                maxLength={6}
                error={otpForm.formState.errors.otp?.message}
                {...otpForm.register('otp')}
              />
              <Button
                type="submit"
                fullWidth
                isLoading={otpForm.formState.isSubmitting}
                className="mt-2"
              >
                Tiếp tục
              </Button>
              <div className="flex items-center justify-between text-xs text-text-secondary pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('')
                    setSuccessMsg('')
                    setStep(1)
                  }}
                  className="hover:underline flex items-center gap-1 text-gray-500"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Đổi email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-medium text-primary hover:underline"
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="rounded-2xl border border-border bg-surface p-8 shadow-sm"
          >
            <p className="mb-4 text-sm text-text-secondary text-center">
              Vui lòng thiết lập mật khẩu mới (tối thiểu 8 ký tự).
            </p>
            <div className="flex flex-col gap-5">
              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                error={passwordForm.formState.errors.password?.message}
                {...passwordForm.register('password')}
              />
              <Input
                label="Xác nhận mật khẩu mới"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
              <Button
                type="submit"
                fullWidth
                isLoading={passwordForm.formState.isSubmitting}
                className="mt-2"
              >
                Xác nhận đổi mật khẩu
              </Button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm">
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary hover:text-primary-dark"
          >
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
