import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  ADMIN_COOKIE_NAME,
  validateAdminCookie,
} from "@/lib/admin-auth"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? null
  const isValidSession = await validateAdminCookie(sessionCookie)

  if (pathname === "/admin/login") {
    if (isValidSession) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  if (!isValidSession && pathname !== "/admin/logout") {
    const loginUrl = new URL("/admin/login", request.url)
    const nextParam =
      pathname + (search && search.length > 0 ? search : "")
    if (nextParam && nextParam !== "/admin/login") {
      loginUrl.searchParams.set("next", nextParam)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}

