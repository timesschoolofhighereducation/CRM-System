/**
 * Seeker Status Service
 * 
 * Single source of truth for seeker status management.
 * Handles task automation, status transitions, and business rules.
 * 
 * Status Flow:
 * - PENDING: Initial state, tasks can be created
 * - IN_PROGRESS: Active work, tasks can be created
 * - REGISTERED: Final state, auto-complete tasks, block new tasks (GREEN)
 * - NOT_INTERESTED: Final state, auto-complete tasks, block new tasks (RED)
 * - COMPLETED: Final state, auto-complete tasks, block new tasks
 */

import { prisma } from '@/lib/prisma'
import { SeekerStage } from '@prisma/client'

/**
 * Final statuses that trigger task completion and prevent new task creation
 */
export const FINAL_STATUSES = [
  'REGISTERED',
  'NOT_INTERESTED',
  'COMPLETED',
] as const

/**
 * Legacy status mapping for backward compatibility
 */
const LEGACY_STATUS_MAP: Record<string, string> = {
  'NEW': 'NEW',
  'ATTEMPTING_CONTACT': 'ATTEMPTING_CONTACT',
  'CONNECTED': 'CONNECTED',
  'QUALIFIED': 'QUALIFIED',
  'COUNSELING_SCHEDULED': 'COUNSELING_SCHEDULED',
  'CONSIDERING': 'CONSIDERING',
  'READY_TO_REGISTER': 'READY_TO_REGISTER',
  'LOST': 'LOST',
}

/**
 * Check if a status is final (blocks task creation, auto-completes tasks)
 */
export function isFinalStatus(status: SeekerStage | string): boolean {
  // Map legacy statuses
  const mappedStatus = LEGACY_STATUS_MAP[status] || status
  return FINAL_STATUSES.includes(mappedStatus as any)
}

/**
 * Check if tasks can be created for a seeker
 */
export function canCreateTasks(status: SeekerStage | string): boolean {
  return !isFinalStatus(status)
}

/**
 * Get the normalized status (maps legacy statuses to new ones)
 */
export function normalizeStatus(status: SeekerStage | string): SeekerStage {
  return (LEGACY_STATUS_MAP[status] as SeekerStage) || (status as SeekerStage)
}

/**
 * Handle seeker status change
 * - Completes all related tasks if final status
 * - Creates task action history entries
 * - Returns summary of actions taken
 */
export async function handleStatusChange(
  seekerId: string,
  newStatus: SeekerStage | string,
  userId: string,
  oldStatus?: SeekerStage | string,
  rejectionReason?: string
): Promise<{
  tasksCompleted: number
  statusChanged: boolean
  message: string
}> {
  const normalizedNewStatus = normalizeStatus(newStatus)
  const normalizedOldStatus = oldStatus ? normalizeStatus(oldStatus) : undefined
  
  // Check if this is a transition to a final status
  const isTransitionToFinal = isFinalStatus(normalizedNewStatus) && 
                               (!normalizedOldStatus || !isFinalStatus(normalizedOldStatus))
  
  if (!isTransitionToFinal) {
    return {
      tasksCompleted: 0,
      statusChanged: true,
      message: 'Status updated (no task automation required)',
    }
  }

  // Get all open tasks for this seeker
  const openTasks = await prisma.followUpTask.findMany({
    where: {
      seekerId,
      status: { not: 'COMPLETED' },
    },
    select: {
      id: true,
      status: true,
    },
  })

  if (openTasks.length === 0) {
    return {
      tasksCompleted: 0,
      statusChanged: true,
      message: `Status changed to ${normalizedNewStatus} (no open tasks to complete)`,
    }
  }

  // Complete all open tasks in a transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Update all tasks to COMPLETED
      await tx.followUpTask.updateMany({
        where: {
          id: { in: openTasks.map(t => t.id) },
        },
        data: {
          status: 'COMPLETED',
        },
      })

      // Create action history entries for each task
      const historyEntries = openTasks.map(task => ({
        taskId: task.id,
        fromStatus: task.status,
        toStatus: 'COMPLETED' as const,
        actionBy: userId,
        notes: getStatusChangeNote(normalizedNewStatus, rejectionReason),
      }))

      await tx.taskActionHistory.createMany({
        data: historyEntries,
      })
    })

    return {
      tasksCompleted: openTasks.length,
      statusChanged: true,
      message: `Status changed to ${normalizedNewStatus}, ${openTasks.length} task(s) auto-completed`,
    }
  } catch (error) {
    console.error('Error in handleStatusChange:', error)
    throw new Error('Failed to complete tasks during status change')
  }
}

/**
 * Generate appropriate note for task action history
 */
function getStatusChangeNote(status: string, rejectionReason?: string): string {
  switch (status) {
    case 'REGISTERED':
      return 'Task automatically completed - Seeker registered successfully'
    case 'NOT_INTERESTED':
      return rejectionReason 
        ? `Task automatically completed - Seeker not interested: ${rejectionReason}`
        : 'Task automatically completed - Seeker not interested'
    case 'COMPLETED':
      return 'Task automatically completed - Process completed'
    default:
      return `Task automatically completed - Status changed to ${status}`
  }
}

/**
 * Validate task creation for a seeker
 * Throws error if tasks cannot be created
 */
export async function validateTaskCreation(seekerId: string): Promise<void> {
  const seeker = await prisma.seeker.findUnique({
    where: { id: seekerId },
    select: { stage: true, fullName: true },
  })

  if (!seeker) {
    throw new Error('Seeker not found')
  }

  if (!canCreateTasks(seeker.stage)) {
    const status = normalizeStatus(seeker.stage)
    throw new Error(
      `Cannot create tasks for ${seeker.fullName}. ` +
      `Seeker status is ${status} (final status). ` +
      `Tasks can only be created for seekers with PENDING or IN_PROGRESS status.`
    )
  }
}

/**
 * Get UI color class for a status
 */
export function getStatusColor(status: string): {
  row: string
  indicator: string
  badge: string
} {
  const normalized = normalizeStatus(status)
  
  switch (normalized as any) {
    case 'REGISTERED':
      return {
        row: 'bg-green-50 hover:bg-green-100',
        indicator: 'bg-green-500',
        badge: 'bg-green-100 text-green-800 border-green-300',
      }
    case 'NOT_INTERESTED':
      return {
        row: 'bg-red-50 hover:bg-red-100',
        indicator: 'bg-red-500',
        badge: 'bg-red-100 text-red-800 border-red-300',
      }
    case 'COMPLETED':
      return {
        row: 'bg-blue-50 hover:bg-blue-100',
        indicator: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
      }
    case 'IN_PROGRESS':
      return {
        row: 'hover:bg-yellow-50',
        indicator: 'bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      }
    case 'PENDING':
    default:
      return {
        row: 'hover:bg-gray-50/30',
        indicator: 'bg-gray-400',
        badge: 'bg-gray-100 text-gray-800 border-gray-300',
      }
  }
}

/**
 * Get status display label
 */
export function getStatusLabel(status: SeekerStage | string): string {
  const normalized = normalizeStatus(status)
  
  const labels: Record<string, string> = {
    'PENDING': 'Pending',
    'IN_PROGRESS': 'In Progress',
    'REGISTERED': 'Registered',
    'NOT_INTERESTED': 'Not Interested',
    'COMPLETED': 'Completed',
  }
  
  return labels[normalized] || status.replace(/_/g, ' ')
}

