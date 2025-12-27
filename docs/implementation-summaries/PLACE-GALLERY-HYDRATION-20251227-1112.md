# Place Gallery Hydration Snapshot (2025-12-27 11:12)

## What changed

- `PlacePage` now captures the server render timestamp (`now.toISOString()`) and threads it through `PlacePageContent`, which in turn hands it to `PlaceGallery`.
- `PlaceGallery` accepts the new `renderedAt` prop, uses it to create a stable `referenceNow`, and feeds that into `formatRelativeTime` for every entry instead of calling `new Date()` during render.
- (Bonus) The drawer already received a deterministic alias earlier; this change removes the remaining time-based randomness from the page shell.

## Why

- The gallery was previously calling `new Date()` independently on the server and the client, so relative time strings (e.g., “Checked in 1 min ago”) could differ by ±1 minute depending on when hydration finished. That mismatch sometimes shifted Radix’s internal `useId` counters, surfacing as `aria-controls` hydration warnings.
- By snapshotting the render time on the server and reusing it during hydration, the gallery and everything that follows now produce identical markup, eliminating the lingering intermittent warnings.


