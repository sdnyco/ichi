"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { OtherProfileSheet } from "@/components/profile/other-profile-sheet"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { PlaceGalleryBuckets, PlaceGalleryEntry } from "@/db/queries/places"
import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"
import { formatDurationToken } from "@/lib/time"
import { cn } from "@/lib/utils"

type PlaceGalleryProps = {
  gallery: PlaceGalleryBuckets
  placeId: string
  placeName: string
  locale: Locale
  initialViewerUserId?: string | null
  renderedAt?: string
}

type GalleryCardMarker = "you" | "anchored"

type GalleryCardModel = {
  key: string
  userId: string
  alias: string
  metadata?: string
  checkInId?: string
  marker?: {
    type: GalleryCardMarker
    label: string
  }
}

export function PlaceGallery({
  gallery,
  placeId,
  placeName,
  locale,
  initialViewerUserId,
  renderedAt,
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

  function handleCardClick(userId: string, checkInId?: string | null) {
    if (!userId) return
    setSelectedUserId(userId)
    setSelectedCheckInId(checkInId ?? null)
    setIsProfileOpen(true)
  }

  const referenceNow = useMemo(
    () => (renderedAt ? new Date(renderedAt) : new Date()),
    [renderedAt],
  )

  const shelves = useMemo(() => {
    const youCards = gallery.you.map<GalleryCardModel>((entry) => ({
      key: entry.id,
      userId: entry.userId,
      alias: entry.alias,
      metadata: formatCheckInMeta(entry, referenceNow, locale),
      checkInId: entry.id,
      marker: {
        type: "you",
        label: t(locale, "place.gallery.marker.you"),
      },
    }))

    const nowCards = gallery.now.map<GalleryCardModel>((entry) => ({
      key: entry.id,
      userId: entry.userId,
      alias: entry.alias,
      metadata: formatCheckInMeta(entry, referenceNow, locale),
      checkInId: entry.id,
    }))

    const anchoredCards = gallery.anchored.map<GalleryCardModel>((entry) => ({
      key: entry.profileId,
      userId: entry.userId,
      alias: entry.alias,
      metadata: t(locale, "place.gallery.metaAnchored"),
      marker: {
        type: "anchored",
        label: t(locale, "place.gallery.marker.anchored"),
      },
    }))

    return [
      {
        key: "you" as const,
        label: t(locale, "place.gallery.shelf.you"),
        cards: youCards,
      },
      {
        key: "now" as const,
        label: t(locale, "place.gallery.shelf.now"),
        cards: nowCards,
      },
      {
        key: "anchored" as const,
        label: t(locale, "place.gallery.shelf.anchored"),
        cards: anchoredCards,
      },
    ]
  }, [gallery, locale, referenceNow])

  const hasAnyEntries = shelves.some((shelf) => shelf.cards.length > 0)

  return (
    <>
      {hasAnyEntries ? (
        <div className="space-y-8">
          {shelves.map((shelf) =>
            shelf.cards.length > 0 ? (
              <div key={shelf.key} className="space-y-3">
                <p className="text-sm font-medium text-zinc-500">
                  {shelf.label}
                </p>
                <Carousel
                  opts={{ align: "center", containScroll: "trimSnaps" }}
                  className="w-full"
                >
                  <CarouselContent>
                    {shelf.cards.map((card) => (
                      <CarouselItem
                        key={card.key}
                        className="basis-[85%] pr-4 md:basis-[45%] lg:basis-[32%]"
                      >
                        <GalleryCard card={card} onSelect={handleCardClick} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
          {t(locale, "place.gallery.empty")}
        </p>
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

function GalleryCard({
  card,
  onSelect,
}: {
  card: GalleryCardModel
  onSelect: (userId: string, checkInId?: string | null) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(card.userId, card.checkInId)}
      className={cn(
        "flex h-full w-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        card.marker?.type === "you" &&
          "border-zinc-900 ring-2 ring-zinc-900/20 hover:border-zinc-900",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-medium text-zinc-900">{card.alias}</p>
        {card.marker ? (
          <Badge
            className={cn(
              "border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700",
              card.marker.type === "you" && "border-zinc-900 text-zinc-900",
            )}
          >
            {card.marker.label}
          </Badge>
        ) : null}
      </div>
      {card.metadata ? (
        <p className="text-sm text-zinc-500">{card.metadata}</p>
      ) : null}
    </button>
  )
}

function formatCheckInMeta(
  entry: PlaceGalleryEntry,
  referenceNow: Date,
  locale: Locale,
) {
  return t(locale, "place.gallery.meta", {
    started: formatRelativeTime(entry.startedAt, referenceNow, locale),
    expires: formatRelativeTime(entry.expiresAt, referenceNow, locale),
  })
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

