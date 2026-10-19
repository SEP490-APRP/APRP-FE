import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { STORAGE_KEYS, ROUTES } from '@/utils/constants'
import { authService, type UserResponse } from '@/services'
import { useAuth } from '@/stores'

export const OAuthSuccessPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token')
      const error = searchParams.get('error')

      if (error) {
        let msg = 'Đăng nhập Google thất bại.'
        if (error === 'account_pending_approval') {
          msg = 'Tài khoản đang chờ Ban Quản Trị phê duyệt.'
        } else if (error === 'account_locked') {
          msg = 'Tài khoản đã bị khóa.'
        } else if (error === 'account_not_active') {
          msg = 'Tài khoản chưa được kích hoạt.'
        } else if (error === 'oauth2_email_missing') {
          msg = 'Không tìm thấy thông tin email từ tài khoản Google.'
        }
        setErrorMsg(msg)
        return
      }

      if (!token) {
        setErrorMsg('Không tìm thấy token xác thực từ máy chủ.')
        return
      }

      try {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)

        const payload = authService.parseJwt(token)
        let profileUser: UserResponse | null = null

        try {
          const meRes = await authService.getMyInfo()
          if (meRes.result) profileUser = meRes.result
        } catch (meErr) {
          console.warn('Lỗi khi tải thông tin /users/me:', meErr)
        }

        const mappedRole = authService.mapBackendRoleToFrontend([
          payload?.roles,
          profileUser?.role?.name,
          profileUser?.roleName,
        ])

        const sessionUser = profileUser
          ? authService.buildSessionUser(profileUser, mappedRole)
          : {
              id: String(payload?.sub || crypto.randomUUID()),
              name: payload?.email?.split('@')[0] || 'Thành viên CapNong',
              email: payload?.email || '',
              role: mappedRole,
            }

        login(sessionUser, token)

        // Điều hướng theo Role
        if (mappedRole === 'admin') navigate('/admin')
        else if (mappedRole === 'shop') navigate('/shop')
        else if (mappedRole === 'shipper') navigate('/shipper')
        else navigate(ROUTES.HOME)
      } catch (err: any) {
        console.error('Lỗi xử lý OAuth callback:', err)
        setErrorMsg('Xử lý đăng nhập Google thất bại. Vui lòng thử lại.')
      }
    }

    handleOAuthCallback()
  }, [searchParams, login, navigate])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg border border-gray-100 text-center">
        {errorMsg ? (
          <div>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng nhập thất bại</h2>
            <p className="text-sm text-gray-600 mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full py-3 rounded-xl bg-[#326318] hover:bg-[#254b12] text-white font-bold text-sm transition-colors"
            >
              Quay lại trang Đăng nhập
            </button>
          </div>
        ) : (
          <div>
            <Loader2 className="w-10 h-10 animate-spin text-[#326318] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Đang xác thực tài khoản Google</h2>
            <p className="text-xs text-gray-500">Vui lòng chờ trong giây lát, hệ thống đang đồng bộ dữ liệu...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OAuthSuccessPage
