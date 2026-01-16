const ROBLOX_PLACE_ID = process.env.ROBLOX_PLACE_ID

interface RobloxGameInfo {
  placeId: string
  name: string
  playing: number
  visits: number
  maxPlayers: number
  upVotes?: number
  downVotes?: number
  percentageRating?: number
}

let cachedCCU: { value: number; timestamp: number } | null = null
const CACHE_TTL = 60 * 1000 // 60 seconds

/**
 * Fetch game stats including CCU and percentage rating
 */
export async function fetchRobloxGameStats(placeId?: string): Promise<{ ccu: number; percentageRating: number }> {
  const targetPlaceId = placeId || ROBLOX_PLACE_ID

  if (!targetPlaceId) {
    console.warn('ROBLOX_PLACE_ID not configured')
    return { ccu: 0, percentageRating: 0 }
  }

  try {
    // Step 1: Get Universe ID from Place ID
    const placeDetailsResponse = await fetch(
      `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${targetPlaceId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!placeDetailsResponse.ok) {
      throw new Error(`Roblox API error: ${placeDetailsResponse.statusText}`)
    }

    const placeDetailsData = await placeDetailsResponse.json()
    const placeDetails = placeDetailsData.data?.[0]

    if (!placeDetails || !placeDetails.universeId) {
      console.error('Failed to get universe ID from place ID. Response:', JSON.stringify(placeDetailsData, null, 2))
      return { ccu: 0, percentageRating: 0 }
    }

    const universeId = placeDetails.universeId
    console.log(`Place ID ${targetPlaceId} -> Universe ID ${universeId}`)

    // Step 2: Get game stats (CCU) using Universe ID
    const gameStatsResponse = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!gameStatsResponse.ok) {
      throw new Error(`Roblox API error: ${gameStatsResponse.statusText}`)
    }

    const gameStatsData = await gameStatsResponse.json()
    const game = gameStatsData.data?.[0]

    if (!game) {
      console.error('No game data found in response:', JSON.stringify(gameStatsData, null, 2))
      return { ccu: 0, percentageRating: 0 }
    }

    const ccu = game.playing || 0

    // Step 3: Get votes using Universe ID (this is the correct endpoint for ratings)
    // First try the dedicated votes endpoint
    let percentageRating = 0
    let upVotes = 0
    let downVotes = 0
    
    try {
      const votesResponse = await fetch(
        `https://games.roblox.com/v1/games/votes?universeIds=${universeId}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (votesResponse.ok) {
        const votesData = await votesResponse.json()
        
        // The votes endpoint returns: { data: [{ universeId, upVotes, downVotes }] }
        let voteEntry: any = null
        
        if (Array.isArray(votesData.data)) {
          // Find entry matching universeId (handle both string and number comparison)
          voteEntry = votesData.data.find((v: any) => 
            String(v.universeId) === String(universeId) || v.universeId === universeId
          )
        } else if (votesData.data && typeof votesData.data === 'object' && !Array.isArray(votesData.data)) {
          // Single object response
          if (String(votesData.data.universeId) === String(universeId)) {
            voteEntry = votesData.data
          }
        }
        
        if (voteEntry) {
          upVotes = Number(voteEntry.upVotes) || 0
          downVotes = Number(voteEntry.downVotes) || 0
          const totalVotes = upVotes + downVotes
          
          if (totalVotes > 0) {
            percentageRating = Math.round((upVotes / totalVotes) * 100)
            console.log(`Successfully fetched votes: ${upVotes} up, ${downVotes} down = ${percentageRating}%`)
          }
        } else {
          console.warn(`No vote entry found for universeId: ${universeId}`)
          console.log('Votes response structure:', JSON.stringify(votesData, null, 2))
        }
      } else {
        const errorText = await votesResponse.text().catch(() => 'Unable to read error')
        console.warn(`Votes endpoint returned ${votesResponse.status}:`, errorText.substring(0, 200))
      }
    } catch (votesError) {
      console.error('Error fetching votes:', votesError)
    }

    // Fallback: try to get votes from game stats if votes endpoint didn't work
    if (percentageRating === 0 && (game.upVotes !== undefined || game.downVotes !== undefined)) {
      upVotes = Number(game.upVotes) || 0
      downVotes = Number(game.downVotes) || 0
      const totalVotes = upVotes + downVotes
      if (totalVotes > 0) {
        percentageRating = Math.round((upVotes / totalVotes) * 100)
        console.log(`Using fallback from game stats: ${percentageRating}%`)
      }
    }

    return { ccu, percentageRating }
  } catch (error) {
    console.error('Error fetching Roblox game stats:', error)
    return { ccu: 0, percentageRating: 0 }
  }
}

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
    // Step 1: Get Universe ID from Place ID
    const placeDetailsResponse = await fetch(
      `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${targetPlaceId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!placeDetailsResponse.ok) {
      return null
    }

    const placeDetailsData = await placeDetailsResponse.json()
    const placeDetails = placeDetailsData.data?.[0]

    if (!placeDetails || !placeDetails.universeId) {
      return null
    }

    const universeId = placeDetails.universeId

    // Step 2: Get game stats using Universe ID
    const gameStatsResponse = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!gameStatsResponse.ok) {
      return null
    }

    const gameStatsData = await gameStatsResponse.json()
    const game = gameStatsData.data?.[0]

    if (!game) {
      return null
    }

    // Step 3: Get votes using Universe ID
    let upVotes = 0
    let downVotes = 0
    let percentageRating = 0

    const votesResponse = await fetch(
      `https://games.roblox.com/v1/games/votes?universeIds=${universeId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (votesResponse.ok) {
      const votesData = await votesResponse.json()
      const voteEntry = votesData.data?.find((v: any) => v.universeId === universeId)

      if (voteEntry) {
        upVotes = voteEntry.upVotes || 0
        downVotes = voteEntry.downVotes || 0
        const totalVotes = upVotes + downVotes
        if (totalVotes > 0) {
          percentageRating = Math.round((upVotes / totalVotes) * 100)
        }
      }
    } else {
      // Fallback: try to get votes from game stats if available
      upVotes = game.upVotes || 0
      downVotes = game.downVotes || 0
      const totalVotes = upVotes + downVotes
      if (totalVotes > 0) {
        percentageRating = Math.round((upVotes / totalVotes) * 100)
      }
    }

    return {
      placeId: targetPlaceId,
      name: game.name || 'Unknown Game',
      playing: game.playing || 0,
      visits: game.visits || 0,
      maxPlayers: game.maxPlayers || 0,
      upVotes,
      downVotes,
      percentageRating,
    }
  } catch (error) {
    console.error('Error fetching Roblox game info:', error)
    return null
  }
}

