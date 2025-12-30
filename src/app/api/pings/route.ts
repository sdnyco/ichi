import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { pingEvents, pingRecipients } from "@/db/schema"
import {
  countActiveCheckInsForPlace,
  filterRecipientsByReceiveLimit,
  getPingEligibleRecipients,
  hasPingEventForDay,
  type PingEligibleRecipient,
} from "@/db/queries/pings"
import {
  AccountDisabledError,
  ensureUserNotBanned,
} from "@/db/queries/users"
import { logErrorEvent } from "@/db/queries/errorEvents"
import { arePingRateLimitsDisabled } from "@/lib/dev-overrides"
import {
  getMaxRecipientsPerPingEvent,
  getPingDayKey,
  sendPingEmails,
} from "@/lib/pings"

const shouldLogDebug = process.env.NODE_ENV !== "production"

function logPingAction(message: string, payload?: Record<string, unknown>) {
  if (!shouldLogDebug) return
  const base = `[ping-send] ${message}`
  if (payload) {
    console.log(base, payload)
  } else {
    console.log(base)
  }
}

class NoRecipientsAfterRecheckError extends Error {}

type SendPingRequestBody = {
  placeId?: string
  senderCheckInId?: string
}

export async function POST(request: Request) {
  try {
    const body: SendPingRequestBody = await request.json().catch(() => ({}))
    const placeId = body.placeId?.trim()
    const senderCheckInId = body.senderCheckInId?.trim()

    if (!placeId || !senderCheckInId) {
      return NextResponse.json({ ok: false, reason: "invalid_params" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const senderUserId = cookieStore.get("ichi_user_id")?.value ?? null
    if (!senderUserId) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
    }

    await ensureUserNotBanned(senderUserId)

    const now = new Date()
    logPingAction("incoming send request", {
      placeId,
      senderCheckInId,
      senderUserId,
    })
    const disableRateLimits = arePingRateLimitsDisabled()
    const checkIn = await db.query.checkIns.findFirst({
      where: (tbl, operators) =>
        operators.and(
          operators.eq(tbl.id, senderCheckInId),
          operators.eq(tbl.userId, senderUserId),
          operators.eq(tbl.placeId, placeId),
          operators.gt(tbl.expiresAt, now),
        ),
      columns: {
        id: true,
        placeId: true,
        expiresAt: true,
        mood: true,
      },
    })

    if (!checkIn) {
      logPingAction("checkin not found or expired", { senderCheckInId })
      return NextResponse.json({ ok: false, reason: "checkin_not_found" }, { status: 404 })
    }

    const place = await db.query.places.findFirst({
      where: (tbl, { eq: whereEq }) => whereEq(tbl.id, placeId),
    })

    if (!place) {
      logPingAction("place not found", { placeId })
      return NextResponse.json({ ok: false, reason: "place_not_found" }, { status: 404 })
    }

    const activeCount = await countActiveCheckInsForPlace(db, {
      placeId,
      now,
      excludeCheckInId: senderCheckInId,
    })

    if (activeCount > 0) {
      logPingAction("place not empty", { activeCount })
      return NextResponse.json({ ok: false, reason: "not_empty" }, { status: 200 })
    }

    const dayKey = getPingDayKey(now, { disableRateLimits })
    const sendLimitAvailable =
      disableRateLimits || !(await hasPingEventForDay(db, { placeId, dayKey }))
    if (!sendLimitAvailable) {
      logPingAction("send limit hit", { placeId, dayKey })
      return NextResponse.json({ ok: false, reason: "send_limit" }, { status: 200 })
    }

    const txResult = await executePingTransaction({
      placeId,
      senderUserId,
      senderCheckInId,
      now,
      dayKey,
      disableRateLimits,
    })

    if (txResult.type === "send_limit") {
      logPingAction("tx result send_limit")
      return NextResponse.json({ ok: false, reason: "send_limit" }, { status: 200 })
    }

    if (txResult.type === "no_recipients") {
      logPingAction("tx result no_recipients")
      return NextResponse.json({ ok: false, reason: "no_recipients" }, { status: 200 })
    }

    try {
      await sendPingEmails({
        placeName: place.name,
        placeSlug: place.slug,
        expiresAt: checkIn.expiresAt,
        senderMoodId: checkIn.mood,
        recipients: txResult.recipients.map((recipient) => ({
          email: recipient.email,
        })),
      })
      logPingAction("emails sent", { count: txResult.recipients.length })
    } catch (error) {
      console.error("ping_email_failed", error)
      await db
        .update(pingEvents)
        .set({ status: "failed" })
        .where(eq(pingEvents.id, txResult.eventId))

      await logErrorEvent({
        source: "api",
        route: "/api/pings",
        message: error instanceof Error ? error.message : "ping_email_failed",
        detail: serializeErrorDetail(error),
      })

      return NextResponse.json({ ok: false, reason: "email_failed" }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      sentToCount: txResult.recipients.length,
    })
  } catch (error) {
    if (error instanceof NoRecipientsAfterRecheckError) {
      logPingAction("caught NoRecipientsAfterRecheckError")
      return NextResponse.json({ ok: false, reason: "no_recipients" }, { status: 200 })
    }
    if (error instanceof AccountDisabledError) {
      return NextResponse.json({ ok: false, reason: "account_disabled" }, { status: 403 })
    }
    console.error(error)
    logPingAction("error", { error: (error as Error)?.message })
    await logErrorEvent({
      source: "api",
      route: "/api/pings",
      message: error instanceof Error ? error.message : "unknown_error",
      detail: serializeErrorDetail(error),
    })
    return NextResponse.json({ ok: false, reason: "unknown_error" }, { status: 500 })
  }
}

async function executePingTransaction(params: {
  placeId: string
  senderUserId: string
  senderCheckInId: string
  now: Date
  dayKey: string
  disableRateLimits: boolean
}): Promise<
  | { type: "ok"; eventId: string; recipients: PingEligibleRecipient[] }
  | { type: "no_recipients" }
  | { type: "send_limit" }
> {
  const { placeId, senderUserId, senderCheckInId, now, dayKey, disableRateLimits } =
    params
  const maxRecipients = getMaxRecipientsPerPingEvent()

  return db.transaction(async (tx) => {
    const txDb = tx as typeof db
    const initialRecipients = await getPingEligibleRecipients(txDb, {
      placeId,
      senderUserId,
      now,
      disableRateLimits,
    })

    if (initialRecipients.length === 0) {
      return { type: "no_recipients" }
    }

    const [event] = await tx
      .insert(pingEvents)
      .values({
        placeId,
        senderUserId,
        senderCheckInId,
        dayKey,
        maxRecipients,
      })
      .onConflictDoNothing({
        target: [pingEvents.placeId, pingEvents.dayKey],
      })
      .returning({ id: pingEvents.id })

    if (!event) {
      return { type: "send_limit" }
    }

    const confirmedRecipients = await filterRecipientsByReceiveLimit(txDb, {
      recipients: initialRecipients,
      now,
      disableRateLimits,
    })

    if (confirmedRecipients.length === 0) {
      throw new NoRecipientsAfterRecheckError()
    }

    await tx.insert(pingRecipients).values(
      confirmedRecipients.map((recipient) => ({
        pingEventId: event.id,
        recipientUserId: recipient.userId,
        recipientEmail: recipient.email,
      })),
    )

    return { type: "ok", eventId: event.id, recipients: confirmedRecipients }
  })
}

function serializeErrorDetail(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      stack: error.stack,
    }
  }
  if (typeof error === "string") {
    return { value: error }
  }
  return undefined
}

