import React from 'react'
import {
  Briefcase,
  Store,
  Bike,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { RoleGuidanceDto } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface RoleGuidanceCardProps {
  roleGuidance: RoleGuidanceDto
}

export const RoleGuidanceCard: React.FC<RoleGuidanceCardProps> = ({ roleGuidance }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const handleNavigate = (url: string) => {
    toggleOpen()
    navigate(url)
  }

  const role = (roleGuidance.role || '').toUpperCase()
  const isShop = role === 'SHOP'
  const isShipper = role === 'SHIPPER'

  const badgeColor = isShop
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isShipper
    ? 'bg-blue-100 text-blue-800 border-blue-300'
    : 'bg-amber-100 text-amber-800 border-amber-300'

  const roleBadgeLabel = isShop
    ? '🌾 Kênh Nhà Vườn'
    : isShipper
    ? '🛵 Cổng Tài Xế'
    : '🤝 Hợp Tác Đối Tác'

  // Tách dòng hướng dẫn nếu có nhiều bước
  const guidanceLines = (roleGuidance.guidance || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isShop ? 'bg-emerald-100 text-emerald-800' : isShipper ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isShop ? <Store className="w-4 h-4" /> : isShipper ? <Bike className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
          </div>
          <span className="font-bold text-xs text-soil-900 truncate">
            {roleGuidance.title}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
          {roleBadgeLabel}
        </span>
      </div>

      {/* Guidance Content */}
      <div className="space-y-1 text-xs text-soil-700 leading-relaxed">
        {guidanceLines.map((line, idx) => {
          const isStep = /^\d+[\.\)]/.test(line) || line.startsWith('•') || line.startsWith('-')
          return (
            <p
              key={idx}
              className={
                isStep
                  ? 'flex items-start gap-1.5 font-medium text-soil-800 pl-1 py-0.5'
                  : 'text-soil-600'
              }
            >
              {isStep && (
                <CheckCircle2
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    isShop ? 'text-emerald-600' : isShipper ? 'text-blue-600' : 'text-amber-600'
                  }`}
                />
              )}
              <span>{line.replace(/^(\d+[\.\)]|•|-)\s*/, '')}</span>
            </p>
          )
        })}
      </div>

      {/* Quick Action Navigation Links */}
      {roleGuidance.quickLinks && roleGuidance.quickLinks.length > 0 && (
        <div className="space-y-2 pt-1">
          {roleGuidance.quickLinks.map((link, idx) => {
            const isPrimary = idx === 0
            if (isPrimary) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleNavigate(link.url)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-2xs active:scale-[0.98] transition-all cursor-pointer ${
                    isShop
                      ? 'bg-[#2f5c1b] hover:bg-[#254b12] text-white'
                      : isShipper
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffba41]" />
                    <span>{link.label}</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleNavigate(link.url)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-soil-800 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-soil-400" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RoleGuidanceCard
