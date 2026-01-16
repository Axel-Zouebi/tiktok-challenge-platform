import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const cookieStore = cookies()
  const adminToken = cookieStore.get('admin_token')
  return adminToken?.value === 'authenticated'
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform')
    const eligible = searchParams.get('eligible')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (platform) {
      where.platform = platform
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        eligibility: true,
        channel: {
          include: {
            participant: {
              select: {
                id: true,
                discordUsername: true,
              },
            },
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Filter by eligibility if specified
    let filteredVideos = videos
    if (eligible === 'true') {
      filteredVideos = videos.filter((v) => v.eligibility?.isEligible)
    } else if (eligible === 'false') {
      filteredVideos = videos.filter((v) => !v.eligibility?.isEligible)
    }

    const total = await prisma.video.count({ where })

    return NextResponse.json({
      videos: filteredVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

