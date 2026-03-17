import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const DatabaseBackupDashboard = dynamic(
  () => import('@/components/admin/database-backup-dashboard').then(m => ({ default: m.DatabaseBackupDashboard })),
  { loading: () => <div className="space-y-4 p-4"><div className="h-10 w-48 bg-muted rounded animate-pulse" /><div className="h-64 bg-muted rounded animate-pulse" /></div> }
)

export default function DatabaseBackupPage() {
  return (
    <DashboardLayout>
      <DatabaseBackupDashboard />
    </DashboardLayout>
  )
}
