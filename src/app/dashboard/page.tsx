'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ClientOnly } from '@/components/ui/client-only'
import { useTheme } from '@/lib/theme-provider'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { DashboardFilterBar } from '@/components/dashboard/dashboard-filter-bar'
import type { DashboardFilterState, DashboardPreset } from '@/components/dashboard/dashboard-types'
import { safeJsonParse } from '@/lib/utils'

const DashboardStats = dynamic(
  () => import('@/components/dashboard/dashboard-stats').then((m) => ({ default: m.DashboardStats })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    ),
  }
)
const RecentActivity = dynamic(
  () => import('@/components/dashboard/recent-activity').then((m) => ({ default: m.RecentActivity })),
  { loading: () => <div className="h-64 rounded-lg bg-muted animate-pulse" /> }
)
const UserInquiryAnalytics = dynamic(
  () => import('@/components/dashboard/user-inquiry-analytics').then((m) => ({ default: m.UserInquiryAnalytics })),
  { loading: () => <div className="h-64 rounded-lg bg-muted animate-pulse" /> }
)
const NotificationDemo = dynamic(
  () => import('@/components/notifications/notification-demo').then((m) => ({ default: m.NotificationDemo })),
  { loading: () => <div className="h-48 rounded-lg bg-muted animate-pulse" /> }
)

const DEFAULT_FILTERS: DashboardFilterState = {
  preset: 'this_week',
  dateFrom: null,
  dateTo: null,
  userId: '',
  channel: '',
}

function buildDashboardQuery(filters: DashboardFilterState): string {
  const params = new URLSearchParams()
  params.set('preset', filters.preset)
  if (filters.preset === 'custom' && filters.dateFrom && filters.dateTo) {
    params.set('dateFrom', filters.dateFrom.toISOString().slice(0, 10))
    params.set('dateTo', filters.dateTo.toISOString().slice(0, 10))
  }
  if (filters.userId) params.set('userId', filters.userId)
  if (filters.channel) params.set('channel', filters.channel)
  params.set('limit', '20')
  return params.toString()
}

function DashboardPageContent() {
  const searchParams = useSearchParams()
  const { compactMode } = useTheme()
  const { user, loading: authLoading } = useAuth()

  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_FILTERS)
  const [dashboardData, setDashboardData] = useState<{
    stats: any
    activities: any[]
    userInquiryStats: any[] | null
    users: { id: string; name: string }[]
    isAdmin: boolean
  } | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR' || user?.role === 'DEVELOPER'

  const fetchDashboard = useCallback(
    async (filterState: DashboardFilterState) => {
      setDashboardLoading(true)
      setDashboardError(null)
      try {
        const query = buildDashboardQuery(filterState)
        const res = await fetch(`/api/dashboard?${query}`)
        if (!res.ok) {
          setDashboardError('Failed to load dashboard data')
          setDashboardData(null)
          return
        }
        const data = await safeJsonParse(res)
        setDashboardData({
          stats: data.stats,
          activities: data.activities ?? [],
          userInquiryStats: data.userInquiryStats ?? null,
          users: data.users ?? [],
          isAdmin: data.isAdmin ?? false,
        })
      } catch {
        setDashboardError('Failed to load dashboard data')
        setDashboardData(null)
      } finally {
        setDashboardLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const preset = (searchParams.get('preset') as DashboardPreset) || DEFAULT_FILTERS.preset
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId') ?? ''
    const channel = searchParams.get('channel') ?? ''

    const initial: DashboardFilterState = {
      preset: ['today', 'this_week', 'this_month', 'last_7', 'last_30', 'custom'].includes(preset)
        ? preset
        : 'this_week',
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      userId,
      channel,
    }
    setFilters(initial)
    fetchDashboard(initial)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- init from URL once

  const handleFiltersChange = useCallback(
    (newFilters: DashboardFilterState) => {
      setFilters(newFilters)
      fetchDashboard(newFilters)
      const query = buildDashboardQuery(newFilters)
      const url = query ? `?${query}` : window.location.pathname
      window.history.replaceState(null, '', url)
    },
    [fetchDashboard]
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div
        className={cn(
          'transition-all duration-300',
          compactMode ? 'space-y-4' : 'space-y-6'
        )}
      >
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <h1
            className={cn(
              'font-bold text-gray-900 dark:text-gray-100 mb-1',
              compactMode ? 'text-xl' : 'text-2xl sm:text-3xl'
            )}
          >
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome to your Education CRM dashboard. Use filters for quick analysis.
          </p>
        </div>

        <DashboardFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isAdmin={isAdmin}
          users={dashboardData?.users ?? []}
        />

        <DashboardStats
          stats={dashboardData?.stats ?? null}
          loading={dashboardLoading}
          error={dashboardError}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cn('space-y-6', compactMode ? 'space-y-4' : 'space-y-6', 'lg:col-span-2')}>
            <RecentActivity
              activities={dashboardData?.activities ?? null}
              loading={dashboardLoading}
              error={dashboardError}
            />
            {isAdmin && (
              <UserInquiryAnalytics
                userInquiryStats={dashboardData?.userInquiryStats ?? null}
                loading={dashboardLoading}
                error={dashboardError}
              />
            )}
          </div>
          <div>
            <ClientOnly>
              <NotificationDemo />
            </ClientOnly>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  )
}
