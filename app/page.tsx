import { LeaderboardTable, LeaderboardEntry } from "@/components/LeaderboardTable"
import { RobuxCard } from "@/components/RobuxCard"
import { CCUPoller } from "@/components/CCUPoller"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { headers } from "next/headers"

function getBaseUrl(): string {
  // Try environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Try to get from headers (works in server components)
  try {
    const headersList = headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    if (host) {
      return `${protocol}://${host}`
    }
  } catch {
    // Fallback if headers not available
  }
  
  // Final fallback
  return "http://localhost:3000"
}

async function getLeaderboard(platform: "tiktok" | "youtube"): Promise<LeaderboardEntry[]> {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/api/leaderboard?platform=${platform}`, {
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.entries || []
  } catch {
    return []
  }
}

async function getRobuxStats() {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/api/robux`, { cache: "no-store" })
    if (!res.ok) return { totalSpent: 0, remaining: 50000, budgetExceeded: false }
    return await res.json()
  } catch {
    return { totalSpent: 0, remaining: 50000, budgetExceeded: false }
  }
}

export default async function HomePage() {
  const [tiktokLeaderboard, youtubeLeaderboard, robuxStats] = await Promise.all([
    getLeaderboard("tiktok"),
    getLeaderboard("youtube"),
    getRobuxStats(),
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              One Last Stand
            </h1>
            <h2 className="text-2xl md:text-3xl text-muted-foreground">
              Creator Challenge
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Create content with <span className="font-semibold">#trythemoon</span> and earn Robux!
              Challenge starts January 24.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/join">Join the Challenge</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/rules">View Rules</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <RobuxCard
            totalSpent={robuxStats.totalSpent || 0}
            remaining={robuxStats.remaining || 50000}
            budgetExceeded={robuxStats.budgetExceeded || false}
          />
          <CCUPoller />
        </div>

        <Separator className="my-12" />

        {/* Leaderboards */}
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">Leaderboards</h2>
            <Tabs defaultValue="tiktok" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="tiktok">TikTok</TabsTrigger>
                <TabsTrigger value="youtube">YouTube</TabsTrigger>
              </TabsList>
              <TabsContent value="tiktok" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>TikTok Leaderboard</CardTitle>
                    <CardDescription>
                      Ranked by total views from eligible videos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeaderboardTable entries={tiktokLeaderboard} platform="tiktok" />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="youtube" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>YouTube Leaderboard</CardTitle>
                    <CardDescription>
                      Ranked by total views from eligible videos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeaderboardTable entries={youtubeLeaderboard} platform="youtube" />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

