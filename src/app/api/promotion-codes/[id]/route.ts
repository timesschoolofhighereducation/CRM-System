import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    const promotionCode = await prisma.promotionCode.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seekers: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            stage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!promotionCode) {
      return NextResponse.json(
        { error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    // Calculate actual statistics
    const totalInquiries = promotionCode.seekers.length
    const totalRegistrations = promotionCode.seekers.filter(
      (s) => s.stage === 'READY_TO_REGISTER'
    ).length
    const totalPaidLKR = promotionCode.paymentAmountLKR * totalRegistrations

    return NextResponse.json({
      ...promotionCode,
      totalInquiries,
      totalRegistrations,
      totalPaidLKR,
    })
  } catch (error: any) {
    console.error('Error fetching promotion code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch promotion code' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const {
      promoterName,
      promoterAddress,
      promoterPhone,
      promoterIdNumber,
      discountAmountLKR,
      paymentAmountLKR,
      isActive,
    } = body

    // Check if promotion code exists
    const existing = await prisma.promotionCode.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (promoterName !== undefined) updateData.promoterName = promoterName
    if (promoterAddress !== undefined) updateData.promoterAddress = promoterAddress
    if (promoterPhone !== undefined) updateData.promoterPhone = promoterPhone
    if (promoterIdNumber !== undefined) updateData.promoterIdNumber = promoterIdNumber
    if (discountAmountLKR !== undefined) updateData.discountAmountLKR = parseFloat(discountAmountLKR)
    if (paymentAmountLKR !== undefined) updateData.paymentAmountLKR = parseFloat(paymentAmountLKR)
    if (isActive !== undefined) updateData.isActive = isActive

    const promotionCode = await prisma.promotionCode.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(promotionCode)
  } catch (error: any) {
    console.error('Error updating promotion code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update promotion code' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    
    // Check if promotion code exists
    const existing = await prisma.promotionCode.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            seekers: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    // Check if code has been used
    if (existing._count.seekers > 0) {
      return NextResponse.json(
        { error: 'Cannot delete promotion code that has been used. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.promotionCode.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Promotion code deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting promotion code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete promotion code' },
      { status: 500 }
    )
  }
}
