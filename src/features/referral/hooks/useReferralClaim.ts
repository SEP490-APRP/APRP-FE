import { useEffect } from 'react'
import { useAuth } from '@/stores/useAuthStore'
import { referralService } from '@/services'

const PENDING_REFERRAL_KEY = 'capnong_pending_referral'

export function useReferralClaim() {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    const pending = localStorage.getItem(PENDING_REFERRAL_KEY)
    if (!pending) return

    try {
      const data = JSON.parse(pending) as { code: string; timestamp: number }
      // Kiểm tra nếu mã còn trong 7 ngày
      if (data?.code && Date.now() - (data.timestamp || 0) < 7 * 24 * 60 * 60 * 1000) {
        referralService
          .claimReferral(data.code)
          .catch(() => {
            // Lỗi self-referral hoặc link inactive có thể bỏ qua âm thầm
          })
          .finally(() => {
            localStorage.removeItem(PENDING_REFERRAL_KEY)
          })
      } else {
        localStorage.removeItem(PENDING_REFERRAL_KEY)
      }
    } catch {
      localStorage.removeItem(PENDING_REFERRAL_KEY)
    }
  }, [isAuthenticated])
}

export function savePendingReferral(code: string) {
  try {
    localStorage.setItem(
      PENDING_REFERRAL_KEY,
      JSON.stringify({
        code,
        timestamp: Date.now(),
      }),
    )
  } catch {
    // Ignore storage errors
  }
}

