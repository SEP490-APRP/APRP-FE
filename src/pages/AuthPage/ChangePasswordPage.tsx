import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/utils/constants'
import { authService } from '@/services'

/* ===== Validation Schema ===== */
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
    path: ['newPassword'],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

/* ===== Change Password Page ===== */
export const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await authService.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })

      setSuccessMsg('Đổi mật khẩu thành công!')
      reset()

      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err: any) {
      console.error('Đổi mật khẩu thất bại:', err)
      const errorCode = err?.data?.code || err?.response?.data?.code
      const msg = err?.data?.message || err?.response?.data?.message || err?.message

      if (errorCode === 1027) {
        setErrorMsg('Mật khẩu hiện tại không chính xác.')
      } else if (errorCode === 1028) {
        setErrorMsg('Mật khẩu xác nhận không khớp.')
      } else if (errorCode === 1029) {
        setErrorMsg('Mật khẩu mới không được trùng với mật khẩu cũ.')
      } else {
        setErrorMsg(msg || 'Đổi mật khẩu thất bại. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Nút quay lại */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f7669] hover:text-[#326318] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3 bg-[#eaf4e6] text-[#326318] rounded-2xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#20271c]">Đổi mật khẩu</h2>
              <p className="text-xs text-[#6f7669] mt-0.5">
                Cập nhật mật khẩu để bảo vệ an toàn cho tài khoản
              </p>
            </div>
          </div>

          {/* Thông báo lỗi / thành công */}
          {errorMsg && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Mật khẩu hiện tại */}
            <div>
              <label className="block text-xs font-bold text-[#20271c] mb-1.5">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={isSubmitting}
                  {...register('oldPassword')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.oldPassword.message}</p>
              )}
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-xs font-bold text-[#20271c] mb-1.5">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 8 ký tự"
                  disabled={isSubmitting}
                  {...register('newPassword')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-xs font-bold text-[#20271c] mb-1.5">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={isSubmitting}
                  {...register('confirmPassword')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#326318] focus:ring-1 focus:ring-[#326318] text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-[#326318] hover:bg-[#254b12] text-white py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
                isLoading={isSubmitting}
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>

          {/* Quên mật khẩu link */}
          <div className="mt-5 text-center">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-[#326318] hover:underline font-semibold"
            >
              Bạn quên mật khẩu hiện tại?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordPage
