'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Phone, CheckSquare, TrendingUp } from 'lucide-react'
import { safeJsonParse } from '@/lib/utils'

export interface DashboardStatsData {
  totalSeekers: { value: number; change: number; changeType: string }
  newThisWeek: { value: number; change: number; changeType: string }
  contactRate: { value: number; change: number; changeType: string }
  pendingTasks: { value: number; change: number; changeType: string }
}

interface DashboardStatsProps {
  /** When provided, stats are controlled by parent (e.g. dashboard page with filters). */
  stats?: DashboardStatsData | null
  loading?: boolean
  error?: string | null
}

export function DashboardStats({ stats: statsProp, loading: loadingProp, error: errorProp }: DashboardStatsProps) {
  const [internalData, setInternalData] = useState<{ stats: DashboardStatsData } | null>(null)
  const [internalLoading, setInternalLoading] = useState(true)

  const isControlled = statsProp !== undefined
  const data = isControlled ? (statsProp ? { stats: statsProp } : null) : internalData
  const loading = isControlled ? (loadingProp ?? false) : internalLoading
  const error = isControlled ? errorProp : null

  useEffect(() => {
    if (isControlled) return
    let cancelled = false
    setInternalLoading(true)
    fetch('/api/dashboard')
      .then((res) => (res.ok ? safeJsonParse(res) : null))
      .then((dashboardData) => {
        if (!cancelled && dashboardData) setInternalData(dashboardData)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInternalLoading(false)
      })
    return () => { cancelled = true }
  }, [isControlled])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2 dark:bg-gray-700" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {error ?? 'Failed to load dashboard statistics'}
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Seekers',
      value: data.stats.totalSeekers.value.toLocaleString(),
      change: data.stats.totalSeekers.change,
      changeType: data.stats.totalSeekers.changeType,
      icon: Users,
    },
    {
      title: 'New This Period',
      value: data.stats.newThisWeek.value.toLocaleString(),
      change: data.stats.newThisWeek.change,
      changeType: data.stats.newThisWeek.changeType,
      icon: TrendingUp,
    },
    {
      title: 'Contact Rate',
      value: `${data.stats.contactRate.value}%`,
      change: data.stats.contactRate.change,
      changeType: data.stats.contactRate.changeType,
      icon: Phone,
    },
    {
      title: 'Pending Tasks',
      value: data.stats.pendingTasks.value.toLocaleString(),
      change: data.stats.pendingTasks.change,
      changeType: data.stats.pendingTasks.changeType,
      icon: CheckSquare,
    },
  ]

  const formatChange = (change: number) => {
    if (change === 0) return '0%'
    const sign = change > 0 ? '+' : ''
    return `${sign}${change}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gray-50/50 border-b border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {stat.title}
            </CardTitle>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <stat.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</div>
            <p
              className={`text-xs font-medium ${
                stat.changeType === 'positive'
                  ? 'text-green-600 dark:text-green-400'
                  : stat.changeType === 'negative'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {formatChange(stat.change)} vs previous period
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
