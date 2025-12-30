"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"

import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer"
import { generateAlias } from "@/lib/alias"
import {
  DURATION_OPTIONS,
  MAX_HINT_LENGTH,
  MOOD_OPTIONS,
} from "@/lib/checkins"
import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type PlaceCheckInDrawerProps = {
  placeId: string
  locale: Locale
  onCheckinSuccess?: () => void
  initialAlias?: string
}

type PlaceContextActiveCheckin = {
  id: string
  startedAt: string
  expiresAt: string
}

type PlaceContextResponse = {
  activeCheckin: PlaceContextActiveCheckin | null
}

const TOTAL_STEPS = 4
const STEP_IDS = ["duration", "mood", "hint", "alias"] as const

export function PlaceCheckInDrawer({
  placeId,
  locale,
  onCheckinSuccess,
  initialAlias,
}: PlaceCheckInDrawerProps) {
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState<number>(
    DURATION_OPTIONS[0].minutes,
  )
  const [mood, setMood] = useState<string>(MOOD_OPTIONS[0].id)
  const [recognizabilityHint, setRecognizabilityHint] = useState("")
  const [alias, setAlias] = useState(() => initialAlias ?? generateAlias())
  const [error, setError] = useState<string | null>(null)
  const [accountDisabled, setAccountDisabled] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeCheckin, setActiveCheckin] =
    useState<PlaceContextActiveCheckin | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasActiveCheckin = Boolean(activeCheckin)

  useEffect(() => {
    if (typeof window === "undefined") return
    setUserId(getOrCreateLocalUserId())
  }, [])

  const resetFlow = useCallback(() => {
    setStepIndex(0)
    setRecognizabilityHint("")
    setAlias(generateAlias())
    setError(null)
  }, [])

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

  useEffect(() => {
    void refreshActiveCheckin()
  }, [refreshActiveCheckin])

  useEffect(() => {
    if (activeCheckin && isDrawerOpen) {
      setIsDrawerOpen(false)
      resetFlow()
    }
  }, [activeCheckin, isDrawerOpen, resetFlow])

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

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setIsDrawerOpen(false)
        resetFlow()
      } else {
        setIsDrawerOpen(true)
        setError(null)
      }
    },
    [resetFlow],
  )

  function handleNextStep() {
    setStepIndex((index) => Math.min(index + 1, TOTAL_STEPS - 1))
  }

  function handlePreviousStep() {
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  function handleRegenerateAlias() {
    setAlias(generateAlias())
  }

  function closeDrawerAndReset() {
    setIsDrawerOpen(false)
    resetFlow()
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
            closeDrawerAndReset()
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

        closeDrawerAndReset()
        await refreshActiveCheckin()
        onCheckinSuccess?.()
        router.refresh()
      } catch (err) {
        console.error(err)
        setError(t(locale, "checkin.status.error"))
      }
    })
  }

  const isFirstStep = stepIndex === 0
  const isFinalStep = stepIndex === TOTAL_STEPS - 1
  const currentStepId = STEP_IDS[stepIndex]

  const stepContent = (() => {
    if (currentStepId === "duration") {
      return (
        <StepLayout
          stepLabel={`${stepIndex + 1} / ${TOTAL_STEPS}`}
          title={t(locale, "checkin.duration.title")}
          legend={t(locale, "checkin.duration.description")}
        >
          <WheelPickerWrapper>
            <WheelPicker
              value={durationMinutes}
              onValueChange={(value) => setDurationMinutes(Number(value))}
              options={durationOptions}
              visibleCount={8}
            />
          </WheelPickerWrapper>
        </StepLayout>
      )
    }

    if (currentStepId === "mood") {
      return (
        <StepLayout
          stepLabel={`${stepIndex + 1} / ${TOTAL_STEPS}`}
          title={t(locale, "checkin.mood.title")}
          legend={t(locale, "checkin.mood.description")}
        >
          <div className="grid grid-cols-2 gap-3">
            {moodOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setMood(option.id)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                  mood === option.id
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </StepLayout>
      )
    }

    if (currentStepId === "hint") {
      return (
        <StepLayout
          stepLabel={`${stepIndex + 1} / ${TOTAL_STEPS}`}
          title={t(locale, "checkin.hint.title")}
          legend={t(locale, "checkin.hint.description")}
        >
          <div className="space-y-3">
            <div>
              <textarea
                value={recognizabilityHint}
                onChange={(event) => {
                  if (event.target.value.length > MAX_HINT_LENGTH) return
                  setRecognizabilityHint(event.target.value)
                }}
                maxLength={MAX_HINT_LENGTH}
                rows={4}
                placeholder={t(locale, "checkin.hint.placeholder")}
                className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-inner focus:border-zinc-400 focus:outline-none"
              />
              <p className="text-right text-xs text-zinc-400">
                {t(locale, "checkin.hint.counter", {
                  count: String(MAX_HINT_LENGTH - recognizabilityHint.length),
                })}
              </p>
            </div>
          </div>
        </StepLayout>
      )
    }

    if (currentStepId === "alias") {
      return (
        <StepLayout
          stepLabel={`${stepIndex + 1} / ${TOTAL_STEPS}`}
          title={t(locale, "checkin.alias.title")}
          legend={t(locale, "checkin.alias.description")}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-3xl border border-zinc-200 bg-zinc-900/5 px-6 py-4 text-center text-zinc-900">
                <p className="text-xl font-semibold">{alias}</p>
              </div>
              <Button
                type="button"
                size="icon"
                className="h-12 w-12 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
                onClick={handleRegenerateAlias}
                disabled={isPending}
                aria-label={t(locale, "checkin.alias.regenerate")}
              >
                <RotateCcw className="h-5 w-5" aria-hidden />
              </Button>
            </div>
            <p className="text-sm text-zinc-500">
              {t(locale, "checkin.alias.legend")}
            </p>
          </div>
        </StepLayout>
      )
    }

    return null
  })()

  const drawerCtaDisabled =
    isPending || accountDisabled || hasActiveCheckin || !userId

  return (
    <>
      <Drawer open={isDrawerOpen} onOpenChange={handleDrawerOpenChange}>
        <DrawerContent>
          <DrawerTitle className="sr-only">
            {t(locale, "checkin.cta.title")}
          </DrawerTitle>
          <div className="flex h-full flex-col">
            <DrawerBody className="flex-1 pt-4">
              {stepContent ? (
                <AnimatedStepContent stepKey={currentStepId}>
                  {stepContent}
                </AnimatedStepContent>
              ) : null}
            </DrawerBody>

            <DrawerFooter>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  {isFirstStep ? null : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={handlePreviousStep}
                      disabled={isPending}
                    >
                      {t(locale, "checkin.stepper.back")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    onClick={isFinalStep ? handleSubmit : handleNextStep}
                    disabled={isPending}
                  >
                    {isFinalStep
                      ? t(locale, "checkin.stepper.confirm")
                      : t(locale, "checkin.stepper.next")}
                  </Button>
                </div>
                {error ? (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                {accountDisabled ? (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t(locale, "checkin.status.disabled")}
                  </p>
                ) : null}
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-6 pt-4 sm:px-6">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">
          <div className="rounded-3xl border border-zinc-200 bg-white/90 p-4 shadow-lg backdrop-blur">
            <Button
              type="button"
              className="pointer-events-auto w-full"
              onClick={() => handleDrawerOpenChange(true)}
              disabled={drawerCtaDisabled}
            >
              {hasActiveCheckin
                ? t(locale, "checkin.status.blocked")
                : accountDisabled
                  ? t(locale, "checkin.status.disabled")
                  : "Check In →"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function StepLayout({
  stepLabel,
  title,
  legend,
  children,
}: {
  stepLabel: string
  title: string
  legend?: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="space-y-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {stepLabel}
          </p>
          <h3 className="text-2xl font-semibold text-zinc-900">{title}</h3>
        </div>
        {legend ? <p className="text-sm text-zinc-500">{legend}</p> : null}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function AnimatedStepContent({
  stepKey,
  children,
}: {
  stepKey: string
  children: ReactNode
}) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (typeof window === "undefined") return
    const node = contentRef.current
    if (!node) return
    const updateHeight = () => setHeight(node.getBoundingClientRect().height)
    updateHeight()
    const observer = new ResizeObserver(() => updateHeight())
    observer.observe(node)
    return () => observer.disconnect()
  }, [stepKey])

  return (
    <div
      className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ height: height === null ? "auto" : `${height}px` }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}


