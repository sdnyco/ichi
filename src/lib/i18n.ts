import enUS from '../locales/en-US.json'
import deDE from '../locales/de-DE.json'

type Dictionary = Record<string, string>

export type Locale = 'en-US' | 'de-DE'

const dictionaries: Record<Locale, Dictionary> = {
  'en-US': enUS,
  'de-DE': deDE
}

type HeaderSource = {
  get?(name: string): string | null
}

export function getLocaleFromHeaders(headers?: HeaderSource | null): Locale {
  const value = headers?.get?.('accept-language')?.toLowerCase() ?? ''
  return value.includes('de') ? 'de-DE' : 'en-US'
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const fallback = dictionaries['en-US'][key]
  const candidate = dictionaries[locale][key] ?? fallback ?? key

  if (!params) return candidate

  return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
    const pattern = new RegExp(`\\{${paramKey}\\}`, 'g')
    return acc.replace(pattern, String(paramValue))
  }, candidate)
}
