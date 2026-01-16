import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Platform } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform') as Platform | null

    // If platform is specified, validate it
    if (platform && platform !== 'tiktok' && platform !== 'youtube') {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "tiktok" or "youtube"' },
        { status: 400 }
      )
    }

    // Get all participants with their channels and videos
    // If platform is specified, filter by it; otherwise get all platforms
    const participants = await prisma.participant.findMany({
      include: {
        channels: {
          ...(platform ? { where: { platform } } : {}),
          include: {
            videos: {
              ...(platform ? { where: { platform } } : {}),
              include: {
                eligibility: {
                  where: {
                    isEligible: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Calculate leaderboard entries
    const entries = participants
      .map((participant) => {
        const channels = participant.channels
        const allVideos = channels.flatMap((c) => c.videos)
        const totalViews = allVideos.reduce((sum, v) => sum + v.views, 0)
        const eligiblePosts = allVideos.filter((v) => v.eligibility?.isEligible).length
        const robuxEarned = eligiblePosts * 100

        return {
          participantId: participant.id,
          displayName: participant.displayName,
          discordUsername: participant.discordUsername,
          discordAvatarUrl: participant.discordAvatarUrl,
          channels: channels.map((c) => ({
            platform: c.platform,
            handle: c.handle,
            channelId: c.channelId,
            url: c.url,
          })),
          totalViews,
          eligiblePosts,
          robuxEarned,
        }
      })
      .sort((a, b) => b.totalViews - a.totalViews)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    return NextResponse.json({
      platform: platform || 'combined',
      entries,
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

