import React from 'react'
import { Headphones, Phone, MessageSquare, ExternalLink, Mail } from 'lucide-react'
import type { HumanHandoverDto } from '@/services/chatbot.service'
import { useChatStore } from '@/stores'
import { useChatbotStore } from '../stores/useChatbotStore'

interface HumanHandoverCardProps {
  handover: HumanHandoverDto
}

export const HumanHandoverCard: React.FC<HumanHandoverCardProps> = ({ handover }) => {
  const setChatOpen = useChatStore((s) => s.setOpen)
  const toggleChatbotOpen = useChatbotStore((s) => s.toggleOpen)

  const handleOpenP2pChat = () => {
    // Close AI copilot and open shop P2P chat
    toggleChatbotOpen()
    setChatOpen(true)
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-sky-50/80 border border-sky-200/90 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-sky-900 text-xs font-bold border-b border-sky-100 pb-2">
        <Headphones className="w-4 h-4 text-sky-600 flex-shrink-0" />
        <span>Kênh Hỗ Trợ Khách Hàng & Nhà Vườn Trực Tuyến</span>
      </div>

      <p className="text-xs text-soil-700 leading-relaxed">
        {handover.note || 'Bạn có thể gửi tin nhắn trực tiếp cho chủ nhà vườn:'}
      </p>

      {(handover.hotline || handover.zaloUrl) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {handover.hotline && (
            <a
              href={`tel:${handover.hotline}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-sky-100 hover:border-sky-300 text-xs font-semibold text-soil-800 transition-colors shadow-2xs"
            >
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-soil-400">Tổng đài hỗ trợ</div>
                <span className="text-emerald-700">{handover.hotline}</span>
              </div>
            </a>
          )}

          {handover.zaloUrl && (
            <a
              href={handover.zaloUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-sky-100 hover:border-sky-300 text-xs font-semibold text-soil-800 transition-colors shadow-2xs"
            >
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-soil-400">Zalo hỗ trợ</div>
                <span className="text-blue-600">Zalo CapNong</span>
              </div>
            </a>
          )}
        </div>
      )}

      {/* Trigger P2P Chat */}
      {handover.triggerP2pChat && (
        <button
          type="button"
          onClick={handleOpenP2pChat}
          className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Mở khung Chat P2P với Nhà Vườn</span>
        </button>
      )}
    </div>
  )
}
