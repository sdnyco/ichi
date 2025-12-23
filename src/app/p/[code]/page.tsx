import { notFound, redirect } from "next/navigation"
import { getPlaceByPortalCode } from "@/db/queries/portals"

type PortalIngressPageProps = {
  params: Promise<{ code: string }>
}

export default async function PortalIngressPage({
  params,
}: PortalIngressPageProps) {
  const { code } = await params

  const record = await getPlaceByPortalCode(code)

  if (!record) {
    notFound()
  }

  redirect(`/place/${record.place.slug}`)
}
