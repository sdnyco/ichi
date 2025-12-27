# Place Gallery Carousel + Anchors (2025-12-27 12:49)

## What changed

- Added the official shadcn Carousel primitive (`Carousel`, `CarouselContent`, `CarouselItem`, etc.) so the gallery can rely on Embla for centered snapping with peek gutters.
- Introduced `getPlaceGalleryBuckets` which combines active check-ins and anchored place profiles into three disjoint shelves (`you`, `now`, `anchored`) with the existing safety filters and duplicate rules baked in.
- `PlacePage`/`PlacePageContent` now consume the new bucketed data, keeping the active count label accurate by summing “You” + “Now”.
- Rebuilt `PlaceGallery` as three horizontal carousels (You / Now / Anchored) that reuse the existing card content, add the required markers (“This is you”, “Anchored”), and keep the OtherProfileSheet interaction intact.
- Extended the locale bundles with the new shelf labels, chips, and anchored meta copy so all text renders via `t(...)`.

## Why

- We need horizontally scrollable, centered carousels with peek to support future visibility-based side effects. Embla via shadcn gives us that without reinventing the wheel.
- Anchored profiles must surface independently of active check-ins while still respecting block/banned filters and avoiding duplicates. Server-side bucketing keeps the UX deterministic and fast.
- The chip markers make it obvious which card is “you” and which profiles are anchored, matching the new UX spec without redesigning the cards themselves.


