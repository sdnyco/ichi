import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { placeProfiles, userBlocks, users } from "@/db/schema"
import { filterAvailablePlaceProfiles } from "@/lib/availability"

export type AnchoredProfileRecord = {
  placeProfileId: string
  userId: string
}

export async function getAnchoredProfilesForPlace(
  placeId: string,
): Promise<AnchoredProfileRecord[]> {
  return db
    .select({
      placeProfileId: placeProfiles.id,
      userId: placeProfiles.userId,
    })
    .from(placeProfiles)
    .where(
      and(eq(placeProfiles.placeId, placeId), eq(placeProfiles.isAnchored, true)),
    )
}

type AvailabilitySelection = {
  placeProfileId: string
  userId: string
  isAvailabilityEnabled: boolean
  availabilityWeekly: typeof placeProfiles.$inferSelect["availabilityWeekly"]
  availabilityTimeZone: string
}

export async function getAnchoredAndAvailableUserIdsForPlace(
  placeId: string,
  now: Date,
  viewerUserId?: string | null,
): Promise<string[]> {
  const blockFilter = viewerUserId
    ? sql<boolean>`NOT EXISTS (
        SELECT 1 FROM ${userBlocks} AS ub
        WHERE
          (ub.blocker_user_id = ${viewerUserId} AND ub.blocked_user_id = ${placeProfiles.userId})
          OR
          (ub.blocker_user_id = ${placeProfiles.userId} AND ub.blocked_user_id = ${viewerUserId})
      )`
    : undefined

  const baseFilters = and(
    eq(placeProfiles.placeId, placeId),
    eq(placeProfiles.isAnchored, true),
    eq(users.isBanned, false),
  )
  const whereClause = blockFilter ? and(baseFilters, blockFilter) : baseFilters

  const rows = await db
    .select({
      placeProfileId: placeProfiles.id,
      userId: placeProfiles.userId,
      isAvailabilityEnabled: placeProfiles.isAvailabilityEnabled,
      availabilityWeekly: placeProfiles.availabilityWeekly,
      availabilityTimeZone: placeProfiles.availabilityTimeZone,
    })
    .from(placeProfiles)
    .innerJoin(users, eq(users.id, placeProfiles.userId))
    .where(whereClause)

  const available = filterAvailablePlaceProfiles<AvailabilitySelection>(rows, now)
  return available.map((row) => row.userId)
}


