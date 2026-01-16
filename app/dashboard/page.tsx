"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoCard } from "@/components/VideoCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye, CheckCircle2, Coins, RefreshCw, Search, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ParticipantData {
  participant: {
    id: string
    discordUsername: string
    email?: string
  }
  channels: Array<{
    id: string
    platform: string
    handle?: string | null
    channelId?: string | null
    url?: string | null
  }>
  videos: Array<{
    id: string
    platform: string
    title: string
    description?: string | null
    publishedAt: string
    durationSeconds?: number | null
    views: number
    thumbnailUrl?: string | null
    url: string
    eligibility: {
      isEligible: boolean
      reasons: string[]
      eligibleRobux: number
    }
  }>
  totals: {
    totalViews: number
    eligiblePosts: number
    robuxEarned: number
  }
  dailyPosts: Array<{
    channelId: string
    platform: string
    handle?: string | null
    dailyCounts: Array<{
      date: string
      count: number
    }>
  }>
}

interface SearchResult {
  id: string
  discordUsername: string
  channels: Array<{
    platform: string
    handle?: string | null
    channelId?: string | null
  }>
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ParticipantData | null>(null)
  const [filter, setFilter] = useState<"all" | "eligible" | "not-eligible">("all")
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Check for initial participant ID from URL
  useEffect(() => {
    const id = searchParams.get("id")
    if (id) {
      setSelectedParticipantId(id)
      fetchParticipantData(id)
    }
  }, [searchParams])

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchParticipants = async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      const response = await fetch(`/api/participants/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error("Failed to search")
      }
      const result = await response.json()
      setSearchResults(result.participants || [])
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchParticipants(value)
    }, 300)
  }

  const handleSelectParticipant = (participant: SearchResult) => {
    setSearchQuery(participant.discordUsername)
    setSelectedParticipantId(participant.id)
    setShowResults(false)
    fetchParticipantData(participant.id)
    // Update URL without reload
    router.push(`/dashboard?id=${participant.id}`, { scroll: false })
  }

  const fetchParticipantData = async (participantId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/participants/${participantId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }
      const result = await response.json()
      setData(result)
      // Set search query to show the selected participant's name
      if (result.participant) {
        setSearchQuery(result.participant.discordUsername)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const clearSelection = () => {
    setSearchQuery("")
    setSelectedParticipantId(null)
    setData(null)
    setSearchResults([])
    router.push("/dashboard", { scroll: false })
  }

  const filteredVideos = data?.videos.filter((video) => {
    if (filter === "eligible") return video.eligibility.isEligible
    if (filter === "not-eligible") return !video.eligibility.isEligible
    return true
  }) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your videos</CardTitle>
            <CardDescription>
              Find a recap of all your videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative" ref={resultsRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search your name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowResults(true)
                    }
                  }}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-background border rounded-md shadow-lg max-h-96 overflow-y-auto">
                  {searchResults.map((participant) => (
                    <button
                      key={participant.id}
                      onClick={() => handleSelectParticipant(participant)}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <div className="font-medium">{participant.discordUsername}</div>
                      <div className="text-sm text-muted-foreground flex gap-2 mt-1">
                        {participant.channels.map((channel, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {channel.platform === "tiktok" ? "TikTok" : "YouTube"}: {channel.handle || channel.channelId || "N/A"}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showResults && searchQuery && searchResults.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-background border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                  No participants found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Section */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading dashboard...</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{data.participant.discordUsername}</h1>
                  <p className="text-muted-foreground">Participant Dashboard</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => fetchParticipantData(selectedParticipantId!)} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.totals.totalViews.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Eligible Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.totals.eligiblePosts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Robux Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {data.totals.robuxEarned.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Channels */}
            {data.channels.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.channels.map((channel) => (
                      <Badge key={channel.id} variant="outline" className="text-base px-3 py-1">
                        {channel.platform === "tiktok" ? "TikTok" : "YouTube"}:{" "}
                        {channel.handle || channel.channelId || "N/A"}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Posts Count */}
            {data.dailyPosts.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Daily Posts Count</CardTitle>
                  <CardDescription>
                    Track daily post count (max 3 eligible posts per day per account)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.dailyPosts.map((daily) => (
                      <div key={daily.channelId} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {daily.platform === "tiktok" ? "TikTok" : "YouTube"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {daily.handle || "Channel"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {daily.dailyCounts.map((count) => (
                            <div
                              key={count.date}
                              className={`p-2 rounded-md text-center ${
                                count.count >= 3
                                  ? "bg-red-100 dark:bg-red-900"
                                  : "bg-muted"
                              }`}
                            >
                              <div className="text-xs text-muted-foreground">
                                {new Date(count.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-lg font-semibold">{count.count}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator className="my-8" />

            {/* Videos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Videos</h2>
              </div>

              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All ({data.videos.length})</TabsTrigger>
                  <TabsTrigger value="eligible">
                    Eligible ({data.videos.filter((v) => v.eligibility.isEligible).length})
                  </TabsTrigger>
                  <TabsTrigger value="not-eligible">
                    Not Eligible ({data.videos.filter((v) => !v.eligibility.isEligible).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="mt-6">
                  {filteredVideos.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        No videos found
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredVideos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={{
                            ...video,
                            publishedAt: new Date(video.publishedAt),
                            eligibility: video.eligibility,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}

        {!loading && !data && selectedParticipantId && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Participant not found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

