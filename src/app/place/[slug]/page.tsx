import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { CheckInFlow } from "@/components/check-in-flow"
import { getActiveGalleryForPlace, getPlaceBySlug } from "@/db/queries/places"
import { getLocaleFromHeaders, t, type Locale } from "@/lib/i18n"

type PlacePageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params

  const place = await getPlaceBySlug(slug)

  if (!place) {
    notFound()
  }

  const now = new Date()
  const gallery = await getActiveGalleryForPlace(place.id, now)
  const locale = getLocaleFromHeaders(await headers())

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          {t(locale, "place.header.label")}
        </p>
        <h1 className="text-4xl font-semibold text-zinc-900">{place.name}</h1>
        {place.addressText ? (
          <p className="text-base text-zinc-600">{place.addressText}</p>
        ) : null}
      </header>

      <section>
        <CheckInFlow placeId={place.id} locale={locale} />
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

        {gallery.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
            {t(locale, "place.gallery.empty")}
          </p>
        ) : (
          <ul className="space-y-4">
            {gallery.map((entry) => (
              <li
                key={entry.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function formatRelativeTime(target: Date, now: Date, locale: Locale): string {
  const diffMs = target.getTime() - now.getTime()
  const minutes = Math.round(Math.abs(diffMs) / 60000)

  if (minutes === 0) {
    return t(locale, "time.relative.justNow")
  }

  if (diffMs > 0) {
    return t(locale, "time.relative.futureMinutes", { count: String(minutes) })
  }

  return t(locale, "time.relative.pastMinutes", { count: String(minutes) })
}

