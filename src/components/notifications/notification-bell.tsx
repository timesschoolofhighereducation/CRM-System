'use client'

import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationList } from './notification-list'
import { useNotifications } from '@/contexts/notification-context'
import { useApiNotifications } from '@/hooks/use-api-notifications'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { isPushSupported, subscribeToPush, unsubscribeFromPush, isPushSubscribed } = useNotifications()
  const { unreadCount, refetch } = useApiNotifications()
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleNotificationRead = () => {
    refetch()
  }

  const handlePushToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPushSupported) return

    setIsSubscribing(true)
    try {
      if (isPushSubscribed) {
        await unsubscribeFromPush()
      } else {
        await subscribeToPush()
      }
    } catch (error) {
      console.error('Error toggling push subscription:', error)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {isPushSupported && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePushToggle}
          disabled={isSubscribing}
          title={isPushSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
          className="h-8 w-8"
        >
          {isPushSubscribed ? (
            <Bell className="h-4 w-4 text-green-600" />
          ) : (
            <BellOff className="h-4 w-4 text-gray-400" />
          )}
        </Button>
      )}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationList
          onNotificationRead={handleNotificationRead}
          popoverOpen={open}
        />
      </PopoverContent>
    </Popover>
    </div>
  )
}

