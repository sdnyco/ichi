# Fix Hydration in Expanded Profile Sheet (2025-12-27 11:26)

## What changed

- `PlacePage` already produced a `renderedAt` snapshot for the gallery; we now pass that ISO string through `PlacePageContent` into both `<PlaceGallery />` and `<ExpandedProfileSheet />`.
- `ExpandedProfileSheet` accepts the new prop and feeds it into `buildCheckInMeta`, which now derives `now` from the snapshot instead of calling `Date.now()` during render. All derived fields (`minutesAgo`, `agoFormatted`, etc.) use the same deterministic timestamp.

## Why

- The check-in status text was the last piece of UI ahead of the Radix trigger that still computed relative time on each render. When SSR and the hydrating client straddled a minute boundary, the text changed and threw off React’s internal hook ordering, surfacing as an `aria-controls` mismatch warning. Using the same `renderedAt` snapshot on both sides ensures the initial HTML matches, eliminating the warning while keeping the UI copy intact.


