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

export interface LeaderboardEntry {
  rank: number
  participantId: string
  displayName: string
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
  platform: Platform
}

export function LeaderboardTable({ entries, platform }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No participants yet
      </div>
    )
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
          const channel = entry.channels.find((c) => c.platform === platform)
          return (
            <TableRow key={entry.participantId}>
              <TableCell className="font-medium">#{entry.rank}</TableCell>
              <TableCell className="font-medium">{entry.displayName}</TableCell>
              <TableCell>
                {channel ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {platform === "tiktok" ? "TikTok" : "YouTube"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {channel.handle || "N/A"}
                    </span>
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

