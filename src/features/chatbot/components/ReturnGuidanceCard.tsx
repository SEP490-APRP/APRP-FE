import React from 'react'
import { ShieldCheck, ArrowRight, Camera, Clock, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReturnGuidanceDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface ReturnGuidanceCardProps {
  guidance: ReturnGuidanceDto
}

const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' đ'

const formatDeadline = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export const ReturnGuidanceCard: React.FC<ReturnGuidanceCardProps> = ({ guidance }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const latest = guidance.latestReturn
  const deadline = formatDeadline(guidance.returnDeadline)

  const handleAction = () => {
    toggleOpen()
    navigate(guidance.actionUrl || '/orders')
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 shadow-sm space-y-2.5">
      <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>{guidance.policyTitle}</span>
      </div>

      <p className="text-xs text-soil-700 leading-relaxed">{guidance.policyContent}</p>

      {guidance.orderId && deadline && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/90 text-[11px] text-soil-700 border border-amber-100">
          <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>
            Đơn <b>#{guidance.orderId}</b> còn hạn gửi yêu cầu đến <b>{deadline}</b>
          </span>
        </div>
      )}

      {latest && (
        <div className="p-2 rounded-lg bg-white/90 border border-amber-100 text-[11px] space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-semibold text-soil-800">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              Yêu cầu #{latest.returnId}
              {latest.orderId ? ` · Đơn #${latest.orderId}` : ''}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                latest.active ? 'bg-amber-100 text-amber-800' : 'bg-soil-100 text-soil-700'
              }`}
            >
              {latest.statusLabel}
            </span>
          </div>
          {latest.productName && <div className="text-soil-600">{latest.productName}</div>}
          {latest.refundAmount != null && latest.refundAmount > 0 && (
            <div className="text-soil-600">
              Số tiền hoàn: <b className="text-soil-800">{formatVnd(latest.refundAmount)}</b>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/90 text-[11px] text-soil-600 border border-amber-100">
        <Camera className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span>Mẹo: Chụp rõ tem mã đơn và vị trí củ quả bị dập úng để việc xử lý nhanh hơn.</span>
      </div>

      <button
        type="button"
        onClick={handleAction}
        className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
      >
        <span>{guidance.actionLabel || 'Xem đơn hàng'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
