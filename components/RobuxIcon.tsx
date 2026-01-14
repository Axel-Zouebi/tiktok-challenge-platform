"use client"

import { useState } from "react"

interface RobuxIconProps {
  src?: string
  className?: string
}

export function RobuxIcon({ src = "/robux-icon.png", className = "h-12 w-12 md:h-16 md:w-16" }: RobuxIconProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className={`relative ${className} flex-shrink-0`}>
      {!imageError ? (
        <img
          src={src}
          alt="Robux"
          className="h-full w-full object-contain"
          onError={() => {
            console.error('Robux icon failed to load. Make sure the file exists at:', src)
            setImageError(true)
          }}
          onLoad={() => {
            console.log('Robux icon loaded successfully:', src)
          }}
        />
      ) : (
        /* Placeholder - This will show if your Robux icon image fails to load */
        <div className="h-full w-full bg-white/20 rounded border-2 border-dashed border-white/40 flex items-center justify-center">
          <span className="text-white/60 text-xs md:text-sm font-medium">R$</span>
        </div>
      )}
    </div>
  )
}

