export interface ChatMessage {
  id: string | number
  conversationId?: number
  senderId: number
  senderName?: string
  senderAvatar?: string
  receiverId?: number
  content: string
  type?: 'TEXT' | 'IMAGE' | 'PRODUCT' | 'ORDER' | string
  attachmentUrl?: string
  referenceId?: number
  createdAt?: string
  sentAt?: string
  isRead?: boolean
}

export interface Conversation {
  id: string | number
  roomKey?: string
  otherUserId: number
  otherUserName: string
  otherUserRole?: string
  otherUserAvatar?: string
  lastMessage?: string
  lastMessageTime?: string
  lastMessageAt?: string
  unreadCount?: number
}

export interface ChatMessageRequest {
  receiverId: number
  content?: string
  type?: string
  attachmentUrl?: string
  referenceId?: number
}

export interface ChatNotification {
  type: 'NEW_MESSAGE' | 'READ_RECEIPT' | 'UNREAD_COUNT' | 'DELETE_MESSAGE' | string
  conversationId: number
  senderId?: number
  senderName?: string
  content?: string
  unreadCount?: number
  messageId?: number
  conversationUnread?: number
  newLastMessage?: string
  newLastMessageTime?: string
}
