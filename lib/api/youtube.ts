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
 * Resolve a channel identifier (ID, handle, or username) to a channel ID
 * Returns the channel ID if found, null otherwise
 */
async function resolveChannelId(identifier: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not set')
  }

  // If it's already a valid channel ID (starts with UC), return it
  if (identifier.startsWith('UC') && identifier.length === 24) {
    return identifier
  }

  // Remove @ prefix if present
  const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier

  try {
    // Try forHandle first (newer API, works for custom handles)
    let response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${cleanIdentifier}&key=${YOUTUBE_API_KEY}`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        return data.items[0].id
      }
    }

    // If forHandle didn't work, try forUsername (legacy, but still works for some)
    response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=id&forUsername=${cleanIdentifier}&key=${YOUTUBE_API_KEY}`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        return data.items[0].id
      }
    }

    // If neither worked, try as a channel ID anyway (in case it's a different format)
    response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=id&id=${identifier}&key=${YOUTUBE_API_KEY}`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        return data.items[0].id
      }
    }

    return null
  } catch (error) {
    console.error(`Error resolving channel identifier "${identifier}":`, error)
    return null
  }
}

/**
 * Get channel information by channel ID
 */
export async function getYouTubeChannelInfo(channelId: string): Promise<YouTubeChannelInfo | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not set')
  }

  try {
    // First resolve to actual channel ID if needed
    const resolvedId = await resolveChannelId(channelId)
    if (!resolvedId) {
      return null
    }

    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet&id=${resolvedId}&key=${YOUTUBE_API_KEY}`
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
  maxResults: number = 50,
  channelUrl?: string
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not set')
  }

  try {
    // First, resolve the channel identifier to an actual channel ID
    let resolvedChannelId = await resolveChannelId(channelId)
    
    // If resolution failed and we have a URL, try extracting from URL
    if (!resolvedChannelId && channelUrl) {
      // Try to extract handle or ID from URL
      const urlMatch = channelUrl.match(/youtube\.com\/(?:channel\/([^/?]+)|@([^/?]+)|c\/([^/?]+)|user\/([^/?]+))/)
      if (urlMatch) {
        const extractedId = urlMatch[1] || urlMatch[2] || urlMatch[3] || urlMatch[4]
        if (extractedId && extractedId !== channelId) {
          resolvedChannelId = await resolveChannelId(extractedId)
        }
      }
    }
    
    if (!resolvedChannelId) {
      throw new Error(`Could not resolve channel identifier: ${channelId}${channelUrl ? ` (URL: ${channelUrl})` : ''}. Please ensure it's a valid channel ID, handle, or username.`)
    }

    // Get the uploads playlist ID using the resolved channel ID
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${resolvedChannelId}&key=${YOUTUBE_API_KEY}`
    )

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || channelResponse.statusText
      throw new Error(`YouTube API error: ${errorMessage}`)
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

