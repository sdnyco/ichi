import Link from "next/link"

import { listAdminPlaces } from "@/db/queries/adminPlaces"

export default async function AdminPlacesPage() {
  const places = await listAdminPlaces()

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Places</p>
        <h1 className="text-3xl font-semibold text-white">Places directory</h1>
        <p className="text-sm text-zinc-400">
          Review places, inspect linked portals, and open detail views.
        </p>
      </header>

      <div className="flex justify-end">
        <Link
          href="/admin/places/new"
          className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900"
        >
          New place
        </Link>
      </div>

      {places.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          No places yet. Create the first place to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {places.map((place) => (
            <Link
              key={place.id}
              href={`/admin/places/${place.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
            >
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {place.slug}
                </p>
                <h2 className="text-xl font-semibold text-white">{place.name}</h2>
                <p className="font-mono text-xs text-zinc-500">{place.id}</p>
              </div>
              <div className="text-right text-sm text-zinc-300">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Portals
                </p>
                <p className="text-lg font-semibold text-white">{place.portalCount}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

