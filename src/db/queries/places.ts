import { and, desc, eq, gt } from "drizzle-orm"

import { db } from "@/db"
import { checkIns, placeProfiles, places } from "@/db/schema"

export type PlaceRecord = {
  id: string
  slug: string
  name: string
  addressText: string | null
}

export type PlaceGalleryEntry = {
  id: string
  userId: string
  alias: string
  aliasGenerated: boolean
  anchored: boolean
  startedAt: Date
  expiresAt: Date
}

export async function getPlaceBySlug(slug: string): Promise<PlaceRecord | null> {
  const [record] = await db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      addressText: places.addressText,
    })
    .from(places)
    .where(eq(places.slug, slug))
    .limit(1)

  return record ?? null
}

export async function getActiveGalleryForPlace(
  placeId: string,
  now: Date,
): Promise<PlaceGalleryEntry[]> {
  const rows = await db
    .select({
      id: checkIns.id,
      userId: checkIns.userId,
      startedAt: checkIns.startedAt,
      expiresAt: checkIns.expiresAt,
      alias: placeProfiles.alias,
      aliasGenerated: placeProfiles.aliasGenerated,
      anchored: placeProfiles.anchored,
    })
    .from(checkIns)
    .innerJoin(
      placeProfiles,
      and(
        eq(placeProfiles.userId, checkIns.userId),
        eq(placeProfiles.placeId, checkIns.placeId),
      ),
    )
    .where(and(eq(checkIns.placeId, placeId), gt(checkIns.expiresAt, now)))
    .orderBy(desc(checkIns.startedAt))

  return rows
}

