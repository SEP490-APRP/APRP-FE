import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Check,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Store,
} from 'lucide-react'
import type { ReviewResponse } from '@/services'
import { globalShowAlert } from '@/components/common/Popup'
import { ProductSharePopover } from './ProductSharePopover'

interface ProductShopCardProps {
  farmName: string
  shopOwner: any
  resolvedShopId?: number
  shopReviews: ReviewResponse[]
  shopUrl: string | null
  isAuthenticated: boolean
  onNavigateToShop: () => void
  onStartChat: () => void
}

export const ProductShopCard: React.FC<ProductShopCardProps> = ({
  farmName,
  shopOwner,
  resolvedShopId,
  shopReviews,
  shopUrl,
  isAuthenticated,
  onNavigateToShop,
  onStartChat,
}) => {
  const navigate = useNavigate()
  const [showShopShareMenu, setShowShopShareMenu] = useState(false)

  const followKey = resolvedShopId ? `capnong_follow_shop_${resolvedShopId}` : ''
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    return followKey ? localStorage.getItem(followKey) === 'true' : false
  })

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const next = !isFollowing
    setIsFollowing(next)
    if (followKey) {
      localStorage.setItem(followKey, String(next))
    }
    globalShowAlert(
      next ? `Đã theo dõi ${farmName} thành công!` : `Đã hủy theo dõi ${farmName}.`,
      'Thông báo',
      'info',
    )
  }

  const shopAvgRating =
    shopReviews.length > 0
      ? (shopReviews.reduce((acc, r) => acc + r.ratingStar, 0) / shopReviews.length).toFixed(1)
      : '5.0'

  const replyRate =
    shopReviews.length > 0 && shopReviews.some((r) => r.replyFromShop)
      ? `${Math.round(
          (shopReviews.filter((r) => r.replyFromShop).length / shopReviews.length) * 100,
        )}%`
      : '100%'

  const joinDurationText = (() => {
    const joinDate = shopOwner?.createAt || shopOwner?.createdAt
    if (!joinDate) return '1 Năm'
    const years = Math.floor(
      (Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365),
    )
    return years > 0 ? `${years} Năm` : 'Mới tham gia'
  })()

  const shopPhone = shopOwner?.phoneNumber || shopOwner?.phone || ''
  const shopAddress = shopOwner?.address || ''
  const isActive = shopOwner?.status === 'ACTIVE'

  return (
    <div className="bg-white rounded-xl border border-line shadow-2xs p-4 sm:p-5">
      {/* Header with avatar & name */}
      <div className="flex items-start gap-3">
        <div
          className="relative shrink-0 cursor-pointer group"
          onClick={onNavigateToShop}
          title={`Xem gian hàng ${farmName}`}
        >
          <div className="size-13 rounded-lg overflow-hidden border border-line shadow-2xs bg-[#FAF7EF] group-hover:border-leaf-500 transition-colors">
            <img
              src={
                shopOwner?.logoUrl ||
                shopOwner?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  farmName,
                )}&background=326318&color=fff&size=200&bold=true`
              }
              alt={farmName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  farmName,
                )}&background=326318&color=fff&size=200&bold=true`
              }}
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-2xs">
            <Check className="size-2 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h4
            onClick={onNavigateToShop}
            className="font-bold text-ink text-sm sm:text-base leading-snug hover:text-leaf-700 cursor-pointer transition-colors"
          >
            {farmName}
          </h4>
          <div className="flex items-center gap-1 flex-wrap mt-1">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-leaf-50 text-leaf-700 border border-leaf-200">
              <ShieldCheck className="size-2.5" />
              Đã xác thực
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sun-100 text-soil-700 border border-sun-300/40">
              <Award className="size-2.5" />
              VietGAP
            </span>
          </div>
        </div>
      </div>

      {/* Contact info list */}
      <div className="space-y-1.5 text-xs text-ink-muted my-3 pt-3 border-t border-line/60">
        {shopAddress && (
          <div className="flex items-start gap-1.5">
            <MapPin className="size-3.5 text-soil-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{shopAddress}</span>
          </div>
        )}
        {shopPhone && (
          <div className="flex items-center gap-1.5">
            <Phone className="size-3.5 text-leaf-700 shrink-0" />
            <span>Hotline: <strong className="text-ink font-semibold">{shopPhone}</strong></span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-leaf-700 font-medium">
          <Clock className="size-3.5 text-leaf-600 shrink-0" />
          <span>{isActive ? 'Đang mở cửa đón khách' : 'Tạm nghỉ'}</span>
        </div>
      </div>

      {/* 3 Metrics ribbon */}
      <div className="grid grid-cols-3 gap-1.5 bg-paper-warm/80 p-2.5 rounded-lg border border-line text-center my-3">
        <div>
          <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-ink">
            <Star className="size-3 fill-sun-500 text-sun-500" />
            <span>{shopAvgRating}</span>
          </div>
          <p className="text-[9px] text-ink-muted font-medium uppercase mt-0.5">
            {shopReviews.length} Đánh giá
          </p>
        </div>
        <div className="border-l border-r border-line px-1">
          <p className="text-sm font-bold text-leaf-700">{replyRate}</p>
          <p className="text-[9px] text-ink-muted font-medium uppercase mt-0.5">
            Phản hồi
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-ink truncate">{joinDurationText}</p>
          <p className="text-[9px] text-ink-muted font-medium uppercase mt-0.5">
            Tham gia
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onNavigateToShop}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-2 bg-white text-leaf-700 hover:bg-leaf-50 font-bold text-xs rounded-lg border border-leaf-300 hover:border-leaf-600 transition-all shadow-2xs cursor-pointer"
          >
            <Store className="size-3.5 shrink-0" />
            <span>Xem shop</span>
          </button>
          <button
            type="button"
            onClick={onStartChat}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-2 bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <MessageSquare className="size-3.5 shrink-0" />
            <span>Nhắn tin</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFollowToggle}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 font-bold text-xs rounded-lg border transition-all shadow-2xs cursor-pointer ${
              isFollowing
                ? 'bg-leaf-50 text-leaf-700 border-leaf-300'
                : 'bg-white hover:bg-paper-warm text-ink border-line'
            }`}
          >
            <Heart
              className={`size-3.5 shrink-0 ${isFollowing ? 'fill-leaf-700 text-leaf-700' : 'text-ink-muted'}`}
            />
            <span>{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShopShareMenu((v) => !v)}
              aria-label="Chia sẻ gian hàng"
              className="inline-flex items-center justify-center h-8 px-2.5 bg-white hover:bg-paper-warm text-ink font-semibold text-xs rounded-lg border border-line transition-all shadow-2xs cursor-pointer"
            >
              <Share2 className="size-3.5" />
            </button>

            {shopUrl && (
              <ProductSharePopover
                isOpen={showShopShareMenu}
                onClose={() => setShowShopShareMenu(false)}
                productUrl={shopUrl}
                shopUrl={shopUrl}
                type="shop"
                align="left"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
