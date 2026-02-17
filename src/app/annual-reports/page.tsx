import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const AnnualReportsDashboard = dynamic(
  () => import('@/components/admin/annual-reports-dashboard').then(m => ({ default: m.AnnualReportsDashboard })),
  { loading: () => <div className="space-y-4"><div className="h-10 w-48 bg-muted rounded animate-pulse" /><div className="h-64 bg-muted rounded animate-pulse" /></div> }
)

export default function AnnualReportsPage() {
  return (
    <DashboardLayout>
      <AnnualReportsDashboard />
    </DashboardLayout>
  )
}
