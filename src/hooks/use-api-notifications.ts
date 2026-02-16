'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ApiNotification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  post?: {
    id: string
    caption: string
    status: string
  }
}

interface UseApiNotificationsReturn {
  notifications: ApiNotification[]
  unreadCount: number
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
}

/**
 * User-wise notifications from API. Single source of truth for managed notifications.
 * Use for notification center / list so all users see only their own notifications.
 */
export function useApiNotifications(): UseApiNotificationsReturn {
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Refetch when tab becomes visible (e.g. user returns from push notification click)
  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      if (!response.ok) return false
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      return true
    } catch {
      return false
    }
  }, [])

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (!response.ok) return false
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
