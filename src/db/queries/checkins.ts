import { and, eq, gt } from "drizzle-orm"

import { db } from "@/db"
import { checkIns, placeProfiles, users } from "@/db/schema"
import { generateAlias } from "@/lib/alias"

export async function getOrCreateUserId(userId: string) {
  await db
    .insert(users)
    .values({ id: userId })
    .onConflictDoNothing({ target: users.id })
}

export async function getOrCreatePlaceProfile(userId: string, placeId: string) {
  const existing = await db.query.placeProfiles.findFirst({
    where: (profiles, { and: whereAnd }) =>
      whereAnd(eq(profiles.userId, userId), eq(profiles.placeId, placeId)),
  })

  if (existing) {
    return existing
  }

  const alias = generateAlias()

  const [created] = await db
    .insert(placeProfiles)
    .values({
      userId,
      placeId,
      alias,
      aliasGenerated: true,
    })
    .returning()

  return created
}

export async function updatePlaceProfileAlias(
  userId: string,
  placeId: string,
  alias: string,
) {
  await getOrCreatePlaceProfile(userId, placeId)

  await db
    .update(placeProfiles)
    .set({
      alias,
      aliasGenerated: true,
      updatedAt: new Date(),
    })
    .where(
      and(eq(placeProfiles.userId, userId), eq(placeProfiles.placeId, placeId)),
    )
}

export async function expireActiveCheckinsForUser(
  userId: string,
  now: Date,
) {
  await db
    .update(checkIns)
    .set({ expiresAt: now })
    .where(and(eq(checkIns.userId, userId), gt(checkIns.expiresAt, now)))
}

export async function createCheckin(params: {
  userId: string
  placeId: string
  startedAt: Date
  expiresAt: Date
  durationMinutes: number
  mood: string
  recognizabilityHint?: string
}) {
  const { userId, placeId, startedAt, expiresAt, durationMinutes, mood, recognizabilityHint } =
    params

  await db.insert(checkIns).values({
    userId,
    placeId,
    startedAt,
    expiresAt,
    durationMinutes,
    mood,
    recognizabilityHint: recognizabilityHint?.trim() || null,
  })
}

