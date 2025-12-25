import enUS from "../locales/en-US.json"
import deDE from "../locales/de-DE.json"

type Dictionary = Record<string, string>

export type Locale = "en-US" | "de-DE"

export const SUPPORTED_LOCALES: Locale[] = ["en-US", "de-DE"]

const dictionaries: Record<Locale, Dictionary> = {
  "en-US": enUS,
  "de-DE": deDE,
}

type HeaderSource = {
  get?(name: string): string | null
}

function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null
  const match = SUPPORTED_LOCALES.find(
    (locale) => locale.toLowerCase() === value.toLowerCase(),
  )
  return match ?? null
}

export function getLocaleFromHeaders(
  headers?: HeaderSource | null,
  override?: string | null,
): Locale {
  const forced = normalizeLocale(override)
  if (forced) return forced

  const headerValue = headers?.get?.("accept-language")?.toLowerCase() ?? ""
  return headerValue.includes("de") ? "de-DE" : "en-US"
}

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const fallback = dictionaries["en-US"][key]
  const candidate = dictionaries[locale][key] ?? fallback ?? key

  if (!params) return candidate

  return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
    const pattern = new RegExp(`\\{${paramKey}\\}`, 'g')
    return acc.replace(pattern, String(paramValue))
  }, candidate)
}
