import { and, eq, ilike } from "drizzle-orm"

import { db } from "@/db"
import { places, portals } from "@/db/schema"

type SearchParams = {
  code?: string
  limit?: number
}

export type AdminPortalRecord = {
  id: string
  code: string
  placeId: string
  placeName: string
  isEnabled: boolean
}

export async function searchPortals({
  code,
  limit = 20,
}: SearchParams = {}): Promise<AdminPortalRecord[]> {
  const filters = []
  if (code && code.trim() !== "") {
    filters.push(ilike(portals.code, `${code.trim()}%`))
  }

  const rows = await db
    .select({
      id: portals.id,
      code: portals.code,
      placeId: portals.placeId,
      placeName: places.name,
      isEnabled: portals.isEnabled,
    })
    .from(portals)
    .innerJoin(places, eq(places.id, portals.placeId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(portals.code)
    .limit(limit)

  return rows
}

export async function setPortalEnabled(portalId: string, isEnabled: boolean) {
  await db
    .update(portals)
    .set({ isEnabled })
    .where(eq(portals.id, portalId))
}

