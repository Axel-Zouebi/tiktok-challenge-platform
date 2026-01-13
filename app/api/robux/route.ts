import { NextRequest, NextResponse } from 'next/server'
import { calculateTotalRobux } from '@/lib/robux'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await calculateTotalRobux()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching Robux stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Robux stats' },
      { status: 500 }
    )
  }
}

