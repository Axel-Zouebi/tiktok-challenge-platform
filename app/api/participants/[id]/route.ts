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
        videos: {
          include: {
            eligibility: true,
          },
          orderBy: {
            publishedAt: 'desc',
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

    // Get all videos from channels
    const channelVideos = participant.channels.flatMap((channel) =>
      channel.videos.map((video) => ({
        ...video,
        channelId: channel.id,
      }))
    )

    // Get videos directly linked to participant (without channel)
    const directVideos = participant.videos
      .filter((video) => !video.channelId)
      .map((video) => ({
        ...video,
        channelId: null,
      }))

    // Combine all videos
    const allVideos = [...channelVideos, ...directVideos]

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
      // Use database eligibility if it exists (for admin overrides), otherwise use calculated
      const dbEligibility = video.eligibility
      return {
        ...video,
        eligibility: dbEligibility ? {
          isEligible: dbEligibility.isEligible,
          reasons: dbEligibility.reasons,
          eligibleRobux: dbEligibility.eligibleRobux,
          overriddenByAdmin: dbEligibility.overriddenByAdmin,
        } : (eligibility || {
          isEligible: false,
          reasons: ['Not yet evaluated'],
          eligibleRobux: 0,
          overriddenByAdmin: false,
        }),
      }
    })

    // Calculate daily posts per account
    // Group by participantId (for videos without channels) or channelId
    const dailyPosts = new Map<string, Map<string, number>>() // groupId -> date -> count
    for (const video of allVideos) {
      const date = video.publishedAt.toISOString().split('T')[0]
      const groupId = video.channelId || `participant-${participant.id}`
      const dateMap = dailyPosts.get(groupId) || new Map()
      const count = dateMap.get(date) || 0
      dateMap.set(date, count + 1)
      dailyPosts.set(groupId, dateMap)
    }

    const dailyPostsArray = Array.from(dailyPosts.entries()).map(([groupId, dateMap]) => {
      // If it's a channel ID, find the channel
      const channel = participant.channels.find((c) => c.id === groupId)
      return {
        channelId: channel ? groupId : null,
        platform: channel?.platform || (allVideos.find((v) => (v.channelId || `participant-${participant.id}`) === groupId)?.platform),
        handle: channel?.handle || channel?.channelId || 'Direct submission',
        dailyCounts: Array.from(dateMap.entries()).map(([date, count]) => ({
          date,
          count,
        })),
      }
    })

    return NextResponse.json({
      participant: {
        id: participant.id,
        discordUsername: participant.discordUsername,
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

