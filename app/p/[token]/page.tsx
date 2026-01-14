"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoCard } from "@/components/VideoCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, CheckCircle2, Coins, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ParticipantData {
  participant: {
    id: string
    displayName: string
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

export default function ParticipantDashboardPage() {
  const params = useParams()
  const token = params.token as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ParticipantData | null>(null)
  const [filter, setFilter] = useState<"all" | "eligible" | "not-eligible">("all")

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/participants/${token}`)
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }
      const result = await response.json()
      setData(result)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dashboard Not Found</CardTitle>
            <CardDescription>
              The dashboard link is invalid or expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/join">Register for the Challenge</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredVideos = data.videos.filter((video) => {
    if (filter === "eligible") return video.eligibility.isEligible
    if (filter === "not-eligible") return !video.eligibility.isEligible
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{data.participant.displayName}</h1>
              <p className="text-muted-foreground">Participant Dashboard</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
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
              <CardTitle>Your Channels</CardTitle>
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
                Track your daily post count (max 3 eligible posts per day per account)
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
            <h2 className="text-2xl font-bold">Your Videos</h2>
            <div className="flex gap-2">
              {data.videos.length === 0 && (
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/participants/${token}/add-test-video`, {
                        method: 'POST',
                      })
                      const result = await response.json()
                      if (response.ok) {
                        toast({
                          title: "Success!",
                          description: "Test video added. Refreshing...",
                        })
                        setTimeout(() => fetchData(), 1000)
                      } else {
                        toast({
                          title: "Error",
                          description: result.error || "Failed to add test video",
                          variant: "destructive",
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to add test video",
                        variant: "destructive",
                      })
                    }
                  }}
                  variant="default"
                  size="sm"
                >
                  Add Test Video
                </Button>
              )}
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
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
      </div>
    </div>
  )
}

