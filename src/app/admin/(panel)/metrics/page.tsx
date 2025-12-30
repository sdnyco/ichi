import { getAdminMetrics } from "@/db/queries/adminMetrics"

const numberFormatter = Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

export default async function AdminMetricsPage() {
  const metrics = await getAdminMetrics()

  const cards = [
    {
      title: "Check-ins created",
      description: "Total sessions started",
      ...metrics.checkIns,
    },
    {
      title: "Pings sent",
      description: "Emails triggered when places go live",
      ...metrics.pings,
    },
    {
      title: "Errors logged",
      description: "Captured API/server exceptions",
      ...metrics.errors,
    },
  ]

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Analytics</p>
        <h1 className="text-3xl font-semibold text-white">Core metrics</h1>
        <p className="text-sm text-zinc-400">
          Quick pulse on check-ins, outbound pings, and captured errors.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {card.description}
              </p>
              <h2 className="text-xl font-semibold text-white">{card.title}</h2>
            </div>
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-zinc-500">
                Total
              </p>
              <p className="text-4xl font-bold text-white">
                {numberFormatter.format(card.total)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-zinc-500">
                Last 24h
              </p>
              <p className="text-2xl font-semibold text-white">
                {numberFormatter.format(card.last24h)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

