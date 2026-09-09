import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/utils/constants'

/* ===== Validation Schema ===== */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Mật khẩu là bắt buộc')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

/* ===== Login Page ===== */
const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    // TODO: Implement login API call
    console.log('Login data:', data)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Chào mừng bạn quay trở lại
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-border bg-surface p-8 shadow-sm"
        >
          <div className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              className="mt-2"
            >
              Đăng nhập
            </Button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Chưa có tài khoản?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-primary hover:text-primary-dark"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
