import { and, desc, eq, or } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

import { db } from "@/db"
import { portals, userReports, users } from "@/db/schema"

export const REPORT_STATUSES = ["new", "reviewing", "actioned", "dismissed"] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

type ListOptions = {
  status?: ReportStatus
  reasonCode?: string
  limit?: number
}

const reportedUsers = alias(users, "reported_users")
const linkedPortals = alias(portals, "linked_portals")

const reportSelection = {
  id: userReports.id,
  createdAt: userReports.createdAt,
  status: userReports.status,
  reasonCode: userReports.reasonCode,
  freeText: userReports.freeText,
  reporterUserId: userReports.reporterUserId,
  reportedUserId: userReports.reportedUserId,
  reportedUserIsBanned: reportedUsers.isBanned,
  placeId: userReports.placeId,
  portalId: userReports.portalId,
  portalCode: linkedPortals.code,
  portalIsEnabled: linkedPortals.isEnabled,
  checkInId: userReports.checkInId,
  resolvedAt: userReports.resolvedAt,
  resolvedBy: userReports.resolvedBy,
} satisfies Record<string, unknown>

export type AdminReport = {
  id: string
  createdAt: Date
  status: ReportStatus
  reasonCode: string
  freeText: string | null
  reporterUserId: string
  reportedUserId: string
  reportedUserIsBanned: boolean
  placeId: string | null
  portalId: string | null
  portalCode: string | null
  portalIsEnabled: boolean | null
  checkInId: string | null
  resolvedAt: Date | null
  resolvedBy: string | null
}

export async function listReports(options: ListOptions = {}): Promise<AdminReport[]> {
  const { status, reasonCode, limit = 50 } = options
  const clauses = []
  if (status) {
    clauses.push(eq(userReports.status, status))
  }
  if (reasonCode) {
    clauses.push(eq(userReports.reasonCode, reasonCode))
  }

  const rows = await db
    .select(reportSelection)
    .from(userReports)
    .leftJoin(
      reportedUsers,
      eq(reportedUsers.id, userReports.reportedUserId),
    )
    .leftJoin(linkedPortals, eq(linkedPortals.id, userReports.portalId))
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(desc(userReports.createdAt))
    .limit(limit)

  return rows
}

export async function listReportsForUser(
  userId: string,
  limit = 20,
): Promise<AdminReport[]> {
  const clause = or(
    eq(userReports.reportedUserId, userId),
    eq(userReports.reporterUserId, userId),
  )

  const rows = await db
    .select(reportSelection)
    .from(userReports)
    .leftJoin(
      reportedUsers,
      eq(reportedUsers.id, userReports.reportedUserId),
    )
    .leftJoin(linkedPortals, eq(linkedPortals.id, userReports.portalId))
    .where(clause)
    .orderBy(desc(userReports.createdAt))
    .limit(limit)

  return rows
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  resolvedBy: string,
) {
  const now = new Date()
  const isResolved = status === "actioned" || status === "dismissed"
  await db
    .update(userReports)
    .set({
      status,
      resolvedAt: isResolved ? now : null,
      resolvedBy: isResolved ? resolvedBy : null,
    })
    .where(eq(userReports.id, reportId))
}

