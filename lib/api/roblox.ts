const ROBLOX_PLACE_ID = process.env.ROBLOX_PLACE_ID

interface RobloxGameInfo {
  placeId: string
  name: string
  playing: number
  visits: number
  maxPlayers: number
}

let cachedCCU: { value: number; timestamp: number } | null = null
const CACHE_TTL = 60 * 1000 // 60 seconds

/**
 * Fetch current concurrent users (CCU) for a Roblox game
 * Uses Roblox API to get game statistics
 */
export async function fetchRobloxCCU(placeId?: string): Promise<number> {
  const targetPlaceId = placeId || ROBLOX_PLACE_ID

  if (!targetPlaceId) {
    console.warn('ROBLOX_PLACE_ID not configured')
    return 0
  }

  // Check cache
  if (cachedCCU && Date.now() - cachedCCU.timestamp < CACHE_TTL) {
    return cachedCCU.value
  }

  try {
    // Roblox API endpoint for game info
    // Note: This is a simplified approach. The actual Roblox API may require authentication
    // or use a different endpoint. Adjust as needed.
    const response = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${targetPlaceId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      // Fallback: Try alternative endpoint
      const altResponse = await fetch(
        `https://www.roblox.com/games/getgameinstancesjson?placeId=${targetPlaceId}&startIndex=0`
      )

      if (altResponse.ok) {
        const data = await altResponse.json()
        const ccu = data.PlayerCounts?.[0] || 0
        cachedCCU = { value: ccu, timestamp: Date.now() }
        return ccu
      }

      throw new Error(`Roblox API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // The API structure may vary - adjust based on actual response
    // This is a placeholder structure
    const game = data.data?.[0]
    const ccu = game?.playing || game?.playerCount || 0

    cachedCCU = { value: ccu, timestamp: Date.now() }
    return ccu
  } catch (error) {
    console.error('Error fetching Roblox CCU:', error)
    
    // Return cached value if available, even if expired
    if (cachedCCU) {
      return cachedCCU.value
    }

    return 0
  }
}

/**
 * Get game information
 */
export async function getRobloxGameInfo(placeId?: string): Promise<RobloxGameInfo | null> {
  const targetPlaceId = placeId || ROBLOX_PLACE_ID

  if (!targetPlaceId) {
    return null
  }

  try {
    const response = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${targetPlaceId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const game = data.data?.[0]

    if (!game) {
      return null
    }

    return {
      placeId: targetPlaceId,
      name: game.name || 'Unknown Game',
      playing: game.playing || 0,
      visits: game.visits || 0,
      maxPlayers: game.maxPlayers || 0,
    }
  } catch (error) {
    console.error('Error fetching Roblox game info:', error)
    return null
  }
}

