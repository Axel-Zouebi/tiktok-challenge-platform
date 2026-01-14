/**
 * Script to manually add a test video for ChillBeats channel
 * This script searches for a video by title and adds it to the database
 */

import { prisma } from '../lib/db'
import { searchYouTubeVideosByTitle, youtubeVideoToDbFormat } from '../lib/api/youtube'
import { checkEligibilityForVideos } from '../lib/eligibility'

async function addTestVideo() {
  try {
    console.log('Searching for ChillBeats channel...')
    
    // Find the ChillBeats channel - try multiple approaches
    let channel = await prisma.channel.findFirst({
      where: {
        platform: 'youtube',
        participant: {
          displayName: { contains: 'ChillBeats', mode: 'insensitive' },
        },
      },
      include: {
        participant: true,
      },
    })

    // If not found by display name, try by URL or channelId
    if (!channel) {
      channel = await prisma.channel.findFirst({
        where: {
          platform: 'youtube',
          OR: [
            { url: { contains: 'ChillBeats', mode: 'insensitive' } },
            { channelId: { contains: 'ChillBeats', mode: 'insensitive' } },
          ],
        },
        include: {
          participant: true,
        },
      })
    }

    if (!channel) {
      console.error('ChillBeats channel not found in database.')
      console.error('Please register first with:')
      console.error('  - Display Name: ChillBeats')
      console.error('  - YouTube Channel: ChillBeats (or the channel URL)')
      process.exit(1)
    }

    console.log(`Found channel: ${channel.channelId} (${channel.url})`)
    console.log(`Participant: ${channel.participant.displayName}`)

    // Search for the video by title
    console.log('\nSearching for video with title containing "Sip and Relax with Ghibli"...')
    
    const videos = await searchYouTubeVideosByTitle(
      channel.channelId!,
      'Sip and Relax with Ghibli',
      50,
      channel.url || undefined
    )

    if (videos.length === 0) {
      console.error('No video found with title containing "Sip and Relax with Ghibli"')
      process.exit(1)
    }

    // Use the first matching video
    const video = videos[0]
    console.log(`\nFound video: ${video.title}`)
    console.log(`Video ID: ${video.id}`)
    console.log(`URL: ${video.url}`)

    // Convert to database format
    const videoData = {
      ...youtubeVideoToDbFormat(video, channel.id),
      externalVideoId: video.id,
    }

    // Upsert the video
    console.log('\nAdding video to database...')
    const dbVideo = await prisma.video.upsert({
      where: {
        platform_externalVideoId: {
          platform: 'youtube',
          externalVideoId: video.id,
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

    console.log(`Video added/updated: ${dbVideo.id}`)

    // Check eligibility - need to fetch all videos from the channel to apply daily limits
    console.log('\nChecking eligibility...')
    const allChannelVideos = await prisma.video.findMany({
      where: { channelId: channel.id },
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

      console.log(`Eligibility: ${result.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`)
      console.log(`Reasons: ${result.reasons.join(', ')}`)
      console.log(`Eligible Robux: ${result.eligibleRobux}`)
    }

    console.log('\n✅ Video successfully added to database!')
    console.log(`\nYou can now view it in the participant dashboard at:`)
    console.log(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/p/${channel.participant.dashboardToken}`)

  } catch (error) {
    console.error('Error adding test video:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addTestVideo()

