import { and, desc, eq, gt, sql } from "drizzle-orm"

import { db } from "@/db"
import { checkIns, placeProfiles, places, userBlocks, users } from "@/db/schema"

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
  viewerUserId?: string | null,
): Promise<PlaceGalleryEntry[]> {
  const blockFilter = viewerUserId
    ? sql<boolean>`NOT EXISTS (
        SELECT 1 FROM ${userBlocks} AS ub
        WHERE
          (ub.blocker_user_id = ${viewerUserId} AND ub.blocked_user_id = ${checkIns.userId})
          OR
          (ub.blocker_user_id = ${checkIns.userId} AND ub.blocked_user_id = ${viewerUserId})
      )`
    : undefined

  const baseFilters = and(
    eq(checkIns.placeId, placeId),
    gt(checkIns.expiresAt, now),
    eq(users.isBanned, false),
  )
  const whereClause = blockFilter
    ? and(baseFilters, blockFilter)
    : baseFilters

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
    .innerJoin(users, eq(users.id, checkIns.userId))
    .where(whereClause)
    .orderBy(desc(checkIns.startedAt))

  return rows
}

