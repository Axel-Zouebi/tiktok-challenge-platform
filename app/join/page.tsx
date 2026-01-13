"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, Copy } from "lucide-react"
import Link from "next/link"

export default function JoinPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState("")
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    tiktokHandle: "",
    youtubeChannel: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/participants/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error message if available
        const errorMessage = data.details 
          ? `${data.error}: ${Array.isArray(data.details) ? data.details.map((d: any) => d.message).join(', ') : data.details}`
          : data.error || "Registration failed"
        throw new Error(errorMessage)
      }

      setDashboardUrl(data.dashboardUrl)
      setSuccess(true)
      toast({
        title: "Registration successful!",
        description: "Your dashboard link has been generated.",
      })
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyDashboardUrl = () => {
    navigator.clipboard.writeText(dashboardUrl)
    toast({
      title: "Copied!",
      description: "Dashboard link copied to clipboard.",
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Registration Successful!</CardTitle>
            </div>
            <CardDescription>
              Your dashboard link has been generated. Save this link to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Dashboard Link</Label>
              <div className="flex gap-2">
                <Input value={dashboardUrl} readOnly className="font-mono text-sm" />
                <Button onClick={copyDashboardUrl} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href={dashboardUrl}>Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join the Challenge</CardTitle>
          <CardDescription>
            Register your TikTok and/or YouTube channels to participate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                required
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Your name or channel name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktokHandle">TikTok Handle/URL (Optional)</Label>
              <Input
                id="tiktokHandle"
                value={formData.tiktokHandle}
                onChange={(e) =>
                  setFormData({ ...formData, tiktokHandle: e.target.value })
                }
                placeholder="@username or https://tiktok.com/@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtubeChannel">YouTube Channel/URL (Optional)</Label>
              <Input
                id="youtubeChannel"
                value={formData.youtubeChannel}
                onChange={(e) =>
                  setFormData({ ...formData, youtubeChannel: e.target.value })
                }
                placeholder="Channel ID or https://youtube.com/channel/..."
              />
              <p className="text-xs text-muted-foreground">
                At least one platform (TikTok or YouTube) is required
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>

            <div className="text-center">
              <Link
                href="/rules"
                className="text-sm text-muted-foreground hover:underline"
              >
                View rules and requirements
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

