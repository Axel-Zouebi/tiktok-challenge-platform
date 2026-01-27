"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Platform } from "@prisma/client"
import { useRouter } from "next/navigation"

export interface LeaderboardEntry {
  rank: number
  participantId: string
  discordUsername: string
  discordAvatarUrl?: string | null
  channels: Array<{
    platform: Platform
    handle?: string | null
    url?: string | null
  }>
  totalViews: number
  eligiblePosts: number
  robuxEarned: number
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  platform?: Platform
}

export function LeaderboardTable({ entries, platform }: LeaderboardTableProps) {
  const router = useRouter()

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No participants yet
      </div>
    )
  }

  const handleRowClick = (participantId: string) => {
    router.push(`/dashboard?id=${participantId}`)
  }

  const handleSeeMoreClick = (e: React.MouseEvent, participantId: string) => {
    e.stopPropagation()
    router.push(`/dashboard?id=${participantId}`)
  }

  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Rank</TableHead>
          <TableHead className="w-auto">Participant</TableHead>
          <TableHead className="text-right w-auto">Total Views</TableHead>
          <TableHead className="text-right w-auto">Robux Earned</TableHead>
          <TableHead className="text-right w-auto"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          return (
            <TableRow 
              key={entry.participantId}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleRowClick(entry.participantId)}
            >
              <TableCell className="font-medium text-left">#{entry.rank}</TableCell>
              <TableCell className="font-medium text-left">
                <div className="flex items-center gap-3">
                  {entry.discordAvatarUrl ? (
                    <img
                      src={entry.discordAvatarUrl}
                      alt={entry.discordUsername}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback to default Discord avatar if image fails to load
                        const target = e.target as HTMLImageElement
                        target.src = `https://cdn.discordapp.com/embed/avatars/${(entry.rank % 5)}.png`
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {entry.discordUsername.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{entry.discordUsername}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {entry.totalViews.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {entry.robuxEarned.toLocaleString()}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Button
                  onClick={(e) => handleSeeMoreClick(e, entry.participantId)}
                  className="bg-black text-white rounded-full px-3 py-2 hover:bg-black/90"
                >
                  See videos
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

