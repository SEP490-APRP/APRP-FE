import React, { useState } from 'react'
import { CreditCard, Copy, Check, ExternalLink, Phone, ShieldCheck } from 'lucide-react'
import type { PaymentAssistanceDto } from '@/services/chatbot.service'

interface PaymentAssistanceCardProps {
  payment: PaymentAssistanceDto
}

export const PaymentAssistanceCard: React.FC<PaymentAssistanceCardProps> = ({ payment }) => {
  const [copiedAcc, setCopiedAcc] = useState(false)

  const formatPrice = (val?: number) => {
    if (!val) return '0\u00A0đ'
    return new Intl.NumberFormat('vi-VN').format(val) + '\u00A0đ'
  }

  const handleCopyAccount = () => {
    if (payment.bankAccount && navigator.clipboard) {
      navigator.clipboard.writeText(payment.bankAccount)
      setCopiedAcc(true)
      setTimeout(() => setCopiedAcc(false), 2000)
    }
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-slate-50 border border-blue-200 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-soil-900">
              {payment.orderId ? `Hỗ trợ thanh toán Đơn #${payment.orderId}` : 'Cổng thanh toán CapNong'}
            </h4>
            {payment.paymentMethod && (
              <span className="text-[10px] text-blue-700 font-semibold">Phương thức: {payment.paymentMethod}</span>
            )}
          </div>
        </div>
        {payment.amountDue && payment.amountDue > 0 ? (
          <div className="text-right">
            <span className="text-xs font-black text-blue-900">
              {formatPrice(payment.amountDue)}
            </span>
            <div className="text-[9px] text-soil-400">Cần thanh toán</div>
          </div>
        ) : null}
      </div>

      {/* Guidance box */}
      {payment.guidance && (
        <div className="p-2.5 rounded-lg bg-white/95 border border-blue-100 space-y-1 text-xs text-soil-700 leading-relaxed shadow-2xs">
          <p>{payment.guidance}</p>
        </div>
      )}

      {/* Bank Account Info Box (Only show if actually configured) */}
      {payment.bankAccount && payment.bankName && (
        <div className="p-2.5 rounded-lg bg-white/95 border border-blue-100 space-y-1.5 shadow-2xs text-xs">
          <div className="flex items-center justify-between">
            <span className="text-soil-500 text-[10px]">Ngân hàng:</span>
            <span className="font-semibold text-soil-800 text-[11px]">{payment.bankName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-soil-500 text-[10px]">Chủ tài khoản:</span>
            <span className="font-semibold text-soil-800 text-[11px]">{payment.accountHolder}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-soil-500 text-[10px]">Số tài khoản:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-blue-800 text-xs">
                {payment.bankAccount}
              </span>
              <button
                onClick={handleCopyAccount}
                className="p-1 hover:bg-blue-50 text-blue-700 rounded transition-colors cursor-pointer"
                title="Sao chép số tài khoản"
              >
                {copiedAcc ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step instructions */}
      {payment.stepInstructions && payment.stepInstructions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-soil-600 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Các bước xử lý an toàn:
          </div>
          <div className="space-y-0.5 pl-1">
            {payment.stepInstructions.map((step, idx) => (
              <div key={idx} className="text-[10px] text-soil-600 flex items-start gap-1">
                <span className="text-blue-600 font-bold">•</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action links */}
      <div className="flex gap-2">
        {payment.payosUrl && (
          <a
            href={payment.payosUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <span>Mở PayOS thanh toán</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {payment.supportHotline && (
          <a
            href={`tel:${payment.supportHotline}`}
            className="py-1.5 px-3 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs flex items-center justify-center gap-1 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>Hotline hỗ trợ</span>
          </a>
        )}
      </div>
    </div>
  )
}
