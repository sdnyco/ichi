import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { placeProfiles } from "@/db/schema"
import {
  getOrCreatePlaceProfile,
  getOrCreateUserId,
} from "@/db/queries/checkins"
import {
  AccountDisabledError,
  ensureUserNotBanned,
} from "@/db/queries/users"
import { parseHookListInput } from "@/lib/profile"

const MAX_ALIAS_LENGTH = 60

type PlaceProfilePayload = {
  userId?: string
  placeId?: string
  alias?: string
  lastHooks?: unknown
}

export async function PATCH(request: Request) {
  try {
    const body: PlaceProfilePayload = await request.json()
    const { userId, placeId } = body

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "invalid_user_id" }, { status: 400 })
    }

    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json({ error: "invalid_place_id" }, { status: 400 })
    }

    const aliasProvided = Object.prototype.hasOwnProperty.call(body, "alias")
    const hooksProvided = Object.prototype.hasOwnProperty.call(body, "lastHooks")

    if (!aliasProvided && !hooksProvided) {
      return NextResponse.json(
        { error: "no_fields_to_update" },
        { status: 400 },
      )
    }

    let nextAlias: string | undefined
    if (aliasProvided) {
      if (typeof body.alias !== "string") {
        return NextResponse.json({ error: "invalid_alias" }, { status: 400 })
      }

      const trimmed = body.alias.trim()

      if (trimmed.length === 0 || trimmed.length > MAX_ALIAS_LENGTH) {
        return NextResponse.json({ error: "invalid_alias" }, { status: 400 })
      }

      nextAlias = trimmed
    }

    let nextHooks: string[] | null | undefined
    if (hooksProvided) {
      const parsed = parseHookListInput(body.lastHooks ?? null)
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 })
      }

      nextHooks = parsed.hooks
    }

    await getOrCreateUserId(userId)
    await ensureUserNotBanned(userId)
    await getOrCreatePlaceProfile(userId, placeId)

    const now = new Date()
    const updateData: Partial<typeof placeProfiles.$inferInsert> = {}

    if (nextAlias !== undefined) {
      updateData.alias = nextAlias
      updateData.aliasGenerated = true
    }

    if (nextHooks !== undefined) {
      updateData.lastHooks = nextHooks
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "no_fields_to_update" },
        { status: 400 },
      )
    }

    updateData.updatedAt = now

    const [updated] = await db
      .update(placeProfiles)
      .set(updateData)
      .where(
        and(
          eq(placeProfiles.userId, userId),
          eq(placeProfiles.placeId, placeId),
        ),
      )
      .returning({
        alias: placeProfiles.alias,
        aliasGenerated: placeProfiles.aliasGenerated,
        lastHooks: placeProfiles.lastHooks,
      })

    return NextResponse.json({
      ok: true,
      placeProfile: updated,
    })
  } catch (error) {
    if (error instanceof AccountDisabledError) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 })
    }
    console.error(error)
    return NextResponse.json({ error: "unknown_error" }, { status: 500 })
  }
}

