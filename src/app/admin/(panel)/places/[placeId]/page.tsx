import { notFound } from "next/navigation"

import { getAdminPlaceDetail } from "@/db/queries/adminPlaces"

type PlaceDetailPageProps = {
  params: Promise<{
    placeId: string
  }>
}

export default async function AdminPlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params
  const place = await getAdminPlaceDetail(placeId)

  if (!place) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Place</p>
        <h1 className="text-3xl font-semibold text-white">{place.name}</h1>
        <p className="text-sm text-zinc-400">ID: {place.id}</p>
      </header>

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Slug</p>
          <p className="font-mono text-xs text-white">{place.slug}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Portals</p>
          <p className="text-lg font-semibold text-white">{place.portalCount}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Address</p>
          <p className="text-white">{place.addressText ?? "—"}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Portals
            </p>
            <h2 className="text-2xl font-semibold text-white">Linked portals</h2>
          </div>
          <form
            method="POST"
            action="/admin/places/actions"
            className="flex items-center gap-2"
          >
            <input type="hidden" name="action" value="disable-portals" />
            <input type="hidden" name="placeId" value={place.id} />
            <button
              type="submit"
              className="rounded-2xl border border-red-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-100"
            >
              Disable all portals
            </button>
          </form>
        </div>

        {place.portals.length === 0 ? (
          <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
            No portals linked to this place.
          </p>
        ) : (
          <div className="space-y-3">
            {place.portals.map((portal) => (
              <div
                key={portal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {portal.code}
                  </p>
                  <p className="font-mono text-xs text-zinc-500">{portal.id}</p>
                  <p className="text-xs text-zinc-500">
                    {portal.isEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <form method="POST" action="/admin/portals/actions">
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
                        ? "border border-red-400/40 text-red-100"
                        : "border border-green-400/40 text-green-100"
                    }`}
                  >
                    {portal.isEnabled ? "Disable" : "Enable"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

