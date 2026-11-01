import React from 'react'
import { ChatWorkspace } from '@/components/chat/core'

export const FarmerMessages: React.FC = () => {
  return (
    <div className="h-[calc(100vh-120px)] min-h-[580px] w-full">
      <ChatWorkspace
        currentUserRole="SHOP"
        canModerateAnyMessage={false}
        storageKeyPrefix="farmer_chat"
        sidebarTitle="DANH SÁCH KHÁCH HÀNG"
      />
    </div>
  )
}

export default FarmerMessages
