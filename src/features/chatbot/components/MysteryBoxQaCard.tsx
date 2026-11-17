import React from 'react'
import {
  Package,
  AlertTriangle,
  Plus,
  Eye,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MysteryBoxQaDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface MysteryBoxQaCardProps {
  mysteryBox: MysteryBoxQaDto
}

export const MysteryBoxQaCard: React.FC<MysteryBoxQaCardProps> = ({ mysteryBox }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)
  const selectOption = useChatbotStore((s) => s.selectOption)
  const isLoading = useChatbotStore((s) => s.isLoading)

  const handleViewDetail = () => {
    toggleOpen()
    navigate('/combo-tui-mu')
  }

  const handleNavigateFresh = () => {
    toggleOpen()
    navigate('/nong-san-tuoi')
  }

  const handleNavigateCombos = () => {
    toggleOpen()
    navigate('/combo-tui-mu')
  }

  const formatPrice = (val?: number) => {
    if (!val) return '0\u00A0đ'
    return new Intl.NumberFormat('vi-VN').format(val) + '\u00A0đ'
  }

  const isRisk = mysteryBox.isAllergyRisk
  const hasAllergies = mysteryBox.userAllergies && mysteryBox.userAllergies.length > 0

  // KỊCH BẢN 2: CẢNH BÁO DỊ ỨNG ĐỎ (KHI CÓ DỊ ỨNG NẤM/HẠT HOẶC USER HỎI VỀ DỊ ỨNG)
  if (isRisk) {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-rose-50 via-red-50/60 to-amber-50/40 border border-rose-300 shadow-sm space-y-3">
        {/* Header Cảnh báo đỏ */}
        <div className="flex items-center gap-2.5 border-b border-rose-200 pb-2.5">
          <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-2xs shrink-0">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-950 leading-tight">
              Cảnh báo dị ứng: Không khuyến khích mua Hộp Bí Ẩn
            </h4>
            <span className="text-[10px] text-rose-700 font-semibold">
              Nguy cơ dị nguyên & nhiễm chéo cao
            </span>
          </div>
        </div>

        {/* Nội dung giải thích rủi ro */}
        <div className="p-2.5 rounded-lg bg-white/95 border border-rose-200 text-xs text-rose-950 space-y-1.5 shadow-2xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-800">
                Phát hiện nguy cơ dị ứng: {mysteryBox.riskAllergen || 'Nấm / Các loại hạt'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Hộp Bí Ẩn được đóng gói ngẫu nhiên mỗi sáng theo lượng nông sản giải cứu từ nhiều nhà vườn, do đó <b>không thể cam kết loại bỏ 100%</b> các loại củ quả, nấm hoặc hạt gây kích ứng.
              </p>
            </div>
          </div>
        </div>

        {/* Khuyến nghị giải pháp an toàn */}
        <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Giải pháp mua sắm an toàn cho bạn:</span>
          </p>

          <div className="space-y-1.5">
            {/* Nút 1: Chọn rau củ đơn lẻ */}
            <button
              type="button"
              onClick={handleNavigateFresh}
              className="w-full py-2 px-3 rounded-lg bg-[#326318] hover:bg-[#254b12] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-between shadow-2xs transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>🥬</span>
                <span>Chọn rau củ an toàn (Đơn lẻ)</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#ffea79]" />
            </button>

            {/* Nút 2: Xem combo rõ thành phần */}
            <button
              type="button"
              onClick={handleNavigateCombos}
              className="w-full py-2 px-3 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 active:scale-[0.98] text-[#326318] text-xs font-bold flex items-center justify-between shadow-2xs transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>🍱</span>
                <span>Xem Combo minh bạch thành phần</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Trạng thái khóa mua hộp bí ẩn */}
        <div className="text-[11px] text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-200 text-center">
          🔒 Nút mua Hộp Bí Ẩn tạm khóa để bảo vệ bạn khỏi nguy cơ dị ứng thực phẩm.
        </div>
      </div>
    )
  }

  // KỊCH BẢN 1: TÌM HIỂU HỘP BÍ ẨN THÔNG THƯỜNG (HỘP BÍ ẨN CÓ GÌ, GIÁ BAO NHIÊU...)
  return (
    <div className="mt-3 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/90 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-2xs">
          <Package className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-soil-900">
            Hộp Bí Ẩn Nông Sản Giải Cứu (Mystery Box)
          </h4>
          <span className="text-[10px] text-purple-700 font-semibold">
            Nông sản do nhà vườn chọn và đóng gói sẵn
          </span>
        </div>
      </div>

      <p className="text-xs text-soil-700 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-purple-100">
        {mysteryBox.seasonalDescription}
      </p>

      {/* Allergy Caution Badge nhẹ nhàng nếu user có dị ứng trong hồ sơ */}
      {hasAllergies ? (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Lưu ý dị ứng: </span>
            <span>Hồ sơ của bạn có ghi nhận: </span>
            <span className="font-semibold text-rose-700">
              {mysteryBox.userAllergies?.join(', ')}
            </span>
            <p className="text-[11px] text-soil-500 mt-0.5">
              Bạn có thể ghi chú cho nhà vườn ở bước thanh toán để shop tránh xếp các loại củ quả này vào hộp nhé!
            </p>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-soil-500 bg-white/70 p-2 rounded-lg">
          {mysteryBox.note}
        </div>
      )}

      {/* Box item CTA */}
      {mysteryBox.boxItem && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-200 gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">🎁</span>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-soil-900 truncate">
                {mysteryBox.boxItem.name}
              </h5>
              <span className="text-xs font-extrabold text-purple-700">
                {formatPrice(mysteryBox.boxItem.price)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleViewDetail}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-300 hover:bg-purple-50 active:scale-95 text-purple-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Xem chi tiết Hộp Bí Ẩn"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Chi tiết</span>
            </button>
            <button
              type="button"
              onClick={() => selectOption(mysteryBox.boxItem!, 1)}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm hộp bí ẩn</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MysteryBoxQaCard
