export const DURATION_OPTIONS = [
  { id: "30", minutes: 30, labelKey: "checkin.duration.option.30" },
  { id: "60", minutes: 60, labelKey: "checkin.duration.option.60" },
  { id: "120", minutes: 120, labelKey: "checkin.duration.option.120" },
  { id: "180", minutes: 180, labelKey: "checkin.duration.option.180" },
] as const

export const MOOD_OPTIONS = [
  { id: "open", labelKey: "checkin.mood.option.open" },
  { id: "focused", labelKey: "checkin.mood.option.focused" },
  { id: "lowkey", labelKey: "checkin.mood.option.lowkey" },
  { id: "social", labelKey: "checkin.mood.option.social" },
] as const

export const MAX_HINT_LENGTH = 120

export const DURATION_MINUTES_SET = new Set(
  DURATION_OPTIONS.map((option) => option.minutes),
)

export const MOOD_ID_SET = new Set(MOOD_OPTIONS.map((option) => option.id))

