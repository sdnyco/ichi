import {
  type CheckinScope,
  listCheckins,
} from "@/db/queries/adminCheckins"

type CheckinsPageProps = {
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

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function AdminCheckinsPage({
  searchParams,
}: CheckinsPageProps) {
  const params = searchParams ? await searchParams : undefined
  const tab = getParam(params, "tab") === "expired" ? "expired" : "active"
  const checkins = await listCheckins({ scope: tab as CheckinScope, limit: 50 })

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Check-ins
        </p>
        <h1 className="text-3xl font-semibold text-white">Live sessions</h1>
        <p className="text-sm text-zinc-400">
          Review active and expired sessions. End active check-ins immediately.
        </p>
      </header>

      <div className="flex gap-2">
        <a
          href="/admin/check-ins?tab=active"
          className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
            tab === "active"
              ? "bg-white/90 text-zinc-900"
              : "border border-white/10 text-zinc-200"
          }`}
        >
          Active
        </a>
        <a
          href="/admin/check-ins?tab=expired"
          className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
            tab === "expired"
              ? "bg-white/90 text-zinc-900"
              : "border border-white/10 text-zinc-200"
          }`}
        >
          Expired
        </a>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="min-w-full text-left text-sm text-zinc-200">
          <thead className="text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">User / Alias</th>
              <th className="px-4 py-3">Place</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3">Mood</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {checkins.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-zinc-500"
                >
                  No check-ins in this view.
                </td>
              </tr>
            ) : (
              checkins.map((checkIn) => (
                <tr
                  key={checkIn.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{checkIn.id}</p>
                    <p className="text-xs text-zinc-500">
                      Created {formatDate(checkIn.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{checkIn.userId}</p>
                    <p className="text-xs text-zinc-400">
                      {checkIn.alias ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{checkIn.placeName ?? checkIn.placeId}</p>
                    <p className="font-mono text-xs text-zinc-500">
                      {checkIn.placeId}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>Start: {formatDate(checkIn.startedAt)}</p>
                    <p>End: {formatDate(checkIn.expiresAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs uppercase tracking-wide">
                      {checkIn.mood}
                    </p>
                    {checkIn.hooks?.length ? (
                      <p className="text-xs text-zinc-400">
                        Hooks: {checkIn.hooks.join(", ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {tab === "active" ? (
                      <form
                        method="POST"
                        action="/admin/check-ins/actions"
                      >
                        <input
                          type="hidden"
                          name="checkInId"
                          value={checkIn.id}
                        />
                        <button
                          type="submit"
                          className="rounded-2xl border border-red-400/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-100"
                        >
                          End now
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

