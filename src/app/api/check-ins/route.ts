import { NextResponse } from "next/server"

import { db } from "@/db"
import {
  createCheckin,
  expireActiveCheckinsForUser,
  getOrCreatePlaceProfile,
  getOrCreateUserId,
  updatePlaceProfileAlias,
} from "@/db/queries/checkins"
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
    await getOrCreatePlaceProfile(body.userId, body.placeId)
    await updatePlaceProfileAlias(body.userId, body.placeId, body.alias)
    await expireActiveCheckinsForUser(body.userId, now)
    await createCheckin({
      userId: body.userId,
      placeId: body.placeId,
      startedAt: now,
      expiresAt,
      durationMinutes: body.durationMinutes,
      mood: body.mood,
      recognizabilityHint: body.recognizabilityHint,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
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

