# Place Gallery Step A – Self Card Always (2025-12-27 17:48)

## What changed

- `getPlaceGalleryBuckets` now returns a `viewerProfile` built via `getOrCreatePlaceProfile`, excludes the viewer ID from anchored candidates, and keeps aliases stable server-side.
- `PlacePage` and `PlaceGallery` consume the new viewer profile: the check-in drawer seeds its alias from the stored profile when available, and the gallery injects a dedicated self card that renders even without an active check-in.
- Added locale copy for the inactive self state so the fallback card shows a consistent “Not checked in” message.

## Why

- Guarantees the viewer always sees their own alias card in the carousel, which is required before the upcoming centering/index work.
- Prevents duplicate listings by filtering the viewer out of active + anchored buckets and keeps the edit flow consistent because the card entry shares the same alias as the profile editor.
- Localized messaging avoids hydration randomness and communicates the inactive state without introducing new timing logic.
