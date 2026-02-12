import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

// GET individual follow-up task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params

    const task = await prisma.followUpTask.findUnique({
      where: { id },
      include: {
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            createdById: true,
            registerNow: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        actionHistory: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            actionAt: 'desc',
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this task
    if (!isAdminRole(_user.role)) {
      if (task.assignedTo !== _user.id && task.seeker.createdById !== _user.id) {
        return NextResponse.json(
          { error: 'Access denied. You can only view tasks assigned to you for inquiries you created.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const body = await request.json()
    const { status, notes, registerNow, actionType } = body as {
      status?: string
      notes?: string
      registerNow?: boolean | string
      actionType?: 'REGISTER' | 'NOT_INTERESTED'
    }
    const { id } = await params

    // Get the current task to track the status change
    const currentTask = await prisma.followUpTask.findUnique({
      where: { id },
      select: { 
        id: true,
        status: true,
        notes: true,
        assignedTo: true,
        seekerId: true,
        seeker: {
          select: {
            id: true,
            createdById: true,
            registerNow: true,
            stage: true,
          }
        }
      }
    })

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update this task
    if (!isAdminRole(_user.role)) {
      // Non-admin users can only update tasks assigned to them for inquiries they created
      if (currentTask.assignedTo !== _user.id || currentTask.seeker.createdById !== _user.id) {
        return NextResponse.json(
          { error: 'Access denied. You can only update tasks assigned to you for inquiries you created.' },
          { status: 403 }
        )
      }
    }

    const buildTaskResponse = async () => {
      return prisma.followUpTask.findUnique({
        where: { id },
        include: {
          seeker: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              createdById: true,
              registerNow: true,
              stage: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
          actionHistory: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              actionAt: 'desc',
            },
          },
        },
      })
    }

    // New action-based workflow: Register / Not Interested
    if (actionType === 'REGISTER' || actionType === 'NOT_INTERESTED') {
      const isAutoTask1 = currentTask.notes?.includes('Automatic follow-up #1') ?? false
      const isAutoTask2 = currentTask.notes?.includes('Automatic follow-up #2') ?? false

      await prisma.seeker.update({
        where: { id: currentTask.seekerId },
        data:
          actionType === 'REGISTER'
            ? { registerNow: true }
            : { stage: 'LOST', registerNow: false },
      })

      // Rule A:
      // - action on auto #1 => close #1 + #2
      // - action on auto #2 => close only #2
      // - non-auto => close only current task
      const tasksToConsider = await prisma.followUpTask.findMany({
        where: { seekerId: currentTask.seekerId },
        select: { id: true, status: true, notes: true },
      })

      const taskIdsToClose = new Set<string>([currentTask.id])
      if (isAutoTask1) {
        const auto2 = tasksToConsider.find(task => task.notes?.includes('Automatic follow-up #2'))
        if (auto2) {
          taskIdsToClose.add(auto2.id)
        }
      } else if (isAutoTask2) {
        taskIdsToClose.clear()
        taskIdsToClose.add(currentTask.id)
      }

      const closeCandidates = tasksToConsider.filter(task => taskIdsToClose.has(task.id))
      for (const task of closeCandidates) {
        if (task.status !== 'COMPLETED') {
          await prisma.followUpTask.update({
            where: { id: task.id },
            data: { status: 'COMPLETED' },
          })
          await prisma.taskActionHistory.create({
            data: {
              taskId: task.id,
              fromStatus: task.status,
              toStatus: 'COMPLETED',
              actionBy: _user.id,
              notes:
                actionType === 'REGISTER'
                  ? 'Task completed after Register action'
                  : 'Task completed after Not Interested action',
            },
          })
        }
      }

      await prisma.taskActionHistory.create({
        data: {
          taskId: currentTask.id,
          fromStatus: null,
          toStatus: 'COMPLETED',
          actionBy: _user.id,
          notes:
            actionType === 'REGISTER'
              ? 'Seeker marked as Registered (registerNow=true)'
              : 'Seeker marked as Not Interested (stage=LOST)',
        },
      })

      const updatedTask = await buildTaskResponse()
      if (!updatedTask) {
        return NextResponse.json({ error: 'Task not found after update' }, { status: 404 })
      }
      return NextResponse.json(updatedTask)
    }

    // Backward-compatible status update workflow
    const validStatuses = ['OPEN', 'TODO', 'OVERDUE', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'COMPLETED'] as const
    const nextStatus = (status && validStatuses.includes(status as (typeof validStatuses)[number])
      ? status
      : currentTask.status) as (typeof validStatuses)[number]
    const updatedTask = await prisma.followUpTask.update({
      where: { id },
      data: { status: nextStatus },
    })

    if (registerNow !== undefined && currentTask.seekerId) {
      const isRegistering = registerNow === true || registerNow === 'true'
      await prisma.seeker.update({
        where: { id: currentTask.seekerId },
        data: { registerNow: isRegistering },
      })
    }

    await prisma.taskActionHistory.create({
      data: {
        taskId: id,
        fromStatus: currentTask.status,
        toStatus: nextStatus,
        actionBy: _user.id,
        notes:
          notes ||
          (registerNow !== undefined
            ? `Status changed to ${nextStatus}. Registration marked as ${registerNow ? 'Yes' : 'No'}.`
            : `Status changed from ${currentTask.status} to ${nextStatus}`),
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE follow-up task (soft delete - mark as deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params

    // Get the current task to check permissions
    const currentTask = await prisma.followUpTask.findUnique({
      where: { id },
      select: { 
        assignedTo: true,
        seeker: {
          select: {
            createdById: true
          }
        }
      }
    })

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete this task
    if (!isAdminRole(_user.role)) {
      // Non-admin users can only delete tasks assigned to them for inquiries they created
      if (currentTask.assignedTo !== _user.id || currentTask.seeker.createdById !== _user.id) {
        return NextResponse.json(
          { error: 'Access denied. You can only delete tasks assigned to you for inquiries you created.' },
          { status: 403 }
        )
      }
    }

    // Soft delete: Update status to a deleted state or add deletedAt field
    // For now, we'll hard delete. In production, consider soft delete:
    // await prisma.followUpTask.update({
    //   where: { id },
    //   data: { deletedAt: new Date(), deletedBy: _user.id }
    // })

    await prisma.followUpTask.delete({
      where: { id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}