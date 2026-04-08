'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CampaignImage } from '@/components/ui/campaign-image'
import { formatDate } from '@/lib/date-utils'
import {
  Calendar,
  Users,
  Heart,
  MessageCircle,
  Share2,
  MousePointer,
  BarChart3,
} from 'lucide-react'

function formatWatch(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

type CampaignPayload = {
  id: string
  name: string
  description?: string
  status: string
  type: string
  targetAudience: string
  startDate: string
  endDate?: string
  budget?: number
  reach?: number
  imageUrl?: string
  views?: number
  netFollows?: number
  totalWatchTime?: number
  totalInteractions?: number
  reactions?: number
  comments?: number
  shares?: number
  linkClicks?: number
  createdAt: string
  _count?: { seekers: number }
  inquiryAttribution?: { inquiryCount: number; registeredCount: number }
  coordinator?: { id: string; name: string | null; email: string | null } | null
}

function statusClass(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    PAUSED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function CampaignHoverPreview({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<CampaignPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setCampaign(null)
    fetch(`/api/campaigns/${campaignId}`)
      .then(async (res) => {
        if (!res.ok) return null
        return res.json() as Promise<CampaignPayload>
      })
      .then((data) => {
        if (!cancelled && data) setCampaign(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-1">
        <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!campaign) {
    return <p className="text-sm text-muted-foreground p-2">Could not load campaign.</p>
  }

  const inquiries = campaign.inquiryAttribution?.inquiryCount ?? campaign._count?.seekers ?? 0
  const registered = campaign.inquiryAttribution?.registeredCount ?? 0

  return (
    <div className="flex flex-col gap-3 text-sm pr-1">
      <div className="flex gap-3 items-start">
        <CampaignImage imageUrl={campaign.imageUrl} alt={campaign.name} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">{campaign.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge className={statusClass(campaign.status)}>{campaign.status}</Badge>
            <Badge variant="secondary">{campaign.type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Created {formatDate(campaign.createdAt)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Description
        </p>
        <p className="text-sm text-foreground line-clamp-6">{campaign.description || 'No description.'}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/70 px-2 py-1.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" /> Schedule
          </span>
          <p className="font-medium mt-0.5">{formatDate(campaign.startDate)}</p>
          <p className="text-muted-foreground">
            {campaign.endDate ? formatDate(campaign.endDate) : 'No end date'}
          </p>
        </div>
        <div className="rounded-md bg-muted/70 px-2 py-1.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3 shrink-0" /> Audience
          </span>
          <p className="font-medium mt-0.5 line-clamp-3">{campaign.targetAudience}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5 shrink-0" /> Performance
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border bg-background px-2 py-1.5 text-center">
            <div className="text-lg font-semibold tabular-nums">{(campaign.views ?? 0).toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">Views</div>
          </div>
          <div className="rounded-md border bg-background px-2 py-1.5 text-center">
            <div className="text-lg font-semibold tabular-nums">{(campaign.reach ?? 0).toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">Reach</div>
          </div>
          <div className="rounded-md border bg-background px-2 py-1.5 text-center">
            <div className="text-lg font-semibold tabular-nums">{inquiries}</div>
            <div className="text-[10px] text-muted-foreground">In CRM</div>
          </div>
          <div className="rounded-md border bg-background px-2 py-1.5 text-center">
            <div className="text-lg font-semibold tabular-nums">{registered}</div>
            <div className="text-[10px] text-muted-foreground">Registered</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-2">
        <span className="inline-flex items-center gap-0.5">
          <Heart className="h-3 w-3 shrink-0" /> {campaign.reactions ?? 0}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MessageCircle className="h-3 w-3 shrink-0" /> {campaign.comments ?? 0}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Share2 className="h-3 w-3 shrink-0" /> {campaign.shares ?? 0}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MousePointer className="h-3 w-3 shrink-0" /> {campaign.linkClicks ?? 0}
        </span>
        {campaign.totalWatchTime ? <span>Watch {formatWatch(campaign.totalWatchTime)}</span> : null}
        {campaign.netFollows != null && <span>Net follows {campaign.netFollows}</span>}
      </div>

      {campaign.coordinator && (
        <p className="text-xs text-muted-foreground">
          Coordinator:{' '}
          <span className="font-medium text-foreground">
            {campaign.coordinator.name || campaign.coordinator.email}
          </span>
        </p>
      )}
    </div>
  )
}
