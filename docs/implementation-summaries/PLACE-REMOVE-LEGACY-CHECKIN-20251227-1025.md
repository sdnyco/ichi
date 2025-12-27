# PLACE Remove Legacy Check-In (2025-12-27 10:25)

## What changed

- Removed the top-of-page legacy `CheckInFlow` card (file deleted) and its import from `src/app/place/[slug]/page.tsx`, leaving the new drawer-only check-in experience untouched.
- Added `src/components/place-ping-panel.tsx`, which pulls the existing ping eligibility + send logic verbatim out of the old card and renders it as a lightweight standalone panel.
- Inserted `<PlacePingPanel />` above the “Now at this place” list in `src/app/place/[slug]/page.tsx`, so pinging lives directly over the checked-in users section per spec.

## Ping details

- The panel still gates on the same conditions (`activeCheckin`, `eligibleCount`, `isPlaceEmpty`, `sendLimitAvailable`) and calls the exact `/api/pings/eligibility` + `/api/pings` endpoints; only the wrapper UI moved.
- Success, limit, and error states reuse the same `checkin.ping.*` copy and status styling, ensuring no behavioral or messaging regressions.
- When the CTA is not eligible, the panel hides unless a status needs to be shown, mirroring the prior conditional rendering.

## Misc

- The drawer CTA component `PlaceCheckInDrawer` remains unchanged and continues to own the bottom “Check In →” flow.
- No API, eligibility, or rate-limit logic was touched; this was a pure UI relocation/refactor.


