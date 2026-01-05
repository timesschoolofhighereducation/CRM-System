import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { prisma } from '@/lib/prisma'

// POST /api/request-inquiries/[id]/convert - Convert request inquiry to regular inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Get the request inquiry
    const requestInquiry = await requestInquiryPrisma.requestInquiry.findUnique({
      where: { id },
    })

    if (!requestInquiry) {
      return NextResponse.json(
        { error: 'Request inquiry not found' },
        { status: 404 }
      )
    }

    if (requestInquiry.isConverted) {
      return NextResponse.json(
        { error: 'This request inquiry has already been converted' },
        { status: 400 }
      )
    }

    // Check for duplicate phone number in main database
    const existingSeeker = await prisma.seeker.findUnique({
      where: {
        phone: requestInquiry.phone,
      },
    })

    if (existingSeeker) {
      return NextResponse.json(
        { error: 'An inquiry with this phone number already exists' },
        { status: 400 }
      )
    }

    // Create the inquiry in the main database using the same process as POST /api/inquiries
    const seekerData: any = {
      fullName: requestInquiry.fullName,
      phone: requestInquiry.phone,
      whatsapp: requestInquiry.whatsapp || false,
      whatsappNumber: requestInquiry.whatsappNumber || null,
      notAnswering: false,
      email: requestInquiry.email || null,
      emailNotAnswering: false,
      city: requestInquiry.city || null,
      ageBand: requestInquiry.ageBand || null,
      guardianPhone: requestInquiry.guardianPhone || null,
      marketingSource: requestInquiry.marketingSource || 'REQUEST_INQUIRY',
      campaignId: null,
      preferredContactTime: requestInquiry.preferredContactTime || null,
      preferredStatus: requestInquiry.preferredStatus || null,
      followUpAgain: false,
      followUpDate: null,
      followUpTime: null,
      description: requestInquiry.description || null,
      consent: requestInquiry.consent || false,
      createdById: user.id,
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

    // Create automatic follow-up tasks if not registering now
    if (!seekerData.registerNow) {
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
              notes: `Automatic follow-up #1: Primary follow-up for inquiry - ${seeker.fullName} (${seeker.phone})`,
              status: 'OPEN',
            },
          }),
          prisma.followUpTask.create({
            data: {
              seekerId: seeker.id,
              assignedTo: user.id,
              dueAt: secondDueDate,
              purpose: 'CALLBACK',
              notes: `Automatic follow-up #2: Secondary follow-up for inquiry - ${seeker.fullName} (${seeker.phone})`,
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
              notes: 'Task created automatically from request inquiry - First follow-up (3 days)',
            },
          }),
          prisma.taskActionHistory.create({
            data: {
              taskId: secondFollowUpTask.id,
              fromStatus: null,
              toStatus: 'OPEN',
              actionBy: user.id,
              notes: 'Task created automatically from request inquiry - Second follow-up (7 days)',
            },
          }),
        ])
      } catch (taskError) {
        console.error('Error creating automatic follow-up tasks:', taskError)
      }
    }

    // Mark request inquiry as converted
    await requestInquiryPrisma.requestInquiry.update({
      where: { id },
      data: {
        isConverted: true,
        convertedAt: new Date(),
        convertedById: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      inquiry: seeker,
      requestInquiry: {
        ...requestInquiry,
        isConverted: true,
        convertedAt: new Date(),
        convertedById: user.id,
      },
    })
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

