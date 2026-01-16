"use client"

import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlayButtonProps {
  robloxGameUrl?: string
}

export function PlayButton({ robloxGameUrl }: PlayButtonProps) {
  const handleClick = () => {
    const placeId = process.env.NEXT_PUBLIC_ROBLOX_PLACE_ID
    const defaultGameUrl = robloxGameUrl || 
      (placeId ? `https://www.roblox.com/games/${placeId}` : "https://www.roblox.com/games/118678904542604/One-Last-Stand")
    
    if (defaultGameUrl !== "#") {
      window.open(defaultGameUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <Button
      onClick={handleClick}
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-16 h-16 p-0 flex items-center justify-center shadow-lg"
      size="icon"
    >
      <Play className="h-8 w-8 fill-white" />
    </Button>
  )
}

