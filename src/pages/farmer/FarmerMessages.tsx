import React from 'react'
import { ChatWorkspace } from '@/components/chat/core'

export const FarmerMessages: React.FC = () => {
  return (
    <div className="h-full w-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <ChatWorkspace
        currentUserRole="SHOP"
        canModerateAnyMessage={false}
        storageKeyPrefix="farmer_chat"
        sidebarTitle="DANH SÁCH KHÁCH HÀNG"
        className="h-full flex-1 flex overflow-hidden rounded-2xl bg-white border border-[#e2e7dd] shadow-sm min-h-0"
      />
    </div>
  )
}

export default FarmerMessages
