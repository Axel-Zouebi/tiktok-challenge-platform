/**
 * Discord API utilities for validating usernames and fetching user avatars
 */

const DISCORD_API_BASE = 'https://discord.com/api/v10'
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

export interface DiscordUserInfo {
  id: string
  username: string
  discriminator: string | null
  avatar: string | null
  avatarUrl: string
}

/**
 * Validates Discord username format
 * Supports both old format (username#discriminator) and new format (username)
 */
export function validateDiscordUsernameFormat(username: string): boolean {
  // Remove leading @ if present
  const cleanUsername = username.trim().replace(/^@/, '')
  
  // New format: username only (2-32 characters, alphanumeric, underscore, period, hyphen)
  if (/^[a-zA-Z0-9_.-]{2,32}$/.test(cleanUsername)) {
    return true
  }
  
  // Old format: username#discriminator (discriminator is 4 digits)
  if (/^[a-zA-Z0-9_.-]{2,32}#\d{4}$/.test(cleanUsername)) {
    return true
  }
  
  return false
}

/**
 * Normalizes Discord username (removes @ prefix, trims whitespace)
 */
export function normalizeDiscordUsername(username: string): string {
  return username.trim().replace(/^@/, '')
}

/**
 * Fetches Discord user information by username
 * Requires DISCORD_BOT_TOKEN environment variable
 */
export async function getDiscordUserByUsername(username: string): Promise<DiscordUserInfo | null> {
  if (!DISCORD_BOT_TOKEN) {
    console.warn('DISCORD_BOT_TOKEN is not set. Cannot validate Discord username via API.')
    return null
  }

  const normalizedUsername = normalizeDiscordUsername(username)
  
  try {
    // Discord API doesn't have a direct endpoint to search by username
    // We need to use the user lookup endpoint, but it requires the user ID
    // For now, we'll validate the format and return a structure that allows
    // us to construct the avatar URL if we have the user ID
    
    // If format includes discriminator (old format), we can try to look it up
    // Otherwise, we'll need the user ID
    
    // For validation purposes, we'll check if the username format is valid
    if (!validateDiscordUsernameFormat(normalizedUsername)) {
      return null
    }

    // Note: Discord's API doesn't allow searching by username directly without OAuth
    // We'll need to use a different approach - either:
    // 1. Use Discord OAuth2 to get user info
    // 2. Use a Discord bot that can search users in a server
    // 3. Store username and fetch avatar later when we have more context
    
    // For now, return null to indicate we can't validate via API
    // The username format validation will be done separately
    return null
  } catch (error) {
    console.error(`Error fetching Discord user "${username}":`, error)
    return null
  }
}

/**
 * Constructs Discord avatar URL from user ID and avatar hash
 * Falls back to default Discord avatar if no avatar hash
 */
export function getDiscordAvatarUrl(userId: string, avatarHash: string | null): string {
  if (avatarHash) {
    // Animated avatars have a_ prefix
    const isAnimated = avatarHash.startsWith('a_')
    const extension = isAnimated ? 'gif' : 'png'
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}`
  }
  
  // Default Discord avatar (based on user ID discriminator)
  const discriminator = parseInt(userId) % 5
  return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
}

/**
 * Validates if a Discord user exists
 * Attempts to look up the user in a Discord server if bot token and server ID are provided
 * Otherwise, validates format only
 */
export async function validateDiscordUserExists(
  username: string,
  serverId?: string
): Promise<{
  exists: boolean
  avatarUrl?: string
  userId?: string
  error?: string
}> {
  const normalizedUsername = normalizeDiscordUsername(username)
  
  // Validate format first
  if (!validateDiscordUsernameFormat(normalizedUsername)) {
    return { 
      exists: false,
      error: 'Invalid Discord username format. Use username (e.g., "username") or username#discriminator (e.g., "username#1234")'
    }
  }

  // If we have bot token and server ID, try to look up the user
  if (DISCORD_BOT_TOKEN && serverId) {
    const userInfo = await lookupDiscordUserInServer(normalizedUsername, serverId)
    if (userInfo) {
      return {
        exists: true,
        avatarUrl: userInfo.avatarUrl,
        userId: userInfo.id,
      }
    } else {
      return {
        exists: false,
        error: 'Discord user not found. Make sure you are a member of the Discord server.'
      }
    }
  }

  // If no bot token/server ID, we can only validate format
  // In production, you should set DISCORD_BOT_TOKEN and DISCORD_SERVER_ID
  // to enable full user validation
  if (!DISCORD_BOT_TOKEN) {
    console.warn('DISCORD_BOT_TOKEN not set. Only validating Discord username format.')
  }
  
  // Format is valid - return success (actual existence check requires bot/server)
  return {
    exists: true,
    avatarUrl: undefined, // Will be fetched later if needed
  }
}

/**
 * Alternative: Use Discord's public API endpoint (if available)
 * This requires the user to be in a server where the bot is present
 */
export async function lookupDiscordUserInServer(
  username: string,
  serverId?: string
): Promise<DiscordUserInfo | null> {
  if (!DISCORD_BOT_TOKEN || !serverId) {
    return null
  }

  const normalizedUsername = normalizeDiscordUsername(username)
  
  try {
    // Search for user in server (requires bot to be in the server)
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${serverId}/members/search?query=${encodeURIComponent(normalizedUsername)}`,
      {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const members = await response.json()
    if (!Array.isArray(members) || members.length === 0) {
      return null
    }

    // Find exact match
    const member = members.find((m: any) => 
      m.user.username.toLowerCase() === normalizedUsername.toLowerCase() ||
      `${m.user.username}#${m.user.discriminator}` === normalizedUsername
    )

    if (!member || !member.user) {
      return null
    }

    const user = member.user
    const avatarUrl = getDiscordAvatarUrl(user.id, user.avatar)

    return {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator !== '0' ? user.discriminator : null,
      avatar: user.avatar,
      avatarUrl,
    }
  } catch (error) {
    console.error(`Error looking up Discord user in server:`, error)
    return null
  }
}

