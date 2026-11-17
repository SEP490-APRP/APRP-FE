import React from 'react'
import { Sparkles } from 'lucide-react'
import { useChatbotStore } from '../stores/useChatbotStore'

const SUGGESTIONS = [
  '🚚 Đơn hàng của tôi tới đâu rồi?',
  '🔁 Mua lại đơn hàng cũ gần nhất',
  '⚡ Flash rescue nông sản giảm giá hôm nay',
  '🌱 Dấu chân xanh của tôi',
  '📅 Lịch nông sản mùa vụ tháng này',
  '🥗 Gợi ý thực đơn cho người tiểu đường',
  '🛡️ Rau củ bị dập úng đổi trả sao?',
  '💰 Gợi ý combo 100k cho gia đình',
  '🍲 Có bắp cải nấu món gì ngon?',
  '🎁 Hộp bí ẩn có rau gì hôm nay?',
  '🎟️ Hôm nay có voucher freeship nào không?',
  '🌿 Nông sản xấu mã có an toàn không?',
  '🧊 Mẹo bảo quản rau củ tươi lâu',
  '👩‍💼 Gặp nhân viên tư vấn',
]

export const ChatbotSuggestionPills: React.FC = () => {
  const sendMessage = useChatbotStore((s) => s.sendMessage)
  const isLoading = useChatbotStore((s) => s.isLoading)

  return (
    <div className="py-2.5 px-3 border-t border-[#e5e2da] bg-[#f4f7f1]">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#326318] mb-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#ffba41]" />
        <span>Gợi ý câu hỏi phổ biến:</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {SUGGESTIONS.map((item, idx) => {
          const cleanText = item.replace(/^[^\w\s\u00C0-\u1EF9]+\s*/, '')
          return (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => sendMessage(cleanText)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#cfe6c4] hover:border-[#326318] hover:bg-[#e3f1da] text-[#254b12] text-xs font-medium transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ChatbotSuggestionPills
