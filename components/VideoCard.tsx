"use client"

import { useState, useEffect, useRef } from "react"
import { Platform } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EligibilityBadge } from "./EligibilityBadge"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Eye, Play, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { extractYouTubeVideoId, extractTikTokVideoId } from "@/lib/utils"
import { getEligibilityChecklist } from "@/lib/eligibility"

interface VideoCardProps {
  video: {
    id: string
    platform: Platform | string
    title: string
    description?: string | null
    publishedAt: Date | string
    durationSeconds?: number | null
    views: number
    thumbnailUrl?: string | null
    url: string
    eligibility: {
      isEligible: boolean
      reasons: string[]
      overriddenByAdmin?: boolean | null
    } | null
  }
}

export function VideoCard({ video }: VideoCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [embedLoaded, setEmbedLoaded] = useState(false)
  const tiktokEmbedRef = useRef<HTMLQuoteElement>(null)
  const platformBadgeColor = video.platform === "tiktok" ? "default" : "destructive"
  const viewsFormatted = video.views.toLocaleString()
  const durationFormatted = video.durationSeconds
    ? `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, "0")}`
    : "N/A"
  
  // Check if we're in development
  const isDevelopment = typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || 
     window.location.hostname === "127.0.0.1" ||
     window.location.protocol === "http:")

  // Get embed URL based on platform
  const getEmbedUrl = () => {
    if (video.platform === "youtube") {
      const videoId = extractYouTubeVideoId(video.url)
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`
      }
    }
    return null
  }

  const embedUrl = getEmbedUrl()
  const tiktokVideoId = video.platform === "tiktok" ? extractTikTokVideoId(video.url) : null

  // Load TikTok embed script when dialog opens for TikTok videos
  // Note: TikTok embeds may not work in development (localhost) due to CORS/security restrictions
  useEffect(() => {
    if (isPreviewOpen && video.platform === "tiktok" && tiktokVideoId && !isDevelopment) {
      // Only try to load embed in production
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
      if (!existingScript) {
        const script = document.createElement("script")
        script.src = "https://www.tiktok.com/embed.js"
        script.async = true
        script.onload = () => {
          setTimeout(() => {
            if (tiktokEmbedRef.current && (window as any).tiktokEmbedLib) {
              try {
                (window as any).tiktokEmbedLib.lib.render(tiktokEmbedRef.current)
                setEmbedLoaded(true)
              } catch (e) {
                console.log("TikTok embed render error:", e)
              }
            }
          }, 100)
        }
        script.onerror = () => {
          console.log("TikTok embed script failed to load")
        }
        document.body.appendChild(script)
      } else {
        setTimeout(() => {
          if (tiktokEmbedRef.current && (window as any).tiktokEmbedLib) {
            try {
              (window as any).tiktokEmbedLib.lib.render(tiktokEmbedRef.current)
              setEmbedLoaded(true)
            } catch (e) {
              console.log("TikTok embed render error:", e)
            }
          }
        }, 100)
      }
    }
  }, [isPreviewOpen, video.platform, tiktokVideoId, isDevelopment])

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {video.thumbnailUrl && (
            <div 
              className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 cursor-pointer group"
              onClick={() => setIsPreviewOpen(true)}
            >
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-3">
                  <Play className="h-6 w-6 text-black fill-black" />
                </div>
              </div>
            </div>
          )}
        <div className="flex-1">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle 
                  className="text-lg line-clamp-2 mb-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  {video.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant={platformBadgeColor}>
                    {video.platform === "tiktok" ? "TikTok" : "YouTube"}
                  </Badge>
                  <EligibilityBadge
                    isEligible={video.eligibility?.isEligible ?? false}
                  />
                </div>
              </div>
              <Link
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <ExternalLink className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{viewsFormatted} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{durationFormatted}</span>
                </div>
                <div>
                  {new Date(video.publishedAt).toLocaleDateString()}
                </div>
              </div>
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {video.description}
                </p>
              )}
              {video.eligibility && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium mb-2">Eligibility Checklist:</p>
                  {(() => {
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
                    return (
                      <div className="space-y-1.5">
                        {checklist.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            {item.passed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
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
                    )
                  })()}
                  {video.eligibility.reasons.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
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
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>

    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{video.title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {/* Show thumbnail prominently */}
          {video.thumbnailUrl ? (
            <div className="relative w-full bg-black flex items-center justify-center">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              {/* Try to show embed overlay if available (only in production) */}
              {video.platform === "tiktok" && tiktokVideoId && !isDevelopment && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <blockquote
                    ref={tiktokEmbedRef}
                    className="tiktok-embed pointer-events-auto"
                    cite={video.url}
                    data-video-id={tiktokVideoId}
                    style={{ maxWidth: "605px", minWidth: "325px" }}
                  >
                    <section>
                      <a
                        target="_blank"
                        href={video.url}
                        rel="noopener noreferrer"
                      >
                        {video.title}
                      </a>
                    </section>
                  </blockquote>
                </div>
              )}
              {/* Show message in development */}
              {video.platform === "tiktok" && isDevelopment && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white text-sm p-2 rounded text-center">
                  TikTok embeds may not work in development. Thumbnail shown. 
                  <Link href={video.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                    View on TikTok →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* No thumbnail - try to show embed or fallback */
            <div className="p-6">
              {video.platform === "tiktok" && tiktokVideoId ? (
                <div className="flex justify-center">
                  <blockquote
                    ref={tiktokEmbedRef}
                    className="tiktok-embed"
                    cite={video.url}
                    data-video-id={tiktokVideoId}
                    style={{ maxWidth: "605px", minWidth: "325px" }}
                  >
                    <section>
                      <a
                        target="_blank"
                        href={video.url}
                        rel="noopener noreferrer"
                      >
                        {video.title}
                      </a>
                    </section>
                  </blockquote>
                </div>
              ) : embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={embedUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={video.title}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Preview not available</p>
                  <Link
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on {video.platform === "tiktok" ? "TikTok" : "YouTube"} →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

