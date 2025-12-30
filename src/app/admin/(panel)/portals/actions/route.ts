import { NextResponse } from "next/server"

import {
  PortalCodeConflictError,
  PortalPlaceNotFoundError,
  createPortalRecord,
  setPortalEnabled,
} from "@/db/queries/adminPortals"

function redirectBack(request: Request) {
  const referer = request.headers.get("referer")
  return NextResponse.redirect(
    referer ?? `${new URL(request.url).origin}/admin/portals`,
  )
}

function redirectWithQuery(request: Request, params: Record<string, string | undefined>) {
  const target = new URL("/admin/portals", request.url)
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      target.searchParams.set(key, value)
    }
  }
  return NextResponse.redirect(target)
}

export async function POST(request: Request) {
  const formData = await request.formData()

  const action = formData.get("action")

  if (action === "create") {
    const code =
      typeof formData.get("code") === "string" ? (formData.get("code") as string) : ""
    const placeId =
      typeof formData.get("placeId") === "string" ? (formData.get("placeId") as string) : ""
    const isEnabled = formData.get("isEnabled") !== "false"

    const trimmedCode = code.trim()
    if (!trimmedCode) {
      return redirectWithQuery(request, {
        error: "Code is required.",
        newCode: "",
        newPlaceId: placeId,
        newIsEnabled: isEnabled ? "true" : "false",
      })
    }

    if (!placeId) {
      return redirectWithQuery(request, {
        error: "Place selection is required.",
        newCode: trimmedCode,
        newIsEnabled: isEnabled ? "true" : "false",
      })
    }

    try {
      await createPortalRecord({
        code: trimmedCode,
        placeId,
        isEnabled,
      })
      return redirectWithQuery(request, {
        success: "portal_created",
        code: trimmedCode,
      })
    } catch (error) {
      if (error instanceof PortalCodeConflictError) {
        return redirectWithQuery(request, {
          error: "Portal code already exists.",
          newCode: trimmedCode,
          newPlaceId: placeId,
          newIsEnabled: isEnabled ? "true" : "false",
        })
      }
      if (error instanceof PortalPlaceNotFoundError) {
        return redirectWithQuery(request, {
          error: "Selected place was not found.",
          newCode: trimmedCode,
          newIsEnabled: isEnabled ? "true" : "false",
        })
      }
      console.error("portal_create_failed", error)
      return redirectWithQuery(request, {
        error: "Unexpected error creating portal.",
        newCode: trimmedCode,
        newPlaceId: placeId,
        newIsEnabled: isEnabled ? "true" : "false",
      })
    }
  }

  const portalId = formData.get("portalId")
  const nextState = formData.get("isEnabled")

  if (typeof portalId !== "string" || typeof nextState !== "string") {
    return redirectBack(request)
  }

  await setPortalEnabled(portalId, nextState === "true")

  return redirectBack(request)
}

