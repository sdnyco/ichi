type NewPlacePageProps = {
  searchParams?: Promise<Record<string, string | string[]>>
}

function getParamValue(
  params: Record<string, string | string[]> | undefined,
  key: string,
) {
  if (!params) return undefined
  const raw = params[key]
  return Array.isArray(raw) ? raw[0] : raw
}

export default async function AdminNewPlacePage({ searchParams }: NewPlacePageProps) {
  const params = searchParams ? await searchParams : undefined
  const error = getParamValue(params, "error")
  const lastName = getParamValue(params, "name") ?? ""
  const lastSlug = getParamValue(params, "slug") ?? ""
  const lastAddress = getParamValue(params, "addressText") ?? ""

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Places</p>
        <h1 className="text-3xl font-semibold text-white">Create place</h1>
        <p className="text-sm text-zinc-400">
          Minimal metadata required. You can attach portals after creation.
        </p>
      </header>

      {error ? (
        <p className="rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <form
        method="POST"
        action="/admin/places/actions"
        className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200"
      >
        <input type="hidden" name="action" value="create" />
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Name
          </span>
          <input
            type="text"
            name="name"
            defaultValue={lastName}
            required
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
            placeholder="e.g. ichi HQ"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Slug
          </span>
          <input
            type="text"
            name="slug"
            defaultValue={lastSlug}
            required
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
            placeholder="hq"
          />
          <p className="text-xs text-zinc-500">
            Lowercase, URL-safe. Used for public URLs (/place/slug) and admin lookups.
          </p>
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Address (optional)
          </span>
          <textarea
            name="addressText"
            defaultValue={lastAddress}
            rows={2}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
            placeholder="Displayed in admin only."
          />
        </label>

        <div className="flex justify-end gap-3">
          <a
            href="/admin/places"
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900"
          >
            Create place
          </button>
        </div>
      </form>
    </div>
  )
}

