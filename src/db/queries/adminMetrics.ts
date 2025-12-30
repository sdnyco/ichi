import { and, eq, gte, sql } from "drizzle-orm"

import { db } from "@/db"
import { checkIns, errorEvents, pingEvents } from "@/db/schema"

export type MetricValue = {
  total: number
  last24h: number
}

export type AdminMetrics = {
  checkIns: MetricValue
  pings: MetricValue
  errors: MetricValue
}

function buildSinceDate(hours = 24) {
  const now = Date.now()
  return new Date(now - hours * 60 * 60 * 1000)
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const since = buildSinceDate()

  const [checkInTotalRows, checkInRecentRows] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(checkIns),
    db
      .select({ value: sql<number>`count(*)` })
      .from(checkIns)
      .where(gte(checkIns.createdAt, since)),
  ])

  const sentClause = eq(pingEvents.status, "sent")
  const [pingTotalRows, pingRecentRows] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(pingEvents).where(sentClause),
    db
      .select({ value: sql<number>`count(*)` })
      .from(pingEvents)
      .where(and(eq(pingEvents.status, "sent"), gte(pingEvents.createdAt, since))),
  ])

  const [errorTotalRows, errorRecentRows] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(errorEvents),
    db
      .select({ value: sql<number>`count(*)` })
      .from(errorEvents)
      .where(gte(errorEvents.createdAt, since)),
  ])

  const checkInTotal = Number(checkInTotalRows[0]?.value ?? 0)
  const checkInRecent = Number(checkInRecentRows[0]?.value ?? 0)
  const pingTotal = Number(pingTotalRows[0]?.value ?? 0)
  const pingRecent = Number(pingRecentRows[0]?.value ?? 0)
  const errorTotal = Number(errorTotalRows[0]?.value ?? 0)
  const errorRecent = Number(errorRecentRows[0]?.value ?? 0)

  return {
    checkIns: { total: checkInTotal, last24h: checkInRecent },
    pings: { total: pingTotal, last24h: pingRecent },
    errors: { total: errorTotal, last24h: errorRecent },
  }
}

