import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { prisma } from '@/lib/prisma'

// POST /api/request-inquiries/[id]/convert - Convert exhibition visitor to regular inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Get the exhibition visitor with all related data
    const visitor = await requestInquiryPrisma.exhibitionVisitor.findUnique({
      where: { id },
      include: {
        programs: {
          include: {
            program: true,
          },
        },
        metadata: true,
      },
    })

    if (!visitor) {
      return NextResponse.json(
        { error: 'Request inquiry not found' },
        { status: 404 }
      )
    }

    // Check if already converted
    if (visitor.isConverted) {
      return NextResponse.json(
        { error: 'This exhibition visitor has already been converted to an inquiry' },
        { status: 400 }
      )
    }

    // Map selected programs to preferred programs in main database
    const programMappings: Array<{ requestProgram: any; mainProgram: any }> = []
    if (visitor.programs && visitor.programs.length > 0) {
      // Try to find matching programs in main database by name
      for (const vp of visitor.programs) {
        const mainProgram = await prisma.program.findFirst({
          where: {
            name: {
              contains: vp.program.programName,
              mode: 'insensitive',
            },
          },
        })
        if (mainProgram) {
          programMappings.push({
            requestProgram: vp.program,
            mainProgram: mainProgram,
          })
        }
      }
    }

    // If no programs found, return error
    if (programMappings.length === 0) {
      return NextResponse.json(
        { error: 'No matching programs found in the main database' },
        { status: 400 }
      )
    }

    // Create ONE inquiry per program requested
    const createdSeekers: any[] = []
    const failedPrograms: string[] = []

    for (const mapping of programMappings) {
      try {
        // Build unique description for this program
        const programDescription = visitor.metadata
          ? `Exhibition Registration - ${mapping.requestProgram.programName} - ${visitor.metadata.country || 'Unknown'} - ${visitor.metadata.browser || 'Unknown Browser'}`
          : `Exhibition Registration - ${mapping.requestProgram.programName}`

        // Create the inquiry in the main database
        const seekerData: any = {
          fullName: visitor.name,
          phone: visitor.workPhone,
          whatsapp: false,
          whatsappNumber: null,
          notAnswering: false,
          email: null,
          emailNotAnswering: false,
          city: visitor.metadata?.city || null,
          ageBand: null,
          guardianPhone: null,
          marketingSource: 'EXHIBITION',
          campaignId: null,
          preferredContactTime: null,
          preferredStatus: null,
          followUpAgain: false,
          followUpDate: null,
          followUpTime: null,
          description: programDescription,
          consent: true,
          createdById: user.id,
          preferredPrograms: {
            create: [
              {
                programId: mapping.mainProgram.id,
              },
            ],
          },
        }

        const seeker = await prisma.seeker.create({
          data: seekerData,
          include: {
            programInterest: true,
            preferredPrograms: {
              include: {
                program: true,
              },
            },
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        })

        createdSeekers.push(seeker)

        // Create automatic follow-up tasks for this inquiry
        try {
          const firstDueDate = new Date()
          firstDueDate.setDate(firstDueDate.getDate() + 3)

          const secondDueDate = new Date()
          secondDueDate.setDate(secondDueDate.getDate() + 7)

          const [firstFollowUpTask, secondFollowUpTask] = await Promise.all([
            prisma.followUpTask.create({
              data: {
                seekerId: seeker.id,
                assignedTo: user.id,
                dueAt: firstDueDate,
                purpose: 'CALLBACK',
                notes: `Automatic follow-up #1: Primary follow-up for exhibition inquiry (${mapping.requestProgram.programName}) - ${seeker.fullName} (${seeker.phone})`,
                status: 'OPEN',
              },
            }),
            prisma.followUpTask.create({
              data: {
                seekerId: seeker.id,
                assignedTo: user.id,
                dueAt: secondDueDate,
                purpose: 'CALLBACK',
                notes: `Automatic follow-up #2: Secondary follow-up for exhibition inquiry (${mapping.requestProgram.programName}) - ${seeker.fullName} (${seeker.phone})`,
                status: 'OPEN',
              },
            }),
          ])

          await Promise.all([
            prisma.taskActionHistory.create({
              data: {
                taskId: firstFollowUpTask.id,
                fromStatus: null,
                toStatus: 'OPEN',
                actionBy: user.id,
                notes: `Task created automatically from exhibition registration - First follow-up (3 days) for ${mapping.requestProgram.programName}`,
              },
            }),
            prisma.taskActionHistory.create({
              data: {
                taskId: secondFollowUpTask.id,
                fromStatus: null,
                toStatus: 'OPEN',
                actionBy: user.id,
                notes: `Task created automatically from exhibition registration - Second follow-up (7 days) for ${mapping.requestProgram.programName}`,
              },
            }),
          ])
        } catch (taskError) {
          console.error(`Error creating automatic follow-up tasks for ${mapping.requestProgram.programName}:`, taskError)
        }
      } catch (error) {
        console.error(`Failed to create inquiry for program ${mapping.requestProgram.programName}:`, error)
        failedPrograms.push(mapping.requestProgram.programName)
      }
    }

    // Mark visitor as converted in the database if at least one inquiry was created
    if (createdSeekers.length > 0) {
      const updatedVisitor = await requestInquiryPrisma.exhibitionVisitor.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
        },
        include: {
          programs: {
            include: {
              program: true,
            },
          },
          metadata: true,
        },
      })

      return NextResponse.json({
        success: true,
        inquiries: createdSeekers,
        visitor: updatedVisitor,
        message: `Successfully created ${createdSeekers.length} inquir${createdSeekers.length === 1 ? 'y' : 'ies'} (one per program)`,
        failedPrograms: failedPrograms.length > 0 ? failedPrograms : undefined,
      })
    }

    return NextResponse.json(
      { error: 'Failed to create any inquiries', failedPrograms },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error converting request inquiry:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to convert request inquiry' },
      { status: 500 }
    )
  }
}
