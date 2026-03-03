import React from 'react'
import { SocialIcon } from '@/components/ui/social-icons'

type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'newspaper'
  | 'tv'
  | 'radio'
  | 'web'
  | 'exhibition'
  | 'friend'
  | 'recommended'

/**
 * Maps a campaign type name string to the corresponding SocialIcon component.
 * Returns null when the type name doesn't match any known platform.
 */
export function getSocialIcon(typeName: string, size: 'sm' | 'md' | 'lg' = 'sm') {
  const name = typeName.toLowerCase()

  let platform: SocialPlatform | null = null

  if (name === 'facebook' || name.includes('facebook') || name.includes('fb')) {
    platform = 'facebook'
  } else if (name === 'instagram' || name.includes('instagram') || name.includes('ig')) {
    platform = 'instagram'
  } else if (name === 'tiktok' || name.includes('tiktok')) {
    platform = 'tiktok'
  } else if (name === 'youtube' || name.includes('youtube') || name.includes('yt')) {
    platform = 'youtube'
  } else if (name === 'newspaper' || name.includes('newspaper') || name.includes('news')) {
    platform = 'newspaper'
  } else if (name === 'tv_ads' || name.includes('tv') || name.includes('television')) {
    platform = 'tv'
  } else if (name === 'radio' || name.includes('radio')) {
    platform = 'radio'
  } else if (name === 'web_ads' || name.includes('web') || name.includes('online')) {
    platform = 'web'
  } else if (name === 'exhibition' || name.includes('exhibition') || name.includes('trade')) {
    platform = 'exhibition'
  } else if (name === 'friend_said' || name.includes('friend') || name.includes('referral')) {
    platform = 'friend'
  } else if (name === 'recommended' || name.includes('recommended') || name.includes('recommend')) {
    platform = 'recommended'
  }

  if (!platform) return null

  return <SocialIcon platform={platform} size={size} />
}

/** Returns a Tailwind class string for a campaign status badge. */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}
