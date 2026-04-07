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
          <CardContent className="px-4 pb-4 space-y-2">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Insights
              </p>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-background to-transparent z-10" />
                <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <Eye className="h-2.5 w-2.5" /> Views {formatInt(c.views)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <Users className="h-2.5 w-2.5" /> Reach {formatInt(c.reach)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <MousePointerClick className="h-2.5 w-2.5" /> Interactions {formatInt(c.totalInteractions)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <Users className="h-2.5 w-2.5" /> In CRM {c.seekersCount.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <Heart className="h-2.5 w-2.5" /> {formatInt(c.reactions)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <MessageCircle className="h-2.5 w-2.5" /> {formatInt(c.comments)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <Share2 className="h-2.5 w-2.5" /> {formatInt(c.shares)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                  <MousePointerClick className="h-2.5 w-2.5" /> Clicks {formatInt(c.linkClicks)}
                </span>
                {c.netFollows != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px]">
                    Net follows {formatInt(c.netFollows)}
                  </span>
                )}
              </div>
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
