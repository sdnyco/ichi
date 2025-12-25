import { NextResponse } from "next/server"

import { db } from "@/db"
import {
  createCheckin,
  getOrCreatePlaceProfile,
  getOrCreateUserId,
  updatePlaceProfileAlias,
} from "@/db/queries/checkins"
import {
  AccountDisabledError,
  ensureUserNotBanned,
  touchUserLastSeen,
} from "@/db/queries/users"
import {
  DURATION_MINUTES_SET,
  MAX_HINT_LENGTH,
  MOOD_ID_SET,
} from "@/lib/checkins"

type CheckInRequestBody = {
  userId: string
  placeId: string
  durationMinutes: number
  mood: string
  alias: string
  recognizabilityHint?: string
}

export async function POST(request: Request) {
  try {
    const body: CheckInRequestBody = await request.json()

    const validationError = validatePayload(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const place = await db.query.places.findFirst({
      where: (tbl, { eq }) => eq(tbl.id, body.placeId),
    })

    if (!place) {
      return NextResponse.json({ error: "place_not_found" }, { status: 404 })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + body.durationMinutes * 60_000)

    await getOrCreateUserId(body.userId)
    await ensureUserNotBanned(body.userId)
    const activeCheckin = await db.query.checkIns.findFirst({
      where: (tbl, operators) =>
        operators.and(
          operators.eq(tbl.userId, body.userId),
          operators.eq(tbl.placeId, body.placeId),
          operators.gt(tbl.expiresAt, now),
        ),
      columns: { id: true },
    })

    if (activeCheckin) {
      return NextResponse.json(
        { ok: false, code: "ALREADY_CHECKED_IN" },
        { status: 409 },
      )
    }

    await getOrCreatePlaceProfile(body.userId, body.placeId)
    await updatePlaceProfileAlias(body.userId, body.placeId, body.alias)
    await createCheckin({
      userId: body.userId,
      placeId: body.placeId,
      startedAt: now,
      expiresAt,
      durationMinutes: body.durationMinutes,
      mood: body.mood,
      recognizabilityHint: body.recognizabilityHint,
    })

    await touchUserLastSeen(body.userId, now)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AccountDisabledError) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 })
    }
    console.error(error)
    return NextResponse.json({ error: "unknown_error" }, { status: 500 })
  }
}

function validatePayload(body: CheckInRequestBody) {
  if (!body.userId || typeof body.userId !== "string") {
    return "invalid_user_id"
  }

  if (!body.placeId || typeof body.placeId !== "string") {
    return "invalid_place_id"
  }

  if (!DURATION_MINUTES_SET.has(body.durationMinutes)) {
    return "invalid_duration"
  }

  if (!MOOD_ID_SET.has(body.mood)) {
    return "invalid_mood"
  }

  if (!body.alias || typeof body.alias !== "string") {
    return "invalid_alias"
  }

  if (
    body.recognizabilityHint &&
    body.recognizabilityHint.length > MAX_HINT_LENGTH
  ) {
    return "invalid_recognizability_hint"
  }

  return null
}

