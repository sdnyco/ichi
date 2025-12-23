import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { places, portals } from "@/db/schema"

export type PortalWithPlace = {
  portal: {
    id: string
    code: string
    placeId: string
  }
  place: {
    id: string
    slug: string
    name: string
  }
}

export async function getPlaceByPortalCode(
  code: string,
): Promise<PortalWithPlace | null> {
  const [record] = await db
    .select({
      portal: {
        id: portals.id,
        code: portals.code,
        placeId: portals.placeId,
      },
      place: {
        id: places.id,
        slug: places.slug,
        name: places.name,
      },
    })
    .from(portals)
    .innerJoin(places, eq(portals.placeId, places.id))
    .where(and(eq(portals.code, code), eq(portals.isEnabled, true)))
    .limit(1)

  return record ?? null
}

