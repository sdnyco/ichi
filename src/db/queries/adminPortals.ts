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

export class PortalCodeConflictError extends Error {
  constructor(code: string) {
    super(`Portal code already exists: ${code}`)
    this.name = "PortalCodeConflictError"
  }
}

export class PortalPlaceNotFoundError extends Error {
  constructor(placeId: string) {
    super(`Place not found: ${placeId}`)
    this.name = "PortalPlaceNotFoundError"
  }
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

export async function createPortalRecord(params: {
  code: string
  placeId: string
  isEnabled: boolean
}) {
  const normalizedCode = params.code.trim()
  if (!normalizedCode) {
    throw new Error("invalid_code")
  }

  const [place] = await db
    .select({ id: places.id })
    .from(places)
    .where(eq(places.id, params.placeId))
    .limit(1)

  if (!place) {
    throw new PortalPlaceNotFoundError(params.placeId)
  }

  const [existingPortal] = await db
    .select({ id: portals.id })
    .from(portals)
    .where(eq(portals.code, normalizedCode))
    .limit(1)

  if (existingPortal) {
    throw new PortalCodeConflictError(normalizedCode)
  }

  const [created] = await db
    .insert(portals)
    .values({
      code: normalizedCode,
      placeId: params.placeId,
      isEnabled: params.isEnabled,
    })
    .returning({
      id: portals.id,
      code: portals.code,
    })

  return created
}

