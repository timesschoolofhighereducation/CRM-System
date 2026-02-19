/**
 * Cross-tab and visibility-based refresh sync for Tasks.
 * When tasks are created (e.g. inquiry creates automatic follow-ups), we set a flag
 * so Kanban/Follow-ups views refresh even when:
 * - User creates on Inquiries page then navigates to Tasks
 * - User has Tasks tab open in background and creates inquiry in another tab
 */
const STORAGE_KEY = 'tasks-pending-refresh'
const TTL_MS = 60_000 // 1 minute - flag expires after this

export function markTasksPendingRefresh(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    // storage event is fired automatically in other tabs when localStorage changes
  } catch {
    // ignore
  }
}

export function consumeTasksPendingRefresh(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    if (Number.isNaN(ts)) return false
    if (Date.now() - ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function onTasksRefreshNeeded(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) cb()
  }
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && consumeTasksPendingRefresh()) cb()
  }
  window.addEventListener('storage', handleStorage)
  document.addEventListener('visibilitychange', handleVisibility)
  return () => {
    window.removeEventListener('storage', handleStorage)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}
