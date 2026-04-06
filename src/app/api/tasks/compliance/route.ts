import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthenticationError, isAdminRole, requireAuth } from '@/lib/auth'

const DEFAULT_BREACH_THRESHOLD_HOURS = 48
const ACTIVE_STATUSES = ['OPEN', 'TODO', 'IN_PROGRESS', 'ON_HOLD', 'OVERDUE']

type InquiryComplianceItem = {
  seekerId: string
  seekerName: string
  seekerPhone: string
  stage: string
  marketingSource: string
  openTaskCount: number
  latestTaskStatus: string
  latestTaskDueAt: string | null
  lastFollowedAt: string
  hoursSinceLastFollowUp: number
  isBreach: boolean
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const thresholdInput = Number(searchParams.get('hours') || DEFAULT_BREACH_THRESHOLD_HOURS)
    const breachThresholdHours = Number.isFinite(thresholdInput) && thresholdInput > 0
      ? thresholdInput
      : DEFAULT_BREACH_THRESHOLD_HOURS

    const now = new Date()

    const coordinators = await prisma.user.findMany({
      where: {
        role: 'COORDINATOR',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    const tasks = await prisma.followUpTask.findMany({
      where: {
        status: {
          in: ACTIVE_STATUSES as any[],
        },
      },
      select: {
        id: true,
        seekerId: true,
        assignedTo: true,
        dueAt: true,
        status: true,
        updatedAt: true,
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            stage: true,
            marketingSource: true,
          },
        },
        actionHistory: {
          select: {
            actionAt: true,
          },
          orderBy: {
            actionAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: [
        { assignedTo: 'asc' },
        { seekerId: 'asc' },
        { dueAt: 'asc' },
      ],
    })

    const tasksByCoordinatorAndSeeker = new Map<string, typeof tasks>()
    for (const task of tasks) {
      const key = `${task.assignedTo}:${task.seekerId}`
      const current = tasksByCoordinatorAndSeeker.get(key) || []
      current.push(task)
      tasksByCoordinatorAndSeeker.set(key, current)
    }

    const coordinatorItems = coordinators.map((coordinator) => {
      const inquiries: InquiryComplianceItem[] = []

      for (const [key, groupedTasks] of tasksByCoordinatorAndSeeker.entries()) {
        const [assignedTo] = key.split(':')
        if (assignedTo !== coordinator.id) continue

        const firstTask = groupedTasks[0]
        if (!firstTask?.seeker) continue

        let lastFollowedAt = firstTask.updatedAt
        for (const task of groupedTasks) {
          if (task.updatedAt > lastFollowedAt) {
            lastFollowedAt = task.updatedAt
          }
          const latestAction = task.actionHistory[0]?.actionAt
          if (latestAction && latestAction > lastFollowedAt) {
            lastFollowedAt = latestAction
          }
        }

        const latestTask = groupedTasks.reduce((latest, current) =>
          current.updatedAt > latest.updatedAt ? current : latest
        )
        const latestDue = groupedTasks.reduce((latest, current) =>
          current.dueAt > latest.dueAt ? current : latest
        )

        const hoursSinceLastFollowUp = (now.getTime() - lastFollowedAt.getTime()) / (1000 * 60 * 60)
        const isBreach = hoursSinceLastFollowUp >= breachThresholdHours

        inquiries.push({
          seekerId: firstTask.seeker.id,
          seekerName: firstTask.seeker.fullName,
          seekerPhone: firstTask.seeker.phone,
          stage: firstTask.seeker.stage,
          marketingSource: firstTask.seeker.marketingSource,
          openTaskCount: groupedTasks.length,
          latestTaskStatus: latestTask.status,
          latestTaskDueAt: latestDue.dueAt ? latestDue.dueAt.toISOString() : null,
          lastFollowedAt: lastFollowedAt.toISOString(),
          hoursSinceLastFollowUp: Math.round(hoursSinceLastFollowUp * 10) / 10,
          isBreach,
        })
      }

      inquiries.sort((a, b) => b.hoursSinceLastFollowUp - a.hoursSinceLastFollowUp)

      const breachCount = inquiries.filter((inquiry) => inquiry.isBreach).length
      const activeInquiryCount = inquiries.length
      const complianceRate = activeInquiryCount > 0
        ? Math.round(((activeInquiryCount - breachCount) / activeInquiryCount) * 1000) / 10
        : 100
      const lastActivity = inquiries.length > 0
        ? inquiries.reduce((latest, item) =>
          new Date(item.lastFollowedAt) > new Date(latest.lastFollowedAt) ? item : latest
        )
        : null

      return {
        coordinatorId: coordinator.id,
        coordinatorName: coordinator.name,
        coordinatorEmail: coordinator.email,
        activeInquiryCount,
        breachCount,
        complianceRate,
        lastActivityAt: lastActivity?.lastFollowedAt || null,
        inquiries,
      }
    })

    const totalActiveInquiries = coordinatorItems.reduce((sum, item) => sum + item.activeInquiryCount, 0)
    const totalBreaches = coordinatorItems.reduce((sum, item) => sum + item.breachCount, 0)

    return NextResponse.json({
      generatedAt: now.toISOString(),
      breachThresholdHours,
      summary: {
        coordinatorCount: coordinatorItems.length,
        totalActiveInquiries,
        totalBreaches,
        overallComplianceRate: totalActiveInquiries > 0
          ? Math.round(((totalActiveInquiries - totalBreaches) / totalActiveInquiries) * 1000) / 10
          : 100,
      },
      coordinators: coordinatorItems,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error computing follow-up compliance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compute follow-up compliance' },
      { status: 500 }
    )
  }
}
