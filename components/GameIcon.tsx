"use client"

import { useEffect, useState } from "react"
import { ThumbsUp, Users } from "lucide-react"

interface GameIconProps {
  gameIconUrl?: string
  robloxGameUrl?: string
}

export function GameIcon({ gameIconUrl, robloxGameUrl }: GameIconProps) {
  const [ccu, setCcu] = useState(0)
  const [percentageRating, setPercentageRating] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/roblox-ccu")
        if (response.ok) {
          const data = await response.json()
          setCcu(data.ccu || 0)
          setPercentageRating(data.percentageRating || 0)
        }
      } catch (error) {
        console.error("Failed to fetch game stats:", error)
      }
    }

    // Fetch immediately
    fetchStats()

    // Then poll every 60 seconds
    const interval = setInterval(fetchStats, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleClick = () => {
    const placeId = process.env.NEXT_PUBLIC_ROBLOX_PLACE_ID
    const defaultGameUrl = robloxGameUrl || 
      (placeId ? `https://www.roblox.com/games/${placeId}` : "https://www.roblox.com/games/118678904542604/One-Last-Stand")
    
    if (defaultGameUrl !== "#") {
      window.open(defaultGameUrl, "_blank", "noopener,noreferrer")
    }
  }

  const iconUrl = gameIconUrl || "/game-icon.webp"

  return (
    <div className="relative">
      <div
        className="relative w-48 h-48 rounded-lg overflow-hidden cursor-pointer group shadow-lg"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      >
        {/* Game Icon Image */}
        <div className="relative w-full h-full bg-muted">
          {!imageError ? (
            <img
              src={iconUrl}
              alt="Game Icon"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">OLS</span>
            </div>
          )}
          
          {/* Hover Overlay with PLAY text */}
          <div
            className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-3xl font-bold text-white">PLAY</span>
          </div>
        </div>

        {/* CCU Badge - Bottom Left */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1 text-white text-sm font-medium">
          <Users className="h-3.5 w-3.5" />
          <span>{ccu.toLocaleString()}</span>
        </div>

        {/* Percentage Rating Badge - Top Right */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1 text-white text-sm font-medium">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>{percentageRating}%</span>
        </div>
      </div>
    </div>
  )
}

