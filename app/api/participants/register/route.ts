import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractYouTubeChannelId, extractTikTokHandle } from '@/lib/utils'
import { validateDiscordUserExists, normalizeDiscordUsername } from '@/lib/api/discord'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.union([
    z.string().email('Invalid email address'),
    z.literal(''),
  ]).optional(),
  discordUsername: z.string().min(1, 'Discord username is required'),
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
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          details: jsonError instanceof Error ? jsonError.message : 'Failed to parse request body'
        },
        { status: 400 }
      )
    }
    
    // Log for debugging (remove in production)
    console.log('Registration request body:', body)
    
    const validated = registerSchema.parse(body)

    // Validate and normalize Discord username
    const discordUsername = normalizeDiscordUsername(validated.discordUsername)
    const discordServerId = process.env.DISCORD_SERVER_ID
    
    let discordValidation
    try {
      discordValidation = await validateDiscordUserExists(discordUsername, discordServerId)
    } catch (discordError) {
      console.error('Discord validation error:', discordError)
      // If Discord validation fails due to API error, still allow registration
      // but log the error for debugging
      discordValidation = {
        exists: true, // Fallback to allowing registration
        avatarUrl: undefined,
      }
    }
    
    if (!discordValidation.exists) {
      return NextResponse.json(
        { 
          error: discordValidation.error || 'Invalid Discord username',
          details: [{
            field: 'discordUsername',
            message: discordValidation.error || 'Invalid Discord username',
          }]
        },
        { status: 400 }
      )
    }

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
        displayName: discordUsername, // Use Discord username as display name
        email: validated.email && validated.email.trim() ? validated.email.trim() : null,
        discordUsername,
        discordAvatarUrl: discordValidation.avatarUrl ?? null,
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
    const dashboardUrl = `${baseUrl}/dashboard?id=${participant.id}`

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        discordUsername: participant.discordUsername,
      },
      dashboardUrl,
      participantId: participant.id,
    })
  } catch (error) {
    // Log full error details for debugging
    console.error('Registration error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

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

    // Check if it's a Prisma error
    if (error && typeof error === 'object') {
      const prismaError = error as any
      
      // Prisma connection errors
      if (prismaError.code === 'P1001' || prismaError.code === 'P1000') {
        console.error('Database connection error:', prismaError)
        return NextResponse.json(
          { 
            error: 'Database connection error. Please check your database configuration.',
            details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined
          },
          { status: 500 }
        )
      }
      
      // Prisma unique constraint errors
      if (prismaError.code === 'P2002') {
        console.error('Unique constraint error:', prismaError)
        const field = prismaError.meta?.target?.[0] || 'field'
        return NextResponse.json(
          { 
            error: `A participant with this ${field} already exists.`,
            details: [{
              field,
              message: `This ${field} is already registered.`
            }]
          },
          { status: 409 }
        )
      }
      
      // Other Prisma errors
      if (prismaError.code && prismaError.code.startsWith('P')) {
        console.error('Prisma error:', prismaError)
        return NextResponse.json(
          { 
            error: 'Database error occurred',
            details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined
          },
          { status: 500 }
        )
      }
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { 
        error: 'Failed to register participant',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    )
  }
}

