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
  /** NEW_ORDER_OFFER | ORDER_STATUS | DISPATCH_TIMEOUT...; không có = thông báo chung */
  type?: string | null
  /** Id đối tượng liên quan (vd. orderId) */
  referenceId?: number | null
}

export interface AdminSendNotificationRequest {
  title: string
  message: string
  evidence?: string
  receiverTypes: string[]
}
