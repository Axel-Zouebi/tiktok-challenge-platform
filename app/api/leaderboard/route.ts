import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Platform } from '@prisma/client'
import { lookupDiscordUserInServer } from '@/lib/api/discord'

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

    // Try to fetch missing Discord avatars
    const discordServerId = process.env.DISCORD_SERVER_ID
    const participantsToUpdate = participants.filter(
      (p) => !p.discordAvatarUrl && p.discordUsername
    )

    // Update avatars in parallel with a timeout
    if (discordServerId && participantsToUpdate.length > 0) {
      try {
        // Wait up to 3 seconds for avatar fetches
        await Promise.race([
          Promise.all(
            participantsToUpdate.map(async (participant) => {
              try {
                const userInfo = await lookupDiscordUserInServer(
                  participant.discordUsername,
                  discordServerId
                )
                if (userInfo && userInfo.avatarUrl) {
                  await prisma.participant.update({
                    where: { id: participant.id },
                    data: { discordAvatarUrl: userInfo.avatarUrl },
                  })
                  // Update the participant object in memory for this response
                  participant.discordAvatarUrl = userInfo.avatarUrl
                }
              } catch (error) {
                // Silently fail for individual participants
                console.error(
                  `Failed to fetch Discord avatar for ${participant.discordUsername}:`,
                  error
                )
              }
            })
          ),
          new Promise((resolve) => setTimeout(resolve, 3000)), // 3 second timeout
        ])
      } catch (error) {
        // Don't block the leaderboard response if avatar fetching fails
        console.error('Error fetching Discord avatars:', error)
      }
    }

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

