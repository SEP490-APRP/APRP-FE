import React, { useState } from 'react'
import { TreePine, Award, Share2, Check, Leaf } from 'lucide-react'
import type { GreenImpactDto } from '@/services/chatbot.service'

interface GreenImpactCardProps {
  impact: GreenImpactDto
}

export const GreenImpactCard: React.FC<GreenImpactCardProps> = ({ impact }) => {
  const [copied, setCopied] = useState(false)

  if (!impact) return null

  // Safe parsing hỗ trợ linh hoạt cả format BE (totalRescuedWeight, co2SavedKg) và FE (totalRescuedKg, totalCo2SavedKg)
  const rescuedKg = Number(impact.totalRescuedKg ?? impact.totalRescuedWeight ?? 0)
  const co2Kg = Number(impact.totalCo2SavedKg ?? impact.co2SavedKg ?? (rescuedKg * 1.8))
  const rank = String(impact.ecoRank ?? impact.badgeLevel ?? 'Chiến Binh Nông Sản Xanh 🌿')
  const points = Number(impact.loyaltyPoints ?? 0)
  const trees = Number(impact.treesEquivalent ?? Math.max(1, Math.round(rescuedKg / 10)))
  const shareMsg = String(
    impact.shareMessage ??
    impact.impactMessage ??
    `Tôi đã đồng hành cùng CapNong giải cứu ${rescuedKg.toFixed(1)}kg nông sản, giảm ${co2Kg.toFixed(1)}kg CO₂!`
  )

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareMsg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#f1f8ec] via-white to-[#e3f1da]/70 border border-[#cfe6c4] shadow-xs space-y-3 text-[#1c2216]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#cfe6c4] pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#326318] text-white shadow-2xs">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1c2216]">Dấu Chân Xanh Của Bạn</h4>
            <div className="flex items-center gap-1 text-[10px] text-[#326318] font-bold">
              <Award className="w-3 h-3 text-[#ffba41]" />
              <span>{rank}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-[#326318]">
            {points} điểm
          </span>
          <div className="text-[9px] text-[#5f6b57]">CapNong Xu</div>
        </div>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-white border border-[#cfe6c4] text-center shadow-2xs">
          <div className="text-xs font-black text-[#326318]">
            {rescuedKg.toFixed(1)} kg
          </div>
          <div className="text-[9px] text-[#5f6b57] font-medium mt-0.5">Nông sản giải cứu</div>
        </div>
        <div className="p-2 rounded-lg bg-white border border-[#cfe6c4] text-center shadow-2xs">
          <div className="text-xs font-black text-[#4a7c2f]">
            {co2Kg.toFixed(1)} kg
          </div>
          <div className="text-[9px] text-[#5f6b57] font-medium mt-0.5">CO₂ giảm thải</div>
        </div>
        <div className="p-2 rounded-lg bg-white border border-[#cfe6c4] text-center shadow-2xs">
          <div className="text-xs font-black text-[#254b12] flex items-center justify-center gap-0.5">
            <TreePine className="w-3 h-3 text-[#326318]" />
            {trees}
          </div>
          <div className="text-[9px] text-[#5f6b57] font-medium mt-0.5">Cây xanh bảo vệ</div>
        </div>
      </div>

      <p className="text-xs text-[#5f6b57] leading-relaxed italic bg-white/80 p-2.5 rounded-lg border border-[#e5e2da]">
        "{shareMsg}"
      </p>

      {/* Share / Copy button */}
      <button
        type="button"
        onClick={handleShare}
        className="w-full py-2 px-3 text-xs font-bold text-[#326318] bg-white hover:bg-[#e3f1da] border border-[#326318] rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#326318]" />
            <span>Đã sao chép thông điệp tự hào!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5 text-[#326318]" />
            <span>Chia sẻ hành trình sống xanh</span>
          </>
        )}
      </button>
    </div>
  )
}

export default GreenImpactCard
