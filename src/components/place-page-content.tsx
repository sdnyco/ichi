"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { ExpandedProfileSheet } from "@/components/expanded-profile-sheet"
import { PlaceCheckInDrawer } from "@/components/place-check-in-drawer"
import { PlaceGallery } from "@/components/place-gallery"
import { PlacePingPanel } from "@/components/place-ping-panel"
import type { PlaceGalleryBuckets } from "@/db/queries/places"
import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"

type PlacePageContentProps = {
  place: {
    id: string
    name: string
    addressText: string | null
  }
  gallery: PlaceGalleryBuckets
  locale: Locale
  initialViewerUserId?: string | null
  initialDrawerAlias?: string
  renderedAt: string
}

export function PlacePageContent({
  place,
  gallery,
  locale,
  initialViewerUserId,
  initialDrawerAlias,
  renderedAt,
}: PlacePageContentProps) {
  const router = useRouter()
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [checkinVersion, setCheckinVersion] = useState(0)
  const viewerRefreshRequested = useRef(false)
  const existingPlaceAlias = gallery.viewerProfile?.alias ?? null
  const handleCheckinSuccess = useCallback(() => {
    setCheckinVersion((version) => version + 1)
  }, [])
  const activeGalleryCount = gallery.you.length + gallery.now.length
  const galleryCountLabel = useMemo(
    () =>
      t(locale, "place.gallery.count", {
        count: String(activeGalleryCount),
      }),
    [activeGalleryCount, locale],
  )

  const handleSelfProfileRequested = useCallback(() => {
    profileTriggerRef.current?.click()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (initialViewerUserId || viewerRefreshRequested.current) return
    viewerRefreshRequested.current = true
    try {
      const localId = getOrCreateLocalUserId()
      if (localId) {
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    }
  }, [initialViewerUserId, router])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-10 px-6 pb-32 pt-12">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          {t(locale, "place.header.label")}
        </p>
        <h1 className="text-4xl font-semibold text-zinc-900">{place.name}</h1>
        {place.addressText ? (
          <p className="text-base text-zinc-600">{place.addressText}</p>
        ) : null}
      </header>

      <section className="space-y-4">
        <ExpandedProfileSheet
          placeId={place.id}
          placeName={place.name}
          locale={locale}
          renderedAt={renderedAt}
          triggerRef={profileTriggerRef}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-medium text-zinc-900">
            {t(locale, "place.gallery.heading")}
          </h2>
          <span className="text-sm text-zinc-500">{galleryCountLabel}</span>
        </div>

        <PlacePingPanel
          placeId={place.id}
          locale={locale}
          checkinVersion={checkinVersion}
          initialViewerUserId={initialViewerUserId}
        />

        <PlaceGallery
          gallery={gallery}
          placeId={place.id}
          placeName={place.name}
          locale={locale}
          initialViewerUserId={initialViewerUserId}
          renderedAt={renderedAt}
          checkinVersion={checkinVersion}
          onSelfProfileRequested={handleSelfProfileRequested}
        />
      </section>

      <PlaceCheckInDrawer
        placeId={place.id}
        locale={locale}
        onCheckinSuccess={handleCheckinSuccess}
        initialAlias={initialDrawerAlias}
        existingAlias={existingPlaceAlias}
      />
    </div>
  )
}


