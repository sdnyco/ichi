import { NextResponse } from "next/server"

import { endCheckinNow } from "@/db/queries/adminCheckins"

function redirectBack(request: Request) {
  const referer = request.headers.get("referer")
  return NextResponse.redirect(
    referer ?? `${new URL(request.url).origin}/admin/check-ins`,
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const checkInId = formData.get("checkInId")

  if (typeof checkInId !== "string") {
    return redirectBack(request)
  }

  await endCheckinNow(checkInId)

  return redirectBack(request)
}

