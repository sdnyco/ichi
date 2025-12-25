"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { OtherProfileSheet } from "@/components/profile/other-profile-sheet"
import type { PlaceGalleryEntry } from "@/db/queries/places"
import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"
import { formatDurationToken } from "@/lib/time"

type PlaceGalleryProps = {
  entries: PlaceGalleryEntry[]
  placeId: string
  placeName: string
  locale: Locale
  initialViewerUserId?: string | null
}

export function PlaceGallery({
  entries,
  placeId,
  placeName,
  locale,
  initialViewerUserId,
}: PlaceGalleryProps) {
  const router = useRouter()
  const [viewerUserId, setViewerUserId] = useState<string | null>(
    initialViewerUserId ?? null,
  )
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(null)
  useEffect(() => {
    if (viewerUserId) return
    startTransition(() => {
      setViewerUserId(getOrCreateLocalUserId())
    })
  }, [viewerUserId])

  function handleCardClick(userId: string, checkInId: string) {
    if (!userId) return
    setSelectedUserId(userId)
    setSelectedCheckInId(checkInId)
    setIsProfileOpen(true)
  }

  const now = useMemo(() => new Date(), [])

  return (
    <>
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
          {t(locale, "place.gallery.empty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
            >
              <button
                type="button"
                onClick={() => handleCardClick(entry.userId, entry.id)}
                className="flex w-full flex-col items-start gap-1 text-left"
              >
                <p className="text-lg font-medium text-zinc-900">
                  {entry.alias}
                </p>
                <p className="text-sm text-zinc-500">
                  {t(locale, "place.gallery.meta", {
                    started: formatRelativeTime(entry.startedAt, now, locale),
                    expires: formatRelativeTime(entry.expiresAt, now, locale),
                  })}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <OtherProfileSheet
        open={isProfileOpen}
        onOpenChange={(open) => {
          setIsProfileOpen(open)
          if (!open) {
            setSelectedUserId(null)
            setSelectedCheckInId(null)
          }
        }}
        viewerUserId={viewerUserId ?? ""}
        targetUserId={selectedUserId}
        placeId={placeId}
        placeName={placeName}
        locale={locale}
        checkInId={selectedCheckInId ?? undefined}
        onBlocked={() => {
          setIsProfileOpen(false)
          setSelectedUserId(null)
          setSelectedCheckInId(null)
          router.refresh()
        }}
      />
    </>
  )
}

function formatRelativeTime(
  target: string | Date,
  now: Date,
  locale: Locale,
): string {
  const targetDate = target instanceof Date ? target : new Date(target)
  const diffMs = targetDate.getTime() - now.getTime()
  const minutes = Math.round(Math.abs(diffMs) / 60000)

  if (minutes === 0) {
    return t(locale, "time.relative.justNow")
  }

  const formatted = formatDurationToken(minutes)

  if (diffMs > 0) {
    return t(locale, "time.relative.futureMinutes", { count: formatted })
  }

  return t(locale, "time.relative.pastMinutes", { count: formatted })
}

