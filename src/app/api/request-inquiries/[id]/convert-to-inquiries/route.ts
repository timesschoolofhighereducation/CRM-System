import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// POST /api/request-inquiries/[id]/convert-to-inquiries
// Create separate inquiries for each program the visitor selected
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Get the exhibition visitor with programs
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
        { error: 'Exhibition visitor not found' },
        { status: 404 }
      )
    }

    // Check if already converted
    if (visitor.isConverted) {
      return NextResponse.json(
        { error: 'This visitor has already been converted to inquiries' },
        { status: 400 }
      )
    }

    // Get programs from visitor
    const programs = visitor.programs || []
    
    if (programs.length === 0) {
      return NextResponse.json(
        { error: 'No programs found for this visitor' },
        { status: 400 }
      )
    }

    // Create separate inquiry for each program
    const createdInquiries = []
    const errors = []

    for (const visitorProgram of programs) {
      try {
        // Prepare inquiry data for this program
        const inquiryData: Prisma.SeekerUncheckedCreateInput = {
          fullName: body.fullName || visitor.name,
          phone: body.phone || visitor.workPhone,
          email: body.email || visitor.metadata?.city || null,
          city: body.city || visitor.metadata?.city || null,
          ageBand: body.ageBand || null,
          guardianPhone: body.guardianPhone || null,
          marketingSource: body.marketingSource || 'Exhibition Registration',
          campaignId: body.campaignId || null,
          preferredContactTime: body.preferredContactTime || null,
          followUpAgain: body.followUpAgain || false,
          followUpDate: body.followUpDate || null,
          followUpTime: body.followUpTime || null,
          description: body.description 
            ? `${body.description}\n\n[From Exhibition Registration - ${visitorProgram.program.programName}]`
            : `From Exhibition Registration - ${visitorProgram.program.programName}`,
          whatsapp: body.whatsapp || false,
          whatsappNumber: body.whatsappNumber || null,
          notAnswering: body.notAnswering || false,
          emailNotAnswering: body.emailNotAnswering || false,
          consent: body.consent || false,
          createdById: user.id,
          // Link this inquiry to the specific program
          preferredPrograms: {
            create: [{
              programId: visitorProgram.program.id.toString(),
            }],
          },
        }

        // Create the inquiry
        const inquiry = await prisma.seeker.create({
          data: inquiryData,
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

        createdInquiries.push({
          inquiryId: inquiry.id,
          programId: visitorProgram.program.id,
          programName: visitorProgram.program.programName,
        })
      } catch (error) {
        console.error(`Error creating inquiry for program ${visitorProgram.program.programName}:`, error)
        errors.push({
          programId: visitorProgram.program.id,
          programName: visitorProgram.program.programName,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Mark visitor as converted if at least one inquiry was created
    if (createdInquiries.length > 0) {
      await requestInquiryPrisma.exhibitionVisitor.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdInquiries.length} inquiries from ${programs.length} programs`,
      createdInquiries,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error converting visitor to inquiries:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to convert visitor to inquiries' },
      { status: 500 }
    )
  }
}
