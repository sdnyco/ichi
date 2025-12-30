import { NextResponse } from "next/server"

import {
  PlaceSlugConflictError,
  createAdminPlace,
  disableAllPortalsForPlace,
} from "@/db/queries/adminPlaces"

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url))
}

function redirectToNewWithError(
  request: Request,
  message: string,
  params: { name?: string; slug?: string; addressText?: string },
) {
  const target = new URL("/admin/places/new", request.url)
  target.searchParams.set("error", message)
  if (params.name) target.searchParams.set("name", params.name)
  if (params.slug) target.searchParams.set("slug", params.slug)
  if (params.addressText) target.searchParams.set("addressText", params.addressText)
  return NextResponse.redirect(target)
}

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const action = formData.get("action")

  if (action === "create") {
    const name = typeof formData.get("name") === "string" ? (formData.get("name") as string) : ""
    const slug = typeof formData.get("slug") === "string" ? (formData.get("slug") as string) : ""
    const addressText =
      typeof formData.get("addressText") === "string"
        ? (formData.get("addressText") as string)
        : ""

    const trimmedName = name.trim()
    const normalizedSlug = slug.trim().toLowerCase()

    if (!trimmedName) {
      return redirectToNewWithError(request, "Name is required.", {
        slug: normalizedSlug,
        addressText,
      })
    }

    if (!normalizedSlug) {
      return redirectToNewWithError(request, "Slug is required.", {
        name: trimmedName,
        addressText,
      })
    }

    if (!isValidSlug(normalizedSlug)) {
      return redirectToNewWithError(request, "Slug must be lowercase letters, numbers, or dashes.", {
        name: trimmedName,
        slug: normalizedSlug,
        addressText,
      })
    }

    try {
      const place = await createAdminPlace({
        name: trimmedName,
        slug: normalizedSlug,
        addressText,
      })
      return redirectTo(request, `/admin/places/${place.id}`)
    } catch (error) {
      if (error instanceof PlaceSlugConflictError) {
        return redirectToNewWithError(request, "Slug already exists.", {
          name: trimmedName,
          slug: normalizedSlug,
          addressText,
        })
      }

      console.error("create_place_failed", error)
      return redirectToNewWithError(request, "Unexpected error creating place.", {
        name: trimmedName,
        slug: normalizedSlug,
        addressText,
      })
    }
  }

  if (action === "disable-portals") {
    const placeId =
      typeof formData.get("placeId") === "string" ? (formData.get("placeId") as string) : null

    if (!placeId) {
      return redirectTo(request, "/admin/places")
    }

    await disableAllPortalsForPlace(placeId)
    return redirectTo(request, `/admin/places/${placeId}`)
  }

  return redirectTo(request, "/admin/places")
}

