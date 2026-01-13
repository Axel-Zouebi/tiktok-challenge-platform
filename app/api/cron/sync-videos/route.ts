import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchYouTubeVideos, youtubeVideoToDbFormat } from '@/lib/api/youtube'
import { fetchTikTokVideos, tiktokVideoToDbFormat } from '@/lib/api/tiktok'
import { checkEligibilityForVideos } from '@/lib/eligibility'

// Verify this is a cron request (Vercel Cron sends a header)
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all channels
    const channels = await prisma.channel.findMany({
      include: {
        videos: {
          include: {
            eligibility: true,
          },
        },
      },
    })

    let syncedCount = 0
    let errorCount = 0

    for (const channel of channels) {
      try {
        let videos: any[] = []

        // Fetch videos based on platform
        if (channel.platform === 'youtube' && channel.channelId) {
          const youtubeVideos = await fetchYouTubeVideos(channel.channelId)
          videos = youtubeVideos.map((v) => ({
            ...youtubeVideoToDbFormat(v, channel.id),
            externalVideoId: v.id,
          }))
        } else if (channel.platform === 'tiktok' && channel.handle) {
          try {
            const tiktokVideos = await fetchTikTokVideos(channel.handle)
            videos = tiktokVideos.map((v) => ({
              ...tiktokVideoToDbFormat(v, channel.id),
              externalVideoId: v.id,
            }))
          } catch (error) {
            // TikTok API might not be available - skip for now
            console.warn(`TikTok sync skipped for ${channel.handle}:`, error)
            continue
          }
        }

        // Upsert videos
        for (const videoData of videos) {
          try {
            const video = await prisma.video.upsert({
              where: {
                platform_externalVideoId: {
                  platform: channel.platform,
                  externalVideoId: videoData.externalVideoId,
                },
              },
              create: {
                ...videoData,
                channelId: channel.id,
              },
              update: {
                ...videoData,
                lastSyncedAt: new Date(),
              },
              include: {
                eligibility: true,
              },
            })

            // Check eligibility
            const eligibilityResult = checkEligibilityForVideos([video])
            const result = eligibilityResult.get(video.id)

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

            syncedCount++
          } catch (error) {
            console.error(`Error upserting video ${videoData.externalVideoId}:`, error)
            errorCount++
          }
        }
      } catch (error) {
        console.error(`Error syncing channel ${channel.id}:`, error)
        errorCount++
      }
    }

    // Re-run eligibility for all videos to apply daily limits
    const allVideos = await prisma.video.findMany({
      include: {
        eligibility: true,
      },
    })

    const eligibilityResults = checkEligibilityForVideos(allVideos)

    // Update eligibility
    await Promise.all(
      Array.from(eligibilityResults.entries()).map(async ([videoId, result]) => {
        await prisma.videoEligibility.upsert({
          where: { videoId },
          create: {
            videoId,
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
      })
    )

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      errors: errorCount,
      channelsProcessed: channels.length,
    })
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

