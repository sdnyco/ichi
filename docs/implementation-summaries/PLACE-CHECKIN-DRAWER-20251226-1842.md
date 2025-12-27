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
- Added an `sr-only` `DrawerTitle` so Radix keeps the accessibility contract even though the visible heading moved into each step shell.

## 2025-12-26 Updates (Night)

- Replaced the custom Radix drawer wrapper with shadcn’s Vaul-based primitive via `npx shadcn@latest add drawer`, then re-added our styling niceties (rounded top, blur overlay, tappable handle, DrawerBody helper).
- `src/components/place-check-in-drawer.tsx` now consumes the Vaul drawer seamlessly; no behavioral changes besides inheriting Vaul’s native drag/physics.
- `package.json` includes the `vaul` dependency so future drawers can keep using the shared primitive.
- The drawer height now animates smoothly using an `AnimatedStepContent` wrapper that measures each step’s content with `ResizeObserver`; snap points were removed so steps can grow/shrink naturally, while aliases keep the icon-style regenerate control and the new legend copy (`checkin.alias.legend`) in both locales.


