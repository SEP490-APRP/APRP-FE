import React from 'react'
import { Wallet, Coins, ArrowRight, ShieldAlert, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { WalletInfoDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface WalletInfoCardProps {
  wallet: WalletInfoDto
}

export const WalletInfoCard: React.FC<WalletInfoCardProps> = ({ wallet }) => {
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const formatPrice = (val?: number) => {
    if (!val) return '0 đ'
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ'
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-violet-50/90 via-purple-50/60 to-indigo-50 border border-purple-200 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-2xs">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-soil-900">Ví Tiện Ích & Điểm Tích Lũy</h4>
            <span className="text-[10px] text-purple-700 font-semibold">
              Trạng thái: {wallet.walletStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Points & Value Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-white/95 border border-purple-100 text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-xs font-black text-purple-800">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{wallet.loyaltyPoints}</span>
          </div>
          <div className="text-[9px] text-soil-500 font-medium">Điểm CapNong Xu</div>
        </div>
        <div className="p-2 rounded-lg bg-white/95 border border-purple-100 text-center shadow-2xs">
          <div className="text-xs font-black text-emerald-700">
            {formatPrice(wallet.pointsValueVnd)}
          </div>
          <div className="text-[9px] text-soil-500 font-medium">Quy đổi mua hàng</div>
        </div>
      </div>

      {/* Linked bank info if available */}
      {wallet.linkedBankName && (
        <div className="p-2 rounded-lg bg-white/90 border border-purple-100 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-soil-600 text-[10px]">
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
            <span>Tài khoản rút/nhận tiền:</span>
          </div>
          <span className="font-semibold text-purple-900 text-[11px]">
            {wallet.linkedBankName} ({wallet.linkedBankAccount ? `*${wallet.linkedBankAccount.slice(-4)}` : 'Đã kết nối'})
          </span>
        </div>
      )}

      {/* Safe note regarding integration */}
      <div className="p-2 rounded-lg bg-purple-50/80 border border-purple-100 text-[10px] text-purple-900 flex items-start gap-1.5 leading-relaxed">
        <ShieldAlert className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
        <span>{wallet.message}</span>
      </div>

      {/* Navigation button */}
      <Link
        to={wallet.navigationUrl || '/profile?tab=wallet'}
        onClick={() => toggleOpen()}
        className="w-full py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all"
      >
        <span>{wallet.navigationLabel || 'Xem Hồ Sơ & Thiết Lập Tài Khoản'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
