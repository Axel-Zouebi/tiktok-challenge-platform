"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Platform } from "@prisma/client"
import { useRouter } from "next/navigation"

export interface LeaderboardEntry {
  rank: number
  participantId: string
  displayName: string
  discordUsername?: string
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Rank</TableHead>
          <TableHead>Participant</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead className="text-right">Total Views</TableHead>
          <TableHead className="text-right">Eligible Posts</TableHead>
          <TableHead className="text-right">Robux Earned</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          // If platform is specified, show only that platform's channel
          // Otherwise, show all channels
          const channelsToShow = platform 
            ? entry.channels.filter((c) => c.platform === platform)
            : entry.channels

          return (
            <TableRow 
              key={entry.participantId}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleRowClick(entry.participantId)}
            >
              <TableCell className="font-medium">#{entry.rank}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  {entry.discordAvatarUrl ? (
                    <img
                      src={entry.discordAvatarUrl}
                      alt={entry.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback to default Discord avatar if image fails to load
                        const target = e.target as HTMLImageElement
                        target.src = `https://cdn.discordapp.com/embed/avatars/${(entry.rank % 5)}.png`
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {entry.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{entry.displayName}</span>
                </div>
              </TableCell>
              <TableCell>
                {channelsToShow.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {channelsToShow.map((channel) => (
                      <div key={channel.platform} className="flex items-center gap-2">
                        <Badge variant="outline">
                          {channel.platform === "tiktok" ? "TikTok" : "YouTube"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {channel.handle || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {entry.totalViews.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">{entry.eligiblePosts}</TableCell>
              <TableCell className="text-right font-medium">
                {entry.robuxEarned.toLocaleString()}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

