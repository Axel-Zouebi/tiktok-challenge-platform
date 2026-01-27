"use client"

import { useState } from "react"
import { LeaderboardTable, LeaderboardEntry } from "@/components/LeaderboardTable"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[]
}

export function LeaderboardSection({ entries }: LeaderboardSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEntries = searchQuery
    ? entries.filter((entry) =>
        entry.discordUsername.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-2 flex flex-col items-center">
        <h2 className="text-3xl font-bold">Leaderboard</h2>
        <p className="text-muted-foreground text-center">
          Ranked by total views from eligible videos across TikTok and YouTube
        </p>
        <div className="w-full max-w-4xl pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Find your rank | Search your Discord Username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Card className="w-full max-w-4xl">
          <CardContent className="pt-6">
            <LeaderboardTable entries={filteredEntries} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
