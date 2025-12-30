import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { ReactNode } from "react"

import { ADMIN_COOKIE_NAME, validateAdminCookie } from "@/lib/admin-auth"

const NAV_LINKS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/portals", label: "Portals" },
  { href: "/admin/check-ins", label: "Check-ins" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/errors", label: "Errors" },
]

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? null
  const hasSession = await validateAdminCookie(sessionValue)

  if (!hasSession) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin" className="text-lg font-semibold tracking-tight">
            ichi · Admin
          </Link>
          {hasSession ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <nav className="flex flex-wrap items-center gap-3">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-white/10 px-3 py-1 text-zinc-200 transition hover:border-white/40 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <Link
                href="/admin/logout"
                className="rounded-full border border-white/10 px-3 py-1 text-zinc-400 transition hover:border-red-400/60 hover:text-red-200"
              >
                Logout
              </Link>
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}

