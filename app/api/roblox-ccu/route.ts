import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchRobloxCCU, fetchRobloxGameStats } from '@/lib/api/roblox'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try to get cached value first (within last 60 seconds)
    const recent = await prisma.robloxMetrics.findFirst({
      orderBy: {
        timestamp: 'desc',
      },
    })

    if (recent && Date.now() - recent.timestamp.getTime() < 60 * 1000) {
      // Fetch percentage rating separately (it's not stored in DB)
      const stats = await fetchRobloxGameStats()
      return NextResponse.json({
        ccu: recent.ccu,
        percentageRating: stats.percentageRating,
        cached: true,
        timestamp: recent.timestamp.toISOString(),
      })
    }

    // Fetch fresh values
    const stats = await fetchRobloxGameStats()
    const placeId = process.env.ROBLOX_PLACE_ID || null

    // Store in database (only CCU is stored)
    await prisma.robloxMetrics.create({
      data: {
        ccu: stats.ccu,
        placeId,
      },
    })

    return NextResponse.json({
      ccu: stats.ccu,
      percentageRating: stats.percentageRating,
      cached: false,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching Roblox CCU:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CCU', ccu: 0, percentageRating: 0 },
      { status: 500 }
    )
  }
}

