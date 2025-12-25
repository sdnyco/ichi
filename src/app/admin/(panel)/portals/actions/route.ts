import { NextResponse } from "next/server"

import { setPortalEnabled } from "@/db/queries/adminPortals"

function redirectBack(request: Request) {
  const referer = request.headers.get("referer")
  return NextResponse.redirect(
    referer ?? `${new URL(request.url).origin}/admin/portals`,
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const portalId = formData.get("portalId")
  const nextState = formData.get("isEnabled")

  if (typeof portalId !== "string" || typeof nextState !== "string") {
    return redirectBack(request)
  }

  await setPortalEnabled(portalId, nextState === "true")

  return redirectBack(request)
}

