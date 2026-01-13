import { Video, Platform } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EligibilityBadge } from "./EligibilityBadge"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Eye } from "lucide-react"
import Link from "next/link"

interface VideoCardProps {
  video: Video & {
    eligibility: {
      isEligible: boolean
      reasons: string[]
    } | null
  }
}

export function VideoCard({ video }: VideoCardProps) {
  const platformBadgeColor = video.platform === "tiktok" ? "default" : "destructive"
  const viewsFormatted = video.views.toLocaleString()
  const durationFormatted = video.durationSeconds
    ? `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, "0")}`
    : "N/A"

  return (
    <Card className="overflow-hidden">
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
              {video.eligibility && video.eligibility.reasons.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium mb-1">Eligibility reasons:</p>
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
}

