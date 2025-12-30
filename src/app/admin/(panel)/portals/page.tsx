import Link from "next/link"

import { listAdminPlaces } from "@/db/queries/adminPlaces"
import { searchPortals } from "@/db/queries/adminPortals"

type PortalsPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>
}

function getParam(
  params: Record<string, string | string[]> | undefined,
  key: string,
) {
  if (!params) return undefined
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminPortalsPage({
  searchParams,
}: PortalsPageProps) {
  const params = searchParams ? await searchParams : undefined
  const codeQuery = getParam(params, "code")?.trim() ?? ""
  const errorMessage = getParam(params, "error") ?? ""
  const successMessage = getParam(params, "success") ?? ""
  const newCodeDraft = getParam(params, "newCode") ?? ""
  const newPlaceIdDraft = getParam(params, "newPlaceId") ?? ""
  const newIsEnabledDraft = getParam(params, "newIsEnabled") ?? "true"

  const portals = await searchPortals({
    code: codeQuery || undefined,
    limit: 30,
  })
  const places = await listAdminPlaces(200)
  const canCreatePortal = places.length > 0

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Portals
        </p>
        <h1 className="text-3xl font-semibold text-white">Portal controls</h1>
        <p className="text-sm text-zinc-400">
          Toggle portal availability and confirm place connections.
        </p>
      </header>
      {successMessage === "portal_created" ? (
        <p className="rounded-3xl border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-100">
          Portal created successfully.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-3xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
          <label className="flex flex-1 min-w-[220px] flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Portal code
            </span>
            <input
              type="text"
              name="code"
              defaultValue={codeQuery}
              placeholder="Code prefix"
              className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900"
            >
              Search
            </button>
            <a
              href="/admin/portals"
              className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200"
            >
              Reset
            </a>
          </div>
        </form>

        <form
          method="POST"
          action="/admin/portals/actions"
          className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200"
        >
          <input type="hidden" name="action" value="create" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Create portal
              </p>
              <p className="text-xs text-zinc-500">
                Assign a code to an existing place.
              </p>
            </div>
            <Link
              href="/admin/places/new"
              className="text-xs text-white/80 underline decoration-dotted decoration-white/40"
            >
              New place
            </Link>
          </div>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Code
            </span>
            <input
              type="text"
              name="code"
              defaultValue={newCodeDraft}
              placeholder="e.g. GATE-42"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
              required
              disabled={!canCreatePortal}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Place
            </span>
            <select
              name="placeId"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white"
              defaultValue={newPlaceIdDraft || ""}
              required
              disabled={!canCreatePortal}
            >
              <option value="" disabled>
                Select a place
              </option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <input
              type="checkbox"
              name="isEnabled"
              value="true"
              defaultChecked={newIsEnabledDraft !== "false"}
              className="h-4 w-4 rounded border-white/20 bg-black/40"
              disabled={!canCreatePortal}
            />
            Enabled
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900 disabled:cursor-not-allowed disabled:bg-white/40"
            disabled={!canCreatePortal}
          >
            Create portal
          </button>

          {!canCreatePortal ? (
            <p className="text-xs text-zinc-500">
              Create a place first to attach a portal.
            </p>
          ) : null}
        </form>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Results
        </p>
        {portals.length === 0 ? (
          <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
            No portals found.
          </p>
        ) : (
          <div className="space-y-3">
            {portals.map((portal) => (
              <div
                key={portal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {portal.placeName}
                  </p>
                  <p className="text-lg text-white">{portal.code}</p>
                  <p className="text-xs text-zinc-500">{portal.placeId}</p>
                </div>
                <form
                  method="POST"
                  action="/admin/portals/actions"
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="portalId" value={portal.id} />
                  <input
                    type="hidden"
                    name="isEnabled"
                    value={portal.isEnabled ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                      portal.isEnabled
                        ? "border border-red-400/40 text-red-200"
                        : "border border-green-400/40 text-green-200"
                    }`}
                  >
                    {portal.isEnabled ? "Disable" : "Enable"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

