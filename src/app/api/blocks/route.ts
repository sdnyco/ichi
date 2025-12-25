import { NextResponse } from "next/server"

import { blockUser, unblockUser } from "@/db/queries/safety"
import { touchUserLastSeen } from "@/db/queries/users"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const blockerUserId = body?.blockerUserId
    const blockedUserId = body?.blockedUserId

    if (!blockerUserId || !blockedUserId) {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 })
    }

    if (blockerUserId === blockedUserId) {
      return NextResponse.json({ error: "same_user" }, { status: 400 })
    }

    await Promise.all([
      blockUser({ blockerUserId, blockedUserId }),
      touchUserLastSeen(blockerUserId),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "unknown_error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const blockerUserId = url.searchParams.get("blockerUserId")
    const blockedUserId = url.searchParams.get("blockedUserId")

    if (!blockerUserId || !blockedUserId) {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 })
    }

    await Promise.all([
      unblockUser({ blockerUserId, blockedUserId }),
      touchUserLastSeen(blockerUserId),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "unknown_error" }, { status: 500 })
  }
}

