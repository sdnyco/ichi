# PLACE Check-In Drawer Refactor (2025-12-26 18:42)

## Key Points

- **Component location**: The new drawer experience lives in `src/components/place-check-in-drawer.tsx`. It owns the CTA, Radix-based drawer, step shells, and transient state for all four steps.
- **Submission parity**: The drawer calls the existing `/api/check-ins` POST with the exact payload (`userId`, `placeId`, `durationMinutes`, `mood`, `alias`, optional `recognizabilityHint`). Responses mirror the legacy box: 409 triggers active-checkin refresh, 403 with `account_disabled` flags the account, everything else surfaces `checkin.status.error`, and success refreshes the router so the page reflects the active state.
- **Hard reset enforcement**: A dedicated `resetFlow` callback clears the step index, hint text, alias, and errors. It runs whenever the drawer closes (`onOpenChange`, overlay/escape, or close button) and after successful submissions, guaranteeing each re-open starts from step 1 with fresh defaults.

## Integration Notes

- `src/components/ui/drawer.tsx` adds a shadcn-style bottom drawer abstraction (Radix Dialog + blur overlay) consumed by the new component.
- `src/app/place/[slug]/page.tsx` now renders `<PlaceCheckInDrawer />` alongside the existing `CheckInFlow`, adds extra bottom padding for the fixed CTA, and keeps the legacy flow untouched per constraints.

## 2025-12-26 Updates (Evening)

- Added keyframed overlay/content animations plus a tappable handle in `src/components/ui/drawer.tsx`, so open/close transitions feel native even before we wire up drag gestures.
- Simplified the drawer shell in `src/components/place-check-in-drawer.tsx` by removing the duplicate header/progress row; the step layout now owns the only title + legend, and the close button was dropped in favor of the interactive handle + overlay dismissal.
- Documented the animation utilities in `src/app/globals.css` so future drawers can reuse the same easing curves.


