import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, XCircle, Clock, Eye, Hash } from "lucide-react"

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Challenge Rules
          </h1>
          <p className="text-lg text-muted-foreground">
            One Last Stand Creator Challenge - #trythemoon
          </p>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Challenge Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Game:</p>
                <p>One Last Stand (Roblox)</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Start Date:</p>
                <p>January 24</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Reward:</p>
                <p>100 Robux per eligible post</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Total Budget:</p>
                <p>50,000 Robux</p>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Requirements</CardTitle>
              <CardDescription>
                Your video must meet ALL of these requirements to be eligible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Gameplay Content</p>
                  <p className="text-sm text-muted-foreground">
                    Must be a gameplay clip of One Last Stand only
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Minimum Duration</p>
                  <p className="text-sm text-muted-foreground">
                    At least 15 seconds long
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Required Hashtag</p>
                  <p className="text-sm text-muted-foreground">
                    Must include <Badge variant="outline">#trythemoon</Badge> in title or description
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Views Threshold</p>
                  <p className="text-sm text-muted-foreground">
                    TikTok: ≥ 5,000 views | YouTube: ≥ 10,000 views
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Daily Limit</p>
                  <p className="text-sm text-muted-foreground">
                    Maximum 3 eligible posts per day per account
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Prohibited Content</p>
                  <p className="text-sm text-muted-foreground">
                    Must NOT include insults, hateful, or abusive content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span>1 TikTok post</span>
                <Badge>100 Robux</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span>1 YouTube post</span>
                <Badge>100 Robux</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span>10 eligible TikTok videos</span>
                <Badge>1,000 Robux</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Platform Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                <strong>Primary Platform:</strong> TikTok
              </p>
              <p className="text-sm text-muted-foreground">
                If you cannot post on TikTok, you can post on YouTube instead. Both platforms are eligible for rewards.
              </p>
            </CardContent>
          </Card>

          {/* Account Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Account Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Participants may register up to <strong>2 accounts</strong> if they want.
              </p>
              <p className="text-sm text-muted-foreground">
                Each account is subject to the daily limit of 3 eligible posts per day.
              </p>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✓ Eligible Video
                </p>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• 20-second One Last Stand gameplay clip</li>
                  <li>• Includes #trythemoon in description</li>
                  <li>• Has 8,000 views on TikTok</li>
                  <li>• No offensive content</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
                <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  ✗ Not Eligible
                </p>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• 10-second clip (too short)</li>
                  <li>• Missing #trythemoon hashtag</li>
                  <li>• Only 3,000 views (below threshold)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button asChild size="lg">
              <Link href="/join">Join the Challenge</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

