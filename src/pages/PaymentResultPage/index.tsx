import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { PaymentResultView } from '@/features/order/components/PaymentResultView'
import CampaignPaymentResult from '@/features/campaign/components/CampaignPaymentResult'

export const PaymentResultPage: React.FC = () => {
  const [params] = useSearchParams()
  // Cọc chiến dịch giải cứu: BE gắn ?type=campaign&preOrderId=... vào returnUrl/cancelUrl của PayOS
  if (params.get('type') === 'campaign') return <CampaignPaymentResult />
  return <PaymentResultView />
}

export default PaymentResultPage
