import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateToken(): string {
  return crypto.randomUUID()
}

export function extractYouTubeChannelId(urlOrId: string): string | null {
  // Handle direct channel ID
  if (!urlOrId.includes('/') && !urlOrId.includes('?')) {
    return urlOrId
  }

  // Handle various YouTube URL formats
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export function extractTikTokHandle(urlOrHandle: string): string | null {
  // Remove @ if present
  let handle = urlOrHandle.replace('@', '').trim()

  // Handle URLs
  if (handle.includes('tiktok.com')) {
    const match = handle.match(/tiktok\.com\/@?([a-zA-Z0-9_.]+)/)
    if (match) {
      return match[1]
    }
  }

  // Return handle if it looks valid
  if (/^[a-zA-Z0-9_.]+$/.test(handle)) {
    return handle
  }

  return null
}

