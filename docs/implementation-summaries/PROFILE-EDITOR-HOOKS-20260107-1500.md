# Profile Editor Hooks (Implementation Summary)
Date: 2026-01-07
Run: PROFILE-EDITOR-HOOKS-20260107-1500

## Goal
Allow anchored-only users to keep editing hooks while continuing to gate mood and recognizability until they check in, and persist hook selections to `place_profiles.lastHooks`.

## Implemented
- Mood and recognizability headings now show the “Check in first” badge only when those controls are disabled, while hooks stay badge-free and editable at all times.
- Hook state now seeds from `placeProfile.lastHooks` whenever no active check-in exists, so anchored profiles load their last published intents.
- Autosave logic posts to `/api/me/active-checkin` when a session is active and falls back to `/api/me/place-profile` (sending `null` to clear) when not, keeping `place_profiles.lastHooks` updated for anchored views.
- Added a locale key for the reused badge copy (`profile.editor.checkInRequired`) in English and German.

## Files Added / Updated
- Updated: `src/components/expanded-profile-sheet.tsx`
- Updated: `src/locales/en-US.json`
- Updated: `src/locales/de-DE.json`
- Added: `docs/implementation-summaries/PROFILE-EDITOR-HOOKS-20260107-1500.md`

## Known Issues / Follow-ups
- We still rely on `HooksPicker`’s local state; if we ever add server-pushed updates (e.g. via websockets), we’ll need reconciliation logic to avoid stomping unsaved edits.
- Anchored users receive no explicit confirmation when hooks finish saving—consider mirroring the existing save badge for that section.

## Next
- Surface `placeProfile.lastHooks` in more read-only contexts (gallery cards, ping workflows) so anchored edits show up consistently.
- Evaluate whether recognizability hint should also fall back to a persisted profile field for anchored users.

