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
    email: "",
    discordUsername: "",
    tiktokHandle: "",
    youtubeChannel: "",
  })
  const [errors, setErrors] = useState<{
    email?: string
    discordUsername?: string
    tiktokHandle?: string
    youtubeChannel?: string
  }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}

    // Validate Discord username (required)
    if (!formData.discordUsername.trim()) {
      newErrors.discordUsername = "Discord username is required"
    } else {
      // Validate Discord username format
      const discordUsername = formData.discordUsername.trim().replace(/^@/, '')
      const isValidFormat = /^[a-zA-Z0-9_.-]{2,32}(#\d{4})?$/.test(discordUsername)
      if (!isValidFormat) {
        newErrors.discordUsername = "Invalid Discord username format. Use username (e.g., 'username') or username#discriminator (e.g., 'username#1234')"
      }
    }

    // Validate email (optional, but must be valid if provided)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate at least one platform is provided
    const hasTikTok = formData.tiktokHandle.trim().length > 0
    const hasYouTube = formData.youtubeChannel.trim().length > 0
    if (!hasTikTok && !hasYouTube) {
      newErrors.tiktokHandle = "At least one platform (TikTok or YouTube) is required"
      newErrors.youtubeChannel = "At least one platform (TikTok or YouTube) is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submitting
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      })
      return
    }

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
        // Handle server-side validation errors
        if (data.details && Array.isArray(data.details)) {
          const serverErrors: typeof errors = {}
          data.details.forEach((detail: { field: string; message: string }) => {
            if (detail.field === 'email') {
              serverErrors.email = detail.message
            } else if (detail.field === 'discordUsername') {
              serverErrors.discordUsername = detail.message
            } else if (detail.field === 'tiktokHandle') {
              serverErrors.tiktokHandle = detail.message
            } else if (detail.field === 'youtubeChannel') {
              serverErrors.youtubeChannel = detail.message
            }
          })
          setErrors(serverErrors)
        }
        
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
        description: "Redirecting to your dashboard...",
      })
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push(data.dashboardUrl)
      }, 1500)
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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined })
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
                <Link href={dashboardUrl || "/dashboard"}>Go to Dashboard</Link>
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
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordUsername">Discord Username *</Label>
              <Input
                id="discordUsername"
                required
                value={formData.discordUsername}
                onChange={(e) => handleInputChange("discordUsername", e.target.value)}
                placeholder="username or username#1234"
                className={errors.discordUsername ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.discordUsername && (
                <p className="text-sm text-red-500">{errors.discordUsername}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your Discord username (e.g., "username" or "username#1234")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktokHandle">TikTok Handle/URL (Optional)</Label>
              <Input
                id="tiktokHandle"
                value={formData.tiktokHandle}
                onChange={(e) => handleInputChange("tiktokHandle", e.target.value)}
                placeholder="@username or https://tiktok.com/@username"
                className={errors.tiktokHandle ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.tiktokHandle && (
                <p className="text-sm text-red-500">{errors.tiktokHandle}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtubeChannel">YouTube Channel/URL (Optional)</Label>
              <Input
                id="youtubeChannel"
                value={formData.youtubeChannel}
                onChange={(e) => handleInputChange("youtubeChannel", e.target.value)}
                placeholder="Channel ID or https://youtube.com/channel/..."
                className={errors.youtubeChannel ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.youtubeChannel && (
                <p className="text-sm text-red-500">{errors.youtubeChannel}</p>
              )}
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

