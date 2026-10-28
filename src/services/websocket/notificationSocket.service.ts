import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getWebSocketUrl, TOKEN_KEY } from '@/services/api.config'
import { STORAGE_KEYS } from '@/utils'
import type { NotificationItem } from '@/services/notification.types'

export type NotificationReceivedCallback = (notification: NotificationItem) => void

class NotificationSocketService {
  private client: Client | null = null
  private isConnected: boolean = false
  private currentUserId: string | number | null = null
  private subscription: StompSubscription | null = null
  private listeners = new Set<NotificationReceivedCallback>()

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
        this.subscribeToNotifications(userId)
        onConnected?.()
      },

      onDisconnect: () => {
        this.isConnected = false
        this.subscription = null
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

  private subscribeToNotifications(userId: string | number): void {
    if (!this.client || !this.isConnected) return

    if (this.subscription) {
      try {
        this.subscription.unsubscribe()
      } catch {
        // ignore
      }
      this.subscription = null
    }

    // Subscribe to destination matching BE: "/queue/notifications.{userId}"
    this.subscription = this.client.subscribe(`/queue/notifications.${userId}`, (message: IMessage) => {
      try {
        const notif: NotificationItem = JSON.parse(message.body)
        this.listeners.forEach((listener) => listener(notif))
      } catch (err) {
        console.error('[WS Notification] Error parsing incoming notification:', err)
      }
    })
  }

  public onNotification(callback: NotificationReceivedCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  public disconnect(): void {
    if (this.subscription) {
      try {
        this.subscription.unsubscribe()
      } catch {
        // ignore
      }
      this.subscription = null
    }
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
