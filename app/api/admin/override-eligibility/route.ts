import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { z } from 'zod'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const cookieStore = cookies()
  const adminToken = cookieStore.get('admin_token')
  return adminToken?.value === 'authenticated'
}

const overrideSchema = z.object({
  videoId: z.string().uuid(),
  isEligible: z.boolean(),
  reasons: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = overrideSchema.parse(body)

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: validated.videoId },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Update eligibility with admin override
    const eligibility = await prisma.videoEligibility.upsert({
      where: { videoId: validated.videoId },
      create: {
        videoId: validated.videoId,
        isEligible: validated.isEligible,
        reasons: validated.reasons || [`${validated.isEligible ? 'Eligible' : 'Not eligible'} (admin override)`],
        eligibleRobux: validated.isEligible ? 100 : 0,
        overriddenByAdmin: true,
        overriddenBy: 'admin',
        overriddenAt: new Date(),
      },
      update: {
        isEligible: validated.isEligible,
        reasons: validated.reasons || [`${validated.isEligible ? 'Eligible' : 'Not eligible'} (admin override)`],
        eligibleRobux: validated.isEligible ? 100 : 0,
        overriddenByAdmin: true,
        overriddenBy: 'admin',
        overriddenAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      eligibility,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error overriding eligibility:', error)
    return NextResponse.json(
      { error: 'Failed to override eligibility' },
      { status: 500 }
    )
  }
}

