import { arePingRateLimitsDisabled, getDevPingMaxRecipients } from "@/lib/dev-overrides"
import { MOOD_OPTIONS } from "@/lib/checkins"
import { t } from "@/lib/i18n"

const PING_TIME_ZONE = "Europe/Berlin"
const RECEIVE_LIMIT_DAYS = 7
const RECEIVE_LIMIT_MAX = 3
const DEFAULT_MAX_RECIPIENTS = 3
const RESEND_ENDPOINT = "https://api.resend.com/emails"
const EMAIL_FROM_ADDRESS =
  process.env.PING_EMAIL_FROM ?? "ichi pings <pings@ichi.click>"

const BASE_URL =
  process.env.PING_PLACE_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "http://localhost:3000"

export function getPingTimeZone() {
  return PING_TIME_ZONE
}

export function getReceiveWindowStart(now: Date) {
  return new Date(now.getTime() - RECEIVE_LIMIT_DAYS * 24 * 60 * 60 * 1000)
}

export function getReceiveLimitMax() {
  return RECEIVE_LIMIT_MAX
}

export function getMaxRecipientsPerPingEvent() {
  const devOverride = getDevPingMaxRecipients()
  if (devOverride) {
    return Math.min(devOverride, 10) // Dev-only testing override; do not enable in production.
  }
  const raw = Number.parseInt(
    process.env.PING_MAX_RECIPIENTS ?? String(DEFAULT_MAX_RECIPIENTS),
    10,
  )
  if (Number.isNaN(raw) || raw < 1) {
    return DEFAULT_MAX_RECIPIENTS
  }
  return Math.min(raw, 10)
}

export function getPingDayKey(date: Date, options?: { disableRateLimits?: boolean }) {
  if (options?.disableRateLimits && arePingRateLimitsDisabled()) {
    return buildDevPingDayKey(date)
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return formatter.format(date)
}

export function getPingPlaceUrl(slug: string) {
  const normalizedBase = BASE_URL.endsWith("/")
    ? BASE_URL.slice(0, -1)
    : BASE_URL
  return `${normalizedBase}/place/${slug}`
}

export function formatExpiresAtLocal(expiresAt: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: PING_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  })
  return formatter.format(expiresAt)
}

function buildDevPingDayKey(date: Date) {
  const datePart = formatInZone(date, {
    timeZone: PING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const timePart = formatInZone(date, {
    timeZone: PING_TIME_ZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).replace(/:/g, "")
  const randomSuffix = Math.random().toString(36).slice(-4)
  return `DEV-${datePart}-${timePart}-${randomSuffix}` // Dev-only testing override; do not enable in production.
}

function formatInZone(
  date: Date,
  options: Intl.DateTimeFormatOptions & { timeZone: string },
) {
  const formatter = new Intl.DateTimeFormat("en-CA", options)
  return formatter.format(date)
}

export function getMoodLabel(moodId: string) {
  const option = MOOD_OPTIONS.find((entry) => entry.id === moodId)
  if (!option) {
    return moodId
  }
  return t("en-US", option.labelKey)
}

type PingEmailRecipient = {
  email: string
}

type PingEmailPayload = {
  placeName: string
  placeSlug: string
  expiresAt: Date
  senderMoodId: string
  recipients: PingEmailRecipient[]
}

export async function sendPingEmails(payload: PingEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured")
  }

  const { placeName, placeSlug, expiresAt, senderMoodId, recipients } = payload
  if (recipients.length === 0) return

  const placeUrl = getPingPlaceUrl(placeSlug)
  const expiresLabel = formatExpiresAtLocal(expiresAt)
  const moodLabel = getMoodLabel(senderMoodId)

  const textBody = [
    `Someone just checked into ${placeName} and expects to be there until approximately ${expiresLabel}.`,
    "",
    `Mood: ${moodLabel}`,
    "",
    `Open place: ${placeUrl}`,
    "",
    "No identity info is shared in these pings.",
  ].join("\n")

  const htmlBody = [
    `<p>Someone just checked into <strong>${placeName}</strong> and expects to be there until approximately <strong>${expiresLabel}</strong>.</p>`,
    `<p>Mood: <strong>${moodLabel}</strong></p>`,
    `<p><a href=\"${placeUrl}\">Open the place</a></p>`,
    "<p>No identity info is shared in these pings.</p>",
  ].join("")

  const failures: unknown[] = []
  for (const recipient of recipients) {
    try {
      await sendResendEmail({
        apiKey,
        to: recipient.email,
        subject: `${placeName}: someone just checked in`,
        html: htmlBody,
        text: textBody,
      })
    } catch (error) {
      failures.push(error)
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(failures, "Failed to send one or more ping emails")
  }
}

async function sendResendEmail(params: {
  apiKey: string
  to: string
  subject: string
  html: string
  text: string
}) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "unknown_error")
    throw new Error(`Resend email failed: ${detail}`)
  }
}

