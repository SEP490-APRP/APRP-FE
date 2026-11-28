import React, { useEffect } from 'react'
import { Sparkles, Trash2, X } from 'lucide-react'
import { useAuth } from '@/stores'
import { authService } from '@/services'
import { globalShowAlert, globalShowConfirm } from '@/components/common/Popup'
import { getErrorMessage } from '@/utils'
import { useChatbotStore } from '../stores/useChatbotStore'
import { ChatbotMessageList } from './ChatbotMessageList'
import { ChatbotSuggestionPills } from './ChatbotSuggestionPills'
import { ChatbotInput } from './ChatbotInput'

export const ChatbotWindow: React.FC = () => {
  const isOpen = useChatbotStore((s) => s.isOpen)
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const clearHistory = useChatbotStore((s) => s.clearHistory)
  const loadHistory = useChatbotStore((s) => s.loadHistory)
  const reset = useChatbotStore((s) => s.reset)
  const { user, setUser } = useAuth()
  const userId = user?.id

  // Mỗi tài khoản một hội thoại riêng. Khách không có lịch sử trên server nên không gọi API (tránh 401).
  useEffect(() => {
    reset()
    if (userId) void loadHistory()
  }, [userId, reset, loadHistory])

  // Đồng bộ ảnh đại diện của user (Buyer, Shop, Shipper) nếu session chưa nạp avatar
  useEffect(() => {
    if (user && !user.avatar) {
      authService
        .getMyInfo()
        .then((res) => {
          const avatar = res.result?.logoUrl || res.result?.avatar
          if (avatar && avatar !== user.avatar) {
            setUser({ ...user, avatar })
          }
        })
        .catch(() => {})
    }
  }, [user?.id])

  const handleClear = async () => {
    const confirmed = await globalShowConfirm(
      'Xóa đoạn hội thoại?',
      'Toàn bộ cuộc trò chuyện sẽ bị xóa và không thể khôi phục.',
      { confirmText: 'Xóa', cancelText: 'Hủy', isDestructive: true },
    )
    if (!confirmed) return
    try {
      await clearHistory()
    } catch (err) {
      void globalShowAlert(getErrorMessage(err, 'Không thể xóa đoạn hội thoại. Vui lòng thử lại.'), 'Lỗi', 'error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[600px] max-h-[86vh] flex flex-col rounded-2xl bg-[#fafbfa] shadow-2xl border border-[#d6d3c9] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* 1. Header nông sản CapNong */}
      <div className="p-3.5 bg-gradient-to-r from-[#326318] via-[#3d7520] to-[#254b12] text-white flex items-center justify-between shadow-xs flex-shrink-0 border-b border-[#254b12]/40">
        <div className="flex items-center gap-2.5">
          {/* Logo CapNong avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm border border-white/50 flex items-center justify-center shrink-0">
              <img
                src="/logo-icon.png"
                alt="CapNong Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            {/* Chấm xanh lá cây trực tuyến */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#a4e876] border-2 border-[#326318] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm leading-tight text-white tracking-wide">
                CapNong Copilot
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffba41]/20 border border-[#ffba41]/40 text-[#ffea79] font-bold">
                Trợ lý AI
              </span>
            </div>
            <p className="text-[11px] text-[#e3f1da] flex items-center gap-1 mt-0.5 font-medium">
              <Sparkles className="w-3 h-3 text-[#ffea79]" />
              <span>Phụ tá nông sản sạch & Đi chợ 24/7</span>
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-[#e3f1da] hover:text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            title="Xóa đoạn hội thoại"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleOpen}
            className="p-1.5 rounded-lg text-[#e3f1da] hover:text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            title="Thu nhỏ cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Danh sách tin nhắn */}
      <ChatbotMessageList />

      {/* 3. Gợi ý câu hỏi nhanh */}
      <ChatbotSuggestionPills />

      {/* 4. Khung nhập liệu */}
      <ChatbotInput />
    </div>
  )
}

export default ChatbotWindow
