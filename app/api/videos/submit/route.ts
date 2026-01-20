import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractYouTubeVideoId } from '@/lib/utils'
import { fetchYouTubeVideoById, youtubeVideoToDbFormat } from '@/lib/api/youtube'
import { parseTikTokVideoUrl, fetchTikTokVideoByUrl, tiktokOEmbedToDbFormat, scrapeTikTokVideoMetadata } from '@/lib/api/tiktok'
import { normalizeDiscordUsername } from '@/lib/api/discord'
import { checkEligibilityForVideos } from '@/lib/eligibility'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const submitSchema = z.object({
  discordUsername: z.string().min(1, 'Discord username is required'),
  videoUrl: z.string().url('Invalid video URL'),
  platform: z.enum(['youtube', 'tiktok']),
})

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  console.log('📥 POST request received at /api/videos/submit')
  console.log('📥 Request method:', request.method)
  console.log('📥 Request URL:', request.url)
  
  try {
    const body = await request.json()
    console.log('📥 Request body received:', { 
      discordUsername: body.discordUsername, 
      platform: body.platform,
      videoUrl: body.videoUrl?.substring(0, 50) + '...' 
    })
    const validated = submitSchema.parse(body)

    const discordUsername = normalizeDiscordUsername(validated.discordUsername)
    const { videoUrl, platform } = validated

    // Find or create participant
    let participant = await prisma.participant.findFirst({
      where: { discordUsername },
    })

    if (!participant) {
      // Create participant with just Discord username
      participant = await prisma.participant.create({
        data: {
          displayName: discordUsername,
          discordUsername,
        },
      })
    }

    // Extract video ID and metadata based on platform
    let videoData: any
    let externalVideoId: string

    if (platform === 'youtube') {
      const videoId = extractYouTubeVideoId(videoUrl)
      if (!videoId) {
        return NextResponse.json(
          { error: 'Could not extract YouTube video ID from URL' },
          { status: 400 }
        )
      }

      externalVideoId = videoId

      // Fetch video metadata from YouTube API
      const youtubeVideo = await fetchYouTubeVideoById(videoId)
      if (!youtubeVideo) {
        return NextResponse.json(
          { error: 'Video not found on YouTube' },
          { status: 404 }
        )
      }

      videoData = youtubeVideoToDbFormat(youtubeVideo)
      console.log('📊 YouTube videoData views:', videoData.views)
    } else {
      // TikTok
      const videoId = parseTikTokVideoUrl(videoUrl)
      if (!videoId) {
        return NextResponse.json(
          { error: 'Could not extract TikTok video ID from URL' },
          { status: 400 }
        )
      }

      externalVideoId = videoId

      // Fetch video metadata from TikTok oEmbed API
      const tiktokOEmbed = await fetchTikTokVideoByUrl(videoUrl)
      
      // Also scrape the page for views and duration (oEmbed doesn't provide these)
      const scrapedMetadata = await scrapeTikTokVideoMetadata(videoUrl)
      console.log('📊 TikTok scrapedMetadata:', scrapedMetadata)
      
      if (tiktokOEmbed) {
        // Use oEmbed data to get thumbnail, title, author, etc.
        // Include scraped metadata for views and duration
        videoData = tiktokOEmbedToDbFormat(tiktokOEmbed, videoId, videoUrl, scrapedMetadata)
        console.log('📊 TikTok videoData views (from oEmbed):', videoData.views)
      } else {
        // Fallback to basic data if oEmbed fails
        const usernameMatch = videoUrl.match(/tiktok\.com\/@([^/]+)/)
        const username = usernameMatch ? usernameMatch[1] : null

        videoData = {
          platform: 'tiktok' as const,
          externalVideoId: videoId,
          url: videoUrl,
          title: `TikTok Video ${videoId}`,
          description: username ? `Video from @${username}` : '',
          publishedAt: new Date(),
          durationSeconds: scrapedMetadata?.durationSeconds ?? null,
          views: scrapedMetadata?.views ?? 0,
          thumbnailUrl: null,
        }
        console.log('📊 TikTok videoData views (fallback):', videoData.views)
      }
    }
    
    // Ensure views is a valid number (default to 0 if invalid)
    if (typeof videoData.views !== 'number' || isNaN(videoData.views)) {
      console.warn('⚠️ Invalid views value, defaulting to 0:', videoData.views)
      videoData.views = 0
    }
    
    console.log('📊 Final videoData before save:', {
      platform: videoData.platform,
      externalVideoId: videoData.externalVideoId,
      views: videoData.views,
      title: videoData.title?.substring(0, 50),
    })

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: {
        platform_externalVideoId: {
          platform,
          externalVideoId,
        },
      },
      include: {
        eligibility: true,
      },
    })

    if (existingVideo) {
      // Update video metadata (including views, title, description, thumbnail, etc.)
      // This ensures views and other metadata are kept up to date
      await prisma.video.update({
        where: { id: existingVideo.id },
        data: {
          participantId: participant.id,
          title: videoData.title,
          description: videoData.description,
          views: videoData.views,
          thumbnailUrl: videoData.thumbnailUrl,
          durationSeconds: videoData.durationSeconds,
          lastSyncedAt: new Date(),
        },
      })

      // Recalculate eligibility
      const allParticipantVideos = await prisma.video.findMany({
        where: { participantId: participant.id },
        include: { eligibility: true },
      })

      const eligibilityResults = checkEligibilityForVideos(allParticipantVideos)
      const result = eligibilityResults.get(existingVideo.id)

      if (result) {
        await prisma.videoEligibility.upsert({
          where: { videoId: existingVideo.id },
          create: {
            videoId: existingVideo.id,
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

      return NextResponse.json({
        success: true,
        video: {
          id: existingVideo.id,
          url: existingVideo.url,
          title: videoData.title,
        },
        eligibility: result || {
          isEligible: false,
          reasons: ['Eligibility check pending'],
          eligibleRobux: 0,
        },
        message: 'Video already exists, updated metadata and participant association',
      })
    }

    // Create new video
    console.log('🆕 Creating new video with views:', videoData.views)
    const video = await prisma.video.create({
      data: {
        ...videoData,
        participantId: participant.id,
        // channelId is optional, leave it null
      },
      include: {
        eligibility: true,
      },
    })
    
    console.log('✅ New video created with views:', video.views)

    // Calculate eligibility
    const allParticipantVideos = await prisma.video.findMany({
      where: { participantId: participant.id },
      include: { eligibility: true },
    })

    const eligibilityResults = checkEligibilityForVideos(allParticipantVideos)
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

    console.log('✅ Video submitted successfully:', video.id)
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        url: video.url,
        title: video.title,
      },
      eligibility: result || {
        isEligible: false,
        reasons: ['Eligibility check pending'],
        eligibleRobux: 0,
      },
      message: 'Video submitted successfully',
    })
  } catch (error) {
    console.error('❌ Video submission error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Failed to submit video',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

