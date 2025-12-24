import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { checkIns, placeProfiles, type CheckIn } from "@/db/schema"
import {
  getOrCreatePlaceProfile,
  getOrCreateUserId,
} from "@/db/queries/checkins"
import {
  MAX_HINT_LENGTH,
  MOOD_ID_SET,
} from "@/lib/checkins"
import { parseHookListInput } from "@/lib/profile"

type ActiveCheckinPayload = {
  userId?: string
  placeId?: string
  mood?: string
  recognizabilityHint?: string | null
  hooks?: unknown
}

export async function PATCH(request: Request) {
  const body: ActiveCheckinPayload = await request.json()
  const { userId, placeId } = body

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 })
  }

  if (!placeId || typeof placeId !== "string") {
    return NextResponse.json({ error: "invalid_place_id" }, { status: 400 })
  }

  const hasMood = Object.prototype.hasOwnProperty.call(body, "mood")
  const hasHint = Object.prototype.hasOwnProperty.call(
    body,
    "recognizabilityHint",
  )
  const hasHooks = Object.prototype.hasOwnProperty.call(body, "hooks")

  if (!hasMood && !hasHint && !hasHooks) {
    return NextResponse.json({ error: "no_fields_to_update" }, { status: 400 })
  }

  await getOrCreateUserId(userId)

  const activeCheckin = await db.query.checkIns.findFirst({
    where: (tbl, operators) =>
      operators.and(
        operators.eq(tbl.userId, userId),
        operators.eq(tbl.placeId, placeId),
        operators.gt(tbl.expiresAt, new Date()),
      ),
    orderBy: (tbl, { desc }) => desc(tbl.startedAt),
  })

  if (!activeCheckin) {
    return NextResponse.json({ ok: false, code: "NO_ACTIVE_CHECKIN" })
  }

  let nextMood: string | undefined
  if (hasMood) {
    if (typeof body.mood !== "string" || !MOOD_ID_SET.has(body.mood)) {
      return NextResponse.json({ error: "invalid_mood" }, { status: 400 })
    }
    nextMood = body.mood
  }

  let nextHint: string | null | undefined
  if (hasHint) {
    if (body.recognizabilityHint === null) {
      nextHint = null
    } else if (typeof body.recognizabilityHint === "string") {
      const trimmed = body.recognizabilityHint.trim()
      if (trimmed.length > MAX_HINT_LENGTH) {
        return NextResponse.json(
          { error: "invalid_recognizability_hint" },
          { status: 400 },
        )
      }
      nextHint = trimmed.length > 0 ? trimmed : null
    } else {
      return NextResponse.json(
        { error: "invalid_recognizability_hint" },
        { status: 400 },
      )
    }
  }

  let nextHooks: string[] | null | undefined
  if (hasHooks) {
    const parsed = parseHookListInput(body.hooks ?? null)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    nextHooks = parsed.hooks
  }

  const now = new Date()
  const updateData: Partial<typeof checkIns.$inferInsert> = {}
  if (nextMood !== undefined) updateData.mood = nextMood
  if (nextHint !== undefined) updateData.recognizabilityHint = nextHint
  if (nextHooks !== undefined) updateData.hooks = nextHooks

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({
      ok: true,
      checkIn: serializeCheckIn(activeCheckin),
    })
  }

  updateData.updatedAt = now

  const [updated] = await db
    .update(checkIns)
    .set(updateData)
    .where(eq(checkIns.id, activeCheckin.id))
    .returning({
      id: checkIns.id,
      mood: checkIns.mood,
      recognizabilityHint: checkIns.recognizabilityHint,
      hooks: checkIns.hooks,
      startedAt: checkIns.startedAt,
      expiresAt: checkIns.expiresAt,
    })

  if (nextHooks !== undefined) {
    await getOrCreatePlaceProfile(userId, placeId)
    await db
      .update(placeProfiles)
      .set({
        lastHooks: nextHooks,
        updatedAt: now,
      })
      .where(
        and(eq(placeProfiles.userId, userId), eq(placeProfiles.placeId, placeId)),
      )
  }

  return NextResponse.json({
    ok: true,
    checkIn: updated,
  })
}

function serializeCheckIn(row: CheckIn) {
  return {
    id: row.id,
    mood: row.mood,
    recognizabilityHint: row.recognizabilityHint,
    hooks: (row.hooks as string[] | null) ?? null,
    startedAt: row.startedAt,
    expiresAt: row.expiresAt,
  }
}

