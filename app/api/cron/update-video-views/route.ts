import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractYouTubeVideoId } from '@/lib/utils'
import { fetchYouTubeVideoById, youtubeVideoToDbFormat } from '@/lib/api/youtube'
import { parseTikTokVideoUrl, fetchTikTokVideoByUrl, tiktokOEmbedToDbFormat, scrapeTikTokVideoMetadata } from '@/lib/api/tiktok'

export const dynamic = 'force-dynamic'

// Verify this is a cron request
// Supports both Authorization header (Vercel) and query parameter (cron-job.org)
function verifyCronRequest(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) {
    return true // No secret set, allow all requests
  }

  // Check Authorization header (for Vercel cron)
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }

  // Check query parameter (for cron-job.org and other external services)
  const url = new URL(request.url)
  const secretParam = url.searchParams.get('secret')
  if (secretParam === process.env.CRON_SECRET) {
    return true
  }

  return false
}

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all videos that need view updates
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        platform: true,
        externalVideoId: true,
        url: true,
      },
    })

    let updatedCount = 0
    let errorCount = 0

    console.log(`🔄 Starting view update for ${videos.length} videos`)

    for (const video of videos) {
      try {
        let videoData: any

        if (video.platform === 'youtube') {
          // Fetch video metadata from YouTube API
          const youtubeVideo = await fetchYouTubeVideoById(video.externalVideoId)
          if (!youtubeVideo) {
            console.warn(`⚠️ YouTube video not found: ${video.externalVideoId}`)
            errorCount++
            continue
          }

          videoData = youtubeVideoToDbFormat(youtubeVideo)
        } else {
          // TikTok
          // Fetch video metadata from TikTok oEmbed API
          const tiktokOEmbed = await fetchTikTokVideoByUrl(video.url)
          
          // Also scrape the page for views and duration (oEmbed doesn't provide these)
          const scrapedMetadata = await scrapeTikTokVideoMetadata(video.url)
          
          if (tiktokOEmbed) {
            // Use oEmbed data to get thumbnail, title, author, etc.
            // Include scraped metadata for views and duration
            videoData = tiktokOEmbedToDbFormat(tiktokOEmbed, video.externalVideoId, video.url, scrapedMetadata)
          } else {
            // Fallback to basic data if oEmbed fails
            const usernameMatch = video.url.match(/tiktok\.com\/@([^/]+)/)
            const username = usernameMatch ? usernameMatch[1] : null

            videoData = {
              platform: 'tiktok' as const,
              externalVideoId: video.externalVideoId,
              url: video.url,
              title: `TikTok Video ${video.externalVideoId}`,
              description: username ? `Video from @${username}` : '',
              publishedAt: new Date(),
              durationSeconds: scrapedMetadata?.durationSeconds ?? null,
              views: scrapedMetadata?.views ?? 0,
              thumbnailUrl: null,
            }
          }
        }

        // Ensure views is a valid number (default to 0 if invalid)
        if (typeof videoData.views !== 'number' || isNaN(videoData.views)) {
          console.warn(`⚠️ Invalid views value for video ${video.id}, defaulting to 0:`, videoData.views)
          videoData.views = 0
        }

        // Update video metadata (only update views and lastSyncedAt to avoid overwriting other data)
        await prisma.video.update({
          where: { id: video.id },
          data: {
            views: videoData.views,
            lastSyncedAt: new Date(),
          },
        })

        updatedCount++
        
        // Log every 10 videos to avoid spam
        if (updatedCount % 10 === 0) {
          console.log(`✅ Updated ${updatedCount}/${videos.length} videos`)
        }
      } catch (error) {
        console.error(`❌ Error updating video ${video.id} (${video.platform}):`, error)
        errorCount++
        // Continue with other videos even if one fails
      }
    }

    console.log(`✅ View update complete: ${updatedCount} updated, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      errors: errorCount,
      total: videos.length,
    })
  } catch (error) {
    console.error('❌ Cron view update error:', error)
    return NextResponse.json(
      { error: 'View update failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
