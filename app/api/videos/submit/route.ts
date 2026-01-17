import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractYouTubeVideoId } from '@/lib/utils'
import { fetchYouTubeVideoById, youtubeVideoToDbFormat } from '@/lib/api/youtube'
import { parseTikTokVideoUrl } from '@/lib/api/tiktok'
import { normalizeDiscordUsername } from '@/lib/api/discord'
import { checkEligibilityForVideos } from '@/lib/eligibility'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const submitSchema = z.object({
  discordUsername: z.string().min(1, 'Discord username is required'),
  videoUrl: z.string().url('Invalid video URL'),
  platform: z.enum(['youtube', 'tiktok']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

      // Extract username from TikTok URL for basic info
      const usernameMatch = videoUrl.match(/tiktok\.com\/@([^/]+)/)
      const username = usernameMatch ? usernameMatch[1] : null

      // Create minimal video data for TikTok (since API isn't fully available)
      videoData = {
        platform: 'tiktok' as const,
        externalVideoId: videoId,
        url: videoUrl,
        title: `TikTok Video ${videoId}`,
        description: username ? `Video from @${username}` : '',
        publishedAt: new Date(), // Use current date as fallback
        durationSeconds: null,
        views: 0,
        thumbnailUrl: null,
      }
    }

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
      // Update participant if different
      if (existingVideo.participantId !== participant.id) {
        await prisma.video.update({
          where: { id: existingVideo.id },
          data: { participantId: participant.id },
        })
      }

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
          title: existingVideo.title,
        },
        eligibility: result || {
          isEligible: false,
          reasons: ['Eligibility check pending'],
          eligibleRobux: 0,
        },
        message: 'Video already exists, updated participant association',
      })
    }

    // Create new video
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
    console.error('Video submission error:', error)

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

