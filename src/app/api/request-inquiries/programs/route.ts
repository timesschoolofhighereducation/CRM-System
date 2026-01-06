import { NextRequest, NextResponse } from 'next/server'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'

// GET /api/request-inquiries/programs - Get all available programs
export async function GET(request: NextRequest) {
  try {
    const programs = await requestInquiryPrisma.program.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { programName: 'asc' },
      ],
    })

    return NextResponse.json(programs)
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

