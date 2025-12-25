# W4b.1 — Expanded Profile UI Polish
Date: 2025-12-25  
Run: W4b.1-20251225-1250

## Goal
Tighten the expanded profile overlay to match the latest mock guidance (navigation affordances, layout hierarchy, hook visuals) without touching business logic or schema.

## Implemented
- **Locale override for dev:** `/place/[slug]?lang=en-US` (or `?locale=`) forces the UI language; falls back to `Accept-Language` otherwise.
- **Overlay chrome:** Added a top “Back” control, fixed save-status bar, and reorganized the alias header with a clearly aligned regenerate button. Session check-in info now surfaces a friendly status message plus a disabled “Check out” CTA with “Coming soon” copy.
- **Structure & separators:** Session-scoped controls (mood / recognizability) remain in their block, hooks stay in their own section, and a dashed divider clearly separates global basics from ephemeral data.
- **Hooks taxonomy polish:** Category chips now have icons + stronger styling, hook chips remain toggles, and counts/limits are communicated explicitly. Catalog + labels live in `src/lib/hooks-catalog.ts` with localized strings.

## Key Files
- `src/lib/i18n.ts`, `src/app/place/[slug]/page.tsx` (locale override)
- `src/components/expanded-profile-sheet.tsx`
- `src/components/profile/hooks-picker.tsx`
- `src/locales/en-US.json`, `src/locales/de-DE.json`

## Follow-ups
- “Check out” remains a stub until backend support exists.
- Hook taxonomy is static; future runs can scope city/place filtering or “session details” consolidation (W4b.2).

