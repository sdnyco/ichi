import { cookies, headers } from "next/headers"
import { notFound } from "next/navigation"

import { ExpandedProfileSheet } from "@/components/expanded-profile-sheet"
import { CheckInFlow } from "@/components/check-in-flow"
import { PlaceCheckInDrawer } from "@/components/place-check-in-drawer"
import { PlaceGallery } from "@/components/place-gallery"
import { getActiveGalleryForPlace, getPlaceBySlug } from "@/db/queries/places"
import { touchUserLastSeen } from "@/db/queries/users"
import { getLocaleFromHeaders, t } from "@/lib/i18n"

type PlacePageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<Record<string, string | string[]>>
}

function getParamValue(
  params: Record<string, string | string[]> | undefined,
  key: string,
): string | null {
  if (!params) return null
  const raw = params[key]
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function extractLocaleOverride(
  searchParams?: Record<string, string | string[]>,
): string | null {
  const lang = getParamValue(searchParams, "lang")
  const locale = getParamValue(searchParams, "locale")
  return lang ?? locale
}

export default async function PlacePage({
  params,
  searchParams,
}: PlacePageProps) {
  const { slug } = await params
  const query = searchParams ? await searchParams : undefined

  const place = await getPlaceBySlug(slug)

  if (!place) {
    notFound()
  }

  const now = new Date()
  const viewerCookieStore = await cookies()
  const viewerUserId = viewerCookieStore.get("ichi_user_id")?.value ?? null
  if (viewerUserId) {
    await touchUserLastSeen(viewerUserId, now)
  }
  const gallery = await getActiveGalleryForPlace(
    place.id,
    now,
    viewerUserId ?? undefined,
  )
  const locale = getLocaleFromHeaders(
    await headers(),
    extractLocaleOverride(query),
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
        <CheckInFlow placeId={place.id} locale={locale} />
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
          <span className="text-sm text-zinc-500">
            {t(locale, "place.gallery.count", {
              count: String(gallery.length),
            })}
          </span>
        </div>

        <PlaceGallery
          entries={gallery}
          placeId={place.id}
          placeName={place.name}
          locale={locale}
          initialViewerUserId={viewerUserId}
        />
      </section>
      <PlaceCheckInDrawer placeId={place.id} locale={locale} />
    </div>
  )
}
