export type AvailabilityDayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun"

export type AvailabilityWindow = {
  start: number | null
  end: number | null
}

export type AvailabilityWeekly = Record<AvailabilityDayKey, AvailabilityWindow>

export const AVAILABILITY_DAY_KEYS: AvailabilityDayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]

export function createEmptyAvailabilityWeekly(): AvailabilityWeekly {
  return AVAILABILITY_DAY_KEYS.reduce(
    (acc, key) => {
      acc[key] = { start: null, end: null }
      return acc
    },
    {} as AvailabilityWeekly,
  )
}

export const EMPTY_AVAILABILITY_WEEKLY = createEmptyAvailabilityWeekly()


