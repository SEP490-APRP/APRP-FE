import React, { useState } from 'react'
import { Sparkles, ThermometerSnowflake, BookOpen } from 'lucide-react'
import type { PreservationTipDto } from '@/services/chatbot.service'

interface PreservationTipsCardProps {
  tips: PreservationTipDto[]
}

export const PreservationTipsCard: React.FC<PreservationTipsCardProps> = ({ tips }) => {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!tips || tips.length === 0) return null

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/90 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-teal-900 text-xs font-bold border-b border-teal-200/60 pb-2">
        <ThermometerSnowflake className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <span>Bí Quyết Bảo Quản Rau Củ Tươi Lâu (5-7 Ngày)</span>
      </div>

      {/* Categories Tab */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tips.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIdx(idx)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeIdx === idx
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white/80 text-soil-700 hover:bg-teal-100/70 border border-teal-100'
            }`}
          >
            {item.category.split(' ')[0]} {item.category.split(' ')[1] || ''}
          </button>
        ))}
      </div>

      {/* Selected tip detail */}
      <div className="p-3 rounded-lg bg-white border border-teal-100 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-soil-900">{tips[activeIdx].category}</h5>
          {tips[activeIdx].storageType && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200">
              {tips[activeIdx].storageType}
            </span>
          )}
        </div>
        <p className="text-soil-600 leading-relaxed pt-1">
          {tips[activeIdx].tips}
        </p>
      </div>
    </div>
  )
}
