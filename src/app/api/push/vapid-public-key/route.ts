import { NextResponse } from 'next/server'

// GET /api/push/vapid-public-key - Get VAPID public key for client subscription
// This endpoint is used by the client to get the public key for push subscription
// Works with Vercel environment variables automatically
export async function GET() {
  try {
    // VAPID public key should be stored in Vercel environment variables
    // Generate using: npm run generate:vapid-keys
    // In Vercel: Use NEXT_PUBLIC_VAPID_PUBLIC_KEY (with NEXT_PUBLIC_ prefix)
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY

    if (!publicKey) {
      console.warn('VAPID_PUBLIC_KEY not set in Vercel environment variables')
      console.warn('Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to Vercel Settings > Environment Variables')
      return NextResponse.json(
        { 
          error: 'VAPID public key not configured',
          hint: 'Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to Vercel environment variables. See VERCEL_PUSH_NOTIFICATIONS_SETUP.md for instructions.'
        },
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

