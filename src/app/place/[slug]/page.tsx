import { cookies, headers } from "next/headers"
import { notFound } from "next/navigation"

import { PlacePageContent } from "@/components/place-page-content"
import {
  getPlaceBySlug,
  getPlaceGalleryBuckets,
} from "@/db/queries/places"
import { touchUserLastSeen } from "@/db/queries/users"
import { generateAlias } from "@/lib/alias"
import { getLocaleFromHeaders } from "@/lib/i18n"

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
  const gallery = await getPlaceGalleryBuckets(
    place.id,
    now,
    viewerUserId ?? undefined,
  )
  const locale = getLocaleFromHeaders(
    await headers(),
    extractLocaleOverride(query),
  )
  const initialDrawerAlias = generateAlias()
  const renderedAt = now.toISOString()

  return (
    <PlacePageContent
      place={{
        id: place.id,
        name: place.name,
        addressText: place.addressText ?? null,
      }}
      gallery={gallery}
      locale={locale}
      initialViewerUserId={viewerUserId}
      initialDrawerAlias={initialDrawerAlias}
      renderedAt={renderedAt}
    />
  )
}
