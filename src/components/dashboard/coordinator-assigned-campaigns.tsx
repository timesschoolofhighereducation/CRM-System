'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Eye, Users, MousePointerClick, Heart, MessageCircle, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CoordinatorAssignedCampaign {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  status: string
  type: string
  startDate: string
  endDate: string | null
  reach: number | null
  views: number | null
  totalInteractions: number | null
  reactions: number | null
  comments: number | null
  shares: number | null
  linkClicks: number | null
  netFollows: number | null
  seekersCount: number
}

function statusRibbonClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-600 text-white'
    case 'DRAFT':
      return 'bg-slate-500 text-white'
    case 'PAUSED':
      return 'bg-amber-500 text-white'
    case 'COMPLETED':
      return 'bg-sky-600 text-white'
    case 'CANCELLED':
      return 'bg-red-600 text-white'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function formatInt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

interface CoordinatorAssignedCampaignsProps {
  campaigns: CoordinatorAssignedCampaign[]
  loading?: boolean
  className?: string
}

export function CoordinatorAssignedCampaigns({
  campaigns,
  loading,
  className,
}: CoordinatorAssignedCampaignsProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-xl border border-border bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          No campaigns are assigned to you yet. When an admin assigns you to a campaign, it will appear
          here with performance insights.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3', className)}>
      {campaigns.map((c) => (
        <Card key={c.id} className="pt-0 gap-0 shadow-sm hover:shadow-md transition-all duration-200 border-border/70">
          <div className="relative h-28">
            <div className="absolute inset-0 overflow-hidden rounded-t-xl bg-muted">
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <Megaphone className="h-12 w-12 text-muted-foreground/50" aria-hidden />
                </div>
              )}
            </div>
            <div
              className={cn(
                'pointer-events-none absolute right-0 top-0 z-10 translate-x-[32%] -translate-y-1 rotate-45 px-9 py-0.5 text-[9px] font-semibold uppercase tracking-wider shadow-sm',
                statusRibbonClass(c.status)
              )}
              title={c.status.replace(/_/g, ' ')}
            >
              {c.status.replace(/_/g, ' ')}
            </div>
          </div>
          <CardHeader className="px-4 pt-3 pb-1">
            <CardTitle className="text-sm leading-snug line-clamp-2">{c.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                {c.type}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {new Date(c.startDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {c.endDate
                  ? ` – ${new Date(c.endDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Insights
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="rounded-md bg-muted/60 px-2 py-1.5">
                  <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                    <Eye className="h-3 w-3 shrink-0" />
                    Views
                  </div>
                  <div className="font-semibold tabular-nums text-sm">{formatInt(c.views)}</div>
                </div>
                <div className="rounded-md bg-muted/60 px-2 py-1.5">
                  <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                    <Users className="h-3 w-3 shrink-0" />
                    Reach
                  </div>
                  <div className="font-semibold tabular-nums text-sm">{formatInt(c.reach)}</div>
                </div>
                <div className="rounded-md bg-muted/60 px-2 py-1.5">
                  <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                    <MousePointerClick className="h-3 w-3 shrink-0" />
                    Interactions
                  </div>
                  <div className="font-semibold tabular-nums text-sm">{formatInt(c.totalInteractions)}</div>
                </div>
                <div className="rounded-md bg-muted/60 px-2 py-1.5">
                  <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                    <Users className="h-3 w-3 shrink-0" />
                    In CRM
                  </div>
                  <div className="font-semibold tabular-nums text-sm">{c.seekersCount.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-muted-foreground border-t border-border/60 pt-1.5 mt-1.5">
                <span className="inline-flex items-center gap-0.5">
                  <Heart className="h-2.5 w-2.5" />
                  {formatInt(c.reactions)}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <MessageCircle className="h-2.5 w-2.5" />
                  {formatInt(c.comments)}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Share2 className="h-2.5 w-2.5" />
                  {formatInt(c.shares)}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <MousePointerClick className="h-2.5 w-2.5" />
                  {formatInt(c.linkClicks)} clicks
                </span>
                {c.netFollows != null && (
                  <span>Net follows {formatInt(c.netFollows)}</span>
                )}
              </div>
            </div>
            <Link
              href="/campaigns"
              className="inline-flex text-xs font-medium text-primary hover:underline"
            >
              Open campaigns
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
