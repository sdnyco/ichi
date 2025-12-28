# Place Gallery Carousel V1.1 Fixes (2025-12-27 16:43)

## What changed

- Rebuilt `PlaceGallery` as a single Embla carousel lane that consumes a unified `galleryItems` list. The list is sorted by priority (self check-ins → other actives → anchored) with per-kind metadata/markers and no duplicate users.
- Broke the carousel viewport out of the page padding via `-mx-6`, then reintroduced internal `px` spacing on the viewport so cards can peek while their shadows remain intact.
- Updated the shadcn `CarouselContent`/`CarouselItem` primitives to use flex gaps instead of negative margins, enabling centered snapping without offsetting the first slide.
- Tuned slide basis widths and spacing so the first card renders centered, peeking behavior stays consistent across breakpoints, and cards retain their drop shadows.

## Why

- The previous three-lane setup made the carousel feel disjointed and prevented Embla from exposing a single active index. A unified list keeps UX expectations (priority ordering) while satisfying the single-track requirement.
- Full-bleed treatment ensures cards aren’t clipped by the page gutter, while the inner padding prevents their shadows from being cut off by the viewport’s overflow rules.
- Switching to centered snapping with balanced gaps fixes the “first card stuck left” issue and keeps future Embla observers simple since everything now lives on one track.


