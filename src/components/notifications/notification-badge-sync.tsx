'use client'

import { useEffect } from 'react'
import { useApiNotifications } from '@/hooks/use-api-notifications'
import { updateNotificationBadge } from '@/lib/favicon-badge'

/**
 * Syncs the browser tab favicon/title badge with the user's API unread notification count.
 * Mount inside authenticated layout so the badge reflects user-wise notifications.
 */
export function NotificationBadgeSync() {
  const { unreadCount } = useApiNotifications()

  useEffect(() => {
    updateNotificationBadge(unreadCount, 'TSHE CRM', 'dot')
  }, [unreadCount])

  return null
}
