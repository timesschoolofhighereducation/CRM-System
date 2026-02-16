'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BellOff,
  FileText,
  Eye,
} from 'lucide-react'
import { useApiNotifications, type ApiNotification } from '@/hooks/use-api-notifications'
import { useNotifications } from '@/contexts/notification-context'
import { SafeNotification } from '@/lib/notification-utils'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Notification panel: user-wise notifications from API + web push toggle.
 * Uses same source as sidebar NotificationBell so managed notifications are consistent.
 */
export function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    loading,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useApiNotifications()
  const {
    requestNotificationPermission,
    isNotificationSupported,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
    isPushSubscribed,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const router = useRouter()

  const getNotificationIcon = (notification: ApiNotification) => {
    switch (notification.type) {
      case 'POST_APPROVAL_REQUEST':
        return <Bell className="h-4 w-4 text-yellow-600" />
      case 'POST_APPROVED':
      case 'POST_FULLY_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'POST_REJECTED':
        return <Eye className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'POST_APPROVED':
      case 'POST_FULLY_APPROVED':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
      case 'POST_REJECTED':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'POST_APPROVAL_REQUEST':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const handleNotificationClick = async (notification: ApiNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    if (notification.post?.id) {
      setIsOpen(false)
      router.push(`/posts?postId=${notification.post.id}`)
    }
  }

  const handleMarkAllAsRead = async () => {
    const ok = await markAllAsRead()
    if (ok) {
      toast.success('All notifications marked as read')
    } else {
      toast.error('Failed to mark all as read')
    }
  }

  const handleRequestPermission = async () => {
    await requestNotificationPermission()
  }

  const handlePushToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPushSupported) return
    setIsSubscribing(true)
    try {
      if (isPushSubscribed) {
        await unsubscribeFromPush()
        toast.success('Push notifications disabled')
      } else {
        const granted = await requestNotificationPermission()
        if (granted) {
          const ok = await subscribeToPush()
          if (ok) toast.success('Push notifications enabled')
          else toast.error('Failed to enable push')
        }
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (open) refetch(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 px-2">
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {!isNotificationSupported && (
          <div className="p-4 border-b bg-yellow-50 dark:bg-yellow-950/30">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Browser notifications are not supported in this browser.
            </p>
          </div>
        )}

        {isNotificationSupported && SafeNotification.permission === 'default' && (
          <div className="p-4 border-b bg-blue-50 dark:bg-blue-950/30">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Enable browser notifications to get real-time updates.
            </p>
            <Button variant="outline" size="sm" onClick={handleRequestPermission} className="h-8">
              Enable Notifications
            </Button>
          </div>
        )}

        {isPushSupported && SafeNotification.permission === 'granted' && (
          <div className="p-3 border-b flex items-center justify-between gap-2 bg-muted/50">
            <span className="text-sm">Web push</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePushToggle}
              disabled={isSubscribing}
              className="h-8"
              title={isPushSubscribed ? 'Disable push' : 'Enable push'}
            >
              {isPushSubscribed ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        )}

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4',
                    getNotificationColor(notification.type),
                    !notification.read && 'bg-muted/30'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            'text-sm font-medium',
                            !notification.read && 'font-semibold'
                          )}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {notification.post?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsOpen(false)
                              router.push(`/posts?postId=${notification.post!.id}`)
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
              <span>{unreadCount} unread</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard')
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
