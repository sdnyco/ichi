# M7x P1.2 — Anchored profile sheet contract

## API update
- `/api/profiles` keeps the same params but now falls back to `place_profiles` + `users.lastSeenAt` when no active `check_ins` row exists. Active users still return the original payload; anchored-only users now get `activeCheckin: null`, `profile.lastHooks`, and `lastSeenAt` instead of 404.

## UI update
- `OtherProfileSheet` accepts `activeCheckin` as optional, renders last-seen copy (localized) when the user isn’t currently checked in, and hides mood/recognizability sections in that state. Hooks now fall back to `profile.lastHooks` so anchored cards can still display intents.

## Localization
- Added `profile.status.lastSeen` / `profile.status.notActive` strings to both `en-US` and `de-DE` locales so the new status copy is translated.
- Follow-up: clarified `profile.status.notActive` copy (“…checked in here”) in both locales so the status explicitly refers to the current place.

