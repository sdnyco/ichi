# Place Gallery Step D – Smooth Autoscroll (2025-12-28 12:35)

## What changed

- `CarouselInitialScroll` now queues a delayed Embla `scrollTo` (2.2 s) instead of jumping immediately; it cancels the animation if the viewer interacts first, and respects `prefers-reduced-motion` by falling back to an instant jump.
- The carousel still renders at index 0 on load, but when a secondary slide exists—and no interactions occur—the viewer sees a smooth glide to the precomputed `initialCenterIndex`.

## Why

- The previous behavior snapped instantly to the promoted slide, which felt jarring and reduced discoverability of the leftmost self card. The “teach then glide” motion keeps the page deterministic while gently guiding attention after the load settles.

## Follow-ups

- When future promotion signals are added, confirm the delayed scroll still feels natural; we can tweak the delay or easing later if user testing suggests a different cadence.

