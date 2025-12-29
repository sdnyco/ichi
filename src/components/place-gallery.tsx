"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { EmblaEventType } from "embla-carousel"
import { useRouter } from "next/navigation"

import { OtherProfileSheet } from "@/components/profile/other-profile-sheet"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import type { PlaceGalleryBuckets, PlaceGalleryEntry } from "@/db/queries/places"
import { HOOK_LABEL_BY_ID } from "@/lib/hooks-catalog"
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
let galleryDebugCounter = 0

type GalleryItemKind = "self" | "active" | "anchored" | "placeholder"
  | "placeholder"

type GalleryItem = {
  key: string
  kind: GalleryItemKind
  userId: string
  alias: string
  metadata?: string
  checkInId?: string
  mood?: string | null
  hooks?: string[] | null
  startedAt?: Date
  lastSeenAt?: Date | null
  isViewerCheckedIn?: boolean
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)

  const handleCarouselApi = useCallback((api?: CarouselApi) => {
    setCarouselApi(api ?? null)
  }, [])

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

  useEffect(() => {}, [carouselApi])

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
    const viewerProfileHooks = gallery.viewerProfile?.lastHooks ?? null

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
        mood: latestSelfEntry?.mood ?? null,
        hooks: latestSelfEntry?.hooks ?? viewerProfileHooks ?? null,
        startedAt: latestSelfEntry?.startedAt,
        isViewerCheckedIn: Boolean(latestSelfEntry),
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
            mood: entry.mood,
            hooks: entry.hooks,
            startedAt: entry.startedAt,
            isViewerCheckedIn: true,
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
        mood: entry.mood,
        hooks: entry.hooks,
        startedAt: entry.startedAt,
      }))

    const anchoredItems = [...gallery.anchored]
      .sort((a, b) => a.alias.localeCompare(b.alias, undefined, { sensitivity: "base" }))
      .map<GalleryItem>((entry) => ({
        key: entry.profileId,
        kind: "anchored",
        userId: entry.userId,
        alias: entry.alias,
        metadata: t(locale, "place.gallery.metaAnchored"),
        lastSeenAt: entry.lastSeenAt,
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
            opts={{ align: "center", containScroll: false }}
            onApi={handleCarouselApi}
            className="w-full px-2 sm:px-4"
          >
            <CarouselContent className="py-4">
              {galleryItems.map((item) => (
                <CarouselItem
                  key={item.key}
                  className="basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[35%] xl:basis-[28%] max-w-sm"
                >
                  <GalleryCard
                    item={item}
                    onSelect={handleCardClick}
                    locale={locale}
                    referenceNow={referenceNow}
                  />
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
  referenceNow,
}: {
  item: GalleryItem
  onSelect: (item: GalleryItem) => void
  locale: Locale
  referenceNow: Date
}) {
  const isSelf = item.kind === "self"
  const isAnchored = item.kind === "anchored"
  const isActive = item.kind === "active"
  const isPlaceholder = item.kind === "placeholder"

  if (isPlaceholder) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-6 text-center text-sm text-zinc-500">
        {t(locale, "place.gallery.empty")}
      </div>
    )
  }

  const pill = getCardStatusPill(item, referenceNow)
  const hookIds =
    item.kind === "anchored"
      ? []
      : (item.hooks ?? [])
          .filter((hook): hook is string => Boolean(hook && hook.trim()))
          .slice(0, 3)
  const hookLabels = hookIds.map((hookId) => {
    const labelKey = HOOK_LABEL_BY_ID[hookId]
    return labelKey ? t(locale, labelKey) : hookId
  })
  const showHooks = hookLabels.length > 0 && (isSelf || isActive)
  const showIncompleteNotice = isSelf && hookIds.length === 0
  const hookLabel = isSelf ? "What you're up for:" : "What they are up for:"
  const headerText = getCardHeaderText(item)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "group relative flex h-full min-h-[360px] w-full flex-col rounded-2xl border border-white/10 bg-neutral-950 p-6 text-left text-neutral-50 shadow-lg shadow-black/30 transition hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        isSelf && "border-yellow-300 hover:border-yellow-200",
      )}
    >
      <div className="flex h-full flex-col gap-5">
        <div className="space-y-4">
          {pill ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-100">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  pill.dotColor === "green" ? "bg-emerald-400" : "bg-zinc-500",
                )}
              />
              {pill.text}
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-2xl font-semibold leading-snug">{headerText}</p>
          </div>
        </div>

        <div className="h-px w-full border-t border-dashed border-white/15" />

        <div className="flex flex-1 flex-col gap-4">
          {showHooks ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">{hookLabel}</p>
              <div className="space-y-2">
                {hookLabels.map((hook, index) => (
                  <div
                    key={`${hook}-${index}`}
                    className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-neutral-50"
                  >
                    {hook}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showIncompleteNotice ? (
            <div className="rounded-2xl border border-dashed border-yellow-200/60 bg-yellow-100/5 p-4 text-sm text-yellow-50">
              <p className="mb-3 leading-relaxed">
                Others currently see very little about you. You can add more details anytime.
              </p>
              <span className="inline-flex items-center justify-center rounded-full bg-yellow-200/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-yellow-50">
                View/Edit Profile &rarr;
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </button>
  )
}

type CardStatusPill =
  | {
      text: string
      dotColor: "green" | "gray"
    }
  | null

function getCardStatusPill(item: GalleryItem, referenceNow: Date): CardStatusPill {
  if (item.kind === "self") {
    return {
      text: "This is you",
      dotColor: item.isViewerCheckedIn ? "green" : "gray",
    }
  }

  if (item.kind === "active") {
    const compact = formatCompactDuration(referenceNow, item.startedAt)
    return {
      text: compact ? `Checked in ${compact} ago` : "Checked in",
      dotColor: "green",
    }
  }

  if (item.kind === "anchored") {
    const compact = formatCompactDuration(referenceNow, item.lastSeenAt ?? null)
    return {
      text: compact ? `Last seen ${compact} ago` : "Last seen —",
      dotColor: "gray",
    }
  }

  return null
}

function getCardHeaderText(item: GalleryItem) {
  if (item.mood && (item.kind === "self" || item.kind === "active")) {
    return `${item.alias} is ${item.mood}`
  }
  return item.alias
}

function formatCompactDuration(referenceNow: Date, target?: Date | null) {
  if (!target) return null
  const diffMs = Math.max(0, referenceNow.getTime() - target.getTime())
  const minutes = Math.floor(diffMs / 60000)

  if (minutes >= 60 * 24) {
    return `${Math.floor(minutes / (60 * 24))}d`
  }

  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h`
  }

  return `${minutes}m`
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

