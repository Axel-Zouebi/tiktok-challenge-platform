import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const cookieStore = cookies()
  const adminToken = cookieStore.get('admin_token')
  return adminToken?.value === 'authenticated'
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Delete the video (eligibility will be cascade deleted)
    await prisma.video.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
