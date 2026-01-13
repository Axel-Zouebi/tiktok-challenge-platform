const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  duration: string // ISO 8601 duration
  viewCount: string
  thumbnailUrl: string
  url: string
}

export interface YouTubeChannelInfo {
  channelId: string
  title: string
  customUrl?: string
}

/**
 * Convert ISO 8601 duration to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Get channel information by channel ID
 */
export async function getYouTubeChannelInfo(channelId: string): Promise<YouTubeChannelInfo | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not set')
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      return null
    }

    const channel = data.items[0]
    return {
      channelId: channel.id,
      title: channel.snippet.title,
      customUrl: channel.snippet.customUrl,
    }
  } catch (error) {
    console.error('Error fetching YouTube channel info:', error)
    return null
  }
}

/**
 * Fetch recent videos from a YouTube channel
 * Filters by hashtag #trythemoon in title or description
 */
export async function fetchYouTubeVideos(
  channelId: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not set')
  }

  try {
    // First, get the uploads playlist ID
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
    )

    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.statusText}`)
    }

    const channelData = await channelResponse.json()
    if (!channelData.items || channelData.items.length === 0) {
      return []
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      return []
    }

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    )

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.statusText}`)
    }

    const videosData = await videosResponse.json()
    if (!videosData.items || videosData.items.length === 0) {
      return []
    }

    // Get video IDs
    const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',')

    // Get detailed video information
    const detailsResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    )

    if (!detailsResponse.ok) {
      throw new Error(`YouTube API error: ${detailsResponse.statusText}`)
    }

    const detailsData = await detailsResponse.json()
    if (!detailsData.items) {
      return []
    }

    // Filter by hashtag and map to our format
    const hashtag = '#trythemoon'
    const videos: YouTubeVideo[] = []

    for (const video of detailsData.items) {
      const title = video.snippet.title || ''
      const description = video.snippet.description || ''
      const text = `${title} ${description}`.toLowerCase()

      if (text.includes(hashtag.toLowerCase())) {
        videos.push({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description || '',
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: video.statistics.viewCount || '0',
          thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || '',
          url: `https://www.youtube.com/watch?v=${video.id}`,
        })
      }
    }

    return videos
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    throw error
  }
}

/**
 * Convert YouTube video to database format
 */
export function youtubeVideoToDbFormat(video: YouTubeVideo, channelId: string) {
  return {
    platform: 'youtube' as const,
    externalVideoId: video.id,
    url: video.url,
    title: video.title,
    description: video.description,
    publishedAt: new Date(video.publishedAt),
    durationSeconds: parseDuration(video.duration),
    views: parseInt(video.viewCount, 10),
    thumbnailUrl: video.thumbnailUrl,
  }
}

