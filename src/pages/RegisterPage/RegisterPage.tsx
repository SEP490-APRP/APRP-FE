import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/utils/constants'
import { axiosInstance } from '@/services'

/* ===== Validation Schema ===== */
const registerSchema = z
  .object({
    role: z.enum(['BUYER', 'SHOP', 'SHIPPER']),
    fullName: z.string().min(1, 'Họ và tên là bắt buộc'),
    email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
    phoneNumber: z.string().min(1, 'Số điện thoại là bắt buộc'),
    address: z.string().min(1, 'Địa chỉ là bắt buộc'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    shopName: z.string().optional(),
    vehicleNumber: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'SHOP' && !data.shopName) return false
      return true
    },
    {
      message: 'Tên cửa hàng là bắt buộc đối với Chủ shop',
      path: ['shopName'],
    }
  )
  .refine(
    (data) => {
      if (data.role === 'SHIPPER' && !data.vehicleNumber) return false
      return true
    },
    {
      message: 'Biển số xe là bắt buộc đối với Shipper',
      path: ['vehicleNumber'],
    }
  )

type RegisterFormData = z.infer<typeof registerSchema>

/* ===== Register Page ===== */
export const RegisterPage = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState<'BUYER' | 'SHOP' | 'SHIPPER'>('BUYER')
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'BUYER',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMsg('')
    try {
      const payload = { ...data }
      let endpoint = '/users'
      if (data.role === 'SHOP') {
        endpoint = '/users/shops'
      } else if (data.role === 'SHIPPER') {
        endpoint = '/users/shippers'
      }

      await axiosInstance.post(endpoint, payload)
      // Redirect to OTP page and pass email
      navigate(ROUTES.OTP_VERIFICATION, { state: { email: data.email } })
    } catch (err: any) {
      console.error('Registration failed:', err)
      setErrorMsg(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    }
  }

  const handleRoleChange = (newRole: 'BUYER' | 'SHOP' | 'SHIPPER') => {
    setRole(newRole)
    setValue('role', newRole)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header / Logo Placeholder */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-primary">Giải Cứu Nông Sản</h1>
          <p className="mt-2 text-sm text-primary-dark">
            Cùng chung tay vì nông sản Việt
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary text-center">
            Đăng ký tài khoản
          </h2>
        </div>

        {/* Role Selection */}
        <div className="mb-6 flex justify-between gap-2">
          {[
            { id: 'BUYER', label: 'Người mua' },
            { id: 'SHOP', label: 'Chủ shop' },
            { id: 'SHIPPER', label: 'Shipper' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRoleChange(r.id as any)}
              className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                role === r.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-primary hover:bg-background-hover'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-border bg-surface p-8 shadow-sm"
        >
          <div className="flex flex-col gap-5">
            {errorMsg && (
              <div className="rounded bg-error/10 p-3 text-sm text-error">
                {errorMsg}
              </div>
            )}
            <Input
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Số điện thoại"
              type="tel"
              placeholder="Nhập số điện thoại"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
            <Input
              label="Địa chỉ"
              placeholder="Nhập địa chỉ của bạn"
              error={errors.address?.message}
              {...register('address')}
            />

            {role === 'SHOP' && (
              <Input
                label="Tên cửa hàng (Shop Name)"
                placeholder="Nhập tên cửa hàng"
                error={errors.shopName?.message}
                {...register('shopName')}
              />
            )}

            {role === 'SHIPPER' && (
              <Input
                label="Biển số xe"
                placeholder="Nhập biển số xe"
                error={errors.vehicleNumber?.message}
                {...register('vehicleNumber')}
              />
            )}

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              className="mt-4"
            >
              Đăng ký
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-text-secondary">Đã có tài khoản? </span>
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary hover:text-primary-dark"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
