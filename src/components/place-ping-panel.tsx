"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getOrCreateLocalUserId } from "@/lib/identity"
import { t, type Locale } from "@/lib/i18n"

const PING_DISMISS_KEY_PREFIX = "ichi:pingDismissed"

function getDismissStorageKey(placeId: string, checkInId: string) {
  return `${PING_DISMISS_KEY_PREFIX}:${placeId}:${checkInId}`
}

type PlacePingPanelProps = {
  placeId: string
  locale: Locale
  checkinVersion?: number
}

type PlaceContextActiveCheckin = {
  id: string
  startedAt: string
  expiresAt: string
}

type PlaceContextResponse = {
  activeCheckin: PlaceContextActiveCheckin | null
}

type PingEligibility = {
  eligibleCount: number
  isPlaceEmpty: boolean
  sendLimitAvailable: boolean
}

type PingEligibilityResponse =
  | { ok: true; eligibility: PingEligibility }
  | { ok: false; error?: string }

type SendPingResponse =
  | { ok: true; sentToCount: number }
  | {
      ok: false
      reason?: "no_recipients" | "send_limit" | "not_empty" | "email_failed"
    }

export function PlacePingPanel({
  placeId,
  locale,
  checkinVersion = 0,
}: PlacePingPanelProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [activeCheckin, setActiveCheckin] =
    useState<PlaceContextActiveCheckin | null>(null)
  const [pingEligibility, setPingEligibility] =
    useState<PingEligibility | null>(null)
  const [isPingEligibilityLoading, setIsPingEligibilityLoading] =
    useState(false)
  const [isSendingPing, setIsSendingPing] = useState(false)
  const [pingStatus, setPingStatus] = useState<
    | "success"
    | "no_recipients"
    | "send_limit"
    | "not_empty"
    | "email_failed"
    | "error"
    | null
  >(null)
  const lastPingEligibilityCheckRef = useRef<string | null>(null)
  const [dismissedCheckInId, setDismissedCheckInId] = useState<string | null>(null)

  const canShowPingCta =
    Boolean(
      activeCheckin &&
        pingEligibility &&
        pingEligibility.isPlaceEmpty &&
        pingEligibility.sendLimitAvailable &&
        pingEligibility.eligibleCount > 0,
    ) && Boolean(userId)
  const pingStatusKeyMap: Record<
    Exclude<typeof pingStatus, null>,
    string
  > = {
    success: "checkin.ping.success",
    no_recipients: "checkin.ping.none",
    send_limit: "checkin.ping.limit",
    not_empty: "checkin.ping.notEmpty",
    email_failed: "checkin.ping.error",
    error: "checkin.ping.error",
  }
  const pingStatusMessage = pingStatus
    ? t(locale, pingStatusKeyMap[pingStatus])
    : null
  const pingStatusTone =
    pingStatus === "success"
      ? "success"
      : pingStatus === "error" || pingStatus === "email_failed"
        ? "error"
        : "warning"
  const pingStatusClass =
    pingStatusTone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : pingStatusTone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-800"
  const pingCtaDisabled = isSendingPing || isPingEligibilityLoading

  const refreshActiveCheckin = useCallback(async () => {
    if (!userId) return
    try {
      const params = new URLSearchParams({ placeId, userId })
      const response = await fetch(`/api/me/place-context?${params.toString()}`)
      if (!response.ok) {
        throw new Error("place_context_failed")
      }
      const data = (await response.json()) as PlaceContextResponse
      setActiveCheckin(data.activeCheckin)
    } catch (error) {
      console.error(error)
    }
  }, [placeId, userId])

  const fetchPingEligibility = useCallback(
    async (force = false) => {
      if (!activeCheckin) return
      if (!userId) return
      if (!force && lastPingEligibilityCheckRef.current === activeCheckin.id) {
        return
      }
      lastPingEligibilityCheckRef.current = activeCheckin.id
      setIsPingEligibilityLoading(true)
      try {
        const params = new URLSearchParams({
          placeId,
          checkInId: activeCheckin.id,
        })
        const response = await fetch(`/api/pings/eligibility?${params.toString()}`)

        if (response.status === 401 || response.status === 404) {
          setPingEligibility(null)
          return
        }

        if (!response.ok) {
          console.error("ping_eligibility_failed", response.status)
          setPingEligibility(null)
          return
        }

        const data = (await response.json()) as PingEligibilityResponse
        if (data.ok) {
          setPingEligibility(data.eligibility)
        } else {
          setPingEligibility(null)
        }
      } catch (error) {
        console.error(error)
        setPingEligibility(null)
      } finally {
        setIsPingEligibilityLoading(false)
      }
    },
    [activeCheckin, placeId, userId],
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    setUserId(getOrCreateLocalUserId())
  }, [])

  useEffect(() => {
    void refreshActiveCheckin()
  }, [refreshActiveCheckin, checkinVersion])

  useEffect(() => {
    if (!activeCheckin) {
      setDismissedCheckInId(null)
      setPingEligibility(null)
      setPingStatus(null)
      lastPingEligibilityCheckRef.current = null
      return
    }

    if (typeof window !== "undefined") {
      const storageKey = getDismissStorageKey(placeId, activeCheckin.id)
      const storedValue = window.localStorage.getItem(storageKey)
      setDismissedCheckInId(storedValue === "1" ? activeCheckin.id : null)
    } else {
      setDismissedCheckInId(null)
    }

    setPingStatus(null)
    void fetchPingEligibility()
  }, [activeCheckin, fetchPingEligibility, placeId])

  const handleSendPing = useCallback(() => {
    if (!activeCheckin) return
    setIsSendingPing(true)
    setPingStatus(null)
    void fetch("/api/pings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId,
        senderCheckInId: activeCheckin.id,
      }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as SendPingResponse
        if (response.ok && data.ok) {
          setPingStatus("success")
          setPingEligibility(null)
          lastPingEligibilityCheckRef.current = null
        } else {
          const reason =
            (data.reason as NonNullable<typeof pingStatus>) ?? "error"
          setPingStatus(reason)
          void fetchPingEligibility(true)
        }
      })
      .catch((error) => {
        console.error(error)
        setPingStatus("error")
      })
      .finally(() => {
        setIsSendingPing(false)
      })
  }, [activeCheckin, fetchPingEligibility, placeId])

  const handleDismiss = useCallback(() => {
    if (!activeCheckin) return
    setDismissedCheckInId(activeCheckin.id)
    if (typeof window !== "undefined") {
      const storageKey = getDismissStorageKey(placeId, activeCheckin.id)
      window.localStorage.setItem(storageKey, "1")
      // NOTE: We intentionally do not clean up old ping-dismiss keys.
      // Keys are scoped by checkinId and become inert after expiry.
      // Can be revisited if storage usage ever becomes meaningful.
    }
  }, [activeCheckin, placeId])

  const isDismissed =
    Boolean(activeCheckin?.id) && dismissedCheckInId === activeCheckin?.id

  if (isDismissed) {
    return null
  }

  if (!canShowPingCta && !pingStatusMessage) {
    return null
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
      {canShowPingCta ? (
        <div className="space-y-3">
          <p>{t(locale, "checkin.ping.description")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSendPing}
              disabled={pingCtaDisabled}
              className="rounded-full bg-blue-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:pointer-events-none disabled:opacity-60"
            >
              {isSendingPing
                ? t(locale, "checkin.ping.pending")
                : t(locale, "checkin.ping.cta")}
            </button>
            {isPingEligibilityLoading ? (
              <span className="text-xs text-blue-800">
                {t(locale, "checkin.ping.loading")}
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-medium text-blue-900 underline underline-offset-4 hover:text-blue-700"
            >
              {t(locale, "checkin.ping.dismiss")}
            </button>
          </div>
        </div>
      ) : null}
      {pingStatusMessage ? (
        <p className={`mt-4 rounded-md border px-3 py-2 text-xs ${pingStatusClass}`}>
          {pingStatusMessage}
        </p>
      ) : null}
    </div>
  )
}


