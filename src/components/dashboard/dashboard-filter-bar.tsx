'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, X, User, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DashboardFilterState, DashboardPreset } from './dashboard-types'
import {
  DASHBOARD_PRESET_LABELS,
  DASHBOARD_CHANNEL_OPTIONS,
} from './dashboard-types'

export interface DashboardFilterBarProps {
  filters: DashboardFilterState
  onFiltersChange: (filters: DashboardFilterState) => void
  isAdmin: boolean
  users: { id: string; name: string }[]
  className?: string
}

const PRESET_ORDER: DashboardPreset[] = [
  'today',
  'this_week',
  'this_month',
  'last_7',
  'last_30',
  'custom',
]

export function DashboardFilterBar({
  filters,
  onFiltersChange,
  isAdmin,
  users,
  className,
}: DashboardFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const activeFiltersCount = [
    filters.userId ? 1 : 0,
    filters.channel ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const setPreset = (preset: DashboardPreset) => {
    if (preset === 'custom') {
      onFiltersChange({
        ...filters,
        preset: 'custom',
        dateFrom: filters.dateFrom ?? new Date(),
        dateTo: filters.dateTo ?? new Date(),
      })
      return
    }
    onFiltersChange({
      ...filters,
      preset,
      dateFrom: null,
      dateTo: null,
    })
  }

  const setDateRange = (from: Date | undefined, to: Date | undefined) => {
    onFiltersChange({
      ...filters,
      preset: 'custom',
      dateFrom: from ?? null,
      dateTo: to ?? null,
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      preset: 'this_week',
      dateFrom: null,
      dateTo: null,
      userId: '',
      channel: '',
    })
    setShowFilters(false)
  }

  const isCustomDateRange =
    filters.preset === 'custom' && (filters.dateFrom != null || filters.dateTo != null)
  const hasNonDefaultFilters =
    filters.preset !== 'this_week' ||
    filters.userId !== '' ||
    filters.channel !== '' ||
    isCustomDateRange

  return (
    <Card className={cn('shadow-sm border-gray-200', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Time presets — same pattern as Inquiries quick filters */}
            {PRESET_ORDER.map((preset) => {
              if (preset === 'custom') {
                return (
                  <Popover key={preset}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-9 shadow-sm border-gray-300 hover:bg-gray-50',
                          filters.preset === 'custom' && 'bg-blue-50 border-blue-200'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.preset === 'custom' && filters.dateFrom && filters.dateTo
                          ? `${format(filters.dateFrom, 'MMM dd')} - ${format(filters.dateTo, 'MMM dd')}`
                          : 'Custom'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateFrom ?? undefined}
                        selected={
                          filters.dateFrom && filters.dateTo
                            ? { from: filters.dateFrom, to: filters.dateTo }
                            : undefined
                        }
                        onSelect={(range) =>
                          setDateRange(range?.from, range?.to)
                        }
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )
              }
              return (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 shadow-sm border-gray-300 hover:bg-gray-50',
                    filters.preset === preset && 'bg-blue-50 border-blue-200'
                  )}
                  onClick={() => setPreset(preset)}
                >
                  {DASHBOARD_PRESET_LABELS[preset]}
                </Button>
              )
            })}

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 h-9 shadow-sm border-gray-300 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 border-blue-200">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {hasNonDefaultFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              {isAdmin && users.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>User</span>
                  </label>
                  <Select
                    value={filters.userId || 'all'}
                    onValueChange={(v) =>
                      onFiltersChange({
                        ...filters,
                        userId: v === 'all' ? '' : v,
                      })
                    }
                  >
                    <SelectTrigger className="w-full border-gray-300 shadow-sm">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Channel</span>
                </label>
                <Select
                  value={filters.channel || 'all'}
                  onValueChange={(v) =>
                    onFiltersChange({
                      ...filters,
                      channel: v === 'all' ? '' : v,
                    })
                  }
                >
                  <SelectTrigger className="w-full border-gray-300 shadow-sm">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    {DASHBOARD_CHANNEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {hasNonDefaultFilters && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>Showing data for:</span>
              {filters.preset !== 'custom' && (
                <Badge variant="secondary" className="font-normal">
                  {DASHBOARD_PRESET_LABELS[filters.preset]}
                </Badge>
              )}
              {filters.preset === 'custom' && filters.dateFrom && filters.dateTo && (
                <Badge variant="secondary" className="font-normal">
                  {format(filters.dateFrom, 'MMM dd')} – {format(filters.dateTo, 'MMM dd')}
                </Badge>
              )}
              {filters.userId && (
                <Badge variant="secondary" className="font-normal">
                  User: {users.find((u) => u.id === filters.userId)?.name ?? filters.userId}
                </Badge>
              )}
              {filters.channel && (
                <Badge variant="secondary" className="font-normal">
                  {DASHBOARD_CHANNEL_OPTIONS.find((c) => c.value === filters.channel)?.label ??
                    filters.channel}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
