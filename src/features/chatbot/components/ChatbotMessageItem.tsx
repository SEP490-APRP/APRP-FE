import React, { useState } from 'react'
import { User } from 'lucide-react'
import { useAuth } from '@/stores'
import type { ChatbotMessage } from '../stores/useChatbotStore'
import { ItemOptionsCard } from './ItemOptionsCard'
import { CartUpdatedCard } from './CartUpdatedCard'
import { CheckoutDraftCard } from './CheckoutDraftCard'
import { NavigationCard } from './NavigationCard'
import { OrderTrackingCard } from './OrderTrackingCard'
import { ReturnGuidanceCard } from './ReturnGuidanceCard'
import { OrderCancelCard } from './OrderCancelCard'
import { BudgetComboCard } from './BudgetComboCard'
import { RecipeCard } from './RecipeCard'
import { MysteryBoxQaCard } from './MysteryBoxQaCard'
import { VoucherListCard } from './VoucherListCard'
import { ShippingTipsCard } from './ShippingTipsCard'
import { PreservationTipsCard } from './PreservationTipsCard'
import { HumanHandoverCard } from './HumanHandoverCard'
import { RoleGuidanceCard } from './RoleGuidanceCard'
import { ReorderCard } from './ReorderCard'
import { FlashRescueCard } from './FlashRescueCard'
import { MealPlanBridgeCard } from './MealPlanBridgeCard'
import { SeasonalCalendarCard } from './SeasonalCalendarCard'
import { GreenImpactCard } from './GreenImpactCard'
import { PaymentAssistanceCard } from './PaymentAssistanceCard'
import { WalletInfoCard } from './WalletInfoCard'
import { UpdateShippingInfoCard } from './UpdateShippingInfoCard'

interface ChatbotMessageItemProps {
  message: ChatbotMessage
}

export const ChatbotMessageItem: React.FC<ChatbotMessageItemProps> = ({ message }) => {
  const isBot = message.sender === 'assistant'
  const { user } = useAuth()
  const [avatarError, setAvatarError] = useState(false)

  const avatarUrl = user?.avatar || (user as any)?.logoUrl || (user as any)?.avatarUrl
  const userName = user?.name || (user as any)?.fullName || (user as any)?.shopName
  const userInitial = userName?.trim() ? userName.trim().charAt(0).toUpperCase() : null

  // Format bold markdown **word** and newlines
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-[#254b12]">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const formatTime = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return ''
    }
  }

  return (
    <div
      className={`w-full flex items-start gap-2.5 ${
        isBot ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Bot Avatar (nằm bên trái) */}
      {isBot && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs border bg-white border-[#cfe6c4] p-0.5">
          <img
            src="/logo-icon.png"
            alt="CapNong AI"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[86%] sm:max-w-[82%] space-y-1 flex flex-col ${
          isBot ? 'items-start' : 'items-end'
        }`}
      >
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-2xs whitespace-pre-line text-left ${
            isBot
              ? 'bg-white border border-[#e2e6dc] text-[#1c2216] rounded-tl-xs'
              : 'bg-[#326318] text-white rounded-tr-xs shadow-xs'
          } ${message.status === 'error' ? 'bg-[#fdecea] border-[#d32f2f]/30 text-[#d32f2f]' : ''}`}
        >
          {renderFormattedContent(message.content)}

          {/* Interactive Cards (12 Enhanced Cases) */}
          {isBot && message.itemOptions && message.itemOptions.length > 0 && (
            <ItemOptionsCard items={message.itemOptions} />
          )}

          {isBot && (message.cart || message.selectedProduct) && (
            <CartUpdatedCard
              cart={message.cart}
              selectedProduct={message.selectedProduct}
            />
          )}

          {isBot && message.checkout && (
            <CheckoutDraftCard checkout={message.checkout} />
          )}

          {isBot && message.navigation && (
            <NavigationCard navigation={message.navigation} />
          )}

          {/* Case 1.1: Order Tracking */}
          {isBot && message.orderTracking && (
            <OrderTrackingCard tracking={message.orderTracking} />
          )}

          {/* Case 1.2: Return Guidance */}
          {isBot && message.returnGuidance && (
            <ReturnGuidanceCard guidance={message.returnGuidance} />
          )}

          {/* Case 1.3: Cancel Order */}
          {isBot && message.orderCancel && (
            <OrderCancelCard orderCancel={message.orderCancel} />
          )}

          {/* Case 2.1: Budget Combo */}
          {isBot && message.budgetCombo && (
            <BudgetComboCard combo={message.budgetCombo} />
          )}

          {/* Case 2.2: Recipe Suggestion */}
          {isBot && message.recipe && (
            <RecipeCard recipe={message.recipe} />
          )}

          {/* Case 2.3: Mystery Box QA & Allergy Warning */}
          {isBot && message.mysteryBoxQa && (
            <MysteryBoxQaCard mysteryBox={message.mysteryBoxQa} />
          )}

          {/* Case 3.1: Voucher List */}
          {isBot && message.vouchers && (
            <VoucherListCard vouchers={message.vouchers} />
          )}

          {/* Case 3.2: Shipping Tips */}
          {isBot && message.shippingTips && (
            <ShippingTipsCard tips={message.shippingTips} />
          )}

          {/* Case 4.2: Preservation Tips */}
          {isBot && message.preservationTips && message.preservationTips.length > 0 && (
            <PreservationTipsCard tips={message.preservationTips} />
          )}

          {/* Case 5.1: Human Handover */}
          {isBot && message.humanHandover && (
            <HumanHandoverCard handover={message.humanHandover} />
          )}

          {/* Case 5.2: Role Guidance */}
          {isBot && message.roleGuidance && (
            <RoleGuidanceCard roleGuidance={message.roleGuidance} />
          )}

          {/* Case 6.1: Reorder Recent */}
          {isBot && message.reorder && (
            <ReorderCard reorder={message.reorder} />
          )}

          {/* Case 6.2: Flash Rescue */}
          {isBot && message.flashRescue && (
            <FlashRescueCard rescue={message.flashRescue} />
          )}

          {/* Case 7.1: Meal Plan Bridge */}
          {isBot && message.mealPlanBridge && (
            <MealPlanBridgeCard bridge={message.mealPlanBridge} />
          )}

          {/* Case 7.2: Seasonal Calendar */}
          {isBot && message.seasonalCalendar && (
            <SeasonalCalendarCard calendar={message.seasonalCalendar} />
          )}

          {/* Case 8.1: Green Impact */}
          {isBot && message.greenImpact && (
            <GreenImpactCard impact={message.greenImpact} />
          )}

          {/* Case 9.1: Payment Assistance */}
          {isBot && message.paymentAssistance && (
            <PaymentAssistanceCard payment={message.paymentAssistance} />
          )}

          {/* Case 9.2: Wallet Info */}
          {isBot && message.walletInfo && (
            <WalletInfoCard wallet={message.walletInfo} />
          )}

          {/* Case 10.1: Update Shipping Info */}
          {isBot && message.updateShippingInfo && (
            <UpdateShippingInfoCard info={message.updateShippingInfo} />
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-[10px] text-[#5f6b57] px-1 ${
            isBot ? 'text-left' : 'text-right'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* User Avatar (nằm bên phải, lấy từ profile người dùng: buyer / shop / shipper nếu có) */}
      {!isBot && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs border border-[#cfe6c4] overflow-hidden bg-[#eaf4e6] text-[#254b12]"
          title={userName || 'Bạn'}
        >
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt={userName || 'User'}
              className="w-full h-full object-cover rounded-full"
              onError={() => setAvatarError(true)}
            />
          ) : userInitial ? (
            <span className="font-bold text-xs select-none">{userInitial}</span>
          ) : (
            <User className="w-4 h-4 text-[#326318]" />
          )}
        </div>
      )}
    </div>
  )
}
