import React from 'react'
import { ShieldCheck, AlertCircle, ArrowRight, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReturnGuidanceDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface ReturnGuidanceCardProps {
  guidance: ReturnGuidanceDto
}

export const ReturnGuidanceCard: React.FC<ReturnGuidanceCardProps> = ({ guidance }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

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

      <p className="text-xs text-soil-700 leading-relaxed">
        {guidance.policyContent}
      </p>

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
