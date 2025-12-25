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

  const portals = await searchPortals({
    code: codeQuery || undefined,
    limit: 30,
  })

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

