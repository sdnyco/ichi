import { and, desc, eq, gt, lte } from "drizzle-orm"

import { db } from "@/db"
import { checkIns, placeProfiles, places } from "@/db/schema"

export type CheckinScope = "active" | "expired"

type ListParams = {
  scope: CheckinScope
  limit?: number
}

export type AdminCheckinRecord = {
  id: string
  userId: string
  placeId: string
  placeName: string | null
  alias: string | null
  startedAt: Date
  expiresAt: Date
  createdAt: Date
  mood: string
  hooks: string[] | null
}

export async function listCheckins({
  scope,
  limit = 50,
}: ListParams): Promise<AdminCheckinRecord[]> {
  const now = new Date()
  const comparator = scope === "active" ? gt : lte

  const rows = await db
    .select({
      id: checkIns.id,
      userId: checkIns.userId,
      placeId: checkIns.placeId,
      placeName: places.name,
      alias: placeProfiles.alias,
      startedAt: checkIns.startedAt,
      expiresAt: checkIns.expiresAt,
      createdAt: checkIns.createdAt,
      mood: checkIns.mood,
      hooks: checkIns.hooks as unknown as string[] | null,
    })
    .from(checkIns)
    .leftJoin(
      placeProfiles,
      and(
        eq(placeProfiles.userId, checkIns.userId),
        eq(placeProfiles.placeId, checkIns.placeId),
      ),
    )
    .leftJoin(places, eq(places.id, checkIns.placeId))
    .where(comparator(checkIns.expiresAt, now))
    .orderBy(desc(checkIns.createdAt))
    .limit(limit)

  return rows
}

export async function endCheckinNow(checkInId: string) {
  const now = new Date()
  await db
    .update(checkIns)
    .set({ expiresAt: now, updatedAt: now })
    .where(eq(checkIns.id, checkInId))
}

