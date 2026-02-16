/**
 * Safe API error responses: avoid leaking internal details in production.
 */

export function getSafeErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (process.env.NODE_ENV === 'production') {
    return fallback
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return fallback
}
