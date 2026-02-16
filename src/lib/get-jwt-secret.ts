/**
 * Central JWT secret access. Fails fast if secret is missing or too weak.
 * Do not use fallback values - prevents accidental use of default secrets in production.
 */
const MIN_SECRET_LENGTH = 32

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || typeof secret !== 'string') {
    throw new Error(
      'JWT_SECRET environment variable is required. Set it to a random string of at least 32 characters (e.g. openssl rand -base64 32).'
    )
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters for security. Current length: ${secret.length}.`
    )
  }
  if (secret === 'your-secret-key-change-in-production') {
    throw new Error(
      'JWT_SECRET must not be the default placeholder. Set a strong random value in .env (e.g. openssl rand -base64 32).'
    )
  }
  return secret
}

/**
 * Safe getter for use in middleware where we cannot throw (would break all requests).
 * Returns null if secret is missing or weak; middleware should then treat as unauthenticated.
 */
export function getJwtSecretOrNull(): string | null {
  const secret = process.env.JWT_SECRET
  if (!secret || typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) {
    return null
  }
  if (secret === 'your-secret-key-change-in-production') {
    return null
  }
  return secret
}
