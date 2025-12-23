const STORAGE_KEY = "ichi:user-id"

export function getOrCreateLocalUserId(): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateLocalUserId must run in the browser")
  }

  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  window.localStorage.setItem(STORAGE_KEY, id)
  return id
}

