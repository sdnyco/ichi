import { getUserById, listRecentUsers } from "@/db/queries/adminUsers"
import { listReportsForUser } from "@/db/queries/adminReports"

type UsersPageProps = {
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

function formatDate(date: Date | null) {
  if (!date) return "—"
  return date.toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function AdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const params = searchParams ? await searchParams : undefined
  const searchQuery = getParam(params, "userId")?.trim() ?? ""

  const [recentUsers, selectedUser] = await Promise.all([
    listRecentUsers(20),
    searchQuery ? getUserById(searchQuery) : Promise.resolve(null),
  ])

  const relatedReports = selectedUser
    ? await listReportsForUser(selectedUser.id, 10)
    : []

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Users</p>
        <h1 className="text-3xl font-semibold text-white">User directory</h1>
        <p className="text-sm text-zinc-400">
          Search by user ID, review activity, and manage ban state.
        </p>
      </header>

      <form className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
        <label className="flex flex-1 min-w-[220px] flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            User ID
          </span>
          <input
            type="text"
            name="userId"
            defaultValue={searchQuery}
            placeholder="uuid"
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
            href="/admin/users"
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200"
          >
            Reset
          </a>
        </div>
      </form>

      {searchQuery ? (
        selectedUser ? (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  User
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  {selectedUser.id}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                  selectedUser.isBanned
                    ? "border border-red-400/40 text-red-200"
                    : "border border-green-400/30 text-green-200"
                }`}
              >
                {selectedUser.isBanned ? "Banned" : "Active"}
              </span>
            </div>
            <dl className="grid gap-4 text-sm text-zinc-200 md:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Created
                </dt>
                <dd>{formatDate(selectedUser.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Last seen
                </dt>
                <dd>{formatDate(selectedUser.lastSeenAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Ban reason
                </dt>
                <dd>{selectedUser.banReason ?? "—"}</dd>
              </div>
            </dl>

            <form
              method="POST"
              action="/admin/users/actions"
              className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-200"
            >
              <input type="hidden" name="userId" value={selectedUser.id} />
              <input
                type="hidden"
                name="action"
                value={selectedUser.isBanned ? "unban" : "ban"}
              />
              {!selectedUser.isBanned ? (
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    Ban reason (optional)
                  </span>
                  <textarea
                    name="banReason"
                    rows={2}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
                    placeholder="Short note"
                  />
                </label>
              ) : null}
              <button
                type="submit"
                className={`w-full rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                  selectedUser.isBanned
                    ? "border border-white/20 text-white"
                    : "bg-red-500/80 text-white"
                }`}
              >
                {selectedUser.isBanned ? "Unban user" : "Ban user"}
              </button>
            </form>

            <div className="space-y-2 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-200">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Recent reports
              </p>
              {relatedReports.length === 0 ? (
                <p className="text-xs text-zinc-500">No linked reports.</p>
              ) : (
                <ul className="space-y-2">
                  {relatedReports.map((report) => (
                    <li
                      key={report.id}
                      className="rounded-2xl border border-white/10 px-3 py-2"
                    >
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {report.reasonCode} ·{" "}
                        {report.reportedUserId === selectedUser.id
                          ? "targeted"
                          : "reporter"}
                      </p>
                      <p className="text-sm text-white">
                        {report.id} · {report.status}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(report.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-red-200">
            No user found for “{searchQuery}”.
          </p>
        )
      ) : null}

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Recent signups
        </p>
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full text-left text-sm text-zinc-200">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                  <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">{formatDate(user.lastSeenAt)}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide">
                    {user.isBanned ? "Banned" : "Active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

