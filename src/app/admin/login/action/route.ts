import { NextResponse } from "next/server"

import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  getAdminSessionCookieValue,
  verifyAdminToken,
} from "@/lib/admin-auth"

function sanitizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath) return "/admin"
  if (!nextPath.startsWith("/admin")) return "/admin"
  return nextPath
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const token = formData.get("token")
  const nextParam = sanitizeNextPath(
    typeof formData.get("next") === "string"
      ? (formData.get("next") as string)
      : null,
  )

  if (!(await verifyAdminToken(typeof token === "string" ? token : null))) {
    const redirectUrl = new URL("/admin/login", request.url)
    if (nextParam && nextParam !== "/admin") {
      redirectUrl.searchParams.set("next", nextParam)
    }
    redirectUrl.searchParams.set("error", "invalid")
    return NextResponse.redirect(redirectUrl)
  }

  const response = NextResponse.redirect(
    new URL(nextParam ?? "/admin", request.url),
  )

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: await getAdminSessionCookieValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })

  return response
}

