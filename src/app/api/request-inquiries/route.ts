import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { prisma } from '@/lib/prisma'

// GET /api/request-inquiries - Get all request inquiries
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const requestInquiries = await requestInquiryPrisma.requestInquiry.findMany({
      orderBy: [
        { isConverted: 'asc' }, // Non-converted first
        { createdAt: 'desc' },   // Then by creation date
      ],
    })

    return NextResponse.json(requestInquiries)
  } catch (error) {
    console.error('Error fetching request inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request inquiries' },
      { status: 500 }
    )
  }
}

// POST /api/request-inquiries - Create a new request inquiry
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const requestInquiry = await requestInquiryPrisma.requestInquiry.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        email: body.email || null,
        whatsapp: body.whatsapp || false,
        whatsappNumber: body.whatsappNumber || null,
        city: body.city || null,
        ageBand: body.ageBand || null,
        guardianPhone: body.guardianPhone || null,
        marketingSource: body.marketingSource || null,
        preferredContactTime: body.preferredContactTime || null,
        preferredStatus: body.preferredStatus || null,
        description: body.description || null,
        consent: body.consent || false,
      },
    })

    return NextResponse.json(requestInquiry, { status: 201 })
  } catch (error) {
    console.error('Error creating request inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to create request inquiry' },
      { status: 500 }
    )
  }
}

