import { Video, Platform, VideoEligibility } from '@prisma/client'

const HASHTAG = '#trythemoon'
const MIN_DURATION_SECONDS = 15
const TIKTOK_MIN_VIEWS = 5000
const YOUTUBE_MIN_VIEWS = 10000
const MAX_POSTS_PER_DAY = 3

export interface EligibilityResult {
  isEligible: boolean
  reasons: string[]
  eligibleRobux: number
}

/**
 * Check if text contains the required hashtag (case-insensitive)
 */
function hasHashtag(text: string): boolean {
  return text.toLowerCase().includes(HASHTAG.toLowerCase())
}

/**
 * Check if video meets duration requirement
 */
function meetsDurationRequirement(durationSeconds: number | null): boolean {
  return durationSeconds !== null && durationSeconds >= MIN_DURATION_SECONDS
}

/**
 * Check if video meets views threshold for platform
 */
function meetsViewsRequirement(platform: Platform, views: number): boolean {
  if (platform === 'tiktok') {
    return views >= TIKTOK_MIN_VIEWS
  } else if (platform === 'youtube') {
    return views >= YOUTUBE_MIN_VIEWS
  }
  return false
}

/**
 * Check eligibility for a single video (without daily limit)
 */
export function checkVideoEligibility(
  video: Video,
  overriddenByAdmin?: boolean
): EligibilityResult {
  const reasons: string[] = []
  let isEligible = true

  // Admin override takes precedence
  if (overriddenByAdmin === true) {
    return {
      isEligible: true,
      reasons: ['Eligible (admin override)'],
      eligibleRobux: 100,
    }
  }

  if (overriddenByAdmin === false) {
    return {
      isEligible: false,
      reasons: ['Not eligible (admin override)'],
      eligibleRobux: 0,
    }
  }

  // Check duration
  if (!meetsDurationRequirement(video.durationSeconds)) {
    isEligible = false
    reasons.push(`Duration < ${MIN_DURATION_SECONDS} seconds`)
  }

  // Check hashtag
  const text = `${video.title} ${video.description || ''}`.toLowerCase()
  if (!hasHashtag(text)) {
    isEligible = false
    reasons.push(`Missing hashtag ${HASHTAG}`)
  }

  // Check views threshold
  const minViews = video.platform === 'tiktok' ? TIKTOK_MIN_VIEWS : YOUTUBE_MIN_VIEWS
  if (!meetsViewsRequirement(video.platform, video.views)) {
    isEligible = false
    reasons.push(`Views < ${minViews.toLocaleString()}`)
  }

  return {
    isEligible,
    reasons: reasons.length > 0 ? reasons : ['Eligible'],
    eligibleRobux: isEligible ? 100 : 0,
  }
}

/**
 * Apply daily limit rule: only first 3 eligible posts per day per account
 * Returns updated eligibility results with daily limit applied
 */
export function applyDailyLimit(
  videos: (Video & { eligibility: VideoEligibility | null })[],
  eligibilityResults: Map<string, EligibilityResult>
): Map<string, EligibilityResult> {
  // Group videos by channel and date
  const dailyCounts = new Map<string, number>() // key: channelId-date, value: count

  // Sort videos by published date (oldest first)
  const sortedVideos = [...videos].sort(
    (a, b) => a.publishedAt.getTime() - b.publishedAt.getTime()
  )

  const updatedResults = new Map(eligibilityResults)

  for (const video of sortedVideos) {
    const dateKey = `${video.channelId}-${video.publishedAt.toISOString().split('T')[0]}`
    const result = eligibilityResults.get(video.id)

    if (result?.isEligible) {
      const currentCount = dailyCounts.get(dateKey) || 0

      if (currentCount >= MAX_POSTS_PER_DAY) {
        // Exceeded daily limit - mark as not eligible
        updatedResults.set(video.id, {
          isEligible: false,
          reasons: [...result.reasons, `Daily limit exceeded (max ${MAX_POSTS_PER_DAY}/day)`],
          eligibleRobux: 0,
        })
      } else {
        // Count this video
        dailyCounts.set(dateKey, currentCount + 1)
      }
    }
  }

  return updatedResults
}

/**
 * Check eligibility for multiple videos, applying all rules including daily limit
 */
export function checkEligibilityForVideos(
  videos: (Video & { eligibility: VideoEligibility | null })[]
): Map<string, EligibilityResult> {
  // First, check basic eligibility for each video
  const results = new Map<string, EligibilityResult>()

  for (const video of videos) {
    const overriddenByAdmin =
      video.eligibility?.overriddenByAdmin !== undefined
        ? video.eligibility.overriddenByAdmin
        : undefined

    const result = checkVideoEligibility(video, overriddenByAdmin)
    results.set(video.id, result)
  }

  // Then apply daily limit
  return applyDailyLimit(videos, results)
}

