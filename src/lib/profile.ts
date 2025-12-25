export const AGE_BANDS = ["18-24", "25-29", "30-39", "40-49", "50+"] as const

export type AgeBand = (typeof AGE_BANDS)[number]

export const HEIGHT_MIN_CM = 120
export const HEIGHT_MAX_CM = 230

export const MAX_HOOKS = 10
export const MAX_HOOK_LENGTH = 60

export type HookListParseResult =
  | { ok: true; hooks: string[] | null }
  | { ok: false; error: "invalid_hooks" | "hook_too_long" }

export function parseHookListInput(value: unknown): HookListParseResult {
  if (value === null) {
    return { ok: true, hooks: null }
  }

  if (!Array.isArray(value)) {
    return { ok: false, error: "invalid_hooks" }
  }

  const sanitized: string[] = []

  for (const raw of value) {
    if (typeof raw !== "string") {
      return { ok: false, error: "invalid_hooks" }
    }

    const trimmed = raw.trim()
    if (!trimmed) continue

    if (trimmed.length > MAX_HOOK_LENGTH) {
      return { ok: false, error: "hook_too_long" }
    }

    sanitized.push(trimmed)

    if (sanitized.length >= MAX_HOOKS) {
      break
    }
  }

  return { ok: true, hooks: sanitized }
}

