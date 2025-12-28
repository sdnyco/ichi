# Place Gallery Step B – Self Card Opens Editor (2025-12-28 12:14)

## What changed

- `ExpandedProfileSheet` now accepts an optional `triggerRef`, allowing parent components to programmatically click the existing dialog trigger.
- `PlacePageContent` keeps a ref to the “Your profile” button, exposes a callback that clicks it, and passes that callback into `PlaceGallery` so the self card can reuse the same editor entry point.
- `PlaceGallery` distinguishes self items before opening `OtherProfileSheet`: when the viewer clicks their own card, it invokes the new callback instead of fetching `/api/profiles`, while other cards retain the previous behavior.

## Why

- The self card previously routed through the other-user profile sheet, which immediately tried to fetch `/api/profiles` for the viewer and returned 404. Reusing the established editor trigger ensures the self card mirrors the “Your profile” CTA without new APIs or layout changes.

## Follow-ups

- Once promotion logic lands, confirm the editor-opening callback still works when the self card moves or the carousel reorders items.

