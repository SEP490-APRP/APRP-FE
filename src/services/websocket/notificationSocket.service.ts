import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getWebSocketUrl, TOKEN_KEY } from '@/services/api.config'
import { STORAGE_KEYS } from '@/utils'
import type { NotificationItem } from '@/services/notification.types'

export type NotificationReceivedCallback = (notification: NotificationItem) => void

/**
 * Tin nhắn điều phối gửi riêng cho Shipper qua /user/queue/shipper-offers.
 * NEW_ORDER: có đơn mới gần bạn. ORDER_TAKEN: đơn đã có người nhận, gỡ khỏi danh sách.
 */
export interface ShipperOfferMessage {
  type: 'NEW_ORDER' | 'ORDER_TAKEN'
  orderId: number
  shopName?: string
  shopAddress?: string
  shippingAddress?: string
  distanceToShopKm?: number | null
  distanceKm?: number | null
  shippingFee?: number
  totalAmount?: number
  paymentMethod?: string
  /** Số tiền phải ký quỹ nếu là đơn COD */
  codAmount?: number
  wave?: number
}

export type ShipperOfferCallback = (offer: ShipperOfferMessage) => void

class NotificationSocketService {
  private client: Client | null = null
  private isConnected: boolean = false
  private currentUserId: string | number | null = null
  private subscriptions: StompSubscription[] = []
  private listeners = new Set<NotificationReceivedCallback>()
  private offerListeners = new Set<ShipperOfferCallback>()

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

  public connect(
    userId: string | number,
    token?: string,
    onConnected?: () => void,
    onError?: (err: unknown) => void,
  ): void {
    const authToken = token || this.getAuthToken()

    if (this.isConnected && this.currentUserId === userId) {
      onConnected?.()
      return
    }

    if (this.isConnected) {
      this.disconnect()
    }

    this.currentUserId = userId
    const wsUrl = getWebSocketUrl()

    const stompClient = new Client({
      webSocketFactory: () => new (SockJS as unknown as { new (url: string): WebSocket })(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},

      onConnect: () => {
        this.isConnected = true
        console.log('[WS Notification] Connected successfully for user ID:', userId)
        this.subscribeToNotifications(userId)
        onConnected?.()
      },

      onDisconnect: () => {
        this.isConnected = false
        this.cleanupSubscriptions()
      },

      onStompError: (frame) => {
        this.isConnected = false
        console.warn('[WS Notification] STOMP error:', frame.headers['message'])
        onError?.(frame)
      },

      onWebSocketError: (err) => {
        this.isConnected = false
        console.warn('[WS Notification] WebSocket error:', err)
        onError?.(err)
      },
    })

    this.client = stompClient
    stompClient.activate()
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

  private subscribeToNotifications(userId: string | number): void {
    if (!this.client || !this.isConnected) return

    this.cleanupSubscriptions()

    const handleMessage = (message: IMessage) => {
      try {
        const raw = JSON.parse(message.body)
        // Lọc bỏ các payload sự kiện của Chat (NEW_MESSAGE, UNREAD_COUNT) hoặc payload thiếu title & message
        if (
          !raw ||
          raw.type === 'NEW_MESSAGE' ||
          raw.type === 'UNREAD_COUNT' ||
          (!raw.title && !raw.message)
        ) {
          return
        }

        const notif: NotificationItem = raw
        console.log('[WS Notification] 🔔 Received real-time notification:', notif)
        this.listeners.forEach((listener) => listener(notif))
      } catch (err) {
        console.error('[WS Notification] Error parsing incoming notification:', err)
      }
    }

    // Kênh điều phối đơn cho Shipper (user khác không nhận được gì trên kênh này)
    try {
      const subOffers = this.client.subscribe('/user/queue/shipper-offers', (message: IMessage) => {
        try {
          const offer = JSON.parse(message.body) as ShipperOfferMessage
          if (offer?.orderId) this.offerListeners.forEach((listener) => listener(offer))
        } catch (err) {
          console.error('[WS Notification] Error parsing shipper offer:', err)
        }
      })
      this.subscriptions.push(subOffers)
    } catch (e) {
      console.warn('[WS Notification] Failed to subscribe to shipper offers:', e)
    }

    // 1. Kênh public queue theo userId: /queue/notifications.{userId}
    try {
      const subDirect = this.client.subscribe(`/queue/notifications.${userId}`, handleMessage)
      this.subscriptions.push(subDirect)
    } catch (e) {
      console.warn('[WS Notification] Failed to subscribe to direct user queue:', e)
    }

    // 2. Kênh private STOMP user queue: /user/queue/notifications
    try {
      const subUser = this.client.subscribe('/user/queue/notifications', handleMessage)
      this.subscriptions.push(subUser)
    } catch (e) {
      console.warn('[WS Notification] Failed to subscribe to STOMP user queue:', e)
    }
  }

  public onNotification(callback: NotificationReceivedCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /** Nghe đơn mới / đơn đã có người nhận (chỉ Shipper). Trả về hàm huỷ đăng ký */
  public onShipperOffer(callback: ShipperOfferCallback): () => void {
    this.offerListeners.add(callback)
    return () => {
      this.offerListeners.delete(callback)
    }
  }

  public disconnect(): void {
    this.cleanupSubscriptions()
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (err) {
        console.warn('[WS Notification] Error deactivating client:', err)
      }
      this.client = null
    }
    this.isConnected = false
    this.currentUserId = null
  }
}

export const notificationSocketService = new NotificationSocketService()
