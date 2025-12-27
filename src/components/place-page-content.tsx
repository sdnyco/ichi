"use client"

import { useCallback, useMemo, useState } from "react"

import { ExpandedProfileSheet } from "@/components/expanded-profile-sheet"
import { PlaceCheckInDrawer } from "@/components/place-check-in-drawer"
import { PlaceGallery } from "@/components/place-gallery"
import { PlacePingPanel } from "@/components/place-ping-panel"
import type { PlaceGalleryEntry } from "@/db/queries/places"
import { t, type Locale } from "@/lib/i18n"

type PlacePageContentProps = {
  place: {
    id: string
    name: string
    addressText: string | null
  }
  gallery: PlaceGalleryEntry[]
  locale: Locale
  initialViewerUserId?: string | null
}

export function PlacePageContent({
  place,
  gallery,
  locale,
  initialViewerUserId,
}: PlacePageContentProps) {
  const [checkinVersion, setCheckinVersion] = useState(0)
  const handleCheckinSuccess = useCallback(() => {
    setCheckinVersion((version) => version + 1)
  }, [])
  const galleryCountLabel = useMemo(
    () =>
      t(locale, "place.gallery.count", {
        count: String(gallery.length),
      }),
    [gallery.length, locale],
  )

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
        />

        <PlaceGallery
          entries={gallery}
          placeId={place.id}
          placeName={place.name}
          locale={locale}
          initialViewerUserId={initialViewerUserId}
        />
      </section>

      <PlaceCheckInDrawer
        placeId={place.id}
        locale={locale}
        onCheckinSuccess={handleCheckinSuccess}
      />
    </div>
  )
}


