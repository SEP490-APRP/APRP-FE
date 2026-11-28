import React, { useState, useEffect } from 'react'
import { Check, Copy, X, Sparkles } from 'lucide-react'
import { FacebookIcon } from './productDetail.utils'
import { globalShowAlert } from '@/components/common/Popup'
import { referralService } from '@/services'
import { useAuth } from '@/stores'

import type { ReferralTargetType } from '@/services'

interface ProductSharePopoverProps {
  isOpen: boolean
  onClose: () => void
  productUrl: string
  shopUrl?: string | null
  productId?: number
  shopId?: number
  comboId?: number
  mysteryBoxId?: number
  targetType?: ReferralTargetType
  targetId?: number
  type?: 'product' | 'shop'
  align?: 'left' | 'right'
}

export const ProductSharePopover: React.FC<ProductSharePopoverProps> = ({
  isOpen,
  onClose,
  productUrl,
  shopUrl,
  productId,
  shopId,
  comboId,
  mysteryBoxId,
  targetType,
  targetId,
  type = 'product',
  align = 'right',
}) => {
  const [productCopied, setProductCopied] = useState(false)
  const [shopCopied, setShopCopied] = useState(false)
  const [referralProductUrl, setReferralProductUrl] = useState<string | null>(null)
  const [referralShopUrl, setReferralShopUrl] = useState<string | null>(null)
  const [loadingLink, setLoadingLink] = useState(false)

  const { isAuthenticated, user } = useAuth()
  const isMobileBrowser = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  // Tự động tạo hoặc lấy link referral khi mở popover nếu là Buyer đã đăng nhập
  useEffect(() => {
    if (!isOpen || !isAuthenticated || user?.role !== 'buyer') {
      return
    }

    let isMounted = true
    setLoadingLink(true)

    const fetchLinks = async () => {
      try {
        const resolvedTargetType: ReferralTargetType =
          targetType ||
          (comboId ? 'BUILD_COMBO' : mysteryBoxId ? 'MYSTERY_BOX' : 'PRODUCT')
        const resolvedTargetId =
          targetId || comboId || mysteryBoxId || productId

        if (resolvedTargetId) {
          const res = await referralService.getOrCreateLink({
            targetType: resolvedTargetType,
            targetId: Number(resolvedTargetId),
          })
          if (isMounted) setReferralProductUrl(res.shareUrl)
        }
        if (shopId) {
          const res = await referralService.getOrCreateLink({
            targetType: 'SHOP',
            targetId: Number(shopId),
          })
          if (isMounted) setReferralShopUrl(res.shareUrl)
        }
      } catch {
        // Fallback to normal URL on error
      } finally {
        if (isMounted) setLoadingLink(false)
      }
    }

    fetchLinks()

    return () => {
      isMounted = false
    }
  }, [isOpen, isAuthenticated, user?.role, productId, shopId, comboId, mysteryBoxId, targetType, targetId])

  if (!isOpen) return null

  const getEffectiveUrl = (targetType: 'product' | 'shop') => {
    const backendUrl = targetType === 'product' ? referralProductUrl : referralShopUrl
    if (backendUrl) {
      try {
        const parsed = new URL(backendUrl)
        // Luôn đồng bộ origin với môi trường hiện tại của trình duyệt (localhost hoặc production)
        return `${window.location.origin}${parsed.pathname}`
      } catch {
        return backendUrl
      }
    }
    return targetType === 'product' ? productUrl : (shopUrl || productUrl)
  }

  const handleCopy = async (targetType: 'product' | 'shop') => {
    const targetUrl = getEffectiveUrl(targetType)
    await navigator.clipboard.writeText(targetUrl)
    if (targetType === 'product') {
      setProductCopied(true)
      setTimeout(() => setProductCopied(false), 2000)
    } else {
      setShopCopied(true)
      setTimeout(() => setShopCopied(false), 2000)
    }
  }

  const shareFacebook = (targetType: 'product' | 'shop') => {
    const targetUrl = encodeURIComponent(getEffectiveUrl(targetType))
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${targetUrl}`,
      '_blank',
      'width=600,height=400',
    )
  }

  const shareZalo = (targetType: 'product' | 'shop') => {
    const rawUrl = getEffectiveUrl(targetType)
    const url = encodeURIComponent(rawUrl)
    if (isMobileBrowser) {
      window.location.href = `zalo://share?url=${url}`
    } else {
      navigator.clipboard.writeText(rawUrl)
      globalShowAlert('Đã sao chép link tiếp thị! Mở Zalo và dán vào hội thoại để chia sẻ nhận hoa hồng.', 'Chia sẻ Zalo', 'info')
    }
  }

  const shareMessenger = (targetType: 'product' | 'shop') => {
    const rawUrl = getEffectiveUrl(targetType)
    const url = encodeURIComponent(rawUrl)
    if (isMobileBrowser) {
      window.location.href = `fb-messenger://share?link=${url}`
    } else {
      window.open(
        `https://www.facebook.com/dialog/send?link=${url}&app_id=&redirect_uri=${url}`,
        '_blank',
        'width=600,height=400',
      )
    }
  }

  const alignClass = align === 'left' ? 'left-0' : 'right-0'
  const isAffiliateActive = Boolean(referralProductUrl || referralShopUrl)

  return (
    <div
      className={`absolute ${alignClass} top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72 animate-in fade-in slide-in-from-top-2`}
    >
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-black text-gray-700 uppercase tracking-widest">
            {type === 'shop' ? 'Chia sẻ cửa hàng' : 'Chia sẻ nhận hoa hồng'}
          </p>
          {isAffiliateActive && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-leaf-50 text-[10px] font-bold text-leaf-700">
              <Sparkles className="size-2.5" />
              2%
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chia sẻ"
          className="size-6 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer"
        >
          <X className="size-3.5 text-gray-400" />
        </button>
      </div>

      {isAffiliateActive && (
        <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
          Chia sẻ liên kết của bạn. Nhận tự động <span className="font-bold text-leaf-700">2% hoa hồng</span> vào ví khi bạn bè mua sản phẩm!
        </p>
      )}

      <div className="space-y-1.5">
        <button
          type="button"
          disabled={loadingLink}
          onClick={() => handleCopy(type)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          {(type === 'product' ? productCopied : shopCopied) ? (
            <Check className="size-4 text-leaf-700 shrink-0" />
          ) : (
            <Copy className="size-4 text-gray-400 shrink-0" />
          )}
          <span>
            {(type === 'product' ? productCopied : shopCopied)
              ? 'Đã sao chép link tiếp thị!'
              : loadingLink
                ? 'Đang tạo link tiếp thị...'
                : 'Sao chép link tiếp thị'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => shareFacebook(type)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-blue-600 transition-colors cursor-pointer"
        >
          <FacebookIcon className="size-4 shrink-0" />
          <span>Chia sẻ Facebook</span>
        </button>

        <button
          type="button"
          onClick={() => shareZalo(type)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-blue-500 transition-colors cursor-pointer"
        >
          <span className="size-4 rounded-full bg-blue-500 text-white text-[8px] font-black flex items-center justify-center shrink-0">
            Z
          </span>
          <span>Chia sẻ Zalo</span>
        </button>

        <button
          type="button"
          onClick={() => shareMessenger(type)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-xs font-bold text-indigo-600 transition-colors cursor-pointer"
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.913 1.405 5.514 3.608 7.24V22l3.259-1.793c.872.242 1.795.372 2.748.372 5.523 0 10-4.145 10-9.336C21.615 6.145 17.523 2 12 2zm1.067 12.573l-2.545-2.715-4.965 2.715 5.463-5.8 2.609 2.715 4.9-2.715-5.462 5.8z" />
          </svg>
          <span>Chia sẻ Messenger</span>
        </button>

        {type === 'product' && shopUrl && (
          <>
            <div className="border-t border-gray-100 my-1 pt-1" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              Chia sẻ cửa hàng
            </p>
            <button
              type="button"
              onClick={() => handleCopy('shop')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
              {shopCopied ? (
                <Check className="size-3.5 text-leaf-700 shrink-0" />
              ) : (
                <Copy className="size-3.5 text-gray-400 shrink-0" />
              )}
              <span>{shopCopied ? 'Đã sao chép link shop!' : 'Sao chép link cửa hàng'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
