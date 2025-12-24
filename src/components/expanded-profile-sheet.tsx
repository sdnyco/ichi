"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { generateAlias } from "@/lib/alias"
import { MAX_HINT_LENGTH, MOOD_OPTIONS } from "@/lib/checkins"
import { AGE_BANDS, HOOK_SUGGESTIONS, MAX_HOOKS } from "@/lib/profile"
import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"
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
}

export function ExpandedProfileSheet({
  placeId,
  placeName,
  locale,
}: ExpandedProfileSheetProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState<PlaceContextResponse | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [aliasValue, setAliasValue] = useState("")
  const [moodValue, setMoodValue] = useState(MOOD_OPTIONS[0].id)
  const [hintValue, setHintValue] = useState("")
  const [hooksValue, setHooksValue] = useState<string[]>([])
  const [ageBandValue, setAgeBandValue] = useState<string | null>(null)
  const [heightValue, setHeightValue] = useState("")
  const [isAliasUpdating, setIsAliasUpdating] = useState(false)

  const [hasSeededHooks, setHasSeededHooks] = useState(false)
  const [saveBadge, setSaveBadge] = useState<SaveBadgeState>("idle")

  const pendingSavesRef = useRef(0)
  const savedTimeoutRef = useRef<number | null>(null)
  const lastAgeSubmitted = useRef<string | null>(null)
  const lastHeightSubmitted = useRef<number | null>(null)
  const lastMoodSubmitted = useRef<string | null>(null)
  const lastHintSubmitted = useRef<string | null>(null)
  const lastHooksSubmitted = useRef<string | null>(null)

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
    setMoodValue(data.activeCheckin?.mood ?? MOOD_OPTIONS[0].id)
    setHintValue(data.activeCheckin?.recognizabilityHint ?? "")

    if (data.activeCheckin) {
      const hooks =
        data.activeCheckin.hooks ??
        data.placeProfile?.lastHooks ??
        []
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
      if (!userId) return null
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
          throw new Error(json?.error ?? "request_failed")
        }
        markSuccess()
        return json
      } catch (error) {
        markError(error)
        throw error
      }
    },
    [markError, markSaving, markSuccess, userId],
  )

  const activeCheckin = context?.activeCheckin ?? null
  const hasActiveCheckin = Boolean(activeCheckin)
  const hasPlaceProfile = Boolean(context?.placeProfile)
  const hasContext = Boolean(context)
  const serverAgeBand = context?.userTraits?.ageBand ?? null
  const serverHeight = context?.userTraits?.heightCm ?? null

  const hooksRemaining = MAX_HOOKS - hooksValue.length
  const hooksLimitReached = hooksRemaining <= 0

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
          setContext((prev) =>
            prev
              ? {
                  ...prev,
                  placeProfile: {
                    ...response.placeProfile,
                  },
                }
              : prev,
          )
          router.refresh()
        }
      })
      .catch(() => {})
      .finally(() => setIsAliasUpdating(false))
  }, [hasPlaceProfile, placeId, router, sendPatch, userId])

  useEffect(() => {
    if (!hasContext) return
    if (!userId) return
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
    context?.userTraits,
    hasContext,
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
    if (areArraysEqual(hooksValue, serverHooks)) return
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

  function handleHookSuggestion(value: string) {
    setHooksValue((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : prev.length >= MAX_HOOKS
          ? prev
          : [...prev, value],
    )
  }

  function handleRemoveHook(value: string) {
    setHooksValue((prev) => prev.filter((item) => item !== value))
  }

  const hookHelper = `${hooksRemaining} ${t(
    locale,
    "profile.hooks.remaining",
  )}`

  const heightHelper = isHeightValid
    ? t(locale, "profile.height.helper")
    : t(locale, "profile.height.error")

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="w-full justify-center">
          {t(locale, "profile.trigger")}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-6 sm:max-w-lg"
      >
        <SheetHeader className="flex flex-col gap-2 text-left">
          <SheetTitle>{t(locale, "profile.sheet.title")}</SheetTitle>
          <SheetDescription className="flex items-center justify-between gap-2">
            <span>{t(locale, "profile.sheet.subtitle", { place: placeName })}</span>
            <Badge
              variant={
                saveBadge === "error"
                  ? "destructive"
                  : saveBadge === "saving"
                    ? "warning"
                    : saveBadge === "saved"
                      ? "success"
                      : "secondary"
              }
            >
              {badgeLabel}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-10 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
              {t(locale, "profile.loading")}
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {t(locale, "profile.loadError")}
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {t(locale, "profile.placeSection")}
                  </p>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {t(locale, "profile.alias.label")}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-4 text-center text-white shadow-sm">
                    <p className="text-xl font-semibold">
                      {aliasValue || t(locale, "profile.alias.placeholder")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">
                      {t(locale, "profile.alias.helper")}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={
                        !hasPlaceProfile || !userId || isAliasUpdating
                      }
                      onClick={handleRegenerateAlias}
                    >
                      {t(locale, "profile.alias.regenerate")}
                    </Button>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {t(locale, "profile.activeSection")}
                  </p>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {t(locale, "profile.active.title")}
                  </h3>
                  {!hasActiveCheckin ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      {t(locale, "profile.noActive")}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800">
                      {t(locale, "profile.mood.label")}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {MOOD_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={!hasActiveCheckin}
                          onClick={() => setMoodValue(option.id)}
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                            moodValue === option.id
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                            !hasActiveCheckin &&
                              "cursor-not-allowed opacity-60",
                          )}
                        >
                          {t(locale, option.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800">
                      {t(locale, "profile.recognizability.label")}
                    </label>
                    <Textarea
                      value={hintValue}
                      maxLength={MAX_HINT_LENGTH}
                      disabled={!hasActiveCheckin}
                      onChange={(event) => setHintValue(event.target.value)}
                      placeholder={t(locale, "profile.recognizability.placeholder")}
                    />
                    <p className="text-xs text-zinc-500">
                      {MAX_HINT_LENGTH - hintValue.length}{" "}
                      {t(locale, "profile.charactersLeft")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-800">
                          {t(locale, "profile.hooks.label")}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {t(locale, "profile.hooks.helper")}
                        </p>
                      </div>
                      {!hasActiveCheckin ? (
                        <Badge variant="secondary">
                          {t(locale, "profile.hooks.disabled")}
                        </Badge>
                      ) : null}
                    </div>

                    {hooksValue.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {hooksValue.map((hook) => (
                          <span
                            key={hook}
                            className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                          >
                            {hook}
                            <button
                              type="button"
                              onClick={() => handleRemoveHook(hook)}
                              disabled={!hasActiveCheckin}
                              className="text-zinc-500 transition hover:text-zinc-900 disabled:pointer-events-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">
                        {t(locale, "profile.hooks.empty")}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">{hookHelper}</p>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {t(locale, "profile.hooks.suggestions")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {HOOK_SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            disabled={
                              !hasActiveCheckin ||
                              (hooksLimitReached &&
                                !hooksValue.includes(suggestion))
                            }
                            onClick={() => handleHookSuggestion(suggestion)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition",
                              hooksValue.includes(suggestion)
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                              !hasActiveCheckin &&
                                "cursor-not-allowed opacity-50",
                            )}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {t(locale, "profile.globalSection")}
                  </p>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {t(locale, "profile.global.title")}
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800">
                      {t(locale, "profile.age.label")}
                    </label>
                    <Select
                      value={ageBandValue ?? CLEAR_AGE_VALUE}
                      onValueChange={(value) =>
                        setAgeBandValue(
                          value === CLEAR_AGE_VALUE ? null : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(locale, "profile.age.placeholder")}
                        />
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800">
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
                    />
                    <p
                      className={cn(
                        "text-xs",
                        isHeightValid ? "text-zinc-500" : "text-red-600",
                      )}
                    >
                      {heightHelper}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function areArraysEqual(a: string[], b: string[] | null) {
  if (!b) {
    return a.length === 0
  }
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

