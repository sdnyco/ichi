import { NextResponse } from "next/server"

import { setUserBanState } from "@/db/queries/adminUsers"

function redirectBack(request: Request) {
  const referer = request.headers.get("referer")
  return NextResponse.redirect(
    referer ?? `${new URL(request.url).origin}/admin/users`,
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const action = formData.get("action")
  const userId = formData.get("userId")

  if (typeof userId !== "string" || typeof action !== "string") {
    return redirectBack(request)
  }

  if (action !== "ban" && action !== "unban") {
    return redirectBack(request)
  }

  const banReason =
    action === "ban" && typeof formData.get("banReason") === "string"
      ? (formData.get("banReason") as string)
      : null

  await setUserBanState({
    userId,
    isBanned: action === "ban",
    banReason,
  })

  return redirectBack(request)
}

