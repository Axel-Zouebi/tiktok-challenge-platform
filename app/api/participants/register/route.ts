import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken, extractYouTubeChannelId, extractTikTokHandle } from '@/lib/utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.union([
    z.string().email('Invalid email address'),
    z.literal(''),
  ]).optional(),
  tiktokHandle: z.string().optional().or(z.literal('')),
  youtubeChannel: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    const hasTikTok = data.tiktokHandle && data.tiktokHandle.trim().length > 0
    const hasYouTube = data.youtubeChannel && data.youtubeChannel.trim().length > 0
    return hasTikTok || hasYouTube
  },
  {
    message: 'At least one platform (TikTok or YouTube) is required',
    path: ['tiktokHandle'],
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log for debugging (remove in production)
    console.log('Registration request body:', body)
    
    const validated = registerSchema.parse(body)

    // Generate unique dashboard token
    const dashboardToken = generateToken()

    // Extract channel IDs/handles
    const tiktokHandle = validated.tiktokHandle && validated.tiktokHandle.trim() 
      ? extractTikTokHandle(validated.tiktokHandle.trim()) 
      : null
    const youtubeChannelId = validated.youtubeChannel && validated.youtubeChannel.trim()
      ? extractYouTubeChannelId(validated.youtubeChannel.trim())
      : null

    if (!tiktokHandle && !youtubeChannelId) {
      return NextResponse.json(
        { 
          error: 'Could not extract valid channel information. Please check your URLs/handles.',
          details: {
            tiktokInput: validated.tiktokHandle,
            youtubeInput: validated.youtubeChannel,
            tiktokExtracted: tiktokHandle,
            youtubeExtracted: youtubeChannelId,
          }
        },
        { status: 400 }
      )
    }

    // Create participant and channels
    const participant = await prisma.participant.create({
      data: {
        displayName: validated.displayName.trim(),
        email: validated.email && validated.email.trim() ? validated.email.trim() : null,
        dashboardToken,
        channels: {
          create: [
            ...(tiktokHandle ? [{
              platform: 'tiktok' as const,
              handle: tiktokHandle,
              url: `https://www.tiktok.com/@${tiktokHandle}`,
            }] : []),
            ...(youtubeChannelId ? [{
              platform: 'youtube' as const,
              channelId: youtubeChannelId,
              url: `https://www.youtube.com/channel/${youtubeChannelId}`,
            }] : []),
          ],
        },
      },
      include: {
        channels: true,
      },
    })

    // Get the base URL from the request (works in all environments)
    // Vercel sets x-forwarded-proto header, otherwise use the request URL
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const protocol = forwardedProto || (request.nextUrl.protocol?.replace(':', '') || 'http')
    const host = request.headers.get('host') || request.nextUrl.host
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
    const dashboardUrl = `${baseUrl}/p/${dashboardToken}`

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        dashboardToken: participant.dashboardToken,
      },
      dashboardUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }

    // Check if it's a Prisma error (database connection issue)
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          error: 'Database connection error. Please check your database configuration.',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        { status: 500 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to register participant',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

