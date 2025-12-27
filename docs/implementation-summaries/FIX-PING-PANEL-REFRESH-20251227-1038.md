# Fix Ping Panel Refresh (2025-12-27 10:38)

## What changed

- Introduced `PlacePageContent` (`use client`) to host shared state between the drawer and the ping panel without touching server data fetching. It renders the existing header, gallery, ping UI, and drawer exactly as before, but now tracks a simple `checkinVersion` counter.
- Passed `onCheckinSuccess` from the new client parent into `PlaceCheckInDrawer`; the drawer calls it right after a successful submission (after refreshing its own active-check-in state) and then still issues `router.refresh()` for server data parity.
- Threaded the `checkinVersion` prop into `PlacePingPanel`, causing its existing `refreshActiveCheckin()` effect to rerun whenever the counter increments, which in turn re-triggers the usual eligibility fetch and status rendering.

## Why router.refresh() alone was insufficient

- `router.refresh()` revalidated server components, but the already-mounted client `PlacePingPanel` kept its stale local state because its effect only depended on a stable callback. Without a new signal, it never re-fetched `/api/me/place-context`, so `/api/pings/eligibility` never ran.
- The explicit counter guarantees the panel re-checks context immediately after the drawer reports success, restoring the legacy flow’s behavior without altering APIs or eligibility logic.


