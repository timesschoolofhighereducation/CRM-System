'use client'

// Client-side push notification utilities
// Handles service worker registration and push subscription

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushNotificationClient {
  private static serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private static vapidPublicKey: string | null = null

  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  /**
   * Get VAPID public key from server
   */
  static async getVapidPublicKey(): Promise<string | null> {
    if (this.vapidPublicKey) return this.vapidPublicKey

    try {
      const response = await fetch('/api/push/vapid-public-key')
      if (response.ok) {
        const data = await response.json()
        this.vapidPublicKey = data.publicKey
        return this.vapidPublicKey
      }
    } catch (error) {
      console.error('Error fetching VAPID public key:', error)
    }
    return null
  }

  /**
   * Register service worker
   */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported')
      return null
    }

    if (this.serviceWorkerRegistration) {
      return this.serviceWorkerRegistration
    }

    try {
      // Check if service worker file is accessible
      const swResponse = await fetch('/sw.js', { method: 'HEAD' })
      if (!swResponse.ok) {
        console.error('Service worker file not accessible:', swResponse.status)
        return null
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })

      console.log('Service Worker: Registration initiated')

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      this.serviceWorkerRegistration = registration
      console.log('Service Worker: Registered and ready')
      return registration
    } catch (error) {
      console.error('Error registering service worker:', error)
      // Provide more helpful error message
      if (error instanceof Error) {
        if (error.message.includes('redirect')) {
          console.error('Service worker registration failed due to redirect. Check Next.js configuration.')
        } else if (error.message.includes('SecurityError')) {
          console.error('Service worker registration blocked by browser security. HTTPS required in production.')
        }
      }
      return null
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported')
      return null
    }

    // Register service worker
    const registration = await this.registerServiceWorker()
    if (!registration) {
      console.error('Failed to register service worker')
      return null
    }

    // Request permission
    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return null
    }

    // Get VAPID public key
    const publicKey = await this.getVapidPublicKey()
    if (!publicKey) {
      console.error('VAPID public key not available')
      return null
    }

    try {
      // Convert VAPID key from base64 to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(publicKey)

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      })

      // Extract subscription data
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }

      return subscriptionData
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return null
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(): Promise<boolean> {
    const registration = await this.registerServiceWorker()
    if (!registration) {
      return false
    }

    try {
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        return true
      }
      return false
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }

  /**
   * Get current subscription
   */
  static async getSubscription(): Promise<PushSubscriptionData | null> {
    const registration = await this.registerServiceWorker()
    if (!registration) {
      return null
    }

    try {
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        return null
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }
    } catch (error) {
      console.error('Error getting subscription:', error)
      return null
    }
  }

  /**
   * Convert base64 URL to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  /**
   * Save subscription to server
   */
  static async saveSubscription(subscription: PushSubscriptionData): Promise<boolean> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: navigator.userAgent
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error saving subscription:', error)
      return false
    }
  }

  /**
   * Remove subscription from server
   */
  static async removeSubscription(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint })
      })

      return response.ok
    } catch (error) {
      console.error('Error removing subscription:', error)
      return false
    }
  }

  /**
   * Complete subscription flow: subscribe and save to server
   */
  static async subscribeAndSave(): Promise<boolean> {
    const subscription = await this.subscribe()
    if (!subscription) {
      return false
    }

    return await this.saveSubscription(subscription)
  }

  /**
   * Complete unsubscribe flow: unsubscribe and remove from server
   */
  static async unsubscribeAndRemove(): Promise<boolean> {
    const subscription = await this.getSubscription()
    if (!subscription) {
      return true // Already unsubscribed
    }

    const removedFromServer = await this.removeSubscription(subscription.endpoint)
    const unsubscribed = await this.unsubscribe()

    return removedFromServer && unsubscribed
  }
}

