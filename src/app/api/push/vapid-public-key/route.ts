import { NextResponse } from 'next/server'

// GET /api/push/vapid-public-key - Get VAPID public key for client subscription
export async function GET() {
  try {
    // VAPID public key should be stored in environment variables
    // Generate using: npx web-push generate-vapid-keys
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY

    if (!publicKey) {
      console.warn('VAPID_PUBLIC_KEY not set in environment variables')
      return NextResponse.json(
        { error: 'VAPID public key not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json({ publicKey })
  } catch (error) {
    console.error('Error getting VAPID public key:', error)
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' },
      { status: 500 }
    )
  }
}

