"use client"

import { useCallback, useEffect, useRef, useState, type Ref } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ChevronDown, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

import { HooksPicker } from "@/components/profile/hooks-picker"
import { SaveStatusBar } from "@/components/profile/save-status-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { generateAlias } from "@/lib/alias"
import { DEFAULT_AVAILABILITY_TIME_ZONE } from "@/lib/availability"
import { isValidEmail } from "@/lib/email"
import {
  AVAILABILITY_DAY_KEYS,
  createEmptyAvailabilityWeekly,
  type AvailabilityDayKey,
  type AvailabilityWeekly,
} from "@/types/availability"
import { MAX_HINT_LENGTH, MOOD_OPTIONS } from "@/lib/checkins"
import { AGE_BANDS, MAX_HOOKS } from "@/lib/profile"
import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"
import { formatDurationToken } from "@/lib/time"
import { cn } from "@/lib/utils"

type PlaceContextResponse = {
  userId: string
  placeId: string
  place: { id: string; slug: string; name: string }
  userTraits: {
    ageBand: string | null
    heightCm: number | null
  } | null
  placeProfile: {
    alias: string
    aliasGenerated: boolean
    lastHooks: string[] | null
    isAnchored: boolean
    isAvailabilityEnabled: boolean
    availabilityTimeZone: string
    availabilityWeekly: AvailabilityWeekly | null
    contactEmail: string | null
  } | null
  activeCheckin: ActiveCheckin | null
}

type ActiveCheckin = {
  id: string
  mood: string
  recognizabilityHint: string | null
  hooks: string[] | null
  startedAt: string
  expiresAt: string
}

type PlaceProfileResponse = {
  ok: true
  placeProfile: {
    alias: string
    aliasGenerated: boolean
    lastHooks: string[] | null
    isAnchored: boolean
    isAvailabilityEnabled: boolean
    availabilityTimeZone: string
    availabilityWeekly: AvailabilityWeekly | null
    contactEmail: string | null
  }
}

type ActiveCheckinResponse =
  | { ok: true; checkIn: ActiveCheckin }
  | { ok: false; code: "NO_ACTIVE_CHECKIN" }

type SaveBadgeState = "idle" | "saving" | "saved" | "error"

const AUTOSAVE_DELAY = 600
const CLEAR_AGE_VALUE = "__none"

type ExpandedProfileSheetProps = {
  placeId: string
  placeName: string
  locale: Locale
  renderedAt: string
  triggerRef?: Ref<HTMLButtonElement>
}

export function ExpandedProfileSheet({
  placeId,
  placeName,
  locale,
  renderedAt,
  triggerRef,
}: ExpandedProfileSheetProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState<PlaceContextResponse | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [accountDisabled, setAccountDisabled] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const [aliasValue, setAliasValue] = useState("")
  const [moodValue, setMoodValue] = useState<string>(MOOD_OPTIONS[0].id)
  const [hintValue, setHintValue] = useState("")
  const [hooksValue, setHooksValue] = useState<string[]>([])
  const [isAnchoredValue, setIsAnchoredValue] = useState(false)
  const [isAvailabilityEnabledValue, setIsAvailabilityEnabledValue] =
    useState(false)
  const [availabilityWeeklyValue, setAvailabilityWeeklyValue] =
    useState<AvailabilityWeekly>(() => createEmptyAvailabilityWeekly())
  const [contactEmailValue, setContactEmailValue] = useState("")
  const [ageBandValue, setAgeBandValue] = useState<string | null>(null)
  const [heightValue, setHeightValue] = useState("")
  const [isAliasUpdating, setIsAliasUpdating] = useState(false)
  const [isAnchoringUpdating, setIsAnchoringUpdating] = useState(false)
  const [isAvailabilityUpdating, setIsAvailabilityUpdating] = useState(false)

  const [hasSeededHooks, setHasSeededHooks] = useState(false)
  const [saveBadge, setSaveBadge] = useState<SaveBadgeState>("idle")

  const pendingSavesRef = useRef(0)
  useEffect(() => {
    setHydrated(true)
  }, [])

  const savedTimeoutRef = useRef<number | null>(null)
  const lastAgeSubmitted = useRef<string | null>(null)
  const lastHeightSubmitted = useRef<number | null>(null)
  const lastMoodSubmitted = useRef<string | null>(null)
  const lastHintSubmitted = useRef<string | null>(null)
  const lastHooksSubmitted = useRef<string | null>(null)
  const lastContactEmailSubmitted = useRef<string | null>(null)
  const latestAvailabilityUpdateRef = useRef(0)

  const markSaving = useCallback(() => {
    if (savedTimeoutRef.current) {
      window.clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = null
    }
    pendingSavesRef.current += 1
    setSaveBadge("saving")
  }, [])

  const markSuccess = useCallback(() => {
    pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1)
    if (pendingSavesRef.current === 0) {
      setSaveBadge("saved")
      savedTimeoutRef.current = window.setTimeout(() => {
        setSaveBadge("idle")
        savedTimeoutRef.current = null
      }, 2000)
    }
  }, [])

  const markError = useCallback((error: unknown) => {
    pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1)
    console.error(error)
    setSaveBadge("error")
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        window.clearTimeout(savedTimeoutRef.current)
      }
    }
  }, [])

  const seedStateFromContext = useCallback((data: PlaceContextResponse) => {
    setAliasValue(data.placeProfile?.alias ?? "")
    setAgeBandValue(data.userTraits?.ageBand ?? null)
    setHeightValue(
      data.userTraits?.heightCm ? String(data.userTraits.heightCm) : "",
    )
    setIsAnchoredValue(data.placeProfile?.isAnchored ?? false)
    setIsAvailabilityEnabledValue(
      data.placeProfile?.isAvailabilityEnabled ?? false,
    )
    setAvailabilityWeeklyValue(
      normalizeAvailabilityWeekly(data.placeProfile?.availabilityWeekly ?? null),
    )
    setContactEmailValue(data.placeProfile?.contactEmail ?? "")
    setMoodValue(data.activeCheckin?.mood ?? MOOD_OPTIONS[0].id)
    setHintValue(data.activeCheckin?.recognizabilityHint ?? "")

    if (data.activeCheckin) {
      const hooks =
        data.activeCheckin.hooks ?? data.placeProfile?.lastHooks ?? []
      setHooksValue(hooks)
      setHasSeededHooks(true)
    } else {
      setHooksValue([])
      setHasSeededHooks(false)
    }

    lastAgeSubmitted.current = null
    lastHeightSubmitted.current = null
    lastMoodSubmitted.current = null
    lastHintSubmitted.current = null
    lastHooksSubmitted.current = null
  }, [])

  const fetchContext = useCallback(
    async (id: string) => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const params = new URLSearchParams({ placeId, userId: id })
        const response = await fetch(
          `/api/me/place-context?${params.toString()}`,
        )
        if (!response.ok) {
          throw new Error("failed_to_load_context")
        }
        const data = (await response.json()) as PlaceContextResponse
        setContext(data)
        seedStateFromContext(data)
      } catch (error) {
        console.error(error)
        setLoadError("context_error")
      } finally {
        setIsLoading(false)
      }
    },
    [placeId, seedStateFromContext],
  )

  useEffect(() => {
    if (!isOpen) return
    const id = getOrCreateLocalUserId()
    setUserId(id)
    setSaveBadge("idle")
    pendingSavesRef.current = 0
    fetchContext(id)
  }, [isOpen, fetchContext])

  const sendPatch = useCallback(
    async <T,>(endpoint: string, payload: Record<string, unknown>) => {
      if (!userId || accountDisabled) return null
      markSaving()
      try {
        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = (await response.json().catch(() => ({}))) as T & {
          error?: string
        }
        if (!response.ok) {
          if (json?.error === "account_disabled") {
            setAccountDisabled(true)
          }
          throw new Error(json?.error ?? "request_failed")
        }
        markSuccess()
        return json
      } catch (error) {
        markError(error)
        throw error
      }
    },
    [accountDisabled, markError, markSaving, markSuccess, userId],
  )

  const updatePlaceProfileInContext = useCallback(
    (next?: PlaceProfileResponse["placeProfile"]) => {
      if (!next) return
      setContext((prev) =>
        prev
          ? {
              ...prev,
              placeProfile: prev.placeProfile
                ? { ...prev.placeProfile, ...next }
                : next,
            }
          : prev,
      )
      setAvailabilityWeeklyValue(
        normalizeAvailabilityWeekly(next.availabilityWeekly ?? null),
      )
      if (Object.prototype.hasOwnProperty.call(next, "contactEmail")) {
        setContactEmailValue(next.contactEmail ?? "")
      }
    },
    [setContext],
  )

  const activeCheckin = context?.activeCheckin ?? null
  const hasActiveCheckin = Boolean(activeCheckin)
  const hasPlaceProfile = Boolean(context?.placeProfile)
  const serverAgeBand = context?.userTraits?.ageBand ?? null
  const serverHeight = context?.userTraits?.heightCm ?? null
  const anchoringToggleDisabled =
    !hasPlaceProfile || !userId || accountDisabled || isAnchoringUpdating
  const availabilityTimeZone =
    context?.placeProfile?.availabilityTimeZone ??
    DEFAULT_AVAILABILITY_TIME_ZONE
  const availabilityToggleDisabled =
    !hasPlaceProfile || !userId || accountDisabled || isAvailabilityUpdating
  const availabilityInputsDisabled =
    availabilityToggleDisabled || !isAvailabilityEnabledValue
  const availabilityDayRows = AVAILABILITY_DAY_KEYS.map((dayKey) => {
    const window = availabilityWeeklyValue[dayKey]
    const error = isAvailabilityEnabledValue
      ? getWeeklyDayError(window)
      : null
    return {
      dayKey,
      label: t(locale, `profile.availability.day.${dayKey}`),
      startValue: minutesToTimeInput(window.start),
      endValue: minutesToTimeInput(window.end),
      error,
    }
  })
  const contactEmailTrimmed = contactEmailValue.trim()
  const hasContactEmail = contactEmailTrimmed !== ""
  const isContactEmailFormatValid =
    !hasContactEmail || isValidEmail(contactEmailTrimmed)
  const contactEmailInputDisabled =
    !hasPlaceProfile || !userId || accountDisabled
  const showContactEmailWarning =
    isAnchoredValue && (!hasContactEmail || !isContactEmailFormatValid)

  const heightNumber =
    heightValue.trim() === "" ? null : Number.parseInt(heightValue, 10)
  const isHeightValid =
    heightNumber === null ||
    (Number.isInteger(heightNumber) &&
      heightNumber >= 120 &&
      heightNumber <= 230)

  const badgeLabel = {
    idle: t(locale, "profile.status.ready"),
    saving: t(locale, "profile.status.saving"),
    saved: t(locale, "profile.status.saved"),
    error: t(locale, "profile.status.error"),
  }[saveBadge]

  const checkInMeta = activeCheckin
    ? buildCheckInMeta(activeCheckin, placeName, renderedAt)
    : null

  const handleRegenerateAlias = useCallback(() => {
    if (!hasPlaceProfile || !userId) return
    const nextAlias = generateAlias()
    setAliasValue(nextAlias)
    setIsAliasUpdating(true)
    void sendPatch<PlaceProfileResponse>("/api/me/place-profile", {
      userId,
      placeId,
      alias: nextAlias,
    })
      .then((response) => {
        if (response?.placeProfile) {
          updatePlaceProfileInContext(response.placeProfile)
          router.refresh()
        }
      })
      .catch(() => {})
      .finally(() => setIsAliasUpdating(false))
  }, [
    hasPlaceProfile,
    placeId,
    router,
    sendPatch,
    updatePlaceProfileInContext,
    userId,
  ])

  const handleToggleAnchoring = useCallback(() => {
    if (!hasPlaceProfile || !userId || accountDisabled) return
    const previousValue = isAnchoredValue
    const nextValue = !previousValue
    setIsAnchoredValue(nextValue)
    setIsAnchoringUpdating(true)
    void sendPatch<PlaceProfileResponse>("/api/me/place-profile", {
      userId,
      placeId,
      isAnchored: nextValue,
    })
      .then((response) => {
        if (!response?.placeProfile) return
        updatePlaceProfileInContext(response.placeProfile)
      })
      .catch(() => {
        setIsAnchoredValue(previousValue)
      })
      .finally(() => setIsAnchoringUpdating(false))
  }, [
    accountDisabled,
    hasPlaceProfile,
    isAnchoredValue,
    placeId,
    sendPatch,
    updatePlaceProfileInContext,
    userId,
  ])

  const handleToggleAvailability = useCallback(() => {
    if (!hasPlaceProfile || !userId || accountDisabled) return
    const previousValue = isAvailabilityEnabledValue
    const nextValue = !previousValue
    setIsAvailabilityEnabledValue(nextValue)
    setIsAvailabilityUpdating(true)
    void sendPatch<PlaceProfileResponse>("/api/me/place-profile", {
      userId,
      placeId,
      isAvailabilityEnabled: nextValue,
    })
      .then((response) => {
        if (!response?.placeProfile) return
        updatePlaceProfileInContext(response.placeProfile)
      })
      .catch(() => {
        setIsAvailabilityEnabledValue(previousValue)
      })
      .finally(() => setIsAvailabilityUpdating(false))
  }, [
    accountDisabled,
    hasPlaceProfile,
    isAvailabilityEnabledValue,
    placeId,
    sendPatch,
    updatePlaceProfileInContext,
    userId,
  ])

  const persistAvailabilityWeekly = useCallback(
    (
      nextSchedule: AvailabilityWeekly,
      previousSchedule: AvailabilityWeekly,
    ) => {
      const requestId = latestAvailabilityUpdateRef.current + 1
      latestAvailabilityUpdateRef.current = requestId
      setIsAvailabilityUpdating(true)
      void sendPatch<PlaceProfileResponse>("/api/me/place-profile", {
        userId,
        placeId,
        availabilityWeekly: nextSchedule,
      })
        .then((response) => {
          if (latestAvailabilityUpdateRef.current !== requestId) return
          if (!response?.placeProfile) return
          updatePlaceProfileInContext(response.placeProfile)
          setAvailabilityWeeklyValue(
            normalizeAvailabilityWeekly(
              response.placeProfile.availabilityWeekly ?? null,
            ),
          )
        })
        .catch(() => {
          if (latestAvailabilityUpdateRef.current !== requestId) return
          setAvailabilityWeeklyValue(previousSchedule)
        })
        .finally(() => {
          if (latestAvailabilityUpdateRef.current === requestId) {
            setIsAvailabilityUpdating(false)
          }
        })
    },
    [placeId, sendPatch, updatePlaceProfileInContext, userId],
  )

  const handleAvailabilityTimeChange = useCallback(
    (dayKey: AvailabilityDayKey, field: "start" | "end", value: string) => {
      if (!hasPlaceProfile || !userId || accountDisabled) return
      const isClearing = value === ""
      const minutes = isClearing ? null : timeInputToMinutes(value)
      const previousSchedule = cloneAvailabilityWeekly(availabilityWeeklyValue)
      const nextSchedule: AvailabilityWeekly = {
        ...availabilityWeeklyValue,
        [dayKey]: {
          ...availabilityWeeklyValue[dayKey],
          [field]: minutes,
        },
      }
      if (isClearing) {
        nextSchedule[dayKey] = { start: null, end: null }
        setAvailabilityWeeklyValue(nextSchedule)
        persistAvailabilityWeekly(nextSchedule, previousSchedule)
        return
      }

      if (minutes === null) {
        setAvailabilityWeeklyValue(previousSchedule)
        return
      }

      setAvailabilityWeeklyValue(nextSchedule)

      const { start, end } = nextSchedule[dayKey]
      const dayComplete =
        start !== null && end !== null && start !== end
      const dayCleared = start === null && end === null

      if (dayComplete || dayCleared) {
        persistAvailabilityWeekly(nextSchedule, previousSchedule)
      }
    },
    [
      accountDisabled,
      availabilityWeeklyValue,
      hasPlaceProfile,
      persistAvailabilityWeekly,
      userId,
    ],
  )

  useEffect(() => {
    if (!context || !userId) return
    if (!context.userTraits && ageBandValue === null && heightValue === "")
      return

    const pendingHeight =
      heightNumber === null || Number.isNaN(heightNumber)
        ? null
        : heightNumber

    const ageChanged = ageBandValue !== serverAgeBand
    const heightChanged = pendingHeight !== serverHeight

    if ((!ageChanged && !heightChanged) || !isHeightValid) {
      return
    }

    const nextAgeSubmission =
      ageChanged ? (ageBandValue ?? null) : undefined
    const nextHeightSubmission =
      heightChanged ? pendingHeight : undefined

    const alreadySubmittedAge =
      nextAgeSubmission !== undefined &&
      nextAgeSubmission === lastAgeSubmitted.current
    const alreadySubmittedHeight =
      nextHeightSubmission !== undefined &&
      nextHeightSubmission === lastHeightSubmitted.current

    if (
      (nextAgeSubmission === undefined || alreadySubmittedAge) &&
      (nextHeightSubmission === undefined || alreadySubmittedHeight)
    ) {
      return
    }

    const payload: Record<string, unknown> = { userId }
    if (ageChanged) payload.ageBand = ageBandValue
    if (heightChanged) payload.heightCm = pendingHeight
    const handle = window.setTimeout(() => {
      if (nextAgeSubmission !== undefined) {
        lastAgeSubmitted.current = nextAgeSubmission
      }
      if (nextHeightSubmission !== undefined) {
        lastHeightSubmitted.current = nextHeightSubmission
      }
      void sendPatch("/api/me/user-traits", payload)
        .then(() => {
          if (nextAgeSubmission !== undefined) {
            lastAgeSubmitted.current = null
          }
          if (nextHeightSubmission !== undefined) {
            lastHeightSubmitted.current = null
          }
        setContext((prev) =>
          prev
            ? {
                ...prev,
                userTraits: {
                  ageBand: ageBandValue ?? null,
                  heightCm: pendingHeight,
                },
              }
            : prev,
        )
        })
        .catch(() => {})
    }, AUTOSAVE_DELAY)

    return () => window.clearTimeout(handle)
  }, [
    ageBandValue,
    heightNumber,
    heightValue,
    isHeightValid,
    context,
    sendPatch,
    serverAgeBand,
    serverHeight,
    userId,
  ])

  useEffect(() => {
    if (!activeCheckin) return
    if (!userId) return
    if (moodValue === activeCheckin.mood) return
    if (moodValue === lastMoodSubmitted.current) return

    const handle = window.setTimeout(() => {
      lastMoodSubmitted.current = moodValue
      void sendPatch<ActiveCheckinResponse>("/api/me/active-checkin", {
        userId,
        placeId,
        mood: moodValue,
      })
        .then((response) => {
          lastMoodSubmitted.current = null
          if (!response) return
          if (response.ok === false && response.code === "NO_ACTIVE_CHECKIN") {
            setContext((prev) =>
              prev ? { ...prev, activeCheckin: null } : prev,
            )
            return
          }
          if (response?.ok) {
            setContext((prev) =>
              prev ? { ...prev, activeCheckin: response.checkIn } : prev,
            )
          }
        })
        .catch(() => {})
    }, AUTOSAVE_DELAY)

    return () => window.clearTimeout(handle)
  }, [activeCheckin, moodValue, placeId, sendPatch, userId])

  useEffect(() => {
    if (!activeCheckin) return
    if (!userId) return
    const trimmed = hintValue.trim()
    const serverHint = activeCheckin.recognizabilityHint ?? ""
    if (trimmed === serverHint) return
    if (trimmed === lastHintSubmitted.current) return

    const handle = window.setTimeout(() => {
      lastHintSubmitted.current = trimmed
      void sendPatch<ActiveCheckinResponse>("/api/me/active-checkin", {
        userId,
        placeId,
        recognizabilityHint: trimmed || null,
      })
        .then((response) => {
          lastHintSubmitted.current = null
          if (!response) return
          if (response.ok === false && response.code === "NO_ACTIVE_CHECKIN") {
            setContext((prev) =>
              prev ? { ...prev, activeCheckin: null } : prev,
            )
            return
          }
          if (response?.ok) {
            setContext((prev) =>
              prev ? { ...prev, activeCheckin: response.checkIn } : prev,
            )
          }
        })
        .catch(() => {})
    }, AUTOSAVE_DELAY)

    return () => window.clearTimeout(handle)
  }, [activeCheckin, hintValue, placeId, sendPatch, userId])

  useEffect(() => {
    if (!activeCheckin) return
    if (!userId) return
    if (!hasSeededHooks) return
    const serverHooks = activeCheckin.hooks ?? []
    if (JSON.stringify(serverHooks) === JSON.stringify(hooksValue)) return
    const hookSignature = JSON.stringify(hooksValue)
    if (hookSignature === lastHooksSubmitted.current) return

    const handle = window.setTimeout(() => {
      lastHooksSubmitted.current = hookSignature
      void sendPatch<ActiveCheckinResponse>("/api/me/active-checkin", {
        userId,
        placeId,
        hooks: hooksValue,
      })
        .then((response) => {
          lastHooksSubmitted.current = null
          if (!response) return
          if (response.ok === false && response.code === "NO_ACTIVE_CHECKIN") {
            setContext((prev) =>
              prev ? { ...prev, activeCheckin: null } : prev,
            )
            return
          }
          if (response?.ok) {
            setContext((prev) =>
              prev
                ? {
                    ...prev,
                    activeCheckin: response.checkIn,
                    placeProfile: prev.placeProfile
                      ? {
                          ...prev.placeProfile,
                          lastHooks:
                            hooksValue.length > 0 ? hooksValue : null,
                        }
                      : prev.placeProfile,
                  }
                : prev,
            )
          }
        })
        .catch(() => {})
    }, AUTOSAVE_DELAY)

    return () => window.clearTimeout(handle)
  }, [activeCheckin, hasSeededHooks, hooksValue, placeId, sendPatch, userId])

  useEffect(() => {
    if (!hasPlaceProfile) return
    if (!userId) return
    if (accountDisabled) return
    if (!isAnchoredValue) return
    const serverEmail = context?.placeProfile?.contactEmail ?? ""
    const trimmed = contactEmailValue.trim()
    if (trimmed === serverEmail) return
    if (trimmed === lastContactEmailSubmitted.current) return
    if (trimmed && !isValidEmail(trimmed)) return

    const handle = window.setTimeout(() => {
      lastContactEmailSubmitted.current = trimmed
      void sendPatch<PlaceProfileResponse>("/api/me/place-profile", {
        userId,
        placeId,
        contactEmail: trimmed || null,
      })
        .then((response) => {
          lastContactEmailSubmitted.current = null
          if (response?.placeProfile) {
            updatePlaceProfileInContext(response.placeProfile)
          }
        })
        .catch(() => {
          lastContactEmailSubmitted.current = null
        })
    }, AUTOSAVE_DELAY)

    return () => window.clearTimeout(handle)
  }, [
    accountDisabled,
    contactEmailValue,
    context?.placeProfile?.contactEmail,
    hasPlaceProfile,
    isAnchoredValue,
    placeId,
    sendPatch,
    updatePlaceProfileInContext,
    userId,
  ])

  const heightHelper = isHeightValid
    ? t(locale, "profile.height.helper")
    : t(locale, "profile.height.error")

  const ageDisplayValue =
    ageBandValue ?? t(locale, "profile.age.placeholder")

  const ageSelectElement = hydrated ? (
    <Select
      value={ageBandValue ?? CLEAR_AGE_VALUE}
      onValueChange={(value) =>
        setAgeBandValue(value === CLEAR_AGE_VALUE ? null : value)
      }
    >
      <SelectTrigger className="h-12 border-white/30 bg-transparent text-white">
        <SelectValue placeholder={t(locale, "profile.age.placeholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CLEAR_AGE_VALUE}>
          {t(locale, "profile.age.unset")}
        </SelectItem>
        {AGE_BANDS.map((band) => (
          <SelectItem key={band} value={band}>
            {band}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <div
      aria-disabled="true"
      className="flex h-12 w-full items-center justify-between rounded-xl border border-white/30 bg-transparent px-3 text-sm text-white opacity-80"
    >
      <span className={cn("truncate", !ageBandValue && "text-white/60")}>
        {ageDisplayValue}
      </span>
      <ChevronDown className="h-4 w-4 text-white/60" aria-hidden />
    </div>
  )

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          size="lg"
          className="w-full justify-center"
        >
          {t(locale, "profile.trigger")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 overflow-hidden focus:outline-none">
          <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
            <SaveStatusBar
              status={saveBadge}
              label={badgeLabel}
              backLabel={t(locale, "profile.back")}
              onBack={() => setIsOpen(false)}
            />
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
                <Dialog.Title className="sr-only">
                  {t(locale, "profile.sheet.title")}
                </Dialog.Title>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-400">
                        {t(locale, "profile.alias.title")}
                      </p>
                      <h1 className="text-4xl font-semibold text-white">
                        {aliasValue || t(locale, "profile.alias.placeholder")}
                      </h1>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={
                        !hasPlaceProfile ||
                        !userId ||
                        isAliasUpdating ||
                        accountDisabled
                      }
                      onClick={handleRegenerateAlias}
                      className="inline-flex items-center gap-2 text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t(locale, "profile.alias.regenerate")}
                    </Button>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-400">
                          {t(locale, "profile.anchor.label")}
                        </p>
                        <p className="text-sm text-zinc-300">
                          {t(locale, "profile.anchor.helper")}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAnchoredValue}
                        disabled={anchoringToggleDisabled}
                        onClick={handleToggleAnchoring}
                        className={cn(
                          "flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                          isAnchoredValue
                            ? "border-white bg-white text-zinc-900"
                            : "border-white/30 text-white hover:border-white/60",
                          anchoringToggleDisabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition",
                            isAnchoredValue
                              ? "justify-end bg-zinc-900"
                              : "justify-start",
                          )}
                        >
                          <span className="m-1 h-4 w-4 rounded-full bg-white" />
                        </span>
                        <span>
                          {isAnchoredValue
                            ? t(locale, "profile.anchor.on")
                            : t(locale, "profile.anchor.off")}
                        </span>
                      </button>
                    </div>
                    {isAnchoredValue ? (
                      <div className="mt-4 space-y-2">
                        <label className="text-xs uppercase tracking-wide text-zinc-400">
                          {t(locale, "profile.anchor.emailLabel")}
                        </label>
                        <Input
                          value={contactEmailValue}
                          onChange={(event) => setContactEmailValue(event.target.value)}
                          placeholder={t(locale, "profile.anchor.emailPlaceholder")}
                          disabled={contactEmailInputDisabled}
                          inputMode="email"
                          className="h-12 border-white/30 bg-transparent text-white placeholder:text-white/40"
                        />
                        <p
                          className={cn(
                            "text-xs",
                            isContactEmailFormatValid
                              ? "text-zinc-400"
                              : "text-red-300",
                          )}
                        >
                          {isContactEmailFormatValid
                            ? t(locale, "profile.anchor.emailHelper")
                            : t(locale, "profile.anchor.emailInvalid")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {showContactEmailWarning ? (
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      {t(locale, "profile.anchor.emailWarning")}
                    </p>
                  ) : null}
                  {checkInMeta ? (
                    <div className="space-y-3 rounded-3xl border border-dashed border-white/20 bg-white/5 p-5">
                      <p className="text-sm text-zinc-100">
                        {t(locale, "profile.checkin.status", checkInMeta)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button variant="secondary" size="sm" disabled>
                          {t(locale, "profile.checkin.checkout")}
                        </Button>
                        <span className="text-xs text-zinc-400">
                          {t(locale, "profile.checkin.comingSoon")}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {accountDisabled ? (
                  <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-100">
                    {t(locale, "profile.status.disabled")}
                  </div>
                ) : isLoading ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-zinc-200">
                    {t(locale, "profile.loading")}
                  </div>
                ) : loadError ? (
                  <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
                    {t(locale, "profile.loadError")}
                  </div>
                ) : (
                  <>
                    <section className="space-y-12">
                      <div className="space-y-6">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-400">
                            {t(locale, "profile.mood.label")}
                          </p>
                          <h2 className="text-2xl font-semibold text-white">
                            {t(locale, "profile.mood.title")}
                          </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {MOOD_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              disabled={!hasActiveCheckin}
                              onClick={() => setMoodValue(option.id)}
                              className={cn(
                                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                                moodValue === option.id
                                  ? "border-white bg-white text-zinc-900"
                                  : "border-white/20 text-white hover:border-white/60",
                                !hasActiveCheckin &&
                                  "cursor-not-allowed opacity-40",
                              )}
                            >
                              {t(locale, option.labelKey)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-400">
                            {t(locale, "profile.recognizability.label")}
                          </p>
                          <h2 className="text-2xl font-semibold text-white">
                            {t(locale, "profile.recognizability.title")}
                          </h2>
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            value={hintValue}
                            maxLength={MAX_HINT_LENGTH}
                            disabled={!hasActiveCheckin}
                            onChange={(event) => setHintValue(event.target.value)}
                            placeholder={t(locale, "profile.recognizability.placeholder")}
                            className="min-h-[120px] border-white/20 bg-transparent text-base text-white placeholder:text-white/40"
                          />
                          <p className="text-xs text-zinc-400">
                            {t(locale, "profile.charactersLeft", {
                              count: String(MAX_HINT_LENGTH - hintValue.length),
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-400">
                            {t(locale, "profile.hooks.label")}
                          </p>
                          <h2 className="text-2xl font-semibold text-white">
                            {t(locale, "profile.hooks.helper")}
                          </h2>
                        </div>
                        {!hasActiveCheckin ? (
                          <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-300">
                            {t(locale, "profile.hooks.disabled")}
                          </span>
                        ) : null}
                        <HooksPicker
                          locale={locale}
                          selected={hooksValue}
                          max={MAX_HOOKS}
                          disabled={!hasActiveCheckin}
                          onChange={setHooksValue}
                        />
                      </div>
                    </section>

                    <div className="border-t border-dashed border-white/15" />

                    <section className="space-y-6">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-400">
                          {t(locale, "profile.globalSection")}
                        </p>
                        <h2 className="text-2xl font-semibold text-white">
                          {t(locale, "profile.global.title")}
                        </h2>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                          <label className="text-sm font-medium uppercase tracking-wide text-zinc-400">
                            {t(locale, "profile.age.label")}
                          </label>
                          {ageSelectElement}
                        </div>

                        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                          <label className="text-sm font-medium uppercase tracking-wide text-zinc-400">
                            {t(locale, "profile.height.label")}
                          </label>
                          <Input
                            value={heightValue}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(event) => {
                              const value = event.target.value.replace(/[^0-9]/g, "")
                              setHeightValue(value)
                            }}
                            placeholder="—"
                            className="h-12 border-white/30 bg-transparent text-white placeholder:text-white/40"
                          />
                          <p
                            className={cn(
                              "text-xs",
                              isHeightValid ? "text-zinc-400" : "text-red-300",
                            )}
                          >
                            {heightHelper}
                          </p>
                        </div>
                      </div>
                    </section>

                    <div className="border-t border-dashed border-white/15" />

                    <section>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              {t(locale, "profile.availability.label")}
                            </p>
                            <p className="text-sm text-zinc-300">
                              {t(locale, "profile.availability.helper")}
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAvailabilityEnabledValue}
                            disabled={availabilityToggleDisabled}
                            onClick={handleToggleAvailability}
                            className={cn(
                              "flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                              isAvailabilityEnabledValue
                                ? "border-white bg-white text-zinc-900"
                                : "border-white/30 text-white hover:border-white/60",
                              availabilityToggleDisabled && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition",
                                isAvailabilityEnabledValue
                                  ? "justify-end bg-zinc-900"
                                  : "justify-start",
                              )}
                            >
                              <span className="m-1 h-4 w-4 rounded-full bg-white" />
                            </span>
                            <span>
                              {isAvailabilityEnabledValue
                                ? t(locale, "profile.availability.on")
                                : t(locale, "profile.availability.off")}
                            </span>
                          </button>
                        </div>

                        <div className="mt-6 space-y-3">
                          {availabilityDayRows.map((day) => {
                            const hasRowError =
                              Boolean(day.error) && isAvailabilityEnabledValue
                            return (
                              <div
                                key={day.dayKey}
                                className="space-y-1 rounded-2xl border border-white/10 p-3"
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="w-16 text-sm font-semibold text-white">
                                    {day.label}
                                  </span>
                                  <div className="flex min-w-0 flex-1 flex-wrap gap-3">
                                    <div className="min-w-[120px] flex-1">
                                      <input
                                        type="time"
                                        step={900}
                                        value={day.startValue}
                                        disabled={availabilityInputsDisabled}
                                        aria-invalid={hasRowError}
                                        onChange={(event) =>
                                          handleAvailabilityTimeChange(
                                            day.dayKey,
                                            "start",
                                            event.target.value,
                                          )
                                        }
                                        className={cn(
                                          "h-11 w-full rounded-2xl border border-white/30 bg-transparent px-4 text-base font-medium text-white outline-none transition placeholder:text-white/40",
                                          availabilityInputsDisabled && "opacity-50",
                                        )}
                                      />
                                    </div>
                                    <div className="min-w-[120px] flex-1">
                                      <input
                                        type="time"
                                        step={900}
                                        value={day.endValue}
                                        disabled={availabilityInputsDisabled}
                                        aria-invalid={hasRowError}
                                        onChange={(event) =>
                                          handleAvailabilityTimeChange(
                                            day.dayKey,
                                            "end",
                                            event.target.value,
                                          )
                                        }
                                        className={cn(
                                          "h-11 w-full rounded-2xl border border-white/30 bg-transparent px-4 text-base font-medium text-white outline-none transition placeholder:text-white/40",
                                          availabilityInputsDisabled && "opacity-50",
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                                {hasRowError ? (
                                  <p className="text-xs text-red-300">
                                    {day.error === "incomplete"
                                      ? t(
                                          locale,
                                          "profile.availability.rowErrorIncomplete",
                                        )
                                      : t(
                                          locale,
                                          "profile.availability.rowErrorInvalid",
                                        )}
                                  </p>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>

                        <p className="mt-4 text-sm text-zinc-400">
                          {t(locale, "profile.availability.weeklyHint")}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {t(locale, "profile.availability.timezone", {
                            zone: availabilityTimeZone,
                          })}
                        </p>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type AvailabilityWindow = AvailabilityWeekly[AvailabilityDayKey]

function normalizeAvailabilityWeekly(
  value: AvailabilityWeekly | null,
): AvailabilityWeekly {
  if (!value) {
    return createEmptyAvailabilityWeekly()
  }

  const next = createEmptyAvailabilityWeekly()
  for (const key of AVAILABILITY_DAY_KEYS) {
    const window = value[key]
    next[key] = {
      start: isMinuteValue(window?.start) ? window!.start : null,
      end: isMinuteValue(window?.end) ? window!.end : null,
    }
  }

  return next
}

function cloneAvailabilityWeekly(
  schedule: AvailabilityWeekly,
): AvailabilityWeekly {
  const clone = createEmptyAvailabilityWeekly()
  for (const key of AVAILABILITY_DAY_KEYS) {
    clone[key] = {
      start: schedule[key].start,
      end: schedule[key].end,
    }
  }
  return clone
}

function getWeeklyDayError(
  window: AvailabilityWindow,
): "incomplete" | "invalid" | null {
  const hasStart = window.start !== null
  const hasEnd = window.end !== null
  if (!hasStart && !hasEnd) return null
  if (!hasStart || !hasEnd) return "incomplete"
  if (window.start === window.end) return "invalid"
  return null
}

function isMinuteValue(value: number | null | undefined): value is number {
  if (value === null || value === undefined) return false
  if (!Number.isInteger(value)) return false
  return value >= 0 && value < 1440
}

function minutesToTimeInput(value: number | null): string {
  if (value === null || Number.isNaN(value)) return ""
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function timeInputToMinutes(value: string): number | null {
  if (!value) return null
  const [hoursPart, minutesPart] = value.split(":")
  const hours = Number.parseInt(hoursPart, 10)
  const minutes = Number.parseInt(minutesPart, 10)
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }
  return hours * 60 + minutes
}

function buildCheckInMeta(
  activeCheckin: ActiveCheckin,
  placeName: string,
  renderedAt: string,
) {
  const now = new Date(renderedAt).getTime()
  const startedMinutes = Math.max(
    0,
    Math.round((now - new Date(activeCheckin.startedAt).getTime()) / 60000),
  )
  const remainingMinutes = Math.max(
    0,
    Math.round((new Date(activeCheckin.expiresAt).getTime() - now) / 60000),
  )

  return {
    place: placeName,
    minutesAgo: String(startedMinutes),
    minutesRemaining: String(remainingMinutes),
    agoFormatted: formatDurationToken(startedMinutes),
    remainingFormatted: formatDurationToken(remainingMinutes),
  }
}

