"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Flag } from "lucide-react"

import { HOOK_LABEL_BY_ID } from "@/lib/hooks-catalog"
import { formatDurationToken } from "@/lib/time"
import { t, type Locale } from "@/lib/i18n"
import { MOOD_OPTIONS } from "@/lib/checkins"

type OtherProfileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewerUserId: string
  targetUserId: string | null
  placeId: string
  placeName: string
  locale: Locale
  checkInId?: string
  onBlocked?: () => void
}

type ProfileResponse = {
  profile: {
    alias: string
    lastHooks: string[] | null
  }
  userTraits: {
    ageBand: string | null
    heightCm: number | null
  } | null
  activeCheckin: {
    id: string
    mood: string
    hooks: string[] | null
    recognizabilityHint: string | null
    startedAt: string
    expiresAt: string
  } | null
  lastSeenAt: string | null
  isBlockedByViewer: boolean
}

export function OtherProfileSheet({
  open,
  onOpenChange,
  viewerUserId,
  targetUserId,
  placeId,
  placeName,
  locale,
  checkInId,
  onBlocked,
}: OtherProfileSheetProps) {
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState<number>(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].id)
  const [reportMessage, setReportMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !targetUserId || !viewerUserId) return
    startTransition(() => {
      setIsLoading(true)
      setError(null)
      setData(null)
    })

    const params = new URLSearchParams({
      viewerUserId,
      placeId,
      targetUserId,
    })

    void fetch(`/api/profiles?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("load_failed")
        }
        const json = (await res.json()) as ProfileResponse
        setData(json)
      })
      .catch(() => setError("load_failed"))
      .finally(() => setIsLoading(false))
  }, [open, targetUserId, viewerUserId, placeId])

  useEffect(() => {
    if (data && open) {
      startTransition(() => {
        setTimestamp(Date.now())
      })
    }
  }, [data, open])

  const activeCheckin = data?.activeCheckin ?? null
  const hasActiveCheckin = Boolean(activeCheckin)

  const moodLabel = useMemo(() => {
    if (!activeCheckin?.mood) return null
    const option = MOOD_OPTIONS.find((option) => option.id === activeCheckin.mood)
    return option ? t(locale, option.labelKey) : activeCheckin.mood
  }, [activeCheckin?.mood, locale])

  const isViewingSelf =
    Boolean(targetUserId) && Boolean(viewerUserId)
      ? targetUserId === viewerUserId
      : false

  const hookSource =
    (hasActiveCheckin ? activeCheckin?.hooks : data?.profile?.lastHooks) ?? []
  const hookLabels = hookSource
    .filter((hook): hook is string => Boolean(hook && hook.trim()))
    .slice(0, 3)
    .map((hook) =>
      HOOK_LABEL_BY_ID[hook] ? t(locale, HOOK_LABEL_BY_ID[hook]) : hook,
    )

  let startedMinutes = 0
  let remainingMinutes = 0
  if (hasActiveCheckin && activeCheckin && timestamp) {
    startedMinutes = Math.max(
      0,
      Math.round((timestamp - new Date(activeCheckin.startedAt).getTime()) / 60000),
    )
    remainingMinutes = Math.max(
      0,
      Math.round((new Date(activeCheckin.expiresAt).getTime() - timestamp) / 60000),
    )
  }

  const statusText = useMemo(() => {
    if (!data || isLoading || error) {
      return null
    }
    if (hasActiveCheckin && activeCheckin) {
      return t(
        locale,
        isViewingSelf ? "profile.checkin.statusSelf" : "profile.checkin.statusOther",
        {
        place: placeName,
        agoFormatted: formatDurationToken(startedMinutes),
        remainingFormatted: formatDurationToken(remainingMinutes),
        },
      )
    }

    if (data.lastSeenAt) {
      const reference = timestamp || Date.now()
      const minutes = Math.max(
        0,
        Math.round((reference - new Date(data.lastSeenAt).getTime()) / 60000),
      )
      return t(locale, "profile.status.lastSeen", {
        count: formatLastSeenDuration(minutes),
      })
    }

    return t(locale, "profile.status.notActive")
  }, [
    activeCheckin,
    data,
    error,
    hasActiveCheckin,
    isLoading,
    locale,
    placeName,
    remainingMinutes,
    startedMinutes,
    timestamp,
  ])
  const isBlocked = data?.isBlockedByViewer ?? false

  async function handleBlockToggle() {
    if (!viewerUserId || !targetUserId) return
    const confirmMessage = isBlocked
      ? t(locale, "profile.safety.confirmUnblock")
      : t(locale, "profile.safety.confirmBlock")
    if (!window.confirm(confirmMessage)) return
    setIsSubmitting(true)
    try {
      if (isBlocked) {
        const params = new URLSearchParams({
          blockerUserId: viewerUserId,
          blockedUserId: targetUserId,
        })
        const res = await fetch(`/api/blocks?${params.toString()}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("unblock_failed")
        setData((prev) =>
          prev ? { ...prev, isBlockedByViewer: false } : prev,
        )
      } else {
        const res = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockerUserId: viewerUserId,
            blockedUserId: targetUserId,
          }),
        })
        if (!res.ok) throw new Error("block_failed")
        onBlocked?.()
      }
    } catch (err) {
      console.error(err)
      window.alert(t(locale, "profile.safety.error"))
    } finally {
      setIsSubmitting(false)
      setIsMenuOpen(false)
    }
  }

  async function handleSubmitReport() {
    if (!viewerUserId || !targetUserId) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterUserId: viewerUserId,
          reportedUserId: targetUserId,
          reasonCode: reportReason,
          freeText: reportMessage,
          placeId,
          checkInId: checkInId ?? data?.activeCheckin?.id ?? null,
        }),
      })
      if (!res.ok) throw new Error("report_failed")
      window.alert(t(locale, "profile.safety.reportSuccess"))
      setIsReportOpen(false)
      setReportMessage("")
    } catch (error) {
      console.error(error)
      window.alert(t(locale, "profile.safety.error"))
    } finally {
      setIsSubmitting(false)
      setIsMenuOpen(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 overflow-hidden focus:outline-none">
          <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
            <div className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-white/5 bg-zinc-950/90 px-4 backdrop-blur">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-2 text-sm text-white transition hover:text-white/80"
              >
                ← {t(locale, "profile.back")}
              </button>
              {viewerUserId && targetUserId ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/60"
                    aria-label={t(locale, "profile.safety.menu")}
                  >
                    <Flag className="h-4 w-4" aria-hidden />
                    <span className="sr-only">{t(locale, "profile.safety.menu")}</span>
                  </button>
                  {isMenuOpen ? (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-zinc-900 p-2 text-sm text-white shadow-lg">
                      <button
                        type="button"
                        onClick={handleBlockToggle}
                        className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/10"
                        disabled={isSubmitting}
                      >
                        {isBlocked
                          ? t(locale, "profile.safety.unblock")
                          : t(locale, "profile.safety.block")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReportOpen(true)
                          setIsMenuOpen(false)
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/10"
                      >
                        {t(locale, "profile.safety.report")}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
                <Dialog.Title className="sr-only">
                  {t(locale, "profile.sheet.title")}
                </Dialog.Title>
                {isLoading ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-zinc-200">
                    {t(locale, "profile.loading")}
                  </div>
                ) : error ? (
                  <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
                    {t(locale, "profile.loadError")}
                  </div>
                ) : data ? (
                  <>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-400">
                        {t(locale, "profile.alias.label")}
                      </p>
                      <h1 className="text-4xl font-semibold text-white">
                        {data.profile.alias}
                      </h1>
                      {statusText ? (
                        <p className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-zinc-100">
                          {statusText}
                        </p>
                      ) : null}
                    </div>

                    <section className="space-y-6">
                      {hasActiveCheckin ? (
                        <>
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              {t(locale, "profile.mood.label")}
                            </p>
                            <h2 className="text-2xl font-semibold text-white">
                              {t(locale, "profile.mood.title")}
                            </h2>
                            <p className="text-lg text-zinc-200">
                              {moodLabel ?? t(locale, "profile.readonly.noData")}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              {t(locale, "profile.recognizability.label")}
                            </p>
                            <h2 className="text-2xl font-semibold text-white">
                              {t(locale, "profile.recognizability.title")}
                            </h2>
                            <p className="rounded-3xl border border-white/10 bg-white/5 p-4 text-zinc-100">
                              {activeCheckin?.recognizabilityHint
                                ? activeCheckin.recognizabilityHint
                                : t(locale, "profile.readonly.noHint")}
                            </p>
                          </div>
                        </>
                      ) : null}

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">
                          {t(locale, "profile.hooks.label")}
                        </p>
                        <h2 className="text-2xl font-semibold text-white">
                          {t(locale, "profile.hooks.helper")}
                        </h2>
                        {hookLabels.length === 0 ? (
                          <p className="text-sm text-zinc-400">
                            {t(locale, "profile.readonly.noHooks")}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {hookLabels.map((hook, index) => (
                              <span
                                key={`${hook}-${index}`}
                                className="rounded-full border border-white/20 px-4 py-1 text-sm text-white"
                              >
                                {hook}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-400">
                        {t(locale, "profile.globalSection")}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-zinc-400">
                            {t(locale, "profile.age.label")}
                          </p>
                          <p className="text-lg text-white">
                            {data.userTraits?.ageBand ??
                              t(locale, "profile.readonly.noData")}
                          </p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-zinc-400">
                            {t(locale, "profile.height.label")}
                          </p>
                          <p className="text-lg text-white">
                            {data.userTraits?.heightCm
                              ? `${data.userTraits.heightCm} cm`
                              : t(locale, "profile.readonly.noData")}
                          </p>
                        </div>
                      </div>
                    </section>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {isReportOpen ? (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
              <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-zinc-900 p-6 text-white">
                <h3 className="text-xl font-semibold">
                  {t(locale, "profile.safety.reportTitle")}
                </h3>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">
                    {t(locale, "profile.safety.reportReason")}
                  </label>
                  <select
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-zinc-900 p-2 text-sm"
                  >
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {t(locale, reason.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">
                    {t(locale, "profile.safety.reportFreeform")}
                  </label>
                  <textarea
                    value={reportMessage}
                    onChange={(event) => setReportMessage(event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-white/20 bg-transparent p-3 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/60"
                    disabled={isSubmitting}
                  >
                    {t(locale, "profile.safety.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
                    disabled={isSubmitting}
                  >
                    {t(locale, "profile.safety.submit")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function formatLastSeenDuration(minutes: number) {
  const minutesPerDay = 60 * 24
  if (minutes >= minutesPerDay) {
    const days = Math.floor(minutes / minutesPerDay)
    return `${days}d`
  }
  return formatDurationToken(minutes)
}

const REPORT_REASONS = [
  { id: "spam", labelKey: "profile.safety.reason.spam" },
  { id: "abuse", labelKey: "profile.safety.reason.abuse" },
  { id: "safety", labelKey: "profile.safety.reason.safety" },
  { id: "other", labelKey: "profile.safety.reason.other" },
]

