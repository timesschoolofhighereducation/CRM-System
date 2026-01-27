'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PromotionCodesTable } from '@/components/promotion-codes/promotion-codes-table'
import { NewPromotionCodeButton } from '@/components/promotion-codes/new-promotion-code-button'

export default function PromotionCodesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotion Codes</h1>
            <p className="text-gray-600">Manage promotion codes and track promoter payments</p>
          </div>
          <NewPromotionCodeButton />
        </div>

        <PromotionCodesTable />
      </div>
    </DashboardLayout>
  )
}
