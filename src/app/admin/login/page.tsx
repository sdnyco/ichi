type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>
}

function getParamValue(
  params: Record<string, string | string[]> | undefined,
  key: string,
): string | undefined {
  if (!params) return undefined
  const raw = params[key]
  if (Array.isArray(raw)) return raw[0]
  return raw
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined
  const error = getParamValue(params, "error")
  const next = getParamValue(params, "next")

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-white/10 bg-zinc-950 p-8 text-white shadow-2xl">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          ichi · Internal
        </p>
        <h1 className="text-3xl font-semibold text-white">Admin login</h1>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/20 px-4 py-3 text-sm text-red-100">
          Invalid token. Please try again.
        </p>
      ) : null}

      <form method="POST" action="/admin/login/action" className="space-y-4">
        <label className="space-y-2 text-sm text-zinc-300">
          <span className="block text-xs uppercase tracking-wide text-zinc-500">
            Admin token
          </span>
          <input
            type="password"
            name="token"
            required
            autoFocus
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
            placeholder="••••••••"
          />
        </label>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <button
          type="submit"
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
        >
          Enter
        </button>
      </form>
    </div>
  )
}

