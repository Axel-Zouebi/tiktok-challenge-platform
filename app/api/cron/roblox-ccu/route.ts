import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchRobloxCCU } from '@/lib/api/roblox'

export const dynamic = 'force-dynamic'

// Verify this is a cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ccu = await fetchRobloxCCU()
    const placeId = process.env.ROBLOX_PLACE_ID || null

    // Store in database
    await prisma.robloxMetrics.create({
      data: {
        ccu,
        placeId,
      },
    })

    return NextResponse.json({
      success: true,
      ccu,
      placeId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Roblox CCU fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CCU' },
      { status: 500 }
    )
  }
}

