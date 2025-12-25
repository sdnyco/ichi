import { NextResponse } from "next/server"

import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth"

function buildLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url))
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  })
  return response
}

export async function GET(request: Request) {
  return buildLogoutResponse(request)
}

export async function POST(request: Request) {
  return buildLogoutResponse(request)
}

