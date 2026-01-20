import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim() || ''

    if (!query || query.length < 1) {
      return NextResponse.json({ participants: [] })
    }

    // Search participants by Discord username only
    const participants = await prisma.participant.findMany({
      where: {
        discordUsername: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 20, // Limit results
      orderBy: {
        discordUsername: 'asc',
      },
    })

    // Format results
    const results = participants.map((participant) => ({
      id: participant.id,
      discordUsername: participant.discordUsername,
      discordAvatarUrl: participant.discordAvatarUrl,
      channels: [], // Empty array for backward compatibility
    }))

    return NextResponse.json({ participants: results })
  } catch (error) {
    console.error('Error searching participants:', error)
    return NextResponse.json(
      { error: 'Failed to search participants' },
      { status: 500 }
    )
  }
}

