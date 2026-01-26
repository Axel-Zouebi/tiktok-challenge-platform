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
    console.log(`📊 Individual video views:`, allVideos.map(v => ({ 
      id: v.id, 
      title: v.title?.substring(0, 30), 
      views: v.views,
      publishedAt: v.publishedAt,
      publishedAtType: typeof v.publishedAt,
      publishedAtISO: v.publishedAt instanceof Date ? v.publishedAt.toISOString() : new Date(v.publishedAt).toISOString()
    })))

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

    // Generate all dates from January 24 to February 24 (2026)
    // Use UTC dates to avoid timezone issues
    const startDate = new Date('2026-01-24T00:00:00.000Z')
    const endDate = new Date('2026-02-24T23:59:59.999Z')
    const allDates: string[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0])
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    // Group videos by day for the new dashboard structure
    // Use UTC date to ensure consistent grouping regardless of server timezone
    const videosByDay = new Map<string, typeof videosWithEligibility>()
    for (const video of videosWithEligibility) {
      // Handle both Date objects and string dates
      const publishedDate = video.publishedAt instanceof Date 
        ? video.publishedAt 
        : new Date(video.publishedAt)
      // Get UTC date string to avoid timezone issues
      const date = publishedDate.toISOString().split('T')[0]
      
      console.log(`📹 Video ${video.id} published at: ${video.publishedAt} -> date: ${date}`)
      
      if (!videosByDay.has(date)) {
        videosByDay.set(date, [])
      }
      videosByDay.get(date)!.push(video)
    }
    
    console.log(`📅 Videos grouped by day:`, Array.from(videosByDay.entries()).map(([date, videos]) => ({
      date,
      count: videos.length,
      videoIds: videos.map(v => v.id)
    })))

    // Calculate daily robux (eligibility system already applies daily limit of 3 videos = 300 robux max)
    const dailyRobux = new Map<string, number>()
    for (const date of allDates) {
      const dayVideos = videosByDay.get(date) || []
      // Sum up eligible robux for the day (already capped at 3 videos by eligibility system)
      const dailyRobuxEarned = dayVideos
        .filter(v => v.eligibility.isEligible)
        .reduce((sum, v) => sum + v.eligibility.eligibleRobux, 0)
      // Cap at 300 robux per day (safety check, though eligibility should already handle this)
      dailyRobux.set(date, Math.min(dailyRobuxEarned, 300))
    }

    // Convert to array format for frontend - include all dates, even if no videos
    // Sort from January 24 to February 24 (oldest first)
    const dailyData = allDates
      .map((date) => {
        const videos = videosByDay.get(date) || []
        return {
          date,
          videos: videos.sort(
            (a, b) => {
              const dateA = a.publishedAt instanceof Date ? a.publishedAt : new Date(a.publishedAt)
              const dateB = b.publishedAt instanceof Date ? b.publishedAt : new Date(b.publishedAt)
              return dateB.getTime() - dateA.getTime()
            }
          ),
          robuxEarned: dailyRobux.get(date) || 0,
          maxRobux: 300,
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // January 24 to February 24
    
    // Log summary for debugging
    console.log(`📊 Daily data summary:`, {
      totalDates: dailyData.length,
      datesWithVideos: dailyData.filter(d => d.videos.length > 0).map(d => ({
        date: d.date,
        videoCount: d.videos.length,
        robux: d.robuxEarned
      }))
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
      dailyData, // New field for daily breakdown
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

