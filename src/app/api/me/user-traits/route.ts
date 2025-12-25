import { NextResponse } from "next/server"

import { db } from "@/db"
import { userTraits } from "@/db/schema"
import { getOrCreateUserId } from "@/db/queries/checkins"
import {
  AccountDisabledError,
  ensureUserNotBanned,
} from "@/db/queries/users"
import {
  AGE_BANDS,
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
} from "@/lib/profile"

type UserTraitsPayload = {
  userId?: string
  ageBand?: string | null
  heightCm?: number | null
}

export async function PATCH(request: Request) {
  try {
    const body: UserTraitsPayload = await request.json()
    const { userId } = body

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "invalid_user_id" }, { status: 400 })
    }

    const hasAgeBand = Object.prototype.hasOwnProperty.call(body, "ageBand")
    const hasHeightCm = Object.prototype.hasOwnProperty.call(body, "heightCm")

    if (!hasAgeBand && !hasHeightCm) {
      return NextResponse.json(
        { error: "no_fields_to_update" },
        { status: 400 },
      )
    }

    let nextAgeBand: string | null | undefined
    if (hasAgeBand) {
      const rawAgeBand = body.ageBand
      if (rawAgeBand === null || rawAgeBand === "") {
        nextAgeBand = null
      } else if (
        typeof rawAgeBand === "string" &&
        AGE_BANDS.includes(rawAgeBand)
      ) {
        nextAgeBand = rawAgeBand
      } else {
        return NextResponse.json(
          { error: "invalid_age_band" },
          { status: 400 },
        )
      }
    }

    let nextHeight: number | null | undefined
    if (hasHeightCm) {
      const rawHeight = body.heightCm
      if (rawHeight === null || rawHeight === undefined || rawHeight === "") {
        nextHeight = null
      } else if (
        typeof rawHeight === "number" &&
        Number.isInteger(rawHeight) &&
        rawHeight >= HEIGHT_MIN_CM &&
        rawHeight <= HEIGHT_MAX_CM
      ) {
        nextHeight = rawHeight
      } else {
        return NextResponse.json(
          { error: "invalid_height_cm" },
          { status: 400 },
        )
      }
    }

    await getOrCreateUserId(userId)
    await ensureUserNotBanned(userId)

    const now = new Date()
    const insertValues: Partial<typeof userTraits.$inferInsert> = { userId }
    if (nextAgeBand !== undefined) insertValues.ageBand = nextAgeBand
    if (nextHeight !== undefined) insertValues.heightCm = nextHeight

    await db
      .insert(userTraits)
      .values(insertValues)
      .onConflictDoUpdate({
        target: userTraits.userId,
        set: {
          ...(nextAgeBand !== undefined ? { ageBand: nextAgeBand } : {}),
          ...(nextHeight !== undefined ? { heightCm: nextHeight } : {}),
          updatedAt: now,
        },
      })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AccountDisabledError) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 })
    }
    console.error(error)
    return NextResponse.json({ error: "unknown_error" }, { status: 500 })
  }
}

