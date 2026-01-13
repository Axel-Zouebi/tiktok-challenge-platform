const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET

export interface TikTokVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  duration: number // seconds
  viewCount: number
  thumbnailUrl: string
  url: string
}

export interface TikTokUserInfo {
  username: string
  displayName: string
  avatarUrl?: string
}

/**
 * TikTok API Provider Interface
 * Allows swapping implementations (official API vs manual submission)
 */
export interface TikTokProvider {
  getUserInfo(username: string): Promise<TikTokUserInfo | null>
  getUserVideos(username: string, maxResults?: number): Promise<TikTokVideo[]>
}

/**
 * Official TikTok API Implementation
 * Note: TikTok API requires OAuth and approval process
 * This is a placeholder structure that can be implemented when credentials are available
 */
class OfficialTikTokProvider implements TikTokProvider {
  private accessToken?: string

  async getUserInfo(username: string): Promise<TikTokUserInfo | null> {
    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      throw new Error('TikTok API credentials not configured')
    }

    // TODO: Implement TikTok API OAuth flow
    // This requires:
    // 1. OAuth authorization
    // 2. Access token retrieval
    // 3. API calls to TikTok Research API or Business API

    throw new Error('TikTok API not yet implemented - requires OAuth setup')
  }

  async getUserVideos(username: string, maxResults: number = 50): Promise<TikTokVideo[]> {
    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      throw new Error('TikTok API credentials not configured')
    }

    // TODO: Implement video fetching from TikTok API
    // Filter by hashtag #trythemoon

    throw new Error('TikTok API not yet implemented - requires OAuth setup')
  }
}

/**
 * Manual Submission Provider (Fallback)
 * For when official API is not available, participants can submit video URLs manually
 */
class ManualTikTokProvider implements TikTokProvider {
  async getUserInfo(username: string): Promise<TikTokUserInfo | null> {
    // Return basic info from username
    return {
      username,
      displayName: username,
    }
  }

  async getUserVideos(username: string): Promise<TikTokVideo[]> {
    // Manual submission - return empty array
    // Videos will be added via admin or participant submission form
    return []
  }
}

// Export singleton instance
let tiktokProvider: TikTokProvider

export function getTikTokProvider(): TikTokProvider {
  if (!tiktokProvider) {
    // Try official API first, fallback to manual
    if (TIKTOK_CLIENT_KEY && TIKTOK_CLIENT_SECRET) {
      try {
        tiktokProvider = new OfficialTikTokProvider()
      } catch {
        tiktokProvider = new ManualTikTokProvider()
      }
    } else {
      tiktokProvider = new ManualTikTokProvider()
    }
  }
  return tiktokProvider
}

/**
 * Fetch videos from TikTok user
 * Uses the configured provider (official API or manual)
 */
export async function fetchTikTokVideos(
  username: string,
  maxResults: number = 50
): Promise<TikTokVideo[]> {
  const provider = getTikTokProvider()
  return provider.getUserVideos(username, maxResults)
}

/**
 * Get TikTok user info
 */
export async function getTikTokUserInfo(username: string): Promise<TikTokUserInfo | null> {
  const provider = getTikTokProvider()
  return provider.getUserInfo(username)
}

/**
 * Convert TikTok video to database format
 */
export function tiktokVideoToDbFormat(video: TikTokVideo, channelId: string) {
  return {
    platform: 'tiktok' as const,
    externalVideoId: video.id,
    url: video.url,
    title: video.title,
    description: video.description,
    publishedAt: new Date(video.publishedAt),
    durationSeconds: video.duration,
    views: video.viewCount,
    thumbnailUrl: video.thumbnailUrl,
  }
}

/**
 * Parse TikTok video URL to extract video ID
 */
export function parseTikTokVideoUrl(url: string): string | null {
  // TikTok URL formats:
  // https://www.tiktok.com/@username/video/1234567890
  // https://vm.tiktok.com/xxxxx/
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

