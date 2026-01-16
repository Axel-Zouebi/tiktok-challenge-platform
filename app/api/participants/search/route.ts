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

    // Search participants by Discord username or channel handles
    const participants = await prisma.participant.findMany({
      where: {
        OR: [
          {
            discordUsername: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            channels: {
              some: {
                OR: [
                  {
                    handle: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                  {
                    channelId: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      include: {
        channels: {
          select: {
            platform: true,
            handle: true,
            channelId: true,
          },
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
      channels: participant.channels.map((c) => ({
        platform: c.platform,
        handle: c.handle,
        channelId: c.channelId,
      })),
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

