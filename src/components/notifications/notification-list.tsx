'use client'

import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useApiNotifications, type ApiNotification } from '@/hooks/use-api-notifications'

interface NotificationListProps {
  onNotificationRead?: () => void
  popoverOpen?: boolean
}

export function NotificationList({ onNotificationRead, popoverOpen }: NotificationListProps) {
  const {
    notifications,
    unreadCount,
    loading,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useApiNotifications()
  const router = useRouter()

  useEffect(() => {
    if (popoverOpen) refetch()
  }, [popoverOpen, refetch])

  const handleMarkAllAsRead = async () => {
    const ok = await markAllAsRead()
    if (ok) {
      toast.success('All notifications marked as read')
      onNotificationRead?.()
    } else {
      toast.error('Failed to mark all as read')
    }
  }

  const handleNotificationClick = async (notification: ApiNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
      onNotificationRead?.()
    }
    if (notification.post?.id) {
      router.push(`/posts?postId=${notification.post.id}`)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'POST_APPROVAL_REQUEST':
        return <Bell className="w-4 h-4 text-yellow-500" />
      case 'POST_APPROVED':
      case 'POST_FULLY_APPROVED':
        return <CheckCheck className="w-4 h-4 text-green-500" />
      case 'POST_REJECTED':
        return <Eye className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-xs text-muted-foreground">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  )
}
