import {
  REPORT_STATUSES,
  type ReportStatus,
  listReports,
} from "@/db/queries/adminReports"

type ReportsPageProps = {
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

const STATUS_LABELS: Record<ReportStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  actioned: "Actioned",
  dismissed: "Dismissed",
}

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = searchParams ? await searchParams : undefined
  const statusParam = getParam(params, "status")
  const reasonCode = getParam(params, "reasonCode")

  const statusFilter = REPORT_STATUSES.includes(statusParam as ReportStatus)
    ? (statusParam as ReportStatus)
    : undefined

  const reports = await listReports({
    status: statusFilter,
    reasonCode: reasonCode?.trim() || undefined,
    limit: 100,
  })

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Safety</p>
        <h1 className="text-3xl font-semibold text-white">User reports</h1>
        <p className="text-sm text-zinc-400">
          Review newest reports first, update status, and trigger quick actions.
        </p>
      </header>

      <form className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Status
          </span>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white"
          >
            <option value="">All</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 min-w-[200px] flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Reason code
          </span>
          <input
            type="text"
            name="reasonCode"
            defaultValue={reasonCode ?? ""}
            placeholder="e.g. spam"
            className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900"
          >
            Apply
          </button>
          <a
            href="/admin/reports"
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200"
          >
            Reset
          </a>
        </div>
      </form>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <p className="rounded-3xl border border-white/5 bg-white/5 p-6 text-sm text-zinc-400">
            No reports match this filter.
          </p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {report.reasonCode}
                  </p>
                  <h2 className="text-xl font-medium text-white">
                    {report.reportedUserId}
                  </h2>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wide text-zinc-300">
                  {STATUS_LABELS[report.status]}
                </span>
              </div>
              <dl className="grid gap-3 text-sm text-zinc-200 md:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500">
                    Reporter
                  </dt>
                  <dd className="font-mono text-xs">{report.reporterUserId}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500">
                    Created
                  </dt>
                  <dd>{formatDate(report.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500">
                    Portal
                  </dt>
                  <dd>
                    {report.portalId
                      ? `${report.portalCode ?? ""} · ${
                          report.portalIsEnabled ? "enabled" : "disabled"
                        }`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-zinc-500">
                    Place / Check-in
                  </dt>
                  <dd>
                    {report.placeId ?? "—"} / {report.checkInId ?? "—"}
                  </dd>
                </div>
              </dl>

              {report.freeText ? (
                <details className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                  <summary className="cursor-pointer text-xs uppercase tracking-wide text-zinc-500">
                    Free text
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-zinc-100">
                    {report.freeText}
                  </p>
                </details>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <form
                  method="POST"
                  action="/admin/reports/actions"
                  className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm"
                >
                  <input type="hidden" name="reportId" value={report.id} />
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      Update status
                    </span>
                    <select
                      name="status"
                      defaultValue={report.status}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white"
                    >
                      {REPORT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900"
                  >
                    Save
                  </button>
                </form>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Quick actions
                  </p>
                  <div className="flex flex-col gap-2">
                    <form
                      method="POST"
                      action="/admin/users/actions"
                      className="flex flex-col gap-2"
                    >
                      <input
                        type="hidden"
                        name="userId"
                        value={report.reportedUserId}
                      />
                      <input
                        type="hidden"
                        name="action"
                        value={
                          report.reportedUserIsBanned ? "unban" : "ban"
                        }
                      />
                      {!report.reportedUserIsBanned ? (
                        <input
                          type="hidden"
                          name="banReason"
                          value={`Report ${report.id}`}
                        />
                      ) : null}
                      <button
                        type="submit"
                        className="rounded-2xl border border-white/10 px-3 py-2 text-left text-xs uppercase tracking-wide transition hover:border-white/40"
                      >
                        {report.reportedUserIsBanned
                          ? "Unban user"
                          : "Ban user"}
                      </button>
                    </form>
                    {report.portalId ? (
                      <form
                        method="POST"
                        action="/admin/portals/actions"
                        className="flex flex-col gap-2"
                      >
                        <input
                          type="hidden"
                          name="portalId"
                          value={report.portalId}
                        />
                        <input
                          type="hidden"
                          name="isEnabled"
                          value={
                            report.portalIsEnabled ? "false" : "true"
                          }
                        />
                        <button
                          type="submit"
                          className="rounded-2xl border border-white/10 px-3 py-2 text-left text-xs uppercase tracking-wide transition hover:border-white/40"
                        >
                          {report.portalIsEnabled
                            ? "Disable portal"
                            : "Enable portal"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        No portal linked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

