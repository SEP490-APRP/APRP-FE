import React from 'react'
import { ChatWorkspace } from '@/components/chat/core'

const AdminMessages: React.FC = () => {
  return (
    <div className="h-full flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <ChatWorkspace
        currentUserRole="ADMIN"
        canModerateAnyMessage={true}
        storageKeyPrefix="admin_chat"
        sidebarTitle="HỘI THOẠI HỆ THỐNG"
        className="h-full flex-1 flex min-h-0 overflow-hidden bg-white rounded-none border-0 shadow-none"
      />
    </div>
  )
}

export default AdminMessages
