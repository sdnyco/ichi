import { getEnv } from "@/lib/env"

export const ADMIN_COOKIE_NAME = "ichi_admin"
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours
type DigestAlgorithm = "SHA-256"

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis.crypto?.subtle === "undefined") {
    throw new Error("Web Crypto API is not available in this environment")
  }
  return globalThis.crypto.subtle
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false
  }
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

async function hashString(input: string, algorithm: DigestAlgorithm = "SHA-256") {
  const subtle = getSubtleCrypto()
  const encoder = new TextEncoder()
  const digest = await subtle.digest(algorithm, encoder.encode(input))
  return bufferToHex(digest)
}

function bufferToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function computeSessionSignature() {
  const adminToken = getEnv("ADMIN_TOKEN")
  return hashString(`ichi-admin-session::${adminToken}`)
}

export async function validateAdminCookie(cookieValue: string | undefined | null) {
  if (!cookieValue) return false
  const expected = await computeSessionSignature()
  if (cookieValue.length !== expected.length) {
    return false
  }
  return constantTimeEqual(cookieValue, expected)
}

export async function getAdminSessionCookieValue() {
  return computeSessionSignature()
}

export async function verifyAdminToken(input: string | null | undefined) {
  if (!input) return false
  const provided = await hashString(input.trim())
  const expected = await hashString(getEnv("ADMIN_TOKEN"))
  return constantTimeEqual(provided, expected)
}

