import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/, etc.
 */
export function extractYouTubeVideoId(url: string): string | null {
  // Handle direct video ID (11 characters, alphanumeric and hyphens/underscores)
  if (!url.includes('/') && !url.includes('?') && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }

  // YouTube URL patterns (including Shorts)
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/, // YouTube Shorts
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Extract TikTok video ID from URL
 * Supports: tiktok.com/@username/video/ID, tiktok.com/t/ID, vm.tiktok.com/ID
 */
export function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

