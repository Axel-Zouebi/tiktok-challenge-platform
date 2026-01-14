import { LeaderboardTable, LeaderboardEntry } from "@/components/LeaderboardTable"
import { GameIcon } from "@/components/GameIcon"
import { RobuxIcon } from "@/components/RobuxIcon"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
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
  const [leaderboard, robuxStats] = await Promise.all([
    getLeaderboard(),
    getRobuxStats(),
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Parallax Background */}
      <div className="relative w-full overflow-hidden">
        {/* Parallax Background Image */}
        {/* 
          TO ADD YOUR BACKGROUND IMAGE:
          1. Place your image in the /public folder (e.g., /public/hero-background.jpg)
          2. Update the backgroundImage URL below to match your filename
          3. Remove or comment out the placeholder gradient div below
          4. Recommended image dimensions: 1920x1080 or wider (16:9 aspect ratio works well)
          5. The image will be automatically darkened with the overlay below for text readability
        */}
        <div 
          className="parallax-bg absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/hero-background.webp")',
          }}
        >
        </div>
        
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-4 pt-12 pb-8 md:pt-16 md:pb-10">
          {/* Game Icon above title */}
          <div className="mb-4 flex justify-center">
            <GameIcon />
          </div>

          {/* Title centered in the middle of the page */}
          <div className="mb-2 flex justify-center">
            <div className="flex items-center gap-3">
              {/* Robux Icon */}
              {/* 
                TO ADD YOUR ROBUX ICON:
                1. Place your Robux icon image in the /public folder (e.g., /public/robux-icon.png)
                2. The component will automatically use /robux-icon.png by default
                3. If you use a different filename, update the src prop in the RobuxIcon component below
                4. Recommended size: 48x48px to 64x64px (square aspect ratio works best)
                5. Supported formats: PNG, SVG, WebP, or JPG
                6. The placeholder (R$ icon) will automatically disappear once your image loads successfully
              */}
              <RobuxIcon />
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                50k Robux Giveaway
              </h1>
            </div>
          </div>

          {/* Progress bar and remaining text below title */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm space-y-2">
              <Progress value={Math.min(100, ((robuxStats.totalSpent || 0) / 50000) * 100)} className="h-2" />
              <div className="text-sm text-center text-white">
                <span className="text-white/80">Remaining </span>
                <span className={`font-medium ${robuxStats.budgetExceeded ? "text-red-300" : "text-white"}`}>
                  {(robuxStats.remaining || 50000).toLocaleString()} / 50,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboards Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6 flex flex-col items-center">
          <h2 className="text-3xl font-bold">Leaderboard</h2>
          <p className="text-muted-foreground text-center">
            Ranked by total views from eligible videos across TikTok and YouTube
          </p>
          <Card className="w-full max-w-4xl">
            <CardContent className="pt-6">
              <LeaderboardTable entries={leaderboard} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

