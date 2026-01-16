"use client"

import { useEffect, useState } from "react"

export function ChallengeCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Set target date to January 24th of the current year (or next year if already past)
    const now = new Date()
    const currentYear = now.getFullYear()
    const targetDate = new Date(currentYear, 0, 24) // January 24th (month is 0-indexed)
    
    // If January 24th has already passed this year, use next year
    if (targetDate < now) {
      targetDate.setFullYear(currentYear + 1)
    }

    const updateCountdown = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center text-white bg-black/50 rounded-lg p-4">
      <div className="text-sm text-white/80 mb-1">Challenge starts in:</div>
      <div className="flex items-center justify-center gap-2 md:gap-4 text-lg md:text-xl font-medium">
        <div className="flex items-center gap-1">
          <span className="tabular-nums">{timeLeft.days}</span>
          <span className="text-sm text-white/70">d</span>
        </div>
        <span className="text-white/50">:</span>
        <div className="flex items-center gap-1">
          <span className="tabular-nums">{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className="text-sm text-white/70">h</span>
        </div>
        <span className="text-white/50">:</span>
        <div className="flex items-center gap-1">
          <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className="text-sm text-white/70">m</span>
        </div>
        <span className="text-white/50">:</span>
        <div className="flex items-center gap-1">
          <span className="tabular-nums">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="text-sm text-white/70">s</span>
        </div>
      </div>
    </div>
  )
}

