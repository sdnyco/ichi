import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { userBlocks, userReports } from "@/db/schema"
import { getOrCreateUserId } from "@/db/queries/checkins"

export async function blockUser({
  blockerUserId,
  blockedUserId,
}: {
  blockerUserId: string
  blockedUserId: string
}) {
  await getOrCreateUserId(blockerUserId)
  await getOrCreateUserId(blockedUserId)

  await db
    .insert(userBlocks)
    .values({
      blockerUserId,
      blockedUserId,
    })
    .onConflictDoNothing({
      target: userBlocks.uniquePair,
    })
}

export async function unblockUser({
  blockerUserId,
  blockedUserId,
}: {
  blockerUserId: string
  blockedUserId: string
}) {
  await db
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerUserId, blockerUserId),
        eq(userBlocks.blockedUserId, blockedUserId),
      ),
    )
}

export async function reportUser(params: {
  reporterUserId: string
  reportedUserId: string
  reasonCode: string
  freeText?: string
  placeId?: string | null
  portalId?: string | null
  checkInId?: string | null
}) {
  const {
    reporterUserId,
    reportedUserId,
    reasonCode,
    freeText,
    placeId,
    portalId,
    checkInId,
  } = params

  await getOrCreateUserId(reporterUserId)

  await db.insert(userReports).values({
    reporterUserId,
    reportedUserId,
    reasonCode,
    freeText: freeText?.trim() ? freeText.trim() : null,
    placeId: placeId ?? null,
    portalId: portalId ?? null,
    checkInId: checkInId ?? null,
  })
}

