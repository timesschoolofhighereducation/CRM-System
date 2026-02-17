import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'
import { FollowUpStatus, InteractionChannel } from '@prisma/client'

export type DashboardPreset = 'today' | 'this_week' | 'this_month' | 'last_7' | 'last_30' | 'custom'

function getDateRange(
  preset: DashboardPreset,
  dateFrom?: string,
  dateTo?: string
): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  let start: Date
  let prevStart: Date
  let prevEnd: Date

  if (preset === 'custom' && dateFrom && dateTo) {
    start = new Date(dateFrom)
    start.setHours(0, 0, 0, 0)
    const endDate = new Date(dateTo)
    endDate.setHours(23, 59, 59, 999)
    const spanMs = endDate.getTime() - start.getTime()
    prevEnd = new Date(start.getTime() - 1)
    prevEnd.setHours(23, 59, 59, 999)
    prevStart = new Date(prevEnd.getTime() - spanMs)
    prevStart.setHours(0, 0, 0, 0)
    return { start, end: endDate, prevStart, prevEnd }
  }

  switch (preset) {
    case 'today': {
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
      prevEnd = new Date(start.getTime() - 1)
      prevEnd.setHours(23, 59, 59, 999)
      prevStart = new Date(prevEnd)
      prevStart.setHours(0, 0, 0, 0)
      break
    }
    case 'this_week': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
      prevEnd = new Date(start.getTime() - 1)
      prevEnd.setHours(23, 59, 59, 999)
      prevStart = new Date(prevEnd)
      prevStart.setDate(prevStart.getDate() - 6)
      prevStart.setHours(0, 0, 0, 0)
      break
    }
    case 'this_month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      prevEnd = new Date(start.getTime() - 1)
      prevEnd.setHours(23, 59, 59, 999)
      prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1, 0, 0, 0, 0)
      break
    }
    case 'last_7': {
      start = new Date(now)
      start.setDate(now.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      prevEnd = new Date(start.getTime() - 1)
      prevEnd.setHours(23, 59, 59, 999)
      prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
      prevStart.setHours(0, 0, 0, 0)
      break
    }
    case 'last_30':
    default: {
      start = new Date(now)
      start.setDate(now.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      prevEnd = new Date(start.getTime() - 1)
      prevEnd.setHours(23, 59, 59, 999)
      prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000)
      prevStart.setHours(0, 0, 0, 0)
      break
    }
  }

  return { start, end, prevStart, prevEnd }
}

const VALID_PRESETS: DashboardPreset[] = ['today', 'this_week', 'this_month', 'last_7', 'last_30', 'custom']
const VALID_CHANNELS: InteractionChannel[] = ['CALL', 'WHATSAPP', 'EMAIL', 'WALK_IN']

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const isAdmin = isAdminRole(user.role)

    const { searchParams } = new URL(request.url)
    const presetParam = searchParams.get('preset') ?? searchParams.get('range') ?? 'this_week'
    const preset = VALID_PRESETS.includes(presetParam as DashboardPreset)
      ? (presetParam as DashboardPreset)
      : 'this_week'
    const dateFrom = searchParams.get('dateFrom') ?? undefined
    const dateTo = searchParams.get('dateTo') ?? undefined
    const userIdFilter = searchParams.get('userId') ?? undefined
    const channelParam = searchParams.get('channel') ?? undefined
    const channelFilter = channelParam && VALID_CHANNELS.includes(channelParam as InteractionChannel)
      ? (channelParam as InteractionChannel)
      : undefined
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10', 10), 1), 50)

    const { start, end, prevStart, prevEnd } = getDateRange(preset, dateFrom, dateTo)

    const applyUserId = isAdmin && userIdFilter && userIdFilter.trim() !== ''
    const applyChannel = !!channelFilter

    const seekerWhere: Record<string, unknown> = applyUserId
      ? { createdById: userIdFilter }
      : isAdmin
        ? {}
        : { createdById: user.id }

    const campaignWhere = isAdmin
      ? { isDeleted: false }
      : { createdById: user.id, isDeleted: false }

    const taskWhere: Record<string, unknown> = applyUserId
      ? { assignedTo: userIdFilter }
      : isAdmin
        ? {}
        : { assignedTo: user.id }

    const interactionWhere: Record<string, unknown> = {
      ...(applyUserId ? { userId: userIdFilter } : isAdmin ? {} : { userId: user.id }),
      ...(applyChannel ? { channel: channelFilter } : {}),
    }

    const interactionFilterForSeekers:
      | { userId: string }
      | { channel: InteractionChannel }
      | Record<string, never> = isAdmin
      ? applyUserId
        ? { userId: userIdFilter }
        : applyChannel && channelFilter
          ? { channel: channelFilter }
          : {}
      : { userId: user.id }

    const [
      totalSeekers,
      newSeekersThisPeriod,
      newSeekersPrevPeriod,
      _totalInteractions,
      totalSeekersWithInteractions,
      pendingTasks,
      completedTasksThisPeriod,
      totalCampaigns,
      activeCampaigns,
      recentInteractions,
      completedTasksPrevPeriod,
      _pendingTasksPrevPeriod,
    ] = await Promise.all([
      prisma.seeker.count({ where: seekerWhere }),

      prisma.seeker.count({
        where: {
          ...seekerWhere,
          createdAt: { gte: start, lte: end },
        },
      }),

      prisma.seeker.count({
        where: {
          ...seekerWhere,
          createdAt: { gte: prevStart, lte: prevEnd },
        },
      }),

      prisma.interaction.count({
        where: {
          ...interactionWhere,
          createdAt: { gte: start, lte: end },
        },
      }),

      prisma.seeker.count({
        where: {
          ...seekerWhere,
          interactions: {
            some: Object.keys(interactionFilterForSeekers).length
              ? { ...interactionFilterForSeekers, createdAt: { gte: start, lte: end } }
              : { createdAt: { gte: start, lte: end } },
          },
        },
      }),

      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: {
            in: [FollowUpStatus.OPEN, FollowUpStatus.TODO, FollowUpStatus.IN_PROGRESS, FollowUpStatus.OVERDUE],
          },
        },
      }),

      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: { in: [FollowUpStatus.DONE, FollowUpStatus.COMPLETED] },
          updatedAt: { gte: start, lte: end },
        },
      }),

      prisma.campaign.count({ where: campaignWhere }),

      prisma.campaign.count({
        where: { ...campaignWhere, status: 'ACTIVE' },
      }),

      prisma.interaction.findMany({
        where: {
          ...interactionWhere,
          createdAt: { gte: start, lte: end },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seeker: { select: { id: true, fullName: true, phone: true } },
          user: { select: { id: true, name: true } },
        },
      }),

      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: { in: [FollowUpStatus.DONE, FollowUpStatus.COMPLETED] },
          updatedAt: { gte: prevStart, lte: prevEnd },
        },
      }),

      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: {
            in: [FollowUpStatus.OPEN, FollowUpStatus.TODO, FollowUpStatus.IN_PROGRESS, FollowUpStatus.OVERDUE],
          },
        },
      }),
    ])

    const contactRate =
      totalSeekers > 0 ? Math.round((totalSeekersWithInteractions / totalSeekers) * 100) : 0
    const seekersWithInteractionsPrev = await prisma.seeker.count({
      where: {
        ...seekerWhere,
        interactions: {
          some: Object.keys(interactionFilterForSeekers).length
            ? {
                ...interactionFilterForSeekers,
                createdAt: { gte: prevStart, lte: prevEnd },
              }
            : { createdAt: { gte: prevStart, lte: prevEnd } },
        },
      },
    })
    const totalSeekersPrev = await prisma.seeker.count({ where: seekerWhere })
    const contactRatePrev =
      totalSeekersPrev > 0 ? Math.round((seekersWithInteractionsPrev / totalSeekersPrev) * 100) : 0
    const contactRateChange = contactRate - contactRatePrev

    const newSeekersChange =
      newSeekersPrevPeriod > 0
        ? Math.round(((newSeekersThisPeriod - newSeekersPrevPeriod) / newSeekersPrevPeriod) * 100)
        : newSeekersThisPeriod > 0
          ? 100
          : 0

    const tasksChange =
      completedTasksPrevPeriod > 0
        ? Math.round(
            ((completedTasksThisPeriod - completedTasksPrevPeriod) / completedTasksPrevPeriod) * 100
          )
        : completedTasksThisPeriod > 0
          ? 100
          : 0

    const stats = {
      totalSeekers: {
        value: totalSeekers,
        change: 0,
        changeType: 'neutral' as const,
      },
      newThisWeek: {
        value: newSeekersThisPeriod,
        change: newSeekersChange,
        changeType: (newSeekersChange >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      },
      contactRate: {
        value: contactRate,
        change: contactRateChange,
        changeType: (contactRateChange >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      },
      pendingTasks: {
        value: pendingTasks,
        change: tasksChange,
        changeType: (tasksChange >= 0 ? 'negative' : 'positive') as 'positive' | 'negative',
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
      },
    }

    const activities = recentInteractions.map((interaction) => {
      let outcomeText = interaction.outcome.replace(/_/g, ' ')
      outcomeText = outcomeText.charAt(0) + outcomeText.slice(1).toLowerCase()
      return {
        id: interaction.id,
        type: interaction.channel.toLowerCase(),
        seekerName: interaction.seeker.fullName,
        seekerId: interaction.seeker.id,
        outcome: outcomeText,
        userName: interaction.user.name,
        time: interaction.createdAt,
        channel: interaction.channel,
        notes: interaction.notes,
      }
    })

    let userInquiryStats: any[] | null = null
    let users: { id: string; name: string }[] = []

    const now = new Date()
    if (isAdmin) {
      const usersList = await prisma.user.findMany({
        where: { isActive: true, role: { not: 'SYSTEM' } },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      })

      users = usersList.map((u) => ({ id: u.id, name: u.name }))

      const userInquiryCounts = await Promise.all(
        usersList.map(async (u) => {
          if (applyUserId && u.id !== userIdFilter) {
            return {
              userId: u.id,
              userName: u.name,
              userEmail: u.email,
              userRole: u.role,
              totalInquiries: 0,
              thisWeekInquiries: 0,
              thisMonthInquiries: 0,
            }
          }
          const totalInquiries = await prisma.seeker.count({ where: { createdById: u.id } })
          const thisPeriodInquiries = await prisma.seeker.count({
            where: { createdById: u.id, createdAt: { gte: start, lte: end } },
          })
          const thisMonthInquiries = await prisma.seeker.count({
            where: {
              createdById: u.id,
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), 1),
                lte: end,
              },
            },
          })
          return {
            userId: u.id,
            userName: u.name,
            userEmail: u.email,
            userRole: u.role,
            totalInquiries,
            thisWeekInquiries: thisPeriodInquiries,
            thisMonthInquiries: thisMonthInquiries,
          }
        })
      )
      userInquiryStats = userInquiryCounts
    }

    return NextResponse.json({
      stats,
      activities,
      userInquiryStats,
      isAdmin,
      users,
      filterMeta: {
        preset,
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
        prevFrom: prevStart.toISOString(),
        prevTo: prevEnd.toISOString(),
      },
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
