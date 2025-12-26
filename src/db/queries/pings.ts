import {
  and,
  eq,
  gt,
  gte,
  inArray,
  ne,
  sql,
} from "drizzle-orm"

import { db } from "@/db"
import {
  checkIns,
  pingEvents,
  pingRecipients,
  placeProfiles,
  userBlocks,
  users,
} from "@/db/schema"
import { isPlaceProfileAvailableNow } from "@/lib/availability"
import { isValidEmail } from "@/lib/email"
import {
  getMaxRecipientsPerPingEvent,
  getReceiveLimitMax,
  getReceiveWindowStart,
} from "@/lib/pings"

type DbExecutor = typeof db

export type PingEligibleRecipient = {
  userId: string
  email: string
}

export async function getPingEligibleRecipients(
  executor: DbExecutor,
  params: {
    placeId: string
    senderUserId: string
    now: Date
    disableRateLimits?: boolean
  },
): Promise<PingEligibleRecipient[]> {
  const { placeId, senderUserId, now } = params
  const blockFilter = sql<boolean>`NOT EXISTS (
      SELECT 1 FROM ${userBlocks} AS ub
      WHERE
        (ub.blocker_user_id = ${senderUserId} AND ub.blocked_user_id = ${placeProfiles.userId})
        OR
        (ub.blocker_user_id = ${placeProfiles.userId} AND ub.blocked_user_id = ${senderUserId})
    )`

  const baseFilters = and(
    eq(placeProfiles.placeId, placeId),
    eq(placeProfiles.isAnchored, true),
    eq(users.isBanned, false),
    ne(placeProfiles.userId, senderUserId),
    blockFilter,
  )

  const rows = await executor
    .select({
      userId: placeProfiles.userId,
      contactEmail: placeProfiles.contactEmail,
      isAvailabilityEnabled: placeProfiles.isAvailabilityEnabled,
      availabilityWeekly: placeProfiles.availabilityWeekly,
      availabilityTimeZone: placeProfiles.availabilityTimeZone,
    })
    .from(placeProfiles)
    .innerJoin(users, eq(users.id, placeProfiles.userId))
    .where(baseFilters)

  const available = rows.filter((row) => {
    if (!row.contactEmail || !isValidEmail(row.contactEmail)) {
      return false
    }

    if (!row.isAvailabilityEnabled) {
      return true
    }

    return isPlaceProfileAvailableNow(
      {
        isAvailabilityEnabled: row.isAvailabilityEnabled,
        availabilityWeekly: row.availabilityWeekly,
        availabilityTimeZone: row.availabilityTimeZone,
      },
      now,
      { treatDisabledAsAvailable: true },
    )
  })

  if (available.length === 0) {
    return []
  }

  const candidateIds = available.map((row) => row.userId)
  let filtered = available
  let lastPingMap = new Map<string, Date | null>()

  if (!params.disableRateLimits && candidateIds.length > 0) {
    const receiveWindowStart = getReceiveWindowStart(now)
    const recentCounts = await executor
      .select({
        recipientUserId: pingRecipients.recipientUserId,
        total: sql<number>`count(*)`,
      })
      .from(pingRecipients)
      .where(
        and(
          inArray(pingRecipients.recipientUserId, candidateIds),
          gte(pingRecipients.createdAt, receiveWindowStart),
        ),
      )
      .groupBy(pingRecipients.recipientUserId)

    const lastPingRows = await executor
      .select({
        recipientUserId: pingRecipients.recipientUserId,
        lastPingAt: sql<Date>`max(${pingRecipients.createdAt})`,
      })
      .from(pingRecipients)
      .where(inArray(pingRecipients.recipientUserId, candidateIds))
      .groupBy(pingRecipients.recipientUserId)

    const recentCountMap = new Map(
      recentCounts.map((row) => [row.recipientUserId, Number(row.total)]),
    )
    lastPingMap = new Map(
      lastPingRows.map((row) => [row.recipientUserId, row.lastPingAt ?? null]),
    )

    const receiveLimit = getReceiveLimitMax()
    filtered = available.filter((candidate) => {
      const recentCount = recentCountMap.get(candidate.userId) ?? 0
      return recentCount < receiveLimit
    })
  } else {
    lastPingMap = new Map(
      available.map((candidate) => [candidate.userId, null]),
    )
  }

  const maxRecipients = getMaxRecipientsPerPingEvent()
  const sorted = filtered.sort((a, b) => {
    const lastA = lastPingMap.get(a.userId)
    const lastB = lastPingMap.get(b.userId)
    if (!lastA && lastB) return -1
    if (lastA && !lastB) return 1
    if (lastA && lastB) {
      const diff = lastA.getTime() - lastB.getTime()
      if (diff !== 0) return diff
    }
    return a.userId.localeCompare(b.userId)
  })

  return sorted.slice(0, maxRecipients).map((candidate) => ({
    userId: candidate.userId,
    email: candidate.contactEmail!.trim().toLowerCase(),
  }))
}

export async function countActiveCheckInsForPlace(
  executor: DbExecutor,
  params: { placeId: string; now: Date; excludeCheckInId?: string },
) {
  const { placeId, now, excludeCheckInId } = params
  const filters = [
    eq(checkIns.placeId, placeId),
    gt(checkIns.expiresAt, now),
    eq(users.isBanned, false),
  ]

  if (excludeCheckInId) {
    filters.push(ne(checkIns.id, excludeCheckInId))
  }

  const [result] = await executor
    .select({
      count: sql<number>`count(*)`,
    })
    .from(checkIns)
    .innerJoin(users, eq(users.id, checkIns.userId))
    .where(and(...filters))

  return Number(result?.count ?? 0)
}

export async function hasPingEventForDay(
  executor: DbExecutor,
  params: { placeId: string; dayKey: string },
) {
  const { placeId, dayKey } = params
  const [existing] = await executor
    .select({ id: pingEvents.id })
    .from(pingEvents)
    .where(and(eq(pingEvents.placeId, placeId), eq(pingEvents.dayKey, dayKey)))
    .limit(1)

  return Boolean(existing)
}

export async function filterRecipientsByReceiveLimit(
  executor: DbExecutor,
  params: {
    recipients: PingEligibleRecipient[]
    now: Date
    disableRateLimits?: boolean
  },
) {
  const { recipients, now, disableRateLimits } = params
  if (recipients.length === 0 || disableRateLimits) return recipients

  const receiveWindowStart = getReceiveWindowStart(now)
  const ids = recipients.map((recipient) => recipient.userId)
  const rows = await executor
    .select({
      recipientUserId: pingRecipients.recipientUserId,
      total: sql<number>`count(*)`,
    })
    .from(pingRecipients)
    .where(
      and(
        inArray(pingRecipients.recipientUserId, ids),
        gte(pingRecipients.createdAt, receiveWindowStart),
      ),
    )
    .groupBy(pingRecipients.recipientUserId)

  const counts = new Map(rows.map((row) => [row.recipientUserId, Number(row.total)]))
  const limit = getReceiveLimitMax()
  return recipients.filter(
    (recipient) => (counts.get(recipient.userId) ?? 0) < limit,
  )
}

