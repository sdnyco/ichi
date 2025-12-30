import { listRecentErrorEvents } from "@/db/queries/errorEvents"

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function AdminErrorsPage() {
  const events = await listRecentErrorEvents(50)

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Errors</p>
        <h1 className="text-3xl font-semibold text-white">Recent error events</h1>
        <p className="text-sm text-zinc-400">
          Logged API exceptions over the past few days. Swallowed errors do not block
          user flows.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
          No errors logged yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-zinc-200">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {formatDate(event.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide">
                    {event.source}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {event.route ?? "—"}
                  </td>
                  <td className="px-4 py-3">{event.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

