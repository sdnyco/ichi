# Ping Panel Dismiss (2025-12-27 10:45)

## What changed

- Added a local `dismissedCheckInId` state inside `src/components/place-ping-panel.tsx`. When users tap the new “No thanks” text button, the component records the active check-in ID and returns `null`, hiding the panel for the remainder of that check-in.
- Reset the dismissal automatically whenever `activeCheckin` becomes null or its ID changes, ensuring the panel reappears on later check-ins if eligibility is still true.
- Introduced the low-emphasis “No thanks” button alongside the existing CTA, using a new locale string (`checkin.ping.dismiss`) translated in both `en-US` and `de-DE`.

## Behavior notes

- The dismissal is purely client-side and per-check-in: no persistence, no API changes, no impact on eligibility logic or rate limits.
- Ping CTA, loading, and status handling remain untouched aside from hiding once dismissed, so eligibility checks keep firing for new sessions exactly as before.


