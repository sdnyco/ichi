import { and, desc, eq, gt, notInArray, sql } from "drizzle-orm"

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
  isAnchored: boolean
  startedAt: Date
  expiresAt: Date
}

export type PlaceGalleryAnchoredEntry = {
  profileId: string
  userId: string
  alias: string
  aliasGenerated: boolean
}

export type PlaceGalleryBuckets = {
  you: PlaceGalleryEntry[]
  now: PlaceGalleryEntry[]
  anchored: PlaceGalleryAnchoredEntry[]
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
      isAnchored: placeProfiles.isAnchored,
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

async function getAnchoredGalleryEntries(
  placeId: string,
  viewerUserId: string | null | undefined,
  excludedUserIds: string[],
): Promise<PlaceGalleryAnchoredEntry[]> {
  const blockFilter = viewerUserId
    ? sql<boolean>`NOT EXISTS (
        SELECT 1 FROM ${userBlocks} AS ub
        WHERE
          (ub.blocker_user_id = ${viewerUserId} AND ub.blocked_user_id = ${placeProfiles.userId})
          OR
          (ub.blocker_user_id = ${placeProfiles.userId} AND ub.blocked_user_id = ${viewerUserId})
      )`
    : undefined

  let whereClause = and(
    eq(placeProfiles.placeId, placeId),
    eq(placeProfiles.isAnchored, true),
    eq(users.isBanned, false),
  )

  if (blockFilter) {
    whereClause = and(whereClause, blockFilter)
  }

  if (excludedUserIds.length > 0) {
    whereClause = and(whereClause, notInArray(placeProfiles.userId, excludedUserIds))
  }

  const rows = await db
    .select({
      profileId: placeProfiles.id,
      userId: placeProfiles.userId,
      alias: placeProfiles.alias,
      aliasGenerated: placeProfiles.aliasGenerated,
    })
    .from(placeProfiles)
    .innerJoin(users, eq(users.id, placeProfiles.userId))
    .where(whereClause)
    .orderBy(desc(placeProfiles.updatedAt))

  return rows
}

export async function getPlaceGalleryBuckets(
  placeId: string,
  now: Date,
  viewerUserId?: string | null,
): Promise<PlaceGalleryBuckets> {
  const activeEntries = await getActiveGalleryForPlace(placeId, now, viewerUserId)
  const youEntries = viewerUserId
    ? activeEntries.filter((entry) => entry.userId === viewerUserId)
    : []
  const nowEntries = viewerUserId
    ? activeEntries.filter((entry) => entry.userId !== viewerUserId)
    : activeEntries
  const excludedAnchoredUsers = Array.from(
    new Set(activeEntries.map((entry) => entry.userId)),
  )

  const anchoredEntries = await getAnchoredGalleryEntries(
    placeId,
    viewerUserId ?? null,
    excludedAnchoredUsers,
  )

  return {
    you: youEntries,
    now: nowEntries,
    anchored: anchoredEntries,
  }
}

