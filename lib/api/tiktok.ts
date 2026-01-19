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

/**
 * TikTok oEmbed response interface
 * Some fields may be optional depending on the video
 */
export interface TikTokOEmbedResponse {
  version: string
  type: string
  title?: string
  author_name?: string
  author_url?: string
  author_id?: string
  thumbnail_url?: string
  thumbnail_width?: number
  thumbnail_height?: number
  html?: string
  width?: number
  height?: number
  video_id?: string
  duration?: number
  embed_product_id?: string
  embed_product_type?: string
}

/**
 * Fetch TikTok video metadata using oEmbed API
 * This provides thumbnail, title, author, and embed HTML
 */
export async function fetchTikTokVideoByUrl(videoUrl: string): Promise<TikTokOEmbedResponse | null> {
  try {
    // Normalize the URL - ensure it's a full TikTok URL
    let normalizedUrl = videoUrl.trim()
    
    // If it's a short URL (vm.tiktok.com), we might need to resolve it first
    // For now, try the oEmbed API directly
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(normalizedUrl)}`
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.error(`TikTok oEmbed API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json() as TikTokOEmbedResponse
    return data
  } catch (error) {
    console.error('Error fetching TikTok video metadata:', error)
    return null
  }
}

/**
 * Scrape TikTok video page for additional metadata (views, duration)
 * TikTok oEmbed doesn't provide these, so we need to scrape the page
 */
export async function scrapeTikTokVideoMetadata(videoUrl: string): Promise<{
  views: number
  durationSeconds: number | null
} | null> {
  try {
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch TikTok page: ${response.status}`)
      return null
    }

    const html = await response.text()
    
    // Try to extract data from JSON-LD or script tags
    // TikTok often embeds video data in a script tag with id="__UNIVERSAL_DATA_FOR_REHYDRATION__"
    let views = 0
    let durationSeconds: number | null = null

    // Method 1: Look for JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/)
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1])
        if (jsonLd.duration) {
          durationSeconds = parseInt(jsonLd.duration, 10)
        }
        if (jsonLd.interactionStatistic?.userInteractionCount) {
          views = parseInt(jsonLd.interactionStatistic.userInteractionCount, 10)
        }
      } catch (e) {
        // JSON parse failed, continue to other methods
      }
    }

    // Method 2: Look for TikTok's universal data script
    const universalDataMatch = html.match(/<script[^>]*id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/)
    if (universalDataMatch) {
      try {
        const data = JSON.parse(universalDataMatch[1])
        // Navigate through TikTok's data structure
        const videoData = data?.defaultScope?.webapp?.video?.detail?.video || 
                         data?.__DEFAULT_SCOPE__?.webapp?.video?.detail?.video ||
                         data?.webapp?.video?.detail?.video
        
        if (videoData) {
          // Extract views
          if (videoData.stats?.playCount !== undefined) {
            views = parseInt(String(videoData.stats.playCount), 10) || 0
          } else if (videoData.playCount !== undefined) {
            views = parseInt(String(videoData.playCount), 10) || 0
          }
          
          // Extract duration
          if (videoData.duration !== undefined) {
            durationSeconds = parseInt(String(videoData.duration), 10) || null
          } else if (videoData.videoMeta?.duration !== undefined) {
            durationSeconds = parseInt(String(videoData.videoMeta.duration), 10) || null
          }
        }
      } catch (e) {
        // JSON parse failed, continue to meta tag method
      }
    }

    // Method 3: Look for meta tags
    if (views === 0) {
      const viewCountMatch = html.match(/<meta[^>]*property=["']og:video:view_count["'][^>]*content=["'](\d+)["']/i) ||
                                html.match(/<meta[^>]*name=["']video:view_count["'][^>]*content=["'](\d+)["']/i)
      if (viewCountMatch) {
        views = parseInt(viewCountMatch[1], 10) || 0
      }
    }

    if (durationSeconds === null) {
      const durationMatch = html.match(/<meta[^>]*property=["']video:duration["'][^>]*content=["'](\d+)["']/i) ||
                           html.match(/<meta[^>]*name=["']video:duration["'][^>]*content=["'](\d+)["']/i) ||
                           html.match(/duration["']?\s*:\s*(\d+)/i)
      if (durationMatch) {
        durationSeconds = parseInt(durationMatch[1], 10) || null
      }
    }

    // Method 4: Look for inline data attributes or window.__data
    if (views === 0 || durationSeconds === null) {
      const windowDataMatch = html.match(/window\.__data\s*=\s*({[\s\S]*?});/) ||
                             html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/)
      if (windowDataMatch) {
        try {
          const windowData = JSON.parse(windowDataMatch[1])
          // Try to find views and duration in various possible locations
          if (windowData.video?.stats?.playCount !== undefined && views === 0) {
            views = parseInt(String(windowData.video.stats.playCount), 10) || 0
          }
          if (windowData.video?.duration !== undefined && durationSeconds === null) {
            durationSeconds = parseInt(String(windowData.video.duration), 10) || null
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // Method 5: Look for any script tag containing video data (more flexible)
    if (views === 0 || durationSeconds === null) {
      // Try to find any large JSON object in script tags that might contain video data
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g
      let match: RegExpExecArray | null
      while ((match = scriptRegex.exec(html)) !== null) {
        const scriptContent = match[1]
        // Look for patterns that suggest video metadata
        if (scriptContent.includes('playCount') || scriptContent.includes('duration') || scriptContent.includes('viewCount')) {
          try {
            // Try to extract JSON objects
            const jsonMatches = scriptContent.match(/\{[^{}]*(?:playCount|viewCount|duration)[^{}]*\}/g)
            if (jsonMatches) {
              for (const jsonStr of jsonMatches) {
                try {
                  const obj = JSON.parse(jsonStr)
                  // Recursively search for views and duration
                  const findValue = (obj: any, keys: string[]): any => {
                    if (!obj || typeof obj !== 'object') return null
                    for (const key of keys) {
                      if (obj[key] !== undefined) return obj[key]
                    }
                    for (const value of Object.values(obj)) {
                      if (typeof value === 'object') {
                        const found = findValue(value, keys)
                        if (found !== null) return found
                      }
                    }
                    return null
                  }
                  
                  if (views === 0) {
                    const foundViews = findValue(obj, ['playCount', 'viewCount', 'views', 'play_count', 'view_count'])
                    if (foundViews !== null) {
                      views = parseInt(String(foundViews), 10) || 0
                    }
                  }
                  
                  if (durationSeconds === null) {
                    const foundDuration = findValue(obj, ['duration', 'videoDuration', 'video_duration'])
                    if (foundDuration !== null) {
                      durationSeconds = parseInt(String(foundDuration), 10) || null
                    }
                  }
                  
                  if (views > 0 && durationSeconds !== null) break
                } catch (e) {
                  // Continue to next match
                }
              }
            }
          } catch (e) {
            // Continue to next script tag
          }
        }
      }
    }

    // Log what we found for debugging
    if (views > 0 || durationSeconds !== null) {
      console.log(`✅ Scraped TikTok metadata: views=${views}, duration=${durationSeconds}s`)
    } else {
      console.warn(`⚠️ Could not scrape views/duration from TikTok page: ${videoUrl}`)
    }

    return {
      views: views || 0,
      durationSeconds,
    }
  } catch (error) {
    console.error('Error scraping TikTok video metadata:', error)
    return null
  }
}

/**
 * Convert TikTok oEmbed response to database format
 * Also includes scraped metadata for views and duration
 */
export function tiktokOEmbedToDbFormat(
  oembed: TikTokOEmbedResponse,
  videoId: string,
  videoUrl: string,
  scrapedMetadata?: { views: number; durationSeconds: number | null } | null
) {
  return {
    platform: 'tiktok' as const,
    externalVideoId: videoId,
    url: videoUrl,
    title: oembed.title || `TikTok Video ${videoId}`,
    description: oembed.author_name ? `Video from @${oembed.author_name}` : '',
    publishedAt: new Date(), // oEmbed doesn't provide publish date
    durationSeconds: scrapedMetadata?.durationSeconds ?? oembed.duration ?? null,
    views: scrapedMetadata?.views ?? 0,
    thumbnailUrl: oembed.thumbnail_url || null,
  }
}

