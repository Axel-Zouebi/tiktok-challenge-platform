import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkEligibilityForVideos } from '@/lib/eligibility'
import { calculateParticipantRobux } from '@/lib/robux'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        channels: {
          include: {
            videos: {
              include: {
                eligibility: true,
              },
              orderBy: {
                publishedAt: 'desc',
              },
            },
          },
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Get all videos across all channels
    const allVideos = participant.channels.flatMap((channel) =>
      channel.videos.map((video) => ({
        ...video,
        channelId: channel.id,
      }))
    )

    // Calculate eligibility
    const eligibilityResults = checkEligibilityForVideos(allVideos)

    // Update eligibility in database (async, don't wait)
    Promise.all(
      allVideos.map(async (video) => {
        const result = eligibilityResults.get(video.id)
        if (result) {
          await prisma.videoEligibility.upsert({
            where: { videoId: video.id },
            create: {
              videoId: video.id,
              isEligible: result.isEligible,
              reasons: result.reasons,
              eligibleRobux: result.eligibleRobux,
            },
            update: {
              isEligible: result.isEligible,
              reasons: result.reasons,
              eligibleRobux: result.eligibleRobux,
            },
          })
        }
      })
    ).catch(console.error)

    // Calculate totals
    const robuxInfo = await calculateParticipantRobux(participant.id)

    // Calculate total views
    const totalViews = allVideos.reduce((sum, video) => sum + video.views, 0)

    // Group videos by eligibility
    const videosWithEligibility = allVideos.map((video) => {
      const eligibility = eligibilityResults.get(video.id)
      return {
        ...video,
        eligibility: eligibility || {
          isEligible: false,
          reasons: ['Not yet evaluated'],
          eligibleRobux: 0,
        },
      }
    })

    // Calculate daily posts per account
    const dailyPosts = new Map<string, Map<string, number>>() // channelId -> date -> count
    for (const video of allVideos) {
      const date = video.publishedAt.toISOString().split('T')[0]
      const channelMap = dailyPosts.get(video.channelId) || new Map()
      const count = channelMap.get(date) || 0
      channelMap.set(date, count + 1)
      dailyPosts.set(video.channelId, channelMap)
    }

    const dailyPostsArray = Array.from(dailyPosts.entries()).map(([channelId, dateMap]) => {
      const channel = participant.channels.find((c) => c.id === channelId)
      return {
        channelId,
        platform: channel?.platform,
        handle: channel?.handle || channel?.channelId,
        dailyCounts: Array.from(dateMap.entries()).map(([date, count]) => ({
          date,
          count,
        })),
      }
    })

    return NextResponse.json({
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        email: participant.email,
      },
      channels: participant.channels,
      videos: videosWithEligibility,
      totals: {
        totalViews,
        eligiblePosts: robuxInfo.eligibleVideosCount,
        robuxEarned: robuxInfo.robuxEarned,
      },
      dailyPosts: dailyPostsArray,
    })
  } catch (error) {
    console.error('Error fetching participant data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participant data' },
      { status: 500 }
    )
  }
}

