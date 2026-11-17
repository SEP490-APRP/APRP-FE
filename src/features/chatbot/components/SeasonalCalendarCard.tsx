import React from 'react'
import { Calendar, Apple, Carrot, Clock, Sparkles } from 'lucide-react'
import type { SeasonalCalendarDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface SeasonalCalendarCardProps {
  calendar: SeasonalCalendarDto
}

export const SeasonalCalendarCard: React.FC<SeasonalCalendarCardProps> = ({ calendar }) => {
  const sendMessage = useChatbotStore((s) => s.sendMessage)
  const isLoading = useChatbotStore((s) => s.isLoading)

  if (!calendar) return null

  const fruits = calendar.inSeasonFruits || []
  const vegetables = calendar.inSeasonVegetables || calendar.inSeasonVeggies || []
  const upcoming = calendar.upcomingProduce || []
  const note = calendar.note || calendar.healthBenefitNote || calendar.highlights

  // Xóa chữ "Tháng" thừa nếu BE trả về "Tháng 10" để tránh lỗi hiển thị "Tháng Tháng 10"
  const rawMonth = String(calendar.currentMonth || '')
  const displayMonth = rawMonth.replace(/^Tháng\s*/i, '') || String(new Date().getMonth() + 1)

  const handleSelectProduce = (name: string) => {
    if (isLoading) return
    sendMessage(`Tìm mua ${name}`)
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#f1f8ec] via-white to-[#e3f1da]/60 border border-[#cfe6c4] shadow-xs space-y-3 text-[#1c2216]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#cfe6c4] pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#326318] text-white shadow-2xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-[#1c2216]">
                Lịch Nông Sản Mùa Vụ Tháng {displayMonth}
              </h4>
              {calendar.isPastMonth && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] font-semibold">
                  Đã qua vụ rộ
                </span>
              )}
              {calendar.isFutureMonth && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] font-semibold">
                  Mùa vụ sắp tới
                </span>
              )}
              {!calendar.isPastMonth && !calendar.isFutureMonth && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] font-semibold">
                  Đang chính vụ
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#4a7c2f] font-semibold">
              Mùa nào thức nấy • Tươi ngon nhất • Giá rẻ nhất
            </span>
          </div>
        </div>
      </div>

      {note && (
        <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-1.5 ${
          calendar.isPastMonth 
            ? 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
            : calendar.isFutureMonth
            ? 'bg-[#f0f9ff] border-[#bae6fd] text-[#0369a1]'
            : 'bg-white border-[#cfe6c4] text-[#5f6b57]'
        }`}>
          <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
            calendar.isPastMonth ? 'text-[#d97706]' : calendar.isFutureMonth ? 'text-[#0284c7]' : 'text-[#ffba41]'
          }`} />
          <span className="text-[11px] leading-relaxed">{note}</span>
        </div>
      )}

      {/* In-season Fruits - Bấm vào là tìm mua ngay sản phẩm thật trên sàn */}
      {fruits.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-[#1c2216] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Apple className="w-3.5 h-3.5 text-[#d32f2f]" />
              Trái cây rộ mùa:
            </span>
            <span className="text-[9px] text-[#5f6b57] font-normal italic">(Bấm để xem & mua)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fruits.map((fruit, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectProduce(fruit)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#cfe6c4] hover:border-[#326318] hover:bg-[#e3f1da] text-[#254b12] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                title={`Tìm mua ${fruit}`}
              >
                <span>🍎</span>
                <span>{fruit}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* In-season Veggies - Bấm vào là tìm mua ngay */}
      {vegetables.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-[#1c2216] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Carrot className="w-3.5 h-3.5 text-[#326318]" />
              Rau củ chính vụ:
            </span>
            <span className="text-[9px] text-[#5f6b57] font-normal italic">(Bấm để xem & mua)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {vegetables.map((veg, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectProduce(veg)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#cfe6c4] hover:border-[#326318] hover:bg-[#e3f1da] text-[#254b12] text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                title={`Tìm mua ${veg}`}
              >
                <span>🥬</span>
                <span>{veg}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming produce */}
      {upcoming.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-[#cfe6c4]">
          <div className="text-[10px] font-bold text-[#5f6b57] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#ffba41]" />
            Nông sản sắp vào vụ tới:
          </div>
          <div className="text-[10px] text-[#5f6b57] italic">
            {upcoming.join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

export default SeasonalCalendarCard
