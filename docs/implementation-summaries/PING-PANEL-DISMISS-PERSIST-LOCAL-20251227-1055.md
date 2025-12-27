# Ping Panel Dismiss Persistence (2025-12-27 10:55)

## What changed

- Added a `PING_DISMISS_KEY_PREFIX` helper in `src/components/place-ping-panel.tsx` and now derive a storage key via `placeId + activeCheckinId`. On dismiss, we set the local key and immediately hide the panel. A required note documents that keys are intentionally left in storage.
- When `activeCheckin` changes, the panel rehydrates dismissal state by checking localStorage. If a key exists for the current check-in, the panel stays hidden; otherwise it resets so eligibility can show again. The rest of the eligibility/ping logic is untouched.
- Because dismissal is tied strictly to the active check-in ID, starting a new check-in naturally yields a new key (or none), so the panel may reappear if eligible—now resilient to refreshes, QR rescans, or new tabs.

## Behavior notes

- Persistence is entirely client-side (localStorage) and per check-in; no API or rate-limit changes.
- Old keys are left in place per the inline comment, since each key becomes inert once its check-in expires. We can revisit cleanup if storage usage ever matters.


