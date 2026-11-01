import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Store } from 'lucide-react'
import { ChatWorkspace } from '@/components/chat/core'

export const BuyerMessagesPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetChatId = searchParams.get('chatId')

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 max-w-7xl h-[calc(100vh-125px)] max-h-[calc(100vh-125px)] flex flex-col overflow-hidden animate-fadeIn">
      {/* Tiêu đề trang & Điều hướng */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="size-8 rounded-full bg-white hover:bg-gray-100 border border-[#e5e1d5] flex items-center justify-center text-gray-700 transition shadow-2xs cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-black text-[#1c2216] flex items-center gap-2">
              <MessageSquare size={20} className="text-[#326318]" />
              <span>Hộp Thư & Tin Nhắn Trực Tuyến</span>
            </h1>
            <p className="text-[11px] text-gray-500">
              Trò chuyện trực tiếp với Nhà Vườn và kênh hỗ trợ Ban Quản Trị CapNong 24/7
            </p>
          </div>
        </div>
      </div>

      {/* KHUNG CHAT TÁI SỬ DỤNG */}
      <div className="flex-1 min-h-0">
        <ChatWorkspace
          currentUserRole="BUYER"
          targetChatId={targetChatId}
          storageKeyPrefix="buyer_chat"
          sidebarTitle="HỘI THOẠI GẦN ĐÂY"
          sidebarWidthClass="w-80 md:w-88"
          renderHeaderActions={(activeConversation) =>
            activeConversation.otherUserRole?.toUpperCase() === 'SHOP' ? (
              <button
                type="button"
                onClick={() => navigate(`/cua-hang/${activeConversation.otherUserId}`)}
                className="px-3 py-1.5 rounded-xl border border-[#d6dfd0] hover:border-[#326318] hover:bg-emerald-50 text-xs font-bold text-[#326318] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Store size={14} />
                <span>Xem gian hàng</span>
              </button>
            ) : null
          }
        />
      </div>
    </div>
  )
}

export default BuyerMessagesPage
