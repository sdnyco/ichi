const STORAGE_KEY = "ichi:user-id"
const COOKIE_KEY = "ichi_user_id"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export function getOrCreateLocalUserId(): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateLocalUserId must run in the browser")
  }

  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) {
    ensureCookie(existing)
    return existing
  }

  const id = crypto.randomUUID()
  window.localStorage.setItem(STORAGE_KEY, id)
  ensureCookie(id)
  return id
}

function ensureCookie(id: string) {
  if (typeof document === "undefined") return
  const current = getCookie(COOKIE_KEY)
  if (current === id) return
  document.cookie = `${COOKIE_KEY}=${id}; path=/; max-age=${COOKIE_MAX_AGE}`
}

function getCookie(name: string): string | null {
  const match = document.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match ? match.split("=")[1] ?? null : null
}

