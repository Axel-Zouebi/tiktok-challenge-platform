import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchRobloxCCU } from '@/lib/api/roblox'

export async function GET() {
  try {
    // Try to get cached value first (within last 60 seconds)
    const recent = await prisma.robloxMetrics.findFirst({
      orderBy: {
        timestamp: 'desc',
      },
    })

    if (recent && Date.now() - recent.timestamp.getTime() < 60 * 1000) {
      return NextResponse.json({
        ccu: recent.ccu,
        cached: true,
        timestamp: recent.timestamp.toISOString(),
      })
    }

    // Fetch fresh value
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
      ccu,
      cached: false,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching Roblox CCU:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CCU', ccu: 0 },
      { status: 500 }
    )
  }
}

