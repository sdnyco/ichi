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
import { isValidEmail } from "@/lib/email"
import { parseHookListInput } from "@/lib/profile"

const MAX_ALIAS_LENGTH = 60

type PlaceProfilePayload = {
  userId?: string
  placeId?: string
  alias?: string
  lastHooks?: unknown
  isAnchored?: boolean
  isAvailabilityEnabled?: boolean
  availabilityWeekly?: unknown
  contactEmail?: unknown
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
    const anchoredProvided = Object.prototype.hasOwnProperty.call(
      body,
      "isAnchored",
    )
    const availabilityEnabledProvided = Object.prototype.hasOwnProperty.call(
      body,
      "isAvailabilityEnabled",
    )
    const availabilityWeeklyProvided = Object.prototype.hasOwnProperty.call(
      body,
      "availabilityWeekly",
    )
    const contactEmailProvided = Object.prototype.hasOwnProperty.call(
      body,
      "contactEmail",
    )

    if (
      !aliasProvided &&
      !hooksProvided &&
      !anchoredProvided &&
      !availabilityEnabledProvided &&
      !availabilityWeeklyProvided &&
      !contactEmailProvided
    ) {
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

    let nextAnchored: boolean | undefined
    if (anchoredProvided) {
      if (typeof body.isAnchored !== "boolean") {
        return NextResponse.json({ error: "invalid_isAnchored" }, { status: 400 })
      }
      nextAnchored = body.isAnchored
    }

    let nextAvailabilityEnabled: boolean | undefined
    if (availabilityEnabledProvided) {
      if (typeof body.isAvailabilityEnabled !== "boolean") {
        return NextResponse.json(
          { error: "invalid_isAvailabilityEnabled" },
          { status: 400 },
        )
      }
      nextAvailabilityEnabled = body.isAvailabilityEnabled
    }

    let nextAvailabilityWeekly: AvailabilityWeekly | null | undefined
    if (availabilityWeeklyProvided) {
      const parsed = parseAvailabilityWeeklyInput(body.availabilityWeekly)
      if (!parsed.ok) {
        return NextResponse.json(
          { error: parsed.error ?? "invalid_availability_weekly" },
          { status: 400 },
        )
      }
      nextAvailabilityWeekly = parsed.schedule
    }

    let nextContactEmail: string | null | undefined
    if (contactEmailProvided) {
      if (
        body.contactEmail !== null &&
        body.contactEmail !== undefined &&
        typeof body.contactEmail !== "string"
      ) {
        return NextResponse.json(
          { error: "invalid_contact_email" },
          { status: 400 },
        )
      }
      const raw =
        typeof body.contactEmail === "string" ? body.contactEmail.trim() : ""
      if (!raw) {
        nextContactEmail = null
      } else if (!isValidEmail(raw)) {
        return NextResponse.json(
          { error: "invalid_contact_email" },
          { status: 400 },
        )
      } else {
        nextContactEmail = raw.toLowerCase()
      }
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

    if (nextAnchored !== undefined) {
      updateData.isAnchored = nextAnchored
    }

    if (nextAvailabilityEnabled !== undefined) {
      updateData.isAvailabilityEnabled = nextAvailabilityEnabled
    }

    if (nextAvailabilityWeekly !== undefined) {
      updateData.availabilityWeekly = nextAvailabilityWeekly
    }

    if (nextContactEmail !== undefined) {
      updateData.contactEmail = nextContactEmail
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
        isAnchored: placeProfiles.isAnchored,
        isAvailabilityEnabled: placeProfiles.isAvailabilityEnabled,
        availabilityTimeZone: placeProfiles.availabilityTimeZone,
        availabilityWeekly: placeProfiles.availabilityWeekly,
        contactEmail: placeProfiles.contactEmail,
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

type AvailabilityWeekly = typeof placeProfiles.$inferSelect["availabilityWeekly"]

function parseAvailabilityWeeklyInput(
  value: unknown,
): { ok: true; schedule: AvailabilityWeekly } | { ok: false; error: string } {
  if (value === null) {
    return { ok: true, schedule: null }
  }

  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "invalid_availability_weekly" }
  }

  const schedule: AvailabilityWeekly = {
    mon: normalizeWindow((value as Record<string, unknown>).mon),
    tue: normalizeWindow((value as Record<string, unknown>).tue),
    wed: normalizeWindow((value as Record<string, unknown>).wed),
    thu: normalizeWindow((value as Record<string, unknown>).thu),
    fri: normalizeWindow((value as Record<string, unknown>).fri),
    sat: normalizeWindow((value as Record<string, unknown>).sat),
    sun: normalizeWindow((value as Record<string, unknown>).sun),
  }

  return { ok: true, schedule }
}

function normalizeWindow(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return { start: null, end: null }
  }

  const rawStart = (value as Record<string, unknown>).start
  const rawEnd = (value as Record<string, unknown>).end
  const start = coerceMinute(rawStart)
  const end = coerceMinute(rawEnd)

  if (start === null || end === null) {
    return { start: null, end: null }
  }

  if (start === end) {
    return { start: null, end: null }
  }

  return { start, end }
}

function coerceMinute(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== "number") return null
  if (!Number.isInteger(value)) return null
  if (value < 0 || value >= 1440) return null
  return value
}

