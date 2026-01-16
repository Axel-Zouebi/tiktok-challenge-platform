import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lookupDiscordUserInServer } from '@/lib/api/discord'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const participant = await prisma.participant.findUnique({
      where: { id },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    if (!participant.discordUsername) {
      return NextResponse.json(
        { error: 'Participant does not have a Discord username' },
        { status: 400 }
      )
    }

    const discordServerId = process.env.DISCORD_SERVER_ID
    if (!discordServerId) {
      return NextResponse.json(
        { error: 'Discord server ID not configured' },
        { status: 500 }
      )
    }

    const userInfo = await lookupDiscordUserInServer(
      participant.discordUsername,
      discordServerId
    )

    if (!userInfo) {
      return NextResponse.json(
        { error: 'Discord user not found in server' },
        { status: 404 }
      )
    }

    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: { discordAvatarUrl: userInfo.avatarUrl },
    })

    return NextResponse.json({
      success: true,
      participant: {
        id: updatedParticipant.id,
        discordUsername: updatedParticipant.discordUsername,
        discordAvatarUrl: updatedParticipant.discordAvatarUrl,
      },
    })
  } catch (error) {
    console.error('Error refreshing Discord avatar:', error)
    return NextResponse.json(
      { error: 'Failed to refresh Discord avatar' },
      { status: 500 }
    )
  }
}

