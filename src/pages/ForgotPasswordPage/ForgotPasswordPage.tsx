import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/utils/constants'

/* ===== Validation Schemas ===== */
const emailSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
})

const otpSchema = z.object({
  otp: z.string().min(6, 'Mã OTP phải có 6 chữ số').max(6, 'Mã OTP phải có 6 chữ số'),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
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
    // TODO: Call API to send OTP
    console.log('Sending OTP to:', data.email)
    setStep(2)
  }

  const onOtpSubmit = async (data: OtpFormData) => {
    // TODO: Call API to verify OTP
    console.log('Verifying OTP:', data.otp)
    setStep(3)
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    // TODO: Call API to change password
    console.log('Changing password to:', data.password)
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header / Logo Placeholder */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-primary">Giải Cứu Nông Sản</h1>
          <p className="mt-2 text-sm text-primary-dark">
            Cùng chung tay vì nông sản Việt
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary text-center">
            Quên mật khẩu
          </h2>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="rounded-2xl border border-border bg-surface p-8 shadow-sm"
          >
            <p className="mb-4 text-sm text-text-secondary text-center">
              Nhập email của bạn để nhận mã xác thực (OTP).
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
                Gửi OTP
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
              Mã xác thực đã được gửi đến email của bạn.
            </p>
            <div className="flex flex-col gap-5">
              <Input
                label="Mã OTP"
                type="text"
                placeholder="Nhập mã OTP (6 số)"
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
                Xác nhận OTP
              </Button>
              <div className="mt-2 text-center text-sm">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="font-medium text-primary hover:text-primary-dark"
                >
                  Gửi lại OTP hoặc đổi email
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
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
            </p>
            <div className="flex flex-col gap-5">
              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.password?.message}
                {...passwordForm.register('password')}
              />
              <Input
                label="Xác nhận mật khẩu mới"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
              <Button
                type="submit"
                fullWidth
                isLoading={passwordForm.formState.isSubmitting}
                className="mt-2"
              >
                Đổi mật khẩu
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
