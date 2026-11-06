import React from 'react'
import { Wallet, Coins, ArrowRight, ShieldAlert, CreditCard, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { WalletInfoDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface WalletInfoCardProps {
  wallet: WalletInfoDto
}

const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' đ'

const formatSigned = (val: number) => (val > 0 ? '+' : val < 0 ? '−' : '') + formatVnd(Math.abs(val))

const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export const WalletInfoCard: React.FC<WalletInfoCardProps> = ({ wallet }) => {
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const balance = wallet.balance ?? 0
  const transactions = wallet.recentTransactions ?? []

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-violet-50/90 via-purple-50/60 to-indigo-50 border border-purple-200 shadow-xs space-y-3">
      <div className="flex items-center gap-2 border-b border-purple-200/80 pb-2">
        <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-2xs">
          <Wallet className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-soil-900">Ví CapNong</h4>
          <span className="text-[10px] text-purple-700 font-semibold">Trạng thái: {wallet.walletStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-white/95 border border-purple-100 text-center shadow-2xs">
          <div className={`text-xs font-black ${balance < 0 ? 'text-red-600' : 'text-purple-800'}`}>{formatVnd(balance)}</div>
          <div className="text-[9px] text-soil-500 font-medium">Số dư rút được</div>
        </div>
        <div className="p-2 rounded-lg bg-white/95 border border-purple-100 text-center shadow-2xs">
          <div className="text-xs font-black text-amber-700">{formatVnd(wallet.frozenBalance ?? 0)}</div>
          <div className="text-[9px] text-soil-500 font-medium">Đang tạm giữ</div>
        </div>
      </div>

      {wallet.loyaltyPoints != null && (
        <div className="flex items-center justify-between text-[11px] text-soil-600 px-1">
          <span className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> Điểm tích lũy
          </span>
          <span className="font-bold text-purple-900">{wallet.loyaltyPoints}</span>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="p-2 rounded-lg bg-white/90 border border-purple-100 space-y-1.5">
          <div className="text-[10px] font-semibold text-soil-600">Giao dịch gần đây</div>
          {transactions.map((t, idx) => (
            <div key={`${t.createdAt}-${idx}`} className="flex items-start justify-between gap-2 text-[10px]">
              <span className="text-soil-700 leading-snug line-clamp-2">
                {formatDate(t.createdAt) && <span className="text-soil-400 mr-1">{formatDate(t.createdAt)}</span>}
                {t.description || 'Giao dịch ví'}
                {t.hold && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-amber-700">
                    <Clock className="w-2.5 h-2.5" />
                    tạm giữ
                  </span>
                )}
              </span>
              <span className={`font-bold whitespace-nowrap ${t.amount < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {formatSigned(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {wallet.linkedBankName && (
        <div className="p-2 rounded-lg bg-white/90 border border-purple-100 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-soil-600 text-[10px]">
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
            <span>Tài khoản nhận tiền rút:</span>
          </div>
          <span className="font-semibold text-purple-900 text-[11px]">
            {wallet.linkedBankName} ({wallet.linkedBankAccount ? `*${wallet.linkedBankAccount.slice(-4)}` : 'Đã kết nối'})
          </span>
        </div>
      )}

      <div className="p-2 rounded-lg bg-purple-50/80 border border-purple-100 text-[10px] text-purple-900 flex items-start gap-1.5 leading-relaxed">
        <ShieldAlert className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
        <span>{wallet.message}</span>
      </div>

      <Link
        to={wallet.navigationUrl || '/my-wallet'}
        onClick={() => toggleOpen()}
        className="w-full py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all"
      >
        <span>{wallet.navigationLabel || 'Mở Ví của tôi'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
