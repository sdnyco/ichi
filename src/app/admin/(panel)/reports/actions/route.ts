import { NextResponse } from "next/server"

import {
  REPORT_STATUSES,
  type ReportStatus,
  updateReportStatus,
} from "@/db/queries/adminReports"

function getRedirectTarget(request: Request) {
  const referer = request.headers.get("referer")
  return referer ?? `${new URL(request.url).origin}/admin/reports`
}

function isValidStatus(value: string): value is ReportStatus {
  return REPORT_STATUSES.includes(value as ReportStatus)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const reportId = formData.get("reportId")
  const status = formData.get("status")

  if (typeof reportId !== "string" || typeof status !== "string") {
    return NextResponse.redirect(getRedirectTarget(request))
  }

  if (!isValidStatus(status)) {
    return NextResponse.redirect(getRedirectTarget(request))
  }

  await updateReportStatus(reportId, status, "admin_panel")

  return NextResponse.redirect(getRedirectTarget(request))
}

