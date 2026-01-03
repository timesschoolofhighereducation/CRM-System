import { prisma } from '@/lib/prisma'

// Server-side only import - web-push cannot be used on client
// Use dynamic import to avoid client-side bundling
let webpush: typeof import('web-push') | null = null

async function getWebPush() {
  if (typeof window !== 'undefined') {
    return null
  }
  
  if (!webpush) {
    try {
      webpush = await import('web-push')
    } catch (error) {
      console.warn('web-push not available:', error)
      return null
    }
  }
  
  return webpush
}

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || `mailto:${process.env.NEXT_PUBLIC_APP_EMAIL || 'admin@example.com'}`

// Initialize VAPID details (async, called when needed)
async function initializeVapid() {
  if (typeof window !== 'undefined') return
  
  const wp = await getWebPush()
  if (wp && vapidPublicKey && vapidPrivateKey) {
    wp.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    )
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  url?: string
  notificationId?: string
  type?: string
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  data?: Record<string, any>
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  if (typeof window !== 'undefined') {
    console.warn('sendPushNotification should only be called on the server')
    return { success: 0, failed: 0 }
  }

  const wp = await getWebPush()
  if (!wp) {
    console.warn('web-push not available (not installed or error loading)')
    return { success: 0, failed: 0 }
  }

  // Initialize VAPID if not already done
  if (vapidPublicKey && vapidPrivateKey) {
    await initializeVapid()
  } else {
    console.warn('Cannot send push notification: VAPID keys not configured')
    return { success: 0, failed: 0 }
  }

  // Get all active push subscriptions for the user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId,
      isActive: true
    }
  })

  if (subscriptions.length === 0) {
    return { success: 0, failed: 0 }
  }

  let successCount = 0
  let failedCount = 0

  // Prepare notification payload
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/fav.png',
    badge: payload.badge || '/fav.png',
    image: payload.image,
    tag: payload.tag || `notification-${Date.now()}`,
    url: payload.url || '/',
    notificationId: payload.notificationId,
    type: payload.type || 'info',
    requireInteraction: payload.requireInteraction || false,
    silent: payload.silent || false,
    vibrate: payload.vibrate || [200, 100, 200],
    data: payload.data || {}
  })

  // Send to all subscriptions
  const sendPromises = subscriptions.map(async (subscription) => {
    try {
      await wp.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: (subscription.keys as any).p256dh,
            auth: (subscription.keys as any).auth
          }
        },
        notificationPayload
      )
      successCount++
    } catch (error: any) {
      console.error('Error sending push notification:', error)
      
      // If subscription is invalid, mark it as inactive
      if (error.statusCode === 410 || error.statusCode === 404) {
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false }
        })
      }
      
      failedCount++
    }
  })

  await Promise.allSettled(sendPromises)

  return { success: successCount, failed: failedCount }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const results = await Promise.all(
    userIds.map(userId => sendPushNotification(userId, payload))
  )

  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0)
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)

  return { success: totalSuccess, failed: totalFailed }
}

