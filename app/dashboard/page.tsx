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
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Eye, CheckCircle2, Coins, RefreshCw, Search, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getEligibilityChecklist } from "@/lib/eligibility"

interface ParticipantData {
  participant: {
    id: string
    discordUsername: string
    email?: string
    discordAvatarUrl?: string | null
  }
  channels: Array<never> // Empty array for backward compatibility
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
      overriddenByAdmin?: boolean | null
    }
  }>
  totals: {
    totalViews: number
    eligiblePosts: number
    robuxEarned: number
  }
  dailyPosts: Array<{
    channelId: string | null
    platform: string
    handle?: string | null
    dailyCounts: Array<{
      date: string
      count: number
    }>
  }>
  dailyData?: Array<{
    date: string
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
        overriddenByAdmin?: boolean | null
      }
    }>
    robuxEarned: number
    maxRobux: number
  }>
}

interface SearchResult {
  id: string
  discordUsername: string
  discordAvatarUrl?: string | null
  channels: Array<never> // Empty array for backward compatibility
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Section */}
        <div className="relative mb-6" ref={resultsRef}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="check other member's video"
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
            <div className="absolute z-50 w-full max-w-md mt-2 bg-background border rounded-md shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => handleSelectParticipant(participant)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {participant.discordAvatarUrl ? (
                      <img
                        src={participant.discordAvatarUrl}
                        alt={participant.discordUsername}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to default Discord avatar if image fails to load
                          const target = e.target as HTMLImageElement
                          target.src = `https://cdn.discordapp.com/embed/avatars/${(participant.id.charCodeAt(0) % 5)}.png`
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {participant.discordUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="font-medium">{participant.discordUsername}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute z-50 w-full max-w-md mt-2 bg-background border rounded-md shadow-lg p-4 text-center text-muted-foreground">
              No participants found
            </div>
          )}
        </div>

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
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {data.participant.discordAvatarUrl ? (
                      <img
                        src={data.participant.discordAvatarUrl}
                        alt={data.participant.discordUsername}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to default Discord avatar if image fails to load
                          const target = e.target as HTMLImageElement
                          target.src = `https://cdn.discordapp.com/embed/avatars/${(data.participant.id.charCodeAt(0) % 5)}.png`
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {data.participant.discordUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h1 className="text-3xl font-bold">{data.participant.discordUsername}</h1>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => fetchParticipantData(selectedParticipantId!)} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
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

            <Separator className="my-8" />

            {/* Daily Videos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Daily Progress</h2>
              </div>

              {data.dailyData && data.dailyData.length > 0 ? (
                <Tabs defaultValue={data.dailyData[0]?.date} className="w-full">
                  <div className="overflow-x-auto pb-2 -mx-4 px-4">
                    <TabsList className="inline-flex w-auto gap-2 h-auto">
                      {data.dailyData.map((day) => {
                        const date = new Date(day.date)
                        const isToday = date.toDateString() === new Date().toDateString()
                        const progressPercent = (day.robuxEarned / day.maxRobux) * 100
                        
                        return (
                          <TabsTrigger
                            key={day.date}
                            value={day.date}
                            className="flex flex-col items-center gap-2 px-5 py-4 min-w-[180px] h-auto"
                          >
                            <div className="flex items-center justify-center gap-2 w-full">
                              <span className="text-base font-semibold">
                                {isToday ? "Today" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                              {isToday && (
                                <Badge variant="outline" className="text-xs">Today</Badge>
                              )}
                            </div>
                            <div className="w-full space-y-1">
                              <Progress value={progressPercent} className="h-3" />
                              <div className="text-sm font-medium text-muted-foreground text-center">
                                {day.robuxEarned} / {day.maxRobux} robux
                              </div>
                            </div>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </div>

                  {data.dailyData.map((day) => {
                    const date = new Date(day.date)
                    const progressPercent = (day.robuxEarned / day.maxRobux) * 100
                    const TIKTOK_MIN_VIEWS = 5000
                    const YOUTUBE_MIN_VIEWS = 10000

                    return (
                      <TabsContent key={day.date} value={day.date} className="mt-6">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>
                                  {date.toLocaleDateString("en-US", { 
                                    weekday: "long", 
                                    year: "numeric", 
                                    month: "long", 
                                    day: "numeric" 
                                  })}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                  {day.videos.length} video{day.videos.length !== 1 ? 's' : ''} published
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold flex items-center gap-2">
                                  <Coins className="h-6 w-6" />
                                  {day.robuxEarned} / {day.maxRobux}
                                </div>
                                <div className="text-sm text-muted-foreground">robux earned</div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Progress value={progressPercent} className="h-3" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            {day.videos.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                No videos published on this day
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {day.videos.map((video) => {
                                  const checklist = getEligibilityChecklist(
                                    {
                                      platform: video.platform,
                                      title: video.title,
                                      description: video.description,
                                      durationSeconds: video.durationSeconds,
                                      views: video.views,
                                    },
                                    video.eligibility.overriddenByAdmin
                                  )
                                  const minViews = video.platform === 'tiktok' ? TIKTOK_MIN_VIEWS : YOUTUBE_MIN_VIEWS
                                  const viewsProgress = Math.min((video.views / minViews) * 100, 100)

                                  return (
                                    <Card key={video.id} className="overflow-hidden">
                                      <div className="flex flex-col md:flex-row">
                                        {video.thumbnailUrl && (
                                          <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
                                            <img
                                              src={video.thumbnailUrl}
                                              alt={video.title}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <CardHeader>
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg line-clamp-2 mb-2">
                                                  {video.title}
                                                </CardTitle>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                  <Badge variant={video.platform === "tiktok" ? "default" : "destructive"}>
                                                    {video.platform === "tiktok" ? "TikTok" : "YouTube"}
                                                  </Badge>
                                                  <Badge variant={video.eligibility.isEligible ? "default" : "secondary"}>
                                                    {video.eligibility.isEligible ? "✓ Eligible" : "Not Eligible"}
                                                  </Badge>
                                                  {video.eligibility.isEligible && (
                                                    <Badge variant="outline" className="gap-1">
                                                      <Coins className="h-3 w-3" />
                                                      {video.eligibility.eligibleRobux} robux
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <Link
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-shrink-0"
                                              >
                                                <Button variant="ghost" size="icon">
                                                  <Eye className="h-5 w-5" />
                                                </Button>
                                              </Link>
                                            </div>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="space-y-4">
                                              {/* Views Progress Bar */}
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                  <span className="font-medium">Views Progress</span>
                                                  <span className="text-muted-foreground">
                                                    {video.views.toLocaleString()} / {minViews.toLocaleString()}
                                                  </span>
                                                </div>
                                                <Progress value={viewsProgress} className="h-2" />
                                              </div>

                                              {/* Eligibility Checklist */}
                                              <div className="pt-2 border-t">
                                                <p className="text-xs font-medium mb-2">Eligibility Requirements:</p>
                                                <div className="space-y-1.5">
                                                  {checklist.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                                      {item.passed ? (
                                                        <span className="text-green-500 text-base">✓</span>
                                                      ) : (
                                                        <span className="text-red-500 text-base">✗</span>
                                                      )}
                                                      <div className="flex-1 min-w-0">
                                                        <span className={`font-medium ${item.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                                          {item.label}:
                                                        </span>
                                                        <span className="text-muted-foreground ml-1">
                                                          {item.value}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>

                                              {/* Status */}
                                              {video.eligibility.reasons.length > 0 && (
                                                <div className="pt-2 border-t">
                                                  <p className="text-xs font-medium mb-1">Status:</p>
                                                  <ul className="text-xs text-muted-foreground space-y-1">
                                                    {video.eligibility.reasons.map((reason, idx) => (
                                                      <li key={idx} className="flex items-start gap-1">
                                                        <span className="mt-0.5">•</span>
                                                        <span>{reason}</span>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          </CardContent>
                                        </div>
                                      </div>
                                    </Card>
                                  )
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No videos found
                  </CardContent>
                </Card>
              )}
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

