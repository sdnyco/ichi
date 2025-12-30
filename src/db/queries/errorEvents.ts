import { desc } from "drizzle-orm"

import { db } from "@/db"
import { errorEvents } from "@/db/schema"

export type ErrorEventRecord = {
  id: string
  createdAt: Date
  source: string
  route: string | null
  message: string
  detail: unknown
}

type ErrorEventInput = {
  source: "api" | "client"
  route?: string | null
  message: string
  detail?: unknown
}

export async function logErrorEvent(input: ErrorEventInput) {
  try {
    await db.insert(errorEvents).values({
      source: input.source,
      route: input.route ?? null,
      message: input.message.slice(0, 500),
      detail: input.detail ?? null,
    })
  } catch (error) {
    console.error("log_error_event_failed", error)
  }
}

export async function listRecentErrorEvents(limit = 50): Promise<ErrorEventRecord[]> {
  const rows = await db
    .select({
      id: errorEvents.id,
      createdAt: errorEvents.createdAt,
      source: errorEvents.source,
      route: errorEvents.route,
      message: errorEvents.message,
      detail: errorEvents.detail,
    })
    .from(errorEvents)
    .orderBy(desc(errorEvents.createdAt))
    .limit(limit)

  return rows
}

