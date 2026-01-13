"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EligibilityBadge } from "@/components/EligibilityBadge"
import { RobuxCard } from "@/components/RobuxCard"
import { Separator } from "@/components/ui/separator"
import { Eye, RefreshCw, Download, LogOut } from "lucide-react"
import Link from "next/link"

interface Video {
  id: string
  platform: string
  title: string
  views: number
  publishedAt: string
  url: string
  eligibility: {
    id: string
    isEligible: boolean
    reasons: string[]
    eligibleRobux: number
    overriddenByAdmin: boolean
  } | null
  channel: {
    platform: string
    handle?: string | null
    participant: {
      displayName: string
    }
  }
}

export default function AdminPage() {
  const { toast } = useToast()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [robuxStats, setRobuxStats] = useState({
    totalSpent: 0,
    remaining: 50000,
    budgetExceeded: false,
  })
  const [filter, setFilter] = useState<"all" | "eligible" | "not-eligible">("all")

  useEffect(() => {
    // Check if already authenticated
    fetch("/api/admin/videos")
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true)
          loadData()
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setAuthenticated(true)
        loadData()
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        })
      } else {
        toast({
          title: "Login failed",
          description: "Invalid password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    setAuthenticated(false)
    setVideos([])
  }

  const loadData = async () => {
    try {
      const [videosRes, robuxRes] = await Promise.all([
        fetch("/api/admin/videos"),
        fetch("/api/robux"),
      ])

      if (videosRes.ok) {
        const videosData = await videosRes.json()
        setVideos(videosData.videos || [])
      }

      if (robuxRes.ok) {
        const robuxData = await robuxRes.json()
        setRobuxStats(robuxData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    }
  }

  const handleOverrideEligibility = async (
    videoId: string,
    isEligible: boolean,
    reasons?: string[]
  ) => {
    try {
      const response = await fetch("/api/admin/override-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          isEligible,
          reasons: reasons || [`${isEligible ? "Eligible" : "Not eligible"} (admin override)`],
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Eligibility updated",
        })
        loadData()
      } else {
        throw new Error("Update failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update eligibility",
        variant: "destructive",
      })
    }
  }

  const exportCSV = () => {
    const headers = [
      "Video ID",
      "Platform",
      "Title",
      "Views",
      "Published",
      "Participant",
      "Eligible",
      "Robux",
      "Reasons",
    ]

    const rows = videos.map((video) => [
      video.id,
      video.platform,
      video.title,
      video.views,
      new Date(video.publishedAt).toLocaleDateString(),
      video.channel.participant.displayName,
      video.eligibility?.isEligible ? "Yes" : "No",
      video.eligibility?.eligibleRobux || 0,
      video.eligibility?.reasons.join("; ") || "",
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `videos-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter the admin password to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredVideos = videos.filter((video) => {
    if (filter === "eligible") return video.eligibility?.isEligible
    if (filter === "not-eligible") return !video.eligibility?.isEligible
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage participants and review videos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <RobuxCard
            totalSpent={robuxStats.totalSpent}
            remaining={robuxStats.remaining}
            budgetExceeded={robuxStats.budgetExceeded}
          />
        </div>

        <Separator className="my-8" />

        {/* Videos Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Videos</CardTitle>
                <CardDescription>Review and manage video eligibility</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All ({videos.length})
                </Button>
                <Button
                  variant={filter === "eligible" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("eligible")}
                >
                  Eligible ({videos.filter((v) => v.eligibility?.isEligible).length})
                </Button>
                <Button
                  variant={filter === "not-eligible" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("not-eligible")}
                >
                  Not Eligible ({videos.filter((v) => !v.eligibility?.isEligible).length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead>Eligibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium line-clamp-1">{video.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.platform === "tiktok" ? "default" : "destructive"}>
                        {video.platform === "tiktok" ? "TikTok" : "YouTube"}
                      </Badge>
                    </TableCell>
                    <TableCell>{video.channel.participant.displayName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {video.views.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {video.eligibility ? (
                        <div className="space-y-1">
                          <EligibilityBadge isEligible={video.eligibility.isEligible} />
                          {video.eligibility.overriddenByAdmin && (
                            <Badge variant="outline" className="text-xs">
                              Admin Override
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not evaluated</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(video.url, "_blank")}
                        >
                          View
                        </Button>
                        {video.eligibility && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOverrideEligibility(video.id, !video.eligibility!.isEligible)
                              }
                            >
                              {video.eligibility.isEligible ? "Mark Ineligible" : "Mark Eligible"}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredVideos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No videos found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

