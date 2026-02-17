/** Dashboard API preset; must match backend DashboardPreset */
export type DashboardPreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_7' | 'last_30' | 'custom'

export interface DashboardFilterState {
  preset: DashboardPreset
  dateFrom: Date | null
  dateTo: Date | null
  userId: string
  campaignId: string
}

export const DASHBOARD_PRESET_LABELS: Record<DashboardPreset, string> = {
  all: 'All',
  today: 'Today',
  this_week: 'This week',
  this_month: 'This month',
  last_7: 'Last 7 days',
  last_30: 'Last 30 days',
  custom: 'Custom',
}
