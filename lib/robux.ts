import { prisma } from './db'
import { Platform } from '@prisma/client'

const ROBUX_PER_ELIGIBLE_VIDEO = 100
const TOTAL_BUDGET = 50000

export interface RobuxStats {
  totalEarned: number
  totalSpent: number
  remaining: number
  budgetExceeded: boolean
}

export interface ParticipantRobux {
  participantId: string
  displayName: string
  eligibleVideosCount: number
  robuxEarned: number
}

/**
 * Calculate Robux earned for a participant
 */
export async function calculateParticipantRobux(
  participantId: string
): Promise<ParticipantRobux> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, displayName: true },
  })

  if (!participant) {
    throw new Error('Participant not found')
  }

  const eligibleVideos = await prisma.videoEligibility.count({
    where: {
      video: {
        channel: {
          participantId,
        },
      },
      isEligible: true,
      eligibleRobux: ROBUX_PER_ELIGIBLE_VIDEO,
    },
  })

  const robuxEarned = eligibleVideos * ROBUX_PER_ELIGIBLE_VIDEO

  return {
    participantId: participant.id,
    displayName: participant.displayName,
    eligibleVideosCount: eligibleVideos,
    robuxEarned,
  }
}

/**
 * Calculate total Robux statistics
 */
export async function calculateTotalRobux(): Promise<RobuxStats> {
  const eligibleVideos = await prisma.videoEligibility.aggregate({
    where: {
      isEligible: true,
      eligibleRobux: ROBUX_PER_ELIGIBLE_VIDEO,
    },
    _sum: {
      eligibleRobux: true,
    },
  })

  const totalSpent = eligibleVideos._sum.eligibleRobux || 0
  const remaining = Math.max(0, TOTAL_BUDGET - totalSpent)
  const budgetExceeded = totalSpent > TOTAL_BUDGET

  return {
    totalEarned: totalSpent,
    totalSpent,
    remaining,
    budgetExceeded,
  }
}

/**
 * Get Robux breakdown by platform
 */
export async function getRobuxByPlatform(): Promise<{
  tiktok: { count: number; robux: number }
  youtube: { count: number; robux: number }
}> {
  const [tiktokCount, youtubeCount] = await Promise.all([
    prisma.videoEligibility.count({
      where: {
        isEligible: true,
        eligibleRobux: ROBUX_PER_ELIGIBLE_VIDEO,
        video: {
          platform: 'tiktok',
        },
      },
    }),
    prisma.videoEligibility.count({
      where: {
        isEligible: true,
        eligibleRobux: ROBUX_PER_ELIGIBLE_VIDEO,
        video: {
          platform: 'youtube',
        },
      },
    }),
  ])

  return {
    tiktok: {
      count: tiktokCount,
      robux: tiktokCount * ROBUX_PER_ELIGIBLE_VIDEO,
    },
    youtube: {
      count: youtubeCount,
      robux: youtubeCount * ROBUX_PER_ELIGIBLE_VIDEO,
    },
  }
}

