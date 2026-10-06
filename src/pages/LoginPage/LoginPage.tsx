import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES, API_BASE_URL, STORAGE_KEYS } from '@/utils/constants'
import { axiosInstance } from '@/services'

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
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg('')
    try {
      const res: any = await axiosInstance.post('/auth/login', data)
      if (res.result?.token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.result.token)
        navigate(ROUTES.HOME)
      }
    } catch (err: any) {
      console.error('Login failed:', err)
      setErrorMsg(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header / Logo Placeholder */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-primary">
            Giải Cứu Nông Sản
          </h1>
          <p className="mt-2 text-sm text-primary-dark">
            Cùng chung tay vì nông sản Việt
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary text-center">
            Đăng nhập
          </h2>
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
            
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-surface px-2 text-text-secondary">Hoặc</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.86 16.79 15.65 17.57V20.34H19.2C21.28 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.2 20.34L15.65 17.57C14.7 18.2 13.45 18.57 12 18.57C9.18 18.57 6.8 16.67 5.92 14.13H2.26V16.97C4.06 20.54 7.72 23 12 23Z" fill="#34A853"/>
                <path d="M5.92 14.13C5.69 13.47 5.56 12.75 5.56 12C5.56 11.25 5.69 10.53 5.92 9.87V7.03H2.26C1.51 8.52 1.08 10.2 1.08 12C1.08 13.8 1.51 15.48 2.26 16.97L5.92 14.13Z" fill="#FBBC05"/>
                <path d="M12 5.43C13.62 5.43 15.06 5.98 16.2 7.07L19.28 3.99C17.46 2.3 14.97 1.33 12 1.33C7.72 1.33 4.06 3.8 2.26 7.03L5.92 9.87C6.8 7.33 9.18 5.43 12 5.43Z" fill="#EA4335"/>
              </svg>
              Đăng nhập bằng Google
            </Button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center text-sm">
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-primary hover:text-primary-dark"
          >
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
