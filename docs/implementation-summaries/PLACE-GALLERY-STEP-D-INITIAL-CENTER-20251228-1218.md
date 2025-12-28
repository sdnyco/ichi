# Place Gallery Step D – Initial Center Index (2025-12-28 12:18)

## What changed

- Introduced viewer-only placeholder handling in `PlaceGallery`: when the self card renders and no other people are visible, a dashed empty-state card is inserted at index 1 so the carousel always shows two slides.
- Added client-side promotion state (90 s TTL) derived from the existing `checkinVersion` signal; when a promotion moment is active (just checked in or only one other visible user), the carousel scrolls to index 0, otherwise it targets the first non-self item (or the placeholder).
- Exported `useCarousel` and wired a new `CarouselInitialScroll` helper so Embla scrolls to the computed index once per init/reInit without touching global carousel geometry.

## Why

- The viewer experience now matches the Step D goals: the default focus highlights other people, but the self card can temporarily take center stage after key moments, all while preserving deterministic SSR ordering and existing layout tweaks.

## Follow-ups

- When profile completeness data is available server-side, feed it into the promotion rule to unlock the “incomplete profile” branch.
- Future carousel layout adjustments (bleed/padding) can build on this foundation without revisiting the initial-center plumbing.

