'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, MessageSquare, Mail, User, CalendarCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { safeJsonParse } from '@/lib/utils'

export interface RecentActivityItem {
  id: string
  type: string
  seekerName: string
  seekerId: string
  outcome: string
  userName: string
  time: string
  channel: string
  notes?: string
}

interface RecentActivityProps {
  /** When provided, activities are controlled by parent (e.g. dashboard page with filters). */
  activities?: RecentActivityItem[] | null
  loading?: boolean
  error?: string | null
}

function getActivityIcon(channel: string) {
  switch (channel.toUpperCase()) {
    case 'CALL':
      return Phone
    case 'WHATSAPP':
      return MessageSquare
    case 'EMAIL':
      return Mail
    case 'WALK_IN':
      return User
    default:
      return CalendarCheck
  }
}

function getActivityColor(channel: string) {
  switch (channel.toUpperCase()) {
    case 'CALL':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'WHATSAPP':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'EMAIL':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'WALK_IN':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

export function RecentActivity({ activities: activitiesProp, loading: loadingProp, error: errorProp }: RecentActivityProps) {
  const [internalActivities, setInternalActivities] = useState<RecentActivityItem[]>([])
  const [internalLoading, setInternalLoading] = useState(true)

  const isControlled = activitiesProp !== undefined
  const activities = isControlled ? (activitiesProp ?? []) : internalActivities
  const loading = isControlled ? (loadingProp ?? false) : internalLoading
  const error = isControlled ? errorProp : null

  useEffect(() => {
    if (isControlled) return
    let cancelled = false
    setInternalLoading(true)
    fetch('/api/dashboard')
      .then((res) => (res.ok ? safeJsonParse(res) : null))
      .then((data: { activities?: RecentActivityItem[] }) => {
        if (!cancelled) setInternalActivities(data?.activities ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInternalLoading(false)
      })
    return () => { cancelled = true }
  }, [isControlled])

  const formatTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse dark:bg-gray-700" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                </div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-sm border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="shadow-sm border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <CalendarCheck className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">No recent activities</p>
            <p className="text-xs text-gray-400">Activity will appear here as interactions are logged</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-gray-50/50 border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.channel)
            const colorClass = getActivityColor(activity.channel)
            return (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className={`p-2.5 rounded-full ${colorClass} shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {activity.seekerName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {activity.outcome} • {activity.userName}
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
                  {formatTime(activity.time)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
