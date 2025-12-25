import Link from "next/link"

const SECTIONS = [
  {
    href: "/admin/reports",
    title: "Reports",
    description: "Review status, resolve cases, and act quickly.",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "Search users, review activity, and ban/unban accounts.",
  },
  {
    href: "/admin/portals",
    title: "Portals",
    description: "Toggle portal availability by code.",
  },
  {
    href: "/admin/check-ins",
    title: "Check-ins",
    description: "See active/expired check-ins and end sessions early.",
  },
]

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          Internal tools
        </p>
        <h1 className="text-4xl font-semibold text-white">Admin panel</h1>
        <p className="mt-2 text-base text-zinc-400">
          Minimal control center for moderation, portals, and check-ins.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30"
          >
            <p className="text-sm uppercase tracking-wide text-zinc-500">
              {section.href.replace("/admin/", "")}
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {section.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

