/**
 * Simple in-memory rate limiter (per key, e.g. IP).
 * For multi-instance deployments, use Redis (e.g. @upstash/ratelimit) instead.
 */

const store = new Map<string, { count: number; resetAt: number }>()
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key)
  }
}

export interface RateLimitOptions {
  /** Max number of requests in the window */
  limit: number
  /** Window in seconds */
  windowSeconds: number
}

/**
 * Returns true if the request is allowed, false if rate limited.
 */
export function rateLimit(key: string, options: RateLimitOptions): boolean {
  cleanup()
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const entry = store.get(key)

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count += 1
  if (entry.count > options.limit) {
    return false
  }
  return true
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
