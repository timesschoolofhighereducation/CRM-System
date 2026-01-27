import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: codeParam } = await params
    const code = codeParam.toUpperCase().trim()

    const promotionCode = await prisma.promotionCode.findUnique({
      where: { code },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!promotionCode) {
      return NextResponse.json(
        { error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    if (!promotionCode.isActive) {
      return NextResponse.json(
        { error: 'Promotion code is not active' },
        { status: 400 }
      )
    }

    // Calculate statistics
    const seekers = await prisma.seeker.findMany({
      where: { promotionCodeId: promotionCode.id },
      select: {
        id: true,
        stage: true,
      },
    })

    const totalInquiries = seekers.length
    const totalRegistrations = seekers.filter(
      (s) => s.stage === 'READY_TO_REGISTER'
    ).length

    return NextResponse.json({
      id: promotionCode.id,
      code: promotionCode.code,
      discountAmountLKR: promotionCode.discountAmountLKR,
      paymentAmountLKR: promotionCode.paymentAmountLKR,
      isActive: promotionCode.isActive,
      promoterName: promotionCode.promoterName,
      totalInquiries,
      totalRegistrations,
    })
  } catch (error: any) {
    console.error('Error validating promotion code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate promotion code' },
      { status: 500 }
    )
  }
}
