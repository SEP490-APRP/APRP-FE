import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getWebSocketUrl, TOKEN_KEY } from '@/services/api.config'
import { STORAGE_KEYS } from '@/utils'
import type { ChatMessage, ChatMessageRequest, ChatNotification } from '@/types/chat'

export type TypingCallback = (event: { senderId: number; isTyping: boolean }) => void
export type MessageCallback = (message: ChatMessage) => void
export type NotificationCallback = (notification: ChatNotification) => void
export type ConnectionStateCallback = (isConnected: boolean) => void
export type ReadReceiptCallback = (event: { conversationId: number; readBy: number }) => void

class ChatSocketService {
  private client: Client | null = null
  private isConnecting: boolean = false
  private isConnected: boolean = false
  private currentToken: string | null = null

  private messageListeners = new Set<MessageCallback>()
  private notificationListeners = new Set<NotificationCallback>()
  private typingListeners = new Set<TypingCallback>()
  private connectionListeners = new Set<ConnectionStateCallback>()
  private readReceiptListeners = new Set<ReadReceiptCallback>()

  private subscriptions: StompSubscription[] = []

  private getAuthToken(): string | null {
    try {
      return (
        localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.TOKEN)
      )
    } catch {
      return null
    }
  }

  /**
   * Kết nối tới WebSocket Broker qua STOMP / SockJS
   */
  public connect(
    token?: string,
    onConnected?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    const authToken = token || this.getAuthToken()

    // Nếu đang kết nối nhưng đổi user/token mới, buộc phải ngắt kết nối cũ trước
    if (this.isConnected && this.currentToken && authToken && this.currentToken !== authToken) {
      this.disconnect()
    }

    if (this.isConnected) {
      onConnected?.()
      return
    }

    if (this.isConnecting && this.client) {
      return
    }

    const wsUrl = getWebSocketUrl()

    this.isConnecting = true

    const stompClient = new Client({
      webSocketFactory: () => new (SockJS as unknown as { new (url: string): WebSocket })(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},

      onConnect: () => {
        this.isConnecting = false
        this.isConnected = true
        this.currentToken = authToken
        this.notifyConnectionState(true)
        this.setupSubscriptions()
        onConnected?.()
      },

      onDisconnect: () => {
        this.isConnecting = false
        this.isConnected = false
        this.notifyConnectionState(false)
        this.cleanupSubscriptions()
      },

      onStompError: (frame) => {
        this.isConnecting = false
        this.isConnected = false
        this.notifyConnectionState(false)
        console.warn('[WS Chat] STOMP error:', frame.headers['message'])
        onError?.(frame)
      },

      onWebSocketError: (err) => {
        this.isConnecting = false
        this.isConnected = false
        this.notifyConnectionState(false)
        console.warn('[WS Chat] WebSocket error:', err)
        onError?.(err)
      },
    })

    this.client = stompClient
    stompClient.activate()
  }

  /**
   * Ngắt kết nối STOMP client
   */
  public disconnect(): void {
    this.cleanupSubscriptions()
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (err) {
        console.warn('[WS Chat] Error while deactivating client:', err)
      }
      this.client = null
    }
    this.isConnected = false
    this.isConnecting = false
    this.currentToken = null
    this.notifyConnectionState(false)
  }

  public getIsConnected(): boolean {
    return this.isConnected
  }

  /**
   * Đăng ký nhận tin nhắn mới
   */
  public onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback)
    return () => {
      this.messageListeners.delete(callback)
    }
  }

  /**
   * Đăng ký nhận thông báo chat (push notification, count, read receipt)
   */
  public onNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.add(callback)
    return () => {
      this.notificationListeners.delete(callback)
    }
  }

  /**
   * Đăng ký nhận sự kiện typing
   */
  public onTyping(callback: TypingCallback): () => void {
    this.typingListeners.add(callback)
    return () => {
      this.typingListeners.delete(callback)
    }
  }

  /**
   * Đăng ký nhận sự kiện đã đọc (Read Receipt)
   */
  public onReadReceipt(callback: ReadReceiptCallback): () => void {
    this.readReceiptListeners.add(callback)
    return () => {
      this.readReceiptListeners.delete(callback)
    }
  }

  /**
   * Đăng ký lắng nghe trạng thái kết nối
   */
  public onConnectionChange(callback: ConnectionStateCallback): () => void {
    this.connectionListeners.add(callback)
    callback(this.isConnected)
    return () => {
      this.connectionListeners.delete(callback)
    }
  }

  /**
   * Gửi tin nhắn qua STOMP destination: /app/chat.send
   */
  public sendMessage(request: ChatMessageRequest): boolean {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      this.client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(request),
      })
      return true
    } catch (err) {
      console.error('[WS Chat] Failed to publish message:', err)
      return false
    }
  }

  /**
   * Gửi sự kiện typing indicator qua destination: /app/chat.typing
   */
  public sendTyping(receiverId: number, isTyping: boolean): boolean {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      this.client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ receiverId, isTyping }),
      })
      return true
    } catch (err) {
      console.warn('[WS Chat] Failed to publish typing event:', err)
      return false
    }
  }

  /**
   * Gửi sự kiện đánh dấu đã đọc qua destination: /app/chat.read
   */
  public sendRead(conversationId: number): boolean {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      this.client.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({ conversationId }),
      })
      return true
    } catch (err) {
      console.warn('[WS Chat] Failed to publish read receipt:', err)
      return false
    }
  }

  private setupSubscriptions(): void {
    if (!this.client || !this.isConnected) return

    this.cleanupSubscriptions()

    // 1. Subcribe direct messages
    const msgSub = this.client.subscribe('/user/queue/messages', (message: IMessage) => {
      try {
        const payload: ChatMessage = JSON.parse(message.body)
        this.messageListeners.forEach((listener) => listener(payload))
      } catch (e) {
        console.error('[WS Chat] Error parsing incoming message:', e)
      }
    })
    this.subscriptions.push(msgSub)

    // 2. Subcribe push notifications
    const notifSub = this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
      try {
        const payload: ChatNotification = JSON.parse(message.body)
        this.notificationListeners.forEach((listener) => listener(payload))
      } catch (e) {
        console.error('[WS Chat] Error parsing incoming notification:', e)
      }
    })
    this.subscriptions.push(notifSub)

    // 3. Subcribe typing events
    const typingSub = this.client.subscribe('/user/queue/typing', (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body)
        this.typingListeners.forEach((listener) => listener(payload))
      } catch (e) {
        console.error('[WS Chat] Error parsing incoming typing event:', e)
      }
    })
    this.subscriptions.push(typingSub)

    // 4. Subcribe read receipt events
    const readSub = this.client.subscribe('/user/queue/read', (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body)
        this.readReceiptListeners.forEach((listener) => listener(payload))
      } catch (e) {
        console.error('[WS Chat] Error parsing incoming read receipt:', e)
      }
    })
    this.subscriptions.push(readSub)
  }

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach((sub) => {
      try {
        sub.unsubscribe()
      } catch {
        // ignore
      }
    })
    this.subscriptions = []
  }

  private notifyConnectionState(state: boolean): void {
    this.connectionListeners.forEach((listener) => listener(state))
  }
}

export const chatSocketService = new ChatSocketService()
