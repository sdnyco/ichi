import { NextResponse } from "next/server"
import { and, eq, gt, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  checkIns,
  placeProfiles,
  places,
  userBlocks,
  userTraits,
  users,
} from "@/db/schema"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const viewerUserId = url.searchParams.get("viewerUserId")
  const placeId = url.searchParams.get("placeId")
  const targetUserId = url.searchParams.get("targetUserId")

  if (!viewerUserId || !placeId || !targetUserId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 })
  }

  const now = new Date()

  const activeRows = await db
    .select({
      place: {
        id: places.id,
        name: places.name,
      },
      profile: {
        alias: placeProfiles.alias,
        aliasGenerated: placeProfiles.aliasGenerated,
        lastHooks: placeProfiles.lastHooks,
      },
      checkIn: {
        id: checkIns.id,
        mood: checkIns.mood,
        hooks: checkIns.hooks,
        recognizabilityHint: checkIns.recognizabilityHint,
        startedAt: checkIns.startedAt,
        expiresAt: checkIns.expiresAt,
      },
      traits: {
        ageBand: userTraits.ageBand,
        heightCm: userTraits.heightCm,
      },
      lastSeenAt: users.lastSeenAt,
      isBlocked:
        viewerUserId != null
          ? sql<boolean>`EXISTS (
              SELECT 1 FROM ${userBlocks} AS ub
              WHERE ub.blocker_user_id = ${viewerUserId}
              AND ub.blocked_user_id = ${targetUserId}
            )`
          : sql<boolean>`false`,
    })
    .from(checkIns)
    .innerJoin(places, eq(places.id, checkIns.placeId))
    .innerJoin(
      placeProfiles,
      and(
        eq(placeProfiles.userId, checkIns.userId),
        eq(placeProfiles.placeId, checkIns.placeId),
      ),
    )
    .leftJoin(userTraits, eq(userTraits.userId, checkIns.userId))
    .leftJoin(users, eq(users.id, checkIns.userId))
    .where(
      and(
        eq(checkIns.placeId, placeId),
        eq(checkIns.userId, targetUserId),
        gt(checkIns.expiresAt, now),
      ),
    )
    .limit(1)

  if (activeRows.length > 0) {
    const row = activeRows[0]
    return NextResponse.json({
      place: row.place,
      profile: row.profile,
      userTraits: row.traits,
      activeCheckin: row.checkIn,
      lastSeenAt: row.lastSeenAt,
      isBlockedByViewer: row.isBlocked,
    })
  }

  const fallbackRows = await db
    .select({
      place: {
        id: places.id,
        name: places.name,
      },
      profile: {
        alias: placeProfiles.alias,
        aliasGenerated: placeProfiles.aliasGenerated,
        lastHooks: placeProfiles.lastHooks,
      },
      traits: {
        ageBand: userTraits.ageBand,
        heightCm: userTraits.heightCm,
      },
      lastSeenAt: users.lastSeenAt,
      isBlocked:
        viewerUserId != null
          ? sql<boolean>`EXISTS (
              SELECT 1 FROM ${userBlocks} AS ub
              WHERE ub.blocker_user_id = ${viewerUserId}
              AND ub.blocked_user_id = ${targetUserId}
            )`
          : sql<boolean>`false`,
    })
    .from(placeProfiles)
    .innerJoin(places, eq(places.id, placeProfiles.placeId))
    .leftJoin(userTraits, eq(userTraits.userId, placeProfiles.userId))
    .leftJoin(users, eq(users.id, placeProfiles.userId))
    .where(
      and(
        eq(placeProfiles.placeId, placeId),
        eq(placeProfiles.userId, targetUserId),
      ),
    )
    .limit(1)

  if (fallbackRows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const fallback = fallbackRows[0]

  return NextResponse.json({
    place: fallback.place,
    profile: fallback.profile,
    userTraits: fallback.traits,
    activeCheckin: null,
    lastSeenAt: fallback.lastSeenAt,
    isBlockedByViewer: fallback.isBlocked,
  })
}

