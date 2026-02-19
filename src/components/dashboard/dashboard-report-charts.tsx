'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { safeJsonParse } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface ReportChartsData {
  sourcePerformance: Array<{ source: string; count: number; conversionRate: number }>
  monthlyTrends: Array<{ month: string; newSeekers: number; conversions: number }>
}

export function DashboardReportCharts() {
  const [data, setData] = useState<ReportChartsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true)
        const response = await fetch('/api/reports')
        if (response.ok) {
          const reportData = await safeJsonParse(response)
          setData({
            sourcePerformance: reportData.sourcePerformance ?? [],
            monthlyTrends: reportData.monthlyTrends ?? [],
          })
        }
      } catch {
        // Silently fail - charts will show empty
      } finally {
        setLoading(false)
      }
    }
    fetchReportData()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="h-[350px] rounded-lg bg-muted animate-pulse" />
        <div className="h-[350px] rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Performance Overview */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Performance Overview
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Monthly acquisition and conversion trends
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthlyTrends}>
              <defs>
                <linearGradient id="colorSeekersDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConversionsDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
              <YAxis tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="newSeekers"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSeekersDash)"
                strokeWidth={2}
                name="New Inquiries"
              />
              <Area
                type="monotone"
                dataKey="conversions"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorConversionsDash)"
                strokeWidth={2}
                name="Conversions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion by Source */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Conversion by Source
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Conversion rates per source
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.sourcePerformance}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="count"
                label={(props: { payload?: { source?: string }; percent?: number }) => {
                  const source = props?.payload?.source ?? ''
                  const percent = typeof props?.percent === 'number' ? props.percent : 0
                  return `${source}: ${(percent * 100).toFixed(0)}%`
                }}
              >
                {data.sourcePerformance.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {data.sourcePerformance.map((item, index) => (
              <div
                key={item.source}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{item.source}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.count} leads</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
