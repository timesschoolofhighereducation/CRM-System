import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const ActivityLogsDashboard = dynamic(
  () => import('@/components/admin/activity-logs-dashboard').then(m => ({ default: m.ActivityLogsDashboard })),
  { loading: () => <div className="space-y-4"><div className="h-10 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded animate-pulse" /></div> }
)

export default function ActivityLogsPage() {
  return (
    <DashboardLayout>
      <ActivityLogsDashboard />
    </DashboardLayout>
  )
}
