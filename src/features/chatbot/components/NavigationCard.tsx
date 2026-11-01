import React from 'react'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AiNavigationAction } from '@/services/chatbot.service'
import { useChatbotStore } from '../stores/useChatbotStore'

interface NavigationCardProps {
  navigation: AiNavigationAction
}

export const NavigationCard: React.FC<NavigationCardProps> = ({ navigation }) => {
  const navigate = useNavigate()
  const toggleOpen = useChatbotStore((s) => s.toggleOpen)

  const handleClick = () => {
    toggleOpen()
    navigate(navigation.url)
  }

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#326318] hover:bg-[#254b12] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer border border-[#254b12]"
      >
        <span>{navigation.label || 'Xem ngay'}</span>
        <ExternalLink className="w-3.5 h-3.5 text-[#ffea79]" />
      </button>
    </div>
  )
}

export default NavigationCard
