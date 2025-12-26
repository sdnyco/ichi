import {
  AVAILABILITY_DAY_KEYS,
  type AvailabilityDayKey,
  type AvailabilityWeekly,
  type AvailabilityWindow,
} from "@/types/availability"

const MINUTES_PER_DAY = 24 * 60

export const DEFAULT_AVAILABILITY_TIME_ZONE = "Europe/Berlin"

type AvailabilityLike = {
  isAvailabilityEnabled: boolean
  availabilityWeekly: AvailabilityWeekly | null
  availabilityTimeZone: string | null
}

type AvailabilityOptions = {
  treatDisabledAsAvailable?: boolean
}

export function isPlaceProfileAvailableNow(
  profile: AvailabilityLike,
  now = new Date(),
  options?: AvailabilityOptions,
): boolean {
  if (!profile.isAvailabilityEnabled) {
    return options?.treatDisabledAsAvailable ?? false
  }
  const weekly = profile.availabilityWeekly
  if (!weekly) return false

  const timeZone = profile.availabilityTimeZone || DEFAULT_AVAILABILITY_TIME_ZONE
  const currentMinutes = getMinutesOfDayInZone(now, timeZone)
  const dayKey = getDayKeyInZone(now, timeZone)

  const todayWindow = normalizeWindow(weekly[dayKey])
  if (todayWindow && isMinutesWithinWindow(todayWindow, currentMinutes)) {
    return true
  }

  const previousKey = getPreviousDayKey(dayKey)
  const previousWindow = normalizeWindow(weekly[previousKey])
  if (
    previousWindow &&
    isCrossMidnight(previousWindow) &&
    currentMinutes < previousWindow.end
  ) {
    return true
  }

  return false
}

export function filterAvailablePlaceProfiles<T extends AvailabilityLike>(
  profiles: T[],
  now = new Date(),
  options?: AvailabilityOptions,
): T[] {
  return profiles.filter((profile) =>
    isPlaceProfileAvailableNow(profile, now, options),
  )
}

function normalizeWindow(
  window: AvailabilityWindow | undefined,
): { start: number; end: number } | null {
  if (!window) return null
  const { start, end } = window
  if (!isMinuteValue(start) || !isMinuteValue(end)) return null
  if (start === end) return null
  return { start, end }
}

function isMinutesWithinWindow(
  window: { start: number; end: number },
  minutes: number,
): boolean {
  if (window.start < window.end) {
    return minutes >= window.start && minutes < window.end
  }

  return minutes >= window.start || minutes < window.end
}

function isCrossMidnight(window: { start: number; end: number }): boolean {
  return window.start > window.end
}

function isMinuteValue(value: number | null): value is number {
  if (value === null) return false
  if (!Number.isInteger(value)) return false
  return value >= 0 && value < MINUTES_PER_DAY
}

function getMinutesOfDayInZone(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "numeric",
    minute: "numeric",
  })

  const parts = formatter.formatToParts(date)
  const hourPart = parts.find((part) => part.type === "hour")?.value ?? "0"
  const minutePart = parts.find((part) => part.type === "minute")?.value ?? "0"

  const hours = Number.parseInt(hourPart, 10)
  const minutes = Number.parseInt(minutePart, 10)

  return hours * 60 + minutes
}

function getDayKeyInZone(date: Date, timeZone: string): AvailabilityDayKey {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  })
  const formatted = formatter.format(date).toLowerCase()

  if (formatted.startsWith("mon")) return "mon"
  if (formatted.startsWith("tue")) return "tue"
  if (formatted.startsWith("wed")) return "wed"
  if (formatted.startsWith("thu")) return "thu"
  if (formatted.startsWith("fri")) return "fri"
  if (formatted.startsWith("sat")) return "sat"
  return "sun"
}

function getPreviousDayKey(day: AvailabilityDayKey): AvailabilityDayKey {
  const index = AVAILABILITY_DAY_KEYS.indexOf(day)
  const previousIndex =
    index === 0 ? AVAILABILITY_DAY_KEYS.length - 1 : index - 1
  return AVAILABILITY_DAY_KEYS[previousIndex]
}



