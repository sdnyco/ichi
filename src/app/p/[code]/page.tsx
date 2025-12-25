import { notFound, redirect } from "next/navigation"
import { getPlaceByPortalCode, getPortalByCode } from "@/db/queries/portals"

type PortalIngressPageProps = {
  params: Promise<{ code: string }>
}

export default async function PortalIngressPage({
  params,
}: PortalIngressPageProps) {
  const { code } = await params

  const record = await getPlaceByPortalCode(code)

  if (record) {
    redirect(`/place/${record.place.slug}`)
  }

  const portal = await getPortalByCode(code)
  if (portal && portal.isEnabled === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <div className="max-w-sm space-y-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Portal inactive
          </p>
          <h1 className="text-3xl font-semibold">
            This portal is currently disabled.
          </h1>
          <p className="text-sm text-zinc-400">
            The host has turned off this code. Please check with staff or try a different
            portal.
          </p>
        </div>
      </div>
    )
  }

  notFound()
}
