import { NextResponse } from "next/server"

import { db } from "@/db"
import {
  getOrCreatePlaceProfile,
  getOrCreateUserId,
} from "@/db/queries/checkins"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  const placeId = url.searchParams.get("placeId")

  if (!userId || !placeId) {
    return NextResponse.json(
      { error: "missing_user_or_place" },
      { status: 400 },
    )
  }

  await getOrCreateUserId(userId)

  const place = await db.query.places.findFirst({
    where: (tbl, { eq: eqPlace }) => eqPlace(tbl.id, placeId),
  })

  if (!place) {
    return NextResponse.json({ error: "place_not_found" }, { status: 404 })
  }

  const [traits, activeCheckin] = await Promise.all([
    db.query.userTraits.findFirst({
      where: (tbl, { eq: eqTraits }) => eqTraits(tbl.userId, userId),
    }),
    db.query.checkIns.findFirst({
      where: (tbl, operators) =>
        operators.and(
          operators.eq(tbl.userId, userId),
          operators.eq(tbl.placeId, placeId),
          operators.gt(tbl.expiresAt, new Date()),
        ),
      orderBy: (tbl, { desc }) => desc(tbl.startedAt),
    }),
  ])

  const profile = await getOrCreatePlaceProfile(userId, placeId)

  return NextResponse.json({
    userId,
    placeId,
    place: {
      id: place.id,
      slug: place.slug,
      name: place.name,
    },
    userTraits: traits
      ? {
          ageBand: traits.ageBand,
          heightCm: traits.heightCm,
        }
      : null,
    placeProfile: profile
      ? {
          alias: profile.alias,
          aliasGenerated: profile.aliasGenerated,
          lastHooks: (profile.lastHooks as string[] | null) ?? null,
          isAnchored: profile.isAnchored,
          isAvailabilityEnabled: profile.isAvailabilityEnabled,
          availabilityTimeZone: profile.availabilityTimeZone,
          availabilityWeekly: profile.availabilityWeekly,
          contactEmail: profile.contactEmail,
        }
      : null,
    activeCheckin: activeCheckin
      ? {
          id: activeCheckin.id,
          mood: activeCheckin.mood,
          recognizabilityHint: activeCheckin.recognizabilityHint,
          hooks: (activeCheckin.hooks as string[] | null) ?? null,
          startedAt: activeCheckin.startedAt,
          expiresAt: activeCheckin.expiresAt,
        }
      : null,
  })
}

