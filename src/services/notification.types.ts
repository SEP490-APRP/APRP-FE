export interface NotificationItem {
  id: number
  notiId?: number
  title: string
  message: string
  evidence?: string
  targetRole?: string
  receiverType?: string
  receiverTypes?: string[]
  createAt?: string
  createdAt?: string
  isRead?: boolean
  adminId?: number
  adminName?: string
}

export interface AdminSendNotificationRequest {
  title: string
  message: string
  evidence?: string
  receiverTypes: string[]
}
