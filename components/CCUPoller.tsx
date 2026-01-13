"use client"

import { useEffect, useState } from "react"
import { CCUCard } from "./CCUCard"

export function CCUPoller() {
  const [ccu, setCcu] = useState(0)

  useEffect(() => {
    const fetchCCU = async () => {
      try {
        const response = await fetch("/api/roblox-ccu")
        if (response.ok) {
          const data = await response.json()
          setCcu(data.ccu || 0)
        }
      } catch (error) {
        console.error("Failed to fetch CCU:", error)
      }
    }

    // Fetch immediately
    fetchCCU()

    // Then poll every 60 seconds
    const interval = setInterval(fetchCCU, 60000)

    return () => clearInterval(interval)
  }, [])

  return <CCUCard ccu={ccu} />
}

