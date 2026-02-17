'use client'

import { createContext, useContext, useEffect, useState, startTransition } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  compactMode: boolean
  setCompactMode: (compact: boolean) => void
  showAvatars: boolean
  setShowAvatars: (show: boolean) => void
  mounted: boolean
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  sidebarCollapsed: false,
  setSidebarCollapsed: () => null,
  compactMode: false,
  setCompactMode: () => null,
  showAvatars: true,
  setShowAvatars: () => null,
  mounted: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'crm-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [showAvatars, setShowAvatars] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load settings from localStorage
    const savedTheme = localStorage.getItem(storageKey) as Theme
    const savedSidebarCollapsed = localStorage.getItem('crm-sidebar-collapsed') === 'true'
    const savedCompactMode = localStorage.getItem('crm-compact-mode') === 'true'
    const savedShowAvatars = localStorage.getItem('crm-show-avatars') !== 'false'

    if (savedTheme) setTheme(savedTheme)
    if (savedSidebarCollapsed) setSidebarCollapsed(savedSidebarCollapsed)
    if (savedCompactMode) setCompactMode(savedCompactMode)
    if (!savedShowAvatars) setShowAvatars(false)
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = () => {
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }

    applyTheme()

    // Listen for system theme changes when theme is set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        applyTheme()
      }

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      } 
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }

    // Return cleanup function (no-op if not system theme)
    return () => {}
  }, [theme])

  useEffect(() => {
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  useEffect(() => {
    localStorage.setItem('crm-sidebar-collapsed', sidebarCollapsed.toString())
  }, [sidebarCollapsed])

  useEffect(() => {
    localStorage.setItem('crm-compact-mode', compactMode.toString())
  }, [compactMode])

  useEffect(() => {
    localStorage.setItem('crm-show-avatars', showAvatars.toString())
  }, [showAvatars])

  // Wrap setters in startTransition to improve INP: lets the browser paint the next frame
  // before React applies state updates (per Vercel Speed Insights / Core Web Vitals).
  const setThemeDeferred = (t: Theme) => startTransition(() => setTheme(t))
  const setSidebarCollapsedDeferred = (v: boolean) => startTransition(() => setSidebarCollapsed(v))
  const setCompactModeDeferred = (v: boolean) => startTransition(() => setCompactMode(v))
  const setShowAvatarsDeferred = (v: boolean) => startTransition(() => setShowAvatars(v))

  const value = {
    theme,
    setTheme: setThemeDeferred,
    sidebarCollapsed,
    setSidebarCollapsed: setSidebarCollapsedDeferred,
    compactMode,
    setCompactMode: setCompactModeDeferred,
    showAvatars,
    setShowAvatars: setShowAvatarsDeferred,
    mounted,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
