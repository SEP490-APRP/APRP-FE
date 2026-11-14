import React from 'react'
import { Sparkles, Utensils, ArrowRight, HeartPulse, ShoppingCart, Eye, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { MealPlanBridgeDto, AiItemOption } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface MealPlanBridgeCardProps {
  bridge: MealPlanBridgeDto
}

export const MealPlanBridgeCard: React.FC<MealPlanBridgeCardProps> = ({ bridge }) => {
  const navigate = useNavigate()
  const selectOption = useChatbotStore((s) => s.selectOption)
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const isLoading = useChatbotStore((s) => s.isLoading)

  const formatPrice = (val?: number) => {
    if (!val) return '0\u00A0đ'
    return new Intl.NumberFormat('vi-VN').format(val) + '\u00A0đ'
  }

  const title = bridge.conditionName || bridge.topic || 'Tư Vấn Dinh Dưỡng Theo Thể Trạng'
  const advice = bridge.healthAdvice || bridge.suggestionSummary
  const sampleMeals = bridge.sampleMeals || bridge.sampleDishes || []
  const goodProduce = bridge.goodProduce || []
  const avoidProduce = bridge.avoidProduce || []
  const products = bridge.recommendedProducts || bridge.recommendedProduce || []
  const ctaMessage = bridge.ctaMessage || '💡 Gợi ý từ CapNong: Để tự động lập thực đơn chi tiết cho cả tuần, phân tích bệnh lý chuyên sâu và cập nhật hồ sơ cá nhân của bạn, bạn có thể truy cập trang Kế Hoạch Bữa Ăn & Hồ Sơ Sức Khỏe AI nhé!'
  const targetUrl = bridge.planUrl || bridge.ctaUrl || '/ke-hoach-an-uong'
  const actionLabel = bridge.actionLabel || bridge.ctaLabel || 'Lên Kế Hoạch Bữa Ăn & Cập Nhật Hồ Sơ Sức Khỏe'

  const handleViewDetail = (e: React.MouseEvent, item: AiItemOption) => {
    e.stopPropagation()
    toggleOpen()
    if (item.itemType === 'MYSTERY_BOX' || item.itemType === 'BUILD_COMBO' || item.itemType === 'COMBO') {
      navigate('/combo-tui-mu')
    } else {
      navigate(`/san-pham/${item.itemId}`)
    }
  }

  return (
    <div className="mt-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-[#f8faf6] via-[#f1f6ed] to-[#e8f1e2] border border-[#d2e0cb] shadow-xs space-y-3.5">
      {/* 1. Header Card */}
      <div className="flex items-start justify-between border-b border-[#cfe0c7] pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#326318] text-white shadow-2xs flex-shrink-0">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1c2216] leading-snug">
              {title}
            </h4>
            <span className="text-[10px] text-[#326318] font-semibold flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-[#ffba41]" />
              Trợ lý dinh dưỡng AI CapNong
            </span>
          </div>
        </div>
      </div>

      {/* 2. Lời khuyên dinh dưỡng & Giải thích y khoa */}
      {advice && (
        <div className="p-3 rounded-xl bg-white/95 border border-[#d8e4d2] space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#326318]">
            <Lightbulb className="w-3.5 h-3.5 text-[#ffba41]" />
            <span>Lời Khuyên Dinh Dưỡng & Cơ Chế Sức Khỏe:</span>
          </div>
          <p className="text-xs text-[#2d3824] leading-relaxed whitespace-pre-line">
            {advice}
          </p>
        </div>
      )}

      <p className="text-[11px] text-ink-muted leading-relaxed">
        Nội dung chỉ mang tính tham khảo, không thay thế tư vấn y khoa. Nếu bạn đang điều trị bệnh, hãy hỏi ý kiến bác sĩ trước khi thay đổi chế độ ăn.
      </p>

      {/* 3. Gợi ý thực đơn mẫu trong ngày */}
      {sampleMeals.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#1c2216] flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-[#326318]" />
            <span>Gợi Ý Thực Đơn Mẫu Trong Ngày:</span>
          </div>
          <div className="space-y-1.5">
            {sampleMeals.map((meal, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-white/90 border border-[#e2ebd9] text-xs text-[#2c3722] font-medium shadow-2xs leading-snug"
              >
                {meal}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Nhóm nông sản nên dùng & cần hạn chế */}
      {(goodProduce.length > 0 || avoidProduce.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {goodProduce.length > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nông sản khuyên dùng:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {goodProduce.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white text-emerald-800 text-[10px] font-semibold border border-emerald-200 shadow-2xs"
                  >
                    🌱 {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {avoidProduce.length > 0 && (
            <div className="p-2.5 rounded-xl bg-rose-50/90 border border-rose-200 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Nông sản nên hạn chế:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {avoidProduce.map((a, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white text-rose-800 text-[10px] font-semibold border border-rose-200 shadow-2xs"
                  >
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Gợi ý nông sản sạch có sẵn tại CapNong */}
      {products.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-[#1c2216] flex items-center gap-1.5">
            <span>🛒 Nông sản sạch phù hợp đang có tại nhà vườn:</span>
          </div>
          <div className="space-y-1.5">
            {products.map((item) => (
              <div
                key={`${item.itemType}-${item.itemId}`}
                onClick={(e) => handleViewDetail(e, item)}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e2ebd9] hover:border-[#326318] text-xs cursor-pointer transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover border border-[#e5e2da] flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#f0f4ec] flex items-center justify-center text-sm flex-shrink-0">
                      🥬
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1c2216] truncate text-xs group-hover:text-[#326318] transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-[#d32f2f] font-bold">
                        {formatPrice(item.salePrice || item.price)}
                      </span>
                      {item.unit && <span className="text-[#6b7563]">/ {item.unit}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleViewDetail(e, item)}
                    className="py-1 px-2 rounded-md border border-[#326318]/30 hover:border-[#326318] hover:bg-[#326318]/10 text-[#326318] text-[10px] font-medium flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                    title="Xem chi tiết nông sản"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Chi tiết</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      selectOption(item, 1)
                    }}
                    disabled={isLoading}
                    className="py-1 px-2 text-[10px] font-semibold text-white bg-[#326318] hover:bg-[#254b12] rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50 whitespace-nowrap shadow-2xs"
                    title="Chọn mua vào giỏ"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Chọn</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Hộp gợi ý chuyển tiếp & Kêu gọi hành động (CTA Box) */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-100/70 via-teal-100/60 to-green-100/80 border border-emerald-300/80 space-y-2">
        <p className="text-xs text-emerald-950 font-medium leading-relaxed">
          {ctaMessage}
        </p>
        <Link
          to={targetUrl}
          onClick={() => toggleOpen()}
          className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#326318] hover:bg-[#244c11] active:scale-[0.99] rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default MealPlanBridgeCard
