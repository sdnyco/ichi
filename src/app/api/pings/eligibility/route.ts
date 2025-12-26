import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { db } from "@/db"
import {
  countActiveCheckInsForPlace,
  getPingEligibleRecipients,
  hasPingEventForDay,
} from "@/db/queries/pings"
import { arePingRateLimitsDisabled } from "@/lib/dev-overrides"
import { getPingDayKey } from "@/lib/pings"

const shouldLogDebug = process.env.NODE_ENV !== "production"

function logEligibilityDebug(message: string, payload?: Record<string, unknown>) {
  if (!shouldLogDebug) return
  const base = `[ping-eligibility] ${message}`
  if (payload) {
    console.log(base, payload)
  } else {
    console.log(base)
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const placeId = url.searchParams.get("placeId")
    const checkInId = url.searchParams.get("checkInId")

    if (!placeId || !checkInId) {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const senderUserId = cookieStore.get("ichi_user_id")?.value ?? null
    if (!senderUserId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const disableRateLimits = arePingRateLimitsDisabled()
    logEligibilityDebug("incoming request", {
      placeId,
      checkInId,
      senderUserId,
      disableRateLimits,
    })
    const checkIn = await db.query.checkIns.findFirst({
      where: (tbl, operators) =>
        operators.and(
          operators.eq(tbl.id, checkInId),
          operators.eq(tbl.userId, senderUserId),
          operators.eq(tbl.placeId, placeId),
          operators.gt(tbl.expiresAt, now),
        ),
      columns: {
        id: true,
        placeId: true,
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: "checkin_not_found" }, { status: 404 })
    }

    const activeCount = await countActiveCheckInsForPlace(db, {
      placeId,
      now,
      excludeCheckInId: checkInId,
    })
    const isPlaceEmpty = activeCount === 0
    if (!isPlaceEmpty) {
      logEligibilityDebug("place not empty", { activeCount })
    }
    const dayKey = getPingDayKey(now, { disableRateLimits })
    const sendLimitAvailable = disableRateLimits
      ? true
      : !(await hasPingEventForDay(db, {
          placeId,
          dayKey,
        }))
    if (!sendLimitAvailable) {
      logEligibilityDebug("send limit already used", { dayKey })
    }

    let eligibleCount = 0
    if (isPlaceEmpty && sendLimitAvailable) {
      const recipients = await getPingEligibleRecipients(db, {
        placeId,
        senderUserId,
        now,
        disableRateLimits,
      })
      eligibleCount = recipients.length
      logEligibilityDebug("computed recipients", { eligibleCount })
    } else {
      logEligibilityDebug("skipped eligibility compute", {
        isPlaceEmpty,
        sendLimitAvailable,
      })
    }

    return NextResponse.json({
      ok: true,
      eligibility: {
        eligibleCount,
        isPlaceEmpty,
        sendLimitAvailable,
      },
    })
  } catch (error) {
    console.error(error)
    logEligibilityDebug("error", { error: (error as Error)?.message })
    return NextResponse.json({ error: "unknown_error" }, { status: 500 })
  }
}

