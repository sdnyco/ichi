import { asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/db"
import { places, portals } from "@/db/schema"

export type AdminPlaceSummary = {
  id: string
  name: string
  slug: string
  addressText: string | null
  createdAt: Date
  portalCount: number
}

export type AdminPlacePortal = {
  id: string
  code: string
  isEnabled: boolean
  createdAt: Date
}

export type AdminPlaceDetail = AdminPlaceSummary & {
  portals: AdminPlacePortal[]
}

export class PlaceSlugConflictError extends Error {
  constructor(slug: string) {
    super(`Place slug already exists: ${slug}`)
    this.name = "PlaceSlugConflictError"
  }
}

export async function listAdminPlaces(limit = 200): Promise<AdminPlaceSummary[]> {
  const placeRows = await db
    .select({
      id: places.id,
      name: places.name,
      slug: places.slug,
      addressText: places.addressText,
      createdAt: places.createdAt,
    })
    .from(places)
    .orderBy(asc(places.name))
    .limit(limit)

  if (placeRows.length === 0) {
    return []
  }

  const placeIds = placeRows.map((place) => place.id)
  const portalCounts = await db
    .select({
      placeId: portals.placeId,
      total: sql<number>`count(*)`,
    })
    .from(portals)
    .where(inArray(portals.placeId, placeIds))
    .groupBy(portals.placeId)

  const countMap = new Map<string, number>(
    portalCounts.map((row) => [row.placeId, Number(row.total)]),
  )

  return placeRows.map((place) => ({
    ...place,
    portalCount: countMap.get(place.id) ?? 0,
  }))
}

export async function getAdminPlaceDetail(
  placeId: string,
): Promise<AdminPlaceDetail | null> {
  const [placeRecord] = await db
    .select({
      id: places.id,
      name: places.name,
      slug: places.slug,
      addressText: places.addressText,
      createdAt: places.createdAt,
    })
    .from(places)
    .where(eq(places.id, placeId))
    .limit(1)

  if (!placeRecord) {
    return null
  }

  const portalRows = await db
    .select({
      id: portals.id,
      code: portals.code,
      isEnabled: portals.isEnabled,
      createdAt: portals.createdAt,
    })
    .from(portals)
    .where(eq(portals.placeId, placeId))
    .orderBy(asc(portals.code))

  return {
    ...placeRecord,
    portalCount: portalRows.length,
    portals: portalRows,
  }
}

export async function createAdminPlace(input: {
  name: string
  slug: string
  addressText?: string | null
}) {
  const normalizedSlug = input.slug.trim()

  if (!normalizedSlug) {
    throw new Error("invalid_slug")
  }

  const [existing] = await db
    .select({ id: places.id })
    .from(places)
    .where(eq(places.slug, normalizedSlug))
    .limit(1)

  if (existing) {
    throw new PlaceSlugConflictError(normalizedSlug)
  }

  const [created] = await db
    .insert(places)
    .values({
      name: input.name.trim(),
      slug: normalizedSlug,
      addressText: input.addressText?.trim() ? input.addressText.trim() : null,
    })
    .returning({
      id: places.id,
    })

  return created
}

export async function disableAllPortalsForPlace(placeId: string) {
  await db.update(portals).set({ isEnabled: false }).where(eq(portals.placeId, placeId))
}

