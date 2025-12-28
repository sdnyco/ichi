"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { EmblaEventType } from "embla-carousel"
import { useRouter } from "next/navigation"

import { OtherProfileSheet } from "@/components/profile/other-profile-sheet"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import type { PlaceGalleryBuckets, PlaceGalleryEntry } from "@/db/queries/places"
import { t, type Locale } from "@/lib/i18n"
import { formatDurationToken } from "@/lib/time"
import { cn } from "@/lib/utils"

type PlaceGalleryProps = {
  gallery: PlaceGalleryBuckets
  placeId: string
  placeName: string
  locale: Locale
  initialViewerUserId?: string | null
  renderedAt: string
  checkinVersion?: number
  onSelfProfileRequested?: () => void
}

const JUST_CHECKED_IN_TTL_MS = 90 * 1000

type GalleryItemKind = "self" | "active" | "anchored" | "placeholder"
  | "placeholder"

type GalleryItem = {
  key: string
  kind: GalleryItemKind
  userId: string
  alias: string
  metadata?: string
  checkInId?: string
  markerLabel?: string
}

export function PlaceGallery({
  gallery,
  placeId,
  placeName,
  locale,
  initialViewerUserId,
  renderedAt,
  checkinVersion = 0,
  onSelfProfileRequested,
}: PlaceGalleryProps) {
  const router = useRouter()
  const viewerUserId = initialViewerUserId ?? null
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(null)
  const [justCheckedInUntil, setJustCheckedInUntil] = useState<number | null>(null)
  const [isJustCheckedIn, setIsJustCheckedIn] = useState(false)
  const justCheckedInTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!checkinVersion) return
    const now = Date.now()
    setJustCheckedInUntil(now + JUST_CHECKED_IN_TTL_MS)
  }, [checkinVersion])

  useEffect(() => {
    if (justCheckedInTimeoutRef.current) {
      window.clearTimeout(justCheckedInTimeoutRef.current)
      justCheckedInTimeoutRef.current = null
    }
    if (justCheckedInUntil === null) {
      setIsJustCheckedIn(false)
      return
    }
    const remaining = justCheckedInUntil - Date.now()
    if (remaining <= 0) {
      setIsJustCheckedIn(false)
      return
    }
    setIsJustCheckedIn(true)
    justCheckedInTimeoutRef.current = window.setTimeout(() => {
      setIsJustCheckedIn(false)
      justCheckedInTimeoutRef.current = null
    }, remaining)
    return () => {
      if (justCheckedInTimeoutRef.current) {
        window.clearTimeout(justCheckedInTimeoutRef.current)
        justCheckedInTimeoutRef.current = null
      }
    }
  }, [justCheckedInUntil])

  function handleCardClick(item: GalleryItem) {
    if (!item.userId) return
    if (item.kind === "placeholder") {
      return
    }
    const isSelfItem =
      item.kind === "self" || (viewerUserId && item.userId === viewerUserId)
    if (isSelfItem) {
      onSelfProfileRequested?.()
      return
    }
    setSelectedUserId(item.userId)
    setSelectedCheckInId(item.checkInId ?? null)
    setIsProfileOpen(true)
  }

  const referenceNow = useMemo(() => new Date(renderedAt), [renderedAt])

  const {
    galleryItems,
    visibleOtherCount,
    hasSelfItem,
  } = useMemo(() => {
    const sortByStartedDesc = (a: PlaceGalleryEntry, b: PlaceGalleryEntry) =>
      b.startedAt.getTime() - a.startedAt.getTime()

    const sortedSelfEntries = [...gallery.you].sort(sortByStartedDesc)
    const latestSelfEntry = sortedSelfEntries[0] ?? null
    const resolvedSelfAlias = gallery.viewerProfile?.alias ?? latestSelfEntry?.alias
    const resolvedSelfUserId =
      gallery.viewerProfile?.userId ?? latestSelfEntry?.userId ?? viewerUserId ?? null

    let selfItem: GalleryItem | null = null

    if (gallery.viewerHasEverCheckedIn && resolvedSelfAlias && resolvedSelfUserId) {
      selfItem = {
        key: latestSelfEntry?.id ?? `self-${resolvedSelfUserId}`,
        kind: "self",
        userId: resolvedSelfUserId,
        alias: resolvedSelfAlias,
        metadata: latestSelfEntry
          ? formatCheckInMeta(latestSelfEntry, referenceNow, locale)
          : undefined,
        checkInId: latestSelfEntry?.id,
        markerLabel: t(locale, "place.gallery.marker.you"),
      }
    }

    const fallbackYouItems =
      selfItem === null
        ? sortedSelfEntries.map<GalleryItem>((entry) => ({
            key: entry.id,
            kind: "self",
            userId: entry.userId,
            alias: entry.alias,
            metadata: formatCheckInMeta(entry, referenceNow, locale),
            checkInId: entry.id,
            markerLabel: t(locale, "place.gallery.marker.you"),
          }))
        : []

    const activeItems = [...gallery.now]
      .sort(sortByStartedDesc)
      .map<GalleryItem>((entry) => ({
        key: entry.id,
        kind: "active",
        userId: entry.userId,
        alias: entry.alias,
        metadata: formatCheckInMeta(entry, referenceNow, locale),
        checkInId: entry.id,
      }))

    const anchoredItems = [...gallery.anchored]
      .sort((a, b) => a.alias.localeCompare(b.alias, undefined, { sensitivity: "base" }))
      .map<GalleryItem>((entry) => ({
        key: entry.profileId,
        kind: "anchored",
        userId: entry.userId,
        alias: entry.alias,
        metadata: t(locale, "place.gallery.metaAnchored"),
        markerLabel: t(locale, "place.gallery.marker.anchored"),
      }))

    const otherItems = [...activeItems, ...anchoredItems]
    const hasSelf = Boolean(selfItem)
    const visibleOtherCount = otherItems.length
    const shouldShowPlaceholder = hasSelf && visibleOtherCount === 0

    let combinedItems: GalleryItem[] = []

    if (selfItem) {
      combinedItems.push(selfItem)
      if (visibleOtherCount > 0) {
        combinedItems = combinedItems.concat(otherItems)
      } else if (shouldShowPlaceholder) {
        combinedItems.push({
          key: "placeholder-empty",
          kind: "placeholder",
          userId: "placeholder",
          alias: "",
        })
      }
    } else {
      combinedItems = [...fallbackYouItems, ...otherItems]
    }

    return {
      galleryItems: combinedItems,
      visibleOtherCount,
      hasSelfItem: hasSelf,
    }
  }, [gallery, locale, referenceNow, viewerUserId])

  const hasEntries = galleryItems.length > 0
  const hasPlaceholderAtIndexOne =
    galleryItems.findIndex((item) => item.kind === "placeholder") === 1

  const initialCenterIndex = useMemo(() => {
    if (!hasEntries) return 0
    if (!hasSelfItem) return 0

    const selfActive =
      gallery.you.length > 0 &&
      gallery.you.some((entry) => entry.expiresAt.getTime() > referenceNow.getTime())
    const hasIncompleteProfile = false
    const withinProfileTtl = false

    const promotionMoment =
      isJustCheckedIn ||
      (selfActive && hasIncompleteProfile && withinProfileTtl) ||
      visibleOtherCount === 1

    if (promotionMoment) {
      return 0
    }

    const hasSecondaryItem = visibleOtherCount > 0 || hasPlaceholderAtIndexOne
    return hasSecondaryItem ? 1 : 0
  }, [
    galleryItems,
    gallery.you,
    hasEntries,
    hasSelfItem,
    isJustCheckedIn,
    referenceNow,
    hasPlaceholderAtIndexOne,
    visibleOtherCount,
  ])

  return (
    <>
      {hasEntries ? (
        <div className="-mx-6">
          <Carousel
            opts={{ align: "center", containScroll: "trimSnaps" }}
            className="w-full px-2 sm:px-4"
          >
            <CarouselContent>
              {galleryItems.map((item) => (
                <CarouselItem
                  key={item.key}
                  className="basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[35%] xl:basis-[28%] max-w-sm"
                >
                  <GalleryCard item={item} onSelect={handleCardClick} locale={locale} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselInitialScroll targetIndex={initialCenterIndex} />
          </Carousel>
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
  item,
  onSelect,
  locale,
}: {
  item: GalleryItem
  onSelect: (item: GalleryItem) => void
  locale: Locale
}) {
  const isSelf = item.kind === "self"
  const isAnchored = item.kind === "anchored"
  const isPlaceholder = item.kind === "placeholder"

  if (isPlaceholder) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-6 text-center text-sm text-zinc-500">
        {t(locale, "place.gallery.empty")}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "flex h-full w-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-lg shadow-zinc-200/80 transition hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        isSelf && "border-zinc-900 hover:border-zinc-900",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-medium text-zinc-900">{item.alias}</p>
        {item.markerLabel ? (
          <Badge
            className={cn(
              "border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700",
              isSelf && "border-zinc-900 text-zinc-900",
              isAnchored && "border-amber-200 bg-amber-50 text-amber-800",
            )}
          >
            {item.markerLabel}
          </Badge>
        ) : null}
      </div>
      {item.metadata ? (
        <p className="text-sm text-zinc-500">{item.metadata}</p>
      ) : null}
    </button>
  )
}

const AUTO_SCROLL_DELAY_MS = 2200

function CarouselInitialScroll({ targetIndex }: { targetIndex: number }) {
  const { api } = useCarousel()
  const targetRef = useRef(targetIndex)
  const timeoutRef = useRef<number | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    targetRef.current = targetIndex
  }, [targetIndex])

  useEffect(() => {
    if (!api) return
    if (targetRef.current === 0) return
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const scheduleScroll = () => {
      timeoutRef.current = window.setTimeout(() => {
        if (cancelledRef.current) return
        api.scrollTo(targetRef.current, prefersReducedMotion)
      }, AUTO_SCROLL_DELAY_MS)
    }

    scheduleScroll()

    const cancelAutoScroll = () => {
      cancelledRef.current = true
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const handleReInit = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      if (targetRef.current === 0 || cancelledRef.current) {
        return
      }
      scheduleScroll()
    }

    const cancelEvents: EmblaEventType[] = ["pointerDown", "scroll", "select"]
    cancelEvents.forEach((eventName) => {
      api.on(eventName, cancelAutoScroll)
    })
    api.on("reInit", handleReInit)

    return () => {
      cancelEvents.forEach((eventName) => {
        api.off(eventName, cancelAutoScroll)
      })
      api.off("reInit", handleReInit)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [api])

  return null
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

