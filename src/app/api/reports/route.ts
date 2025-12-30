import { NextResponse } from "next/server"

import { reportUser } from "@/db/queries/safety"
import { touchUserLastSeen } from "@/db/queries/users"
import { logErrorEvent } from "@/db/queries/errorEvents"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const reporterUserId = body?.reporterUserId
    const reportedUserId = body?.reportedUserId
    const reasonCode = body?.reasonCode

    if (!reporterUserId || !reportedUserId || !reasonCode) {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 })
    }

    await Promise.all([
      reportUser({
        reporterUserId,
        reportedUserId,
        reasonCode,
        freeText: body?.freeText,
        placeId: body?.placeId,
        portalId: body?.portalId,
        checkInId: body?.checkInId,
      }),
      touchUserLastSeen(reporterUserId),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    await logErrorEvent({
      source: "api",
      route: "/api/reports",
      message: error instanceof Error ? error.message : "unknown_error",
      detail: serializeErrorDetail(error),
    })
    return NextResponse.json({ error: "unknown_error" }, { status: 500 })
  }
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

