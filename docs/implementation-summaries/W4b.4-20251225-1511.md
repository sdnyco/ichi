# W4b.4 — Read-Only Other User Profile
Date: 2025-12-25  
Run: W4b.4-20251225-1511

## Goal
Enable viewing another attendee’s profile from the place gallery so we can exercise upcoming moderation paths (block/report/ban) without altering existing self-edit flows.

## Implemented
- **Gallery interaction:** `getActiveGalleryForPlace` now returns `userId`, and `/place/[slug]` renders a new client-side `PlaceGallery` component that wraps each card in a button. Clicking a card launches the profile overlay for that user.
- **Read-only profile overlay:** Added `OtherProfileSheet`, which fetches target data via the new `GET /api/profiles` endpoint and renders the same overlay layout in a view-only mode (alias, check-in status, mood, recognizability, hooks, age band, height). The overlay now uses a lightweight back-only top bar (no autosave) so read-only state is obvious, and hook pills render the localized label instead of raw IDs.
- **Public profile endpoint:** `GET /api/profiles?viewerUserId=&placeId=&targetUserId=` returns alias + active check-in + traits for the requested user, ensuring they’re still visible (active check-in).
- **Locale/time polish:** Added strings for read-only fallbacks (“Not shared”, “No hooks shared”) and updated time displays (overlay + gallery) to use the shared formatter (`2h 30m` etc.) instead of raw minutes.

## Known Follow-ups
- No block/report/ban wiring yet; this path is purely read-only. Future milestones will extend the API checks (e.g., respect blocks) and add moderation actions.

