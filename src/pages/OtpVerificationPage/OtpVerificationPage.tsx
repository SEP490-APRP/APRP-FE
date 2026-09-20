import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/utils/constants'
import { axiosInstance } from '@/services'

export const OtpVerificationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!email) {
    // If no email, redirect to register
    navigate(ROUTES.REGISTER)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    
    if (otp.length !== 6) {
      setErrorMsg('Mã OTP phải gồm 6 chữ số')
      return
    }

    setIsSubmitting(true)
    try {
      await axiosInstance.post('/users/verify-otp', { email, otp: parseInt(otp, 10) })
      setSuccessMsg('Xác thực thành công! Vui lòng đăng nhập.')
      setTimeout(() => navigate(ROUTES.LOGIN), 2000)
    } catch (err: any) {
      console.error('OTP verification failed:', err)
      setErrorMsg(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await axiosInstance.post('/users/resend-otp', { email })
      setSuccessMsg('Đã gửi lại mã OTP. Vui lòng kiểm tra email.')
    } catch (err: any) {
      console.error('Resend OTP failed:', err)
      setErrorMsg(err.response?.data?.message || 'Không thể gửi lại mã OTP.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-primary">Giải Cứu Nông Sản</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary text-center">
            Xác thực tài khoản
          </h2>
          <p className="mt-2 text-sm text-text-secondary text-center">
            Mã OTP đã được gửi đến email <strong>{email}</strong>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-8 shadow-sm"
        >
          <div className="flex flex-col gap-5">
            {errorMsg && (
              <div className="rounded bg-error/10 p-3 text-sm text-error text-center">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="rounded bg-primary/10 p-3 text-sm text-primary text-center">
                {successMsg}
              </div>
            )}

            <Input
              label="Mã OTP"
              type="text"
              placeholder="Nhập 6 chữ số OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              className="mt-2"
            >
              Xác nhận
            </Button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Chưa nhận được mã? Gửi lại
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OtpVerificationPage
