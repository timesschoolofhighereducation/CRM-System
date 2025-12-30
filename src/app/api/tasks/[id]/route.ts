import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const body = await request.json()
    const { status, notes, registerNow } = body
    const { id } = await params

    // Get the current task to track the status change
    const currentTask = await prisma.followUpTask.findUnique({
      where: { id },
      select: { 
        status: true,
        assignedTo: true,
        seekerId: true,
        seeker: {
          select: {
            id: true,
            createdById: true,
            registerNow: true
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

    // Update the task status
    const updatedTask = await prisma.followUpTask.update({
      where: { id },
      data: { status },
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

    // Update seeker's registerNow field if registerNow is provided
    if (registerNow !== undefined && currentTask.seekerId) {
      const isRegistering = registerNow === true || registerNow === 'true'
      
      await prisma.seeker.update({
        where: { id: currentTask.seekerId },
        data: { registerNow: isRegistering }
      })
      
      // Update the response to reflect the change
      ;(updatedTask.seeker as any).registerNow = isRegistering
      
      // If registering, automatically move this task and all other tasks for the same seeker to COMPLETED
      if (isRegistering) {
        // Find all tasks for this seeker
        const allSeekerTasks = await prisma.followUpTask.findMany({
          where: {
            seekerId: currentTask.seekerId,
            status: { not: 'COMPLETED' } // Only update tasks that aren't already completed
          },
          select: { id: true, status: true }
        })
        
        // Update all tasks to COMPLETED
        await Promise.all(
          allSeekerTasks.map(async (task) => {
            await prisma.followUpTask.update({
              where: { id: task.id },
              data: { status: 'COMPLETED' }
            })
            
            // Create action history for each task
            await prisma.taskActionHistory.create({
              data: {
                taskId: task.id,
                fromStatus: task.status,
                toStatus: 'COMPLETED',
                actionBy: _user.id,
                notes: `Task automatically completed - Seeker registered (registerNow=true)`
              }
            })
          })
        )
        
        // Update the current task status in the response
        updatedTask.status = 'COMPLETED'
      }
    }

    // Create action history entry
    const historyNotes = notes || 
      (registerNow !== undefined 
        ? `Status changed to ${status}. Registration marked as ${registerNow ? 'Yes' : 'No'}.`
        : `Status changed from ${currentTask.status} to ${status}`)
    
    await prisma.taskActionHistory.create({
      data: {
        taskId: id,
        fromStatus: currentTask.status,
        toStatus: status,
        actionBy: _user.id,
        notes: historyNotes,
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