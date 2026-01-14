import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { searchYouTubeVideosByTitle, youtubeVideoToDbFormat } from '@/lib/api/youtube'
import { checkEligibilityForVideos } from '@/lib/eligibility'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Verify participant exists
    const participant = await prisma.participant.findUnique({
      where: { dashboardToken: token },
      include: {
        channels: {
          where: { platform: 'youtube' },
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    const youtubeChannel = participant.channels.find(ch => ch.platform === 'youtube')
    if (!youtubeChannel || !youtubeChannel.channelId) {
      return NextResponse.json(
        { error: 'No YouTube channel found for this participant' },
        { status: 400 }
      )
    }

    // Search for the video by title
    const videos = await searchYouTubeVideosByTitle(
      youtubeChannel.channelId,
      'Sip and Relax with Ghibli',
      50,
      youtubeChannel.url || undefined
    )

    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No video found with title containing "Sip and Relax with Ghibli"' },
        { status: 404 }
      )
    }

    // Use the first matching video
    const video = videos[0]

    // Convert to database format
    const videoData = {
      ...youtubeVideoToDbFormat(video, youtubeChannel.id),
      externalVideoId: video.id,
    }

    // Upsert the video
    const dbVideo = await prisma.video.upsert({
      where: {
        platform_externalVideoId: {
          platform: 'youtube',
          externalVideoId: video.id,
        },
      },
      create: {
        ...videoData,
        channelId: youtubeChannel.id,
      },
      update: {
        ...videoData,
        lastSyncedAt: new Date(),
      },
      include: {
        eligibility: true,
      },
    })

    // Check eligibility - need to fetch all videos from the channel to apply daily limits
    const allChannelVideos = await prisma.video.findMany({
      where: { channelId: youtubeChannel.id },
      include: { eligibility: true },
    })
    
    const eligibilityResult = checkEligibilityForVideos(allChannelVideos)
    const result = eligibilityResult.get(dbVideo.id)

    if (result) {
      await prisma.videoEligibility.upsert({
        where: { videoId: dbVideo.id },
        create: {
          videoId: dbVideo.id,
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
      message: 'Test video added successfully',
      video: {
        id: dbVideo.id,
        title: dbVideo.title,
        url: dbVideo.url,
        isEligible: result?.isEligible || false,
        reasons: result?.reasons || [],
      },
    })
  } catch (error) {
    console.error('Error adding test video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add test video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

