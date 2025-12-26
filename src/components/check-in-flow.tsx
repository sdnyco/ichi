"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"

import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker"
import { generateAlias } from "@/lib/alias"
import {
  DURATION_OPTIONS,
  MAX_HINT_LENGTH,
  MOOD_OPTIONS,
} from "@/lib/checkins"
import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type CheckInFlowProps = {
  placeId: string
  locale: Locale
}

type PlaceContextActiveCheckin = {
  id: string
  startedAt: string
  expiresAt: string
}

type PlaceContextResponse = {
  activeCheckin: PlaceContextActiveCheckin | null
}

type PingEligibility = {
  eligibleCount: number
  isPlaceEmpty: boolean
  sendLimitAvailable: boolean
}

type PingEligibilityResponse =
  | { ok: true; eligibility: PingEligibility }
  | { ok: false; error?: string }

type SendPingResponse =
  | { ok: true; sentToCount: number }
  | {
      ok: false
      reason?: "no_recipients" | "send_limit" | "not_empty" | "email_failed"
    }

const STEP_IDS = ["duration", "mood", "hint", "alias"] as const

export function CheckInFlow({ placeId, locale }: CheckInFlowProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(
    DURATION_OPTIONS[0].minutes,
  )
  const [mood, setMood] = useState(MOOD_OPTIONS[0].id)
  const [recognizabilityHint, setRecognizabilityHint] = useState("")
  const [alias, setAlias] = useState(() => generateAlias())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [accountDisabled, setAccountDisabled] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [activeCheckin, setActiveCheckin] =
    useState<PlaceContextActiveCheckin | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [pingEligibility, setPingEligibility] =
    useState<PingEligibility | null>(null)
  const [isPingEligibilityLoading, setIsPingEligibilityLoading] =
    useState(false)
  const [isSendingPing, setIsSendingPing] = useState(false)
  const [pingStatus, setPingStatus] = useState<
    | "success"
    | "no_recipients"
    | "send_limit"
    | "not_empty"
    | "email_failed"
    | "error"
    | null
  >(null)
  const lastPingEligibilityCheckRef = useRef<string | null>(null)

  const currentStepId = STEP_IDS[stepIndex]
  const canShowPingCta =
    Boolean(
      activeCheckin &&
        pingEligibility &&
        pingEligibility.isPlaceEmpty &&
        pingEligibility.sendLimitAvailable &&
        pingEligibility.eligibleCount > 0,
    ) && !accountDisabled
  const pingStatusKeyMap: Record<
    Exclude<
      typeof pingStatus,
      null
    >,
    string
  > = {
    success: "checkin.ping.success",
    no_recipients: "checkin.ping.none",
    send_limit: "checkin.ping.limit",
    not_empty: "checkin.ping.notEmpty",
    email_failed: "checkin.ping.error",
    error: "checkin.ping.error",
  }
  const pingStatusMessage = pingStatus
    ? t(locale, pingStatusKeyMap[pingStatus])
    : null
  const pingStatusTone =
    pingStatus === "success"
      ? "success"
      : pingStatus === "error" || pingStatus === "email_failed"
        ? "error"
        : "warning"
  const pingStatusClass =
    pingStatusTone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : pingStatusTone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-800"
  const pingCtaDisabled = isSendingPing || isPingEligibilityLoading
  const refreshActiveCheckin = useCallback(async () => {
    if (!userId) return
    try {
      const params = new URLSearchParams({ placeId, userId })
      const response = await fetch(`/api/me/place-context?${params.toString()}`)
      if (!response.ok) {
        throw new Error("place_context_failed")
      }
      const data = (await response.json()) as PlaceContextResponse
      setActiveCheckin(data.activeCheckin)
    } catch (err) {
      console.error(err)
    }
  }, [placeId, userId])

  const fetchPingEligibility = useCallback(
    async (force = false) => {
      if (!activeCheckin) return
      if (!userId) return
      if (!force && lastPingEligibilityCheckRef.current === activeCheckin.id) {
        return
      }
      lastPingEligibilityCheckRef.current = activeCheckin.id
      setIsPingEligibilityLoading(true)
      try {
        const params = new URLSearchParams({
          placeId,
          checkInId: activeCheckin.id,
        })
        const response = await fetch(`/api/pings/eligibility?${params.toString()}`)

        if (response.status === 401 || response.status === 404) {
          setPingEligibility(null)
          return
        }

        if (!response.ok) {
          console.error("ping_eligibility_failed", response.status)
          setPingEligibility(null)
          return
        }

        const data = (await response.json()) as PingEligibilityResponse
        if (data.ok) {
          setPingEligibility(data.eligibility)
        } else {
          setPingEligibility(null)
        }
      } catch (error) {
        console.error(error)
        setPingEligibility(null)
      } finally {
        setIsPingEligibilityLoading(false)
      }
    },
    [activeCheckin, placeId, userId],
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    setUserId(getOrCreateLocalUserId())
  }, [])

  useEffect(() => {
    void refreshActiveCheckin()
  }, [refreshActiveCheckin])

  useEffect(() => {
    if (!activeCheckin) {
      setPingEligibility(null)
      setPingStatus(null)
      lastPingEligibilityCheckRef.current = null
      return
    }
    setPingStatus(null)
    void fetchPingEligibility()
  }, [activeCheckin, fetchPingEligibility])

  useEffect(() => {
    if (activeCheckin && isOpen) {
      setIsOpen(false)
    }
  }, [activeCheckin, isOpen])

  const durationOptions = useMemo(
    () =>
      DURATION_OPTIONS.map((option) => ({
        value: option.minutes,
        label: t(locale, option.labelKey),
      })),
    [locale],
  )

  const moodOptions = useMemo(
    () =>
      MOOD_OPTIONS.map((option) => ({
        id: option.id,
        label: t(locale, option.labelKey),
      })),
    [locale],
  )

  function handleNext() {
    setStepIndex((index) => Math.min(index + 1, STEP_IDS.length - 1))
  }

  function handleBack() {
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  function handleRegenerateAlias() {
    setAlias(generateAlias())
  }

  function handleSubmit() {
    if (!userId) {
      setUserId(getOrCreateLocalUserId())
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const response = await fetch("/api/check-ins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            placeId,
            durationMinutes,
            mood,
            alias,
            recognizabilityHint: recognizabilityHint.trim() || undefined,
          }),
        })

        if (response.status === 409) {
          setError(t(locale, "checkin.status.blocked"))
          await refreshActiveCheckin()
          return
        }

        if (response.status === 403) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string
          }
          if (data?.error === "account_disabled") {
            setAccountDisabled(true)
            setIsOpen(false)
            setError(t(locale, "checkin.status.disabled"))
            return
          }
          setError(t(locale, "checkin.status.error"))
          return
        }

        if (!response.ok) {
          setError(t(locale, "checkin.status.error"))
          return
        }

        setSuccess(true)
        setIsOpen(false)
        setStepIndex(0)
        setRecognizabilityHint("")
        setAlias(generateAlias())
        await refreshActiveCheckin()
        router.refresh()
      } catch (err) {
        console.error(err)
        setError(t(locale, "checkin.status.error"))
      }
    })
  }

  const handleSendPing = useCallback(() => {
    if (!activeCheckin) return
    setIsSendingPing(true)
    setPingStatus(null)
    void fetch("/api/pings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId,
        senderCheckInId: activeCheckin.id,
      }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as SendPingResponse
        if (response.ok && data.ok) {
          setPingStatus("success")
          setPingEligibility(null)
          lastPingEligibilityCheckRef.current = null
        } else {
          const reason =
            (data.reason as NonNullable<typeof pingStatus>) ?? "error"
          setPingStatus(reason)
          void fetchPingEligibility(true)
        }
      })
      .catch((error) => {
        console.error(error)
        setPingStatus("error")
      })
      .finally(() => {
        setIsSendingPing(false)
      })
  }, [activeCheckin, fetchPingEligibility, placeId])

  function handleToggle() {
    setIsOpen((prev) => !prev)
    setSuccess(false)
    setError(null)
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-500">
            {t(locale, "checkin.cta.label")}
          </p>
          <h2 className="text-2xl font-medium text-zinc-900">
            {t(locale, "checkin.cta.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60"
          disabled={
            isPending || Boolean(activeCheckin) || !userId || accountDisabled
          }
        >
          {isOpen
            ? t(locale, "checkin.cta.close")
            : t(locale, "checkin.cta.open")}
        </button>
      </div>

      {activeCheckin ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t(locale, "checkin.status.blocked")}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {t(locale, "checkin.status.success")}
        </p>
      ) : null}

      {canShowPingCta ? (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
          <div className="flex flex-col gap-3">
            <p>{t(locale, "checkin.ping.description")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSendPing}
                disabled={pingCtaDisabled || isPending || accountDisabled}
                className="rounded-full bg-blue-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:pointer-events-none disabled:opacity-60"
              >
                {isSendingPing
                  ? t(locale, "checkin.ping.pending")
                  : t(locale, "checkin.ping.cta")}
              </button>
              {isPingEligibilityLoading ? (
                <span className="text-xs text-blue-800">
                  {t(locale, "checkin.ping.loading")}
                </span>
              ) : null}
            </div>
            {pingStatusMessage ? (
              <p className={`rounded-md border px-3 py-2 text-xs ${pingStatusClass}`}>
                {pingStatusMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : pingStatusMessage ? (
        <p className={`mt-4 rounded-md border px-3 py-2 text-sm ${pingStatusClass}`}>
          {pingStatusMessage}
        </p>
      ) : null}

      {accountDisabled ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {t(locale, "checkin.status.disabled")}
        </p>
      ) : null}

      {error && !accountDisabled ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isOpen ? (
        <div className="mt-6 space-y-6">
          <ProgressDots currentStepIndex={stepIndex} locale={locale} />

          {currentStepId === "duration" ? (
            <DurationStep
              locale={locale}
              options={durationOptions}
              value={durationMinutes}
              onChange={setDurationMinutes}
            />
          ) : null}

          {currentStepId === "mood" ? (
            <MoodStep
              locale={locale}
              options={moodOptions}
              value={mood}
              onChange={setMood}
            />
          ) : null}

          {currentStepId === "hint" ? (
            <HintStep
              locale={locale}
              value={recognizabilityHint}
              onChange={setRecognizabilityHint}
            />
          ) : null}

          {currentStepId === "alias" ? (
            <AliasStep
              locale={locale}
              alias={alias}
              onRegenerate={handleRegenerateAlias}
            />
          ) : null}

          <StepControls
            locale={locale}
            stepIndex={stepIndex}
            isPending={isPending}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </div>
  )
}

function ProgressDots({
  currentStepIndex,
  locale,
}: {
  currentStepIndex: number
  locale: Locale
}) {
  return (
    <div className="flex items-center gap-3">
      {STEP_IDS.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              index === currentStepIndex
                ? "bg-zinc-900"
                : "bg-zinc-300 dark:bg-zinc-600",
            )}
          />
          {index < STEP_IDS.length - 1 ? (
            <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700" />
          ) : null}
        </div>
      ))}
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        {t(locale, "checkin.stepper.progress", {
          current: String(currentStepIndex + 1),
          total: String(STEP_IDS.length),
        })}
      </span>
    </div>
  )
}

function DurationStep({
  locale,
  options,
  value,
  onChange,
}: {
  locale: Locale
  options: { value: number; label: string }[]
  value: number
  onChange: (minutes: number) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-zinc-900">
        {t(locale, "checkin.duration.title")}
      </h3>
      <p className="text-sm text-zinc-500">
        {t(locale, "checkin.duration.description")}
      </p>
      <WheelPickerWrapper>
        <WheelPicker
          value={value}
          onValueChange={(nextValue) => onChange(Number(nextValue))}
          options={options}
          visibleCount={8}
        />
      </WheelPickerWrapper>
    </div>
  )
}

function MoodStep({
  locale,
  options,
  value,
  onChange,
}: {
  locale: Locale
  options: { id: string; label: string }[]
  value: string
  onChange: (mood: string) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-zinc-900">
        {t(locale, "checkin.mood.title")}
      </h3>
      <p className="text-sm text-zinc-500">
        {t(locale, "checkin.mood.description")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
              value === option.id
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function HintStep({
  locale,
  value,
  onChange,
}: {
  locale: Locale
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-zinc-900">
        {t(locale, "checkin.hint.title")}
      </h3>
      <p className="text-sm text-zinc-500">
        {t(locale, "checkin.hint.description")}
      </p>
      <textarea
        value={value}
        onChange={(event) => {
          if (event.target.value.length > MAX_HINT_LENGTH) return
          onChange(event.target.value)
        }}
        maxLength={MAX_HINT_LENGTH}
        rows={3}
        placeholder={t(locale, "checkin.hint.placeholder")}
        className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-inner focus:border-zinc-400 focus:outline-none"
      />
      <p className="text-right text-xs text-zinc-400">
        {t(locale, "checkin.hint.counter", {
          count: String(MAX_HINT_LENGTH - value.length),
        })}
      </p>
    </div>
  )
}

function AliasStep({
  locale,
  alias,
  onRegenerate,
}: {
  locale: Locale
  alias: string
  onRegenerate: () => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-zinc-900">
        {t(locale, "checkin.alias.title")}
      </h3>
      <p className="text-sm text-zinc-500">
        {t(locale, "checkin.alias.description")}
      </p>
      <div className="rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-4 text-center text-white shadow-sm">
        <p className="text-xl font-semibold">{alias}</p>
      </div>
      <button
        type="button"
        onClick={onRegenerate}
        className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
      >
        {t(locale, "checkin.alias.regenerate")}
      </button>
    </div>
  )
}

function StepControls({
  locale,
  stepIndex,
  isPending,
  onBack,
  onNext,
  onSubmit,
}: {
  locale: Locale
  stepIndex: number
  isPending: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={stepIndex === 0 || isPending}
        className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 disabled:pointer-events-none disabled:opacity-40"
      >
        {t(locale, "checkin.stepper.back")}
      </button>
      {stepIndex < STEP_IDS.length - 1 ? (
        <button
          type="button"
          onClick={onNext}
          disabled={isPending}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60"
        >
          {t(locale, "checkin.stepper.next")}
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60"
        >
          {isPending
            ? t(locale, "checkin.stepper.pending")
            : t(locale, "checkin.stepper.confirm")}
        </button>
      )}
    </div>
  )
}

