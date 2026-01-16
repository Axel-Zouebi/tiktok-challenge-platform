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
    // Use the universes API endpoint which is more reliable
    const placeDetailsResponse = await fetch(
      `https://apis.roblox.com/universes/v1/places/${targetPlaceId}/universe`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    )

    if (!placeDetailsResponse.ok) {
      // Fallback: try the games API endpoint
      console.warn(`Universes API returned ${placeDetailsResponse.status}, trying games API as fallback`)
      const fallbackResponse = await fetch(
        `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${targetPlaceId}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      )
      
      if (!fallbackResponse.ok) {
        const errorText = await fallbackResponse.text().catch(() => 'Unknown error')
        throw new Error(`Roblox API error: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${errorText.substring(0, 100)}`)
      }
      
      const fallbackData = await fallbackResponse.json()
      const placeDetails = fallbackData.data?.[0]
      
      if (!placeDetails || !placeDetails.universeId) {
        console.error('Failed to get universe ID from games API. Response:', JSON.stringify(fallbackData, null, 2))
        return { ccu: 0, percentageRating: 0 }
      }
      
      const universeId = placeDetails.universeId
      console.log(`Place ID ${targetPlaceId} -> Universe ID ${universeId} (via games API)`)
      
      // Continue with universeId
      return await fetchGameStatsWithUniverseId(universeId, targetPlaceId)
    }

    const universeData = await placeDetailsResponse.json()
    const universeId = universeData.universeId

    if (!universeId) {
      console.error('Failed to get universe ID from universes API. Response:', JSON.stringify(universeData, null, 2))
      return { ccu: 0, percentageRating: 0 }
    }

    console.log(`Place ID ${targetPlaceId} -> Universe ID ${universeId} (via universes API)`)
    
    // Continue with the rest of the function
    return await fetchGameStatsWithUniverseId(universeId, targetPlaceId)
  } catch (error) {
    console.error('Error fetching Roblox game stats:', error)
    return { ccu: 0, percentageRating: 0 }
  }
}

/**
 * Helper function to fetch game stats using Universe ID
 */
async function fetchGameStatsWithUniverseId(universeId: number | string, placeId: string): Promise<{ ccu: number; percentageRating: number }> {
  try {

    // Step 2: Get game stats (CCU) using Universe ID
    const gameStatsResponse = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    
    // Log game stats to see what fields are available
    console.log('Game stats available fields:', Object.keys(game))
    if (game.favoritedCount !== undefined) {
      console.log('Game has favoritedCount:', game.favoritedCount)
    }
    if (game.upVotes !== undefined || game.downVotes !== undefined) {
      console.log('Game has votes in stats - upVotes:', game.upVotes, 'downVotes:', game.downVotes)
    }

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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      )

      if (votesResponse.ok) {
        const votesData = await votesResponse.json()
        console.log('Raw votes API response:', JSON.stringify(votesData, null, 2))
        console.log('Looking for universeId:', universeId, 'Type:', typeof universeId)
        
        // The votes endpoint returns: { data: [{ universeId, upVotes, downVotes }] }
        let voteEntry: any = null
        
        // Try multiple response structures
        // NOTE: The votes API returns "id" not "universeId" in the response!
        if (Array.isArray(votesData.data)) {
          console.log('Found array with', votesData.data.length, 'entries')
          // Find entry matching universeId - check both "id" and "universeId" fields
          // NOTE: The votes API returns "id" field, not "universeId"!
          voteEntry = votesData.data.find((v: any) => {
            // The API returns "id" field, not "universeId"
            const match = 
              String(v.id) === String(universeId) || v.id === universeId ||
              String(v.universeId) === String(universeId) || v.universeId === universeId
            if (match) {
              console.log('✅ Found matching entry:', v)
            }
            return match
          })
        } else if (votesData.data && typeof votesData.data === 'object' && !Array.isArray(votesData.data)) {
          // Single object response
          console.log('Found single object:', votesData.data)
          if (String(votesData.data.id) === String(universeId) || 
              String(votesData.data.universeId) === String(universeId)) {
            voteEntry = votesData.data
          }
        } else if (Array.isArray(votesData)) {
          // Response might be a direct array
          console.log('Response is direct array with', votesData.length, 'entries')
          voteEntry = votesData.find((v: any) => 
            String(v.id) === String(universeId) || v.id === universeId ||
            String(v.universeId) === String(universeId) || v.universeId === universeId
          )
        } else if ((votesData.id && (String(votesData.id) === String(universeId) || votesData.id === universeId)) ||
                   (votesData.universeId && (String(votesData.universeId) === String(universeId) || votesData.universeId === universeId))) {
          // Response might be a direct object
          console.log('Response is direct object')
          voteEntry = votesData
        }
        
        if (voteEntry) {
          // Try different field name variations
          upVotes = Number(voteEntry.upVotes || voteEntry.likes || voteEntry.positiveVotes || 0)
          downVotes = Number(voteEntry.downVotes || voteEntry.dislikes || voteEntry.negativeVotes || 0)
          const totalVotes = upVotes + downVotes
          
          console.log(`Parsed votes - upVotes: ${upVotes}, downVotes: ${downVotes}, total: ${totalVotes}`)
          
          if (totalVotes > 0) {
            percentageRating = Math.round((upVotes / totalVotes) * 100)
            console.log(`✅ Successfully calculated percentage rating: ${percentageRating}%`)
          } else {
            console.warn('Total votes is 0, cannot calculate percentage')
          }
        } else {
          console.warn(`❌ No vote entry found for universeId: ${universeId}`)
          console.log('Full votes response:', JSON.stringify(votesData, null, 2))
        }
      } else {
        const errorText = await votesResponse.text().catch(() => 'Unable to read error')
        console.error(`❌ Votes endpoint returned ${votesResponse.status}:`, errorText.substring(0, 500))
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

