import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ExternalLink, RefreshCw, ShoppingBag, Store, UserCheck, AlertCircle } from 'lucide-react'
import { referralService, type ReferralResolveResponse } from '@/services/referral.service'
import { savePendingReferral } from '@/features/referral/hooks/useReferralClaim'
import { useAuth } from '@/stores/useAuthStore'

export default function ReferralRedirectPage() {
  const { referralCode = '' } = useParams<{ referralCode: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolveData, setResolveData] = useState<ReferralResolveResponse | null>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!referralCode) {
      setError('Mã giới thiệu không hợp lệ')
      setLoading(false)
      return
    }

    // 1. Lưu pending referral vào LocalStorage để tự động claim khi login
    savePendingReferral(referralCode)

    // 2. Ghi nhận lượt click không đồng bộ (bỏ qua lỗi nếu có)
    void referralService.trackClick(referralCode).catch(() => {})

    // 3. Phân giải link
    let isMounted = true
    referralService
      .resolveLink(referralCode)
      .then((data) => {
        if (!isMounted) return
        setResolveData(data)
        setLoading(false)

        // 4. Nếu đã đăng nhập, tự động claim attribution
        if (isAuthenticated) {
          void referralService.claimReferral(referralCode).catch(() => {})
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        const msg = (err as { message?: string })?.message || 'Liên kết giới thiệu không tồn tại hoặc đã hết hạn'
        setError(msg)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [referralCode, isAuthenticated])

  // Đếm ngược tự động chuyển hướng web sau 5 giây nếu người dùng không bấm
  useEffect(() => {
    if (loading || error || !resolveData) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleNavigateWeb()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, error, resolveData])

  const targetUrl = resolveData?.targetType === 'PRODUCT'
    ? `/san-pham/${resolveData.targetId}`
    : `/cua-hang/${resolveData?.targetId}`

  const handleNavigateWeb = () => {
    navigate(targetUrl)
  }

  const handleOpenApp = () => {
    window.location.href = `capnong://ref/${encodeURIComponent(referralCode)}`
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <RefreshCw className="h-10 w-10 animate-spin text-[#326318]" />
        <h2 className="mt-4 text-lg font-bold text-[#1c2216]">Đang xác thực liên kết giới thiệu...</h2>
        <p className="mt-1 text-sm text-[#6e7767]">Vui lòng đợi giây lát</p>
      </div>
    )
  }

  if (error || !resolveData) {
    return (
      <div className="mx-auto my-12 max-w-md px-4 text-center">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle size={28} />
          </div>
          <h2 className="mt-4 text-xl font-black text-[#1c2216]">Liên kết không khả dụng</h2>
          <p className="mt-2 text-sm text-[#6e7767]">{error || 'Không tìm thấy thông tin chia sẻ'}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#326318] px-6 py-3 text-sm font-bold text-white hover:bg-[#254b12] transition"
          >
            Về trang chủ CapNong
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto my-8 max-w-lg px-4 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-[#e8ece3] bg-white shadow-xl">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-[#326318] to-[#1f420e] p-6 text-white text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <UserCheck size={14} />
            Liên kết giới thiệu nông sản
          </div>
          <h1 className="mt-3 text-xl font-black sm:text-2xl">
            {resolveData.targetType === 'PRODUCT' ? 'Sản Phẩm Được Giới Thiệu' : 'Gian Hàng Được Giới Thiệu'}
          </h1>
          <p className="mt-1 text-xs opacity-90">
            Người chia sẻ: <span className="font-bold underline">{resolveData.referrerName}</span>
          </p>
        </div>

        {/* Target Preview */}
        <div className="p-6">
          <div className="flex gap-4 rounded-2xl border border-[#f1f4ed] bg-[#fbfcfb] p-4">
            {resolveData.imageUrl ? (
              <img
                src={resolveData.imageUrl}
                alt={resolveData.targetName}
                className="h-24 w-24 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#eaf5e1] text-[#326318]">
                {resolveData.targetType === 'PRODUCT' ? <ShoppingBag size={32} /> : <Store size={32} />}
              </div>
            )}
            <div className="flex flex-1 flex-col justify-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#326318]">
                {resolveData.targetType === 'PRODUCT' ? 'Nông sản an lành' : 'Gian hàng nông dân'}
              </span>
              <h3 className="line-clamp-2 text-base font-bold text-[#1c2216]">
                {resolveData.targetName}
              </h3>
              <p className="mt-1 text-xs text-[#6e7767]">
                Mã liên kết: <code className="rounded bg-[#e8ece3] px-1.5 py-0.5 font-mono text-[11px] text-[#326318]">{resolveData.referralCode}</code>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleNavigateWeb}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#326318] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#254b12] transition"
            >
              Xem ngay trên Web ({countdown}s)
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleOpenApp}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#326318] bg-[#f3f6ef] py-3 text-sm font-bold text-[#326318] hover:bg-[#eaf5e1] transition"
            >
              <ExternalLink size={16} />
              Mở trong ứng dụng CapNong
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-[#858f7e]">
            Mua hàng qua liên kết này để nhận ưu đãi và đồng hành cùng nhà vườn bản địa!
          </p>
        </div>
      </div>
    </div>
  )
}
