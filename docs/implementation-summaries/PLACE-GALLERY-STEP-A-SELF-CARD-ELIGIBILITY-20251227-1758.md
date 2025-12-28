# Place Gallery Step A – Self Card Eligibility (2025-12-27 17:58)

## What changed

- `getPlaceGalleryBuckets` now also returns `viewerHasEverCheckedIn` plus the viewer’s stored alias profile (when available) so the UI can decide whether the self card is eligible to render.
- The gallery assembly memo creates a dedicated self item whenever the viewer has ever checked in, preferring the latest active check-in metadata when present and falling back to the stored alias when inactive.
- When the self item renders it is injected at index 0 and replaces the legacy `gallery.you` entries to avoid duplicate cards; first-time viewers without historical check-ins continue to see no self card.

## Why

- Step A requires making the self card renderable, but only for viewers who have actually checked in before so we avoid showing a placeholder to first-timers.
- Passing the eligibility flag and alias directly from the server keeps the logic deterministic, avoids client-side heuristics, and allows inactive but returning viewers to still see their identity at the front of the carousel.

## Follow-ups

- Promotion/centering logic is still pending; when added it can rely on the new eligibility flag to decide whether to bias toward the self card.
- Copy for the inactive self state can be layered on later if we want to show status text instead of leaving the metadata area blank.

