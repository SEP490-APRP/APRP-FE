import React from 'react'
import { Sparkles, MessageCircle } from 'lucide-react'
import { useChatbotStore } from '../stores/useChatbotStore'
import { ChatbotWindow } from './ChatbotWindow'
import { useUiStore } from '@/stores'

export const ChatbotFloatingWidget: React.FC = () => {
  const isOpen = useChatbotStore((s) => s.isOpen)
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const unreadCount = useChatbotStore((s) => s.unreadCount)

  const cartOpen = useUiStore((s) => s.cartOpen)
  const cartMinimized = useUiStore((s) => s.cartMinimized)
  const isCartDrawerActive = cartOpen && !cartMinimized

  return (
    <>
      {/* 1. Cửa sổ chat AI Copilot */}
      <ChatbotWindow />

      {/* 2. Nút bong bóng AI Copilot nổi (Ẩn khi cửa sổ đang mở để không đè lên ô chat) */}
      {!isOpen && (
        <aside
          aria-label="Trợ lý AI CapNong Copilot"
          className={`fixed z-50 flex flex-col items-end select-none pointer-events-auto transition-all duration-300 ease-in-out ${
            isCartDrawerActive ? 'hidden md:flex right-5 md:right-[416px]' : 'right-5'
          } bottom-[86px]`}
        >
          <button
            type="button"
            onClick={toggleOpen}
            className="group relative size-14 rounded-full bg-white border-2 border-[#326318] text-[#1c2216] shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer p-1.5"
            title="CapNong Copilot - Trợ lý nông sản thông minh 24/7"
          >
            {/* Logo CapNong chính thức ở giữa */}
            <img
              src="/logo-icon.png"
              alt="CapNong Copilot"
              className="w-full h-full object-contain rounded-full transition-transform group-hover:scale-110 duration-200"
            />

            {/* Huy hiệu AI lấp lánh góc trên */}
            <div className="absolute -top-1 -right-1 size-5 rounded-full bg-gradient-to-tr from-[#326318] to-[#4a7c2f] border-2 border-white flex items-center justify-center shadow-xs">
              <Sparkles size={11} className="text-[#ffea79] animate-pulse" />
            </div>

            {/* Badge tin nhắn mới nếu có */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 size-5 rounded-full bg-[#d32f2f] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            {/* Tooltip khi hover */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#1c2216]/90 text-[#f8faf6] text-xs font-medium whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:inline-flex items-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#a4e876] animate-ping" />
              CapNong Copilot AI
            </span>
          </button>
        </aside>
      )}
    </>
  )
}

export default ChatbotFloatingWidget
