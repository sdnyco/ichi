const isDevEnv = process.env.NODE_ENV === "development"

function ensureDevOnly<T>(value: T | null): T | null {
  return isDevEnv ? value : null
}

/**
 * Dev-only testing override; do not enable in production.
 */
export function getCheckinDurationDevOverrideMinutes(): number | null {
  const raw = ensureDevOnly(process.env.CHECKIN_DURATION_MINUTES_DEV ?? null)
  if (!raw) return null
  const minutes = Number.parseInt(raw, 10)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null
  }
  return minutes
}

/**
 * Dev-only testing override; do not enable in production.
 */
export function arePingRateLimitsDisabled(): boolean {
  return (
    isDevEnv && String(process.env.PINGS_DISABLE_RATE_LIMITS_DEV).toLowerCase() === "true"
  )
}

/**
 * Dev-only testing override; do not enable in production.
 */
export function getDevPingMaxRecipients(): number | null {
  const raw = ensureDevOnly(process.env.PINGS_MAX_RECIPIENTS_DEV ?? null)
  if (!raw) return null
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }
  return value
}

