'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { safeJsonParse } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

// Check if session is expired (1 hour inactivity)
function isSessionExpired(): boolean {
  const activityCookie = getCookie('session-activity')
  if (!activityCookie) return true
  
  try {
    const expiresAt = parseInt(activityCookie, 10)
    if (isNaN(expiresAt)) return true
    
    const now = Date.now()
    return now >= expiresAt
  } catch {
    return true
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const activityCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const lastApiCallRef = useRef<number>(Date.now())

  // Update session activity on API calls
  const updateActivity = useCallback(async () => {
    try {
      await fetch('/api/auth/session-activity', { method: 'POST' })
      lastApiCallRef.current = Date.now()
    } catch (error) {
      console.error('Failed to update session activity:', error)
    }
  }, [])

  // Check for session expiry and auto-logout
  const checkSessionExpiry = useCallback(() => {
    if (isSessionExpired()) {
      console.log('Session expired due to inactivity (1 hour)')
      setUser(null)
      router.push('/sign-in')
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current)
      }
    }
  }, [router])

  // Intercept fetch to track API calls
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const result = await originalFetch(...args)
      
      // Update activity for API calls (except auth endpoints)
      const url = args[0]
      if (typeof url === 'string' && url.startsWith('/api/') && !url.startsWith('/api/auth/')) {
        updateActivity()
      }
      
      return result
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [updateActivity])

  useEffect(() => {
    checkAuth()
    
    // Check session expiry every 30 seconds
    activityCheckInterval.current = setInterval(() => {
      checkSessionExpiry()
    }, 30000) // Check every 30 seconds

    return () => {
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current)
      }
    }
  }, [checkSessionExpiry])

  const checkAuth = async () => {
    try {
      // Check session expiry first
      if (isSessionExpired()) {
        setUser(null)
        router.push('/sign-in')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setUser(data.user)
        // Update activity on successful auth check
        updateActivity()
      } else {
        setUser(null)
        router.push('/sign-in')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      router.push('/sign-in')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current)
      }
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return { user, loading, logout, checkAuth }
}
