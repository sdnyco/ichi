"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

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
}

type ProfileResponse = {
  profile: {
    alias: string
  }
  userTraits: {
    ageBand: string | null
    heightCm: number | null
  } | null
  activeCheckin: {
    mood: string
    hooks: string[] | null
    recognizabilityHint: string | null
    startedAt: string
    expiresAt: string
  }
}

export function OtherProfileSheet({
  open,
  onOpenChange,
  viewerUserId,
  targetUserId,
  placeId,
  placeName,
  locale,
}: OtherProfileSheetProps) {
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState<number>(0)

  useEffect(() => {
    if (!open || !targetUserId) return
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

  const moodLabel = useMemo(() => {
    if (!data?.activeCheckin?.mood) return null
    const option = MOOD_OPTIONS.find(
      (option) => option.id === data.activeCheckin.mood,
    )
    return option ? t(locale, option.labelKey) : data.activeCheckin.mood
  }, [data, locale])

  const hookList = (data?.activeCheckin?.hooks as string[] | null) ?? []
  const hookLabels = hookList.map((hook) =>
    HOOK_LABEL_BY_ID[hook]
      ? t(locale, HOOK_LABEL_BY_ID[hook])
      : hook,
  )

  const startedMinutes =
    data && timestamp
    ? Math.max(
        0,
        Math.round(
            (timestamp - new Date(data.activeCheckin.startedAt).getTime()) /
            60000,
        ),
      )
      : 0
  const remainingMinutes =
    data && timestamp
    ? Math.max(
        0,
        Math.round(
            (new Date(data.activeCheckin.expiresAt).getTime() - timestamp) /
            60000,
        ),
      )
    : 0

  const statusText =
    data && !isLoading && !error
      ? t(locale, "profile.checkin.status", {
          place: placeName,
          agoFormatted: formatDurationToken(startedMinutes),
          remainingFormatted: formatDurationToken(remainingMinutes),
        })
      : null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 overflow-hidden focus:outline-none">
          <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
            <div className="sticky top-0 z-30 flex h-12 w-full items-center border-b border-white/5 bg-zinc-950/90 px-4 backdrop-blur">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-2 text-sm text-white transition hover:text-white/80"
              >
                ← {t(locale, "profile.back")}
              </button>
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
                          {data.activeCheckin.recognizabilityHint
                            ? data.activeCheckin.recognizabilityHint
                            : t(locale, "profile.readonly.noHint")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">
                          {t(locale, "profile.hooks.label")}
                        </p>
                        <h2 className="text-2xl font-semibold text-white">
                          {t(locale, "profile.hooks.helper")}
                        </h2>
                        {hookList.length === 0 ? (
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

