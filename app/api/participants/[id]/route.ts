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

    // Get all videos directly linked to participant
    const allVideos = participant.videos.map((video) => ({
      ...video,
      channelId: null,
    }))

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
    console.log(`📊 Dashboard API: Participant ${id} has ${allVideos.length} videos with total views: ${totalViews}`)
    console.log(`📊 Individual video views:`, allVideos.map(v => ({ id: v.id, title: v.title?.substring(0, 30), views: v.views })))

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
    // Group by platform and date
    const dailyPosts = new Map<string, Map<string, number>>() // platform -> date -> count
    for (const video of allVideos) {
      const date = video.publishedAt.toISOString().split('T')[0]
      const platform = video.platform
      const dateMap = dailyPosts.get(platform) || new Map()
      const count = dateMap.get(date) || 0
      dateMap.set(date, count + 1)
      dailyPosts.set(platform, dateMap)
    }

    const dailyPostsArray = Array.from(dailyPosts.entries()).map(([platform, dateMap]) => {
      return {
        channelId: null,
        platform: platform as 'tiktok' | 'youtube',
        handle: platform === 'tiktok' ? 'TikTok' : 'YouTube',
        dailyCounts: Array.from(dateMap.entries()).map(([date, count]) => ({
          date,
          count,
        })),
      }
    })

    const response = NextResponse.json({
      participant: {
        id: participant.id,
        discordUsername: participant.discordUsername,
        email: participant.email,
        discordAvatarUrl: participant.discordAvatarUrl,
      },
      channels: [],
      videos: videosWithEligibility,
      totals: {
        totalViews,
        eligiblePosts: robuxInfo.eligibleVideosCount,
        robuxEarned: robuxInfo.robuxEarned,
      },
      dailyPosts: dailyPostsArray,
    })
    
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching participant data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participant data' },
      { status: 500 }
    )
  }
}

